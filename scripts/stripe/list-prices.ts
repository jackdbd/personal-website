import Stripe from 'stripe'
import yargs from 'yargs'
import { STRIPE_CONFIG } from './constants.js'
import { defRenderTelegramErrorMessage, EMOJI, sendOutput } from '../utils.js'
import { apiKey } from './utils.js'

interface Argv {
  'include-archived': boolean
  'stripe-environment': 'live' | 'test'
}

const DEFAULT: Argv = {
  'include-archived': false,
  'stripe-environment': 'test'
}

const splits = new URL(import.meta.url).pathname.split('/')
const app_id = splits[splits.length - 1]
const app_version = '0.1.0'

const renderTelegramErrorMessage = defRenderTelegramErrorMessage({
  header: `<b>${EMOJI.Robot} List Stripe Prices</b>`,
  footer: `<i>Sent by ${app_id} (vers. ${app_version})</i>`
})

interface Price {
  active: boolean
  created: number
  id: string
  lookup_key: string | null
  nickname: string | null
  url: string
}

const renderTelegramMessage = ({
  prices,
  stripe_env
}: {
  prices: Price[]
  stripe_env: 'live' | 'test'
}) => {
  let s = `<b>${EMOJI.Robot} List Stripe Prices</b>`

  s = `${s}\n\nFound ${prices.length} prices in Stripe <code>${stripe_env}</code> environment.`

  const strings = prices.map((d, i) => {
    return `${i + 1}. <a href="${d.url}">${d.nickname || 'nickname not set'}</a>`
  })
  s = `${s}\n\n${strings.join('\n\n')}`

  s = `${s}\n\n<i>Message sent by: ${app_id} (vers. ${app_version})</i>`
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  return `${s}\n`
}

const listPrices = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('List prices in a Stripe account.\nUsage: npx tsm scripts/stripe/$0')
    .option('stripe-environment', {
      alias: 'e',
      describe: 'Stripe environment (live, test)',
      demandOption: false
    })
    .option('include-archived', {
      boolean: true,
      describe: 'Return also archived prices, not just active prices',
      demandOption: false
    })
    .help('info')
    .default(DEFAULT).argv as Argv

  const stripe_env = argv['stripe-environment']
  const stripe = new Stripe(apiKey(stripe_env), STRIPE_CONFIG)

  // https://stripe.com/docs/api/prices/list

  const params = argv['include-archived'] ? {} : { active: true }

  const prices: Price[] = []
  for await (const price of stripe.prices.list(params)) {
    const url =
      stripe_env === 'test'
        ? `https://dashboard.stripe.com/test/prices/${price.id}`
        : `https://dashboard.stripe.com/prices/${price.id}`

    prices.push({
      active: price.active,
      created: price.created,
      id: price.id,
      lookup_key: price.lookup_key,
      nickname: price.nickname,
      url
    })
  }
  return { prices, stripe_env }
}

listPrices()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    sendOutput(renderTelegramErrorMessage(err))
  })
