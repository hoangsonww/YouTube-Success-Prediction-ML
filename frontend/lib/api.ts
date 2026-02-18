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

function clampLimit(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function isNotFoundError(err: unknown): err is Error {
  return err instanceof Error && err.message.includes("API error 404:");
}

function normalizeCategory(input: string): string {
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : "Unknown";
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
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API error ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}

export async function predict(payload: PredictionPayload): Promise<PredictionResult> {
  return request<PredictionResult>("/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function predictBatch(items: PredictionPayload[]): Promise<BatchPredictionResponse> {
  return request<BatchPredictionResponse>("/predict/batch", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export async function simulatePrediction(payload: SimulationRequest): Promise<SimulationResponse> {
  return request<SimulationResponse>("/predict/simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRecommendation(
  payload: PredictionPayload
): Promise<RecommendationResponse> {
  return request<RecommendationResponse>("/predict/recommendation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getFeatureImportance(
  target: "subscribers" | "earnings" | "growth",
  topN = 15
): Promise<FeatureImportanceResponse> {
  return request<FeatureImportanceResponse>(
    `/predict/feature-importance?target=${target}&top_n=${topN}`
  );
}

export async function runDriftCheck(items: PredictionPayload[]): Promise<DriftCheckResponse> {
  return request<DriftCheckResponse>("/mlops/drift-check", {
    method: "POST",
    body: JSON.stringify({ items, z_threshold: 3.0, min_category_frequency: 0.01 }),
  });
}

export async function getClusterSummary(): Promise<ClusterRecord[]> {
  const data = await request<{ records: ClusterRecord[] }>("/clusters/summary");
  return data.records;
}

export async function getCountryMetrics(): Promise<CountryMetricRecord[]> {
  const data = await request<{ records: CountryMetricRecord[] }>("/maps/country-metrics");
  return data.records;
}

export async function getRawSample(limit = 10): Promise<RawChannelSample[]> {
  const data = await request<{ records: RawChannelSample[] }>(`/data/raw-sample?limit=${limit}`);
  return data.records;
}

export async function getProcessedSample(limit = 10): Promise<ProcessedChannelSample[]> {
  const safeLimit = clampLimit(limit, 1, PROCESSED_SAMPLE_MAX_LIMIT);
  const data = await request<{ records: ProcessedChannelSample[] }>(
    `/data/processed-sample?limit=${safeLimit}`
  );
  return data.records;
}

export async function getCategoryPerformance(topN = 12): Promise<CategoryPerformanceRecord[]> {
  try {
    const data = await request<{ records: CategoryPerformanceRecord[] }>(
      `/analytics/category-performance?top_n=${topN}`
    );
    return data.records;
  } catch (err) {
    if (!isNotFoundError(err)) {
      throw err;
    }
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
    if (!isNotFoundError(err)) {
      throw err;
    }
    const rows = await getProcessedSampleForFallback();
    return buildUploadGrowthBucketsFallback(rows);
  }
}
