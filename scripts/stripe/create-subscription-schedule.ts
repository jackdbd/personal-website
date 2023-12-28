import PrettyError from 'pretty-error'
import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret } from '../utils.js'
import { STRIPE_CONFIG, PriceLookupKey } from './constants.js'
import { priceByLookupKey, productByName } from './utils.js'

const pe = new PrettyError()

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

interface Argv {
  'customer-id': string
  'price-lookup-key': string
  'product-name': string
  'stripe-environment': 'live' | 'test'
}

const DEFAULT: Partial<Argv> = {
  'stripe-environment': 'test'
}

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('npx tsm scripts/stripe/$0')
    .option('customer-id', {
      alias: 'c',
      describe: 'Stripe customer ID',
      demandOption: true
    })
    .option('price-lookup-key', {
      describe: 'Stripe price lookup_key',
      demandOption: true
    })
    .option('product-name', {
      describe: 'Stripe product name',
      demandOption: true
    })
    .option('stripe-environment', {
      alias: 'e',
      describe: 'Stripe environment (live, test)',
      demandOption: false
    })
    .help('info')
    .default(DEFAULT).argv as Argv

  const stripe_env = argv['stripe-environment']
  const { api_key } = jsonSecret(`stripe-${stripe_env}`)
  const stripe = new Stripe(api_key, STRIPE_CONFIG)
  console.log(`operating on Stripe ${stripe_env.toUpperCase()}`)

  const prod = await productByName(stripe, argv['product-name'])
  const price = await priceByLookupKey(stripe, argv['price-lookup-key'])

  // N iterations with proration_behavior: 'none' => N-1 payments
  const iterations = 3

  if (!price.recurring) {
    throw new Error(`Price ${price.id} is not a recurring price`)
  }

  const n_times = price.recurring.interval_count
  const period = price.recurring.interval
  const description = `Subscription to ${prod.name} (${n_times} time/s a ${period}, ${iterations} payments in total)`

  const customer = argv['customer-id']
  // https://stripe.com/docs/api/subscription_schedules/create
  const schedule = await stripe.subscriptionSchedules.create({
    customer,
    end_behavior: 'cancel',
    phases: [
      {
        // application_fee_percent: 10,
        automatic_tax: { enabled: true },
        collection_method: 'charge_automatically',
        description,
        // all prices in phases.items must be recurring prices
        items: [
          {
            price: price.id,
            quantity: 1
          }
        ],
        // Since we set proration_behavior: 'none', we add 1 to the desired iterations
        // See this video for an explanation:
        // https://youtu.be/7z8mncrjq24?t=978
        iterations: iterations + 1,
        metadata: { created_by },
        proration_behavior: 'none'
      }
    ],
    start_date: 'now'
  })

  const url = `https://dashboard.stripe.com/${stripe_env}/subscriptions/${schedule.subscription}`

  console.log(`Stripe subscription schedule created`, {
    subscription_schedule_id: schedule.id,
    subscription_id: schedule.subscription,
    subscription_url: url,
    customer,
    product: prod.name
  })
}

main().catch((err) => {
  console.log(pe.render(err))
})
