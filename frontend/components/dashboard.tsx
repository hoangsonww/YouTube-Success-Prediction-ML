"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/ui/app-shell";
import {
  getClusterSummary,
  getCountryMetrics,
  isOfflineFallbackModeEnabled,
  predict,
} from "@/lib/api";
import type { ClusterRecord, CountryMetricRecord, PredictionResult } from "@/lib/types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const palette = ["#2f6fed", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function Dashboard() {
  const [uploads, setUploads] = useState(500);
  const [category, setCategory] = useState("Education");
  const [country, setCountry] = useState("United States");
  const [age, setAge] = useState(5);

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const [clusters, setClusters] = useState<ClusterRecord[]>([]);
  const [countries, setCountries] = useState<CountryMetricRecord[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    Promise.all([getClusterSummary(), getCountryMetrics()])
      .then(([clusterRows, countryRows]) => {
        setClusters(clusterRows);
        setCountries(countryRows);
        setOfflineMode(isOfflineFallbackModeEnabled());
      })
      .catch((err: Error) => setDataError(err.message))
      .finally(() => setDataLoading(false));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPredictionLoading(true);
    setPredictionError(null);

    try {
      const result = await predict({ uploads, category, country, age });
      setPrediction(result);
      setOfflineMode(isOfflineFallbackModeEnabled());
    } catch (err) {
      setPredictionError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setPredictionLoading(false);
    }
  }

  const topCountries = useMemo(() => countries.slice(0, 8), [countries]);
  const leadingCluster = clusters[0];
  const countryMomentum = useMemo(
    () =>
      topCountries.slice(0, 6).map((row) => ({
        country: row.country.length > 13 ? `${row.country.slice(0, 13)}...` : row.country,
        subscribers: row.total_subscribers,
        earnings: row.total_earnings,
      })),
    [topCountries]
  );
  const clusterWheel = useMemo(
    () =>
      clusters.map((row, index) => ({
        archetype: row.archetype,
        size: row.size,
        fill: palette[index % palette.length],
      })),
    [clusters]
  );
  const revenueEfficiency = useMemo(
    () =>
      topCountries.slice(0, 6).map((row) => ({
        country: row.country.length > 13 ? `${row.country.slice(0, 13)}...` : row.country,
        efficiency_per_million:
          row.total_subscribers > 0 ? (row.total_earnings / row.total_subscribers) * 1_000_000 : 0,
        subscribers: row.total_subscribers,
        earnings: row.total_earnings,
      })),
    [topCountries]
  );
  const categoryPressure = useMemo(() => {
    const grouped = new Map<string, { total_size: number; weighted_growth: number }>();
    clusters.forEach((row) => {
      const existing = grouped.get(row.dominant_category) ?? { total_size: 0, weighted_growth: 0 };
      existing.total_size += row.size;
      existing.weighted_growth += row.avg_growth * row.size;
      grouped.set(row.dominant_category, existing);
    });
    return Array.from(grouped.entries())
      .map(([category, value]) => ({
        category: category.length > 16 ? `${category.slice(0, 16)}...` : category,
        total_size: value.total_size,
        avg_growth: value.total_size > 0 ? value.weighted_growth / value.total_size : 0,
      }))
      .sort((a, b) => b.total_size - a.total_size)
      .slice(0, 6);
  }, [clusters]);
  const marketShareBalance = useMemo(() => {
    const selected = topCountries.slice(0, 6);
    const totalSubscribers = selected.reduce((acc, row) => acc + row.total_subscribers, 0);
    const totalEarnings = selected.reduce((acc, row) => acc + row.total_earnings, 0);
    return selected.map((row) => {
      const country = row.country.length > 13 ? `${row.country.slice(0, 13)}...` : row.country;
      const subscriber_share =
        totalSubscribers > 0 ? (row.total_subscribers / totalSubscribers) * 100 : 0;
      const earnings_share = totalEarnings > 0 ? (row.total_earnings / totalEarnings) * 100 : 0;
      const efficiency_per_million =
        row.total_subscribers > 0 ? (row.total_earnings / row.total_subscribers) * 1_000_000 : 0;
      return { country, subscriber_share, earnings_share, efficiency_per_million };
    });
  }, [topCountries]);
  const monetizationLift = useMemo(
    () =>
      marketShareBalance.map((row) => ({
        country: row.country,
        lift: row.earnings_share - row.subscriber_share,
        efficiency_per_million: row.efficiency_per_million,
      })),
    [marketShareBalance]
  );

  return (
    <AppShell
      eyebrow="Production ML Platform"
      title="YouTube Success Intelligence"
      subtitle="Forecast channel outcomes, inspect competitive archetypes, and make monetization decisions with a unified analytics workspace."
      actions={[
        { href: "/visualizations/charts", label: "Open Visualizations" },
        { href: "/intelligence/lab", label: "Open Intelligence Lab", tone: "secondary" },
      ]}
    >
      {offlineMode && (
        <div className="demoNotice">
          Demo mode is active because the backend API is unreachable. The UI is showing placeholder
          data and local fallback predictions only. Start the backend and point
          `NEXT_PUBLIC_API_BASE_URL` to it for full functionality.
        </div>
      )}

      <section className="panelGrid panelGrid3">
        <article className="panel statPanel">
          <p className="statLabel">Tracked Countries</p>
          {dataLoading ? (
            <span className="skeletonText skeletonLg" aria-hidden="true" />
          ) : (
            <strong className="statValue">{number.format(countries.length)}</strong>
          )}
          <p className="statMeta">Global footprint covered by analytics.</p>
        </article>
        <article className="panel statPanel">
          <p className="statLabel">Cluster Archetypes</p>
          {dataLoading ? (
            <span className="skeletonText skeletonLg" aria-hidden="true" />
          ) : (
            <strong className="statValue">{number.format(clusters.length)}</strong>
          )}
          <p className="statMeta">Including KMeans + DBSCAN segmentation.</p>
        </article>
        <article className="panel statPanel">
          <p className="statLabel">Dominant Archetype</p>
          {dataLoading ? (
            <span className="skeletonText skeletonMd" aria-hidden="true" />
          ) : (
            <strong className="statValue small">
              {leadingCluster?.archetype ?? "Unavailable"}
            </strong>
          )}
          <p className="statMeta">Largest current channel behavior segment.</p>
        </article>
      </section>

      <section className="panelGrid panelGrid2">
        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Market Momentum Lens</h2>
            <span className="chip">Subscribers + Earnings</span>
          </div>
          <div className="chartWrap">
            {dataLoading ? (
              <div className="chartPlaceholder">Preparing card...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={countryMomentum}
                  margin={{ top: 12, right: 14, left: 0, bottom: 12 }}
                >
                  <defs>
                    <linearGradient id="subscribersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2f6fed" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2f6fed" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis dataKey="country" />
                  <YAxis yAxisId="left" tickFormatter={(v) => number.format(Number(v ?? 0))} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v) => currency.format(Number(v ?? 0))}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "earnings"
                        ? currency.format(Number(value ?? 0))
                        : number.format(Number(value ?? 0)),
                      String(name ?? ""),
                    ]}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="subscribers"
                    stroke="#2f6fed"
                    fill="url(#subscribersFill)"
                    strokeWidth={2.3}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="earnings"
                    stroke="#14b8a6"
                    fill="transparent"
                    strokeWidth={2.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Archetype Share Wheel</h2>
            <span className="chip">Cluster Mix</span>
          </div>
          <div className="chartWrap">
            {dataLoading ? (
              <div className="chartPlaceholder">Preparing card...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clusterWheel}
                    dataKey="size"
                    nameKey="archetype"
                    innerRadius={56}
                    outerRadius={118}
                  >
                    {clusterWheel.map((entry) => (
                      <Cell key={`wheel-${entry.archetype}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => number.format(Number(value ?? 0))} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section className="panelGrid panelGrid2">
        <article className="panel">
          <div className="panelHeader">
            <h2>Predict Channel Success</h2>
            <span className="chip">Live Model</span>
          </div>

          <form onSubmit={onSubmit} className="form formGrid2">
            <label>
              Uploads
              <input
                type="number"
                min={0}
                value={uploads}
                onChange={(e) => setUploads(Number(e.target.value))}
                required
              />
            </label>

            <label>
              Channel Age (years)
              <input
                type="number"
                min={0}
                max={100}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                required
              />
            </label>

            <label>
              Category
              <input value={category} onChange={(e) => setCategory(e.target.value)} required />
            </label>

            <label>
              Country
              <input value={country} onChange={(e) => setCountry(e.target.value)} required />
            </label>

            <button type="submit" className="primaryButton" disabled={predictionLoading}>
              {predictionLoading ? "Predicting..." : "Run Prediction"}
            </button>
          </form>

          {predictionError && <p className="error">{predictionError}</p>}

          {prediction && (
            <div className="kpiGrid">
              <div className="kpi">
                <span>Subscribers</span>
                <strong>{number.format(prediction.predicted_subscribers)}</strong>
              </div>
              <div className="kpi">
                <span>Yearly Earnings</span>
                <strong>{currency.format(prediction.predicted_earnings)}</strong>
              </div>
              <div className="kpi">
                <span>30-Day Growth</span>
                <strong>{number.format(prediction.predicted_growth)}</strong>
              </div>
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panelHeader">
            <h2>Cluster Archetypes</h2>
            <span className="chip">Strategic View</span>
          </div>

          {dataError ? (
            <p className="error">{dataError}</p>
          ) : (
            <div className="tableShell">
              <table>
                <thead>
                  <tr>
                    <th>Cluster</th>
                    <th>Archetype</th>
                    <th>Size</th>
                    <th>Avg Growth</th>
                    <th>Dominant Category</th>
                  </tr>
                </thead>
                <tbody>
                  {dataLoading
                    ? Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={`cluster-skeleton-${idx}`}>
                          <td colSpan={5}>
                            <div className="skeletonRow" />
                          </td>
                        </tr>
                      ))
                    : clusters.map((row) => (
                        <tr key={row.cluster_id}>
                          <td>{row.cluster_id}</td>
                          <td>{row.archetype}</td>
                          <td>{number.format(row.size)}</td>
                          <td>{number.format(row.avg_growth)}</td>
                          <td>{row.dominant_category}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="panelGrid panelGrid2">
        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Revenue Efficiency Signals</h2>
            <span className="chip">Earnings / 1M Subs</span>
          </div>
          <div className="chartWrap">
            {dataLoading ? (
              <div className="chartPlaceholder">Preparing card...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueEfficiency}
                  margin={{ top: 10, right: 12, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis dataKey="country" />
                  <YAxis tickFormatter={(v) => currency.format(Number(v ?? 0))} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "efficiency_per_million"
                        ? currency.format(Number(value ?? 0))
                        : number.format(Number(value ?? 0)),
                      String(name ?? ""),
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="efficiency_per_million"
                    name="efficiency_per_million"
                    stroke="#f59e0b"
                    strokeWidth={2.8}
                    dot={{ r: 3.5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Category Pressure Map</h2>
            <span className="chip">Dominance Weight</span>
          </div>
          <div className="chartWrap">
            {dataLoading ? (
              <div className="chartPlaceholder">Preparing card...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryPressure}
                  margin={{ top: 10, right: 12, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis dataKey="category" />
                  <YAxis yAxisId="left" tickFormatter={(v) => number.format(Number(v ?? 0))} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v) => number.format(Number(v ?? 0))}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      number.format(Number(value ?? 0)),
                      String(name ?? ""),
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="total_size" fill="#2f6fed" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="avg_growth" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section className="panelGrid panelGrid2">
        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Market Share Balance</h2>
            <span className="chip">Subs vs Earnings Share</span>
          </div>
          <div className="chartWrap">
            {dataLoading ? (
              <div className="chartPlaceholder">Preparing card...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={marketShareBalance}
                  margin={{ top: 10, right: 12, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis dataKey="country" />
                  <YAxis tickFormatter={(v) => `${Number(v ?? 0).toFixed(0)}%`} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${Number(value ?? 0).toFixed(2)}%`,
                      String(name ?? ""),
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="subscriber_share" fill="#2f6fed" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="earnings_share" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Monetization Lift Curve</h2>
            <span className="chip">Share Gap + Efficiency</span>
          </div>
          <div className="chartWrap">
            {dataLoading ? (
              <div className="chartPlaceholder">Preparing card...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monetizationLift}
                  margin={{ top: 10, right: 12, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis dataKey="country" />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(v) => `${Number(v ?? 0).toFixed(1)}%`}
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v) => currency.format(Number(v ?? 0))}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "efficiency_per_million"
                        ? currency.format(Number(value ?? 0))
                        : `${Number(value ?? 0).toFixed(2)}%`,
                      String(name ?? ""),
                    ]}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="lift"
                    stroke="#ef4444"
                    strokeWidth={2.6}
                    dot={{ r: 3.5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="efficiency_per_million"
                    stroke="#f59e0b"
                    strokeWidth={2.4}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <h2>Global Country Intelligence</h2>
          <span className="chip">Top Markets</span>
        </div>

        <div className="tableShell">
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Subscribers</th>
                <th>Earnings</th>
                <th>Dominant Category</th>
              </tr>
            </thead>
            <tbody>
              {dataLoading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={`country-skeleton-${idx}`}>
                      <td colSpan={4}>
                        <div className="skeletonRow" />
                      </td>
                    </tr>
                  ))
                : topCountries.map((row) => (
                    <tr key={row.country}>
                      <td>{row.country}</td>
                      <td>{number.format(row.total_subscribers)}</td>
                      <td>{currency.format(row.total_earnings)}</td>
                      <td>{row.dominant_category}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
