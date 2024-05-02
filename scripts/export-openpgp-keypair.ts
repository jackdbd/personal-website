import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defDebug from 'debug'
import { REPO_ROOT, SECRETS_ROOT } from './utils.js'

const __filename = fileURLToPath(import.meta.url)
const debug = defDebug(`script:${path.basename(__filename, '.ts')}`)

// If this script does not work, double check that GnuPG is installed and the
// keyring daemon is running.
const USER_ID = 'giacomo@giacomodebidda.com'
const KEY_ID = '56DE4CF7'

const exportPublicKey = () => {
  const output = path.join(
    REPO_ROOT,
    'src',
    'includes',
    'assets',
    'pgp-key.txt'
  )
  const stdout = execSync(
    `gpg --armor --export --recipient ${USER_ID} --output ${output}`
  ).toString()
  console.log(stdout)
  debug(`Exported OpenPGP public key in ASCII-armored format to ${output}`)
}

const exportPrivateKey = () => {
  const output = path.join(SECRETS_ROOT, `secret-${KEY_ID}.asc`)
  const stdout = execSync(
    `gpg --armor --export-secret-key --recipient ${USER_ID} --output ${output}`
  ).toString()
  console.log(stdout)
  debug(`Exported OpenPGP private key in ASCII-armored format to ${output}`)
}

const main = async () => {
  exportPublicKey()
  // exportPrivateKey()
}

await main()
