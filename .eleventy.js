const fs = require('fs');

const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItClass = require('@toycode/markdown-it-class');

const blogTools = require('eleventy-plugin-blog-tools');
const navigation = require('@11ty/eleventy-navigation');
const rss = require('@11ty/eleventy-plugin-rss');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const readingTime = require('eleventy-plugin-reading-time');
const toc = require('eleventy-plugin-toc');

const collections = require('./_11ty/collections');
const filters = require('./_11ty/filters');
const shortcodes = require('./_11ty/shortcodes');
const transforms = require('./_11ty/transforms.js');

module.exports = function (eleventyConfig) {
  // --- 11ty plugins ------------------------------------------------------- //

  eleventyConfig.addPlugin(blogTools);
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
  // - Images: don't process them. Just copy them.
  // - Fonts: don't process them. Just copy them.
  // - CSS: don't process it. Let Tailwind CLI take care of building all but the
  //   inlined CSS. Other CSS is inlined in the <head>, but that's managed by a
  //   11ty filter.
  // - JS: all non third-party JS is inlined in the <head>, but that's managed
  //   by a 11ty filter.
  eleventyConfig.addPassthroughCopy({
    // TODO: use subfont for fonts
    'src/includes/assets/fonts': 'assets/fonts',
    // TODO: optimize local images
    'src/includes/assets/img': 'assets/img',
    'src/includes/assets/js/instantpage.min.js': 'assets/js/instantpage.min.js'
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
