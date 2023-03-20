import Stripe from 'stripe'
import { jsonSecret, STRIPE_CONFIG } from '../utils.mjs'

const main = async () => {
  const { api_key } = jsonSecret('stripe-test')
  const stripe = new Stripe(api_key, STRIPE_CONFIG)

  // https://stripe.com/docs/api/products/list
  const params = {
    active: true
    // expand: [],
    // type: 'good'
    // type: 'service'
  }

  for await (const prod of stripe.products.list(params)) {
    const { id, name } = prod
    const url = `https://dashboard.stripe.com/test/products/${id}`
    console.log(`${name} ${url}`, prod)
  }
}

main()
