import prisma from '../db/__mocks__/client.js'

const interactionsDB = {}
const grantsDB = {}
const sessionDB = {}
const authCodes = {}
const accountsDB = {}
const accessTokensDB = {}

const clientMock = {
  id: 'goodclient',
  payload: {
    client_id: 'goodclient',
    grant_types: ['authorization_code'],
    subject_type: 'public',
    redirect_uris: ['https://somerp.com/cb'],
    response_types: ['code'],
    post_logout_redirect_uris: [],
    token_endpoint_auth_method: 'none',
    id_token_signed_response_alg: 'RS256'
  }
}

export default {
  clientMock
}

prisma.oidcModel.findUnique.mockImplementation(oidcModelFindUnique)
prisma.oidcModel.delete.mockImplementation(oidcModelDelete)
prisma.oidcModel.upsert.mockImplementation(prismaOidcUpsert)
prisma.oidcModel.findFirst.mockImplementation(oidcFindFirst)
prisma.oidcModel.deleteMany.mockImplementation(oidcModelDeleteMany)
prisma.oidcModel.update.mockImplementation(oidcModelUpdate)
prisma.account.findUnique.mockImplementation(accountFindUnique)
prisma.account.create.mockImplementation(accountCreate)

function oidcModelFindUnique({ where: { id_type: { id, type } } }) {
  if (type === 7) {
    return clientMock
  }
  if (type === 10) {
    return interactionsDB[id]
  }
  if (type === 1) {
    return sessionDB[id]
  }
  if (type === 13) {
    return grantsDB[id]
  }
  if (type === 3) {
    return authCodes[id]
  }
  throw new Error(`mock findUnique ${JSON.stringify({ id, type })}`)
}

function prismaOidcUpsert({ create }) {
  const { id, type } = create
  if (type === 10) {
    interactionsDB[id] = create
    return
  }

  if (type === 1) {
    sessionDB[id] = create
    return
  }

  if (type === 13) {
    grantsDB[id] = create
    return
  }

  if (type === 3) {
    authCodes[id] = create
    return
  }

  if (type === 2) {
    accessTokensDB[id] = create
    return
  }
  throw new Error('make oidcModel.upsert mock for ', type)
}

function oidcFindFirst({ where: { uid } }) {
  const filtered = Object.values(sessionDB).filter((s) => s.uid === uid)
  return filtered[0]
}

function oidcModelDeleteMany() {
  throw new Error('deleteMany')
}

function oidcModelUpdate({ data, where: { id_type: { id, type } } }) {
  if (type === 3) {
    // updates authCodes
    authCodes[id] = {
      ...authCodes[id],
      ...data
    }
    // authCode is now consumed
    return
  }
  throw new Error(`update ${JSON.stringify({ id, type })}`)
}

function accountFindUnique({ where: { sub, id } }) {
  const found = sub
    ? accountsDB[id]
    : Object.values(accountsDB).filter((acct) => acct.id === id)[0]
  return found
}

function oidcModelDelete({ where: { id_type: { type, id } } }) {
  if (type === 10) {
    delete interactionsDB[id]
    return
  }
  if (type === 1) {
    delete sessionDB[id]
    return
  }
  throw new Error('mock delete')
}

function accountCreate({ data }) {
  accountsDB[data.sub] = data
  return data
}
