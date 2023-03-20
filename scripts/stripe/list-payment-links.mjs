import Stripe from 'stripe'
import { jsonSecret, STRIPE_CONFIG } from '../utils.mjs'

const main = async () => {
  const { api_key } = jsonSecret('stripe-test')
  const stripe = new Stripe(api_key, STRIPE_CONFIG)

  // https://stripe.com/docs/api/payment_links/payment_links/list
  const params = {
    active: true
    // expand: ['data.custom_fields']
  }

  for await (const plink of stripe.paymentLinks.list(params)) {
    const { id, after_completion, custom_fields, custom_text } = plink
    const url = `https://dashboard.stripe.com/test/payment-links/${id}`
    console.log(`${id} ${url}`, plink)
    // if (custom_fields.length > 0 && custom_fields[0].dropdown) {
    //   console.log(custom_fields[0].dropdown)
    // }
  }
}

main()
