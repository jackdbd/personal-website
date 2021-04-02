// https://github.com/GoogleChrome/lighthouse-ci/blob/v0.4.1/docs/configuration.md#collect
const collect = {
  numberOfRuns: 1,
  settings: {
    budgetsPath: './lighthouse/budgets.json',
    configPath: './lighthouse/config/desktop.js',
    // configPath: './lighthouse/config/mobile.js',
    plugins: ['lighthouse-plugin-field-performance']
    // "skipAudits": ["redirects-http"],
  },
  staticDistDir: './_site',
  url: [
    'http://localhost/index.html',
    'http://localhost/blog/index.html',
    // 'http://localhost/contact/index.html',
    'http://localhost/projects/index.html'
  ]
};

const config = {
  ci: {
    assert: {
      budgetsFile: './lighthouse/budgets.json'
    },
    collect,
    upload: {
      // target: 'filesystem'
      target: 'temporary-public-storage'
    }
  }
};

module.exports = config;
