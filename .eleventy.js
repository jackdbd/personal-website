const fs = require('fs');
const path = require('path');

const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');

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

const collections = require('./11ty/collections');
const filters = require('./11ty/filters');
const shortcodes = require('./11ty/shortcodes');
const transforms = require('./11ty/transforms.js');

const {
  buildSW,
  contentSecurityPolicyFromJSON,
  writeAllowedResourcesForContentSecurityPolicyAsJSON,
  writeCSPinNetlifyToml
} = require('./scripts');

const OUTPUT_DIR = '_site';

module.exports = function (eleventyConfig) {
  eleventyConfig.on('beforeBuild', () => {});

  eleventyConfig.on('afterBuild', async () => {
    const filepath = 'csp-allowed-resources.json';
    const netlifyTomlPath = 'netlify.toml';

    await writeAllowedResourcesForContentSecurityPolicyAsJSON(filepath);
    const csp = await contentSecurityPolicyFromJSON(filepath);
    await writeCSPinNetlifyToml(csp, { netlifyTomlPath });

    // TODO: fetch list of popular HTML pages from Ackee before generating sw
    const htmlPagesToPrecache = [
      path.join(OUTPUT_DIR, '404.html'),
      path.join(OUTPUT_DIR, 'index.html'),
      path.join(OUTPUT_DIR, 'about', 'index.html'),
      path.join(OUTPUT_DIR, 'blog', 'index.html'),
      path.join(OUTPUT_DIR, 'contact', 'index.html'),
      path.join(OUTPUT_DIR, 'projects', 'index.html'),
      path.join(OUTPUT_DIR, 'styleguide', 'index.html'),
      path.join(OUTPUT_DIR, 'success', 'index.html'),
      path.join(OUTPUT_DIR, 'tags', 'index.html'),
      path.join(
        OUTPUT_DIR,
        'posts',
        '12-years-of-fires-in-sardinia',
        'index.html'
      )
    ];
    await buildSW({
      cacheId: 'giacomodebidda.com',
      outputDir: OUTPUT_DIR,
      htmlPagesToPrecache,
      netlifyTomlPath
    });
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
    tags: ['h2', 'h3'],
    wrapperClass: 'toc'
  });

  // --- 11ty data cascade -------------------------------------------------- //
  // https://www.11ty.dev/docs/data-cascade/

  // Merge data instead of overriding
  // https://www.11ty.dev/docs/data-deep-merge/
  eleventyConfig.setDataDeepMerge(true);

  // --- 11ty passthrough file copy ----------------------------------------- //
  // https://www.11ty.dev/docs/copy/

  // Static assets
  eleventyConfig.addPassthroughCopy({
    'src/includes/assets/css': 'assets/css',
    'src/includes/assets/fonts': 'assets/fonts',
    'src/includes/assets/img': 'assets/img',
    'src/includes/assets/js': 'assets/js',
    'node_modules/ackee-tracker/dist/ackee-tracker.min.js':
      'assets/js/ackee-tracker.js',
    'node_modules/instant.page/instantpage.js': 'assets/js/instantpage.js'
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
  eleventyConfig.setLibrary('md', md);

  // --- Browsersync configuration ------------------------------------------ //

  // https://www.11ty.dev/docs/quicktips/not-found/#with-serve
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, browserSync) {
        const content_404 = fs.readFileSync(`${OUTPUT_DIR}/404.html`);

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
      output: OUTPUT_DIR
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    pathPrefix: '/',
    templateFormats: ['html', 'md', 'njk']
  };
};
