const fs = require('fs');

const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItClass = require('@toycode/markdown-it-class');

const navigation = require('@11ty/eleventy-navigation');
const rss = require('@11ty/eleventy-plugin-rss');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

const embedTwitter = require('eleventy-plugin-embed-twitter');
const embedVimeo = require('eleventy-plugin-vimeo-embed');
const embedYouTube = require('eleventy-plugin-youtube-embed');
const emoji = require('eleventy-plugin-emoji');
const helmet = require('eleventy-plugin-helmet');
const readingTime = require('eleventy-plugin-reading-time');
const toc = require('eleventy-plugin-toc');

const collections = require('./_11ty/collections');
const filters = require('./_11ty/filters');
const shortcodes = require('./_11ty/shortcodes');
const transforms = require('./_11ty/transforms.js');

const prebuild = require('./prebuild');
const buildSW = require('./build-sw');

module.exports = function (eleventyConfig) {
  eleventyConfig.on('beforeBuild', () => {
    // TODO: maybe read all files in src/includes/assets/css and
    // src/includes/assets/js and pass them to prebuild()
    prebuild();
  });

  eleventyConfig.on('afterBuild', () => {
    buildSW();
  });

  // --- 11ty plugins ------------------------------------------------------- //

  // https://github.com/gfscott/eleventy-plugin-embed-twitter#configure
  eleventyConfig.addPlugin(embedTwitter, { align: 'center', doNotTrack: true });
  eleventyConfig.addPlugin(embedVimeo, { dnt: true });
  eleventyConfig.addPlugin(embedYouTube, { lazy: true, noCookie: true });
  eleventyConfig.addPlugin(emoji);
  eleventyConfig.addPlugin(helmet);
  eleventyConfig.addPlugin(navigation);
  eleventyConfig.addPlugin(readingTime);
  eleventyConfig.addPlugin(rss);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(toc, {
    tags: ['h2', 'h3']
  });

  // --- 11ty data cascade -------------------------------------------------- //
  // https://www.11ty.dev/docs/data-cascade/

  // Merge data instead of overriding
  // https://www.11ty.dev/docs/data-deep-merge/
  eleventyConfig.setDataDeepMerge(true);

  // --- 11ty passthrough file copy ----------------------------------------- //
  // https://www.11ty.dev/docs/copy/

  // Static assets
  // - CSS: nothing to do here. CSS is either inlined in the <head> with a 11ty
  //   filter (critical CSS) or processed by PostCSS with Tailwind CSS.
  // - Fonts: don't process them. Just copy them.
  //   TODO: maybe subset self-hosted fonts with https://github.com/Munter/subfont
  // - Images: don't process them. Just copy them.
  //   TODO: optimise local images with eleventy-img
  // - JS: it's either inlined in the <head> with a 11ty filter (critical JS) or
  //   loaded asynchronously with <script defer> (it's written in a template or
  //   markdown file, and eleventy-plugin-helmet move it to the <head>).
  eleventyConfig.addPassthroughCopy({
    'src/includes/assets/fonts': 'assets/fonts',
    'src/includes/assets/img': 'assets/img',
    'src/includes/assets/js': 'assets/js'
  });

  // 11ty shortcodes
  Object.keys(shortcodes).forEach((name) => {
    eleventyConfig.addShortcode(name, shortcodes[name]);
  });

  // 11ty transforms
  Object.keys(transforms).forEach((name) => {
    eleventyConfig.addTransform(name, transforms[name]);
  });

  // 11ty filters
  Object.keys(filters).forEach((name) => {
    eleventyConfig.addFilter(name, filters[name]);
  });

  // 11ty collections
  Object.keys(collections).forEach((name) => {
    eleventyConfig.addCollection(name, collections[name]);
  });

  // --- markdown-it (markdown parser) configuration ------------------------ //

  // https://markdown-it.github.io/markdown-it/#MarkdownIt.new
  // TODO: try not to set html: true. It's not safe (XSS). Use markdown-it
  // plugins instead!
  const md = markdownIt({
    breaks: true,
    html: true,
    linkify: true,
    typographer: true
  });

  // https://github.com/valeriangalliat/markdown-it-anchor
  md.use(markdownItAnchor, {
    permalink: true,
    permalinkBefore: true,
    permalinkClass: 'heading-anchor',
    permalinkSymbol: '#'
  });

  // TODO: this plugin doesn't seem to work
  // https://github.com/HiroshiOkada/markdown-it-class
  // md.use(markdownItClass, {
  // pre: ['list-decimal', 'ml-6']
  // ul: ['list-disc', 'ml-6']
  // });
  eleventyConfig.setLibrary('md', md);

  // --- Browsersync configuration ------------------------------------------ //

  // https://www.11ty.dev/docs/quicktips/not-found/#with-serve
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, browserSync) {
        const content_404 = fs.readFileSync('_site/404.html');

        browserSync.addMiddleware('*', (req, res) => {
          // Provides the 404 content without redirect.
          res.write(content_404);
          // Add 404 http status code in request header.
          // res.writeHead(404, { "Content-Type": "text/html" });
          res.writeHead(404);
          res.end();
        });
      }
    }
    // ghostMode: false,
    // ui: false
  });

  // https://www.11ty.dev/docs/config/#configuration-options
  return {
    dataTemplateEngine: 'njk',
    dir: {
      data: '_data',
      includes: 'includes',
      input: 'src',
      layouts: 'layouts',
      output: '_site'
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    pathPrefix: '/',
    templateFormats: ['html', 'md', 'njk']
  };
};
