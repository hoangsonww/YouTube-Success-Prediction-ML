"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { AppShell } from "@/components/ui/app-shell";
import {
  getCategoryPerformance,
  getClusterSummary,
  getCountryMetrics,
  getMapEmbedUrl,
  getProcessedSample,
  getRawSample,
  getUploadGrowthBuckets,
  isOfflineFallbackModeEnabled,
  type MapEmbedKind,
} from "@/lib/api";
import type {
  CategoryPerformanceRecord,
  ClusterRecord,
  CountryMetricRecord,
  ProcessedChannelSample,
  RawChannelSample,
  UploadGrowthBucketRecord,
} from "@/lib/types";

const palette = [
  "#2f6fed",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#ec4899",
];

const MAP_VIEWS: Array<{ kind: MapEmbedKind; label: string; subtitle: string }> = [
  {
    kind: "influence-map",
    label: "Influence",
    subtitle: "Publisher footprint and reach intensity by location",
  },
  {
    kind: "earnings-choropleth",
    label: "Earnings",
    subtitle: "Country heatmap by total yearly earnings",
  },
  {
    kind: "category-dominance",
    label: "Category Dominance",
    subtitle: "Leading content category by country",
  },
];

const FALLBACK_MAP_COUNTRIES: CountryMetricRecord[] = [
  {
    country: "United States",
    abbreviation: "US",
    total_subscribers: 205000000,
    total_earnings: 40800000,
    dominant_category: "Entertainment",
    latitude: 37.0902,
    longitude: -95.7129,
    channel_count: 312,
    avg_growth: 128000,
  },
  {
    country: "India",
    abbreviation: "IN",
    total_subscribers: 194000000,
    total_earnings: 37900000,
    dominant_category: "Music",
    latitude: 20.5937,
    longitude: 78.9629,
    channel_count: 294,
    avg_growth: 142000,
  },
  {
    country: "United Kingdom",
    abbreviation: "GB",
    total_subscribers: 84000000,
    total_earnings: 16500000,
    dominant_category: "Education",
    latitude: 55.3781,
    longitude: -3.436,
    channel_count: 126,
    avg_growth: 72000,
  },
  {
    country: "Brazil",
    abbreviation: "BR",
    total_subscribers: 72000000,
    total_earnings: 14100000,
    dominant_category: "People & Blogs",
    latitude: -14.235,
    longitude: -51.9253,
    channel_count: 118,
    avg_growth: 69000,
  },
  {
    country: "Japan",
    abbreviation: "JP",
    total_subscribers: 68000000,
    total_earnings: 12900000,
    dominant_category: "Gaming",
    latitude: 36.2048,
    longitude: 138.2529,
    channel_count: 104,
    avg_growth: 64000,
  },
  {
    country: "South Korea",
    abbreviation: "KR",
    total_subscribers: 64000000,
    total_earnings: 12400000,
    dominant_category: "Music",
    latitude: 35.9078,
    longitude: 127.7669,
    channel_count: 98,
    avg_growth: 67000,
  },
  {
    country: "Canada",
    abbreviation: "CA",
    total_subscribers: 53000000,
    total_earnings: 10300000,
    dominant_category: "Science & Technology",
    latitude: 56.1304,
    longitude: -106.3468,
    channel_count: 86,
    avg_growth: 51000,
  },
  {
    country: "Germany",
    abbreviation: "DE",
    total_subscribers: 47000000,
    total_earnings: 9200000,
    dominant_category: "News & Politics",
    latitude: 51.1657,
    longitude: 10.4515,
    channel_count: 79,
    avg_growth: 43000,
  },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonForInlineScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildFallbackMapHtml(
  kind: MapEmbedKind,
  rows: CountryMetricRecord[],
  title: string,
  subtitle: string
) {
  const candidates = rows
    .filter(
      (row) =>
        typeof row.latitude === "number" &&
        Number.isFinite(row.latitude) &&
        typeof row.longitude === "number" &&
        Number.isFinite(row.longitude)
    )
    .slice(0, 24);

  const categories = Array.from(new Set(candidates.map((row) => row.dominant_category)));
  const categoryColors = new Map<string, string>();
  categories.forEach((category, index) => {
    categoryColors.set(category, palette[index % palette.length]);
  });

  const subscribersMax = Math.max(...candidates.map((row) => row.total_subscribers), 1);
  const earningsMax = Math.max(...candidates.map((row) => row.total_earnings), 1);
  const growthMax = Math.max(...candidates.map((row) => row.avg_growth ?? 0), 1);
  const channelMax = Math.max(...candidates.map((row) => row.channel_count ?? 1), 1);

  const points = candidates.map((row) => {
    const subscriberRatio = row.total_subscribers / subscribersMax;
    const earningsRatio = row.total_earnings / earningsMax;
    const growthRatio = (row.avg_growth ?? 0) / growthMax;
    const channelRatio = (row.channel_count ?? 1) / channelMax;

    let color = "#2f6fed";
    let radius = 9;
    if (kind === "influence-map") {
      color = `hsl(${220 - growthRatio * 68}, 86%, ${43 + growthRatio * 13}%)`;
      radius = 8 + subscriberRatio * 16;
    } else if (kind === "earnings-choropleth") {
      color = `hsl(${36 - earningsRatio * 30}, 95%, ${48 + earningsRatio * 7}%)`;
      radius = 8 + earningsRatio * 16;
    } else {
      color = categoryColors.get(row.dominant_category) ?? "#14b8a6";
      radius = 8 + channelRatio * 14;
    }

    const popup = [
      `<strong>${escapeHtml(row.country)}</strong>`,
      `Subs: ${fmt(row.total_subscribers)}`,
      `Earnings: ${fmt(row.total_earnings)}`,
      `Category: ${escapeHtml(row.dominant_category)}`,
      `Growth: ${fmt(row.avg_growth ?? 0)}`,
      `Channels: ${fmt(row.channel_count ?? 0)}`,
    ].join("<br/>");

    return {
      country: row.country,
      latitude: row.latitude ?? 0,
      longitude: row.longitude ?? 0,
      color,
      radius,
      popup,
    };
  });

  const avgLat =
    points.length > 0 ? points.reduce((sum, point) => sum + point.latitude, 0) / points.length : 20;
  const avgLon =
    points.length > 0 ? points.reduce((sum, point) => sum + point.longitude, 0) / points.length : 0;

  const pointsJson = jsonForInlineScript(points);
  const legendText =
    kind === "influence-map"
      ? "Bubble size scales by total subscribers; color reflects growth momentum."
      : kind === "earnings-choropleth"
        ? "Bubble size and color intensity reflect yearly earnings concentration."
        : "Bubble size scales by channel count; color encodes dominant content category.";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <style>
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      background: #eaf1fb;
    }
    #map {
      width: 100%;
      height: 100%;
      filter: saturate(1.05) contrast(1.02);
    }
    .leaflet-container {
      background: linear-gradient(180deg, #eef5ff, #dce8fb);
    }
    .map-headline {
      position: absolute;
      z-index: 500;
      left: 12px;
      top: 10px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(195, 212, 241, 0.9);
      padding: 6px 9px;
      line-height: 1.25;
      color: #163e79;
      box-shadow: 0 4px 16px rgba(23, 56, 112, 0.14);
    }
    .map-headline strong {
      display: block;
      font-size: 12px;
      letter-spacing: 0.02em;
    }
    .map-headline span {
      display: block;
      margin-top: 2px;
      font-size: 11px;
      color: #49689b;
      max-width: 320px;
    }
    .map-error {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #264b84;
      padding: 1rem;
      background: linear-gradient(180deg, rgba(238, 245, 255, 0.95), rgba(228, 238, 255, 0.95));
      font-size: 13px;
      z-index: 700;
    }
  </style>
</head>
<body>
  <div class="map-headline">
    <strong>${escapeHtml(title)} (Demo Data)</strong>
    <span>${escapeHtml(subtitle)}</span>
    <span>${escapeHtml(legendText)}</span>
  </div>
  <div id="map"></div>
  <div id="mapError" class="map-error">
    Map tiles could not be loaded. Demo geospatial points remain available.
  </div>
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script>
    (function () {
      if (!window.L) {
        const error = document.getElementById("mapError");
        if (error) error.style.display = "flex";
        return;
      }
      const points = ${pointsJson};
      const map = L.map("map", {
        zoomControl: true,
        worldCopyJump: true,
        minZoom: 2,
        maxZoom: 6,
      }).setView([${avgLat.toFixed(4)}, ${avgLon.toFixed(4)}], 2);

      const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 6,
        attribution: "&copy; OpenStreetMap contributors",
      });

      tileLayer.on("tileerror", function () {
        const error = document.getElementById("mapError");
        if (error) error.style.display = "flex";
      });
      tileLayer.addTo(map);

      points.forEach(function (point) {
        const marker = L.circleMarker([point.latitude, point.longitude], {
          radius: point.radius,
          color: point.color,
          fillColor: point.color,
          fillOpacity: 0.46,
          weight: 2,
        }).addTo(map);
        marker.bindPopup(point.popup, { maxWidth: 260 });
      });
    })();
  </script>
