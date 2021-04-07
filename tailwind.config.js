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

// https://tailwindcss.com/docs/ring-width
const ring2 = {
  'box-shadow':
    'var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);'
};
const ring4 = {
  'box-shadow':
    'var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width)) var(--tw-ring-color)'
};

// https://tailwindcss.com/docs/box-shadow#class-reference
const shadowSm = {
  '--tw-shadow': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'box-shadow':
    'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)'
};

// https://tailwindcss.com/docs/font-size#class-reference
const text2xl = {
  'font-size': '1.5rem',
  'line-height': '2rem'
};

// Use this plugin after all others
const baseOverridesPlugin = plugin(function ({ addBase, theme }) {
  const twFormOverride = (selector) => {
    return {
      [selector]: {
        '--tw-ring-color': theme('colors.tertiary'),
        'border-color': theme('colors.tertiary'),
        width: '100%',
        'border-radius': theme('borderRadius.lg'),
        ...shadowSm,
        ...text2xl
      },
      [`${selector}:focus`]: {
        '--tw-ring-color': theme('colors.secondary'),
        'border-color': theme('colors.secondary'),
        ...ring4
      },
      [`${selector}:hover`]: {
        ...ring4
      }
    };
  };

  const twFormCheckboxOverride = (selector) => {
    return {
      [selector]: {
        '--tw-ring-color': theme('colors.tertiary'),
        'border-color': theme('colors.tertiary'),
        'border-radius': theme('borderRadius.sm'),
        color: theme('colors.tertiary')
      },
      [`${selector}:focus`]: {
        '--tw-ring-color': theme('colors.secondary'),
        'border-color': theme('colors.secondary'),
        ...ring2
      },
      [`${selector}:hover`]: {
        ...ring2
      }
    };
  };

  const formInputsOverrides = Object.assign(
    ...[
      "[type='date']",
      "[type='datetime-local']",
      "[type='email']",
      "[type='month']",
      "[type='number']",
      "[type='password']",
      "[type='search']",
      "[type='tel']",
      "[type='text']",
      "[type='time']",
      "[type='url']",
      "[type='week']"
    ].map(twFormOverride)
  );

  const formButtonOverrides = {
    'form button': {
      '--tw-ring-color': theme('colors.secondary'),
      'background-color': theme('colors.button'),
      'border-radius': theme('borderRadius.lg'),
      color: theme('colors.buttonText'),
      'font-weight': theme('fontWeight.semibold'),
      padding: theme('padding.2'),
      'text-transform': 'uppercase'
    },
    'form button:focus': {
      'border-color': theme('colors.secondary'),
      outline: 'none',
      ...ring4
    },
    'form button:hover': {
      ...ring4
    },
    'form label': {
      'font-weight': theme('fontWeight.semibold')
    }
  };

  addBase({
    body: {
      'background-color': theme('colors.background'),
      'font-family': theme('fontFamily.sans')
    },
    'a:focus': {
      outline: `${theme('spacing.1')} dashed ${theme('colors.tertiary')}`
    },
    'a:hover': {
      'text-decoration-color': theme('colors.tertiary'),
      ...textDecoration
    },
    // overrides for tailwindcss/forms
    ...formInputsOverrides,
    ...twFormOverride('select'),
    ...twFormOverride('select[multiple]'),
    ...twFormOverride('textarea'),
    ...twFormCheckboxOverride("[type='checkbox']"),
    ...twFormCheckboxOverride("[type='radio']"),
    ...formButtonOverrides
  });
});

const customComponentsPlugin = plugin(function ({ addComponents, theme }) {
  addComponents({
    // https://every-layout.dev/layouts/cluster/
    '.cluster': {
      '--space': theme('spacing.3'),
      // ↓ Suppress horizontal scrolling caused by the negative margin in some circumstances
      overflow: 'hidden'
    },
    '.cluster > *': {
      display: 'flex',
      'flex-wrap': 'wrap',
      // ↓ multiply by -1 to negate the halved value
      margin: 'calc(var(--space) / 2 * -1)'
    },
    '.cluster > * > *': {
      // ↓ half the value, because of the 'doubling up'
      margin: 'calc(var(--space) / 2)'
    },

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

const customUtilitiesPlugin = plugin(function ({ addUtilities, theme }) {
  addUtilities({
    '.fancy-outline': {
      outline: `${theme('spacing.1')} dashed ${theme('colors.tertiary')}`
    }
  });
});

// perform all @tailwindcss/typography overrides in tailwind.css, not here!
// https://github.com/tailwindlabs/tailwindcss-typography#customization
const typography = (theme) => {
  // console.log('=== SPACING ===', theme('spacing'));
  const headingOverrides = {
    color: theme('colors.headline'),
    'font-family': theme('fontFamily.serif').join(',')
  };

  // https://tailwindcss.com/docs/ring-width
  // https://tailwindcss.com/docs/ring-offset-width
  const ring4 =
    'var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width)) var(--tw-ring-color)';

  return {
    DEFAULT: {
      css: {
        h1: headingOverrides,
        h2: headingOverrides,
        h3: headingOverrides,
        h4: headingOverrides,
        h5: headingOverrides,
        h6: headingOverrides,
        // I don't like the quotations this plugin adds to the inline code
        'code::before': {
          content: '""'
        },
        'code::after': {
          content: '""'
        },
        a: {
          color: theme('colors.buttonText'),
          'font-weight': theme('fontWeight.semibold')
        },
        'a:hover': {
          'text-decoration-color': theme('colors.tertiary'),
          ...textDecoration
        },
        // override Prism.js blocks of code
        "pre[class^='language-']:hover": {
          '--tw-ring-color': theme('colors.tertiary'),
          ...ring4
        },
        // The heading-anchor class is outputted by markdown-it-anchor.
        '.heading-anchor': {
          'text-decoration': 'none'
        },
        // At the moment Tailwind does not have ::before and ::after classes, so
        // either I make this override here, or I add a new Tailwind plugin that
        // will allow me to use ::before and ::after pseudo-element variants in
        // the markup.
        // https://github.com/tailwindlabs/tailwindcss/discussions/2119
        // https://github.com/sgrowe/tailwind-pseudo-elements
        '.postslist > li::before': {
          content: '""'
        }
      }
    }
  };
};

module.exports = {
  darkMode: 'class', // false, 'media' or 'class'
  mode: 'jit',
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('./tailwind-debug-breakpoints'),
    baseOverridesPlugin,
    customComponentsPlugin,
    customUtilitiesPlugin
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
      mono: ['Source Code Pro', ...defaultTheme.fontFamily.mono],
      sans: ['Lato', ...defaultTheme.fontFamily.sans],
      serif: ['Nunito', ...defaultTheme.fontFamily.serif]
    }
  }
  // it should no longer be necessary to specify `variants` when using @tailwind/jit
  // https://tailwindcss.com/docs/just-in-time-mode
};
