"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/ui/app-shell";
import { getClusterSummary, getCountryMetrics, predict } from "@/lib/api";
import type { ClusterRecord, CountryMetricRecord, PredictionResult } from "@/lib/types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

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

  useEffect(() => {
    Promise.all([getClusterSummary(), getCountryMetrics()])
      .then(([clusterRows, countryRows]) => {
        setClusters(clusterRows);
        setCountries(countryRows);
      })
      .catch((err: Error) => setDataError(err.message));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPredictionLoading(true);
    setPredictionError(null);

    try {
      const result = await predict({ uploads, category, country, age });
      setPrediction(result);
    } catch (err) {
      setPredictionError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setPredictionLoading(false);
    }
  }

  const topCountries = useMemo(() => countries.slice(0, 8), [countries]);
  const leadingCluster = clusters[0];

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
      <section className="panelGrid panelGrid3">
        <article className="panel statPanel">
          <p className="statLabel">Tracked Countries</p>
          <strong className="statValue">{number.format(countries.length)}</strong>
          <p className="statMeta">Global footprint covered by analytics.</p>
        </article>
        <article className="panel statPanel">
          <p className="statLabel">Cluster Archetypes</p>
          <strong className="statValue">{number.format(clusters.length)}</strong>
          <p className="statMeta">Including KMeans + DBSCAN segmentation.</p>
        </article>
        <article className="panel statPanel">
          <p className="statLabel">Dominant Archetype</p>
          <strong className="statValue small">{leadingCluster?.archetype ?? "Loading"}</strong>
          <p className="statMeta">Largest current channel behavior segment.</p>
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
                  {clusters.map((row) => (
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
              {topCountries.map((row) => (
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
