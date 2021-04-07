module.exports = (ctx) => {
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
  return {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
      cssnano: ctx.env === 'production' ? cssnanoConfig : false
    }
  };
};
