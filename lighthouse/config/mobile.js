const constants = require('./constants')

const emulatedUserAgent =
  'Mozilla/5.0 (Linux; Android 7.0; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4420.0 Mobile Safari/537.36 Chrome-Lighthouse'

// Screen/viewport emulation
// With the default configuration, Lighthouse emulates a mobile device, so there
// is nothing to configure here.

// Network and CPU throttling/simulation
// https://github.com/GoogleChrome/lighthouse/blob/95ae481e23b96a4fecd23910fd912f5fd5dceac4/docs/throttling.md#the-mobile-network-throttling-preset
// With the default configuration, Lighthouse emulates a slow 4G connection on a
// mobile device, so there is nothing to configure here.
// https://github.com/GoogleChrome/lighthouse/blob/v6.4.1/lighthouse-core/config/constants.js#L59

// https://github.com/GoogleChrome/lighthouse/blob/master/docs/configuration.md
// https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/lr-mobile-config.js
const config = {
  extends: 'lighthouse:default',
  settings: {
    emulatedUserAgent,
    onlyCategories: ['performance'],
    maxWaitForFcp: constants.maxWaitForFcp,
    maxWaitForLoad: constants.maxWaitForLoad,
    onlyAudits: ['first-meaningful-paint']
  }
}

module.exports = config
