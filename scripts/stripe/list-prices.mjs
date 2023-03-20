import Stripe from 'stripe'
import { jsonSecret, STRIPE_CONFIG } from '../utils.mjs'

const main = async () => {
  const { api_key } = jsonSecret('stripe-test')
  const stripe = new Stripe(api_key, STRIPE_CONFIG)

  // https://stripe.com/docs/api/prices/list
  const params = {
    active: true
  }

  for await (const price of stripe.prices.list(params)) {
    const { id, nickname } = price
    const url = `https://dashboard.stripe.com/test/prices/${id}`
    console.log(`${nickname} ${url}`, price)
  }
}

main()
