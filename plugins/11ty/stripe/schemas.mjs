import { z } from 'zod'
import { DEFAULT_STRIPE_CONFIG } from './constants.mjs'

// https://stripe.com/docs/api/prices/object#price_object-lookup_key
export const stripe_price_lookup_key = z.string().min(1).max(200)

export const plugin_options = z.object({
  // optional, so it can be set with an environment variable
  apiKey: z.string().min(1).optional(),

  stripeConfig: z.any().default(DEFAULT_STRIPE_CONFIG)
})
