import fs from 'node:fs'
import path from 'node:path'
import Stripe from 'stripe'
import { jsonSecret, STRIPE_CONFIG } from '../utils.mjs'

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

const createWebsiteAudit = async ({ stripe }) => {
  const filepath = path.join(
    'assets',
    'goods-and-services',
    'website-audit-description.txt'
  )

  // https://stripe.com/docs/api/products/create
  const product = await stripe.products.create({
    active: true,
    // attributes: [],
    // caption: '',
    description: fs.readFileSync(filepath).toString(),
    // up to 8 URLs of images
    images: [
      `https://res.cloudinary.com/jackdbd/image/upload/v1677251218/iltirreno-js-execution-and-long-tasks_esvhzt.png`,
      `https://res.cloudinary.com/jackdbd/image/upload/v1677338989/iltirreno-waterfall-with-markers_ypuqxm.png`
    ],
    metadata: {
      created_by,
      tags: 'audit,freelancing,report,webperf'
    },
    name: 'Website Audit',
    // statement_descriptor can be up to 22 characters
    // Too long (33 characters): Debidda Giacomo VAT IT02600430462
    // Default (22 characters): www.giacomodebidda.com
    // statement_descriptor: 'www.giacomodebidda.com',
    // I think 'Consulting Services' is the most appropriate tax code for this service
    // https://stripe.com/docs/tax/tax-codes
    tax_code: 'txcd_20060048',
    type: 'service',
    // unit_label: 'seat',
    // A URL of a publicly-accessible webpage for this product.
    // Should I use the sales page of the product?
    // I don't know if - and where - this URL is displayed
    url: 'https://www.giacomodebidda.com/posts/performance-audit-of-an-italian-news-website/'
  })

  console.log(`created product ${product.id} ${product.name}`)
}

const createCodeReviewService = async ({ stripe }) => {
  const filepath = path.join(
    'assets',
    'goods-and-services',
    'code-review-description.txt'
  )

  // https://stripe.com/docs/api/products/create
  const product = await stripe.products.create({
    active: true,
    description: fs.readFileSync(filepath).toString(),
    // images: [],
    metadata: {
      created_by,
      tags: 'code_review,freelancing'
    },
    name: 'Code Review',
    // I think 'Consulting Services' is the most appropriate tax code for this service
    // https://stripe.com/docs/tax/tax-codes
    tax_code: 'txcd_20060048',
    type: 'service'
  })

  console.log(`created product ${product.id} ${product.name}`)
}

const main = async () => {
  const { api_key } = jsonSecret('stripe-test')
  const stripe = new Stripe(api_key, STRIPE_CONFIG)
  await createWebsiteAudit({ stripe })
  await createCodeReviewService({ stripe })
}

main()
