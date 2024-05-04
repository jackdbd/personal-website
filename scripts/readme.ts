import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  compactEmptyLines,
  image,
  licenseLink,
  link,
  list,
  toc,
  transcludeFile
} from '@thi.ng/transclude'
import defDebug from 'debug'
const debug = defDebug(`script:readme`)

const __filename = fileURLToPath(import.meta.url)
export const REPO_ROOT = path.join(__filename, '..', '..')

// parsed package.json
type PackageJson = any

interface Config {
  output: string
  pkg: PackageJson
  year_now: number
  year_started: number
}

// https://github.com/ikatyang/emoji-cheat-sheet/tree/master

const main = async ({ output, pkg, year_now, year_started }: Config) => {
  const input = path.join(REPO_ROOT, 'tpl.readme.md')
  debug(`generate ${output} from ${input}`)

  const transcluded = transcludeFile(input, {
    user: pkg.author,

    templates: {
      badges: () => {
        // https://shields.io/badges/npm-downloads
        // https://shields.io/badges/npm-downloads-by-package-author

        const domain = 'giacomodebidda.com'

        const hshs = link(
          image(
            `https://img.shields.io/hsts/preload/${domain}`,
            'HSTS preload'
          ),
          `https://hstspreload.org/?domain=${domain}`
        )

        const gh_workflows = ['ci.yaml', 'cloudflare-pages-deploy-hook.yaml']
        const ghw_badges = gh_workflows.map((ghw) => {
          return link(
            image(
              `https://github.com/jackdbd/personal-website/actions/workflows/${ghw}/badge.svg`,
              'HSTS preload'
            ),
            `https://github.com/jackdbd/personal-website/actions/workflows/${ghw}`
          )
        })

        return [hshs, ...ghw_badges].join('\n')
      },

      'cloudflarePages.callout': () => {
        // The Cloudflare Pages V2 build system installs a Node.js project dependencies using this command (I don't know if this can be changed or configured in any way)
        const paragraphs = [
          `Don't forget to set the environment variables \`NODE_ENV\` and \`NODE_VERSION\` in the ${link('Cloudflare Pages dashboard', 'https://developers.cloudflare.com/pages/functions/bindings/#environment-variables')}. In particular, \`NODE_VERSION\` is used by the ${link('Cloudflare Pages V2 build system', 'https://developers.cloudflare.com/pages/configuration/language-support-and-tools/#v2-build-system')}.`
          // `In particular, \`NODE_VERSION\` is used by the ${link('Cloudflare Pages V2 build system', 'https://developers.cloudflare.com/pages/configuration/language-support-and-tools/#v2-build-system')}`
        ]
        const emoji = ':warning:'
        const callout = [
          `> ${emoji} **Node.js version on Cloudflare Pages**`,
          `\n>\n`,
          `> ${paragraphs.join('\n>\n>')}`
        ].join('')
        return callout
      },

      'engines.node': () => {
        return `This project should work on Node.js ${pkg.engines.node}.`
      },

      features: () => {
        const features = [
          `PWA with  ${link('web application manifest', 'https://developer.mozilla.org/en-US/docs/Web/Manifest')}`,
          `RSS feed with ${link(`\`@11ty/eleventy-plugin-rss\``, 'https://www.11ty.dev/docs/plugins/rss/')}`
        ]
        return list(features)
      },

      'flake.nix': () => {
        const paragraphs = [
          `This project uses a ${link('nix dev shell', 'https://fasterthanli.me/series/building-a-rust-service-with-nix/part-10')} to define a virtual environment with all the necessary dependencies. Thanks to Nix and [this \`.envrc\` file](.envrc), you can activate this environment simply by entering the root directory of this repository (and waiting a few seconds).`,
          `If you don't use Nix, you can safely ignore the \`flake.nix\` file in the repository root.`,
          `In alternative to the Nix dev shell provided by this repository, you could use a Node.js version manager like ${link('nvm', 'https://github.com/nvm-sh/nvm')}, ${link('asdf', 'https://github.com/asdf-vm/asdf')}, or ${link('volta', 'https://github.com/volta-cli/volta')}.`
        ]

        const emoji = ':information_source:'
        const callout = [
          `> ${emoji} **What's that \`flake.nix\`?**`,
          `\n>\n`,
          `> ${paragraphs.join('\n>\n>')}`
        ].join('')

        return callout
      },

      'pkg.license': ({ user }) => {
        let name = user.name || user
        name = user.url ? link(name, user.url) : name

        const copyright =
          year_now > year_started
            ? `&copy; ${year_started} - ${year_now}`
            : `&copy; ${year_now}`

        return [
          `## License`,
          '\n\n',
          `${copyright} ${name} // ${licenseLink(pkg.license)}`
        ].join('')
      },

      'pkg.dependencies': () => {
        const entries = Object.entries(pkg.dependencies)

        const rows = entries.map(
          ([name, version]) =>
            `| ${link(name, `https://www.npmjs.com/package/${name}`)} | \`${version}\` |`
        )
        const table = [
          `| Package | Version |`,
          '|---|---|',
          rows.join('\n')
        ].join('\n')

        return [
          `This project has **${rows.length}** \`dependencies\`.`,
          '\n\n',
          table
        ].join('')
      },

      'pkg.description': pkg.description,

      'pkg.devDependencies': () => {
        const links = Object.keys(pkg.devDependencies).map((k) => {
          return link(k, `https://www.npmjs.com/package/${k}`)
        })
        return `This project has **${links.length}** \`devDependencies\`: ${links.join(', ')}.`
      }
    },

    post: [toc(), compactEmptyLines]
  })

  fs.writeFileSync(output, transcluded.src)
  debug(`wrote ${output}`)
}

await main({
  output: path.join(REPO_ROOT, 'README.md'),
  pkg: JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8')
  ),
  year_now: new Date().getFullYear(),
  year_started: 2020
})
