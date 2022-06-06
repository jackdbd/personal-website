const tailwindConfig = require('./tailwind.config.cjs')

module.exports = (ctx) => {
  if (!(ctx.env === 'development' || ctx.env === 'production')) {
    throw new Error(
      `PostCSS error: ctx.env is ${ctx.env} (it must be either 'development' or 'production')`
    )
  }

  const plugins = {
    tailwindcss: tailwindConfig
  }

  if (ctx.env === 'production') {
    // https://github.com/postcss/autoprefixer#options
    plugins.autoprefixer = {}

    // https://cssnano.co/docs/config-file/
    // https://www.npmjs.com/package/cssnano-preset-default#configuration
    plugins.cssnano = {
      preset: [
        'default',
        {
          discardComments: {
            removeAll: false
          }
        }
      ]
    }
  }

  console.log(`PostCSS plugins: ${Object.keys(plugins).join(', ')}`)

  return { plugins }
}
