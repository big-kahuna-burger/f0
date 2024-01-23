import path from 'path'
import { fileURLToPath } from 'url'
import { Prisma } from '@prisma/client'
import { readFile } from 'fs/promises'
import { nanoid } from 'nanoid'
import Account from '../oidc/support/account.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testKeys = JSON.parse(
  (await readFile(path.join(__dirname, './jwks.json'))).toString()
)

let configsDB = {
  id: 'id0',
  jwks: testKeys,
  cookieKeys: ['abc', 'def']
}

const interactionsDB = {}
const grantsDB = {}
const sessionDB = {}
const authCodes = {}
const accountsDB = {}
const accessTokensDB = {}
const profilesDB = {}
const identDb = {}
const passwordHashDb = {}
const resourceServersDB = {}

const connectionsDB = {
  default: {
    id: 'default',
    name: 'default',
    type: 'DB',
    readonly: true
  }
}

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
    id_token_signed_response_alg: 'RS256',
    logo_uri: 'https://somerp.com/logo.png'
  },
  readonly: true
}

const clientConnectionsDB = {
  default: {
    connectionId: 'default',
    clientId: 'goodclient',
    connection: connectionsDB.default
  }
}

const oidcClientDb = {
  goodclient: clientMock
}

const debug =
  (fn) =>
    (...args) => {
      console.log('DEBUG TEST MOCK', fn.name, ...args)
      return fn(...args)
    }

export const setupPrisma = async (prisma) => {
  prisma.config.findMany.mockImplementation(configFindMany)
  prisma.config.findFirst.mockImplementation(configFindFirst)
  prisma.config.update.mockImplementation(configUpdate)
  prisma.config.create.mockImplementation(configCreate)
  prisma.oidcModel.findUnique.mockImplementation(oidcModelFindUnique)
  prisma.oidcModel.delete.mockImplementation(oidcModelDelete)
  prisma.oidcModel.upsert.mockImplementation(oidcModelUpsert)
  prisma.oidcModel.findFirst.mockImplementation(oidcModelFindFirst)
  prisma.oidcModel.deleteMany.mockImplementation(oidcModelDeleteMany)
  prisma.oidcModel.update.mockImplementation(oidcModelUpdate)
  prisma.oidcClient.findUnique.mockImplementation(oidcClientFindUnique)
  prisma.account.findUnique.mockImplementation(accountFindUnique)
  prisma.account.findFirst.mockImplementation(accountFindFirst)
  prisma.identity.create.mockImplementation(identityCreate)
  prisma.account.create.mockImplementation(accountCreate)
  prisma.profile.findFirst.mockImplementation(profileFindFirst)
  prisma.profile.create.mockImplementation(profileCreate)
  prisma.resourceServer.findMany.mockImplementation(resourceServersFindMany)
  prisma.resourceServer.count.mockImplementation(
    () => Object.values(resourceServersDB).length
  )
  prisma.resourceServer.create.mockImplementation(resourceServerCreate)
  prisma.resourceServer.findFirst.mockImplementation(resourceServerById)
  prisma.resourceServer.update.mockImplementation(prismaResourceServerUpdate)
  prisma.oidcClient.count.mockImplementation(countClients)
  prisma.oidcClient.findMany.mockImplementation(prismaOidcClientFindMany)
  prisma.oidcClient.create.mockImplementation(prismaOidcClientCreate)
  prisma.oidcClient.findFirst.mockImplementation(oidcClientFindFirst)
  prisma.oidcClient.update.mockImplementation(updateOidcClient)
  prisma.oidcModel.create.mockImplementation(oidcModelCreate)
  prisma.oidcModel.count.mockImplementation(oidcModelCount)
  prisma.clientConnection.findMany.mockImplementation(findManyClientConnections)
  prisma.$transaction.mockImplementation((cb) => cb(prisma))
  await newAccount()
  return prisma
}

export { clientMock, getCurrentKeys }

function findManyClientConnections({
  where: { clientId },
  include: { connection }
}) {
  return Object.values(clientConnectionsDB)
}

function oidcModelCreate({ data }) {
  if (data.type === 13) {
    grantsDB[data.id] = data
    return grantsDB[data.id]
  }
  throw new Error('mock oidcModelCreate')
}

function oidcModelCount() {
  return (
    Object.values(sessionDB).length +
    Object.values(grantsDB).length +
    Object.values(authCodes).length +
    Object.values(accessTokensDB).length +
    Object.values(interactionsDB).length
  )
}

function updateOidcClient({ where: { id }, data }) {
  oidcClientDb[id] = {
    ...oidcClientDb[id],
    ...data
  }
  return oidcClientDb[id]
}

function countClients() {
  return Object.values(oidcClientDb).length
}
function prismaOidcClientFindMany() {
  return Object.values(oidcClientDb)
}

function oidcClientFindFirst({ where: { id } }) {
  return oidcClientDb[id]
}
function prismaOidcClientCreate({ data }) {
  oidcClientDb[data.id] = data
  return data
}

