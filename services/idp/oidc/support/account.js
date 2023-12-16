import { customAlphabet, nanoid } from 'nanoid'
import client from '../../db/client.js'

const customid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 26)
// TODO implement persistence, by adding a DB client and fix a claims fn
// TODO implement find by federated
// TODO implement member check password fn

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
    return this.profile
  }

  static async findByFederated(provider, claims) {
    const id = `${provider}.${claims.sub}`
    const found = await client.account.findFirst({ where: { id } })

    if (!found) {
      throw new Error('no account found')
    }
    return fromDbData(found)
  }

  static async findByEmail(email) {
    const found = await client.account.findFirst({ where: { email } })

    if (!found) {
      throw new Error('no account found')
    }

    return fromDbData(found)
  }

  static async findAccount(ctx, id, token) {
    // token is a reference to the token used for which a given account is being loaded,
    //   it is undefined in scenarios where account claims are returned from authorization endpoint
    // ctx is the koa request context
    const found = await client.account.findFirst({ where: { id } })

    if (!found) {
      throw new Error('no account found')
    }
    return fromDbData(found)
  }

  static async authenticate(email, password) {
    // TODO check password and stuff
    const account = await Account.findByEmail(email)

    if (!account) {
      throw new Error('no account found')
    }
  }

  static async createFromClaims(claims, provider = 'f0') {
    return client.$transaction(async (t) => {
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
        zoneinfo
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

        ProfileData.address = {
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
      const accountCreated = await t.account.create({
        data: {
          id: `${provider}.${customid()}`
        }
      })
      ProfileData.Account = {
        connect: { id: accountCreated.id }
      }
      await t.profile.create({
        data: ProfileData
      })

      await t.identity.create({
        data: {
          provider: 'f0',
          sub: accountCreated.id
        }
      })
      return fromDbData(accountCreated)
    })
  }
}

function fromDbData(data) {
  return new Account(data.id, data)
}

export default Account

Account.createFromClaims({
  // sub: 'test1234', // it is essential to always return a sub claim

  address: {
    country: '000',
    formatted: '000',
    locality: '000',
    postal_code: '000',
    region: '000',
    street_address: '000'
  },
  birthdate: new Date(1988, 10, 16),
  email: 'johndaasdoe@examplea1.com',
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
  zoneinfo: 'Europe/Berlin'
})
