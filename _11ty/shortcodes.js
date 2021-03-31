/**
 * 11ty shortcodes
 * https://www.11ty.dev/docs/shortcodes/
 */

const version = () => {
  return String(Date.now());
};

const copyright = (name) => {
  const startYear = 2020;
  const stopYear = new Date().toISOString().slice(0, 4);
  return `Copyright © ${startYear} – ${stopYear} ${name} – All rights reserved`;
};

const cloudinaryRespImage = (src, alt, width, height, shouldLazyLoad) => {
  const splits = src.split('/');
  let [imgName, imgFormat] = splits[splits.length - 1].split('.');
  const cloudName = splits[3];
  const vers = splits[6];
  // const filename = splits[7];
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/`;

  // The GIF is too big, I need to scale it down or cloudinary gives me a HTTP 400
  const imgTransformations = 'c_scale';

  // convert animated GIFs to mp4 to save bandwidth
  // https://cloudinary.com/blog/reduce_size_of_animated_gifs_automatically_convert_to_webm_and_mp4
  imgFormat = imgFormat === 'gif' ? 'mp4' : imgFormat;

  // Cloudinary allow a maximum of 50 megapixels as the total number of pixels
  // in all frames/pages, otherwise a HTTP 400 is returned with some details
  // about the error in the x-cld-error response header.
  // Videos and animated GIFs have more than one frame, so the megapixels add
  // up quickly. Limit the width of the video is a simple heuristic to reduce
  // the likelihood of this error.
  const widths = imgFormat === 'mp4' ? ['320', '640'] : ['320', '640', '1280'];
  const srcset = widths
    .map((w) => {
      return `${baseUrl}f_auto,q_auto,${imgTransformations},w_${w}/${vers}/${imgName}.${imgFormat} ${w}w`;
    })
    .join(',');

  const sizes = '(min-width: 800px) 50vw, 100vw';

  return `<img 
      alt="${alt ? alt : ''}"
      src="${src}"
      srcset="${srcset}"
      sizes="${sizes}"
      width=${width}
      height=${height}
      loading="${shouldLazyLoad ? 'lazy' : ''}" />`;
};

module.exports = {
  cloudinaryRespImage,
  copyright,
  version
};
