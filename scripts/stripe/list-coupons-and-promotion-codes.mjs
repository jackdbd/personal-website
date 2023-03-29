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

  const m = {}
  // https://stripe.com/docs/api/coupons/list
  for await (const coupon of stripe.coupons.list()) {
    const coupon_url = `https://dashboard.stripe.com/${stripe_env}/coupons/${coupon.id}`
    // console.log(`coupon '${coupon.name}' ${coupon_url}`)
    m[coupon.id] = { name: coupon.name, url: coupon_url, codes: [] }
    for await (const code of stripe.promotionCodes.list({
      coupon: coupon.id
    })) {
      const code_url = `https://dashboard.stripe.com/${stripe_env}/promotion_codes/${code.id}`
      // console.log(`  promotion code '${code.code}' ${code_url}`)
      m[coupon.id].codes.push({ code: code.code, url: code_url })
    }
  }
  console.log(`coupons and promotion codes`)
  console.log(JSON.stringify(m, null, 2))
}

main()
