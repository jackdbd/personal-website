// https://github.com/tailwindlabs/tailwindcss-typography#customization
const typography = (theme) => {
  // console.log('=== fontSize ===', theme('fontSize'));
  const headingOverrides = {
    color: theme('colors.heading'),
    'font-family': theme('fontFamily.serif').join(',')
  }

  // https://tailwindcss.com/docs/ring-width
  // https://tailwindcss.com/docs/ring-offset-width
  const ring4 =
    'var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width)) var(--tw-ring-color)'

  return {
    DEFAULT: {
      css: {
        fontSize: theme('fontSize.lg')[0],
        lineHeight: theme('fontSize.lg')[1],
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
        '.article-list > li::before': {
          content: '""'
        }
      }
    },
    sm: {
      css: {
        // fontSize: theme('fontSize.base')[0],
        // lineHeight: theme('fontSize.base')[1]
        fontSize: theme('fontSize.lg')[0],
        lineHeight: theme('fontSize.lg')[1]
      }
    }
  }
}

module.exports = typography
