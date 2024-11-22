{
  pkgs,
  astroTemplate ? "basics",
  astroVersion ? "latest",
  ...
}:
{
  packages = [
    pkgs.nodejs_20
  ];

  bootstrap = ''
    mkdir "$out"
    npm create astro@${astroVersion} "$out" -- --template ${astroTemplate} --typescript strict --git --no-install --no-houston

    mkdir -p "$out"/.idx
    cp ${./dev.nix} "$out/.idx/dev.nix"
    cp ${./icon.png} "$out/.idx/icon.png"

    ( cd "$out" && npm i --package-lock-only --ignore-scripts )
  '';
}
