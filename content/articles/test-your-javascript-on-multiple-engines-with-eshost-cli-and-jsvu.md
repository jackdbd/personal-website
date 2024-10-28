---
date: "2021-05-07T17:00:03.284Z"
description: Testing your code on multiple JavaScript engines can be an effective way to understand how to write more performant libraries and applications.
tags:
  - CLI
  - JavaScript
  - tests
title: Test your JavaScript on multiple engines with eshost-cli and jsvu
---
JavaScript engines are complex software components that optimize and run your JavaScript. Testing your code on multiple engines can be an effective way to understand how to write more performant libraries and applications. This is true no matter whether you are developing  for the browser, Node.js, Deno, or for any other JavaScript runtime.

## Install JS engines with jsvu

Since most engines are written in languages like C, C++ and Rust, you'll have to download the source files and compile them. However, you don't have to do it yourself. A tool like [jsvu](https://github.com/GoogleChromeLabs/jsvu) can download and compile the most popular JS engines for you.

You can install the jsvu CLI with npm (or yarn):

```shell
npm install jsvu -g
```

and run it with:

```shell
jsvu
```

On the first run, `jsvu` asks you for the list of JavaScript engines you wish to manage through `jsvu`, then it creates:

1. a `.jsvu` directory in your home directory;
2. a `status.json` file inside of the `.jsvu` directory

Every time `jsvu` runs, including the first time, it installs the latest version of the engines specified in `~/.jsvu/status.json`.

`jsvu` then compiles the engines' source files and stores their binaries in `~/.jsvu/engines`. It also creates either a symlink or a small shell script to execute each engine's shell.

{% callout "tip" %}You may want to add the `~/.jsvu` directory to your PATH, as they suggest in the [project's README](https://github.com/GoogleChromeLabs/jsvu#installation).{%endcallout %}

Having all JS engines in `~/.jsvu` (through a symlink or a shell script) is quite convenient for setting up [eshost-cli](https://github.com/bterlson/eshost-cli), the tool that runs your code on all of these engines.

## Run JS code on multiple engines with eshost-cli

You can install eshost-cli with npm (or yarn):

```shell
npm install -g eshost-cli
```

You **add** an ECMAScript host with the following syntax:

```shell
eshost --add <host name> <host type> <host path>
```

Let's say that you have previously installed (with jsvu) [GraalJS](https://github.com/oracle/graaljs), [SpiderMonkey](https://spidermonkey.dev/) and [V8](https://github.com/v8/v8). Here is how you can add them as hosts:

```shell
eshost --add 'GraalJS' graaljs ~/.jsvu/graaljs
eshost --add 'SpiderMonkey' jsshell ~/.jsvu/spidermonkey
eshost --add 'V8' d8 ~/.jsvu/v8
eshost --add 'V8-debug' d8 ~/.jsvu/v8-debug
```

{% callout "info" %}That `d8` is not a typo. It's the [V8 developer shell](https://v8.dev/docs/d8).{% endcallout %}

Now that you have configured some hosts, you can evaluate your code on multiple engines:

```shell
eshost --eval '1 + 2' # or just -e
```

```shell
#### GraalJS
3

#### SpiderMonkey
3

#### V8
3

#### V8-debug
3
```

If you prefer a tabular output, just pass the `-t / --table` flag:

```shell
eshost -e '1 + 2' --table # or just -t
```

```shell
┌────────────────┬───┐
│ GraalJS        │ 3 │
├────────────────┼───┤
│ SpiderMonkey   │ 3 │
├────────────────┼───┤
│ V8             │ 3 │
├────────────────┼───┤
│ V8-debug       │ 3 │
└────────────────┴───┘
```

You can evaluate your code on a **single host** with `-h / --host`:

```shell
eshost -e '1 + 2' -t -h GraalJS
```

```shell
┌────────────────┬───┐
│ GraalJS        │ 3 │
└────────────────┴───┘
```

You can also evaluate your code on **multiple hosts**, but first you need to group some hosts together, using a common tag.

Here is how to **edit** existing hosts:

```shell
eshost --edit 'V8' d8 ~/.jsvu/v8 --tags v8,latest
eshost --edit 'V8-debug' d8 ~/.jsvu/v8-debug --tags v8,debug
```

and how to select the hosts by tag:

```shell
eshost -e '1 + 2' -t --tags v8
```

```shell
┌────────────────┬───┐
│ V8             │ 3 │
├────────────────┼───┤
│ V8-debug       │ 3 │
└────────────────┴───┘
```

You can also pass arguments specific to the underlying JavaScript engine. This is useful if you want to understand how a particular engine works. You can output profiling data, enable tracing, generate debugging information from the engine garbage collector/s, optimizing compiler/s, etc.

For example, the flag `--trace-gc-verbose` can be useful if you want to understand how garbage collection works in V8.

```shell
eshost --edit 'V8-debug' --args '--trace-gc-verbose'
```

Keep in mind that every JS engine has its own flags, and there might be a lot of them. I think V8 has more than 500 flags!

Until now we have evaluated inline JavaScript, but eshost-cli allows you to pass a JavaScript file too.

Write the JavaScript you want to test...

```js
// test.js
const x = 42;
console.log(`The answer is ${x}`);
```

...then run eshost-cli to evaluate it:

```shell
eshost test.js
```

Finally, when you no longer need a host, here is how to **delete** it:

```shell
eshost --delete 'JavaScriptCore'
```
