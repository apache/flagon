{
  description = "Apache Flagon — behavioral analytics monorepo";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            # Node / TypeScript (UserALE.js)
            nodejs_24
            pnpm
            typescript

            # Python (Distill)
            python313
            uv

            # Pre-commit hooks
            lefthook

            # Protobuf (schema codegen — future use)
            buf

            # Tools
            git
            jq
            curl
            nixpkgs-fmt
          ];

          shellHook = ''
            echo "🔥 Apache Flagon dev shell"
            echo "   node:   $(node --version)"
            echo "   pnpm:   $(pnpm --version)"
            echo "   tsc:    $(tsc --version)"
            echo "   python: $(python3 --version)"
            echo "   buf:    $(buf --version 2>&1 | head -1)"
            echo ""

            # Install lefthook git hooks on first entry
            if [ ! -f .git/hooks/pre-commit ] || ! grep -q lefthook .git/hooks/pre-commit 2>/dev/null; then
              echo "Installing lefthook git hooks..."
              lefthook install
            fi

            echo "Run 'pnpm install' in products/userale to get started"
          '';
        };
      });
}
