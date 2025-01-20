# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [ pkgs.nodejs_20 ];
  # Sets environment variables in the workspace
  env = { };
  idx = let
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    # Workaround for https://community.idx.dev/t/8374
    # `idx.extensions` only work for extensions declared in the Nixpkgs derivation used internally by IDX,
    # forked at some point from the official `release-24.05` channel.
    # Instead of relying on IDX internal installation, we also add a startup script to install/update the extensions.
    extensions = [ "astro-build.astro-vscode" ];
  in {
    inherit extensions;
    workspace = {
      # Runs when a workspace is first created with this `dev.nix` file
      onCreate = {
        install-deps =
          "npm ci --prefer-offline --no-audit --no-progress --timing || npm i --no-audit --no-progress --timing";
        # Workaround described above.
        install-extensions = pkgs.lib.escapeShellArgs ([ "code" ]
          ++ builtins.map (ext: "--install-extension=${ext}") extensions);
        # Open editors for the following files by default, if they exist:
        default.openFiles = [ "src/pages/index.astro" ];
      };
      # To run something each time the workspace is (re)started, use the `onStart` hook
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command =
            [ "npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0" ];
          manager = "web";
        };
      };
    };
  };
}
