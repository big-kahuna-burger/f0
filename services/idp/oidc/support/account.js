import { customAlphabet } from 'nanoid'
import prisma from '../../db/client.js'

import { compareHash, generateHash } from './password-tsc.js'
const customid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 26)

class Account {
  constructor(id, profile = {}) {
    if (!id) {
      throw new Error('id is required')
    }
    this.accountId = id
    this.profile = omitNulls(profile)
    this.profile.sub = id
  }

  /**
   * @param use - can either be "id_token" or "userinfo", depending on
   *   where the specific claims are intended to be put in.
   * @param scope - the intended scope, while oidc-provider will mask
   *   claims depending on the scope automatically you might want to skip
   *   loading some claims from external resources etc. based on this detail
   *   or not return them in id tokens but only userinfo and so on.
   */
  async claims(use, scope) {
    let claimsValues = { sub: this.accountId }
    if (use === 'userinfo') {
      if (scope.includes('email')) {
        claimsValues = {
          ...claimsValues,
          email: this.profile.email,
          email_verified: this.profile.emailVerified
        }
      }
      if (scope.includes('profile')) {
        claimsValues = {
          ...claimsValues,
          ...this.profile
        }
      }

      if (scope.includes('address')) {
        const address = {}
        try {
          const { Address } = await prisma.profile.findFirst({
            where: { id: this.profile.id },
            include: {
              Address: true
            }
          })
          // formatted: Address.formatted,
          if (Address.streetAddress) {
            address.street_address = Address.streetAddress
          }
          if (Address.locality) {
            address.locality = Address.locality
          }
          if (Address.region) {
            address.region = Address.region
          }
          if (Address.postalCode) {
            address.postal_code = Address.postalCode
          }
          if (Address.country) {
            address.country = Address.country
          }
          claimsValues.address = address
        } catch {}
      }

      if (scope.includes('phone')) {
        if (this.profile.phoneNumber) {
          claimsValues.phone_number = this.profile.phoneNumber
          claimsValues.phone_number_verified = this.profile.phoneNumberVerified
        }
      }
    }
    return claimsValues
  }

  static async findByFederated(provider, claims) {
    const id = `${provider}.${claims.sub}`
    const found = await prisma.account.findFirst({
      where: { id },
      include: { Profile: true }
    })

    if (!found) {
      if (provider === 'google') {
        return await Account.createGoogleAccount('google', claims)
      }
    }
    return fromDbData(found)
  }

  static async createGoogleAccount(provider, claims) {
    const googleConnection = await prisma.connection.findFirst({
      where: { name: 'google-oauth2' }
    })
    const connectionId = googleConnection.id
    const createdAccount = await Account.createFromClaims(
      {
        ...claims,
        connectionId,
        sub: `${provider}.${claims.sub}`
      },
      provider
    )
    return createdAccount
  }
  static async findByEmail(email) {
    const found = await prisma.account.findFirst({
      where: { email },
      include: {
        Profile: true
      }
    })

    if (!found) {
      throw new Error('no account found')
    }

    return fromDbData(found)
  }

  static async findAccount(ctx, id, token) {
    // token is a reference to the token used for which a given account is being loaded,
    //   it is undefined in scenarios where account claims are returned from authorization endpoint
    // ctx is the koa request context
    const found = await prisma.account.findFirst({
      where: { id },
      include: {
        Profile: true
      }
    })

    if (!found) {
      throw new Error('no account found')
    }
    return fromDbData(found)
  }

  static async authenticate(email, password, connectionIds) {
    const found = await prisma.profile.findFirst({
      where: {
        email,
        Account: { Identity: { some: { connectionId: { in: connectionIds } } } }
      },
      include: {
        Address: true,
        Account: {
          include: {
            Profile: true,
            Identity: { include: { Connection: true, PasswordHash: true } }
          }
        }
      }
    })
    if (!found) {
      throw new AccountNotFound('profile not found')
    }
    // console.log(inspect(found))
    const loadedAccount = found.Account
    if (!loadedAccount) {
      throw new AccountNotFound('Account not found')
    }

    const loadedIdentity = loadedAccount?.Identity[0]
    if (!loadedIdentity) {
      throw new AccountNotFound('Identity not found')
    }

    const loadedPasswordHash = loadedIdentity?.PasswordHash[0]
    if (!loadedPasswordHash) {
      throw new AccountNotFound('Hash not found')
    }

    const isPasswordValid = await compareHash(password, loadedPasswordHash.hash)

    if (!isPasswordValid) {
      throw new AccountNotFound('Invalid password')
    }

    return fromDbData(found.Account)
  }

  static async register(email, password, connectionId) {
    const found = await prisma.profile.findFirst({
      where: { email }
    })
    if (found) {
      throw new AccountExists()
    }
    const accountCreated = await prisma.account.create({
      data: {
        id: `f0.${customid()}`,
        Identity: {
          create: [
            {
              provider: 'f0',
              connectionId,
              PasswordHash: { create: [{ hash: await generateHash(password) }] }
            }
          ]
        }
      }
    })

    const createdProfile = await prisma.profile.create({
      data: { email, Account: { connect: { id: accountCreated.id } } }
    })
    accountCreated.Profile = [createdProfile]
    return fromDbData(accountCreated)
  }

  static async createFromClaims(claims, provider = 'f0') {
    const {
      sub,
      address,
      birthdate,
      email,
      email_verified,
      family_name,
      gender,
      given_name,
      locale,
      middle_name,
      name,
      nickname,
      phone_number,
      phone_number_verified,
      picture,
      preferred_username,
      profile,
      website,
      zoneinfo,
      password,
      connectionId
    } = claims

    const ProfileData = {
      birthdate,
      email,
      emailVerified: email_verified,
      phoneNumberVerified: phone_number_verified,
      phoneNumber: phone_number,
      familyName: family_name,
      middleName: middle_name,
      givenName: given_name,
      preferredUsername: preferred_username,
      name,
      nickname,
      picture,
      gender,
      locale,
      profile,
      website,
      zoneinfo
    }
    if (address) {
      const {
        country,
        formatted,
        locality,
        postal_code,
        region,
        street_address
      } = address

      ProfileData.Address = {
        create: {
          country,
          formatted,
          locality,
          postalCode: postal_code,
          region,
          streetAddress: street_address
        }
      }
    }
    const identityPayload = {
      provider,
      connectionId
    }
    if (password) {
      identityPayload.PasswordHash = {
        create: [{ hash: await generateHash(password) }]
      }
    }
    const accountCreated = await prisma.account.create({
      data: {
        id: sub || `${provider}.${customid()}`,
        Identity: {
          create: [identityPayload]
        }
      }
    })

    ProfileData.Account = {
      connect: { id: accountCreated.id }
    }
    const createdProfile = await prisma.profile.create({
      data: ProfileData
    })
    accountCreated.Profile = [createdProfile]
    return fromDbData(accountCreated)
  }
}

function fromDbData(data) {
  return new Account(data.id, data.Profile[0])
}

class AccountNotFound extends Error {
  constructor(message, ...args) {
    super(...args)
    this.name = 'InvalidCredentials'
    this.message = message || 'Invalid email or password'
    this.status = 401
  }
}

class AccountExists extends Error {
  constructor(message, ...args) {
    super(...args)
    this.name = 'AccountExists'
    this.message = message || 'Account already exists'
    this.status = 409
  }
}

export const errors = {
  AccountNotFound,
  AccountExists
}

export default Account

function omitNulls(obj) {
  const newObj = {}
  for (const key in obj) {
    if (obj[key] !== null) {
      newObj[key] = obj[key]
    }
  }
  return newObj
}
