const cloudinaryImage = ({
  src,
  width,
  height,
  alt = '',
  classString = '',
  shouldLazyLoad = false
}) => {
  const splits = src.split('/')
  let [img_name, img_format] = splits[splits.length - 1].split('.')
  const cloud_name = splits[3]
  const vers = splits[6]
  // const filename = splits[7];
  const base_url = `https://res.cloudinary.com/${cloud_name}/image/upload`

  // The GIF is too big, I need to scale it down or Cloudinary gives me a HTTP 400
  const img_transformations = 'c_scale'

  // convert animated GIFs to mp4 to save bandwidth
  // https://cloudinary.com/blog/reduce_size_of_animated_gifs_automatically_convert_to_webm_and_mp4
  img_format = img_format === 'gif' ? 'mp4' : img_format

  // Cloudinary allows a maximum of 50 megapixels as the total number of pixels
  // in all frames/pages, otherwise a HTTP 400 is returned with some details
  // about the error in the x-cld-error response header.
  // Videos and animated GIFs have more than one frame, so the megapixels add
  // up quickly. Limit the width of the video is a simple heuristic to reduce
  // the likelihood of this error.
  const widths = img_format === 'mp4' ? ['320', '640'] : ['320', '640', '1280']

  const srcset = widths
    .map((w) => {
      return `${base_url}/f_auto,q_auto,${img_transformations},w_${w}/${vers}/${img_name}.${img_format} ${w}w`
    })
    .join(',')

  const sizes = '(min-width: 800px) 50vw, 100vw'

  return `
  <img 
    alt="${alt}"
    class="${classString}"
    src="${src}"
    srcset="${srcset}"
    sizes="${sizes}"
    width=${width}
    height=${height}
    loading="${shouldLazyLoad ? 'lazy' : ''}" />`
}

const cloudinaryVideo = ({
  src,
  autoplay = false,
  controls = true,
  loop = false,
  muted = true
}) => {
  const splits = src.split('/')
  let [file_name, _file_format] = splits[splits.length - 1].split('.')
  const cloud_name = splits[3]
  const vers = splits[6]
  const base_url = `https://res.cloudinary.com/${cloud_name}/video/upload`

  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
  let attr = ''
  if (autoplay) {
    attr += 'autoplay'
  }
  if (controls) {
    attr += ' controls'
  }
  if (loop) {
    attr += ' loop'
  }
  if (muted) {
    attr += ' muted'
  }

  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track

  // TODO: extract width, height, thumbnail from Cloudinary?
  // The thumbnail for the poster attribute.

  //   return `
  // <video ${attr}>
  //   <source type="video/webm" src="${base_url}/${vers}/${file_name}.webm">
  //   <source type="video/mp4" src="${base_url}/${vers}/${file_name}.mp4">
  //   <track
  //     label="English"
  //     kind="subtitles"
  //     srclang="en"
  //     src="/assets/vtt/test-en.vtt"
  //     default />
  // </video>`

  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
  const fallback = `Download the <a href="${base_url}/${vers}/${file_name}.webm">WEBM</a> or <a href="${base_url}/${vers}/${file_name}.mp4">MP4</a> video.`

  // https://stackoverflow.com/questions/27785816/webm-before-or-after-mp4-in-html5-video-element
  return `
  <video ${attr}>
   <source type="video/webm" src="${base_url}/${vers}/${file_name}.webm">
   <source type="video/mp4" src="${base_url}/${vers}/${file_name}.mp4">
  ${fallback}
</video>`
}

module.exports = { cloudinaryImage, cloudinaryVideo }
