import PrettyError from 'pretty-error'
import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret } from '../utils.js'
import { STRIPE_CONFIG } from './constants.js'

const pe = new PrettyError()

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

interface Argv {
  'stripe-environment': 'live' | 'test'
}

const DEFAULT: Argv = {
  'stripe-environment': 'test'
}

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage(
      'Archive all Stripe promotion codes.\nUsage: npx tsm scripts/stripe/$0'
    )
    .option('stripe-environment', {
      alias: 'e',
      choices: ['live', 'test'],
      default: DEFAULT['stripe-environment'],
      demandOption: false,
      describe: 'Stripe environment (live, test)'
    })
    .help('info').argv as Argv

  const stripe_env = argv['stripe-environment']
  const { api_key } = jsonSecret(`stripe-${stripe_env}`)
  const stripe = new Stripe(api_key, STRIPE_CONFIG)
  console.log(`[${created_by}] operating on Stripe ${stripe_env.toUpperCase()}`)

  console.log(`[${created_by}] archive active promotion codes`)

  for await (const code of stripe.promotionCodes.list({ active: true })) {
    await stripe.promotionCodes.update(code.id, { active: false })
    console.log(`[${created_by}] archived ${code.id} '${code.code}'`)
  }
  console.log(`[${created_by}] archived previously active promotion codes`)
}

main().catch((err) => {
  console.log(pe.render(err))
})
