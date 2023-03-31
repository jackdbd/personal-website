import PrettyError from 'pretty-error'
import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret } from '../utils.mjs'
import { STRIPE_CONFIG } from './constants.js'
import { couponByName, priceByLookupKey } from './utils.js'

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
    .usage('tsm scripts/stripe/$0')
    .option('cleanup', {
      alias: 'c',
      boolean: true,
      describe:
        'Archive existing prices and payment links (prices and payment links cannot be deleted)',
      demandOption: false
    })
    .option('stripe-environment', {
      alias: 'e',
      describe: 'Stripe environment (live, test)',
      demandOption: false
    })
    .help('info')
    .default(DEFAULT).argv as Argv

  const { api_key } = jsonSecret('stripe-test')
  const stripe = new Stripe(api_key, STRIPE_CONFIG)

  // https://stripe.com/docs/search#query-fields-for-customers
  let search_result: Stripe.Response<
    Stripe.ApiSearchResult<Stripe.Customer | Stripe.Price>
  > = await stripe.customers.search({
    query: `email:"john@doe.com" AND name:"John Doe"`
  })
  if (search_result.data.length !== 1) {
    throw new Error(`There must be exactly one customer with name "John Doe"`)
  }
  const customer = search_result.data[0]

  const code_review_price = await priceByLookupKey(
    stripe,
    'standard_code_review'
  )
  const website_audit_price = await priceByLookupKey(
    stripe,
    'standard_website_audit'
  )

  const result = await stripe.coupons.list()
  if (result.has_more) {
    throw new Error(`There are more than ${result.data.length} coupons`)
  }
  const coupon = await couponByName(stripe, '25% off')

  const quote = await stripe.quotes.create({
    automatic_tax: { enabled: true },
    collection_method: 'send_invoice',
    // collection_method: 'charge_automatically',
    customer: customer.id,
    description: `Quote for John Doe: services A and B`,
    discounts: [{ coupon: coupon.id }],
    footer: 'This is the footer',
    // from_quote: { is_revision: true },
    header: 'This is the header',
    invoice_settings: { days_until_due: 30 },
    line_items: [
      { price: code_review_price.id, quantity: 1 },
      { price: website_audit_price.id, quantity: 2 }
    ],
    metadata: { created_by }
  })
  console.log(
    `[${created_by}] created ${quote.id} in status ${quote.status} '${quote.description}'`
  )
}

main().catch((err) => {
  console.log(pe.render(err))
})
