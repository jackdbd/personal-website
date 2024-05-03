import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defDebug from 'debug'
import openpgp from 'openpgp'
import { z } from 'zod'

const __filename = fileURLToPath(import.meta.url)
const debug = defDebug(`script:${path.basename(__filename, '.ts')}`)

// https://securitytxt.org/
// https://ijmacd.github.io/rfc3339-iso8601/
// https://www.rfc-editor.org/rfc/rfc9116#name-example-of-a-signed-securit

// https://www.rfc-editor.org/rfc/rfc9116#name-digital-signature
// https://www.rfc-editor.org/rfc/rfc9116#name-example-of-a-signed-securit

// It is RECOMMENDED that the `Expires` value is less than a year into the future
// https://www.rfc-editor.org/rfc/rfc9116#name-expires
const MAX_DAYS = 365
const maxExpirationDate = new Date()
maxExpirationDate.setDate(maxExpirationDate.getDate() + MAX_DAYS)

export const schema = z.object({
  acknowledgments: z
    .string()
    .url()
    .optional()
    .describe(
      'A link to a web page where you say thank you to security researchers who have helped you.'
    ),

  armoredBlock: z.string(), // it can contain 1+ OpenPGP private keys in ASCII-armored format

  // The "Contact" field indicates a method that researchers should use for
  // reporting security vulnerabilities such as an email address, a phone number,
  // and/or a web page with contact information.
  contacts: z
    .array(
      z.union([
        z.string().regex(new RegExp('mailto:.*')),
        z.string().regex(new RegExp('tel:.*')),
        z.string().regex(new RegExp('https:\\/\\/.*'))
      ])
    )
    .min(1),

  domain: z.string().min(1),

  encryption: z
    .string()
    .url()
    .optional()
    .describe(
      'A link to a key which security researchers should use to securely talk to you.'
    ),

  // https://github.com/colinhacks/zod#dates
  expires: z.coerce
    .date()
    .max(maxExpirationDate, {
      message:
        'The expiration date for the content of the security.txt should be less than a year into the future to avoid staleness.'
    })
    .default(maxExpirationDate),

  fingerprint: z.string(),

  header: z
    .string()
    .optional()
    .describe(
      'Text that you want to include at the beginning of the security.txt file.'
    ),

  hiring: z
    .string()
    .url()
    .optional()
    .describe(
      'A link to any security-related job openings in your organisation.'
    ),

  passphrase: z.string().optional(),

  policy: z
    .string()
    .url()
    .optional()
    .describe(
      'A link to a policy detailing what security researchers should do when searching for or reporting security issues.'
    ),

  preferredLanguages: z.array(z.string()).default(['en'])
})

const content = async ({
  acknowledgments,
  contacts,
  domain,
  encryption,
  expires,
  header,
  hiring,
  passphrase,
  policy,
  preferredLanguages,
  privateKey
}) => {
  const base = `https://${domain}`

  let s = ''

  if (header) {
    s += header
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
    s = `${s}\n`
  }

  s = `${s}\n`
  s += `Canonical: ${base}/.well-known/security.txt`
  s = `${s}\n`

  s = `${s}\n`
  s += contacts.map((c) => `Contact: ${c}`).join('\n')
  s = `${s}\n`

  if (encryption) {
    s = `${s}\n`
    s += `Encryption: ${encryption}`
    s = `${s}\n`
  }

  s = `${s}\n`
  s += `Expires: ${expires}`
  s = `${s}\n`

  if (acknowledgments) {
    s = `${s}\n`
    s += `Acknowledgments: ${acknowledgments}`
    s = `${s}\n`
  }

  if (hiring) {
    s = `${s}\n`
    s += `Hiring: ${hiring}`
    s = `${s}\n`
  }

  if (policy) {
    s = `${s}\n`
    s += `Policy: ${policy}`
    s = `${s}\n`
  }

  if (preferredLanguages) {
    s = `${s}\n`
    s += `Preferred-Languages: ${preferredLanguages.join(', ')}`
    s = `${s}\n`
  }

  const signingKeys = []
  try {
    debug(`decrypt OpenPGP key using provided passphrase`)
    const pkey = await openpgp.decryptKey({ privateKey, passphrase })
    debug(`add OpenPGP key ${pkey.getFingerprint()} to signing keys`)
    signingKeys.push(pkey)
  } catch (err) {
    return { error: err }
  }

  let message
  try {
    debug(`create cleartext message`)
    message = await openpgp.createCleartextMessage({ text: s })
  } catch (err) {
    return { error: err }
  }

  try {
    const fingerprints = signingKeys.map((k) => k.getFingerprint())
    debug(`sign using these keys: ${fingerprints.join(', ')}`)
    const value = await openpgp.sign({ message, signingKeys })
    return { value }
  } catch (err) {
    return { error: err }
  }
}

export const securityTxt = async (options) => {
  const result = schema.safeParse(options)
  if (!result.success) {
    return {
      error: new Error(`invalid configuration: ${result.error.message}`)
    }
  }

  const header = [
    '# If you find a security issue and would like to report it,',
    '# please contact us using the contact details below (listed in order of preference).',
    '# If you want to send us an email, please encrypt your message using our public OpenPGP key.'
  ].join('\n')

  let armoredBlock = undefined
  if (result.data.armoredBlock) {
    armoredBlock = result.data.armoredBlock.trim()
  }
  // if (process.env.PGP_PRIVATE_KEY_ASCII_ARMOR) {
  //   armoredBlock = process.env.PGP_PRIVATE_KEY_ASCII_ARMOR.trim()
  // }

  let passphrase = undefined
  if (result.data.passphrase) {
    passphrase = result.data.passphrase.trim()
  }
  // if (process.env.PGP_PASSPHRASE) {
  //   passphrase = process.env.PGP_PASSPHRASE.trim()
  // }

  let pkeys = []
  try {
    // https://docs.openpgpjs.org/global.html#readPrivateKeys
    pkeys = await openpgp.readPrivateKeys({ armoredKeys: armoredBlock })
  } catch (err) {
    return { error: err }
  }

  const fingerprint = result.data.fingerprint
  const valid_pkeys = pkeys.filter(
    (k) => k.getFingerprint() === fingerprint.toLowerCase()
  )

  if (valid_pkeys.length === 0) {
    return {
      error: new Error(
        `no OpenPGP private key matches the fingerprint ${fingerprint}`
      )
    }
  }

  const privateKey = valid_pkeys[0]

  const acknowledgments = result.data.acknowledgments
  const contacts = result.data.contacts
  const domain = result.data.domain
  const encryption = result.data.encryption
  const expires = result.data.expires.toISOString()
  const policy = result.data.policy
  const preferredLanguages = result.data.preferredLanguages

  return await content({
    acknowledgments,
    contacts,
    domain,
    encryption,
    expires,
    header: result.data.header || header,
    passphrase,
    policy,
    preferredLanguages,
    privateKey
  })
}
