const { red } = require('tailwindcss/colors');
const colors = require('tailwindcss/colors');
const plugin = require('tailwindcss/plugin');

// https://github.com/tailwindlabs/tailwindcss-typography#customization
const typography = (theme) => {
  return {
    DEFAULT: {
      css: {
        color: theme('colors.primary'),
        a: {
          color: theme('colors.hyperlink'),
          'font-weight': 'bold',
          '&:hover': {
            'background-color': colors.white,
            // color: theme('colors[twitter-blue]')
            color: theme('colors.highlighted')
          }
        },
        // I don't like the default style for inline code done by
        // @tailwindcss/typography, so I override it.
        // Note: block of codes are styled by a Prism.js theme.
        code: {
          border: `1px solid ${theme('colors.inlineCodeBorder')}`,
          'border-radius': '.25rem',
          padding: '2px 4px',
          margin: '0 2px'
        },
        // I don't like the quotations this plugin adds to the inline code
        'code::after': {
          content: '""'
        },
        'code::before': {
          content: '""'
        },
        // headings do not inherit `color`, so I use currentColor
        h1: {
          color: theme('colors.current'),
          'font-family': 'var(--font-family-headline)',
          'margin-bottom': '0.15em',
          'margin-top': '0.75em !important'
        },
        h2: {
          color: theme('colors.current'),
          'font-family': 'var(--font-family-headline)'
        },
        h3: {
          color: theme('colors.current'),
          'font-family': 'var(--font-family-headline)'
        },
        // try not to use h4, h5 or h6
        h4: {
          color: theme('colors.current'),
          'font-family': 'var(--font-family-headline)'
        },
        h5: {
          color: theme('colors.current'),
          'font-family': 'var(--font-family-headline)'
        },
        h6: {
          color: theme('colors.current'),
          'font-family': 'var(--font-family-headline)'
        },
        'ol.postslist > li': {
          'padding-left': 0
        },
        'ol.postslist > li::before': {
          content: "''"
        },
        'ol.postslist > li h2': {
          'margin-bottom': 0
        },
        'ol.postslist > li p': {
          'margin-bottom': 0
        }
      }
    }
  };
};

// I know I can override the @tailwindcss/form defaults by extending @layer base,
// but I can't get it to work. And this override seems much more flexible anyway.
const patchTailwindFormPlugin = ({ addBase, theme }) => {
  const borderColor = colors.coolGray[300];
  const ringColor = theme('colors.secondary');
  const ring1 = `var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) ${ringColor};`;
  const ring2 = `var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) ${ringColor};`;

  const inputOverride = {
    borderColor,
    borderRadius: theme('borderRadius.lg'),
    fontSize: theme('fontSize.2xl'),
    width: '100%',
    '&:focus': {
      'border-color': ringColor,
      boxShadow: ring2
    }
  };

  const checkboxOverride = {
    borderColor,
    borderRadius: theme('borderRadius.md'),
    color: theme('colors.highlighted'),
    '&:focus': {
      'border-color': ringColor,
      boxShadow: ring1
    }
  };

  const labelOverride = {
    fontWeight: 600,
    textTransform: 'uppercase'
  };

  // reference for selectors
  // https://github.com/tailwindlabs/tailwindcss-forms/blob/master/src/index.js
  addBase({
    "[type='date']": inputOverride,
    "[type='datetime-local']": inputOverride,
    "[type='email']": inputOverride,
    "[type='month']": inputOverride,
    "[type='number']": inputOverride,
    "[type='password']": inputOverride,
    "[type='search']": inputOverride,
    "[type='tel']": inputOverride,
    "[type='text']": inputOverride,
    "[type='time']": inputOverride,
    "[type='url']": inputOverride,
    "[type='week']": inputOverride,
    '[multiple]': inputOverride,
    select: inputOverride,
    textarea: inputOverride,
    "[type='checkbox']": checkboxOverride,
    "[type='radio']": checkboxOverride,
    'form label': labelOverride
  });
};

module.exports = {
  darkMode: 'class', // false, 'media' or 'class'
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    plugin(patchTailwindFormPlugin)
  ],
  // purge works only when NODE_ENV=production (is this still true with @tailwindcss/jit?)
  // https://github.com/tailwindlabs/tailwindcss/pull/1639
  purge: [
    './src/includes/**/*.njk',
    './src/pages/*.njk',
    './src/posts/*.md',
    './.eleventy.js'
  ],
  theme: {
    extend: {
      // https://tailwindcss.com/docs/customizing-colors
      colors: {
        // blue: colors.lightBlue,
        current: 'currentColor',
        // gray: colors.coolGray,
        // gray: colors.warmGray,
        highlighted: colors.indigo[700],
        hyperlink: colors.amber[600],
        inlineCodeBorder: colors.lime[700],
        primary: colors.warmGray[700],
        secondary: colors.red[800],
        transparent: 'transparent',
        'twitter-blue': '#1da1f2'
      },
      screens: {
        '3xl': '1920px'
      },
      typography
    },
    fontFamily: {
      sans: ['Lato', 'sans-serif'],
      serif: ['Nunito', 'serif']
    }
  }
  // it should no longer be necessary to specify `variants` when using @tailwind/jit
};
