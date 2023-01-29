const fs = require('node:fs')
const path = require('node:path')
const { securityTxt } = require('./security-txt-lib.cjs')

const REPO_ROOT = path.join(__filename, '..', '..')

const main = async () => {
  const domain = 'www.giacomodebidda.com'

  const filepath_private_key = path.join(
    REPO_ROOT,
    'secrets',
    'ASCII-armored-PGP-private-key.txt'
  )

  const armoredKey = fs
    .readFileSync(filepath_private_key, {
      encoding: 'utf8'
    })
    .trim()

  const filepath_passphrase = path.join(
    REPO_ROOT,
    'secrets',
    'PGP-passphrase.txt'
  )

  const passphrase = fs
    .readFileSync(filepath_passphrase, {
      encoding: 'utf8'
    })
    .trim()

  const text = await securityTxt({
    contacts: [
      'mailto:security@giacomodebidda.com',
      'https://twitter.com/jackdbd'
    ],
    domain,
    encryption: `https://${domain}/assets/pgp-key.txt`,
    armoredKey,
    passphrase,
    preferredLanguages: ['en', 'it']
  })

  const filepath = path.join(
    REPO_ROOT,
    'src',
    'includes',
    'assets',
    'security.txt'
  )
  fs.writeFileSync(filepath, text, {
    encoding: 'utf8'
  })
  console.log(`wrote ${filepath}`)
}

main()
