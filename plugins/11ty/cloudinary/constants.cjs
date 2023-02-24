const DEBUG_PREFIX = '11ty-plugin-cloudinary'

const ERROR_MESSAGE_PREFIX = '[❌ 11ty-plugin-cloudinary] '

const DEFAULT = {
  cacheDirectory: '.cache-cloudinary',
  cacheDuration: '30d',
  cacheVerbose: false,
  classString: '',
  shouldLazyLoad: true,
  shouldThrowIfNoAlt: true,
  shouldThrowIfNoCaption: true
}

module.exports = { DEBUG_PREFIX, DEFAULT, ERROR_MESSAGE_PREFIX }
