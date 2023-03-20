import Stripe from 'stripe'
import { jsonSecret, STRIPE_CONFIG } from '../utils.mjs'

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

const main = async () => {
  const { api_key } = jsonSecret('stripe-test')
  const stripe = new Stripe(api_key, STRIPE_CONFIG)

  const PRODUCT_ID = 'prod_NYyqu8lUyywiYr'

  // I am not sure this can be done using the Node.js client library. I guess I
  // have to create a pay-what-you-want price from the Stripe dashboard.
  // https://stripe.com/docs/api/prices/create
  // https://stripe.com/docs/payments/checkout/pay-what-you-want
  // const price = await stripe.prices.create({
  //   active: true,
  //   currency: 'usd',
  //   custom_unit_amount: { minimum: null, maximum: null },
  //   metadata: {
  //     created_by,
  //     tags: 'code_review,freelancing'
  //   },
  //   nickname: 'pay what you want for code review',
  //   product: PRODUCT_ID,
  //   tax_behavior: 'inclusive' // i.e. VAT is included and must be deducted
  // })

  // console.log(`Stripe one-time price ${price_one_time.id} created`)

  const PRICE_ID = 'price_1MnqxaHrp8ADzt0f6Ey1t7y9'

  const plink = await stripe.paymentLinks.create({
    // after_completion: {
    //   hosted_confirmation: {
    //     custom_message: `Thank you!`
    //   },
    //   type: 'hosted_confirmation'
    // },
    allow_promotion_codes: false,
    automatic_tax: { enabled: false },
    billing_address_collection: 'required',
    // consent_collection: { terms_of_service: 'required' },
    // custom_message: '',
    customer_creation: 'always',
    // Max 2 items are allowed in custom_fields.
    // Only alphanumeric characters are allowed in 'key' and 'value'
    // Max 50 characters are allowed in each 'label'.
    custom_fields: [
      {
        dropdown: {
          options: [
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'Reddit', value: 'reddit' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'Personal website', value: 'website' },
            { label: 'Word of mouth', value: 'wordofmouth' },
            { label: 'Other', value: 'other' }
          ]
        },
        key: 'wheredidyouhearaboutme',
        label: {
          custom: 'Where did you hear about me?',
          type: 'custom'
        },
        optional: true,
        type: 'dropdown'
      }
    ],
    // invoice_creation: { enabled: true },
    line_items: [{ quantity: 1, price: PRICE_ID }],
    metadata: {
      created_by,
      tags: 'code_review,donation,freelancing'
    },
    submit_type: 'donate'
  })

  console.log(`Stripe payment link ${plink.id}`, plink.url)
}

main()
