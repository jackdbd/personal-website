import PrettyError from 'pretty-error'
import Stripe from 'stripe'
import yargs from 'yargs'
import { jsonSecret } from '../utils.mjs'
import { STRIPE_CONFIG } from './constants.js'
import { createPaymentMethodAndAttachToCustomer, pay } from './utils.js'

const pe = new PrettyError()

const splits = new URL(import.meta.url).pathname.split('/')
const created_by = splits[splits.length - 1]

// https://fauxid.com/fake-name-generator/
const REQUEST_BODIES: Stripe.CustomerCreateParams[] = [
  {
    name: 'Giacomo Debidda',
    description: 'Giacomo is an engineer',
    email: 'jackdebidda@gmail.com',
    address: {
      line1: 'Via XX Settembre, 184',
      postal_code: '55049',
      city: 'Viareggio',
      state: 'LU',
      country: 'IT'
    },
    metadata: {
      codice_fiscale: 'DBDGCM84D16G628W',
      codice_sdi: '0000000',
      created_by
    }
  },
  {
    name: 'Mario Rossi',
    description: 'Mario is an engineer',
    email: 'mario@rossi.com',
    address: {
      line1: 'Via XYZ, 123',
      line2: 'Interno 5/A',
      postal_code: '55049',
      city: 'Viareggio',
      state: 'LU',
      country: 'IT'
    },
    metadata: { codice_sdi: '1234567', created_by }
  },
  {
    name: 'Lugi Verdi',
    description: 'Luigi is a doctor',
    email: 'luigi@verdi.com',
    address: {
      line1: 'Via XYZ, 123',
      postal_code: '23123',
      city: 'Milano',
      state: 'MI',
      country: 'IT'
    },
    metadata: { codice_sdi: '7654321', created_by }
  },
  {
    name: 'John Doe',
    description: 'John is a attorney',
    email: 'john@doe.com',
    // https://stripe.com/docs/js/appendix/supported_locales
    preferred_locales: ['en-GB'],
    address: {
      line1: '42 Broadwick St',
      postal_code: 'W1F 7AE',
      city: 'London',
      country: 'GB'
    },
    metadata: { codice_sdi: 'XXXXXXX', created_by }
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
      describe: 'Delete existing customers before creating new ones',
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
    console.log(`[${created_by}] delete all existing customers`)
    // https://github.com/stripe/stripe-node#auto-pagination
    for await (const cus of stripe.customers.list()) {
      await stripe.customers.del(cus.id)
      console.log(`[${created_by}] deleted ${cus.id}`)
    }
    console.log(`[${created_by}] deleted all existing customers`)
  }

  console.log(
    `[${created_by}] create ${REQUEST_BODIES.length} customers on Stripe`
  )
  for (const body of REQUEST_BODIES) {
    const cus_created = await stripe.customers.create(body)
    console.log(
      `[${created_by}] created ${cus_created.id} (${cus_created.email})`
    )
    // delete some customers, so we have a few Stripe.DeletedCustomer resources
    // if (shouldBeDeleted(cus_created)) {
    //   const cus_deleted = await stripe.customers.del(cus_created.id)
    //   console.log(
    //     `[${created_by}] ${cus_deleted.id} (deleted? ${cus_deleted.deleted})`
    //   )
    //   // A Stripe.DeletedCustomer is still in Stripe, so a `retrieve` call does
    //   // not fail (but an `update` call would fail with error code `resource_missing`)
    // await stripe.customers.retrieve(cus_deleted.id)
    // }

    // if (cus_created.name === 'John Doe') {
    //   const { payment_method } = await createPaymentMethodAndAttachToCustomer(
    //     stripe,
    //     cus_created.id
    //   )
    //   const sss = await pay({})
    // }
  }
}

main().catch((err) => {
  console.log(pe.render(err))
})