function prismaResourceServerUpdate({ where: { id }, data }) {
  resourceServersDB[id] = {
    ...resourceServersDB[id],
    ...data
  }
  return resourceServersDB[id]
}

function resourceServerById({ where: { id, identifier } }) {
  if (identifier) {
    return Object.values(resourceServersDB).find(
      (rs) => rs.identifier === identifier
    )
  }
  return resourceServersDB[id]
}

function resourceServerCreate({ data }) {
  if (
    Object.values(resourceServersDB).find(
      (rs) => rs.identifier === data.identifier
    )
  ) {
    throw new Prisma.PrismaClientKnownRequestError('duplicate identifier', {
      code: 'P2002'
    })
  }
  data.id = nanoid()
  data.scopes = data.scopes || []
  resourceServersDB[data.id] = data
  return data
}

function resourceServersFindMany() {
  return Object.values(resourceServersDB)
}

function getCurrentKeys() {
  return configsDB.jwks
}

async function identityCreate({ PasswordHash, data }) {
  identDb[data.sub] = data
  passwordHashDb[data.sub] = PasswordHash.create
}

async function profileFindFirst({ where: { email } }) {
  const profile = profilesDB[email]
  return { ...profile }
}

async function profileCreate({ data: { Account, Address, ...data } }) {
  profilesDB[data.email] = data
  accountsDB[Account.connect.id].Profile = [profilesDB[data.email]] // cross connect account and profile
  profilesDB[data.email].Account = accountsDB[Account.connect.id]
  return profilesDB[data.email]
}

function configUpdate({ data }) {
  configsDB = { ...configsDB, ...data, id: 0 }
  return configsDB
}

function configFindFirst() {
  return configsDB
}

function configFindMany() {
  return [configsDB]
}

function configCreate({ data }) {
  configsDB = { ...data, id: 0 }
  return configsDB
}

function oidcClientFindUnique({ where: { id } }) {
  return clientMock
}

function oidcModelFindUnique({ where: { id_type: { id, type } } }) {
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

function oidcModelUpsert({ create }) {
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

function oidcModelFindFirst({ where: { id, uid } }) {
  const filtered = Object.values(sessionDB).filter((s) => s.uid === uid)
  if (!filtered[0]) {
    const gf = grantsDB[id]
    if (gf) {
      return gf
    }
  }
  return filtered[0]
}

function oidcModelDeleteMany() {
  throw new Error('deleteMany')
}

function oidcModelUpdate({ data, where }) {
  const { id, type } = where.id_type ? where.id_type : where
  if (type === 3) {
    // updates authCodes
    authCodes[id] = {
      ...authCodes[id],
      ...data
    }
    // authCode is now consumed
    return
  }
  if (!type && id.startsWith('RI-')) {
    grantsDB[id] = { ...grantsDB[id], ...data }
    return grantsDB[id]
  }
  throw new Error(`update ${JSON.stringify({ id, type })}`)
}

function accountFindUnique({ where: { sub, id } }) {
  const found = sub
    ? accountsDB[id]
    : Object.values(accountsDB).filter((acct) => acct.id === id)[0]
  return found
}

function accountFindFirst({ where: { id } }) {
  return accountsDB[id]
}

function oidcModelDelete({ where: { id_type, type, id } }) {
  let _id
  let _type
  if (id_type) {
    _id = id_type.id
    _type = id_type.type
  } else {
    _id = id
    _type = type
  }
  if (_type === 10) {
    delete interactionsDB[_id]
    return
  }
  if (_type === 1) {
    delete sessionDB[_id]
    return
  }
  if (_type === 13) {
    delete grantsDB[_id]
    return
  }
  throw new Error('mock delete')
}

function accountCreate({ data }) {
  accountsDB[data.id] = data
  const identData = { ...data.Identity.create[0], id: nanoid() }
  identDb[identData.sub] = identData
  passwordHashDb[identData.sub] = {
    identityId: identData.id,
    ...data.Identity.create[0].PasswordHash.create[0]
  }
  accountsDB[data.id].Identity = [identData]
  accountsDB[data.id].Identity[0].PasswordHash = [passwordHashDb[identData.sub]]
  const justCreated = accountsDB[data.id]
  return { ...justCreated }
}

const newAccount = (email) =>
  Account.createFromClaims({
    address: {
      country: '000',
      formatted: '000',
      locality: '000',
      postal_code: '000',
      region: '000',
      street_address: '000'
    },
    birthdate: new Date(1988, 10, 16),
    email: email || 'johndaasdoe23@examplea1.com',
    email_verified: false,
    family_name: 'Doe',
    gender: 'male',
    given_name: 'John',
    locale: 'en-US',
    middle_name: 'Middle',
    name: 'John Doe',
    nickname: 'Johny',
    phone_number: '+49 000 000000',
    phone_number_verified: false,
    picture: 'http://lorempixel.com/400/200/',
    preferred_username: 'johnny',
    profile: 'https://johnswebsite.com',
    website: 'http://example.com',
    zoneinfo: 'Europe/Berlin',
    password: 'icme'
  })
