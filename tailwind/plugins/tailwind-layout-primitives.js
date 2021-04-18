const plugin = require('tailwindcss/plugin');

const tailwindLayoutPrimitivesPlugin = plugin(function ({
  addComponents,
  theme
}) {
  // https://every-layout.dev/layouts/cluster/
  const clusterLayout = {
    '.cluster': {
      '--space': theme('spacing.3'),

      // suppress horizontal scrolling caused by the negative margin in some
      // circumstances (not sure which ones...)
      overflow: 'hidden'
    },
    // a cluster should be applied as a parent of a <ul> element. The class for
    // the <ul> element is to achieve a high CSS specificity (0,2,1) so no
    // !important are necessary.
    '.cluster > .cluster-children-wrapper': {
      'align-items': 'var(--align-items, center)',
      display: 'flex',
      'flex-wrap': 'wrap',
      'justify-content': 'flex-start',
      // multiply by -1 to negate the halved value
      margin: 'calc(var(--space) / 2 * -1)'
    },
    '.cluster > .cluster-children-wrapper > li': {
      // half the value, because of the 'doubling up'
      margin: 'calc(var(--space) / 2)',
      padding: 0
    },
    // @tailwindcss/typography sets a li::before element. I definitely don't
    // want that in a layout primitive like .cluster
    '.cluster > .cluster-children-wrapper > li::before': {
      content: 'none'
    }
  };

  // https://every-layout.dev/layouts/center/
  const centerLayout = {
    '.center': {
      '--space': theme('spacing.3'),

      'box-sizing': 'content-box',
      'max-width': '60ch',
      'margin-left': 'auto',
      'margin-right': 'auto',
      'padding-left': 'var(--space)',
      'padding-right': 'var(--space)'
    }
  };

  const stackLayout = {
    '.stack': {
      '--space': theme('spacing.3'),

      display: 'flex',
      'flex-direction': 'column',
      'justify-content': 'flex-start'
    },
    '.stack > *': {
      'margin-top': 0,
      'margin-bottom': 0
    },
    '.stack > * + *': {
      'margin-top': 'var(--space)'
    }
  };

  addComponents({
    ...centerLayout,
    ...clusterLayout,
    ...stackLayout
  });
});

module.exports = tailwindLayoutPrimitivesPlugin;
