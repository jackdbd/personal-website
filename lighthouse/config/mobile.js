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
    maxWaitForFcp: constants.maxWaitForFcp,
    maxWaitForLoad: constants.maxWaitForLoad,
    // lighthouse:default is mobile by default
    // Skip the h2 audit so it doesn't lie to us. See https://github.com/GoogleChrome/lighthouse/issues/6539
    skipAudits: ['uses-http2']
  },
  audits: ['metrics/first-contentful-paint-3g'],
  categories: {
    performance: {
      auditRefs: [{ id: 'first-contentful-paint-3g', weight: 0 }]
    }
  }
}

module.exports = config
