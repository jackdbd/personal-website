import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret, STRIPE_CONFIG } from '../utils.mjs'

const DEFAULT = {
  'stripe-environment': 'test'
}

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('node scripts/stripe/$0')
    .option('stripe-environment', {
      alias: 'e',
      describe: 'Stripe environment (live, test)',
      demandOption: false
    })
    .help('info')
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
    const url = `https://dashboard.stripe.com/${stripe_env}/products/${prod.id}`
    console.log(`${prod.type} '${prod.name}' ${url}`)
  }
}

main()
