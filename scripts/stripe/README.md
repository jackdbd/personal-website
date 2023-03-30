# Stripe scripts

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

List all active products in the Stripe **TEST** account:

```sh
node scripts/stripe/list-products.mjs -e test
```

## Prices

Create all prices in the Stripe **TEST** account, archiving existing ones:

```sh
npx tsm scripts/stripe/create-prices.ts -e test --cleanup
```

List all active prices in the Stripe **TEST** account:

```sh
node scripts/stripe/list-prices.mjs -e test
```

## Coupons and Promotion Codes

Create all coupons in the Stripe **TEST** account, deleting existing ones:

```sh
npx tsm scripts/stripe/create-coupons.ts -e test --cleanup
```

Create all promotion codes in the Stripe **TEST** account, archiving existing ones:

```sh
npx tsm scripts/stripe/create-promotion-codes.ts -e test --cleanup
```

List all coupons and promotion codes in the Stripe **TEST** account:

```sh
node scripts/stripe/list-coupons-and-promotion-codes.mjs -e test
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
