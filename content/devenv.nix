{pkgs, ...}: {
  enterShell = ''
    echo "Pulling from origin..."
    git pull origin main
    versions
  '';

  env = {
    TELEGRAM = builtins.readFile /run/secrets/telegram/jackdbd_github_bot;
    TOKEN_FOR_DISPATCH_PULL_CONTENT_EVENT = builtins.readFile /run/secrets/github-tokens/crud_contents_api;
  };

  languages = {
    javascript.enable = true;
    nix.enable = true;
  };

  packages = with pkgs; [
    git
    git-lfs
    git-filter-repo
  ];

  pre-commit.hooks = {
    alejandra.enable = true;
    deadnix.enable = true;

    # Maybe enable this in combination with markdownlint.
    # denofmt.enable = true;

    html-tidy.enable = true;

    # This checks permalinks but it's very slow.
    # lychee.enable = true;

    # This is certainly useful, but there so many linting errors in my files...
    # markdownlint.enable = true;

    prettier = {
      enable = true;
      settings = {
        bracket-same-line = true;
        no-semi = true;
        single-quote = true;
        trailing-comma = "none";
      };
    };

    statix.enable = true;

    # Super useful. It catches a lot of typos. But since it's mostly for source
    # code, non-English names in my articles are often flagged. To avoid these
    # false positives one can configure a TOML config file.
    # https://github.com/crate-ci/typos?tab=readme-ov-file#false-positives
    typos = {
      enable = true;
      excludes = [
        "articles/interesting-things-other-people-did-in-2016.md"
        "articles/interesting-things-other-people-did-in-2017.md"
      ];
    };
  };

  scripts = {
    articles.exec = "npx markserv articles";
    largest-blobs.exec = ''
      git filter-repo --analyze --force
      cat .git/filter-repo/analysis/blob-shas-and-paths.txt | head -n 7
    '';
    notes.exec = "npx markserv notes";
    repo-size.exec = ''
      git gc
      git count-objects --human-readable --verbose
    '';
    serve.exec = "npx markserv .";
    serve-media.exec = ''
      python3 -m http.server --directory media 8080
    '';
    versions.exec = ''
      echo "=== Versions ==="
      git --version
      git-lfs --version
      echo "git filter-repo version $(git filter-repo --version)"
      echo "=== === ==="
    '';
  };
}
