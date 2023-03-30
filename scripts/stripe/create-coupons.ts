import PrettyError from 'pretty-error'
import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret } from '../utils.mjs'
import { STRIPE_CONFIG } from './constants.js'

const pe = new PrettyError()

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

interface Argv {
  cleanup: boolean
  'stripe-environment': 'live' | 'test'
}

const DEFAULT: Argv = {
  cleanup: false,
  'stripe-environment': 'test'
}

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('npx tsm scripts/stripe/$0')
    .option('cleanup', {
      alias: 'c',
      boolean: true,
      describe: 'Delete existing coupons',
      demandOption: false
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
  console.log(`[${created_by}] operating on Stripe ${stripe_env.toUpperCase()}`)

  const coupons: Stripe.CouponCreateParams[] = [
    {
      // applies_to: [], // product IDs
      duration: 'once',
      metadata: { created_by },
      name: 'Free',
      percent_off: 100
    },
    {
      duration: 'once',
      metadata: { created_by },
      name: '80% off',
      percent_off: 80
    },
    {
      duration: 'once',
      metadata: { created_by },
      name: '75% off',
      percent_off: 75
    },
    {
      duration: 'once',
      metadata: { created_by },
      name: '50% off',
      percent_off: 50
    },
    {
      duration: 'once',
      metadata: { created_by },
      name: '25% off',
      percent_off: 25
    },
    {
      amount_off: 500, // in cents
      currency: 'USD',
      duration: 'forever',
      metadata: { created_by },
      name: '5 USD off forever'
    }
  ]

  if (argv.cleanup) {
    console.log(`[${created_by}] delete coupons`)
    for await (const c of stripe.coupons.list()) {
      await stripe.coupons.del(c.id)
      console.log(`[${created_by}] deleted ${c.id} '${c.name}'`)
    }
  }

  console.log(`[${created_by}] create ${coupons.length} coupons on Stripe`)

  for (const body of coupons) {
    const coupon = await stripe.coupons.create(body)
    const url = `https://dashboard.stripe.com/${stripe_env}/coupons/${coupon.id}`
    console.log(`[${created_by}] created '${coupon.name}' ${url}`)
  }
}

main().catch((err) => {
  console.log(pe.render(err))
})
