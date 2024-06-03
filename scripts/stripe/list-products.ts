import defDebug from 'debug'
import Stripe from 'stripe'
import yargs from 'yargs'
import { defRenderTelegramErrorMessage, EMOJI, sendOutput } from '../utils.js'
import { STRIPE_CONFIG } from './constants.js'
import { apiKey } from './utils.js'

interface Argv {
  'stripe-environment': 'live' | 'test'
}

interface Product {
  name: string
  type: string
  url: string
}

const debug = defDebug('stripe:list-products')

const DEFAULT: Argv = {
  'stripe-environment': 'test'
}

const splits = new URL(import.meta.url).pathname.split('/')
const app_id = splits[splits.length - 1]
const app_version = '0.1.0'

const renderTelegramErrorMessage = defRenderTelegramErrorMessage({
  header: `<b>${EMOJI.Robot} List Stripe Products</b>`,
  footer: `<i>Sent by ${app_id} (vers. ${app_version})</i>`
})

const renderTelegramMessage = ({
  products,
  stripe_env
}: {
  products: Product[]
  stripe_env: 'live' | 'test'
}) => {
  let s = `<b>${EMOJI.Robot} List Stripe Products</b>`

  s = `${s}\n\nFound ${products.length} products in Stripe <code>${stripe_env}</code> environment.`

  const strings = products.map((d, i) => {
    return `${i + 1}. <a href="${d.url}">${d.name}</a>`
  })
  s = `${s}\n\n${strings.join('\n\n')}`

  s = `${s}\n\n<i>Message sent by: ${app_id} (vers. ${app_version})</i>`
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  return `${s}\n`
}

const listProducts = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage(
      'List active products in a Stripe account.\nUsage: npx tsm scripts/stripe/$0'
    )
    .option('stripe-environment', {
      alias: 'e',
      describe: 'Stripe environment (live, test)',
      demandOption: false
    })
    .help('info')
    .default(DEFAULT).argv as Argv

  const stripe_env = argv['stripe-environment']
  const stripe = new Stripe(apiKey(stripe_env), STRIPE_CONFIG)

  // https://stripe.com/docs/api/products/list
  const params = {
    active: true
    // type: 'good'
    // type: 'service'
  }

  const products: Product[] = []
  for await (const prod of stripe.products.list(params)) {
    const url =
      stripe_env === 'test'
        ? `https://dashboard.stripe.com/test/products/${prod.id}`
        : `https://dashboard.stripe.com/products/${prod.id}`

    const product = { name: prod.name, type: prod.type, url }
    debug(`${prod.type} '${prod.name}' ${url}`)
    products.push(product)
  }

  return { products, stripe_env }
}

listProducts()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    sendOutput(renderTelegramErrorMessage(err))
  })
