import PrettyError from 'pretty-error'
import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret } from '../utils.js'
import { STRIPE_CONFIG } from './constants.js'

const pe = new PrettyError()

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

// https://stripe.com/docs/billing/taxes/tax-rates#creating-tax-rates-through-the-api
const REQUEST_BODIES: Stripe.TaxRateCreateParams[] = [
  {
    country: 'IT',
    description: 'VAT rate for books in Italy',
    display_name: 'VAT',
    inclusive: true,
    // jurisdiction: '',
    metadata: {
      created_by
    },
    percentage: 4,
    tax_type: 'vat'
  },
  {
    country: 'IT',
    description: 'Standard VAT rate in Italy',
    display_name: 'VAT',
    inclusive: true,
    metadata: {
      created_by
    },
    percentage: 22,
    tax_type: 'vat'
  },
  {
    country: 'DE',
    description: 'Standard VAT rate in Germany',
    display_name: 'VAT',
    inclusive: true,
    metadata: {
      created_by
    },
    percentage: 19,
    tax_type: 'vat'
  }
]

interface Argv {
  cleanup: boolean
  'stripe-environment': 'live' | 'test'
}

const DEFAULT: Argv = {
  cleanup: false,
  'stripe-environment': 'test'
}

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('tsm scripts/stripe/$0')
    .option('cleanup', {
      alias: 'c',
      boolean: true,
      describe: 'Archive existing tax rates (Tax rates cannot be deleted)',
      demandOption: false
    })
    .option('stripe-environment', {
      alias: 'e',
      describe: 'Stripe environment (live, test)',
      demandOption: false
    })
    .help('info')
    .default(DEFAULT).argv as Argv

  const { api_key } = jsonSecret('stripe-test')
  const stripe = new Stripe(api_key, STRIPE_CONFIG)

  if (argv.cleanup) {
    console.log(`[${created_by}] archive active tax rates`)
    for await (const tax_rate of stripe.taxRates.list({ active: true })) {
      await stripe.taxRates.update(tax_rate.id, { active: false })
      console.log(
        `[${created_by}] archived ${tax_rate.id} ${tax_rate.description}`
      )
    }
    console.log(`[${created_by}] archived previously active tax rates`)
  }

  console.log(
    `[${created_by}] create ${REQUEST_BODIES.length} tax rates on Stripe`
  )
  for (const body of REQUEST_BODIES) {
    const tax_rate = await stripe.taxRates.create(body)
    console.log(
      `[${created_by}] created ${tax_rate.id} ${tax_rate.description}`
    )
  }
}

main().catch((err) => {
  console.log(pe.render(err))
})
