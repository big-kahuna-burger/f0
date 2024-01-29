import { customAlphabet } from 'nanoid'
import prisma from '../../db/client.js'

import { compareHash, generateHash } from './password-tsc.js'
const customid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 26)

class Account {
  constructor(id, profile) {
    if (!id) {
      throw new Error('id is required')
    }
    this.accountId = id
    this.profile = profile
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
        let address
        try {
          const { Address } = await prisma.profile.findFirst({
            where: { id: this.profile.id },
            include: {
              Address: true
            }
          })
          address = {
            // formatted: Address.formatted,
            street_address: Address.streetAddress,
            locality: Address.locality,
            region: Address.region,
            postal_code: Address.postalCode,
            country: Address.country
          }
        } catch (error) {}
        claimsValues = {
          ...claimsValues,
          address
        }
      }

      if (scope.includes('phone')) {
        claimsValues = {
          ...claimsValues,
          phone_number: this.profile.phoneNumber,
          phone_number_verified: this.profile.phoneNumberVerified
        }
      }
    }
    return claimsValues
  }

  static async findByFederated(provider, claims) {
    const id = `${provider}.${claims.sub}`
    const found = await prisma.account.findFirst({ where: { id } })

    if (!found) {
      throw new Error('no account found')
    }
    return fromDbData(found)
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

  static async authenticate(email, password) {
    const found = await prisma.profile.findFirst({
      where: { email },
      include: {
        Address: true,
        Account: {
          include: {
            Profile: true,
            Identity: {
              include: {
                Connection: true,
                PasswordHash: true
              }
            }
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

  static async createFromClaims(claims, provider = 'f0') {
    const {
      address,
      birthdate,
      email,
      family_name,
      gender,
      given_name,
      locale,
      middle_name,
      name,
      nickname,
      phone_number,
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
      emailVerified: false,
      phoneNumberVerified: false,
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
    const accountCreated = await prisma.account.create({
      data: {
        id: `${provider}.${customid()}`,
        Identity: {
          create: [
            {
              provider: 'f0',
              connectionId,
              PasswordHash: {
                create: [{ hash: await generateHash(password) }]
              }
            }
          ]
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

export const errors = {
  AccountNotFound
}

export default Account
