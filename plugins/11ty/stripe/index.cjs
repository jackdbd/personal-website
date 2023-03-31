const makeDebug = require('debug')
const Stripe = require('stripe')
const { z } = require('zod')
const { paymentLinksByPriceLookupKey } = require('./utils.cjs')

const PREFIX = '[💰 11ty-plugin-stripe]'

const debug = makeDebug('eleventy-plugin-stripe:index')

const defaults = {
  stripeConfig: {}
}

// https://stripe.com/docs/api/prices/object#price_object-lookup_key
const stripe_price_lookup_key_schema = z.string().min(1).max(200)

const schema = z.object({
  apiKey: z.string().min(1),
  stripeConfig: z.any().default(defaults.stripeConfig)
})

const stripe = (eleventyConfig, providedOptions) => {
  const result = schema.safeParse(providedOptions)

  if (!result.success) {
    throw new Error(`${PREFIX} invalid configuration: ${result.error.message}`)
  }

  const { apiKey, stripeConfig } = result.data

  const matches = apiKey.match(/^sk_test_./)
  const is_test = matches ? true : false

  const client = new Stripe(apiKey, stripeConfig)

  eleventyConfig.addAsyncFilter('stripePaymentLinks', async (lookup_key) => {
    stripe_price_lookup_key_schema.parse(lookup_key)

    // My plugin is an alternative solution to the original Stripe buy button
    // https://stripe.com/docs/payment-links/share#embed-button
    const plinks = await paymentLinksByPriceLookupKey({
      stripe: client,
      is_test,
      lookup_key
    })

    return plinks
  })
  debug(`added async filter stripePaymentLinks`)
}

module.exports = { initArguments: {}, configFunction: stripe }
