from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd
import plotly.express as px

from youtube_success_ml.config import MAP_DIR

try:
    import folium
except Exception:  # noqa: BLE001
    folium = None


def build_influence_map(df: pd.DataFrame):
    geo = df.dropna(subset=["latitude", "longitude"]).copy()
    geo = geo[geo["country"] != "Unknown"]
    geo["marker_size"] = (geo["subscribers"] / geo["subscribers"].max()).clip(lower=0.02) * 40

    fig = px.scatter_geo(
        geo,
        lat="latitude",
        lon="longitude",
        size="marker_size",
        hover_name="youtuber",
        color="category",
        hover_data={
            "subscribers": True,
            "highest_yearly_earnings": True,
            "uploads": True,
            "latitude": False,
            "longitude": False,
            "marker_size": False,
        },
        title="Global YouTube Influence Map",
        projection="natural earth",
    )
    fig.update_layout(legend_title_text="Category")
    return fig


def build_earnings_choropleth(df: pd.DataFrame):
    agg = (
        df[df["country"] != "Unknown"]
        .groupby(["country", "abbreviation"], as_index=False)
        .agg(total_earnings=("highest_yearly_earnings", "sum"))
    )

    fig = px.choropleth(
        agg,
        locations="abbreviation",
        color="total_earnings",
        hover_name="country",
        color_continuous_scale="Blues",
        title="Yearly Earnings by Country",
    )
    return fig


def build_category_dominance_map(df: pd.DataFrame):
    geo = df.dropna(subset=["latitude", "longitude"]).copy()
    geo = geo[geo["country"] != "Unknown"]

    grouped = (
        geo.groupby(["country", "category", "abbreviation"], as_index=False)
        .agg(
            subscribers=("subscribers", "sum"),
            earnings=("highest_yearly_earnings", "sum"),
            latitude=("latitude", "median"),
            longitude=("longitude", "median"),
        )
        .sort_values("subscribers", ascending=False)
    )
    top = grouped.drop_duplicates(subset=["country"])

    if folium is None:
        fig = px.scatter_geo(
            top,
            lat="latitude",
            lon="longitude",
            size="subscribers",
            color="category",
            hover_name="country",
            title="Category Dominance by Country",
            projection="natural earth",
        )
        return fig

    fmap = folium.Map(location=[20, 0], zoom_start=2, tiles="cartodbpositron")
    for _, row in top.iterrows():
        folium.CircleMarker(
            location=[float(row["latitude"]), float(row["longitude"])],
            radius=7,
            fill=True,
            color="#1f77b4",
            fill_opacity=0.75,
            tooltip=f"{row['country']} | {row['category']}",
            popup=(
                f"Country: {row['country']}<br>"
                f"Dominant category: {row['category']}<br>"
                f"Subscribers: {row['subscribers']:.0f}<br>"
                f"Earnings: ${row['earnings']:.0f}"
            ),
        ).add_to(fmap)
    return fmap


def build_country_metrics(df: pd.DataFrame) -> list[dict[str, Any]]:
    grouped = (
        df[df["country"] != "Unknown"]
        .groupby(["country", "abbreviation"], as_index=False)
        .agg(
            total_subscribers=("subscribers", "sum"),
            total_earnings=("highest_yearly_earnings", "sum"),
        )
    )

    dominant = (
        df[df["country"] != "Unknown"]
        .groupby(["country", "category"], as_index=False)
        .agg(subscribers=("subscribers", "sum"))
        .sort_values("subscribers", ascending=False)
        .drop_duplicates(subset=["country"])
        .rename(columns={"category": "dominant_category"})[["country", "dominant_category"]]
    )

    merged = grouped.merge(dominant, on="country", how="left")
    merged = merged.sort_values("total_subscribers", ascending=False)
    return merged.to_dict(orient="records")


def export_map_assets(df: pd.DataFrame, output_dir: Path | None = None) -> dict[str, Path]:
    output_dir = output_dir or MAP_DIR
    output_dir.mkdir(parents=True, exist_ok=True)

    influence = build_influence_map(df)
    earnings = build_earnings_choropleth(df)
    dominance = build_category_dominance_map(df)

    influence_path = output_dir / "influence_map.html"
    earnings_path = output_dir / "earnings_choropleth.html"
    dominance_path = output_dir / "category_dominance_map.html"

    influence.write_html(str(influence_path), include_plotlyjs="cdn")
    earnings.write_html(str(earnings_path), include_plotlyjs="cdn")
    if folium is not None and hasattr(dominance, "save"):
        dominance.save(str(dominance_path))
    else:
        dominance.write_html(str(dominance_path), include_plotlyjs="cdn")

    return {
        "influence_map": influence_path,
        "earnings_choropleth": earnings_path,
        "category_dominance_map": dominance_path,
    }
