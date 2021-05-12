/**
 * 11ty paired shortcodes
 * https://www.11ty.dev/docs/shortcodes/#paired-shortcodes
 */
const markdownIt = require('markdown-it')();

const callout = (content, type = 'warn') => {
  let calloutType = '';
  let emoji = '';
  switch (type) {
    case 'info': {
      calloutType = 'callout--info';
      emoji = 'ℹ️';
      break;
    }
    case 'tip': {
      calloutType = 'callout--tip';
      emoji = '💡';
      break;
    }
    case 'warn': {
      calloutType = 'callout--warn';
      emoji = '⚠️';
      break;
    }
    default: {
      throw new Error(`callout type not supported: ${type}`);
    }
  }
  return `<div class="callout ${calloutType}">
  <div class="callout__content">
  ${markdownIt.render(`${emoji} — ${content}`)}
  </div>
  </div>`;
};

module.exports = {
  callout
};
