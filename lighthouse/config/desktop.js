const constants = require('./constants')

const emulatedUserAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4420.0 Safari/537.36 Chrome-Lighthouse'

// Screen/viewport emulation
// https://github.com/GoogleChrome/lighthouse/blob/95ae481e23b96a4fecd23910fd912f5fd5dceac4/docs/emulation.md
// https://github.com/GoogleChrome/lighthouse/blob/051d34d8bbac9163d3fd423724ea9f1d48736f33/lighthouse-cli/cli-flags.js#L145
const screenEmulation = {
  deviceScaleFactor: 1,
  disabled: false,
  height: 940,
  mobile: false,
  width: 1350
}

// Network and CPU throttling/simulation
// https://github.com/GoogleChrome/lighthouse/blob/95ae481e23b96a4fecd23910fd912f5fd5dceac4/docs/throttling.md
// The configuration down below represents a "broadband" connection type, which
// corresponds to "Dense 4G 25th percentile" in this document:
// https://docs.google.com/document/d/1-p4HSp42REEA5-jCBVB6PqQcVhI1nQIblBCNKhPJUXg/
// See here for different throttling configurations:
// https://github.com/GoogleChrome/lighthouse/blob/777bf1147fd0f6aca16ffefde1350bf6297476d4/lighthouse-core/config/constants.js
const throttling = {
  cpuSlowdownMultiplier: 1,
  downloadThroughputKbps: 0,
  requestLatencyMs: 0, // 0 means unset
  rttMs: 40, // Round Trip Time, in ms
  throughputKbps: 10 * 1024, // 10 Mbps
  uploadThroughputKbps: 0
}

// https://github.com/GoogleChrome/lighthouse/blob/master/docs/configuration.md
// https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/lr-desktop-config.js
module.exports = {
  extends: 'lighthouse:default',
  settings: {
    emulatedUserAgent,
    formFactor: 'desktop',
    maxWaitForFcp: constants.maxWaitForFcp,
    maxWaitForLoad: constants.maxWaitForLoad,
    screenEmulation,
    // Skip the h2 audit so it doesn't lie to us. See https://github.com/GoogleChrome/lighthouse/issues/6539
    skipAudits: ['uses-http2'],
    throttling
  }
}
