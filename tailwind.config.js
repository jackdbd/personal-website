module.exports = {
  // corePlugins: {
  //   preflight: false
  // },
  darkMode: false, // false, 'media' or 'class'
  // I would like to keep tailwind.config.js in the tailwind directory, but at
  // the moment is not possible to do it with mode: 'jit'
  // https://github.com/tailwindlabs/tailwindcss/issues/4059
  mode: 'jit',
  plugins: [],
  // purge works only when NODE_ENV=production (is this still true with @tailwindcss/jit?)
  // https://github.com/tailwindlabs/tailwindcss/pull/1639
  purge: [
    './src/includes/**/*.njk',
    './src/pages/*.njk',
    './src/posts/*.md',
    './.eleventy.js'
  ]
};
