// https://github.com/GoogleChrome/lighthouse-ci/blob/v0.4.1/docs/configuration.md#assert
// either use preset + assertions, or budgetsFile (performance budgets)
const assert = {
  // preset: 'lighthouse:recommended',
  // assertions: {
  //   'color-contrast': 'off',
  //   'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
  //   'render-blocking-resources': 'off'
  // }
  // https://github.com/GoogleChrome/lighthouse-ci/blob/v0.4.1/docs/configuration.md#budgetsfile
  budgetsFile: './lighthouse/budgets.json'
};

// https://github.com/GoogleChrome/lighthouse-ci/blob/v0.4.1/docs/configuration.md#collect
const collect = {
  numberOfRuns: 1,
  settings: {
    budgetsPath: './lighthouse/budgets.json',
    configPath: './lighthouse/config/desktop.js'
  },
  staticDistDir: './_site',
  url: [
    'http://localhost:8080',
    'http://localhost:8080/blog',
    'http://localhost:8080/contact',
    'http://localhost:8080/posts/12-years-of-fires-in-sardinia',
    'http://localhost:8080/projects'
  ]
};

// https://github.com/GoogleChrome/lighthouse-ci/blob/v0.4.1/docs/configuration.md#upload
const upload = {
  target: 'filesystem',
  outputDir: './lighthouse/reports/'
};

const config = {
  ci: {
    assert,
    collect,
    upload
  }
};

module.exports = config;
