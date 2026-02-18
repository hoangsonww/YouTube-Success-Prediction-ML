#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from youtube_success_ml.data.loader import load_dataset
from youtube_success_ml.mlops.feature_store import save_feature_snapshot


def main() -> None:
    parser = argparse.ArgumentParser(description="Export feature store snapshot CSV")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("data/Global YouTube Statistics.csv"),
        help="Input dataset CSV",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/reports/feature_store_snapshot.csv"),
        help="Output snapshot CSV",
    )
    args = parser.parse_args()

    df = load_dataset(path=args.input)
    output = save_feature_snapshot(df, args.output)
    print(f"[feature-store] snapshot exported to {output}")


if __name__ == "__main__":
    main()
