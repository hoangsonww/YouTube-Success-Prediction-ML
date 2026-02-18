#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import plotly.express as px

ROOT_DIR = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from youtube_success_ml.config import DEFAULT_DATA_PATH  # noqa: E402
from youtube_success_ml.data.loader import load_dataset, load_raw_dataset  # noqa: E402

DEFAULT_REPORT_DIR = ROOT_DIR / "artifacts" / "reports" / "eda"
NUMERIC_INSIGHTS = [
    "uploads",
    "subscribers",
    "highest_yearly_earnings",
    "subscribers_for_last_30_days",
    "growth_target",
    "age",
]


def missingness_frame(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame(
        {
            "column": df.columns,
            "null_count": [int(df[col].isna().sum()) for col in df.columns],
            "null_pct": [float(df[col].isna().mean() * 100.0) for col in df.columns],
            "dtype": [str(df[col].dtype) for col in df.columns],
        }
    )
    return out.sort_values(["null_pct", "null_count"], ascending=False, ignore_index=True)


def safe_numeric_describe(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    present = [c for c in columns if c in df.columns]
    if not present:
        return pd.DataFrame()
    return df[present].describe(percentiles=[0.01, 0.05, 0.5, 0.95, 0.99]).transpose()


def write_plot(fig, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.write_html(str(path), include_plotlyjs="cdn")


def run_eda(input_path: Path, output_dir: Path, top_n: int = 20) -> dict[str, object]:
    output_dir.mkdir(parents=True, exist_ok=True)
    raw_df = load_raw_dataset(path=input_path)
    processed_df = load_dataset(path=input_path)

    raw_missing = missingness_frame(raw_df)
    processed_missing = missingness_frame(processed_df)

    raw_missing.to_csv(output_dir / "missingness_raw.csv", index=False)
    processed_missing.to_csv(output_dir / "missingness_processed.csv", index=False)

    numeric_summary = safe_numeric_describe(processed_df, NUMERIC_INSIGHTS)
    numeric_summary.to_csv(output_dir / "numeric_summary_processed.csv", index=True)

    category_distribution = (
        processed_df.groupby("category", as_index=False)["subscribers"]
        .agg(channel_count="count", total_subscribers="sum")
        .sort_values("channel_count", ascending=False, ignore_index=True)
    )
    category_distribution.to_csv(output_dir / "category_distribution.csv", index=False)

    top_countries = (
        processed_df.groupby("country", as_index=False)["subscribers"]
        .sum()
        .rename(columns={"subscribers": "total_subscribers"})
        .sort_values("total_subscribers", ascending=False, ignore_index=True)
        .head(top_n)
    )
    top_countries.to_csv(output_dir / "country_subscribers_top.csv", index=False)

    correlation_cols = [c for c in NUMERIC_INSIGHTS if c in processed_df.columns]
    correlation = processed_df[correlation_cols].corr(numeric_only=True)
    correlation.to_csv(output_dir / "numeric_correlation.csv", index=True)

    write_plot(
        px.bar(
            top_countries,
            x="country",
            y="total_subscribers",
            title=f"Top {top_n} Countries by Subscribers",
        ),
        output_dir / "country_subscribers_top.html",
    )

    write_plot(
        px.box(
            processed_df.head(5000),
            x="category",
            y="growth_target",
            title="Growth Target Distribution by Category",
            points=False,
        ),
        output_dir / "category_growth_distribution.html",
    )

    write_plot(
        px.imshow(
            correlation,
            text_auto=".2f",
            color_continuous_scale="Blues",
            title="Numeric Feature Correlation (Processed Dataset)",
        ),
        output_dir / "numeric_correlation_heatmap.html",
    )

    profile = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "input_path": str(input_path),
        "raw_shape": {"rows": int(raw_df.shape[0]), "columns": int(raw_df.shape[1])},
        "processed_shape": {
            "rows": int(processed_df.shape[0]),
            "columns": int(processed_df.shape[1]),
        },
        "artifacts": {
            "missingness_raw_csv": str(output_dir / "missingness_raw.csv"),
            "missingness_processed_csv": str(output_dir / "missingness_processed.csv"),
            "numeric_summary_csv": str(output_dir / "numeric_summary_processed.csv"),
            "category_distribution_csv": str(output_dir / "category_distribution.csv"),
            "country_subscribers_top_csv": str(output_dir / "country_subscribers_top.csv"),
            "numeric_correlation_csv": str(output_dir / "numeric_correlation.csv"),
            "country_subscribers_top_html": str(output_dir / "country_subscribers_top.html"),
            "category_growth_distribution_html": str(
                output_dir / "category_growth_distribution.html"
            ),
            "numeric_correlation_heatmap_html": str(
                output_dir / "numeric_correlation_heatmap.html"
            ),
        },
    }
    (output_dir / "eda_profile.json").write_text(json.dumps(profile, indent=2))
    return profile


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run production-oriented EDA for the dataset.")
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help=f"Input CSV path (default: {DEFAULT_DATA_PATH})",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_REPORT_DIR,
        help=f"EDA report output directory (default: {DEFAULT_REPORT_DIR})",
    )
    parser.add_argument(
        "--top-n-countries",
        type=int,
        default=20,
        help="Top N countries for ranking/chart outputs.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    profile = run_eda(
        input_path=args.input,
        output_dir=args.output_dir,
        top_n=max(1, int(args.top_n_countries)),
    )
    print(json.dumps(profile, indent=2))


if __name__ == "__main__":
    main()
