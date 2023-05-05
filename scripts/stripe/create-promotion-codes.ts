import PrettyError from 'pretty-error'
import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret } from '../utils.mjs'
import { STRIPE_CONFIG } from './constants.js'
import { couponByName, expiresInDays } from './utils.js'

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
    .usage('Create Stripe promotion codes.\nUsage: npx tsm scripts/stripe/$0')
    .option('cleanup', {
      alias: 'c',
      boolean: true,
      describe: 'Delete existing Stripe coupons',
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

  const free = await couponByName(stripe, 'Free')
  const percent_80_off = await couponByName(stripe, '80% off')
  const percent_75_off = await couponByName(stripe, '75% off')
  const percent_50_off = await couponByName(stripe, '50% off')
  const percent_25_off = await couponByName(stripe, '25% off')

  const expires_at = expiresInDays(30)

  const codes: Stripe.PromotionCodeCreateParams[] = [
    {
      code: 'REDDITSLAVELABOUR80',
      coupon: percent_80_off.id,
      expires_at,
      max_redemptions: 10,
      metadata: { created_by }
      // restrictions: { first_time_transaction: true }
    },
    {
      code: 'REDDITSMALLBUSINESS50',
      coupon: percent_50_off.id,
      expires_at,
      max_redemptions: 15,
      metadata: { created_by }
    },
    {
      code: 'TWITTER10FIRST25OFF',
      coupon: percent_25_off.id,
      expires_at,
      max_redemptions: 10,
      metadata: { created_by }
    }
  ]

  if (argv.cleanup) {
    console.log(`[${created_by}] archive active promotion codes`)

    for await (const code of stripe.promotionCodes.list({ active: true })) {
      await stripe.promotionCodes.update(code.id, { active: false })
      console.log(`[${created_by}] archived ${code.id} '${code.code}'`)
    }
    console.log(`[${created_by}] archived previously active promotion codes`)
  }

  for (const body of codes) {
    const code = await stripe.promotionCodes.create(body)

    const url =
      stripe_env === 'test'
        ? `https://dashboard.stripe.com/test/promotion_codes/${code.id}`
        : `https://dashboard.stripe.com/promotion_codes/${code.id}`

    console.log(`[${created_by}] created '${code.code}' ${url}`)
  }
}

main().catch((err) => {
  console.log(pe.render(err))
})
