module.exports = {
  ci: {
    assert: {
      budgetsFile: './web-perf/budget.json'
    },
    collect: {
      numberOfRuns: 3,
      settings: {
        // This setting makes the budgets section appear in the Lighthouse report itself
        budgetsPath: './web-perf/budgets.json'
      },
      staticDistDir: './_site',
      url: ['http://localhost:8080']
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
