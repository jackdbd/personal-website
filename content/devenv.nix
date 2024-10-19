{pkgs, ...}: {
  enterShell = ''
    echo "Pulling from origin..."
    git pull origin main
    versions
  '';

  env = {};

  languages = {
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
    shellcheck.enable = true;
    statix.enable = true;
  };

  scripts = {
    largest-blobs.exec = ''
      git filter-repo --analyze --force
      cat .git/filter-repo/analysis/blob-shas-and-paths.txt | head -n 7
    '';

    repo-size.exec = ''
      git gc
      git count-objects --human-readable --verbose
    '';

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
