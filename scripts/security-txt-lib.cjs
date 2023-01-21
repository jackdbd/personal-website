const makeDebug = require('debug')
const openpgp = require('openpgp')
const { z } = require('zod')

const debug = makeDebug('security-txt')

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

const schema = z.object({
  acknowledgments: z.string().url().optional(),

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

  encryption: z.string().url().optional(),

  // https://github.com/colinhacks/zod#dates
  expires: z.coerce
    .date()
    .max(maxExpirationDate, {
      message:
        'The expiration date for the content of the security.txt should be less than a year into the future to avoid staleness.'
    })
    .default(maxExpirationDate),

  header: z.string().optional(),

  hiring: z.string().url().optional(),

  armoredKey: z.string().optional(),
  passphrase: z.string().optional(),

  policy: z.string().url().optional(),

  preferredLanguages: z.array(z.string()).default(['en'])
})

const content = async ({
  acknowledgments,
  armoredKey,
  contacts,
  domain,
  encryption,
  expires,
  header,
  hiring,
  passphrase,
  policy,
  preferredLanguages
}) => {
  const base = `https://${domain}`

  let s = ''

  if (header) {
    s += header
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
    s += '\n'
  }

  s += '\n'
  s += `Canonical: ${base}/.well-known/security.txt`
  s += '\n'

  s += '\n'
  s += contacts.map((c) => `Contact: ${c}`).join('\n')
  s += '\n'

  if (encryption) {
    s += '\n'
    s += `Encryption: ${encryption}`
    s += '\n'
  }

  s += '\n'
  s += `Expires: ${expires}`
  s += '\n'

  if (acknowledgments) {
    s += '\n'
    s += `Acknowledgments: ${acknowledgments}`
    s += '\n'
  }

  if (hiring) {
    s += '\n'
    s += `Hiring: ${hiring}`
    s += '\n'
  }

  if (policy) {
    s += '\n'
    s += `Policy: ${policy}`
    s += '\n'
  }

  if (preferredLanguages) {
    s += '\n'
    s += `Preferred-Languages: ${preferredLanguages.join(', ')}`
    s += '\n'
  }

  if (armoredKey) {
    debug(`create cleartext and sign it using PGP private key`)
    const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey }),
      passphrase
    })

    const unsignedMessage = await openpgp.createCleartextMessage({ text: s })

    return await openpgp.sign({
      message: unsignedMessage,
      signingKeys: privateKey
    })
  } else {
    debug(
      `tip: it's recommended to sign the content of the security.txt using a PGP private key`
    )
    return s
  }
}

const securityTxt = async (options) => {
  let config = { expires: '' }

  const result = schema.safeParse(options)
  if (!result.success) {
    throw new Error(`${PREFIX} invalid configuration: ${result.error.message}`)
  } else {
    const header = `
    # If you find a security issue and would like to report it,
    # please contact us using the contact details below (listed in order of preference).
    # If you want to send us an email, please encrypt your message using our public PGP key.`

    let armoredKey = undefined
    if (result.data.armoredKey) {
      armoredKey = result.data.armoredKey.trim()
    }
    if (process.env.PGP_PRIVATE_KEY_ASCII_ARMOR) {
      armoredKey = process.env.PGP_PRIVATE_KEY_ASCII_ARMOR.trim()
    }

    let passphrase = undefined
    if (result.data.passphrase) {
      passphrase = result.data.passphrase.trim()
    }
    if (process.env.PGP_PASSPHRASE) {
      passphrase = process.env.PGP_PASSPHRASE.trim()
    }

    config = {
      ...result.data,
      expires: result.data.expires.toISOString(),
      header: result.data.header || header,
      armoredKey,
      passphrase
    }
  }

  return await content(config)
}

module.exports = { securityTxt }
