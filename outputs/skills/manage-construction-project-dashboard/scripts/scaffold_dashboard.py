#!/usr/bin/env python3
import argparse
import json
import shutil
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("config")
    parser.add_argument("--out", required=True)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    config = json.loads(Path(args.config).read_text(encoding="utf-8"))
    output = Path(args.out)
    template = Path(__file__).resolve().parents[1] / "assets" / "dashboard-template"

    if output.exists() and any(output.iterdir()) and not args.force:
        raise SystemExit(f"Output is not empty: {output}. Use --force to overwrite.")
    output.mkdir(parents=True, exist_ok=True)

    for source in template.iterdir():
        if source.is_file():
            shutil.copy2(source, output / source.name)

    replacements = {
        "CN8-2": config["project_code"],
        "KHU DÂN CƯ HỖN HỢP": config.get("project_name", "CONSTRUCTION PROJECT").upper(),
        "Công ty TNHH Phát triển Phú Mỹ Hưng": config.get("client", "Owner"),
        "DSPCONS Việt Nam": config.get("consultant", "Supervision consultant"),
        "DSPCONS": config.get("consultant", "Supervision consultant"),
        "VICONS": config.get("contractor", "Main contractor"),
        "G:\\\\My Drive": str(config.get("source_root", "PROJECT SOURCE")).replace("\\", "\\\\"),
    }
    for name in ["index.html", "data.js", "app.js", "server.mjs"]:
        path = output / name
        text = path.read_text(encoding="utf-8")
        for old, new in replacements.items():
            text = text.replace(old, str(new))
        path.write_text(text, encoding="utf-8")

    manifest = output / "project-config.json"
    manifest.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Scaffolded dashboard at {output}")
    print("Replace sample values in data.js and project-specific insight text in app.js.")


if __name__ == "__main__":
    main()
