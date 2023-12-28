import PrettyError from 'pretty-error'
import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret } from '../utils.js'
import { STRIPE_CONFIG, PriceLookupKey } from './constants.js'
import { priceByLookupKey } from './utils.js'

const pe = new PrettyError()

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

interface Argv {
  cleanup: boolean
  'stripe-environment': 'live' | 'test'
}

const DEFAULT: Argv = {
  cleanup: false,
  'stripe-environment': 'test'
}

const FOOTER_IT = `
Operazione in franchigia IVA e non soggetta a ritenuta d'acconto effettuata ai sensi dell'art. 1, commi da 54 a 89 della Legge n. 190/2014 – Regime forfettario.

Imposta di bollo assolta in modo virtuale.
`

const FOOTER_UE = `
Operazione ai sensi dell'art. 7 ter D.P.R. 633/72 - Reverse Charge - Servizi e altri casi.

Operazione effettuata ai sensi dell'art. 7-ter del D.P.R. 633/72.
`

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('npx tsm scripts/stripe/$0')
    .option('cleanup', {
      alias: 'c',
      boolean: true,
      describe:
        'Archive existing payment links (payment links cannot be deleted)',
      demandOption: false
    })
    .option('stripe-environment', {
      alias: 'e',
      describe: 'Stripe environment (live, test)',
      demandOption: false
    })
    .help('info')
    .default(DEFAULT).argv as Argv

  const stripe_env = argv['stripe-environment']
  const { api_key } = jsonSecret(`stripe-${stripe_env}`)
  const stripe = new Stripe(api_key, STRIPE_CONFIG)
  console.log(`operating on Stripe ${stripe_env.toUpperCase()}`)

  // https://dashboard.stripe.com/settings/billing/invoice
  // https://stripe.com/docs/api/accounts
  // const account = await stripe.accounts.retrieve('acct_1JQxUAHrp8ADzt0f')

  const code_review_customer_chooses = await priceByLookupKey(
    stripe,
    PriceLookupKey.CodeReviewCustomerChooses
  )
  const code_review_one_time = await priceByLookupKey(
    stripe,
    PriceLookupKey.CodeReviewOneTime
  )
  const consultation_customer_chooses = await priceByLookupKey(
    stripe,
    PriceLookupKey.ConsultationCustomerChooses
  )
  const consultation_one_time = await priceByLookupKey(
    stripe,
    PriceLookupKey.ConsultationOneTime
  )
  const daas_recurring_daily = await priceByLookupKey(
    stripe,
    PriceLookupKey.DeveloperAsAServiceDaily
  )
  const website_audit_one_time = await priceByLookupKey(
    stripe,
    PriceLookupKey.WebsiteAuditOneTime
  )

  const prices = [
    code_review_customer_chooses,
    code_review_one_time,
    consultation_customer_chooses,
    consultation_one_time,
    daas_recurring_daily,
    website_audit_one_time
  ]

  if (argv.cleanup) {
    console.log(`archive active payment links`)
    for await (const plink of stripe.paymentLinks.list({ active: true })) {
      await stripe.paymentLinks.update(plink.id, { active: false })
      console.log(`archived ${plink.id} ${plink.url}`)
    }
    console.log(`archived previously active payment links`)
  }

  // We could also create N payment links for each price
  console.log(`create ${prices.length} payment links on Stripe`)
  for (const price of prices) {
    // We have product.name because we use `expand: ['data.product']` when
    // retrieving the price
    const prod_name = (price.product as Stripe.Product).name

    // customer_creation can only be used if the payment link does NOT contain
    // any recurring prices
    const customer_creation = price.recurring ? undefined : 'always'

    const custom_fields: Stripe.PaymentLinkCreateParams.CustomField[] = []
    if (prod_name === 'Code Review') {
      custom_fields.push({
        key: 'repourl',
        label: { custom: 'Repository to review', type: 'custom' },
        type: 'text'
      })
    }
    if (prod_name === 'Website Audit') {
      custom_fields.push({
        key: 'auditurl',
        label: { custom: 'Website to audit', type: 'custom' },
        type: 'text'
      })
    }

    custom_fields.push({
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
    })

    let allow_promotion_codes = true
    let custom_text: Stripe.PaymentLinkCreateParams.CustomText | undefined =
      undefined
    if (price.lookup_key?.indexOf('customer_chooses') !== -1) {
      // promotion codes are not allowed when the price has `custom_unit_amount`
      allow_promotion_codes = false
      // custom_text = { submit: { message: 'Donate' } }
    }
    if (price.lookup_key?.indexOf('recurring') !== -1) {
      // I don't want to allow promotion codes for recurring prices (at least for now)
      allow_promotion_codes = false
    }

    // invoice_creation can only be used if the payment link does NOT contain
    // any recurring prices
    // https://stripe.com/docs/payments/checkout/post-payment-invoices
    let invoice_creation:
      | Stripe.PaymentLinkCreateParams.InvoiceCreation
      | undefined = undefined
    if (price.recurring) {
      invoice_creation = undefined
    } else {
      invoice_creation = {
        enabled: true,
        invoice_data: {
          // account_tax_ids: [], // Tax ID associated to my VAT number
          custom_fields: [
            { name: 'codice_fiscale', value: '-' },
            { name: 'codice_sdi', value: 'XXXXXXX' }
          ],
          description: `Invoice for product ${prod_name}`,
          footer: FOOTER_IT,
          metadata: { created_by }
          // rendering_options: { amount_tax_display: 'include_inclusive_tax' }
        }
      }
    }

    // TODO: create N prices, and M payment links for each price?
    // With different payment links I could change locale, track the source of the payment, etc.
    // https://stripe.com/docs/api/payment_links/payment_links/create?lang=node
    // track the payment link using UTM parameters
    // https://stripe.com/docs/payment-links/url-parameters
    // after the payment
    // https://stripe.com/docs/payment-links/post-payment
    const plink = await stripe.paymentLinks.create({
      after_completion: {
        hosted_confirmation: { custom_message: 'Thanks!' },
        type: 'hosted_confirmation'
      },
      allow_promotion_codes,
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      // consent_collection: { terms_of_service: 'required' },
      // custom_message: '',
      customer_creation,
      // Max 2 items are allowed in custom_fields.
      // Only alphanumeric characters are allowed in 'key' and 'value'
      // Max 50 characters are allowed in each 'label'.
      // https://stripe.com/docs/api/payment_links/payment_links/create?lang=node#create_payment_link-custom_fields
      custom_fields,
      custom_text,
      invoice_creation,
      line_items: [{ quantity: 1, price: price.id }],
      metadata: {
        created_by,
        tags: 'freelancing'
      },
      tax_id_collection: { enabled: true }
    })

    const url =
      stripe_env === 'test'
        ? `https://dashboard.stripe.com/test/payment-links/${plink.id}`
        : `https://dashboard.stripe.com/payment-links/${plink.id}`

    console.log(`created payment link for price '${price.nickname}'`, {
      url,
      buy: plink.url,
      promo_reddit: `${plink.url}?prefilled_promo_code=REDDITSLAVELABOUR80`,
      promo_twitter: `${plink.url}?prefilled_promo_code=TWITTER10FIRST25OFF`
    })
  }
}

main().catch((err) => {
  console.log(pe.render(err))
})
