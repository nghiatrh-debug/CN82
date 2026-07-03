#!/usr/bin/env python3
import argparse
import re
import subprocess
from pathlib import Path


REQUIRED = ["index.html", "styles.css", "data.js", "app.js", "server.mjs"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("dashboard")
    parser.add_argument("--node", default="node")
    args = parser.parse_args()
    root = Path(args.dashboard)

    missing = [name for name in REQUIRED if not (root / name).exists()]
    if missing:
        raise SystemExit(f"Missing files: {', '.join(missing)}")

    html = (root / "index.html").read_text(encoding="utf-8")
    references = re.findall(r'(?:src|href)="\./([^"#?]+)"', html)
    broken = [ref for ref in references if not (root / ref).exists()]
    if broken:
        raise SystemExit(f"Broken references: {', '.join(broken)}")

    leftovers = []
    for name in ["index.html", "data.js", "app.js"]:
        text = (root / name).read_text(encoding="utf-8")
        if "{{" in text or "[TODO" in text:
            leftovers.append(name)
    if leftovers:
        raise SystemExit(f"Unresolved placeholders: {', '.join(leftovers)}")

    for name in ["data.js", "app.js", "server.mjs"]:
        subprocess.run([args.node, "--check", str(root / name)], check=True)
    print("Dashboard validation passed")


if __name__ == "__main__":
    main()
