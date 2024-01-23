import bcrypt from 'bcrypt'

const saltRounds = process.env.SALT_ROUNDS || 12

async function generateHash(plainText) {
  const hash = await bcrypt.hash(plainText, saltRounds)
  return hash
}

async function compareHash(plainText, hash) {
  const match = await bcrypt.compare(plainText, hash)
  return match
}

export { generateHash, compareHash }
