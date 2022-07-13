const { join } = require('node:path')
const esbuild = require('esbuild')

const main = async () => {
  const ROOT = join(__filename, '..', '..')
  const outdir = join(ROOT, '_site')

  const entryPoint = join(ROOT, 'src', 'sw.mjs')

  const sw = await esbuild.build({
    bundle: true,
    entryPoints: [entryPoint],
    outdir,
    logLevel: 'debug',
    minify: false,
    platform: 'browser',
    // https://esbuild.github.io/api/#sourcemap
    sourcemap: false,
    // https://esbuild.github.io/api/#target
    target: 'esnext'
  })

  console.log('🚀 ~ main ~ sw', sw)
}

main()
