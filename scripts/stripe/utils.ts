import type Stripe from 'stripe'
import { PAYMENT_METHOD_VALID_CARD_NO_SCA_REQUEST_BODY } from './constants.js'

export const nowAndFutureUTC = (n: number) => {
  const now = new Date().toISOString()
  const date_utc = new Date(now)
  date_utc.setUTCDate(date_utc.getUTCDate() + n)
  return { future: date_utc.toISOString(), now }
}

export const expiresInDays = (n: number) => {
  const { future } = nowAndFutureUTC(n)
  // UNIX timestamp in seconds
  return Math.floor(new Date(future).getTime() / 1000.0)
}

/**
 * Create a payment method, attach it to the customer and update the invoice
 * settings of the customer.
 */
export const createPaymentMethodAndAttachToCustomer = async (
  stripe: Stripe,
  customer_id: string
) => {
  const pm = await stripe.paymentMethods.create(
    PAYMENT_METHOD_VALID_CARD_NO_SCA_REQUEST_BODY
  )

  const pm_attached = await stripe.paymentMethods.attach(pm.id, {
    customer: customer_id
  })

  const customer = await stripe.customers.update(customer_id, {
    invoice_settings: {
      default_payment_method: pm_attached.id
    }
  })

  return { customer, payment_method: pm_attached }
}

export interface PayConfig {
  amount: number
  cus: Stripe.Customer
  description: string
  name: string
  pm: Stripe.PaymentMethod
  stripe: Stripe
}

/**
 * Create a payment_intent and confirm it.
 */
export const pay = async ({
  amount,
  cus,
  description,
  name,
  pm,
  stripe
}: PayConfig) => {
  let desc = 'something'
  try {
    const product = await stripe.products.retrieve(description)
    desc = product.name
  } catch (err: any) {
    console.warn(`[${name}] ${err.message}`)
  }

  let pi: Stripe.PaymentIntent
  try {
    throw new Error(`todo`)
    // const req_body = reqBodyPaymentIntentFromKajabi({
    //   amount,
    //   customer_id: cus.id,
    //   description: desc,
    //   payment_method_id: pm.id
    // })
    // console.log(
    //   `[${name}] ${cus.email} wants to pay for ${desc} with ${pm.type} (${pm.id})`
    // )
    // pi = await stripe.paymentIntents.create({
    //   ...req_body,
    //   metadata: {
    //     ...req_body.metadata,
    //     created_by: name,
    //     created_at: new Date().toLocaleString('it-IT', LOCALE_STRING_OPTIONS)
    //   }
    // })
    // console.log(`[${name}] ${pi.id} created (status ${pi.status})`)
  } catch (err: any) {
    return { message: `[${name}] ${err.message}` }
  }

  try {
    // TODO: setup_future_usage
    const pi_confirmed = await stripe.paymentIntents.confirm(pi.id)
    console.log(`[${name}] ${pi.id} confirmed (status ${pi_confirmed.status})`)
    return { message: `[${name}] ${cus.email} paid for ${pi.description}` }
  } catch (err: any) {
    return { message: `[${name}] ${err.message}` }
  }
}

export const couponByName = async (stripe: Stripe, name: string) => {
  const res = await stripe.coupons.list()
  if (res.has_more) {
    throw new Error(`There are more than ${res.data.length} coupons`)
  }

  const data = res.data.filter((c) => c.name === name)
  if (data.length !== 1) {
    throw new Error(`There must be exactly one '${name}' coupon`)
  }
  return data[0]
}

/**
 * Retrieve a price by its name using the Stripe Search API.
 *
 * https://stripe.com/docs/search#search-query-language
 * https://stripe.com/docs/search#query-fields-for-prices
 */
export const priceByLookupKey = async (stripe: Stripe, lookup_key: string) => {
  // There are at least 2 ways to retrieve a price by its lookup_key
  // Option 1: use the Stripe Prices API and filter by lookup_key
  // const res = await stripe.prices.list({
  //   active: true,
  //   expand: ['product'],
  //   lookup_keys: [lookup_key]
  // })

  // Option 1: use the Stripe Search API
  const query = `active:"true" AND lookup_key:"${lookup_key}"`
  const res = await stripe.prices.search({
    query,
    expand: ['data.product']
  })
  if (res.data.length !== 1) {
    throw new Error(
      `There are ${res.data.length} prices matching query '${query}'. There must be exactly one price matching that query.`
    )
  }
  return res.data[0]
}

/**
 * Retrieve a product by its name using the Stripe Search API.
 *
 * https://stripe.com/docs/search#search-query-language
 * https://stripe.com/docs/search#query-fields-for-products
 */
export const productByName = async (stripe: Stripe, name: string) => {
  const query = `active:"true" AND name:"${name}"`
  const res = await stripe.products.search({ query })
  if (res.data.length !== 1) {
    throw new Error(
      `There are ${res.data.length} products matching query '${query}'. There must be exactly one product matching that query.`
    )
  }
  return res.data[0]
}
