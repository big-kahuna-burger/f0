import { default as enquirer } from 'enquirer'
import Account from '../oidc/support/account.js'

const response = await enquirer.prompt([
  {
    type: 'input',
    name: 'email',
    message: 'What is your account email/login?'
  },
  {
    type: 'input',
    name: 'password',
    message: 'What is your desired password'
  }
])

const acc = await Account.createFromClaims({
  ...response,
  address: {
    country: '000',
    formatted: '000',
    locality: '000',
    postal_code: '000',
    region: '000',
    street_address: '000'
  },
  birthdate: new Date(),
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

console.log(acc)
