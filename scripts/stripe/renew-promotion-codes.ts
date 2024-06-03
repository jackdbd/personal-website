import defDebug from 'debug'
import Stripe from 'stripe'
import yargs from 'yargs'
import { defRenderTelegramErrorMessage, EMOJI, sendOutput } from '../utils.js'
import { STRIPE_CONFIG } from './constants.js'
import { apiKey, createOrUpdatePromotionCode, expiresInDays } from './utils.js'

const debug = defDebug('stripe:renew-promotion-codes')

const splits = new URL(import.meta.url).pathname.split('/')
const app_id = splits[splits.length - 1]
const app_version = '0.1.0'

const renderTelegramErrorMessage = defRenderTelegramErrorMessage({
  header: `<b>${EMOJI.Robot} Renew Stripe Coupons & Promotion Codes</b>`,
  footer: `<i>Sent by ${app_id} (vers. ${app_version})</i>`
})

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
  errors?: Error[]
  message: string
  promo_code?: PromoCode
  stripe_env: string
}

const renderTelegramMessage = (results: Result[]) => {
  let s = `<b>${EMOJI.Robot} Renew Stripe Coupons & Promotion Codes</b>`

  s = `${s}\n\n${results.length} <a href="https://docs.stripe.com/api/promotion_codes">promotion codes</a> were renovated in the Stripe <code>${results[0].stripe_env}</code> environment.`

  const strings = results.map((d, i) => {
    if (d.promo_code) {
      return `${i + 1}. <a href="${d.promo_code.url}">${d.promo_code.name}</a>`
    } else {
      return `Errors: ${d.errors?.map((err) => err.message)}`
    }
  })
  s = `${s}\n\n${strings.join('\n\n')}`

  s = `${s}\n\n<i>Message sent by: ${app_id} (vers. ${app_version})</i>`
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  return `${s}\n`
}

const renewCouponsAndPromotionCodes = async () => {
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
  const api_key = apiKey(stripe_env)
  debug(`instantiate client for Stripe ${stripe_env.toUpperCase()}`)
  const stripe = new Stripe(api_key, STRIPE_CONFIG)

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
      debug(`coupon '${coupon.name}' explicitly ignored`)
      continue
    }

    const code_names = COUPON_NAME_CODE_MAPPING[coupon.name]

    code_names.forEach((name: string) => {
      codes_create_params.push({
        code: name,
        coupon: coupon.id,
        expires_at,
        max_redemptions,
        metadata: { created_by: app_id }
        // restrictions: { first_time_transaction: true }
      })
    })
  }

  const results: Result[] = []
  for (const params of codes_create_params) {
    const result = await createOrUpdatePromotionCode(stripe, stripe_env, params)
    results.push({ ...result, stripe_env })
  }

  return results
}

renewCouponsAndPromotionCodes()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    sendOutput(renderTelegramErrorMessage(err))
  })
