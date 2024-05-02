import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defDebug from 'debug'
import { securityTxt } from './security-txt-lib.mjs'

const __filename = fileURLToPath(import.meta.url)
const debug = defDebug(`script:${path.basename(__filename, '.ts')}`)

const REPO_ROOT = path.join(__filename, '..', '..')
const SECRETS_ROOT = path.join(REPO_ROOT, 'secrets')
const KEY_ID = '56DE4CF7'

const main = async () => {
  const domain = 'www.giacomodebidda.com'
  const contacts = [
    'mailto:security@giacomodebidda.com',
    'https://twitter.com/jackdbd'
  ]
  const fingerprint = 'C6F29CA94E6E091E519E3E0ED501B88B56DE4CF7'

  const filepath_private_key = path.join(SECRETS_ROOT, `secret-${KEY_ID}.asc`)
  debug(`read ASCII-armored OpenPGP private key from ${filepath_private_key}`)
  const armoredBlock = fs.readFileSync(filepath_private_key, 'utf8').trim()

  const filepath_passphrase = path.join(SECRETS_ROOT, 'OpenPGP-passphrase.txt')
  debug(`read passphrase from ${filepath_passphrase}`)
  const passphrase = fs.readFileSync(filepath_passphrase, 'utf8').trim()

  const { error, value: text } = await securityTxt({
    armoredBlock,
    contacts,
    domain,
    encryption: `https://${domain}/assets/pgp-key.txt`,
    fingerprint,
    passphrase,
    policy: `https://github.com/jackdbd/personal-website/blob/main/SECURITY.md`,
    preferredLanguages: ['en', 'it']
  })

  if (error) {
    console.error(error)
    return
  }

  debug(`generated security.txt`)
  debug(text)
  // console.log(text)

  const filepath = path.join(
    REPO_ROOT,
    'src',
    'includes',
    'assets',
    'security.txt'
  )

  fs.writeFileSync(filepath, text, { encoding: 'utf8' })
  debug(`wrote ${filepath}`)
}

await main()
