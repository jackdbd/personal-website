const { getBearerToken, makeAnalyticsClient } = require('./analytics');
const { buildSW } = require('./build-sw');

module.exports = {
  buildSW,
  getBearerToken,
  makeAnalyticsClient
};
