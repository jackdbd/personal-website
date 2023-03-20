import Stripe from 'stripe'
import { jsonSecret, STRIPE_CONFIG } from '../utils.mjs'

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

const CUSTOMER_ID = 'cus_MOWVHIgpz1iked'
const PRICE_ID = 'price_1MnqFoHrp8ADzt0fxE8gtZhs'

const main = async () => {
  const { api_key } = jsonSecret('stripe-test')
  const stripe = new Stripe(api_key, STRIPE_CONFIG)

  // https://stripe.com/docs/api/subscription_schedules/create
  const schedule = await stripe.subscriptionSchedules.create({
    customer: CUSTOMER_ID,
    end_behavior: 'cancel',
    phases: [
      {
        collection_method: 'charge_automatically',
        description: 'installment payment for website audit',
        items: [
          {
            price: PRICE_ID,
            quantity: 1
          }
        ],
        iterations: 2,
        metadata: { created_by, tags: 'freelancing,installments,webperf' }
      }
    ],
    start_date: 'now'
  })

  console.log(`Stripe subscription schedule ${schedule.id} created`)
}

main()
