const { red } = require('tailwindcss/colors');
const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: 'media', // false, 'media' or 'class'
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
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
        // black: colors.black,
        blue: colors.lightBlue,
        current: 'currentColor',
        // gray: colors.coolGray,
        green: colors.emerald,
        highlighted: '#fff2a8',
        indigo: colors.indigo,
        lime: colors.lime,
        // orange: colors.orange,
        // pink: colors.pink,
        // purple: colors.violet,
        // red: colors.rose,
        // teal: colors.teal,
        transparent: 'transparent',
        'twitter-blue': '#1da1f2'
        // white: colors.white,
        // yellow: colors.amber
      },
      screens: {
        '3xl': '1920px'
      },
      // override some typography plugin defaults
      typography: {
        DEFAULT: {
          css: {
            color: '#333', // https://www.colorhexa.com/333333
            // color: 'green',
            // a: {
            //   color: '#3182ce',
            //   'font-weight': 'bold',
            //   '&:hover': {
            //     'background-color': '#fff2a8',
            //     color: '#333'
            //   }
            // },
            // code: {
            //   border: '1px solid lightgray',
            //   'border-radius': '.25rem',
            //   padding: '2px 4px',
            //   margin: '0 2px'
            // },
            // 'code::after': {
            //   content: ''
            // },
            // 'code::before': {
            //   content: ''
            // },
            h1: {
              'font-family': 'var(--font-family-headline)',
              // 'font-family': 'var(--font-family-body)',
              // 'font-family': 'var(--font-family-code)',
              'margin-bottom': '0.15em',
              'margin-top': '0.75em !important'
            },
            // h2: {
            //   'font-family': 'var(--font-family-headline)'
            // },
            h3: {
              'font-family': 'var(--font-family-headline)'
            },
            h4: {
              'font-family': 'var(--font-family-headline)'
            },
            h5: {
              'font-family': 'var(--font-family-headline)'
            },
            h6: {
              'font-family': 'var(--font-family-headline)'
            }
            // hr: {
            //   'margin-top': '2em'
            // },
            // 'ol.postslist > li': {
            //   'padding-left': 0
            // },
            // 'ol.postslist > li::before': {
            //   content: "''"
            // },
            // 'ol.postslist > li h2': {
            //   'margin-bottom': 0
            // },
            // 'ol.postslist > li p': {
            //   'margin-bottom': 0
            // },
            // '.contact-form h2': {
            //   margin: 0
            // }
          }
        }
        // sm: {
        //   css: {
        //     h1: {
        //       'margin-bottom': '0.15em',
        //       'margin-top': '0.75em !important'
        //     },
        //     hr: {
        //       'margin-top': '2em'
        //     },
        //     'ol.postslist > li': {
        //       'padding-left': 0
        //     },
        //     '.contact-form h2': {
        //       margin: 0
        //     }
        //   }
        // },
        // lg: {
        //   css: {
        //     h1: {
        //       'margin-bottom': '0.15em',
        //       'margin-top': '0.75em !important'
        //     },
        //     hr: {
        //       'margin-top': '2em'
        //     },
        //     'ol.postslist > li': {
        //       'padding-left': 0
        //     },
        //     '.contact-form h2': {
        //       margin: 0
        //     }
        //   }
        // },
        // xl: {
        //   css: {
        //     h1: {
        //       'margin-bottom': '0.15em',
        //       'margin-top': '0.75em !important'
        //     },
        //     hr: {
        //       'margin-top': '2em'
        //     },
        //     '.contact-form h2': {
        //       margin: 0
        //     }
        //   }
        // }
      }
    },
    fontFamily: {
      sans: ['Lato', 'sans-serif'],
      serif: ['Nunito', 'serif']
    },
    fontSize: {
      // xs: '0.75rem',
      // sm: '0.875rem',
      // base: '1rem',
      // lg: '1.125rem',
      // xl: '1.25rem',
      // '2xl': '1.5rem',
      // '3xl': '1.875rem',
      // '4xl': '2.25rem',
      // '5xl': '3rem',
      // '6xl': '4rem'
    }
  },
  variants: {
    extend: {
      backgroundColor: ['focus-visible', 'active', 'group-focus'],
      // opacity: ['responsive', 'first', 'hover', 'focus'],
      ringColor: ['focus-visible'],
      ringOffsetColor: ['focus-visible'],
      ringOffsetWidth: ['focus-visible'],
      ringWidth: ['focus-visible'],
      textColor: ['focus-visible', 'active', 'group-focus']
    }
  }
};
