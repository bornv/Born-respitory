"""Controleer skillingangen, bronbestanden en de verplichte ondersteuningsbestanden."""

import hashlib
import json
from pathlib import Path
import runpy


ROOT = Path(__file__).resolve().parents[1]


def main():
    lock_paths = [ROOT / "vendor/skills/upstream-lock.json"]
    extra_lock = ROOT / "vendor/skills/upstream-lock-extra.json"
    if extra_lock.is_file():
        lock_paths.append(extra_lock)
    locks = [json.loads(path.read_text()) for path in lock_paths]
    validate = runpy.run_path(str(
        ROOT / "vendor/skills/anthropics/skill-creator/scripts/quick_validate.py"
    ))["validate_skill"]
    checked = 0
    for lock in locks:
        for source in lock["sources"]:
            for path, expected in source["files"].items():
                actual = hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
                if actual != expected:
                    raise ValueError(f"Bronbestand gewijzigd: {path}")
                checked += 1
    names = set()
    installed = [skill for lock in locks for skill in lock["installed_skills"]]
    for skill in installed:
        name = skill["name"]
        if name in names:
            raise ValueError(f"Dubbele skillnaam: {name}")
        names.add(name)
        entrypoint = ROOT / skill["entrypoint"]
        valid, reason = validate(entrypoint.parent)
        if not valid:
            raise ValueError(f"{name}: {reason}")
        source = ROOT / skill["source"]
        if not source.is_file() or not (ROOT / skill["claude_entrypoint"]).is_file():
            raise ValueError(f"Ontbrekende bron of Claude-ingang: {name}")
        if name != "home-assistant-best-practices":
            if (ROOT / skill["claude_entrypoint"]).resolve() != entrypoint.resolve():
                raise ValueError(f"Claude/Codex-ingangen verschillen: {name}")
        print(f"OK {name}")
    support = [
        "vendor/skills/aurora-smart-home/aurora/souls/river.md",
        "vendor/skills/aurora-smart-home/aurora/references/deliverables/manual-format.md",
        "vendor/skills/aurora-smart-home/aurora/references/validators/node-red-syntax-validator.md",
        "vendor/skills/aurora-smart-home/aurora/references/validators/entity-id-validator.md",
        "vendor/skills/spreadsheet-auditor/spreadsheet_auditor/cli.py",
        "vendor/skills/wshobson/data-quality-frameworks/references/details.md",
    ]
    for path in support:
        if not (ROOT / path).is_file():
            raise ValueError(f"Ontbrekende ondersteuning: {path}")
    print(f"{len(names)} skills, {checked} bronbestanden: gecontroleerd")


if __name__ == "__main__":
    main()
