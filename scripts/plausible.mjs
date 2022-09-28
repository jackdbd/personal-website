#!/usr/bin/env zx

import { makeClient } from '@jackdbd/plausible-client'
import { makeClient as makeStatsClient } from '@jackdbd/plausible-client/stats'
import { makeEleventyFetch } from '@jackdbd/plausible-client/fetch-clients/eleventy-fetch'
import { breakdown } from '@jackdbd/plausible-client/stats/api'
import { jsonSecret } from './utils.mjs'

const main = async () => {
  const { api_key: apiKey, site_id: siteId } = jsonSecret('plausible')
  const credentials = { apiKey, siteId }
  const options = {
    // cache of JSON responses from the Plausible API
    directory: '.cache-plausible-json-responses',
    duration: '5s',
    verbose: true
  }

  // client for all Plausible APIs
  const plausible = makeClient(credentials, options)
  const results = await plausible.stats.breakdown()
  console.log('results', results)

  // client just for the Plausible stats API
  const stats = makeStatsClient(credentials, options)
  const sameResults = await stats.breakdown()
  console.log('sameResults', sameResults)

  // no client, just a fetch
  const fetchClient = makeEleventyFetch(apiKey, options)
  const sameResultsOnceMore = await breakdown({ fetchClient, siteId })
  console.log('sameResultsOnceMore', sameResultsOnceMore)
}

main()
