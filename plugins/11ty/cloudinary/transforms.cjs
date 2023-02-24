const makeDebug = require('debug')
const { DEBUG_PREFIX, ERROR_MESSAGE_PREFIX } = require('./constants.cjs')
const { resourceNotOwned } = require('./error-messages.cjs')
const {
  cloudinaryResourceImageData,
  cloudinaryResourceVideoData,
  matchesPatternImage,
  matchesPatternVideo
} = require('./regexes.cjs')
const { cloudinaryImage, cloudinaryVideo } = require('./shortcodes.cjs')

const debug = makeDebug(`${DEBUG_PREFIX}:transforms`)

const transformImage = async ({
  content,
  class_string,
  cloud_name,
  fetchCloudinaryResponse,
  should_lazy_load,
  should_throw_if_no_alt,
  should_throw_if_no_caption
}) => {
  const matches = matchesPatternImage(content)

  if (!matches) {
    return content
  }

  for (const [_index, str] of matches.entries()) {
    debug(`${str} matches pattern image`)
    const data = cloudinaryResourceImageData(str)

    if (!data) {
      debug(`!!! extracted NO DATA from ${str}`)
      return content
    }

    if (data.cloud_name !== cloud_name) {
      throw new Error(resourceNotOwned(cloud_name, data))
    }

    // fetch the resource to get alt and caption from Cloudinary
    const resource = await fetchCloudinaryResponse(data.public_id)

    const alt = resource.context.alt
    if (should_throw_if_no_alt && !alt) {
      throw new Error(
        `${ERROR_MESSAGE_PREFIX}resource ${data.public_id} has no 'alt' attribute. Set it in your Cloudinary Media Library`
      )
    }

    const caption = resource.context.caption
    if (should_throw_if_no_caption && !caption) {
      throw new Error(
        `${ERROR_MESSAGE_PREFIX}resource ${data.public_id} has no 'caption' attribute. Set it in your Cloudinary Media Library`
      )
    }

    const src = `https://res.cloudinary.com/${data.cloud_name}/image/upload/v${data.version}/${data.public_id}.${data.format}`
    // TODO: make this configurable? cloudinaryImage could be a custom
    // function set when configuring this plugin. This would allow a user to
    // decide how to trasform a Cloudinary URL into any custom HTML.

    const html = cloudinaryImage({
      src,
      width: resource.width,
      height: resource.height,
      alt,
      caption,
      classString: class_string,
      shouldLazyLoad: should_lazy_load
    })

    debug(`transformed URL to HTML (image) %O`, { src, html })

    // reassign in place isn't great...
    content = content.replace(str, html)
  }

  return content
}

const transformVideo = async ({
  content,
  cloud_name,
  fetchCloudinaryResponse,
  should_throw_if_no_alt,
  should_throw_if_no_caption
}) => {
  const matches = matchesPatternVideo(content)

  if (!matches) {
    return content
  }

  for (const [_index, str] of matches.entries()) {
    debug(`${str} matches pattern video`)
    const data = cloudinaryResourceVideoData(str)

    if (!data) {
      debug(`!!! extracted NO DATA from ${str}`)
      return content
    }

    if (data.cloud_name !== cloud_name) {
      throw new Error(resourceNotOwned(cloud_name, data))
    }

    // fetch the resource to get alt and caption from Cloudinary
    const resource = await fetchCloudinaryResponse(data.public_id)

    const alt = resource.context.alt
    if (should_throw_if_no_alt && !alt) {
      throw new Error(
        `${ERROR_MESSAGE_PREFIX}resource ${data.public_id} has no 'alt' attribute. Set it in your Cloudinary Media Library`
      )
    }

    const caption = resource.context.caption
    if (should_throw_if_no_caption && !caption) {
      throw new Error(
        `${ERROR_MESSAGE_PREFIX}resource ${data.public_id} has no 'caption' attribute. Set it in your Cloudinary Media Library`
      )
    }

    const src = `https://res.cloudinary.com/${data.cloud_name}/video/upload/v${data.version}/${data.public_id}.${data.format}`
    //   const url = resource.url
    //   const secure_url = resource.secure_url
    //   debug(`video`, { url, secure_url, src })

    const html = cloudinaryVideo({ src, autoplay: true, loop: true })
    debug(`transformed URL to HTML (video) %O`, { src, html })

    // reassign in place isn't great...
    content = content.replace(str, html)
  }

  return content
}

const makeTransformCloudinaryURLs = (config) => {
  const {
    class_string,
    cloud_name,
    fetchCloudinaryResponse,
    should_lazy_load,
    should_throw_if_no_alt,
    should_throw_if_no_caption
  } = config

  return async function transformCloudinaryURLs(content, outputPath) {
    if (!outputPath) {
      return content
    }

    if (!outputPath.endsWith('.html')) {
      return content
    }

    // reassign in place isn't great...
    content = await transformImage({
      content,
      class_string,
      cloud_name,
      fetchCloudinaryResponse,
      should_lazy_load,
      should_throw_if_no_alt,
      should_throw_if_no_caption
    })

    content = await transformVideo({
      content,
      cloud_name,
      fetchCloudinaryResponse,
      should_throw_if_no_alt,
      should_throw_if_no_caption
    })

    return content
  }
}

module.exports = { makeTransformCloudinaryURLs }
