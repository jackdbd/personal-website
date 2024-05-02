import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defDebug from 'debug'
import openpgp from 'openpgp'

const __filename = fileURLToPath(import.meta.url)
const debug = defDebug(`script:${path.basename(__filename, '.ts')}`)
const REPO_ROOT = path.join(__filename, '..', '..')
const SECRETS_ROOT = path.join(REPO_ROOT, 'secrets')
const KEY_ID = '56DE4CF7'
const FINGERPRINT = 'C6F29CA94E6E091E519E3E0ED501B88B56DE4CF7'

const public_key_filepath = path.join(
  REPO_ROOT,
  'src',
  'includes',
  'assets',
  'pgp-key.txt'
)

const reportSecurityIssue = async (text) => {
  const armoredBlock = fs.readFileSync(public_key_filepath, 'utf8').trim()
  const keys = await openpgp.readKeys({ armoredKeys: armoredBlock })

  const valid_keys = keys.filter(
    (k) => k.getFingerprint() === FINGERPRINT.toLowerCase()
  )

  if (valid_keys.length === 0) {
    throw new Error(
      `no OpenPGP private key matches the fingerprint ${FINGERPRINT}`
    )
  }

  const publicKey = valid_keys[0]

  const message = await openpgp.createMessage({ text })

  const encrypted = await openpgp.encrypt({
    message,
    encryptionKeys: [publicKey]
    // signingKeys: [privateKey] // optional
  })

  return encrypted
}

const decrypt = async (encrypted) => {
  let message
  try {
    message = await openpgp.readMessage({ armoredMessage: encrypted })
  } catch (err) {
    return { error: err }
  }

  const filepath_private_key = path.join(SECRETS_ROOT, `secret-${KEY_ID}.asc`)
  debug(`read ASCII-armored OpenPGP private key from ${filepath_private_key}`)
  const armoredBlock = fs.readFileSync(filepath_private_key, 'utf8').trim()

  const filepath_passphrase = path.join(SECRETS_ROOT, 'OpenPGP-passphrase.txt')
  debug(`read passphrase from ${filepath_passphrase}`)
  const passphrase = fs.readFileSync(filepath_passphrase, 'utf8').trim()

  let pkeys = []
  try {
    // https://docs.openpgpjs.org/global.html#readPrivateKeys
    pkeys = await openpgp.readPrivateKeys({ armoredKeys: armoredBlock })
  } catch (err) {
    return { error: err }
  }

  const valid_pkeys = pkeys.filter(
    (k) => k.getFingerprint() === FINGERPRINT.toLowerCase()
  )

  if (valid_pkeys.length === 0) {
    return {
      error: new Error(
        `no OpenPGP private key matches the fingerprint ${FINGERPRINT}`
      )
    }
  }

  const decryptionKeys = []
  try {
    debug(`decrypt OpenPGP key using provided passphrase`)
    const pkey = await openpgp.decryptKey({
      privateKey: valid_pkeys[0],
      passphrase
    })
    debug(`add OpenPGP key ${pkey.getFingerprint()} to decryption keys`)
    decryptionKeys.push(pkey)
  } catch (err) {
    return { error: err }
  }

  try {
    const fingerprints = decryptionKeys.map((k) => k.getFingerprint())
    debug(`decrypt using these keys: ${fingerprints.join(', ')}`)
    const { data: decrypted, signatures } = await openpgp.decrypt({
      message,
      decryptionKeys
      // verificationKeys: publicKey, // optional
    })
    debug(`the encrypted message contained ${signatures.length} signatures`)
    return { value: decrypted }
  } catch (err) {
    return { error: err }
  }
}

const main = async () => {
  const text =
    'I found a security issue related one of your JavaScript dependencies'

  const encrypted = await reportSecurityIssue(text)
  debug(
    `message encrypted by some security researcher (using my OpenPGP public key ${FINGERPRINT})`
  )
  debug(encrypted)
  // console.log(encrypted)

  const { error, value: decrypted } = await decrypt(encrypted)
  if (error) {
    console.error(error)
    return
  }

  debug(`message decrypted using OpenPGP key ${FINGERPRINT}`)
  debug(`Here is what the security researcher reported:`)
  debug(decrypted)
  // console.log(decrypted)
}

main()
