import defDebug from 'debug'
import Stripe from 'stripe'
import yargs from 'yargs'
import { defRenderTelegramErrorMessage, EMOJI, sendOutput } from '../utils.js'
import { STRIPE_CONFIG } from './constants.js'
import { apiKey } from './utils.js'

interface Argv {
  'stripe-environment': 'live' | 'test'
}

const DEFAULT: Argv = {
  'stripe-environment': 'test'
}

const debug = defDebug('stripe:list-promo-codes')

const splits = new URL(import.meta.url).pathname.split('/')
const app_id = splits[splits.length - 1]
const app_version = '0.1.0'

const renderTelegramErrorMessage = defRenderTelegramErrorMessage({
  header: `<b>${EMOJI.Robot} List Stripe Coupons & Promotion Codes</b>`,
  footer: `<i>Sent by ${app_id} (vers. ${app_version})</i>`
})

interface Coupon {
  codes: any[]
  name: string | null
  url: string
}

interface CouponsMap {
  [coupon_id: string]: Coupon
}

const renderTelegramMessage = ({
  coupons_map,
  stripe_env
}: {
  coupons_map: CouponsMap
  stripe_env: 'live' | 'test'
}) => {
  let s = `<b>${EMOJI.Robot} List Stripe Coupons & Promotion Codes</b>`

  const coupons = Object.values(coupons_map)
  s = `${s}\n\nFound ${coupons.length} coupons in Stripe <code>${stripe_env}</code> environment.`

  const strings = coupons.map((d, i) => {
    return `${i + 1}. <a href="${d.url}">${d.name || 'name not set'} (${d.codes.length} promo codes)</a>`
  })
  s = `${s}\n\n${strings.join('\n\n')}`

  s = `${s}\n\n<i>Message sent by: ${app_id} (vers. ${app_version})</i>`
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  return `${s}\n`
}

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage(
      'List coupons and promotion codes in a Stripe account.\nUsage: node scripts/stripe/$0'
    )
    .option('stripe-environment', {
      alias: 'e',
      describe: 'Stripe environment (live, test)',
      demandOption: false
    })
    .help('info')
    .default(DEFAULT).argv as Argv

  const stripe_env = argv['stripe-environment']
  const stripe = new Stripe(apiKey(stripe_env), STRIPE_CONFIG)

  const coupons_map: CouponsMap = {}
  // https://stripe.com/docs/api/coupons/list
  for await (const coupon of stripe.coupons.list()) {
    const coupon_url =
      stripe_env === 'test'
        ? `https://dashboard.stripe.com/test/coupons/${coupon.id}`
        : `https://dashboard.stripe.com/coupons/${coupon.id}`

    // console.log(`coupon '${coupon.name}' ${coupon_url}`)
    coupons_map[coupon.id] = { name: coupon.name, url: coupon_url, codes: [] }
    for await (const code of stripe.promotionCodes.list({
      coupon: coupon.id
    })) {
      const code_url =
        stripe_env === 'test'
          ? `https://dashboard.stripe.com/test/promotion_codes/${code.id}`
          : `https://dashboard.stripe.com/promotion_codes/${code.id}`
      debug(`promotion code '${code.code}' ${code_url}`)
      coupons_map[coupon.id].codes.push({ code: code.code, url: code_url })
    }
  }

  return { coupons_map, stripe_env }
}

main()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    sendOutput(renderTelegramErrorMessage(err))
  })
