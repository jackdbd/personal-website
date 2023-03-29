import fs from 'node:fs'
import path from 'node:path'
import PrettyError from 'pretty-error'
import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret } from '../utils.mjs'
import { STRIPE_CONFIG } from './constants.js'

const pe = new PrettyError()

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

const dirpath = path.join('assets', 'ads')

const STATEMENT_DESCRIPTOR = 'www.giacomodebidda.com'

/**
 * Products
 *
 * attributes
 * available only for products that have `type: 'good'`
 *
 * caption
 * available only for products that have `type: 'good'`
 *
 * images
 * Up to 8. Less than 2MB each. Host them on Cloudinary
 *
 * tax_code
 * I think 'Consulting Services' is the most appropriate tax code for my services
 * https://stripe.com/docs/tax/tax-codes
 *
 * statement_descriptor
 * Can be up to 22 characters
 * Too long (33 characters): Debidda Giacomo VAT IT02600430462
 * Default (22 characters): www.giacomodebidda.com
 *
 */

const CODE_REVIEW: Stripe.ProductCreateParams = {
  description: fs
    .readFileSync(path.join(dirpath, 'stripe-code-review-description.txt'))
    .toString(),
  images: [],
  metadata: {
    contract_template_en:
      'link to english version of the contract for this service',
    contract_template_it:
      'link to italian version of the contract for this service',
    created_by,
    tags: 'freelancing,review'
  },
  name: 'Code Review',
  statement_descriptor: STATEMENT_DESCRIPTOR,
  tax_code: 'txcd_20060048',
  type: 'service'
  // TODO: add URL to the sales page of the product, when I have one
  // url: 'https://www.giacomodebidda.com/services/code-review/'
}

const PAID_CONSULTATION: Stripe.ProductCreateParams = {
  description: fs
    .readFileSync(
      path.join(dirpath, 'stripe-paid-consultation-description.txt')
    )
    .toString(),
  images: [],
  metadata: {
    contract_template_en:
      'link to english version of the contract for this service',
    contract_template_it:
      'link to italian version of the contract for this service',
    created_by,
    tags: 'consulting,freelancing'
  },
  name: 'Consultation',
  statement_descriptor: STATEMENT_DESCRIPTOR,
  tax_code: 'txcd_20060048',
  type: 'service'
  // TODO: add URL to the sales page of the product, when I have one
  // url: 'https://www.giacomodebidda.com/services/paid-consultation/'
}

const DEVELOPER_AS_A_SERVICE: Stripe.ProductCreateParams = {
  description: fs
    .readFileSync(
      path.join(dirpath, 'stripe-developer-as-a-service-description.txt')
    )
    .toString(),
  // Pick a better profile picture
  images: [
    'https://res.cloudinary.com/jackdbd/image/upload/v1599389496/profile-pic_k8mn6r.jpg'
  ],
  metadata: {
    contract_template_en:
      'link to english version of the contract for this service',
    contract_template_it:
      'link to italian version of the contract for this service',
    created_by,
    tags: 'freelancing,retainer'
  },
  name: 'DaaS',
  statement_descriptor: STATEMENT_DESCRIPTOR,
  tax_code: 'txcd_20060048',
  type: 'service'
  // TODO: add URL to the sales page of the product, when I have one
  // url: 'https://www.giacomodebidda.com/services/developer-as-a-service/'
}

const WEBSITE_AUDIT: Stripe.ProductCreateParams = {
  description: fs
    .readFileSync(path.join(dirpath, 'stripe-website-audit-description.txt'))
    .toString(),
  images: [
    'https://res.cloudinary.com/jackdbd/image/upload/v1677251218/iltirreno-js-execution-and-long-tasks_esvhzt.png',
    'https://res.cloudinary.com/jackdbd/image/upload/v1677338989/iltirreno-waterfall-with-markers_ypuqxm.png'
  ],
  metadata: {
    contract_template_en:
      'link to english version of the contract for this service',
    contract_template_it:
      'link to italian version of the contract for this service',
    created_by,
    tags: 'audit,freelancing,report,webperf'
  },
  name: 'Website Audit',
  statement_descriptor: STATEMENT_DESCRIPTOR,
  tax_code: 'txcd_20060048',
  type: 'service'
  // TODO: add URL to the sales page of the product, when I have one
  // url: 'https://www.giacomodebidda.com/services/website-audit/'
}

const PRODUCTS = [
  CODE_REVIEW,
  PAID_CONSULTATION,
  DEVELOPER_AS_A_SERVICE,
  WEBSITE_AUDIT
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
    .usage('npx tsm scripts/stripe/$0')
    .option('cleanup', {
      alias: 'c',
      boolean: true,
      describe:
        'Delete existing products that have no price, or archive the ones that have at least one price',
      demandOption: true
    })
    .option('stripe-environment', {
      alias: 'e',
      describe: 'Stripe environment (live, test)',
      demandOption: true
    })
    .help('info')
    .default(DEFAULT).argv as Argv

  const stripe_env = argv['stripe-environment']
  const { api_key } = jsonSecret(`stripe-${stripe_env}`)
  const stripe = new Stripe(api_key, STRIPE_CONFIG)
  console.log(`operating on Stripe ${stripe_env.toUpperCase()}`)

  if (argv.cleanup) {
    console.log(`delete/archive active products`)
    for await (const prod of stripe.products.list({ active: true })) {
      try {
        await stripe.products.del(prod.id)
        console.log(`deleted ${prod.id} '${prod.name}'`)
      } catch (err) {
        await stripe.products.update(prod.id, { active: false })
        console.log(`archived ${prod.id} '${prod.name}'`)
      }
    }
    console.log(`deleted/archived previously active products`)
  }

  console.log(`create ${PRODUCTS.length} products on Stripe`)
  for (const body of PRODUCTS) {
    const prod = await stripe.products.create(body)
    const url = `https://dashboard.stripe.com/${stripe_env}/products/${prod.id}`
    console.log(`created '${prod.name}' ${url}`)
  }
}

main().catch((err) => {
  console.log(pe.render(err))
})
