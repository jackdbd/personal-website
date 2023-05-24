import PrettyError from 'pretty-error'
import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret, sendOutput } from '../utils.mjs'
import { STRIPE_CONFIG } from './constants.js'
import { createOrUpdatePromotionCode, expiresInDays } from './utils.js'

const pe = new PrettyError()

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

interface Argv {
  'expires-in-days': number
  'ignore-coupons': string[]
  'max-redemptions': number
  'stripe-environment': 'live' | 'test'
}

const DEFAULT: Argv = {
  'expires-in-days': 7,
  'ignore-coupons': ['5 USD off forever', 'Free'],
  'max-redemptions': 10,
  'stripe-environment': 'test'
}

// coupon to promotion code is a 1:N relationship
const COUPON_NAME_CODE_MAPPING: { [k: string]: string[] } = {
  Free: [],
  '25% off': ['TWITTER25OFF'],
  '50% off': [
    'LINKEDIN50OFF',
    'REDDITSLAVELABOUR50OFF',
    'REDDITSMALLBUSINESS50OFF',
    'TWITTER50OFF'
  ],
  '75% off': [],
  '80% off': ['REDDITSLAVELABOUR80']
}

interface PromoCode {
  name: string
  url: string
}

interface Result {
  message: string
  errors?: Error[]
  promo_code?: PromoCode
}

const renderTelegramMessage = (results: Result[]) => {
  const strings = results.map((d) => {
    if (d.promo_code) {
      return `<a href="${d.promo_code.url}">${d.promo_code.name}</a>`
    } else {
      return `Errors: ${d.errors?.map((err) => err.message)}`
    }
  })
  let s = `<b>Stripe promotion codes updated</b>`
  s = s.concat('\n\n')
  s = s.concat(strings.join('\n\n'))
  // s = s.concat(`<i>User-Agent: ${d.user_agent}</i>`)
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  s = s.concat('\n')
  return s
}

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('Renew Stripe promotion codes.\nUsage: npx tsm scripts/stripe/$0')
    .option('expires-in-days', {
      alias: 'd',
      default: DEFAULT['expires-in-days'],
      demandOption: false,
      describe: 'Expiration (in number of days)'
    })
    .option('ignore-coupons', {
      alias: 'i',
      array: true,
      default: DEFAULT['ignore-coupons'],
      demandOption: false,
      describe: `Ignore these coupons, don't create promotion codes for them (comma-separated list)`
    })
    .option('stripe-environment', {
      alias: 'e',
      choices: ['live', 'test'],
      default: DEFAULT['stripe-environment'],
      demandOption: false,
      describe: 'Stripe environment (live, test)'
    })
    .option('max-redemptions', {
      alias: 'r',
      default: DEFAULT['max-redemptions'],
      demandOption: false,
      describe:
        'Max redemptions (number of times the promotion code can be claimed)'
    })
    .help('info').argv as Argv

  const expires_in_days = argv['expires-in-days']
  const ignore_coupons = argv['ignore-coupons']
  const max_redemptions = argv['max-redemptions']
  const stripe_env = argv['stripe-environment']
  const { api_key } = jsonSecret(`stripe-${stripe_env}`)
  const stripe = new Stripe(api_key, STRIPE_CONFIG)
  console.log(`[${created_by}] operating on Stripe ${stripe_env.toUpperCase()}`)

  const expires_at = expiresInDays(expires_in_days)

  const codes_create_params: Stripe.PromotionCodeCreateParams[] = []

  const coupons: Stripe.Coupon[] = []
  for await (const coupon of stripe.coupons.list()) {
    coupons.push(coupon)

    if (!coupon.name) {
      throw new Error(
        `Stripe coupon ${coupon.id} has no name. Review your Stripe account and give this coupon a name.`
      )
    }

    const should_ignore =
      ignore_coupons.filter((s) => s === coupon.name).length > 0

    if (should_ignore) {
      console.log(`coupon '${coupon.name}' explicitly ignored`)
      continue
    }

    const code_names = COUPON_NAME_CODE_MAPPING[coupon.name]

    code_names.forEach((name: string) => {
      codes_create_params.push({
        code: name,
        coupon: coupon.id,
        expires_at,
        max_redemptions,
        metadata: { created_by }
        // restrictions: { first_time_transaction: true }
      })
    })
  }

  const results: Result[] = []
  for (const params of codes_create_params) {
    const result = await createOrUpdatePromotionCode(stripe, stripe_env, params)
    // console.log(params.code, result)
    results.push(result)
  }

  return results
}

main()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    console.log(pe.render(err))
  })
