const fs = require("fs");
const CleanCSS = require("clean-css");

const input = fs.readFileSync("_site/style.css");
const output = new CleanCSS({}).minify(input).styles;
const version = String(Date.now());
fs.writeFileSync(`_site/style-minified?v=${version}.css`, output);
