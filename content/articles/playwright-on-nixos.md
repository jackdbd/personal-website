---
date: "2024-02-07T21:30:00.000Z"
description: How to run Playwright e2e tests on NixOS.
ogp:
  image: https://res.cloudinary.com/jackdbd/image/upload/v1707340475/shared-libraries-playwright_ujlh1x.png
  imageAlt: Error message shown by Playwright when it can't find the required shared libraries to run browsers.
tags:
  - e2e testing
  - Nix flakes
  - NixOS
  - Playwright
  - tests
title: Playwright on NixOS
---
I have been using NixOS for a few months now, and while it's awesome to have an immutable configuration for my laptop, it's not always easy to setup a development environment with all the necessary dependencies.

In this post I will show you how to get [Playwright](https://playwright.dev/) to work in a Node.js project.

## TL;DR

1. Replace `playwright` with `playwright-core` in your npm `dependencies`.
1. Set `executablePath` in you chromium launch options and point it to where it can find a chromium binary (e.g. you can run `which chromium` to figure this out).

## Full explanation

Let's take this simple script `index.cjs` as an example.

```js
const { chromium } = require('playwright')

const main = async () => {
  const browser = await chromium.launch({
    headless: false
  })

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto('https://www.reddit.com/r/NixOS/')
  await browser.close()
}

main()
```

If we try to execute the script with `node index.cjs`, we encounter an exception. It’s Playwright telling us that a bunch of shared objects are missing. To be more precise, when we are on any Linux distro it’s the [`validateLinuxDependencies`](https://github.com/microsoft/playwright/blob/19a4f15eb67fd82a0b78b12dd94e3564504f83f9/packages/playwright-core/src/server/registry/dependencies.ts#L188C23-L188C48) that throws this exception. Playwright gathers all the missing dependencies, creates an error message, and wraps it in this nicely-formatted double border box.

https://res.cloudinary.com/jackdbd/image/upload/v1707340475/shared-libraries-playwright_ujlh1x.png

Here is the first pice of information we need to solve the puzzle: by default, Playwright uses the **chromium revision it bundles with** (this is also what Puppeteer does).

### Why bundle a chromium revision?

The Playwright team (like the Puppeteer team) bundles a specific chromium revision so then they can focus on supporting only the specific chromium revision they bundle with. The chromium revision they currently target can be found in the [Playwright release notes](https://github.com/microsoft/playwright/blob/19a4f15eb67fd82a0b78b12dd94e3564504f83f9/docs/src/release-notes-js.md?plain=1#L158).

### Where can we find the browsers used by Playwright?

[As they write in the documentation](https://playwright.dev/docs/browsers#managing-browser-binaries), on Linux all browsers bundled with Playwright are stored in the `~/.cache/ms-playwright` directory.

### Double checking the required shared libraries

Now that we know where to find the browsers, we can double check which shared objects are required by the particular chromium revision used by Playwright:

```sh
ldd ~/.cache/ms-playwright/chromium-1091/chrome-linux/chrome
```

On my laptop (NixOS 24.05) I got this:

```sh
linux-vdso.so.1 (0x00007ffca03c5000)
libdl.so.2 => /nix/store/9y8pmvk8gdwwznmkzxa6pwyah52xy3nk-glibc-2.38-27/lib/libdl.so.2 (0x00007f2c90e98000)
libpthread.so.0 => /nix/store/9y8pmvk8gdwwznmkzxa6pwyah52xy3nk-glibc-2.38-27/lib/libpthread.so.0 (0x00007f2c90e93000)
libgobject-2.0.so.0 => not found
libglib-2.0.so.0 => not found
libnss3.so => not found
libnssutil3.so => not found
libsmime3.so => not found
libnspr4.so => not found
libdbus-1.so.3 => not found
libatk-1.0.so.0 => not found
libatk-bridge-2.0.so.0 => not found
libcups.so.2 => not found
libgio-2.0.so.0 => not found
libdrm.so.2 => not found
libexpat.so.1 => not found
libxcb.so.1 => not found
libxkbcommon.so.0 => not found
libatspi.so.0 => not found
libX11.so.6 => not found
libXcomposite.so.1 => not found
libXdamage.so.1 => not found
libXext.so.6 => not found
libXfixes.so.3 => not found
libXrandr.so.2 => not found
libgbm.so.1 => not found
libpango-1.0.so.0 => not found
libcairo.so.2 => not found
libasound.so.2 => not found
libm.so.6 => /nix/store/9y8pmvk8gdwwznmkzxa6pwyah52xy3nk-glibc-2.38-27/lib/libm.so.6 (0x00007f2c90da9000)
        libgcc_s.so.1 => /nix/store/ldrslljw4rg026nw06gyrdwl78k77vyq-xgcc-12.3.0-libgcc/lib/libgcc_s.so.1 (0x00007f2c90d88000)
libc.so.6 => /nix/store/9y8pmvk8gdwwznmkzxa6pwyah52xy3nk-glibc-2.38-27/lib/libc.so.6 (0x00007f2c81218000)
        /lib64/ld-linux-x86-64.so.2 => /nix/store/9y8pmvk8gdwwznmkzxa6pwyah52xy3nk-glibc-2.38-27/lib64/ld-linux-x86-64.so.2 (0x00007f2c90e9f000)
```

In fact, if we set `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true` in our nix shell and then try running `node index.cjs`, we bypass that nicely-formatted black box and get a more traditional stack trace. Here is the most relevant part of the entire stack trace:

```sh
- <launched> pid=179437
- [pid=179437][err] Could not start dynamically linked executable: /home/jack/.cache/ms-playwright/chromium-1091/chrome-linux/chrome
- [pid=179437][err] NixOS cannot run dynamically linked executables intended for generic
- [pid=179437][err] linux environments out of the box. For more information, see:
- [pid=179437][err] https://nix.dev/permalink/stub-ld
- [pid=179437] <process did exit: exitCode=127, signal=null>
- [pid=179437] starting temporary directories cleanup
```

## Three solutions, with their pros and cons

Now that we have double-checked with `ldd` what `validateLinuxDependencies` already told us, we have a few options to make Playwright (and Nix) happy. I can think of at least three:

1. Install all shared objects in one way or another. For example, if we know that a particular nixpkgs package includes a shared object, we can declare that package in our nix shell `packages`. For example, we can declare `pkgs.cairo` and `pkgs.pango` to obtain `libcairo.so.2` and `libpango-1.0.so.0`, respectively.
1. Add `pkgs.playwright-driver.browsers` to the `nativeBuildInputs` and set `export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}` in our `shellHook` (it doesn’t seem mandatory to set `export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true` in `shellHook`).
1. Tell Playwright to use a version of chromium we explicitly specify, instead of the bundled one.

### Option 1

This option seems a bit too complicated to me. In some cases it might be easy to figure out how to get the shared object from a package (e.g. `pkgs.cairo` => `libcairo.so.2`), but others are more challenging. Also, having to list all of these packages in the nix shell is annoying.

### Option 2

This option works, but it forces us to download and compile chromium (and maybe other browsers bundled with Playwright?). Downloading chromium is not a big deal, but compiling it takes forever (I tried once on my laptop and it took an entire night).

### Option 3

This option doesn't require us to compile chromium, as long as we already have a chromium revision on our machine. Also, in some cases we might need to rely on features not provided by the chromium revision bundled with Playwright, so we would need to use a custom chromium anyway. Let's go for this option then!

## Double checking the chromium revision installed via nixpkgs

I use [Home Manager](https://github.com/nix-community/home-manager), and if I run which chromium I see that the chromium binary is at:

```sh
/home/jack/.nix-profile/bin/chromium
```

That location is actually a symlink, and if I run `ls -l /home/jack/.nix-profile/bin/` I see that on my laptop chromium is somewhere in the nix store:

```sh
/nix/store/8595809xjaq1a04djljzp3r3h9ham4z4-chromium-120.0.6099.129/bin/chromium
```

What's the difference between the chromium revision used by Playwright and the chromium revision found in my nix store? The former is dynamically linked, the latter is statically linked. Let’s double check using `ldd`:

```sh
ldd $(which chromium)
```

We get: `not a dynamic executable`.

## Revisiting the JS script

Now that we have decided to **not** use the chromium revision bundled with Playwright, we can update the `index.cjs` script:

```js
const { chromium } = require('playwright-core')

const main = async () => {
  const browser = await chromium.launch({
    // tip: use `which chromium` to figure out where the chromium binary is
    executablePath: '/home/jack/.nix-profile/bin/chromium',
    headless: false
  })

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto('https://www.reddit.com/r/NixOS/')
  await browser.close()
}

main()
```

{% callout "info" %}
By declaring `playwright-core` instead of `playwright` in our `package.json`, we avoid downloading the chromium revision bundled with Playwright. Another way to avoid downloading chromium is to set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` (see [this comment](https://github.com/microsoft/playwright/issues/2905#issuecomment-660083858)) before running `npm install`.
{% endcallout %}

Finally, we can define a nix shell in this `flake.nix`:

```nix
{
  description = "Playwright demo";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";
    # nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = {
    nixpkgs,
    self,
    ...
  } @ inputs: let
    overlays = [
      (final: prev: {
        nodejs = prev.nodejs_20;
      })
    ];
    supportedSystems = ["x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin"];
    forEachSupportedSystem = f:
      nixpkgs.lib.genAttrs supportedSystems (system:
        f {
          pkgs = import nixpkgs {inherit overlays system;};
        });
  in {
    devShells = forEachSupportedSystem ({pkgs}: {
      default = pkgs.mkShell {
        packages = with pkgs; [nodejs];

        shellHook = ''
          echo "welcome to this nix shell"
          echo "- Node.js $(node --version)"
          echo "- npm $(npm --version)"
          echo "- $(chromium --version)"
        '';
      };
    });
  };
}
```

We can also add an `.envrc`, whose content will be this single line:

```txt
use flake
```

{% callout "info" %}
There is no need to set `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true` in this case, since there are no dynamic dependencies to check (because the chromium binary we specified in `executablePath` is a static executable).
{% endcallout %}

I have to admit I haven’t quite figure out how to work with Node.js projects in a *purely nix way*, so for now I create nix shells which are **impure** and require to install npm dependencies by manually typing `npm install` the first time.

*Originally [posted in the NixOS forum](https://discourse.nixos.org/t/running-playwright-tests/25655/12).*
