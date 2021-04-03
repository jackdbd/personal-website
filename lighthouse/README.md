# Lighthouse & Lighthouse CI

This folder contains the [performance budgets](https://github.com/GoogleChrome/lighthouse/blob/master/docs/performance-budgets.md) enforced by the [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli), [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) CLI and [lighthouse-ci-action](https://github.com/treosh/lighthouse-ci-action), their config files, as well as the generated reports.

## Run Lighthouse CI locally

If you want to test Lighthouse CI locally (useful to check performance budget and configuration), install the Lighthouse CI CLI and any additional Lighthouse plugin:

```sh
npm install -g @lhci/cli
npm install -g lighthouse-plugin-field-performance
```

Run the Lighthouse CI CLI:

```sh
npm run lhci
```

View all Lighthouse & Lighthouse CI reports:

```sh
npm run lh:reports
```
