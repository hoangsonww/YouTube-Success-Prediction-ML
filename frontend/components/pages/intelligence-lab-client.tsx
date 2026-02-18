"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/ui/app-shell";
import {
  getFeatureImportance,
  getRecommendation,
  predictBatch,
  runDriftCheck,
  simulatePrediction,
} from "@/lib/api";
import type {
  BatchPredictionResponse,
  DriftCheckResponse,
  FeatureImportanceResponse,
  PredictionPayload,
  RecommendationResponse,
  SimulationResponse,
} from "@/lib/types";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const DEFAULT_BATCH_ITEMS: PredictionPayload[] = [
  { uploads: 200, category: "Education", country: "United States", age: 4 },
  { uploads: 1200, category: "Entertainment", country: "India", age: 8 },
];
const COMMON_CATEGORIES = [
  "Education",
  "Entertainment",
  "Music",
  "Film & Animation",
  "People & Blogs",
  "Gaming",
  "Science & Technology",
  "News & Politics",
];
const COMMON_COUNTRIES = [
  "United States",
  "India",
  "United Kingdom",
  "Canada",
  "Brazil",
  "Japan",
  "South Korea",
  "Germany",
];

function tooltipNumber(value: unknown) {
  return number.format(Number(value ?? 0));
}

function tooltipFixed(value: unknown) {
  return Number(value ?? 0).toFixed(4);
}

function titleCase(input: string): string {
  return input
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function prettifyFeatureName(feature: string): { full: string; short: string } {
  const numericMatch = feature.match(/^numeric__([^_]+)$/);
  if (numericMatch) {
    const field = numericMatch[1].replaceAll("_", " ");
    const label = titleCase(field);
    return { full: label, short: label };
  }

  const categoricalMatch = feature.match(/^(?:categorical__ohe__|categorical__)([^_]+)_(.*)$/);
  if (categoricalMatch) {
    const fieldRaw = categoricalMatch[1].trim();
    const valueRaw = categoricalMatch[2].trim();
    const field = titleCase(fieldRaw.replaceAll("_", " "));
    const valueNormalized = valueRaw.length > 0 ? valueRaw.replaceAll("_", " ").trim() : "Unknown";
    const full = `${field}: ${valueNormalized}`;
    const shortValue =
      valueNormalized.length > 18 ? `${valueNormalized.slice(0, 18)}...` : valueNormalized;
    return { full, short: `${field}: ${shortValue}` };
  }

  const fallback = titleCase(feature.replaceAll("_", " ").replaceAll("__", " "));
  const short = fallback.length > 24 ? `${fallback.slice(0, 24)}...` : fallback;
  return { full: fallback, short };
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function toRecord(value: unknown, index: number): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Record ${index + 1} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function parseNonNegativeNumber(value: unknown, field: "uploads" | "age", index: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`Record ${index + 1} has invalid "${field}". Use a non-negative number.`);
  }
  return numeric;
}

