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


def _wrap_embed_html(body_html: str, title: str) -> str:
    safe_title = title.replace("<", "").replace(">", "")
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{safe_title}</title>
  <style>
    html, body {{
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      overflow: hidden;
    }}
    .map-wrap {{
      width: 100%;
      height: 100%;
    }}
    .map-wrap > div,
    .folium-map {{
      width: 100% !important;
      height: 100% !important;
    }}
  </style>
</head>
<body>
  <div class="map-wrap">{body_html}</div>
</body>
</html>"""


def build_influence_map_html(df: pd.DataFrame) -> str:
    fig = build_influence_map(df)
    fig.update_layout(margin=dict(l=0, r=0, t=48, b=0))
    html = fig.to_html(include_plotlyjs="cdn", full_html=False, config={"responsive": True})
    return _wrap_embed_html(html, "Global YouTube Influence Map")


def build_earnings_choropleth_html(df: pd.DataFrame) -> str:
    fig = build_earnings_choropleth(df)
    fig.update_layout(margin=dict(l=0, r=0, t=48, b=0))
    html = fig.to_html(include_plotlyjs="cdn", full_html=False, config={"responsive": True})
    return _wrap_embed_html(html, "Yearly Earnings by Country")


def build_category_dominance_map_html(df: pd.DataFrame) -> str:
    fmap_or_fig = build_category_dominance_map(df)
    if folium is not None and hasattr(fmap_or_fig, "get_root"):
        html = fmap_or_fig.get_root().render()
        return _wrap_embed_html(html, "Category Dominance by Country")

    fmap_or_fig.update_layout(margin=dict(l=0, r=0, t=48, b=0))
    html = fmap_or_fig.to_html(include_plotlyjs="cdn", full_html=False, config={"responsive": True})
    return _wrap_embed_html(html, "Category Dominance by Country")


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
        locations="country",
        locationmode="country names",
        color="total_earnings",
        hover_name="country",
        hover_data={"abbreviation": True, "total_earnings": ":,.0f"},
        color_continuous_scale="Blues",
        title="Yearly Earnings by Country",
    )
    fig.update_geos(showcoastlines=True, coastlinecolor="#9fb7de")
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
            channel_count=("youtuber", "count"),
            avg_growth=("growth_target", "mean"),
            latitude=("latitude", "median"),
            longitude=("longitude", "median"),
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
    records = merged.to_dict(orient="records")
    for row in records:
        latitude = row.get("latitude")
        longitude = row.get("longitude")
        row["latitude"] = float(latitude) if pd.notna(latitude) else None
        row["longitude"] = float(longitude) if pd.notna(longitude) else None
    return records


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
