# Lighthouse & Lighthouse CI

This folder contains the [performance budgets](https://github.com/GoogleChrome/lighthouse/blob/master/docs/performance-budgets.md) enforced by the [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli) and [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci), their config files, as well as the generated reports.

If you want to test Lighthouse CI locally, install the CLI and any additional Lighthouse plugins:

```sh
npm install -g @lhci/cli
npm install -g lighthouse-plugin-field-performance
```

Run the Lighthouse CI CLI:

```sh
lhci autorun

# which is equivalent to:
lhci collect
lhci assert
lhci upload
```

## Reference

- [lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)
- [lighthouse-plugin-field-performance](https://github.com/treosh/lighthouse-plugin-field-performance)
