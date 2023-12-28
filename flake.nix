{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1.*.tar.gz";
  };

  outputs = inputs @ {
    self,
    nixpkgs,
  }: let
    overlays = [
      (final: prev: rec {
        nodejs = prev.nodejs_latest;
        pnpm = prev.nodePackages.pnpm;
        yarn = prev.yarn.override {inherit nodejs;};
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
        packages = with pkgs; [node2nix nodejs pnpm yarn];
        # This project depends on @jackdbd/eleventy-plugin-text-to-speech, which
        # depends on jsdom, which depends on canvas.
        # On Linux, canvas requires the shared object file libuuid.so, and we
        # must explicitly require the package libuuid otherwise the build fails.
        buildInputs = [
          pkgs.libuuid
        ];
        # Requiring the libuuid package is not enough. We must append to
        # LD_LIBRARY_PATH the path to that package, so the linker can find
        # libuuid.so. On NixOS, libuuid can be found in util-linux-minimal.
        UTIL_LINUX_MINIMAL_LIB_PATH = "${pkgs.lib.makeLibraryPath [pkgs.libuuid]}";

        shellHook = ''
          export LD_LIBRARY_PATH="$UTIL_LINUX_MINIMAL_LIB_PATH:$LD_LIBRARY_PATH"
          echo LD_LIBRARY_PATH is:
          echo $LD_LIBRARY_PATH | tr ':' '\n'

          # This is a somewhat hacky workaround to read files untracked by git (see .gitignore)
          echo "expose repository secrets as environment variables"
          export CLOUDINARY=$(cat ./secrets/cloudinary.json)
          export STRIPE_LIVE=$(cat ./secrets/stripe-live.json)
          export TELEGRAM=$(cat ./secrets/telegram.json)
          export WEBMENTION_IO_TOKEN=$(cat ./secrets/webmention-io-token.txt)

          # ALWAYS set NODE_ENV to production
          # https://youtu.be/HMM7GJC5E2o?si=RaVgw65WMOXDpHT2
          export NODE_ENV=production

          # Other environment variables
          # export DEBUG=eleventy-plugin-cloudinary*
          export DEBUG=eleventy-plugin-text-to-speech/*,-eleventy-plugin-text-to-speech/transforms
          # export DEBUG=Eleventy:*
          # export ELEVENTY_ENV=development
          export ELEVENTY_ENV=production
        '';
      };
    });
  };
}
