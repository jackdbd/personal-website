---
date: "2017-04-30"
tags:
  - Babel
  - ES6
  - GLSL
  - Sass
  - Three.js
  - Webpack
title: Three.js project starter for ES6 and Webpack 2
---

Some months ago I came across this hilarious article on HackerNoon: [how it feels to learn javascript in 2016](https://hackernoon.com/how-it-feels-to-learn-javascript-in-2016-d3a717dd577f) (if you missed it, I suggest you to go and read it after you're done with this blog post). I mostly code in Python, but sometimes I have to do some frontend stuff, or write some visualizations, so I need to use Javascript.

I have been wanting to improve my Javascript skills for some time, but it seemed a daunting task and to be honest I felt a bit overwhelmed. I didn't know where to start: Node.js? ES6? React? Vue.js?

As most developers know, the best way to learn is to build some stuff, so I decided to focus on learning the basics of ES6 and write a small project with a library that I wanted to use: [Three.js](https://threejs.org/).

## ES6, Babel and Webpack

ES6, also known as Ecma Script 2015, is the next generation Javascript and introduces a lot of [great features](https://babeljs.io/learn-es2015/) into the language. The [latest versions of Node.js already support many features of this syntax](https://nodejs.org/en/docs/es6/), but several browsers, especially the older ones, are still behind in adopting this new standard and some features are still [not fully supported](https://caniuse.com/#search=es6). Luckily there are some great tools, like [Babel](https://babeljs.io/), that let you write ES6 Javascript and _transpile_ it to ES5.1 Javascript (or any other version you want).

You can use a tool like `babel-cli` to _transpile_ your ES6 Javascript to ES5.1 Javascript manually, but there are better options that let you automate this process. In the Javascript ecosystem there are many task runners suited for this job. Until some years ago the most popular options were [Grunt](https://gruntjs.com/), [Gulp](https://gulpjs.com/) and [Broccoli](https://broccolijs.com/). Nowadays it seems that everyone is using a module bundler like [Neutrino](https://www.npmjs.com/package/neutrino), [Rollup](https://rollupjs.org/) or [Webpack](https://webpack.github.io/). I opted for Webpack version 2.

It took me a while to write the configuration file for Webpack, but at least it's a _set-and-forget_ thing.
After you have done it, you can write ES6 code, and your Webpack toolchain will take care of transpiling it to ES5.1 and bundling it into a single file (usually called `bundle.js`).

## ESLint and AirBnB style guide

I think that one of the best way to write clean and readable code is to use a linter, and for ES6 there is [ESLint](https://eslint.org/). Writing all the rules for your linter is just insane and counterproductive, so I decided to use a popular style guide and stick to it. After a quick search I found out that the [AirBnB Javascript style guide](https://github.com/airbnb/javascript) is one of - if not _the_ - most popular style guide. I tried it for a while and I immediately liked it. It seems pretty strict, and I've already learned several things thanks to the warnings given me by the linter.

## SASS

Variables, nesting selectors, partials, mixins? Yes please! CSS preprocessors like Sass or Less offer you many features that really speed you up. Your browser still needs CSS files, but you can use a Webpack loader to preprocess files as you `require()` them in your Javascript code.
I started using SASS with the `.scss` syntax, but after watching a couple of videos of [DevTips](https://www.youtube.com/channel/UCyIe-61Y8C4_o-zZCtO4ETQ) I switched to `.sass`. It feels so much better to have clean, nice formatted code. I'm a Python developer after all. :-)
I like to use a linter when I write `.sass` files too. It's not as important as using a linter when writing Javascript code, but it doesn't hurt.

## GLSL

GLSL stands for OpenGL shading language. It's a strongly typed, C/C++ like language, and it's used to write shaders.
A shader is a small program that run on th GPU of your computer, and every WebGL program needs two shaders: a **vertex shader** and a **fragment shader**.

If you write pure WebGL code, you need to write your own shaders every time. In Three.js you have to do it only if you want to define a custom material which is not available in the library. You can do it by defining your own [ShaderMaterial](https://threejs.org/docs/#api/materials/ShaderMaterial).

But where do you write this GLSL code?

Usually the GLSL code is written directly in the `index.html` and appended to the DOM as text node of a script tag, so they can be easily accessed by Javascript with `document.getElementByID`.

This might be a convenient way to access the shader code if your project is small, but as your project gets bigger this solution becomes unpractical and messy pretty fast

I found a [Webpack loader for glsl files](https://www.npmjs.com/package/webpack-glsl-loader), so I decided to write both shaders in independent files that I called `vertexShader.glsl` and `fragmentShader.glsl`. Then I used `require()` statements to store the content of these scripts in Javascript variables.

## threejs-es6-webpack-starter

So, here is a preview of this project starter. Here you can see a grid, the XYZ axes, a directional light, a spotlight, a particle system (the stars), a group of green cubes (it's treated as a single object) and an object that uses a custom `ShaderMaterial`.

https://res.cloudinary.com/jackdbd/image/upload/v1599303234/preview_puzvpq.gif

If you want to give Three.js a try, clone the repo [threejs-es6-webpack-starter](https://github.com/jackdbd/threejs-es6-webpack-starter) and have some 3D fun!

## Additional resources

You can find some really nice tutorials about shaders and Custom Materials in Three.js [here](https://blog.cjgammon.com/threejs-custom-shader-material), [here](https://github.com/Jam3/jam3-lesson-webgl-shader-threejs) and [here](https://aerotwist.com/tutorials/an-introduction-to-shaders-part-1/).

For some more advanced stuff on shaders see these websites:

* [Shadertoy](https://www.shadertoy.com/)
* [GLSL Sandbox](https://glslsandbox.com/)
* [The Book of Shaders](https://thebookofshaders.com/)
* [Kick.js shader editor](https://www.kickjs.org/example/shader_editor/shader_editor.html)