</body>
</html>`;
}

function compact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

function fmt(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function tooltipNumber(value: unknown) {
  return fmt(Number(value ?? 0));
}

function tooltipPair(value: unknown, name: unknown) {
  return [fmt(Number(value ?? 0)), String(name ?? "")];
}

export function ChartsPageClient() {
  const [mounted, setMounted] = useState(false);
  const [countries, setCountries] = useState<CountryMetricRecord[]>([]);
  const [clusters, setClusters] = useState<ClusterRecord[]>([]);
  const [rawSample, setRawSample] = useState<RawChannelSample[]>([]);
  const [processedSample, setProcessedSample] = useState<ProcessedChannelSample[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformanceRecord[]>([]);
  const [uploadBuckets, setUploadBuckets] = useState<UploadGrowthBucketRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [activeMapView, setActiveMapView] = useState<MapEmbedKind>("influence-map");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapFrameError, setMapFrameError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    Promise.all([
      getCountryMetrics(),
      getClusterSummary(),
      getRawSample(12),
      getProcessedSample(50),
      getCategoryPerformance(12),
      getUploadGrowthBuckets(),
    ])
      .then(([countryRows, clusterRows, rawRows, processedRows, categoryRows, bucketRows]) => {
        setCountries(countryRows);
        setClusters(clusterRows);
        setRawSample(rawRows);
        setProcessedSample(processedRows);
        setCategoryPerformance(categoryRows);
        setUploadBuckets(bucketRows);
        setOfflineMode(isOfflineFallbackModeEnabled());
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setDataLoading(false));
  }, []);

  const topCountries = useMemo(
    () =>
      countries.slice(0, 10).map((row) => ({
        country: row.country,
        subscribers: Math.round(row.total_subscribers),
        earnings: Math.round(row.total_earnings),
      })),
    [countries]
  );

  const cumulativeCountry = useMemo(() => {
    let acc = 0;
    return topCountries.map((row) => {
      acc += row.subscribers;
      return { ...row, cumulative_subscribers: acc };
    });
  }, [topCountries]);

  const categoryPie = useMemo(
    () =>
      categoryPerformance.map((row, i) => ({
        name: row.category,
        value: row.channel_count,
        fill: palette[i % palette.length],
      })),
    [categoryPerformance]
  );

  const categoryGrowth = useMemo(
    () =>
      [...categoryPerformance]
        .sort((a, b) => b.avg_growth - a.avg_growth)
        .slice(0, 8)
        .map((row) => ({
          category: row.category,
          avg_growth: Math.round(row.avg_growth),
          avg_earnings: Math.round(row.avg_earnings),
        })),
    [categoryPerformance]
  );

  const scatterData = useMemo(
    () =>
      processedSample.slice(0, 250).map((row) => ({
        uploads: row.uploads,
        growth: row.growth_target,
        earnings: Math.max(1, row.highest_yearly_earnings),
        subscribers: row.subscribers,
        category: row.category,
      })),
    [processedSample]
  );

  const clusterComp = useMemo(
    () =>
      clusters.map((row) => ({
        archetype: row.archetype,
        size: row.size,
        avg_growth: Math.round(row.avg_growth),
        avg_earnings: Math.round(row.avg_earnings),
      })),
    [clusters]
  );

  const clusterMatrix = useMemo(
    () =>
      clusters.map((row, index) => ({
        cluster_id: row.cluster_id,
        archetype: row.archetype,
        avg_uploads: Math.round(row.avg_uploads),
        avg_growth: Math.round(row.avg_growth),
        avg_earnings: Math.max(1, Math.round(row.avg_earnings)),
        size: row.size,
        fill: palette[index % palette.length],
      })),
    [clusters]
  );

  const mapUrl = useMemo(() => getMapEmbedUrl(activeMapView), [activeMapView]);

  const activeMapConfig = useMemo(
    () => MAP_VIEWS.find((item) => item.kind === activeMapView) ?? MAP_VIEWS[0],
    [activeMapView]
  );

  const mapTotals = useMemo(
    () =>
      countries.reduce(
        (acc, row) => {
          acc.subscribers += row.total_subscribers;
          acc.earnings += row.total_earnings;
          return acc;
        },
        { subscribers: 0, earnings: 0 }
      ),
    [countries]
  );

  const mapFallbackRows = useMemo(() => {
    const withGeo = countries.filter(
      (row) =>
        typeof row.latitude === "number" &&
        Number.isFinite(row.latitude) &&
        typeof row.longitude === "number" &&
        Number.isFinite(row.longitude)
    );
    return (withGeo.length > 0 ? withGeo : FALLBACK_MAP_COUNTRIES).slice(0, 16);
  }, [countries]);

  const mapUsingFallback = offlineMode || mapFrameError !== null;
  const fallbackMapHtml = useMemo(
    () =>
      buildFallbackMapHtml(
        activeMapView,
        mapFallbackRows,
        activeMapConfig.label,
        activeMapConfig.subtitle
      ),
    [activeMapConfig.label, activeMapConfig.subtitle, activeMapView, mapFallbackRows]
  );

  const mapCategoryLeaders = useMemo(() => {
    const counts = new Map<string, number>();
    countries.forEach((row) => {
      counts.set(row.dominant_category, (counts.get(row.dominant_category) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [countries]);

  useEffect(() => {
    setMapLoaded(false);
    setMapFrameError(null);
  }, [activeMapView, offlineMode]);

  return (
    <AppShell
      eyebrow="Visualization Layer"
      title="Charts and Data Processing"
      subtitle="Explore meaningful channel dynamics through real charting primitives and model-aware analytics."
      actions={[
        { href: "/", label: "Back to Overview", tone: "secondary" },
        { href: "/intelligence/lab", label: "Open Intelligence Lab" },
      ]}
    >
      {error && <p className="error">{error}</p>}
      {offlineMode && (
        <div className="demoNotice">
          Demo mode is active because the backend API is unreachable. These charts and tables use
          placeholder analytics data, and map tabs render realistic demo geo views. Start the
          backend and set `NEXT_PUBLIC_API_BASE_URL` for full live iframe maps.
        </div>
      )}
      {dataLoading && (
        <section className="panel">
          <div className="panelHeader">
            <h2>Loading Analytics Dataset</h2>
            <span className="chip">Skeleton</span>
          </div>
          <div className="skeletonChart" />
        </section>
      )}

      <section className="panel mapPanel">
        <div className="panelHeader">
          <h2>Global Intelligence Mapping</h2>
          <span className="chip">Real World Maps</span>
        </div>

        <div className="mapControlBar">
          <p className="mapHint">{activeMapConfig.subtitle}</p>
          <div className="mapToggleGroup" role="tablist" aria-label="Map view">
            {MAP_VIEWS.map((view) => (
              <button
                key={view.kind}
                type="button"
                role="tab"
                className={
                  activeMapView === view.kind ? "mapToggleButton active" : "mapToggleButton"
                }
                onClick={() => setActiveMapView(view.kind)}
                aria-selected={activeMapView === view.kind}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mapFrameShell">
          {!mounted ? (
            <div className="chartPlaceholder">Preparing map...</div>
          ) : (
            <>
              {!mapLoaded && (
                <div className="mapFrameOverlay">Rendering {activeMapConfig.label} map...</div>
              )}
              <iframe
                key={`${activeMapView}-${mapUsingFallback ? "fallback" : "live"}`}
                title={`Global map: ${activeMapConfig.label}`}
                src={mapUsingFallback ? undefined : mapUrl}
                srcDoc={mapUsingFallback ? fallbackMapHtml : undefined}
                className="mapFrame"
                loading="lazy"
                onLoad={() => setMapLoaded(true)}
                onError={() => {
                  if (!mapUsingFallback) {
                    setMapFrameError("The map iframe failed to load from the backend.");
                    setMapLoaded(false);
                  }
                }}
              />
            </>
          )}
        </div>
        {mapUsingFallback && (
          <p className="mutedText">
            Live backend map iframe unavailable. Showing a real interactive demo map with local
            analytics fallback data.
          </p>
        )}

        <div className="mapStatsGrid">
          <article className="mapStatCard">
            <p>Countries covered</p>
            <strong>{fmt(countries.length)}</strong>
          </article>
          <article className="mapStatCard">
            <p>Total subscribers</p>
            <strong>{compact(mapTotals.subscribers)}</strong>
          </article>
          <article className="mapStatCard">
            <p>Total yearly earnings</p>
            <strong>{compact(mapTotals.earnings)}</strong>
          </article>
          <article className="mapStatCard">
            <p>Largest market</p>
            <strong>{countries[0]?.country ?? "N/A"}</strong>
          </article>
        </div>

        <div className="mapLegendRow">
          {mapCategoryLeaders.map((item) => (
            <span key={item.category} className="mapLegendChip">
              <i />
              {item.category} ({item.count})
            </span>
          ))}
        </div>
      </section>

      <section className="panelGrid panelGrid2">
        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Top Countries: Subscribers vs Earnings</h2>
            <span className="chip">Comparative Bar</span>
          </div>
          <div className="chartWrap">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCountries} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis dataKey="country" angle={-25} textAnchor="end" height={60} interval={0} />
                  <YAxis tickFormatter={compact} />
                  <Tooltip formatter={tooltipNumber} />
                  <Legend />
                  <Bar dataKey="subscribers" fill="#2f6fed" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="earnings" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartPlaceholder">Preparing chart...</div>
            )}
          </div>
        </article>

        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Subscriber Concentration Curve</h2>
            <span className="chip">Cumulative Area</span>
          </div>
          <div className="chartWrap">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cumulativeCountry}
                  margin={{ top: 12, right: 12, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis dataKey="country" />
                  <YAxis tickFormatter={compact} />
                  <Tooltip formatter={tooltipNumber} />
                  <Area
                    type="monotone"
                    dataKey="cumulative_subscribers"
                    stroke="#2f6fed"
                    fill="#cfe0ff"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartPlaceholder">Preparing chart...</div>
            )}
          </div>
        </article>
      </section>

      <section className="panelGrid panelGrid2">
        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Category Share by Channel Count</h2>
            <span className="chip">Distribution Pie</span>
          </div>
          <div className="chartWrap">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPie}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    innerRadius={60}
                  >
                    {categoryPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipPair} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartPlaceholder">Preparing chart...</div>
            )}
          </div>
        </article>

        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Top Categories by Avg Growth</h2>
            <span className="chip">Bar + Line</span>
          </div>
          <div className="chartWrap">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryGrowth}
                  margin={{ top: 12, right: 12, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis dataKey="category" angle={-20} textAnchor="end" interval={0} height={60} />
                  <YAxis yAxisId="left" tickFormatter={compact} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={compact} />
                  <Tooltip formatter={tooltipNumber} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avg_growth" fill="#2f6fed" radius={[8, 8, 0, 0]} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avg_earnings"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartPlaceholder">Preparing chart...</div>
            )}
          </div>
        </article>
      </section>

      <section className="panelGrid panelGrid2">
        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Uploads vs Growth (Channel Scatter)</h2>
            <span className="chip">Scatter Plot</span>
          </div>
          <div className="chartWrapTall">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 12, right: 18, left: 0, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis type="number" dataKey="uploads" name="uploads" tickFormatter={compact} />
                  <YAxis type="number" dataKey="growth" name="growth" tickFormatter={compact} />
                  <ZAxis type="number" dataKey="earnings" range={[25, 220]} />
                  <Tooltip formatter={tooltipPair} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={scatterData} fill="#2f6fed" fillOpacity={0.5} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartPlaceholder">Preparing chart...</div>
            )}
          </div>
        </article>

        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Upload Buckets: Growth and Earnings</h2>
            <span className="chip">Multi-line Trend</span>
          </div>
          <div className="chartWrapTall">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={uploadBuckets}
                  margin={{ top: 12, right: 16, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis dataKey="upload_bucket" />
                  <YAxis tickFormatter={compact} />
                  <Tooltip formatter={tooltipNumber} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avg_growth"
                    stroke="#2f6fed"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_earnings"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_subscribers"
                    stroke="#f59e0b"
                    strokeWidth={2.2}
                    dot={{ r: 2.5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartPlaceholder">Preparing chart...</div>
            )}
          </div>
        </article>
      </section>

      <section className="panelGrid panelGrid2">
        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Cluster Composition Snapshot</h2>
            <span className="chip">Archetype Mix</span>
          </div>
          <div className="chartWrap">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clusterComp} margin={{ top: 12, right: 12, left: 0, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis dataKey="archetype" />
                  <YAxis tickFormatter={compact} />
                  <Tooltip formatter={tooltipNumber} />
                  <Legend />
                  <Bar dataKey="size" fill="#2f6fed" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="avg_growth" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartPlaceholder">Preparing chart...</div>
            )}
          </div>
        </article>

        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Cluster Strategy Matrix</h2>
            <span className="chip">Bubble Cluster View</span>
          </div>
          <div className="chartWrap">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis
                    type="number"
                    dataKey="avg_uploads"
                    name="avg_uploads"
                    tickFormatter={compact}
                  />
                  <YAxis
                    type="number"
                    dataKey="avg_growth"
                    name="avg_growth"
                    tickFormatter={compact}
                  />
                  <ZAxis
                    type="number"
                    dataKey="avg_earnings"
                    name="avg_earnings"
                    range={[120, 620]}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) {
                        return null;
                      }
                      const point = payload[0]?.payload as
                        | (typeof clusterMatrix)[number]
                        | undefined;
                      if (!point) {
                        return null;
                      }
                      return (
                        <div className="clusterTooltip">
                          <strong>{point.archetype}</strong>
                          <p>Cluster: {point.cluster_id}</p>
                          <p>Avg uploads: {fmt(point.avg_uploads)}</p>
                          <p>Avg growth: {fmt(point.avg_growth)}</p>
                          <p>Avg earnings: {fmt(point.avg_earnings)}</p>
                          <p>Members: {fmt(point.size)}</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={clusterMatrix} fill="#2f6fed" fillOpacity={0.85}>
                    {clusterMatrix.map((row) => (
                      <Cell key={`cluster-matrix-${row.cluster_id}`} fill={row.fill} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartPlaceholder">Preparing chart...</div>
            )}
          </div>
        </article>
      </section>

      <section className="panelGrid panelGrid2">
        <section className="panel">
          <div className="panelHeader">
            <h2>Raw Data Sample (Pre-Processing)</h2>
            <span className="chip">Source Contract</span>
          </div>
          <div className="tableShell">
            <table>
              <thead>
                <tr>
                  <th>Youtuber</th>
                  <th>Uploads</th>
                  <th>Category</th>
                  <th>Country</th>
                  <th>Subscribers</th>
                  <th>Yearly Earnings</th>
                  <th>30-day Subs</th>
                  <th>Created Year</th>
                </tr>
              </thead>
              <tbody>
                {dataLoading
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={`raw-skeleton-${idx}`}>
                        <td colSpan={8}>
                          <div className="skeletonRow" />
                        </td>
                      </tr>
                    ))
                  : rawSample.map((row) => (
                      <tr key={`raw-${row.youtuber}`}>
                        <td>{row.youtuber}</td>
                        <td>{fmt(row.uploads)}</td>
                        <td>{row.category ?? "null"}</td>
                        <td>{row.country ?? "null"}</td>
                        <td>{fmt(row.subscribers)}</td>
                        <td>{fmt(row.highest_yearly_earnings)}</td>
                        <td>{row.subscribers_for_last_30_days ?? "null"}</td>
                        <td>{row.created_year ?? "null"}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <h2>Processed Data Sample (Model-Ready)</h2>
            <span className="chip">Feature Contract</span>
          </div>
          <div className="tableShell">
            <table>
              <thead>
                <tr>
                  <th>Youtuber</th>
                  <th>Uploads</th>
                  <th>Category</th>
                  <th>Country</th>
                  <th>Age</th>
                  <th>Subscribers</th>
                  <th>Yearly Earnings</th>
                  <th>Growth Target</th>
                </tr>
              </thead>
              <tbody>
                {dataLoading
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={`processed-skeleton-${idx}`}>
                        <td colSpan={8}>
                          <div className="skeletonRow" />
                        </td>
                      </tr>
                    ))
                  : processedSample.slice(0, 12).map((row) => (
                      <tr key={`processed-${row.youtuber}-${row.uploads}`}>
                        <td>{row.youtuber}</td>
                        <td>{fmt(row.uploads)}</td>
                        <td>{row.category}</td>
                        <td>{row.country}</td>
                        <td>{row.age}</td>
                        <td>{fmt(row.subscribers)}</td>
                        <td>{fmt(row.highest_yearly_earnings)}</td>
                        <td>{fmt(row.growth_target)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