function parseRequiredText(value: unknown, field: "category" | "country", index: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Record ${index + 1} has invalid "${field}". Use a non-empty string.`);
  }
  return value.trim();
}

function normalizeBatchRecord(value: unknown, index: number): PredictionPayload {
  const row = toRecord(value, index);
  return {
    uploads: clampInteger(parseNonNegativeNumber(row.uploads, "uploads", index), 0, 5_000_000),
    category: parseRequiredText(row.category, "category", index),
    country: parseRequiredText(row.country, "country", index),
    age: clampInteger(parseNonNegativeNumber(row.age, "age", index), 0, 100),
  };
}

function parseBatchInput(text: string): PredictionPayload[] {
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Payload must be a JSON array.");
  }
  if (parsed.length === 0) {
    throw new Error("Payload must include at least one record.");
  }
  return parsed.map((row, index) => normalizeBatchRecord(row, index));
}

export function IntelligenceLabClient() {
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState("Education");
  const [country, setCountry] = useState("United States");
  const [age, setAge] = useState(5);
  const [startUploads, setStartUploads] = useState(100);
  const [endUploads, setEndUploads] = useState(1000);
  const [step, setStep] = useState(100);

  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [importance, setImportance] = useState<FeatureImportanceResponse | null>(null);
  const [drift, setDrift] = useState<DriftCheckResponse | null>(null);

  const [batchText, setBatchText] = useState(JSON.stringify(DEFAULT_BATCH_ITEMS, null, 2));
  const [draftUploads, setDraftUploads] = useState(350);
  const [draftCategory, setDraftCategory] = useState("Education");
  const [draftCountry, setDraftCountry] = useState("United States");
  const [draftAge, setDraftAge] = useState(5);
  const [batchResult, setBatchResult] = useState<BatchPredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const growthSeries = useMemo(() => {
    if (!simulation) {
      return [];
    }
    return simulation.points.map((p) => ({
      uploads: p.uploads,
      growth: Math.round(p.predicted_growth),
      earnings: Math.round(p.predicted_earnings),
    }));
  }, [simulation]);

  const importanceSeries = useMemo(
    () =>
      importance?.records
        .map((r) => {
          const labels = prettifyFeatureName(r.feature);
          return {
            feature: labels.full,
            shortLabel: labels.short,
            importance: Number(r.importance.toFixed(4)),
          };
        })
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10) ?? [],
    [importance]
  );

  const batchValidation = useMemo(() => {
    const trimmed = batchText.trim();
    if (trimmed.length === 0 || trimmed === "[]") {
      return { isValid: false, count: 0, message: "Add records or load a sample payload." };
    }

    try {
      const items = parseBatchInput(batchText);
      const suffix = items.length === 1 ? "" : "s";
      return {
        isValid: true,
        count: items.length,
        message: `${number.format(items.length)} record${suffix} ready for inference.`,
      };
    } catch (err) {
      return {
        isValid: false,
        count: 0,
        message: err instanceof Error ? err.message : "Invalid batch payload.",
      };
    }
  }, [batchText]);

  function setBatchPayload(items: PredictionPayload[]) {
    setBatchText(JSON.stringify(items, null, 2));
    setBatchResult(null);
  }

  function loadSampleBatch() {
    setBatchPayload(DEFAULT_BATCH_ITEMS);
    setError(null);
  }

  function clearBatchInput() {
    setBatchText("[]");
    setBatchResult(null);
    setError(null);
  }

  function formatBatchInput() {
    try {
      const items = parseBatchInput(batchText);
      setBatchPayload(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to format payload.");
    }
  }

  function addDraftRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const trimmed = batchText.trim();
      const base = trimmed.length === 0 || trimmed === "[]" ? [] : parseBatchInput(trimmed);
      const categoryText = draftCategory.trim();
      const countryText = draftCountry.trim();

      if (!categoryText || !countryText) {
        throw new Error("Draft record requires both category and country.");
      }

      const record: PredictionPayload = {
        uploads: clampInteger(draftUploads, 0, 5_000_000),
        category: categoryText,
        country: countryText,
        age: clampInteger(draftAge, 0, 100),
      };

      setBatchPayload([...base, record]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add draft record.");
    }
  }

  function removeLastRecord() {
    try {
      const base = parseBatchInput(batchText);
      if (base.length === 0) {
        return;
      }
      setBatchPayload(base.slice(0, -1));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove record.");
    }
  }

  async function runSimulationAndRecommendation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const [sim, rec, fi, driftResult] = await Promise.all([
        simulatePrediction({
          category,
          country,
          age,
          start_uploads: startUploads,
          end_uploads: endUploads,
          step,
        }),
        getRecommendation({ uploads: endUploads, category, country, age }),
        getFeatureImportance("subscribers", 12),
        runDriftCheck([
          { uploads: startUploads, category, country, age },
          { uploads: endUploads, category, country, age },
        ]),
      ]);

      setSimulation(sim);
      setRecommendation(rec);
      setImportance(fi);
      setDrift(driftResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run intelligence workflows.");
    } finally {
      setLoading(false);
    }
  }

  async function runBatchPrediction() {
    if (!batchValidation.isValid) {
      setError(batchValidation.message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const items = parseBatchInput(batchText);
      const batch = await predictBatch(items);
      setBatchResult(batch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch inference failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      eyebrow="Advanced Intelligence"
      title="Model Lab"
      subtitle="Run high-signal what-if analysis, strategy recommendations, explainability insights, and drift-aware batch inference from one professional workspace."
      actions={[
        { href: "/", label: "Back to Overview", tone: "secondary" },
        { href: "/visualizations/charts", label: "Open Visualizations" },
      ]}
    >
      {error && <p className="error">{error}</p>}

      <section className="panelGrid panelGrid2">
        <article className="panel">
          <div className="panelHeader">
            <h2>Scenario Simulator + Recommendation</h2>
            <span className="chip">Decision Engine</span>
          </div>

          <form onSubmit={runSimulationAndRecommendation} className="form formGrid2">
            <label>
              Category
              <input value={category} onChange={(e) => setCategory(e.target.value)} />
            </label>
            <label>
              Country
              <input value={country} onChange={(e) => setCountry(e.target.value)} />
            </label>
            <label>
              Age
              <input
                type="number"
                min={0}
                max={100}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </label>
            <label>
              Step
              <input
                type="number"
                min={1}
                value={step}
                onChange={(e) => setStep(Number(e.target.value))}
              />
            </label>
            <label>
              Upload Range Start
              <input
                type="number"
                min={0}
                value={startUploads}
                onChange={(e) => setStartUploads(Number(e.target.value))}
              />
            </label>
            <label>
              Upload Range End
              <input
                type="number"
                min={0}
                value={endUploads}
                onChange={(e) => setEndUploads(Number(e.target.value))}
              />
            </label>
            <button type="submit" className="primaryButton" disabled={loading}>
              {loading ? "Running..." : "Run Lab"}
            </button>
          </form>

          {simulation && (
            <div className="kpiGrid">
              <div className="kpi">
                <span>Best Uploads (Growth)</span>
                <strong>{number.format(simulation.best_uploads_by_growth)}</strong>
              </div>
              <div className="kpi">
                <span>Best Uploads (Earnings)</span>
                <strong>{number.format(simulation.best_uploads_by_earnings)}</strong>
              </div>
            </div>
          )}

          {recommendation && (
            <div className="noteBox">
              <p>
                Archetype: <strong>{recommendation.cluster.archetype}</strong> | Risk:{" "}
                <strong>{recommendation.risk_level}</strong>
              </p>
              <ul className="flatList">
                {recommendation.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </article>

        <article className="panel chartPanel">
          <div className="panelHeader">
            <h2>Growth Curve + Explainability</h2>
            <span className="chip">Recharts</span>
          </div>

          <div className="chartWrap">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthSeries} margin={{ top: 12, right: 12, left: 0, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis dataKey="uploads" />
                  <YAxis yAxisId="left" tickFormatter={(v) => number.format(Number(v ?? 0))} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v) => number.format(Number(v ?? 0))}
                  />
                  <Tooltip formatter={tooltipNumber} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="growth"
                    stroke="#2f6fed"
                    strokeWidth={2.8}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="earnings"
                    stroke="#14b8a6"
                    strokeWidth={2.6}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartPlaceholder">Preparing chart...</div>
            )}
          </div>

          <div className="chartWrap">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={importanceSeries}
                  margin={{ top: 12, right: 12, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ff" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="shortLabel"
                    width={160}
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <Tooltip
                    formatter={tooltipFixed}
                    labelFormatter={(label, payload) =>
                      String(payload?.[0]?.payload?.feature ?? label ?? "")
                    }
                  />
                  <Bar dataKey="importance" fill="#2f6fed" radius={[0, 7, 7, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartPlaceholder">Preparing chart...</div>
            )}
          </div>
        </article>
      </section>

      {drift && (
        <section className="panel">
          <div className="panelHeader">
            <h2>Drift Snapshot</h2>
            <span className="chip">Runtime Risk</span>
          </div>

          <p className="mutedText">
            Drift risk: <strong>{String(drift.summary.is_drift_risk)}</strong> | High severity
            records: <strong>{drift.summary.high_severity_records}</strong>
          </p>

          <div className="tableShell">
            <table>
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Severity</th>
                  <th>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {drift.records.map((row) => (
                  <tr key={row.index}>
                    <td>{row.index}</td>
                    <td>{row.severity}</td>
                    <td>{row.warnings.join("; ") || "None"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panelHeader">
          <h2>Batch Prediction Workbench</h2>
          <span className="chip">JSON + Structured Results</span>
        </div>

        <p className="mutedText">
          Build payloads with the guided form, then validate and run one-click inference on the full
          batch.
        </p>

        <section className="batchInputGrid">
          <form className="batchBuilder" onSubmit={addDraftRecord}>
            <h3>Add Record</h3>
            <label>
              Uploads
              <input
                type="number"
                min={0}
                value={draftUploads}
                onChange={(e) => setDraftUploads(Number(e.target.value))}
              />
            </label>
            <label>
              Age
              <input
                type="number"
                min={0}
                max={100}
                value={draftAge}
                onChange={(e) => setDraftAge(Number(e.target.value))}
              />
            </label>
            <label>
              Category
              <input
                list="batch-category-options"
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
              />
            </label>
            <label>
              Country
              <input
                list="batch-country-options"
                value={draftCountry}
                onChange={(e) => setDraftCountry(e.target.value)}
              />
            </label>
            <button type="submit" className="secondaryButton">
              Add to Payload
            </button>
            <button
              type="button"
              className="ghostButton"
              onClick={removeLastRecord}
              disabled={!batchValidation.isValid || batchValidation.count === 0}
            >
              Remove Last
            </button>
          </form>

          <div className="batchEditor">
            <div className="batchEditorHeader">
              <div>
                <h3>Payload JSON</h3>
                <p className="batchEditorHint">
                  Auto-format validates schema and pretty-prints the batch payload.
                </p>
              </div>
              <div className="batchEditorActions">
                <button type="button" className="secondaryButton" onClick={formatBatchInput}>
                  Auto-format JSON
                </button>
                <button type="button" className="ghostButton" onClick={loadSampleBatch}>
                  Load Sample
                </button>
                <button type="button" className="ghostButton" onClick={clearBatchInput}>
                  Clear
                </button>
              </div>
            </div>

            <textarea
              className="jsonArea"
              value={batchText}
              onChange={(e) => {
                setBatchText(e.target.value);
                setBatchResult(null);
              }}
              spellCheck={false}
            />

            <p className={`batchValidation ${batchValidation.isValid ? "valid" : "invalid"}`}>
              {batchValidation.message}
            </p>
          </div>
        </section>

        <datalist id="batch-category-options">
          {COMMON_CATEGORIES.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="batch-country-options">
          {COMMON_COUNTRIES.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <div className="rowActions">
          <button
            type="button"
            className="primaryButton"
            onClick={runBatchPrediction}
            disabled={loading || !batchValidation.isValid}
          >
            Run Batch Inference
          </button>
          {batchResult && (
            <span className="mutedText">
              Batch run complete with {number.format(batchResult.summary.count)} records.
            </span>
          )}
        </div>

        {batchResult && (
          <>
            <div className="batchSummaryGrid">
              <article className="batchCard">
                <p>Records</p>
                <strong>{number.format(batchResult.summary.count)}</strong>
              </article>
              <article className="batchCard">
                <p>Avg Subscribers</p>
                <strong>{number.format(batchResult.summary.avg_predicted_subscribers)}</strong>
              </article>
              <article className="batchCard">
                <p>Avg Earnings</p>
                <strong>{currency.format(batchResult.summary.avg_predicted_earnings)}</strong>
              </article>
              <article className="batchCard">
                <p>Avg Growth</p>
                <strong>{number.format(batchResult.summary.avg_predicted_growth)}</strong>
              </article>
            </div>

            <p className="batchSummaryLine">
              count={number.format(batchResult.summary.count)}, avg_subscribers=
              {number.format(batchResult.summary.avg_predicted_subscribers)}, avg_earnings=
              {currency.format(batchResult.summary.avg_predicted_earnings)}, avg_growth=
              {number.format(batchResult.summary.avg_predicted_growth)}
            </p>

            <div className="batchTableWrap">
              <div className="tableShell">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Predicted Subscribers</th>
                      <th>Predicted Earnings</th>
                      <th>Predicted Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResult.records.map((row, idx) => (
                      <tr key={`batch-record-${idx}`}>
                        <td>{idx + 1}</td>
                        <td>{number.format(row.predicted_subscribers)}</td>
                        <td>{currency.format(row.predicted_earnings)}</td>
                        <td>{number.format(row.predicted_growth)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
