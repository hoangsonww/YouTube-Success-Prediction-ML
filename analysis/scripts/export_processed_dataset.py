#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from youtube_success_ml.config import DEFAULT_DATA_PATH  # noqa: E402
from youtube_success_ml.data.loader import load_dataset  # noqa: E402

DEFAULT_OUTPUT_PATH = ROOT_DIR / "data" / "global_youtube_statistics_processed.csv"
DEFAULT_METADATA_PATH = ROOT_DIR / "artifacts" / "reports" / "processed_dataset_metadata.json"


def export_processed_dataset(
    input_path: Path | None = None,
    output_path: Path = DEFAULT_OUTPUT_PATH,
    metadata_path: Path = DEFAULT_METADATA_PATH,
) -> dict[str, object]:
    df = load_dataset(path=input_path or DEFAULT_DATA_PATH)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.parent.mkdir(parents=True, exist_ok=True)

    df.to_csv(output_path, index=False)

    metadata = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "input_path": str(input_path or DEFAULT_DATA_PATH),
        "output_path": str(output_path),
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "column_names": df.columns.tolist(),
    }
    metadata_path.write_text(json.dumps(metadata, indent=2))
    return metadata


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export the cleaned + feature-engineered dataset to data/."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help=f"Raw source CSV path (default: {DEFAULT_DATA_PATH})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help=f"Destination processed CSV path (default: {DEFAULT_OUTPUT_PATH})",
    )
    parser.add_argument(
        "--metadata-output",
        type=Path,
        default=DEFAULT_METADATA_PATH,
        help=f"Metadata JSON path (default: {DEFAULT_METADATA_PATH})",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    metadata = export_processed_dataset(
        input_path=args.input,
        output_path=args.output,
        metadata_path=args.metadata_output,
    )
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
