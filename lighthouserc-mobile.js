const collect = {
  numberOfRuns: 1,
  settings: {
    budgetsPath: './lighthouse/budgets.json',
    configPath: './lighthouse/config/mobile.js'
  },
  staticDistDir: './_site',
  url: [
    'https://epic-benz-a3f006.netlify.app/',
    'https://epic-benz-a3f006.netlify.app/blog',
    'https://epic-benz-a3f006.netlify.app/contact'
  ]
};

// https://github.com/GoogleChrome/lighthouse-ci/blob/v0.4.1/docs/configuration.md
const config = {
  ci: {
    assert: {
      budgetsFile: './lighthouse/budgets.json'
    },
    collect,
    upload: {
      target: 'filesystem',
      outputDir: './lighthouseci/'
    }
  }
};

module.exports = config;
