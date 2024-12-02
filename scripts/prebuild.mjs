import child_process from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import defDebug from 'debug'

const copyFile = promisify(fs.copyFile)
const exec = promisify(child_process.exec)
const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)
const rm = promisify(fs.rm)

const debug = defDebug(`script:prebuild`)

const __filename = fileURLToPath(import.meta.url)
const REPO_ROOT = path.join(__filename, '..', '..')
const DEST_DIR = path.join(REPO_ROOT, 'tmp')

const remove = [
  path.join(DEST_DIR, 'articles', 'README.md'),
  path.join(DEST_DIR, 'bookmarks', 'README.md'),
  path.join(DEST_DIR, 'likes', 'README.md'),
  path.join(DEST_DIR, 'media', 'README.md'),
  path.join(DEST_DIR, 'notes', 'README.md'),
  path.join(DEST_DIR, '.envrc'),
  path.join(DEST_DIR, '.gitattributes'),
  path.join(DEST_DIR, '.gitignore'),
  path.join(DEST_DIR, '.gitrepo'),
  path.join(DEST_DIR, '.vscode'),
  path.join(DEST_DIR, 'devenv.lock'),
  path.join(DEST_DIR, 'devenv.nix'),
  path.join(DEST_DIR, 'devenv.yaml'),
  path.join(DEST_DIR, 'README.md')
]

const copyDirectory = async (src, dest) => {
  const entries = await readdir(src, { withFileTypes: true })

  await mkdir(dest, { recursive: true })

  for (const entry of entries) {
    const src_path = path.join(src, entry.name)
    const dest_path = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(src_path, dest_path)
    } else {
      await copyFile(src_path, dest_path)
      debug(`copied ${src_path} to ${dest_path}`)
    }
  }
}

const main = async () => {
  const cmd = `find _site/* -not -name 'README.md' -delete`
  console.log(cmd)
  const { stderr, stdout } = await exec(cmd)
  if (stderr) {
    console.error(stderr)
  }
  if (stdout) {
    console.info(stdout)
  }

  const cmd2 = `rm -rf ${DEST_DIR}`
  console.log(cmd2)
  const res2 = await exec(cmd)
  if (res2.stderr) {
    console.error(res2.stderr)
  }
  if (stdout) {
    console.info(res2.stdout)
    debug(`removed ${DEST_DIR}`)
  }

  await copyDirectory(path.join(REPO_ROOT, 'content'), DEST_DIR)
  await copyDirectory(path.join(REPO_ROOT, 'src'), DEST_DIR)

  await Promise.all(remove.map((fpath) => rm(fpath, { recursive: true })))
  debug(`removed these paths %O`, remove)
}

main()
