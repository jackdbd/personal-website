const budget = 'lighthouse/budgets/contact-mobile.json'

// https://github.com/GoogleChrome/lighthouse-ci/blob/v0.4.1/docs/configuration.md
const config = {
  ci: {
    assert: {
      budgetsFile: budget
    },
    collect: {
      numberOfRuns: 1,
      settings: {
        budgetsPath: budget,
        configPath: 'lighthouse/config/mobile.js',
        plugins: []
      }
    }
  }
}

module.exports = config
