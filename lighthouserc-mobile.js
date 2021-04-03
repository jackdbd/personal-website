// https://github.com/GoogleChrome/lighthouse-ci/blob/v0.4.1/docs/configuration.md
const config = {
  ci: {
    assert: {
      budgetsFile: 'lighthouse/budgets.json'
    },
    collect: {
      numberOfRuns: 1,
      settings: {
        budgetsPath: 'lighthouse/budgets.json',
        configPath: 'lighthouse/config/mobile.js',
        plugins: []
      }
    }
  }
};

module.exports = config;
