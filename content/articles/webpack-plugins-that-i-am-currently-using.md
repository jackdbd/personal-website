---
date: "2017-05-11"
tags:
  - Webpack
title: Webpack plugins that I am currently using
---

Webpack is probably the most popular module bundler for Javascript applications. Its idea is to have a **single tool** that manages all the assets: Javascript files, CSS files, Images, etc. Webpack lets you also perform all the necessary tasks for managing and optimizing code dependencies, such as compilation, concatenation, minification, and compression.

Webpack is based on these 4 key concepts:

1.  entry
2.  output
3.  loaders
4.  plugins

The [official documentation](https://webpack.js.org/concepts/) does a great job in explaining these concept in a clear, concise way, so I suggest you to check it out. Note that you should install Webpack locally, as they suggest [here](https://webpack.js.org/guides/installation/#global-installation). Other great resources to learn how to use and configure Webpack are the [Matthew Hsiung's Webpack playlists on Youtube](https://www.youtube.com/channel/UCblk3IlXm_ZXkR5OYLuYWaQ/playlists) and [this article on Medium](https://medium.com/@rajaraodv/webpack-the-confusing-parts-58712f8fcad9).

One of the best features of Webpack is its huge ecosystem of plugins. While loaders can only execute transforms on a per-file basis, plugins add custom functionality and let you perform actions on "compilations" or "chunks" of your bundled modules.

Here I am going to list all plugins that I am currently using and include a sample configuration for each one of them.

* clean-webpack-plugin
* copy-webpack-plugin
* extract-text-webpack-plugin
* favicons-webpack-plugin
* html-webpack-plugin
* Other plugins

## clean-webpack-plugin

[This plugin](https://github.com/johnagan/clean-webpack-plugin) removes your build folder(s) before building. I use it to remove my **dist/** folder.

```javascript
plugins = [
  // more plugins
  new CleanWebpackPlugin(['dist'], { root: __dirname, verbose: true }),
  // more plugins
]
```

## copy-webpack-plugin

Some people consider the [Copy Webpack Plugin](https://github.com/kevlened/copy-webpack-plugin) to be an antipattern, because it goes against the main philosophy of Webpack: if your application needs a given asset, you should `require` it where it's needed, use a file loader to convert it into a module, and let Webpack manage it. I guess they have a point, but at the moment I find it very convenient.

```javascript
plugins = [
  // more plugins
  new CopyWebpackPlugin(
    [
      {
        from: path.join(__dirname, 'src', 'data'),
        to: path.join(__dirname, 'dist', 'data'),
      },
    ],
    { debug: 'warning' }
  ),
  // more plugins
]
```

## extract-text-webpack-plugin

The [Extract Text Plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin) takes all files that match the specified regular expressions, and bundle them all into a single file. You can use it to collect all stylesheets required by your application and move them into a single file. This way your stylesheets are no longer inlined into the JS bundle. If your total stylesheet volume is big, it will be faster because the CSS bundle is loaded in parallel to the JS bundle. You will need `css-loader` to use this plugin. If you use Sass, you will need `sass-loader` too. A nice benefit of using this plugin is that it allows you to avoid using the `style-loader`, which has the disadvantage of creating a `<style>` node in the DOM.

If your app has multiple entry points (e.g. home.js and about.js), this plugin plays well together with the CommonsChunkPlugin, but bear in mind that the configuration will be different from the one I included down here.

```javascript
module: {
  rules: [
    // rule for .css files
    {
      test: /\.css$/,
      include: path.join(__dirname, 'src', 'css'),
      use: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' }),
    },
    // rule for .sass/.scss files
    {
      test: /\.(sass|scss)$/,
      include: path.join(__dirname, 'src', 'sass'),
      use: ExtractTextPlugin.extract({ fallback: 'style-loader', use: ['css-loader', 'sass-loader'] }),
    },
  ],
},
plugins = [
  // more plugins
  new ExtractTextPlugin('styles.css'),  // name of the bundle for all extracted files
  // more plugins
]
```

## favicons-webpack-plugin

[This plugin](https://github.com/jantimon/favicons-webpack-plugin) automatically creates all the favicons you need for your application. Since its basic configuration creates 37 different favicons, optimized for different devices, it takes a while. That's why it might be a good idea to use this plugin only in production, not in development.

```javascript
plugins = [
  // more plugins
  new FaviconsWebpackPlugin(path.join(__dirname, 'src', 'images', 'logo.png')),
  // more plugins
]
```

## html-webpack-plugin

[This plugin](https://github.com/jantimon/html-webpack-plugin) is a _must have_. It generates an HTML5 file that includes all your webpack bundles in the body using script tags. This way in your `index.html` file you don't have to include any `<link>` tag in the `<head>` for your stylesheet bundle, nor you have to include any `<script>` tag in the `<body>` for your javascript bundle.
You can either let the plugin generate an HTML file for you, supply your own template using lodash templates or use your own loader if you are using different templates (e.g. handlebars). If you have the appropriate loaders, [you can even use Django templates](https://stackoverflow.com/questions/42861651/can-i-use-html-webpack-plugin-with-a-django-base-template) with this plugin.

If you have multiple entry points, create an instance of this plugin for each one of them.

_A small gotcha_: if you forget to remove the `<link>` tag or your `<script>` tag in your `index.html` , Webpack [executes twice](https://stackoverflow.com/questions/37081559/all-my-code-runs-twice-when-compiled-by-webpack) all the code required by your entry point.

```javascript
plugins = [
  // more plugins
  new HtmlWebpackPlugin({
    template: path.join(__dirname, 'src', 'templates', 'index.html'),
    filename: 'index.html',
    hash: true,
  }),
  // more plugins
]
```

## Other plugins

Here are a few plugins that I am not using at the moment, but that I am pretty sure I will use sooner or later.

**CommonsChunkPlugin**
The [CommonsChunkPlugin](https://webpack.js.org/plugins/commons-chunk-plugin/) is basically an [optimization](https://github.com/webpack/docs/wiki/optimization) plugin. It creates a separate file (known as a chunk), consisting of common modules shared between multiple entry points. By separating common modules from bundles, the resulting chunked file can be loaded once initially, and stored in cache for later use. Its configuration requires definitely some effort, but as they say in [these two videos](https://www.youtube.com/watch?v=-xzWMKuiS2o&list=PLnUE-7Cz5mHERezkTJfh0iU0LESkHmSxA), this plugin is a killer feature of Webpack.

**Dotenv-webpack**
Apps sometimes store config as constants in the code. This is a violation of [twelve-factor](https://12factor.net/config), which requires strict separation of config from code. [This plugin](https://github.com/mrsteele/dotenv-webpack) lets you store your configuration in an `.env` file - which you should add to `.gitignore` - so you can easily switch between different environments (e.g. development, test, production).

**HotModuleReplacementPlugin**
The HotModuleReplacementPlugin is basically a LiveReload, for every module. As they say in [the documentation](https://github.com/webpack/docs/wiki/hot-module-replacement-with-webpack), this plugin is still an experimental feature.

**Webpack Shell Plugin**
The [Webpack Shell Plugin](https://github.com/1337programming/webpack-shell-plugin) allows you to run any shell command before or after webpack builds. This will work for both webpack and webpack-dev-server.
