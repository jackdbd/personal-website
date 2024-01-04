const { AssetCache } = require('@11ty/eleventy-fetch')
const { v2: cloudinary } = require('cloudinary')
const makeDebug = require('debug')
const { DEBUG_PREFIX, ERROR_MESSAGE_PREFIX } = require('./constants.cjs')

const debug = makeDebug(`${DEBUG_PREFIX}:client`)

// Fetch an image hosted on your Cloudinary Media Library using the Cloudinary
// Search API. Cache each response using the 11ty Cache.
const makeClient = (config) => {
  const {
    api_key,
    api_secret,
    cache_directory,
    cache_duration,
    cache_verbose,
    cloud_name
  } = config

  debug(`cache responses from Cloudinary %O`, {
    cache_directory,
    cache_duration,
    cache_verbose
  })

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true
  })
  debug(`Cloudinary API client configured for cloud_name: ${cloud_name}`)

  const fetchCloudinaryResponse = async (public_id) => {
    // https://cloudinary.com/documentation/search_api#expressions
    // const expression = `resource_type:video AND public_id:${public_id}`
    const expression = `public_id:${public_id}`
    if (cache_verbose) {
      debug(`search %O`, {
        cloud_name,
        expression,
        fields: ['context', 'tags']
      })
    }

    // search in asset cache before fetching from Cloudinary Media Library
    // https://www.11ty.dev/docs/plugins/fetch/#manually-store-your-own-data-in-the-cache
    // https://github.com/chrisburnell/eleventy-cache-webmentions/blob/main/eleventy-cache-webmentions.js
    const asset = new AssetCache(public_id, cache_directory, {
      duration: cache_duration,
      verbose: cache_verbose
    })

    await asset.ensureDir()

    if (asset.isCacheValid(cache_duration)) {
      debug(
        `${public_id} found in cache and still fresh. Extracting it from ${cache_directory}`
      )
      return await asset.getCachedValue()
    }

    debug(
      `${public_id} not in ${cache_directory} or expired. Fetching from Cloudinary Media Library.`
    )

    let result
    try {
      // it seems that even using the official Cloudinary client we can still
      // encounter API rate limits.
      result = await cloudinary.search
        .expression(expression)
        .with_field('context')
        .with_field('tags')
        .max_results(1)
        .execute()
    } catch (err) {
      // A Cloudinary SDK error is NOT an `Error` object, but a plain JS object
      // with an `error` field.
      // https://github.com/cloudinary/cloudinary_npm
      debug(`ERROR from Cloudinary SDK %O`, err)
      throw new Error(`${ERROR_MESSAGE_PREFIX}${err.error.message}`)
    }

    if (!result.resources || result.resources.length !== 1) {
      throw new Error(
        `${ERROR_MESSAGE_PREFIX}there should be exactly one resource with public_id ${public_id}`
      )
    }

    try {
      await asset.save(result.resources[0], 'json')
      debug(`${public_id} stored in ${cache_directory}`)
      return result.resources[0]
    } catch (err) {
      debug(`ERROR from Eleventy asset cache ${err.message}`)
      throw new Error(
        `${ERROR_MESSAGE_PREFIX}could not save to ${cache_directory} resource with public_id ${public_id}`
      )
    }
  }

  return { fetchCloudinaryResponse }
}

module.exports = { makeClient }
