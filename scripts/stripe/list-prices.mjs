import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret, STRIPE_CONFIG } from '../utils.js'

const DEFAULT = {
  'include-archived': false,
  'stripe-environment': 'test'
}

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('List prices in a Stripe account.\nUsage: node scripts/stripe/$0')
    .option('stripe-environment', {
      alias: 'e',
      describe: 'Stripe environment (live, test)',
      demandOption: false
    })
    .option('include-archived', {
      boolean: true,
      describe: 'Return also archived prices, not just active prices',
      demandOption: false
    })
    .help('help')
    .default(DEFAULT).argv

  const stripe_env = argv['stripe-environment']
  const { api_key } = jsonSecret(`stripe-${stripe_env}`)
  const stripe = new Stripe(api_key, STRIPE_CONFIG)
  console.log(`operating on Stripe ${stripe_env.toUpperCase()}`)

  // https://stripe.com/docs/api/prices/list
  const params = argv.includeArchived ? {} : { active: true }

  for await (const price of stripe.prices.list(params)) {
    const url =
      stripe_env === 'test'
        ? `https://dashboard.stripe.com/test/prices/${price.id}`
        : `https://dashboard.stripe.com/prices/${price.id}`

    console.log(`price ${price.id}`, {
      active: price.active,
      created: price.created,
      nickname: price.nickname,
      lookup_key: price.lookup_key,
      url
    })
  }
}

main().catch((err) => {
  console.error(err.message)
})
