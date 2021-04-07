const plugin = require('tailwindcss/plugin');

// color, backgroundColor: pick one of the colors from the Tailwind palette
// prefix: the prefix you want to use in your code. E.g. with prefix = debug you
// will have to use `debug-bg`, `debug-text`.
// https://tailwindcss.com/docs/customizing-colors#color-palette-reference

// TODO: decide on the API. It's probably better to let the user add only a
// single class in the markup and to configure the plugin to show text color,
// background color, etc using plugin options.
// Pick a good class name, maybe debug-breakpoints. debug-screens is already
// taken. I don't think it makes sense to use the same name.
// https://github.com/jorenvanhee/tailwindcss-debug-screens

const debugBreakpointsPlugin = plugin.withOptions(function (options) {
  const {
    backgroundColor = 'blue',
    color = 'red',
    outlineColor = 'green',
    showBackgroundColor = true,
    showOutline = true
  } = options || {};
  const pre = 'debug'; // prefix is a Tailwind function, so I avoid using it.
  return function ({ addUtilities, theme }) {
    // Make a `PRE-bg` utility class for this screen breakpoint.
    const bgUtility = ([screen, minWidth], i) => {
      const shade = (i + 1) * 100;
      const col = `${theme(`colors.${backgroundColor}.${shade}`)} !important`;
      return {
        [`@media(min-width: ${minWidth})`]: {
          [`.${pre}-bg`]: {
            'background-color': col
          }
        }
      };
    };

    // Make a `PRE-screen` utility class for this screen breakpoint.
    const screenUtility = ([screen, minWidth], i) => {
      return {
        [`@media(min-width: ${minWidth})`]: {
          [`.${pre}-screen::after`]: {
            content: `"screen: ${screen}"`,
            'font-weight': theme('fontWeight.semibold'),
            position: 'absolute',
            right: '0.25em',
            bottom: '0.25em'
          }
        }
      };
    };

    // Make a `PRE-text` utility class for this screen breakpoint.
    const textUtility = ([screen, minWidth], i) => {
      const shade = (i + 1) * 100;
      return {
        [`@media(min-width: ${minWidth})`]: {
          [`.${pre}-text`]: {
            color: `${theme(`colors.${color}.${shade}`)} !important`
          }
        }
      };
    };

    // Make a `PRE-outline` utility class for this screen breakpoint.
    const outlineUtility = ([screen, minWidth], i) => {
      const shade = (i + 1) * 100;
      const col = `${theme(`colors.${outlineColor}.${shade}`)}`;
      return {
        [`@media(min-width: ${minWidth})`]: {
          [`.${pre}-outline`]: {
            outline: `1px solid ${col} !important`
          }
        }
      };
    };

    const breakpoints = Object.entries(theme('screens'));
    addUtilities([
      ...[showBackgroundColor ? breakpoints.map(bgUtility) : []],
      ...breakpoints.map(screenUtility),
      ...breakpoints.map(textUtility),
      ...[showOutline ? breakpoints.map(outlineUtility) : []]
    ]);
  };
});

module.exports = debugBreakpointsPlugin;
