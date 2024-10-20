{pkgs, ...}: {
  enterShell = ''
    # git-subrepo pull content
    git-subrepo status
  '';

  env = {
    ARTICLE_SLUG = "test-your-javascript-on-multiple-engines-with-eshost-cli-and-jsvu";

    CLOUDINARY = builtins.readFile /run/secrets/cloudinary;

    # DEBUG = "Eleventy:UserConfig";
    DEBUG = "11ty:data:*,11ty-plugin:*,Eleventy:EleventyErrorHandler,linkedin:*,reddit:*,script:*,stripe:*";
    # DEBUG = "script:*,Eleventy:EleventyErrorHandler,11ty-config:*,11ty-plugin:*,-11ty-plugin:TTS:inject-audio-tags-into-html";
    # DEBUG = "11ty-plugin-cloudinary:*,-11ty-plugin-cloudinary:transforms";

    DOMAIN = "giacomodebidda.com";

    GOOGLE_APPLICATION_CREDENTIALS = "/run/secrets/prj-kitchen-sink/sa-storage-uploader";

    GPTCOMMIT__OPENAI__API_KEY = builtins.readFile "/run/secrets/openai/personal_api_key";

    HACKER_NEWS = builtins.readFile /run/secrets/hacker-news/credentials;

    LINKEDIN = builtins.readFile /run/secrets/linkedin/trusted_client;

    NODE_DEBUG = "hn:*,reddit:*,script:*";

    # ALWAYS set NODE_ENV to production
    # https://youtu.be/HMM7GJC5E2o?si=RaVgw65WMOXDpHT2
    NODE_ENV = "production";

    REDDIT = builtins.readFile /run/secrets/reddit/trusted_client;

    # On non-NixOS hosts we don't have secrets in /run/secrets, so we have to
    # use this somewhat hacky workaround to read files untracked by git (see .gitignore)
    STRIPE_LIVE = builtins.readFile /run/secrets/stripe/personal/live;
    STRIPE_TEST = builtins.readFile /run/secrets/stripe/personal/test;

    TELEGRAM = builtins.readFile /run/secrets/telegram/personal_bot;

    WEBMENTION_IO_TOKEN = builtins.readFile /run/secrets/webmentions_io_token;

    # On NixOS, the Chromium version bundled with Playwright does not work
    # because it's not a statically linked executable. So we avoid downloading
    # it and instead we explicitly provide the path to a Chromium binary we have
    # on our system.
    # Note 1: the environment variable `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` must
    # be set BEFORE running `npm install`.
    # https://playwright.dev/docs/library#browser-downloads
    # Note 2: Each version of Playwright bundles a different version of Chromium
    # and it's tested against that version. This means that forcing Playwright
    # to use a different version of Chromium MIGHT not work. Tip: Playwright's
    # release notes mention the Chromium's version bundled with Playwright. Make
    # sure it's not too different from the one you have on your system.
    # https://github.com/microsoft/playwright/releases
    CHROMIUM_PATH = /etc/profiles/per-user/jack/bin/chromium;
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = 1;
  };

  languages = {
    javascript.enable = true;
  };

  packages = with pkgs; [
    git
    git-lfs
    git-filter-repo
    git-subrepo # alternative to git-submodule and git-subtree
    nodejs
    steampipe
    wrangler
    zx
  ];

  pre-commit.hooks = {
    actionlint.enable = true;
    alejandra.enable = true;

    # check-added-large-files.enable = true;
    check-json.enable = true;
    # check-vcs-permalinks.enable = true;
    # cspell.enable = true;
    deadnix.enable = true;
    # eslint.enable = true; # TODO: create config file, then enable
    gptcommit.enable = true;
    html-tidy.enable = true;
    # hunspell.enable = true;
    # lychee.enable = true;
    # markdownlint.enable = true;
    # mdl.enable = true;
    # mkdocs-linkcheck.enable = true;
    prettier = {
      enable = true;
      settings = {
        bracket-same-line = true;
        no-semi = true;
        single-quote = true;
        trailing-comma = "none";
      };
    };
    # pretty-format-json.enable = true;

    shellcheck.enable = true;
    statix.enable = true;

    typos = {
      enable = false;
      excludes = [
        "content/articles/2024-10-17-lorem-ipsum.md"
        "src/_data/talks.11tydata.json"
        "src/includes/assets/pgp-key.txt"
        "src/includes/assets/security.txt"
      ];
    };
    # yamlfmt.enable = true;
    # yamllint.enable = true;
  };

  scripts = {
    dependencies.exec = "npm install --include dev";
    largest-blobs.exec = ''
      git filter-repo --analyze --force
      cat .git/filter-repo/analysis/blob-shas-and-paths.txt | head -n 7
    '';
    pull-content.exec = ''
      git-subrepo pull content --force
      git-subrepo status
    '';
    repo-size.exec = ''
      git gc
      git count-objects --human-readable --verbose
    '';
    readme.exec = "npx tsm scripts/readme.ts";
    serve.exec = "npx serve _site/ -p 3000";
    versions.exec = ''
      echo "=== Versions ==="
      chromium --version
      git --version
      git-lfs --version
      echo "git filter-repo version $(git filter-repo --version)"
      echo "git-subrepo version $(git-subrepo --version)"
      echo "Node.js $(node --version)"
      steampipe --version
      wrangler --version
      echo "zx $(zx --version)"
      echo "=== === ==="
    '';
  };

  # https://devenv.sh/services/
  # services.httpbin.enable = true;
  # services.mailhog.enable = true;
  # services.mailpit.enable = true;
  # services.minio.enable = true;
  # services.temporal.enable = true;
  # services.wiremock.enable = true;
}
