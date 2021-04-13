const plugin = require('tailwindcss/plugin');
const twColors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

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

const textDecoration = {
  'text-decoration-line': 'underline',
  // 'text-underline-offset': '0.15em',
  'text-decoration-style': 'solid',
  'text-decoration-thickness': '0.25rem'
};

const basePlugin = plugin(function ({ addBase, theme }) {
  const headings = {
    color: theme('colors.headline'),
    'font-family': theme('fontFamily.serif')
  };
  addBase({
    body: {
      'background-color': theme('colors.background'),
      'font-family': theme('fontFamily.sans'),
      'font-size': '20px'
    },
    h1: {
      ...headings,
      'font-size': '4rem'
    },
    h2: {
      ...headings,
      'font-size': '2.5rem'
    },
    h3: {
      ...headings,
      'font-size': '1.5rem'
    },
    h4: {
      ...headings,
      'font-size': '1.5rem'
    },
    h5: {
      ...headings,
      'font-size': '1.5rem'
    },
    h6: {
      ...headings,
      'font-size': '1.5rem'
    },
    'a:focus': {
      outline: `${theme('spacing.1')} dashed ${theme('colors.tertiary')}`
    },
    'a:hover': {
      'text-decoration-color': theme('colors.tertiary'),
      ...textDecoration
    },
    '.toc': {
      // 'background-color': theme('colors.secondary'),
      outline: `${theme('spacing.1')} dashed ${theme('colors.headline')}`,
      padding: `${theme('padding.2')} ${theme('padding.2')}`
    }
    // pre: {
    //   'background-color': theme('colors.secondary'),
    //   overflow: 'scroll'
    // }
  });
});

const componentsPlugin = plugin(function ({ addComponents, theme }) {
  addComponents({
    '#wrapper-for-sticky-footer': {
      display: 'flex',
      'flex-direction': 'column',
      'min-height': '100vh'
    },
    '#wrapper-for-sticky-footer > main': {
      flex: 'auto'
    }
  });
});

const utilitiesPlugin = plugin(function ({ addUtilities, theme }) {
  addUtilities({
    '.fancy-outline': {
      outline: `${theme('spacing.1')} dashed ${theme('colors.tertiary')}`
    },
    '.full-bleed': {
      width: '100vw',
      'margin-left': '50%',
      transform: 'translateX(-50%)'
    }
  });
});

module.exports = {
  darkMode: 'class', // false, 'media' or 'class'
  // I would like to keep tailwind.config.js in the tailwind directory, but at
  // the moment is not possible to do it with mode: 'jit'
  // https://github.com/tailwindlabs/tailwindcss/issues/4059
  mode: 'jit',
  plugins: [
    require('@tailwindcss/forms'),
    require('./tailwind/plugins/tailwind-forms-overrides'),
    require('./tailwind/plugins/tailwind-layout-primitives'),
    // require('@tailwindcss/typography'),
    require('./tailwind/plugins/tailwind-debug-breakpoints'),
    basePlugin,
    componentsPlugin,
    utilitiesPlugin
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
      }
      // typography
    },
    // Tailwind does not automatically escape font names
    fontFamily: {
      mono: ['Source Code Pro', ...defaultTheme.fontFamily.mono],
      sans: ['Lato', ...defaultTheme.fontFamily.sans],
      serif: ['Nunito', ...defaultTheme.fontFamily.serif]
    }
  }
  // it should no longer be necessary to specify `variants` when using @tailwind/jit
  // https://tailwindcss.com/docs/just-in-time-mode
};
