---
date: "2017-10-13T19:30:03.284Z"
tags:
  - D3.js
  - ES6
  - Webpack
title: How to import d3 plugins with Webpack
---

Last week I started working on a new visualization and I wanted to include a couple of d3 plugins: [d3-legend](https://d3-legend.susielu.com/) by Susie Lu and [d3-line-chunked](https://pbeshai.github.io/d3-line-chunked/) by Peter Beshai.

I spent some time figuring out how to include these plugins with webpack, so I'm writing this small reminder here.

As far as I know, there are at least 3 ways to import d3 and some plugins.

## The wrong way to do it

```javascript
import * as d3 from 'd3'
import * as d3Legend from 'd3-svg-legend'
import * as d3LineChunked from 'd3-line-chunked'
```

This is bad for 2 reasons:

1.  we are importing the entire d3 library
2.  the plugins are not attached to `d3`, so in order to use them we have to do something like this: `const colorLegend = d3Legend.legendColor()`.

## The lazy way to do it

```javascript
import * as d3Base from 'd3'
import { legendColor } from 'd3-svg-legend'
import { lineChunked } from 'd3-line-chunked'

// attach all d3 plugins to the d3 library
const d3 = Object.assign(d3Base, { legendColor, lineChunked })
```

Here we are still importing the entire d3 library, but now the plugins are attached to the `d3` object. This means that we can use them like this: `const colorLegend = d3.legendColor()`. I have to say that I start writing a visualization with this setup. It's very compact and pretty convenient, because we don't have to worry about which d3 functions/submodules we need.

## The efficient way to do it

```javascript
import { select, selectAll } from 'd3-selection'
import { min, extent, range, descending } from 'd3-array'
import { format } from 'd3-format'
import { scaleLinear } from 'd3-scale'
import * as request from 'd3-request' // d3 submodule (contains d3.csv, d3.json, etc)
import { legendColor } from 'd3-svg-legend' // d3 plugin
import { lineChunked } from 'd3-line-chunked' // d3 plugin

// create a Object with only the subset of functions/submodules/plugins that we need
const d3 = Object.assign(
  {},
  {
    select,
    selectAll,
    min,
    extent,
    range,
    descending,
    format,
    scaleLinear,
    legendColor,
    lineChunked,
  },
  request
)
```

D3 version 4 is not a monolithic library like D3 version 3, but a collection of small modules. This is perfect for a module bundler like Webpack, because it means that we can include in your bundles only the functions that we actually need. As you can see, this is a bit tedious though, that's why I start with the "lazy way to do it" and change to the "efficient way to do it" only when my visualization is basically finished.
