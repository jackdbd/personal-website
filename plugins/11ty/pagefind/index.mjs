import defDebug from 'debug'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const DEBUG_PREFIX = '11ty-plugin-pagefind'
const ERR_PREFIX = '[❌ 11ty-plugin-pagefind]'
const OK_PREFIX = '[🔍 11ty-plugin-pagefind]'

const debug = defDebug(`${DEBUG_PREFIX}:index`)

export const pagefindPlugin = (eleventyConfig, options) => {
  debug(`user-provided options %O`, options)

  // https://www.11ty.dev/docs/events/#eleventy.after
  eleventyConfig.on('eleventy.after', async ({ dir }) => {
    const site = dir.output || '_site'
    const command = `npx pagefind --site ${site}`
    debug(`build search index: ${command}`)

    const { stdout, stderr } = await execAsync(command)

    if (stderr) {
      console.error(`${ERR_PREFIX} could not generate search index`)
      console.log(stderr)
    }

    if (stdout) {
      debug(`search index and related assets generated at ${site}/pagefind`)
      console.log(
        `${OK_PREFIX} search index and related assets generated at ${site}/pagefind`
      )
      if (options.verbose) {
        console.log(stdout)
      }
    }
  })
}
