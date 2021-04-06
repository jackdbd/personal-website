const twColors = require('tailwindcss/colors');
const plugin = require('tailwindcss/plugin');

// theme colors are defined in inline.css
const colors = {
  background: 'var(--theme-color-background)',
  button: 'var(--theme-color-button)',
  buttonText: 'var(--theme-color-button-text)',
  headline: 'var(--theme-color-headline)',
  highlight: 'var(--theme-color-highlight)',
  hyperlink: twColors.amber[600],
  main: 'var(--theme-color-main)',
  paragraph: 'var(--theme-color-paragraph)',
  secondary: 'var(--theme-color-secondary)',
  stroke: 'var(--theme-color-stroke)',
  tertiary: 'var(--theme-color-tertiary)',
  'twitter-blue': '#1da1f2'
};

// perform all @tailwindcss/typography overrides in tailwind.css, not here!
// https://github.com/tailwindlabs/tailwindcss-typography#customization
const typography = (theme) => {
  // console.log('=== SPACING ===', theme('spacing'));

  return {
    DEFAULT: {
      css: {}
    }
  };
};

module.exports = {
  darkMode: 'class', // false, 'media' or 'class'
  mode: 'jit',
  plugins: [
    // see @tailwindcss/forms overrides in tailwind.css
    require('@tailwindcss/forms'),
    // see @tailwindcss/typography overrides in tailwind.css
    require('@tailwindcss/typography')
  ],
  // purge works only when NODE_ENV=production (is this still true with @tailwindcss/jit?)
  // https://github.com/tailwindlabs/tailwindcss/pull/1639
  purge: [
    './src/includes/**/*.njk',
    './src/pages/*.njk',
    './src/posts/*.md',
    './.eleventy.js'
  ],
  // https://tailwindcss.com/docs/theme#configuration-reference
  theme: {
    extend: {
      // https://tailwindcss.com/docs/customizing-colors
      colors,
      screens: {
        '3xl': '1920px'
      },
      typography
    },
    // Tailwind does not automatically escape font names
    fontFamily: {
      mono: ['Source Code Pro', 'monospace'],
      sans: ['Lato', 'sans-serif'],
      serif: ['Nunito', 'serif']
      // this should be the Tailwind default serif stack
      // serif: [
      //   'ui-serif',
      //   'Georgia',
      //   'Cambria',
      //   'Times New Roman',
      //   'Times',
      //   'serif'
      // ]
    }
  }
  // it should no longer be necessary to specify `variants` when using @tailwind/jit
  // https://tailwindcss.com/docs/just-in-time-mode
};
