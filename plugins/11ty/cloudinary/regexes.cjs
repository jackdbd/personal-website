// I don't know how long can a Cloudinary cloud_name be. Let's assume it's
// within 1-25 characters.

// Cloudinary supports many image formats. I think that specifying them in the
// regex makes no sense. But I guess we can assume that an image format is 2-4
// character long.
// https://cloudinary.com/documentation/image_transformations#supported_image_formats
const pattern_image =
  /<p>\s*(?:<a.*>)?(?:\s*)(?:https?:\/\/)(?:res\.cloudinary\.com)\/([a-zA-Z0-9_]{1,25})\/image\/upload\/v(\d+)\/(\S+)\.([a-zA-Z]{2,4})(?:<\/a>)?(?:\s*)<\/p>/

// Cloudinary supports many video formats. I think that specifying them in the
// regex makes no sense. But I guess we can assume that an image format is 2-4
// character long.
// https://cloudinary.com/documentation/video_manipulation_and_delivery#supported_video_formats
// https://regex101.com/r/jU1fbQ/1
const pattern_video =
  /<p>\s*(?:<a.*>)?(?:\s*)(?:https?:\/\/)(?:res\.cloudinary\.com)\/([a-zA-Z0-9_]{1,25})\/video\/upload\/v(\d+)\/(\S+)\.([a-zA-Z0-9]{2,4})(?:<\/a>)?(?:\s*)<\/p>/

/**
 * Parses HTML and finds strings that match a regex pattern for videos.
 */
const matchesPatternImage = (html) => {
  return html.match(new RegExp(pattern_image, 'g'))
}

/**
 * Parses HTML and finds strings that match a regex pattern for videos.
 */
const matchesPatternVideo = (html) => {
  return html.match(new RegExp(pattern_video, 'g'))
}

/**
 * Parses the HTML and extracts pieces of data which identify a resource hosted
 * on your Cloudinary Media Library.
 */
const cloudinaryResourceImageData = (html) => {
  const result = new RegExp(pattern_image).exec(html)

  if (!result) {
    return null
  }

  const [, cloud_name, version, public_id, format] = result

  return {
    cloud_name,
    format,
    public_id,
    version
  }
}

/**
 * Parses the HTML and extracts pieces of data which identify a resource hosted
 * on your Cloudinary Media Library.
 */
const cloudinaryResourceVideoData = (html) => {
  const result = new RegExp(pattern_video).exec(html)

  if (!result) {
    return null
  }

  // TODO: allow an optional query string where to specify subtitles and other options?
  // For example, tipical URL
  // https://res.cloudinary.com/jackdbd/video/upload/v1677066634/iltirreno-no-lqip_iffu6t.mkv
  // Same URL, but with subtitles
  // https://res.cloudinary.com/jackdbd/video/upload/v1677066634/iltirreno-no-lqip_iffu6t.mkv?subtitles=test.vtt

  const [, cloud_name, version, public_id, format] = result

  return {
    cloud_name,
    format,
    public_id,
    version
  }
}

// cloudinaryResourceImageData and cloudinaryResourceVideoData are basically the
// same function, but I'm not sure how different the response from Cloudinary is
// for images and videos. So I'm keeping these functions separate for now.

module.exports = {
  cloudinaryResourceImageData,
  cloudinaryResourceVideoData,
  matchesPatternImage,
  matchesPatternVideo
}
