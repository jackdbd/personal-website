const plugin = require('tailwindcss/plugin');

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

// overrides for @tailwindcss/forms
const tailwindFormsOverridesPlugin = plugin(function ({ addBase, theme }) {
  const twFormsOverride = (selector) => {
    return {
      [selector]: {
        '--tw-ring-color': theme('colors.tertiary'),
        'border-color': theme('colors.tertiary'),
        'border-radius': theme('borderRadius.lg'),
        ...shadowSm
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

  const twFormsCheckboxOverride = (selector) => {
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
    ].map(twFormsOverride)
  );

  const formButtonOverrides = {
    'form button': {
      '--tw-ring-color': theme('colors.secondary'),
      'background-color': theme('colors.button'),
      'border-radius': theme('borderRadius.lg'),
      color: theme('colors.buttonText'),
      'font-weight': theme('fontWeight.semibold'),
      padding: `${theme('padding.2')} ${theme('padding.3')}`
    },
    'form button[type="submit"]': {
      'text-transform': 'uppercase'
    },
    'form button:focus': {
      'border-color': theme('colors.secondary'),
      outline: 'none',
      ...ring4
    },
    'form button:hover': {
      ...ring4
    }
  };

  addBase({
    ...formInputsOverrides,
    ...twFormsOverride('select'),
    ...twFormsOverride('select[multiple]'),
    ...twFormsOverride('textarea'),
    ...twFormsCheckboxOverride("[type='checkbox']"),
    ...twFormsCheckboxOverride("[type='radio']"),
    'form label': {
      'font-weight': theme('fontWeight.semibold')
    },
    ...formButtonOverrides
  });
});

module.exports = tailwindFormsOverridesPlugin;
