const makeDebug = require('debug')

const debug = makeDebug('eleventy-plugin-stripe:utils')

/**
 * https://stripe.com/docs/api/payment_links/payment_links/list
 * https://stripe.com/docs/api/payment_links/line_items?lang=node
 */
const paymentLinksByPriceLookupKey = async ({
  stripe,
  is_test,
  lookup_key
}) => {
  debug(
    `retrieve payment links associated to price lookup_key '${lookup_key}' (Stripe ${
      is_test ? 'TEST' : 'LIVE'
    } mode)`
  )
  const plinks = []
  for await (const plink of stripe.paymentLinks.list({ active: true })) {
    const url = is_test
      ? `https://dashboard.stripe.com/test/payment-links/${plink.id}`
      : `https://dashboard.stripe.com/payment-links/${plink.id}`

    const line_items = []
    for await (const line_item of stripe.paymentLinks.listLineItems(plink.id)) {
      if (line_item.price.lookup_key === lookup_key) {
        line_items.push(line_item)
      }
    }

    if (line_items.length > 0) {
      debug(
        `payment link ${plink.id} is associated with price lookup_key '${lookup_key}' %O`,
        {
          pay: plink.url,
          edit: url,
          line_items,
          lookup_key
        }
      )
      plinks.push({ ...plink, line_items })
    } else {
      debug(
        `payment link ${plink.id} is NOT associated with price lookup_key '${lookup_key}'`
      )
    }
  }

  return plinks
}

module.exports = { paymentLinksByPriceLookupKey }
