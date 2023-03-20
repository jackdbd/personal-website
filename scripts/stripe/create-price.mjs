import Stripe from 'stripe'
import { jsonSecret, STRIPE_CONFIG } from '../utils.mjs'

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

const PRODUCT_ID = 'prod_NYy5WVxwRGCe9W'

const main = async () => {
  const { api_key } = jsonSecret('stripe-test')
  const stripe = new Stripe(api_key, STRIPE_CONFIG)

  // https://stripe.com/docs/api/prices/create
  // one time payment
  const price_one_time = await stripe.prices.create({
    active: true,
    currency: 'USD',
    metadata: {
      created_by,
      tags: 'freelancing,webperf'
    },
    nickname: 'promotional price for website audit',
    product: PRODUCT_ID,
    tax_behavior: 'inclusive', // i.e. VAT is included and must be deducted
    unit_amount: 150 // in cents
  })

  console.log(`Stripe one-time price ${price_one_time.id} created`)

  // 20 USD, 50% immediately, 50% after one week
  const price = await stripe.prices.create({
    active: true,
    currency: 'USD',
    metadata: {
      created_by,
      tags: 'freelancing,webperf'
    },
    nickname: 'installment plan for website audit',
    product: PRODUCT_ID,
    recurring: { interval: 'week', interval_count: 1 },
    tax_behavior: 'inclusive', // i.e. VAT is included and must be deducted
    unit_amount: 1000 // in cents
  })

  console.log(`Stripe recurring price ${price.id} created`)

  // customer_creation can only be used if the payment link does not contain any recurring prices
  const customer_creation = price.recurring ? undefined : 'always'
  // invoice_creation can only be used if the payment link does not contain any recurring prices
  const invoice_creation = price.recurring ? undefined : { enabled: true }

  // TODO: create N prices, and M payment links for each price?
  // With different payment links I could change locale, track the source of the payment, etc.

  // https://stripe.com/docs/api/payment_links/payment_links/create?lang=node
  // track the payment link using UTM parameters
  // https://stripe.com/docs/payment-links/url-parameters
  // after the payment
  // https://stripe.com/docs/payment-links/post-payment
  const payment_link = await stripe.paymentLinks.create({
    // after_completion: {
    //   type: 'redirect',
    //   url: 'URL?utm_medium=earned_email&utm_source=marketo&utm_campaign=campaign_a'
    // },
    // after_completion: {
    //   hosted_confirmation: { custom_message: 'Thanks!' },
    //   type: 'hosted_confirmation'
    // },
    // automatic_tax: { enabled: true },
    billing_address_collection: 'required',
    // consent_collection: { terms_of_service: 'required' },
    // custom_message: '',
    customer_creation,
    // Max 2 items are allowed in custom_fields.
    // Only alphanumeric characters are allowed in 'key' and 'value'
    // Max 50 characters are allowed in each 'label'.
    // https://stripe.com/docs/api/payment_links/payment_links/create?lang=node#create_payment_link-custom_fields
    custom_fields: [
      // {
      //   key: 'codicefiscale',
      //   label: { custom: 'Codice Fiscale', type: 'custom' },
      //   type: 'text'
      // },
      // {
      //   key: 'vat',
      //   label: { custom: 'VAT number', type: 'custom' },
      //   type: 'text'
      // },
      // {
      //   key: 'age',
      //   label: { custom: 'Your Age', type: 'custom' },
      //   type: 'numeric'
      // }
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
    invoice_creation,
    line_items: [{ quantity: 1, price: price.id }],
    metadata: {
      created_by,
      tags: 'freelancing,webperf'
    }
  })

  console.log(`Stripe payment link ${payment_link.id}`)
}

main()
