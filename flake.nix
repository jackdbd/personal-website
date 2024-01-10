{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    # nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1.*.tar.gz";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";

    alejandra = {
      url = "github:kamadorueda/alejandra/3.0.0";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    fh.url = "https://flakehub.com/f/DeterminateSystems/fh/*.tar.gz";

    nil.url = "github:oxalica/nil";
  };

  outputs = {
    fh,
    nil,
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
    # Note: in this Nix flake we cannot read files from the secrets directory
    # because they were added to the .gitignore (only secrets/README.md can be
    # read like this).
    # cloudinary = builtins.readFile ./secrets/cloudinary.json;
    # See here for a longer explanation and a rationale for this behavior:
    # https://discourse.nixos.org/t/readfile-doesnt-find-file/21103/4
    # https://github.com/NixOS/nix/issues/7107
  in {
    devShells = forEachSupportedSystem ({pkgs}: {
      default = pkgs.mkShell {
        # steampipe seems not to work on NixOS. A possible workaround is to run
        # it in a docker container.
        # https://github.com/NixOS/nixpkgs/issues/215945
        packages = with pkgs; [node2nix nodejs steampipe zx];

        # This project depends on @jackdbd/eleventy-plugin-text-to-speech, which
        # depends on jsdom, which depends on canvas.
        # On Linux, canvas requires the shared object file libuuid.so, and we
        # must explicitly require the package libuuid otherwise the build fails.
        buildInputs = [pkgs.libuuid];

        shellHook = ''
          echo "🌐 personal website dev shell"
          echo "- $(chromium --version)"
          echo "- Node.js $(node --version)"
          echo "- npm $(npm --version)"
          echo "- $(steampipe --version)"
          echo "- zx $(zx --version)"

          # secrets exposed as environment variables
          export CLOUDINARY=$(cat /run/secrets/cloudinary);
          export REDDIT=$(cat /run/secrets/reddit/trusted_client);
          export STRIPE_TEST=$(cat /run/secrets/stripe/personal/test);
          export TELEGRAM=$(cat /run/secrets/telegram/personal_bot);
          export WEBMENTION_IO_TOKEN=$(cat /run/secrets/webmentions_io_token);

          # On non-NixOS hosts we don't have secrets in /run/secrets, so we have
          # to use this somewhat hacky workaround to read files untracked by git (see .gitignore)
          export CLOUDINARY=$(cat ./secrets/cloudinary.json)
          export STRIPE_LIVE=$(cat ./secrets/stripe-live.json)
          export TELEGRAM=$(cat ./secrets/telegram.json)
          export WEBMENTION_IO_TOKEN=$(cat ./secrets/webmention-io-token.txt)
        '';

        ARTICLE_SLUG = "test-your-javascript-on-multiple-engines-with-eshost-cli-and-jsvu";
        # DEBUG = "Eleventy:UserConfig";
        DEBUG = "11ty-plugin-cloudinary:*,-11ty-plugin-cloudinary:transforms";
        # DEBUG = "eleventy-plugin-text-to-speech/*,-eleventy-plugin-text-to-speech/transforms";
        DOMAIN = "giacomodebidda.com";
        ELEVENTY_ENV = "development";
        GOOGLE_APPLICATION_CREDENTIALS = "/run/secrets/prj-kitchen-sink/sa-storage-uploader";

        # Requiring the libuuid package is not enough. We must append to
        # LD_LIBRARY_PATH the path to that package, so the linker can find
        # libuuid.so. On NixOS the path to libuuid.so is not added to the linker,
        # so we must add it manually.
        LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [pkgs.libuuid];
        # See also:
        # https://discourse.nixos.org/t/node-libuuid-so-1-not-found/34864
        # https://github.com/Automattic/node-canvas/issues/1893#issuecomment-1096988007
        # It's weird, since jsdom declares canvas as an OPTIONAL peerDependency
        # https://github.com/jsdom/jsdom/blob/main/package.json

        NODE_DEBUG = "gh-workflow:*,scripts:*";
        # ALWAYS set NODE_ENV to production
        # https://youtu.be/HMM7GJC5E2o?si=RaVgw65WMOXDpHT2
        NODE_ENV = "production";
      };
    });
  };
}
