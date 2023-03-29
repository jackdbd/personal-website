import PrettyError from 'pretty-error'
import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret } from '../utils.mjs'
import {
  STRIPE_CONFIG,
  PriceLookupKey,
  PriceUnitAmountInUSDCents
} from './constants.js'
import { productByName } from './utils.js'

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

/**
 * Prices
 *
 * lookup_key
 * Use this naming convention: <price_name>_<period>
 * For example: code_review_one_time, website_audit_one_time, retainer_fee_monthly, etc.
 *
 * tax_behavior
 * Must be 'exclusive' for all B2B sales (in Europe, USA, etc.)
 * Can be 'inclusive' for B2C sales in Europe
 *
 * unit_amount
 * In cents. So if currency is 'usd', 4999 means $49.99
 */

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('tsm scripts/stripe/$0')
    .option('cleanup', {
      alias: 'c',
      boolean: true,
      describe: 'Archive existing prices (prices cannot be deleted)',
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

  const code_review_prod = await productByName(stripe, 'Code Review')
  const consultation_prod = await productByName(stripe, 'Consultation')
  const daas_prod = await productByName(stripe, 'DaaS')
  const website_audit_prod = await productByName(stripe, 'Website Audit')

  const code_review_customer_chooses: Stripe.PriceCreateParams = {
    currency: 'usd',
    custom_unit_amount: {
      enabled: true,
      minimum: undefined,
      maximum: undefined,
      preset: undefined
    },
    lookup_key: PriceLookupKey.CodeReviewCustomerChooses,
    metadata: {
      created_by,
      tags: 'customer_chooses,freelancing,review'
    },
    nickname: 'pay whatever you want for code review',
    product: code_review_prod.id,
    tax_behavior: 'exclusive',
    transfer_lookup_key: true
  }

  const code_review_one_time: Stripe.PriceCreateParams = {
    currency: 'usd',
    lookup_key: PriceLookupKey.CodeReviewOneTime,
    metadata: {
      created_by,
      tags: 'freelancing,review'
    },
    nickname: 'one time price for code review',
    product: code_review_prod.id,
    tax_behavior: 'exclusive',
    transfer_lookup_key: true,
    unit_amount: PriceUnitAmountInUSDCents.CodeReviewOneTime
  }

  const consultation_customer_chooses: Stripe.PriceCreateParams = {
    currency: 'usd',
    custom_unit_amount: {
      enabled: true,
      minimum: undefined,
      maximum: undefined,
      preset: undefined
    },
    lookup_key: PriceLookupKey.ConsultationCustomerChooses,
    metadata: {
      created_by,
      tags: 'consulting,customer_chooses,freelancing'
    },
    nickname: 'pay whatever you want for consultation',
    product: consultation_prod.id,
    tax_behavior: 'exclusive',
    transfer_lookup_key: true
  }

  const consultation_one_time: Stripe.PriceCreateParams = {
    currency: 'usd',
    lookup_key: PriceLookupKey.ConsultationOneTime,
    metadata: {
      created_by,
      tags: 'consulting,freelancing'
    },
    nickname: 'one time price for consultation',
    product: consultation_prod.id,
    tax_behavior: 'exclusive',
    transfer_lookup_key: true,
    unit_amount: PriceUnitAmountInUSDCents.ConsultationOneTime
  }

  const daas_daily: Stripe.PriceCreateParams = {
    currency: 'usd',
    lookup_key: PriceLookupKey.DeveloperAsAServiceDaily,
    metadata: {
      created_by,
      tags: 'daas,freelancing,recurring'
    },
    nickname: 'recurring daily price for DaaS',
    product: daas_prod.id,
    recurring: { interval: 'day' },
    tax_behavior: 'exclusive',
    transfer_lookup_key: true,
    unit_amount: PriceUnitAmountInUSDCents.DeveloperAsAServiceDaily
  }

  const website_audit_one_time: Stripe.PriceCreateParams = {
    currency: 'usd',
    lookup_key: PriceLookupKey.WebsiteAuditOneTime,
    metadata: {
      created_by,
      tags: 'freelancing,webperf'
    },
    nickname: 'one time price for website audit',
    product: website_audit_prod.id,
    tax_behavior: 'exclusive',
    transfer_lookup_key: true,
    unit_amount: PriceUnitAmountInUSDCents.WebsiteAuditOneTime
  }

  // 20 USD, 50% immediately, 50% after one week
  // const website_audit_installments: Stripe.PriceCreateParams = {
  //   currency: 'usd',
  //   lookup_key: PriceLookupKey.WebsiteAuditInstallments,
  //   metadata: {
  //     created_by,
  //     tags: 'freelancing,webperf'
  //   },
  //   nickname: 'installment plan for website audit',
  //   product: website_audit_prod.id,
  //   recurring: { interval: 'week', interval_count: 1 },
  //   tax_behavior: 'inclusive',
  //   transfer_lookup_key: true,
  //   unit_amount: 1000 // in cents
  // }

  const request_bodies = [
    code_review_customer_chooses,
    code_review_one_time,
    consultation_customer_chooses,
    consultation_one_time,
    daas_daily,
    website_audit_one_time
  ]

  if (argv.cleanup) {
    console.log(`archive active prices`)
    for await (const price of stripe.prices.list({ active: true })) {
      await stripe.prices.update(price.id, { active: false })
      console.log(`archived price '${price.nickname}'`)
    }
    console.log(`archived previously active prices`)
  }

  console.log(`create ${request_bodies.length} prices on Stripe`)
  for (const body of request_bodies) {
    const price = await stripe.prices.create(body)
    const url = `https://dashboard.stripe.com/${stripe_env}/prices/${price.id}`
    console.log(`created price '${price.nickname}' ${url}`)
  }
}

main().catch((err) => {
  console.log(pe.render(err))
})
