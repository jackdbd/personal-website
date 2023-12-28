import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret, STRIPE_CONFIG } from '../utils.js'

const DEFAULT = {
  'stripe-environment': 'test'
}

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage(
      'List active products in a Stripe account.\nUsage: node scripts/stripe/$0'
    )
    .option('stripe-environment', {
      alias: 'e',
      describe: 'Stripe environment (live, test)',
      demandOption: false
    })
    .help('help')
    .default(DEFAULT).argv

  const stripe_env = argv['stripe-environment']
  const { api_key } = jsonSecret(`stripe-${stripe_env}`)
  const stripe = new Stripe(api_key, STRIPE_CONFIG)
  console.log(`operating on Stripe ${stripe_env.toUpperCase()}`)

  // https://stripe.com/docs/api/products/list
  const params = {
    active: true
    // type: 'good'
    // type: 'service'
  }

  for await (const prod of stripe.products.list(params)) {
    const url =
      stripe_env === 'test'
        ? `https://dashboard.stripe.com/test/products/${prod.id}`
        : `https://dashboard.stripe.com/products/${prod.id}`
    console.log(`${prod.type} '${prod.name}' ${url}`)
  }
}

main().catch((err) => {
  console.error(err.message)
})
