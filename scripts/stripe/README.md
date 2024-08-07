# Stripe scripts

Scripts I use to manage my Stripe account.

## Customers

Create all customers in the Stripe **TEST** account, deleting existing ones:

```sh
npx tsm scripts/stripe/create-customers.ts -e test --cleanup
```

## Products

Create all products in the Stripe **TEST** account, deleting/archiving existing ones:

```sh
npx tsm scripts/stripe/create-products.ts -e test --cleanup
```

Create products in the Stripe **LIVE** account, without altering existing ones:

```sh
npx tsm scripts/stripe/create-products.ts -e live
```

List all active products:

```sh
npx tsm scripts/stripe/list-products.ts -e test
npx tsm scripts/stripe/list-products.ts -e live
```

## Prices

Create prices in the Stripe **TEST** account, archiving existing ones:

```sh
npx tsm scripts/stripe/create-prices.ts -e test --cleanup
```

Create prices in the Stripe **LIVE** account, without altering existing ones:

```sh
npx tsm scripts/stripe/create-prices.ts -e live
```

List all active prices (`-e` can be `live` or `test`):

```sh
npx tsm scripts/stripe/list-prices.ts -e test
```

## Coupons

Create all coupons in the Stripe **TEST** account, deleting existing ones:

```sh
npx tsm scripts/stripe/create-coupons.ts -e test --cleanup
```

List all coupons and promotion codes (`-e` can be `live` or `test`):

```sh
npx tsm scripts/stripe/list-coupons-and-promotion-codes.ts -e test
```

## Promotion Codes

Create or update all promotion codes in the Stripe **TEST** account:

```sh
npx tsm scripts/stripe/renew-promotion-codes.ts -e test
```

You can trigger [this GitHub workflow](../../.github/workflows/stripe-promotion-codes.yaml) manually using the GitHub CLI:

```sh
gh workflow run "Stripe Promotion Codes"
```

List all coupons and promotion codes (`-e` can be `live` or `test`):

```sh
npx tsm scripts/stripe/list-coupons-and-promotion-codes.ts -e test
```

Deactivate all promotion codes:

```sh
npx tsm scripts/stripe/archive-promotion-codes.ts -e test
```

## Payment Links

Create all payment links in the Stripe **TEST** account, archiving existing ones:

```sh
npx tsm scripts/stripe/create-payment-links.ts -e test --cleanup
```

TODO: pay using a [Stripe test card](https://stripe.com/docs/testing).

## Subscriptions and Subscription Schedules

Create a subscription schedule in the Stripe **TEST** account:

```sh
npx tsm scripts/stripe/create-subscription-schedule.ts \
  -e test \
  --product-name 'DaaS' \
  --price-lookup-key 'daas_recurring_daily' \
  -c cus_NcewhMzoHLCxaG
```
