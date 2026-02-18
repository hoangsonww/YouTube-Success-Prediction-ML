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
  getProcessedSample,
  getRawSample,
  getUploadGrowthBuckets,
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
      })
      .catch((err: Error) => setError(err.message));
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

      <section className="panel">
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
                {rawSample.map((row) => (
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
                {processedSample.slice(0, 12).map((row) => (
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
