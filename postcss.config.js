const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const tailwindcss = require('tailwindcss');
const tailwindConfig = require('./tailwind.config');

module.exports = (ctx) => {
  const shouldFail = !(ctx.env === 'development' || ctx.env === 'production');
  if (shouldFail) {
    throw new Error(
      `PostCSS error: ctx.env is ${ctx.env} (it must be either 'development' or 'production')`
    );
  }

  // https://cssnano.co/docs/config-file/
  // https://www.npmjs.com/package/cssnano-preset-default#configuration
  const cssnanoConfig = {
    preset: [
      'default',
      {
        discardComments: {
          removeAll: false
        }
      }
    ]
  };

  const config = {
    plugins: [
      tailwindcss(tailwindConfig),
      ctx.env === 'production' ? autoprefixer({}) : false,
      ctx.env === 'production' ? cssnano(cssnanoConfig) : false
    ]
  };
  // console.log('PostCSS config', config);
  return config;
};
