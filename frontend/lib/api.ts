import type {
  BatchPredictionResponse,
  CategoryPerformanceRecord,
  ClusterRecord,
  CountryMetricRecord,
  DriftCheckResponse,
  FeatureImportanceResponse,
  ProcessedChannelSample,
  PredictionPayload,
  PredictionResult,
  RecommendationResponse,
  RawChannelSample,
  SimulationRequest,
  SimulationResponse,
  UploadGrowthBucketRecord,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const PROCESSED_SAMPLE_MAX_LIMIT = 50;
const UPLOAD_BUCKET_ORDER = ["0-100", "101-500", "501-2k", "2k-10k", "10k+"];
let processedSampleFallbackPromise: Promise<ProcessedChannelSample[]> | null = null;
let offlineFallbackMode = false;

const FALLBACK_PROCESSED_SAMPLE: ProcessedChannelSample[] = [
  {
    youtuber: "Demo Education Hub",
    uploads: 420,
    category: "Education",
    country: "United States",
    age: 6,
    subscribers: 12500000,
    highest_yearly_earnings: 2300000,
    growth_target: 54000,
  },
  {
    youtuber: "Viral Beats Nation",
    uploads: 1180,
    category: "Music",
    country: "India",
    age: 8,
    subscribers: 38700000,
    highest_yearly_earnings: 7200000,
    growth_target: 156000,
  },
  {
    youtuber: "Creator Film Lab",
    uploads: 690,
    category: "Film & Animation",
    country: "United Kingdom",
    age: 7,
    subscribers: 14600000,
    highest_yearly_earnings: 2910000,
    growth_target: 61000,
  },
  {
    youtuber: "Daily Entertain Plus",
    uploads: 2500,
    category: "Entertainment",
    country: "United States",
    age: 10,
    subscribers: 52200000,
    highest_yearly_earnings: 11200000,
    growth_target: 214000,
  },
  {
    youtuber: "Science Byte Club",
    uploads: 320,
    category: "Science & Technology",
    country: "Canada",
    age: 5,
    subscribers: 8300000,
    highest_yearly_earnings: 1510000,
    growth_target: 33000,
  },
  {
    youtuber: "People Talks Global",
    uploads: 980,
    category: "People & Blogs",
    country: "Brazil",
    age: 9,
    subscribers: 21900000,
    highest_yearly_earnings: 4120000,
    growth_target: 89000,
  },
  {
    youtuber: "Gaming Arena X",
    uploads: 1620,
    category: "Gaming",
    country: "Japan",
    age: 7,
    subscribers: 27500000,
    highest_yearly_earnings: 5630000,
    growth_target: 111000,
  },
  {
    youtuber: "Insight Politics 24",
    uploads: 770,
    category: "News & Politics",
    country: "Germany",
    age: 11,
    subscribers: 9600000,
    highest_yearly_earnings: 1840000,
    growth_target: 28000,
  },
  {
    youtuber: "Campus Study Loop",
    uploads: 540,
    category: "Education",
    country: "India",
    age: 4,
    subscribers: 11400000,
    highest_yearly_earnings: 2050000,
    growth_target: 47000,
  },
  {
    youtuber: "KPop Pulse TV",
    uploads: 910,
    category: "Music",
    country: "South Korea",
    age: 6,
    subscribers: 23900000,
    highest_yearly_earnings: 4680000,
    growth_target: 93000,
  },
  {
    youtuber: "Animation Sparkline",
    uploads: 610,
    category: "Film & Animation",
    country: "United States",
    age: 5,
    subscribers: 13200000,
    highest_yearly_earnings: 2580000,
    growth_target: 53000,
  },
  {
    youtuber: "Creator Daily Live",
    uploads: 2840,
    category: "Entertainment",
    country: "India",
    age: 9,
    subscribers: 46100000,
    highest_yearly_earnings: 9650000,
    growth_target: 191000,
  },
];

const FALLBACK_CLUSTERS: ClusterRecord[] = [
  {
    cluster_id: 0,
    archetype: "Viral entertainers",
    size: 285,
    avg_uploads: 1800,
    avg_subscribers: 36500000,
    avg_earnings: 7800000,
    avg_growth: 141000,
    dominant_category: "Entertainment",
  },
  {
    cluster_id: 1,
    archetype: "Consistent educators",
    size: 231,
    avg_uploads: 540,
    avg_subscribers: 12300000,
    avg_earnings: 2260000,
    avg_growth: 47000,
    dominant_category: "Education",
  },
  {
    cluster_id: 2,
    archetype: "High earning low upload",
    size: 178,
    avg_uploads: 380,
    avg_subscribers: 16800000,
    avg_earnings: 5120000,
    avg_growth: 52000,
    dominant_category: "Music",
  },
  {
    cluster_id: 3,
    archetype: "High upload low growth",
    size: 301,
    avg_uploads: 2650,
    avg_subscribers: 9800000,
    avg_earnings: 1740000,
    avg_growth: 22000,
    dominant_category: "People & Blogs",
  },
];

const FALLBACK_COUNTRIES: CountryMetricRecord[] = [
  {
    country: "United States",
    abbreviation: "US",
    total_subscribers: 205000000,
    total_earnings: 40800000,
    dominant_category: "Entertainment",
  },
  {
    country: "India",
    abbreviation: "IN",
    total_subscribers: 194000000,
    total_earnings: 37900000,
    dominant_category: "Music",
  },
  {
    country: "United Kingdom",
    abbreviation: "GB",
    total_subscribers: 84000000,
    total_earnings: 16500000,
    dominant_category: "Education",
  },
  {
    country: "Brazil",
    abbreviation: "BR",
    total_subscribers: 72000000,
    total_earnings: 14100000,
    dominant_category: "People & Blogs",
  },
  {
    country: "Japan",
    abbreviation: "JP",
    total_subscribers: 68000000,
    total_earnings: 12900000,
    dominant_category: "Gaming",
  },
  {
    country: "South Korea",
    abbreviation: "KR",
    total_subscribers: 64000000,
    total_earnings: 12400000,
    dominant_category: "Music",
  },
  {
    country: "Canada",
    abbreviation: "CA",
    total_subscribers: 53000000,
    total_earnings: 10300000,
    dominant_category: "Science & Technology",
  },
  {
    country: "Germany",
    abbreviation: "DE",
    total_subscribers: 47000000,
    total_earnings: 9200000,
    dominant_category: "News & Politics",
  },
];

function clampLimit(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function isNotFoundError(err: unknown): err is Error {
  return err instanceof Error && err.message.includes("API error 404:");
}

function isBackendUnavailableError(err: unknown): err is Error {
  if (!(err instanceof Error)) {
    return false;
  }
  const message = err.message.toLowerCase();
  return (
    message.includes("api connection failed") ||
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("networkerror") ||
    message.includes("enotfound")
  );
}

function markOfflineFallbackMode() {
  offlineFallbackMode = true;
}

function normalizeCategory(input: string): string {
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : "Unknown";
}

function buildFallbackPrediction(payload: PredictionPayload): PredictionResult {
  const categoryFactors: Record<string, number> = {
    Education: 0.95,
    Entertainment: 1.18,
    Music: 1.15,
    "Film & Animation": 1.05,
    "People & Blogs": 1.0,
    Gaming: 1.08,
    "Science & Technology": 0.97,
    "News & Politics": 0.92,
  };
  const countryFactors: Record<string, number> = {
    "United States": 1.16,
    India: 1.12,
    "United Kingdom": 1.02,
    Canada: 1.0,
    Brazil: 0.96,
    Japan: 1.04,
    "South Korea": 1.03,
    Germany: 0.98,
  };

  const categoryFactor = categoryFactors[payload.category] ?? 1;
  const countryFactor = countryFactors[payload.country] ?? 1;

  const baseSubscribers = payload.uploads * 4200 + payload.age * 185000 + 1250000;
  const predicted_subscribers = Math.max(
    50000,
    Math.round(baseSubscribers * categoryFactor * countryFactor)
  );
  const predicted_earnings = Math.max(
    500,
    Math.round(predicted_subscribers * 0.085 + payload.uploads * 140)
  );
  const predicted_growth = Math.max(
    200,
    Math.round(predicted_subscribers * 0.0022 + payload.uploads * 1.8)
  );

  return {
    predicted_subscribers,
    predicted_earnings,
    predicted_growth,
  };
}

function fallbackProcessedRows(limit: number): ProcessedChannelSample[] {
  const safeLimit = clampLimit(limit, 1, PROCESSED_SAMPLE_MAX_LIMIT);
  const repeats = Math.ceil(safeLimit / FALLBACK_PROCESSED_SAMPLE.length);
  const rows: ProcessedChannelSample[] = [];

  for (let i = 0; i < repeats; i += 1) {
    for (const row of FALLBACK_PROCESSED_SAMPLE) {
      rows.push({
        ...row,
        youtuber: i === 0 ? row.youtuber : `${row.youtuber} ${i + 1}`,
      });
      if (rows.length === safeLimit) {
        return rows;
      }
    }
  }

  return rows;
}

function fallbackRawRows(limit: number): RawChannelSample[] {
  return fallbackProcessedRows(limit).map((row, index) => ({
    youtuber: row.youtuber,
    uploads: row.uploads,
    category: row.category,
    country: row.country,
    subscribers: row.subscribers,
    highest_yearly_earnings: row.highest_yearly_earnings,
    subscribers_for_last_30_days: row.growth_target,
    created_year: 2026 - Math.max(0, row.age) - (index % 2),
  }));
}

function uploadBucket(uploads: number): string {
  if (uploads <= 100) return "0-100";
  if (uploads <= 500) return "101-500";
  if (uploads <= 2000) return "501-2k";
  if (uploads <= 10000) return "2k-10k";
  return "10k+";
}

function buildCategoryPerformanceFallback(
  rows: ProcessedChannelSample[],
  topN: number
): CategoryPerformanceRecord[] {
  const grouped = new Map<
    string,
    {
      channel_count: number;
      subscribers_sum: number;
      earnings_sum: number;
      growth_sum: number;
    }
  >();

  for (const row of rows) {
    const category = normalizeCategory(row.category);
    const slot = grouped.get(category) ?? {
      channel_count: 0,
      subscribers_sum: 0,
      earnings_sum: 0,
      growth_sum: 0,
    };
    slot.channel_count += 1;
    slot.subscribers_sum += row.subscribers;
    slot.earnings_sum += row.highest_yearly_earnings;
    slot.growth_sum += row.growth_target;
    grouped.set(category, slot);
  }

  return [...grouped.entries()]
    .map(([category, agg]) => ({
      category,
      channel_count: agg.channel_count,
      avg_subscribers: agg.subscribers_sum / Math.max(1, agg.channel_count),
      avg_earnings: agg.earnings_sum / Math.max(1, agg.channel_count),
      avg_growth: agg.growth_sum / Math.max(1, agg.channel_count),
      total_subscribers: agg.subscribers_sum,
      total_earnings: agg.earnings_sum,
    }))
    .sort((a, b) => b.total_subscribers - a.total_subscribers)
    .slice(0, topN);
}

function buildUploadGrowthBucketsFallback(
  rows: ProcessedChannelSample[]
): UploadGrowthBucketRecord[] {
  const grouped = new Map<
    string,
    {
      channel_count: number;
      growth_sum: number;
      earnings_sum: number;
      subscribers_sum: number;
    }
  >();

  for (const row of rows) {
    const bucket = uploadBucket(Math.max(0, row.uploads));
    const slot = grouped.get(bucket) ?? {
      channel_count: 0,
      growth_sum: 0,
      earnings_sum: 0,
      subscribers_sum: 0,
    };
    slot.channel_count += 1;
    slot.growth_sum += row.growth_target;
    slot.earnings_sum += row.highest_yearly_earnings;
    slot.subscribers_sum += row.subscribers;
    grouped.set(bucket, slot);
  }

  return [...grouped.entries()]
    .map(([upload_bucket, agg]) => ({
      upload_bucket,
      channel_count: agg.channel_count,
      avg_growth: agg.growth_sum / Math.max(1, agg.channel_count),
      avg_earnings: agg.earnings_sum / Math.max(1, agg.channel_count),
      avg_subscribers: agg.subscribers_sum / Math.max(1, agg.channel_count),
    }))
    .sort(
      (a, b) =>
        UPLOAD_BUCKET_ORDER.indexOf(a.upload_bucket) - UPLOAD_BUCKET_ORDER.indexOf(b.upload_bucket)
    );
}

async function getProcessedSampleForFallback(): Promise<ProcessedChannelSample[]> {
  if (!processedSampleFallbackPromise) {
    processedSampleFallbackPromise = getProcessedSample(PROCESSED_SAMPLE_MAX_LIMIT).catch((err) => {
      processedSampleFallbackPromise = null;
      throw err;
    });
  }
  return processedSampleFallbackPromise;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : "Unknown connection error";
    throw new Error(`API connection failed: ${details}`);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API error ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}

export async function predict(payload: PredictionPayload): Promise<PredictionResult> {
  try {
    return await request<PredictionResult>("/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (!isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    return buildFallbackPrediction(payload);
  }
}

export async function predictBatch(items: PredictionPayload[]): Promise<BatchPredictionResponse> {
  try {
    return await request<BatchPredictionResponse>("/predict/batch", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  } catch (err) {
    if (!isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    const records = items.map((item) => buildFallbackPrediction(item));
    const count = Math.max(1, records.length);
    return {
      records,
      summary: {
        count: records.length,
        avg_predicted_subscribers:
          records.reduce((acc, r) => acc + r.predicted_subscribers, 0) / count,
        avg_predicted_earnings: records.reduce((acc, r) => acc + r.predicted_earnings, 0) / count,
        avg_predicted_growth: records.reduce((acc, r) => acc + r.predicted_growth, 0) / count,
      },
    };
  }
}

export async function simulatePrediction(payload: SimulationRequest): Promise<SimulationResponse> {
  try {
    return await request<SimulationResponse>("/predict/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (!isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    const step = Math.max(1, payload.step);
    const points: SimulationResponse["points"] = [];
    for (let uploads = payload.start_uploads; uploads <= payload.end_uploads; uploads += step) {
      points.push({
        uploads,
        ...buildFallbackPrediction({
          uploads,
          category: payload.category,
          country: payload.country,
          age: payload.age,
        }),
      });
    }
    const bestByGrowth = [...points].sort((a, b) => b.predicted_growth - a.predicted_growth)[0];
    const bestByEarnings = [...points].sort(
      (a, b) => b.predicted_earnings - a.predicted_earnings
    )[0];
    return {
      input: payload,
      points,
      best_uploads_by_growth: bestByGrowth?.uploads ?? payload.start_uploads,
      best_uploads_by_earnings: bestByEarnings?.uploads ?? payload.start_uploads,
    };
  }
}

export async function getRecommendation(
  payload: PredictionPayload
): Promise<RecommendationResponse> {
  try {
    return await request<RecommendationResponse>("/predict/recommendation", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (!isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    const prediction = buildFallbackPrediction(payload);
    const cluster =
      FALLBACK_CLUSTERS.find(
        (row) => normalizeCategory(payload.category) === row.dominant_category
      ) ?? FALLBACK_CLUSTERS[0];
    const riskLevel: RecommendationResponse["risk_level"] =
      payload.age >= 12 || payload.uploads < 80 ? "high" : payload.uploads < 250 ? "medium" : "low";
    return {
      prediction,
      cluster: { cluster_id: cluster.cluster_id, archetype: cluster.archetype },
      risk_level: riskLevel,
      recommendations: [
        "Increase publishing consistency over the next 30 days and measure growth delta weekly.",
        `Double down on ${payload.category || "your strongest category"} formats with highest retention.`,
        "Track conversion from growth to earnings using monthly content cohort comparisons.",
      ],
    };
  }
}

export async function getFeatureImportance(
  target: "subscribers" | "earnings" | "growth",
  topN = 15
): Promise<FeatureImportanceResponse> {
  try {
    return await request<FeatureImportanceResponse>(
      `/predict/feature-importance?target=${target}&top_n=${topN}`
    );
  } catch (err) {
    if (!isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    const records = [
      { feature: "numeric__uploads", importance: 0.31 },
      { feature: "numeric__age", importance: 0.24 },
      { feature: "categorical__category_Entertainment", importance: 0.12 },
      { feature: "categorical__category_Music", importance: 0.1 },
      { feature: "categorical__country_United States", importance: 0.08 },
      { feature: "categorical__country_India", importance: 0.06 },
      { feature: "categorical__category_Education", importance: 0.05 },
      { feature: "categorical__category_Gaming", importance: 0.04 },
    ];
    return { target, records: records.slice(0, topN) };
  }
}

export async function runDriftCheck(items: PredictionPayload[]): Promise<DriftCheckResponse> {
  try {
    return await request<DriftCheckResponse>("/mlops/drift-check", {
      method: "POST",
      body: JSON.stringify({ items, z_threshold: 3.0, min_category_frequency: 0.01 }),
    });
  } catch (err) {
    if (!isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    return {
      summary: {
        total_records: items.length,
        high_severity_records: 0,
        is_drift_risk: false,
      },
      records: items.map((_, index) => ({
        index,
        warnings: [],
        severity: "low",
      })),
    };
  }
}

export async function getClusterSummary(): Promise<ClusterRecord[]> {
  try {
    const data = await request<{ records: ClusterRecord[] }>("/clusters/summary");
    return data.records;
  } catch (err) {
    if (!isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    return FALLBACK_CLUSTERS;
  }
}

export async function getCountryMetrics(): Promise<CountryMetricRecord[]> {
  try {
    const data = await request<{ records: CountryMetricRecord[] }>("/maps/country-metrics");
    return data.records;
  } catch (err) {
    if (!isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    return FALLBACK_COUNTRIES;
  }
}

export async function getRawSample(limit = 10): Promise<RawChannelSample[]> {
  try {
    const data = await request<{ records: RawChannelSample[] }>(`/data/raw-sample?limit=${limit}`);
    return data.records;
  } catch (err) {
    if (!isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    return fallbackRawRows(limit);
  }
}

export async function getProcessedSample(limit = 10): Promise<ProcessedChannelSample[]> {
  const safeLimit = clampLimit(limit, 1, PROCESSED_SAMPLE_MAX_LIMIT);
  try {
    const data = await request<{ records: ProcessedChannelSample[] }>(
      `/data/processed-sample?limit=${safeLimit}`
    );
    return data.records;
  } catch (err) {
    if (!isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    return fallbackProcessedRows(safeLimit);
  }
}

export async function getCategoryPerformance(topN = 12): Promise<CategoryPerformanceRecord[]> {
  try {
    const data = await request<{ records: CategoryPerformanceRecord[] }>(
      `/analytics/category-performance?top_n=${topN}`
    );
    return data.records;
  } catch (err) {
    if (!isNotFoundError(err) && !isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    const rows = await getProcessedSampleForFallback();
    return buildCategoryPerformanceFallback(rows, topN);
  }
}

export async function getUploadGrowthBuckets(): Promise<UploadGrowthBucketRecord[]> {
  try {
    const data = await request<{ records: UploadGrowthBucketRecord[] }>(
      "/analytics/upload-growth-buckets"
    );
    return data.records;
  } catch (err) {
    if (!isNotFoundError(err) && !isBackendUnavailableError(err)) {
      throw err;
    }
    markOfflineFallbackMode();
    const rows = await getProcessedSampleForFallback();
    return buildUploadGrowthBucketsFallback(rows);
  }
}

export function isOfflineFallbackModeEnabled(): boolean {
  return offlineFallbackMode;
}
