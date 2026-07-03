#!/usr/bin/env python3
import argparse
import json
import re
from collections import Counter
from datetime import datetime
from pathlib import Path


CATEGORIES = {
    "daily_report": re.compile(r"daily|báo cáo ngày|bao cao ngay", re.I),
    "weekly_report": re.compile(r"weekly|báo cáo tuần|bao cao tuan", re.I),
    "monthly_report": re.compile(r"monthly|báo cáo tháng|bao cao thang", re.I),
    "meeting_minutes": re.compile(r"meeting|biên bản họp|bbh|mom", re.I),
    "approved_schedule": re.compile(r"schedule|tiến độ|baseline|msp", re.I),
    "monitoring": re.compile(r"quan trắc|monitoring|inclinometer|settlement|stress", re.I),
    "payment_cost": re.compile(r"payment|thanh toán|chi phí|cost|variation|boq", re.I),
}


def classify(name: str):
    return [key for key, pattern in CATEGORIES.items() if pattern.search(name)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("root")
    parser.add_argument("--out", required=True)
    parser.add_argument("--latest", type=int, default=30)
    args = parser.parse_args()

    root = Path(args.root)
    if not root.exists():
        raise SystemExit(f"Source root not found: {root}")

    files = []
    categories = Counter()
    extensions = Counter()
    top_folders = Counter()

    for path in root.rglob("*"):
        if not path.is_file() or path.name.lower() == "desktop.ini":
            continue
        stat = path.stat()
        relative = path.relative_to(root)
        tags = classify(str(relative))
        files.append({
            "path": str(path),
            "relative_path": str(relative),
            "name": path.name,
            "extension": path.suffix.lower(),
            "size": stat.st_size,
            "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "categories": tags,
        })
        extensions[path.suffix.lower() or "(none)"] += 1
        top_folders[relative.parts[0] if len(relative.parts) > 1 else "(root)"] += 1
        categories.update(tags)

    files.sort(key=lambda item: item["modified_at"], reverse=True)
    result = {
        "source_root": str(root),
        "generated_at": datetime.now().isoformat(),
        "total_files": len(files),
        "extensions": dict(extensions.most_common()),
        "top_folders": dict(top_folders.most_common()),
        "category_counts": dict(categories),
        "latest_files": files[:args.latest],
        "candidates": {
            key: [item for item in files if key in item["categories"]][:args.latest]
            for key in CATEGORIES
        },
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out} ({len(files)} files)")


if __name__ == "__main__":
    main()
