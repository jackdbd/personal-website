import defDebug from 'debug'
import Stripe from 'stripe'
import { DEBUG_PREFIX, ERROR_PREFIX } from './constants.mjs'
import { plugin_options, stripe_price_lookup_key } from './schemas.mjs'
import { paymentLinksByPriceLookupKey } from './utils.mjs'

const debug = defDebug(`${DEBUG_PREFIX}:index`)

// TIP: give the plugin configuration function a name, so it can be easily
// spotted in EleventyErrorHandler.
export const stripePlugin = (eleventyConfig, options) => {
  const result = plugin_options.safeParse(options)
  if (!result.success) {
    throw new Error(
      `${ERROR_PREFIX} invalid configuration: ${result.error.message}`
    )
  }

  const { apiKey, stripeConfig } = result.data

  const matches = apiKey.match(/^sk_test_./)
  const is_test = matches ? true : false

  const client = new Stripe(apiKey, stripeConfig)

  eleventyConfig.addAsyncFilter('stripePaymentLinks', async (lookup_key) => {
    stripe_price_lookup_key.parse(lookup_key)

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
