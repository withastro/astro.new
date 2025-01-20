{ pkgs, astroTemplate ? "basics", debug ? false, ... }: {
  packages = [ pkgs.git pkgs.nodejs_20 pkgs.nodePackages.pnpm ];

  bootstrap = let
    script = pkgs.writeShellScript "bootstrap" ''
      set -exo pipefail
      logfile="$PWD/create.log"
      {
        ${
          pkgs.lib.strings.escapeShellArgs [
            # Limit time that can be used to create project.
            # An error will be shown to the users to be sent on an issue.
            "timeout"
            # Kill process if it doesn't exit 15 second after SIGTERM
            "-k"
            "15s"
            # Send SIGTERM if project creation takes more than 15s
            "15s"
            # Create new project on a "project" folder in the bootstrap environment
            # `npm create` hangs randomly when running inside of Nix building, use PNPM
            # to create the project within the bootstrap environment and use NPM for intalling
            # dependencies on later stages
            "pnpm"
            "create"
            "astro@latest"
            "project"
            "--template"
            astroTemplate # Use the selected template
            "--git" # Initialize Git repository in the new workspace
            "--no-install" # Skip installing dependency as it is done on a later phase of IDX startup
            "--skip-houston" # Skip the Houston animation since this command runs non-interactively
            "--yes" # Accept all default options
          ]
        }

        # Move the project to the workspace output
        mv project "$out"

        cd "$out"

        # Create IDX config directory in the workspace
        mkdir -p ".idx"

        # Copy the template development configuration into the IDX directory
        # Use cat piped to a file so it doesn't carry the permissions from the Nix store (read-only and owned by a different user)
        cat ${./dev.nix} > ".idx/dev.nix"
        
        # Overwrite extensions file for IDX so it doesn't show the extension recommendation popup
        # The extension will be installed automatically
        mkdir -p .vscode
        cat ${./extensions.json} > ".vscode/extensions.json"
      } 2>&1 | tee "$logfile"

      ${if debug then ''mv "$logfile" "$out/create.log"'' else ""}
    '';
  in ''
    # Timeout for the whole bootstrap script
    timeout -k 30s 30s ${script}
  '';
}
