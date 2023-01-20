const fs = require('node:fs')
const { join } = require('node:path')
const { promisify } = require('node:util')
const makeDebug = require('debug')
const openpgp = require('openpgp')
const { z } = require('zod')

const writeFileAsync = promisify(fs.writeFile)

const PREFIX = '[💬 11ty-plugin-security-txt]'
const debug = makeDebug('eleventy-plugin-security-txt')

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

  pgpPassphrase: z.string().optional(),
  pgpPrivateKeyArmored: z.string().optional(),

  policy: z.string().url().optional(),

  preferredLanguages: z.array(z.string()).default(['en'])
})

// type Config = z.infer<typeof schema>

// What is the security.txt file?
// https://youtu.be/f-FbcobQQb8

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
      `tip: it's recommended to sign the content of the security.txt using OpenPGP`
    )
    return s
  }
}

// give the plugin configuration function a name, so it can be easily spotted in
// EleventyErrorHandler
const securityTxt = (eleventyConfig, providedOptions) => {
  let config = { expires: '' }

  const result = schema.safeParse(providedOptions)
  if (!result.success) {
    throw new Error(`${PREFIX} invalid configuration: ${result.error.message}`)
  } else {
    const header = `
    # If you find a security issue and would like to report it,
    # please contact us using the contact details below (listed in order of preference).
    # If you want to send us an email, please encrypt your message using our public OpenPGP key.`

    let pgpPassphrase = undefined
    if (result.data.pgpPassphrase) {
      pgpPassphrase = result.data.pgpPassphrase.trim()
    }
    if (process.env.PGP_PASSPHRASE) {
      pgpPassphrase = process.env.PGP_PASSPHRASE.trim()
    }

    let pgpPrivateKeyArmored = undefined
    if (result.data.pgpPrivateKeyArmored) {
      pgpPrivateKeyArmored = result.data.pgpPrivateKeyArmored.trim()
    }
    if (process.env.PGP_PRIVATE_KEY_ARMORED) {
      pgpPrivateKeyArmored = process.env.PGP_PRIVATE_KEY_ARMORED.trim()
    }

    config = {
      ...result.data,
      expires: result.data.expires.toISOString(),
      header: result.data.header || header,
      pgpPassphrase,
      pgpPrivateKeyArmored
    }
  }

  const outdir = join(eleventyConfig.dir.output, '.well-known')

  eleventyConfig.on('eleventy.before', async () => {
    if (!fs.existsSync(outdir)) {
      fs.mkdirSync(outdir)
    }

    let text = ''
    try {
      text = await content({
        acknowledgments: config.acknowledgments,
        armoredKey: config.pgpPrivateKeyArmored,
        contacts: config.contacts,
        domain: config.domain,
        encryption: config.encryption,
        expires: config.expires,
        header: config.header,
        hiring: config.hiring,
        passphrase: config.pgpPassphrase,
        policy: config.policy,
        preferredLanguages: config.preferredLanguages
      })
    } catch (err) {
      throw new Error(`${PREFIX} ${err.message}`)
    }

    const filepath = join(outdir, 'security.txt')
    await writeFileAsync(filepath, text, {
      encoding: 'utf8'
    })
    debug(`wrote ${filepath}`)
  })
}

module.exports = { initArguments: {}, configFunction: securityTxt }
