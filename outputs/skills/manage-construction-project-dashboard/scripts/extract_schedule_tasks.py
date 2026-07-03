#!/usr/bin/env python3
import argparse
import json
import re
from datetime import datetime
from pathlib import Path

import pdfplumber


TASK_RE = re.compile(
    r"^\s*(?P<id>\d+)\s+(?P<name>.+?)\s+"
    r"(?P<duration>\d+)\s+days?\s+"
    r"(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+"
    r"(?P<start>\d{2}/\d{2}/\d{2})\s+"
    r"(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+"
    r"(?P<finish>\d{2}/\d{2}/\d{2})(?:\s+.*)?$",
    re.I,
)


def parse_date(value):
    return datetime.strptime(value, "%d/%m/%y").date()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf")
    parser.add_argument("--start", required=True, help="YYYY-MM-DD")
    parser.add_argument("--end", required=True, help="YYYY-MM-DD")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    window_start = datetime.strptime(args.start, "%Y-%m-%d").date()
    window_end = datetime.strptime(args.end, "%Y-%m-%d").date()
    tasks = {}

    with pdfplumber.open(args.pdf) as pdf:
        for page_number, page in enumerate(pdf.pages, 1):
            text = page.extract_text(x_tolerance=1, y_tolerance=2) or ""
            for line in text.splitlines():
                match = TASK_RE.match(line)
                if not match:
                    continue
                item = match.groupdict()
                start = parse_date(item["start"])
                finish = parse_date(item["finish"])
                if start <= window_end and finish >= window_start:
                    key = (item["id"], item["name"], item["start"], item["finish"])
                    tasks[key] = {
                        "id": int(item["id"]),
                        "name": item["name"].strip(),
                        "duration_days": int(item["duration"]),
                        "start": start.isoformat(),
                        "finish": finish.isoformat(),
                        "source_page": page_number,
                    }

    result = {
        "source": str(Path(args.pdf)),
        "window_start": args.start,
        "window_end": args.end,
        "tasks": sorted(tasks.values(), key=lambda item: (item["start"], item["id"])),
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out} ({len(result['tasks'])} tasks)")


if __name__ == "__main__":
    main()
