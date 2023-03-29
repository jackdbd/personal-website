import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret, STRIPE_CONFIG } from '../utils.mjs'

// const splits = new URL(import.meta.url).pathname.split('/')
// const prefix = splits[splits.length - 1]

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

  // https://stripe.com/docs/api/prices/list
  const params = {
    active: true
  }

  for await (const price of stripe.prices.list(params)) {
    const { id, nickname, lookup_key } = price
    const url = `https://dashboard.stripe.com/${stripe_env}/prices/${id}`
    console.log({ nickname, url, lookup_key }, price)
  }
}

main()
