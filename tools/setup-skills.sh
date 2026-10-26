#!/usr/bin/env bash
set -euo pipefail

skills_repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
skills_env_path=${BORN_SKILLS_VENV:-"$skills_repo_root/../.venvs/born-skills"}
export UV_CACHE_DIR=${UV_CACHE_DIR:-"$skills_repo_root/../.cache/uv"}

command -v uv >/dev/null

# Canvas Apps gebruikt dnx uit de .NET 10 SDK. Installeer een vaste Linux SDK
# naast de repository wanneer de cloudomgeving die nog niet aanbiedt.
dotnet_dir=${BORN_DOTNET_DIR:-"$skills_repo_root/../.dotnet"}
dotnet_version=10.0.403
dotnet_archive_sha512=b7b3d8461cf98b07d2552ce9199702fa3ad010ac2671a5f8cd5136f7534e50f6855ba7bbb02b11494563f1d04156276a31cda1103b900e5eecd0d9473dc7b9c5
if [[ ! -x "$dotnet_dir/dnx" ]] || [[ ! -x "$dotnet_dir/dotnet" ]] || [[ "$("$dotnet_dir/dotnet" --version 2>/dev/null || true)" != 10.* ]]; then
    command -v curl >/dev/null
    command -v sha512sum >/dev/null
    command -v tar >/dev/null
    dotnet_archive="$skills_repo_root/../.cache/dotnet-sdk-$dotnet_version-linux-x64.tar.gz"
    mkdir -p "$(dirname "$dotnet_archive")" "$dotnet_dir"
    if [[ ! -s "$dotnet_archive" ]]; then
        curl -fsSL "https://builds.dotnet.microsoft.com/dotnet/Sdk/$dotnet_version/dotnet-sdk-$dotnet_version-linux-x64.tar.gz" \
            -o "$dotnet_archive"
    fi
    printf '%s  %s\n' "$dotnet_archive_sha512" "$dotnet_archive" | sha512sum -c -
    tar -xzf "$dotnet_archive" -C "$dotnet_dir"
fi
export PATH="$dotnet_dir:$PATH"
export DOTNET_ROOT="$dotnet_dir"
export DOTNET_CLI_HOME=${DOTNET_CLI_HOME:-"$skills_repo_root/../.dotnet-home"}
export NUGET_PACKAGES=${NUGET_PACKAGES:-"$skills_repo_root/../.cache/nuget"}
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
mkdir -p "$DOTNET_CLI_HOME" "$NUGET_PACKAGES"
dotnet --version

if [[ ! -x "$skills_env_path/bin/python" ]]; then
    uv venv --python python3 "$skills_env_path"
fi
uv pip sync --python "$skills_env_path/bin/python" --require-hashes \
    "$skills_repo_root/vendor/skills/requirements.lock"
"$skills_env_path/bin/python" "$skills_repo_root/tools/check-installed-skills.py" >/dev/null
# De lokale bron is vastgelegd met Git-commit en SHA-256 in upstream-lock.json.
# Bouw offline met de hierboven vastgezette buildtools; haal geen extra deps op.
uv pip install --python "$skills_env_path/bin/python" --no-deps --no-build-isolation \
    --editable "$skills_repo_root/vendor/skills/spreadsheet-auditor"
"$skills_env_path/bin/python" "$skills_repo_root/tools/check-installed-skills.py"
