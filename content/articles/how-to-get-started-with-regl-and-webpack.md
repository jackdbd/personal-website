---
date: "2017-10-31T19:30:03.284Z"
tags:
  - regl
  - WebGL
  - Webpack
title: How to get started with regl and Webpack
---

I have been wanting to play around with the [regl](https://github.com/regl-project/regl) library since I wathed the [talk that Mikola Lysenko gave at PLOTCON 2016](https://www.youtube.com/watch?v=rFjszW5L2aw&t=1196s), and this week I finally decided to invest some time in setting up a repo with Webpack and some regl examples.

regl is a pretty new library, but it seems quite popular among data visualization practitioners. [Jim Vallandingham](https://vallandingham.me/regl_intro.html) and [Peter Beshai](https://peterbeshai.com/beautifully-animate-points-with-webgl-and-regl.html) wrote really nice tutorials about regl, and Nadieh Bremer created the stunning visualization ["A breathing Earth"](https://bl.ocks.org/nbremer/1acc6c95e3bb374dc78329e94f85a9b0).

## regl and WebGL

Before starting to learn about regl, you need some basic knowledge about WebGL, the low level API to draw 3D graphics in the browser, and its [graphics pipeline (aka rendering pipeline)](https://tsherif.github.io/webgl-presentation/#/). [This article on WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html) does a great job in explaining what WebGL is:

> WebGL is just a rasterization engine. It draws points, lines, and triangles based on code you supply.

WebGL runs on the GPU on your computer, and you need to provide the code in the form of two functions: a **vertex shader** and a **fragment shader**.

Another important thing to know is that WebGL is a [state machine](https://www.packtpub.com/mapt/book/game_development/9781849699792/3/ch03lvl1sec24/understanding-webgl--a-state-machine): once you modify an attributes, that modification is permanent until you modify that attribute again.

regl is **functional abstraction** of WebGL. It simplifies WebGL programming by removing as much shared state as it can get away with.

In regl there are two fundamentals abstractions: **resources** and **commands**.

* A resource is a handle to something that you load on the GPU, like a texture.
* A command is a complete representation of the WebGL state required to perform some draw call. It wraps it up and packages it into a single reusable function.

In this article I will only talk about [commands](https://regl.party/api#commands).

## Project structure and boilerplate

I found out that if I want to learn a new technology/library/tool I have to play around with it, so I created a repo and I called it [regl-playground](https://github.com/jackdbd/regl-playground).

Let's start defining the structure for this repo. Here is the root directory:

```shell
.
├── package.json
├── README.md
├── src
└── webpack.config.js
```

And here is the `src` directory.

```shell
.
├── css
│   └── main.css
├── js
│   ├── index.js
│   └── one-shot-rendering.js
└── templates
    ├── index.html
    └── one-shot-rendering.html
```

You will need `regl` and a few dev dependencies for webpack. If you want to save some time (and keystrokes), you can copy the `package.json` down below and install all you need with `yarn install`.

```json
{
  "name": "regl-playground",
  "version": "1.0.0",
  "main": "index.js",
  "repository": "git@github.com:jackdbd/regl-playground.git",
  "author": "jackdbd <jackdebidda@gmail.com>",
  "license": "MIT",
  "scripts": {
    "dev": "webpack-dev-server --config webpack.config.js",
    "lint": "eslint src",
    "build": "webpack --config webpack.config.js --progress"
  },
  "devDependencies": {
    "babel-core": "^6.26.0",
    "babel-loader": "^7.1.2",
    "babel-preset-es2015": "^6.24.1",
    "clean-webpack-plugin": "^0.1.17",
    "eslint": "^4.5.0",
    "eslint-config-airbnb-base": "^12.1.0",
    "eslint-plugin-import": "^2.7.0",
    "extract-text-webpack-plugin": "^3.0.1",
    "html-webpack-plugin": "^2.30.1",
    "style-loader": "^0.19.0",
    "webpack": "^3.8.1",
    "webpack-bundle-analyzer": "^2.9.0",
    "webpack-dev-server": "^2.9.3"
  },
  "dependencies": {
    "regl": "^1.3.0"
  }
}
```

Next, you will need 2 HTML files, one for the index, one for the actual regl application. I think it's a good idea to put these files in `src/templates`.

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Home</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Home of regl-playground">
    <!-- bundle.css is injected here by html-webpack-plugin -->
  </head>
  <body>
    <header>
      <h1>List of regl examples</h1>
    </header>
    <ul>
      <li><a href="/one-shot-rendering.html">one-shot rendering</a></li>
    </ul>
    <p>For documentation, see the <a href="https://regl.party/" target="_blank">regl API</a>.</p>
    <footer>Examples with regl version <code>1.3.0</code></footer>
    <!-- bundle.js is injected here by html-webpack-plugin -->
  </body>
</html>
```

```html
<!-- one-shot-rendering.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>One shot rendering</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="regl example with one shot rendering">
    <!-- bundle.css is injected here by html-webpack-plugin -->
  </head>
  <body>
    <ul>
      <li><a href="/index.html">Home</a></li>
    </ul>
    <h1>regl one shot rendering example</h1>
    <!-- bundle.js is injected here by html-webpack-plugin -->
  </body>
</html>
```

Then, create a minimal CSS file in `src/css`.

```css
/* main.css */
h1 {
  color: #0b4192;
}
```

And the Javascript files. We'll put the code in `one-shot-rendering.js` later on. For now, just import the CSS, so you can check that webpack is setup correctly.

```javascript
// index.js
import '../css/main.css'
```

```javascript
// one-shot-rendering.js
import '../css/main.css'
```

Finally, the webpack configuration. I like to include `BundleAnalyzerPlugin` to check the bundle sizes.

```javascript
// webpack.config.js
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    home: path.join(__dirname, 'src', 'js', 'index.js'),
    'one-shot-rendering': path.join(
      __dirname,
      'src',
      'js',
      'one-shot-rendering.js'
    ),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].[chunkhash].bundle.js',
    sourceMapFilename: '[file].map',
  },
  module: {
    rules: [
      // rule for .js/.jsx files
      {
        test: /\.(js|jsx)$/,
        include: [path.join(__dirname, 'js', 'src')],
        exclude: [path.join(__dirname, 'node_modules')],
        use: {
          loader: 'babel-loader',
        },
      },
      // rule for css files
      {
        test: /\.css$/,
        include: path.join(__dirname, 'src', 'css'),
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
    ],
  },
  target: 'web',
  devtool: 'source-map',
  plugins: [
    new BundleAnalyzerPlugin(),
    new CleanWebpackPlugin(['dist'], {
      root: __dirname,
      exclude: ['favicon.ico'],
      verbose: true,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'templates', 'index.html'),
      hash: true,
      filename: 'index.html',
      chunks: ['commons', 'home'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(
        __dirname,
        'src',
        'templates',
        'one-shot-rendering.html'
      ),
      hash: true,
      filename: 'one-shot-rendering.html',
      chunks: ['commons', 'one-shot-rendering'],
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'commons',
      filename: '[name].[chunkhash].bundle.js',
      chunks: ['home', 'one-shot-rendering'],
    }),
    new ExtractTextPlugin('[name].[chunkhash].bundle.css'),
  ],
  devServer: {
    host: 'localhost',
    port: 8080,
    contentBase: path.join(__dirname, 'dist'),
    inline: true,
    stats: {
      colors: true,
      reasons: true,
      chunks: false,
      modules: false,
    },
  },
  performance: {
    hints: 'warning',
  },
}
```

Ah, don't forget `.babelrc`!

```
{
  "presets": ["es2015"]
}
```

Check that everything works by running `yarn run dev` and going to `https://localhost:8080/`.

https://res.cloudinary.com/jackdbd/image/upload/v1599302618/webpack-configured_xzitfv.png

## Your first regl command

As I said, the regl API provides you with two abstractions: resources and commands. A regl command wraps up all of the WebGL state associated with a draw call (either drawArrays or drawElements) and packages it into a single reusable function.

Here is what you can define in a regl command:

* vertex shader
* fragment shader
* uniforms
* attributes
* primitive
* count

That's a lot of terminology! What are these things?

I will try to explain these items in a sentence or two, but if you are looking for some more detailed information you should definitely read the article by [Adnan Ademovic on the TopTal blog](https://www.toptal.com/javascript/3d-graphics-a-webgl-tutorial). It's a great resource and contains a lot of links to master WebGL.

Here is a summary:

**Vertex shader**.
A function written in GLSL that runs on your GPU. Its job is to compute vertex positions and set a variable called `gl_Position`. It gets the data from Javascript and can pass other data to the fragment shader.

**Fragment shader**.
A function written in GLSL that runs on your GPU. Its job is to compute the color of each fragment (you can think of a fragment like a pixel, but the whole story is [more complicated](https://t-machine.org/index.php/2013/10/05/why-is-a-fragment-shader-named-a-fragment-shader/) than that).

**Uniforms**.
Global variables that you set in Javascript and that are broadcasted to both shaders. They cannot be changed (something similar to `const` in ES6). They stay the same for all vertices during a single draw call.

**Attributes**.
Data that points to Vertex Buffer Objects. Attributes are used in the vertex shader.

**Primitive**.
The primitive type for the [element](https://regl.party/api#elements) buffer. WebGL is mostly used to draw triangles, but you can also draw individual points. In regl the supported primitives are: `'points'`, `'lines'`, `'line strip'`, `'line loop'`, `'triangles'`, `'triangle strip'` and `'triangle fan'`.

**Count**.
The number of vertices to draw (e.g. if you want to draw 2 triangles you need to set `count` to 6).

Ok, enough talking. Let's see some regl action! Open `one-shot-rendering.js` and write this code:

```javascript
// one-shot-rendering.js
import '../css/main.css'

// Create a full screen canvas element and a WebGLRenderingContext.
const regl = require('regl')()

const drawTriangle = regl({
  // The vertex shader tells the GPU where to draw the vertices.
  vert: `
  precision mediump float;

  uniform float scale;
  uniform float pointSize;
  attribute vec2 position;
  attribute vec3 color;
  varying vec3 frag_color;  // varying to pass to the fragment shader

  float z = 0.0;
  float w = 1.0;

  void main () {
    frag_color = color;
    gl_PointSize = pointSize;
    gl_Position = vec4(position * scale, z, w);
  }
  `,

  // The fragment shader tells the GPU what color to draw.
  frag: `
    precision mediump float;
  
    varying vec3 frag_color;  // received from the vertex shader
  
    void main () {
      gl_FragColor = vec4(sqrt(frag_color), 1.0);
    }
  `,

  // Now that the shaders are defined, we pass the vertices to the GPU
  attributes: {
    position: [[1.0, -0.75], [0.0, 0.0], [-1.0, -1.0]],
    color: regl.prop('rgbColors'),
  },

  uniforms: {
    // get the prop pointSize and pass it to the shaders
    pointSize: (context, prop) => prop.pointSize,
    // we can also access the props with this shorthand syntax
    scale: regl.prop('scale'),
  },

  // specify the primitive type (the default is 'triangle')
  primitive: 'points',
  // and we tell the GPU how many vertices to draw
  count: 3,
})

// In one-shot rendering the command is executed once and immediately.
drawTriangle({
  pointSize: 10.0,
  scale: 0.5,
  rgbColors: [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]],
})
```

Run `yarn run dev` and go to `https://localhost:8080/`. You should see something like this:

https://res.cloudinary.com/jackdbd/image/upload/v1599302618/one-shot-rendering-points_bmyos0.png
"One-shot rendering: three points at localhost:8080",

Well... not that exciting you might say. All that code for three points on the screen?

Ok, let's try changing the line `primitive: 'points'`. You can either remove it or replace `'points'` with `'triangle'` (the default primitive). Now you should see this:

https://res.cloudinary.com/jackdbd/image/upload/v1599302618/one-shot-rendering-triangle_y8sbuf.png

That's better! Let's stop for a second and try to explain what's going on.

The way we drew this triangle is called [one-shot rendering](https://regl.party/api#one-shot-rendering). The command is executed only once and immediately.

We called the command with some **props**, which will be available in uniforms and attributes.

The line `const regl = require('regl')();` creates a full screen canvas element and a `WebGLRenderingContext`. This context will be available in the command `drawTriangle` and can be accessed in uniforms and attributes.

Context and props can be accessed with `pointSize: (context, prop) => prop.pointSize,`, or even with a shorthand syntax: `regl.context('pixelRatio')` and `regl.prop('scale')`.

https://res.cloudinary.com/jackdbd/image/upload/v1599302618/context_lgay6x.png

As you can see from the image, the `drawingBufferWidth` is equal to the `viewportWidth`, and the `drawingBufferHeight` is equal to the `viewportHeight`. However, this is true only because we created a `WebGLRenderingContext` without specifying any initialization argument for the regl constructor and because we didn't set the `viewport`.

## One canvas, two sizes

When you think about the canvas for your regl/WebGL application you need to decide how big you want the canvas to be (e.g. full screen, a small portion of the web page, etc), and how many pixels you want to display.

In order to illustrate this concept we need to make a few small [changes to the code](https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html).

In your `one-shot-rendering.html`, add a `<canvas>` element.

```html
<body>
  <!-- don't change anything above this point -->
  <h1>regl one shot rendering example</h1>
  <div id="container">
    <canvas id="regl-canvas"></canvas>
  </div>
  <!-- don't change anything below this point -->
</body>
```

You can set the size of the canvas in CSS. In your `main.css` file define a `canvas` selector. Let's say that you want the canvas to be as wide as half of the viewport width, and as high as half of the viewport height. You can also add a red border to understand where the canvas is.

```css
/* Set the size of the canvas element (i.e. how big the canvas is). */
canvas {
  width: 50vw;
  height: 50vh;
  display: block;
  border: 1px solid #f00;
}
```

The size of the canvas has nothing to do with how many pixels you want to have the canvas. For this, you need to modify the Javascript code. In `one-shot-rendering.js`, replace this line:

```javascript
const regl = require('regl')()
```

with this code:

```javascript
const canvas = document.getElementById('regl-canvas')
const regl = require('regl')({
  canvas,
})
// Set the size of the drawingbuffer (i.e. how many pixels are in the canvas)
canvas.width = canvas.clientWidth
canvas.height = canvas.clientHeight
```

and in the `drawTriangle` command add the `viewport`:

```javascript
viewport: {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
},
```

https://res.cloudinary.com/jackdbd/image/upload/v1599302618/canvas_shfdsz.png

## Batch rendering

With [batch rendering](https://regl.party/api#batch-rendering) you can execute a regl command multiple times. The command is executed once for each element of the array passed as argument. Let's see it in action.

Create a new HTML file called `batch-rendering.html`:

```html
<!-- batch-rendering.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>batch rendering</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="regl example with batch rendering">
    <!-- bundle.css is injected here by html-webpack-plugin -->
  </head>
  <body>
    <ul>
      <li><a href="/index.html">Home</a></li>
    </ul>
    <h1>regl batch rendering example</h1>
    <div id="container">
      <canvas id="regl-canvas"></canvas>
    </div>
    <!-- bundle.js is injected here by html-webpack-plugin -->
  </body>
</html>
```

You will need to create a new `entry` in webpack, as well as a new configuration for the `html-webpack-plugin`:

```javascript
// webpack.config.js
entry: {
  // other entry points
  'batch-rendering': path.join(__dirname, 'src', 'js', 'batch-rendering.js'),
  // other entry points
}

// other configurations of HtmlWebpackPlugin
new HtmlWebpackPlugin({
  template: path.join(__dirname, 'src', 'templates', 'batch-rendering.html'),
  hash: true,
  filename: 'batch-rendering.html',
  chunks: ['commons', 'batch-rendering'],
}),
// other configurations of HtmlWebpackPlugin
```

Finally, here is the regl application:

```javascript
// batch-rendering.js
import '../css/main.css'

const canvas = document.getElementById('regl-canvas')
const regl = require('regl')({
  canvas,
})
canvas.width = canvas.clientWidth
canvas.height = canvas.clientHeight

// regl render command to draw a SINGLE triangle
const drawTriangle = regl({
  frag: `
  precision mediump float;

  uniform vec4 color;

  void main() {
    gl_FragColor = color;
  }
  `,

  vert: `
  precision mediump float;

  uniform float angle;
  uniform vec2 offset;
  attribute vec2 position;

  float x, y, z, w;

  void main() {
    x = cos(angle) * position.x + sin(angle) * position.y + offset.x;
    y = -sin(angle) * position.x + cos(angle) * position.y + offset.y;
    z = 0.0;
    w = 1.0;
    gl_Position = vec4(x, y, z, w);
  }
  `,

  viewport: {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
  },

  attributes: {
    // [x,y] positions of the 3 vertices (without the offset)
    position: [-0.25, 0.0, 0.5, 0.0, -0.1, -0.5],
  },

  uniforms: {
    // Destructure context and pass only tick. Pass props just because we need
    // to pass a third argument: batchId, which gives the index of the regl
    // 'drawTriangle' render command.
    color: ({ tick }, props, batchId) => {
      const r = Math.sin(
        0.02 * ((0.1 + Math.sin(batchId)) * (tick + 3.0 * batchId))
      )
      const g = Math.cos(0.02 * (0.02 * tick + 0.1 * batchId))
      const b = Math.sin(
        0.02 * ((0.3 + Math.cos(2.0 * batchId)) * tick + 0.8 * batchId)
      )
      const alpha = 1.0
      return [r, g, b, alpha]
    },
    angle: ({ tick }) => 0.01 * tick,
    offset: regl.prop('offset'),
  },

  // disable the depth buffer
  // https://learningwebgl.com/blog/?p=859
  depth: {
    enable: false,
  },

  count: 3,
})

// Here we register a per-frame callback to draw the whole scene
regl.frame(() => {
  // clear the color buffer
  regl.clear({
    color: [0.0, 0.0, 0.0, 1.0], // r, g, b, a
  })

  /* In batch rendering a regl rendering command can be executed multiple times
  by passing a non-negative integer or an array as the first argument.
  The batchId is initially 0 and incremented each time the render command is
  executed.
  Note: this command draws a SINGLE triangle, but since we are passing an
  array of 5 elements it is executed 5 times. */
  drawTriangle([
    { offset: [0.0, 0.0] }, // props0
    { offset: [-0.15, -0.15] }, // props1...
    { offset: [0.15, 0.15] },
    { offset: [-0.5, 0.5] },
    { offset: [0.5, -0.5] },
  ])
})
```

https://res.cloudinary.com/jackdbd/image/upload/v1599302618/batch-rendering_ge93a1.png

## GLSL? There is a loader for that!

I don't know about you, but defining shaders with back ticks looks awful to me. It would be much better to write `.glsl` files and then load them in a regl application. We could use linters and autocompletion, but even more importantly, we would avoid copy pasting the shaders in JS every single time we need them.

Luckily with Webpack it's pretty easy to fix this issue. There is a loader for that!

Ok, so you need to do these things:

1.  add `webpack-glsl-loader` to `devDependencies`
2.  create `.glsl` files for the vertex shader and for the fragment shader
3.  configure webpack to load `.glsl` files with `webpack-glsl-loader`
4.  `require` the shaders in the regl application

As an example, we'll remove the shader code between the back ticks in `batch-rendering.js` and we'll use the GLSL loader instead.

Install the GLSL loader with `yarn add --dev webpack-glsl-loader`.

Create GLSL files for your shaders. Create `src/glsl/vertex/batch.glsl` for the vertex shader and `src/glsl/fragment/batch.glsl` for the fragment shader. You just have to copy and paste the code between the back ticks in `batch-rendering.js`.

Configure webpack to use `webpack-glsl-loader` to load `.glsl` files.

```javascript
// webpack.config.js
// rule for .glsl files (shaders)
{
  test: /\.glsl$/,
  use: [
    {
      loader: 'webpack-glsl-loader',
    },
  ],
},
```

Finally, `require` your shaders in `batch-rendering.js`.

```javascript
// batch-rendering.js
import '../css/main.css'

const vertexShader = require('../glsl/vertex/batch.glsl')
const fragmentShader = require('../glsl/fragment/batch.glsl')

const canvas = document.getElementById('regl-canvas')
const regl = require('regl')({
  canvas,
})
canvas.width = canvas.clientWidth
canvas.height = canvas.clientHeight

// regl render command to draw a SINGLE triangle
const drawTriangle = regl({
  vert: vertexShader,
  frag: fragmentShader,

  viewport: {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
  },

  attributes: {
    // [x,y] positions of the 3 vertices (without the offset)
    position: [-0.25, 0.0, 0.5, 0.0, -0.1, -0.5],
  },

  uniforms: {
    // Destructure context and pass only tick. Pass props just because we need
    // to pass a third argument: batchId, which gives the index of the regl
    // 'drawTriangle' render command.
    color: ({ tick }, props, batchId) => {
      const r = Math.sin(
        0.02 * ((0.1 + Math.sin(batchId)) * (tick + 3.0 * batchId))
      )
      const g = Math.cos(0.02 * (0.02 * tick + 0.1 * batchId))
      const b = Math.sin(
        0.02 * ((0.3 + Math.cos(2.0 * batchId)) * tick + 0.8 * batchId)
      )
      const alpha = 1.0
      return [r, g, b, alpha]
    },
    angle: ({ tick }) => 0.01 * tick,
    offset: regl.prop('offset'),
  },

  // disable the depth buffer
  // https://learningwebgl.com/blog/?p=859
  depth: {
    enable: false,
  },

  count: 3,
})

// Here we register a per-frame callback to draw the whole scene
regl.frame(() => {
  regl.clear({
    color: [0.0, 0.0, 0.0, 1.0], // r, g, b, a
  })

  /* In batch rendering a regl rendering command can be executed multiple times
  by passing a non-negative integer or an array as the first argument.
  The batchId is initially 0 and incremented each time the render command is
  executed.
  Note: this command draws a SINGLE triangle, but since we are passing an
  array of 5 elements it is executed 5 times. */
  drawTriangle([
    { offset: [0.0, 0.0] }, // props0
    { offset: [-0.15, -0.15] }, // props1...
    { offset: [0.15, 0.15] },
    { offset: [-0.5, 0.5] },
    { offset: [0.5, -0.5] },
  ])
})
```

## Hungarian notation?

On [WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html) they say that it's common practice to place a letter in front of the variables to indicate their type: `u` for `uniforms`, `a` for `attributes` and the `v` for `varyings`. I'm not a huge fan of this [Hungarian notation](https://en.wikipedia.org/wiki/Hungarian_notation) though. I don't think it really improves the readability of the code and I don't think I will use it.

## Conclusion

I plan to write several articles about regl in the near future. In this one we learned how to configure Webpack for regl applications. In the next one I will create a few examples with d3 and regl.

Stay tuned!
