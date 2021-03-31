const fs = require('fs');
const CleanCSS = require('clean-css');

const input = fs.readFileSync('_site/assets/css/style.css');
const output = new CleanCSS({
  compatibility: '*',
  level: 2, // if 2  breaks something, try 1
  sourceMap: false
}).minify(input).styles;

// The CSS file is hosted on Netlify, so there should be no need of cache busting
// https://www.netlify.com/blog/2017/02/23/better-living-through-caching/
fs.writeFileSync('_site/assets/css/style.minified.css', output);
fs.unlinkSync('_site/assets/css/style.css');
