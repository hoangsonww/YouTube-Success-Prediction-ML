export type PredictionPayload = {
  uploads: number;
  category: string;
  country: string;
  age: number;
};

export type PredictionResult = {
  predicted_subscribers: number;
  predicted_earnings: number;
  predicted_growth: number;
};

export type BatchPredictionResponse = {
  records: PredictionResult[];
  summary: {
    count: number;
    avg_predicted_subscribers: number;
    avg_predicted_earnings: number;
    avg_predicted_growth: number;
  };
};

export type SimulationRequest = {
  category: string;
  country: string;
  age: number;
  start_uploads: number;
  end_uploads: number;
  step: number;
};

export type SimulationResponse = {
  input: SimulationRequest;
  points: Array<{ uploads: number } & PredictionResult>;
  best_uploads_by_growth: number;
  best_uploads_by_earnings: number;
};

export type RecommendationResponse = {
  prediction: PredictionResult;
  cluster: {
    cluster_id: number;
    archetype: string;
  };
  risk_level: "low" | "medium" | "high";
  recommendations: string[];
};

export type FeatureImportanceResponse = {
  target: "subscribers" | "earnings" | "growth";
  records: Array<{ feature: string; importance: number }>;
};

export type DriftCheckResponse = {
  summary: {
    total_records: number;
    high_severity_records: number;
    is_drift_risk: boolean;
  };
  records: Array<{
    index: number;
    warnings: string[];
    severity: "low" | "medium" | "high";
  }>;
};

export type ClusterRecord = {
  cluster_id: number;
  archetype: string;
  size: number;
  avg_uploads: number;
  avg_subscribers: number;
  avg_earnings: number;
  avg_growth: number;
  dominant_category: string;
};

export type CountryMetricRecord = {
  country: string;
  abbreviation: string;
  total_subscribers: number;
  total_earnings: number;
  dominant_category: string;
};

export type RawChannelSample = {
  youtuber: string;
  uploads: number;
  category: string | null;
  country: string | null;
  subscribers: number;
  highest_yearly_earnings: number;
  subscribers_for_last_30_days: number | null;
  created_year: number | null;
};

export type ProcessedChannelSample = {
  youtuber: string;
  uploads: number;
  category: string;
  country: string;
  age: number;
  subscribers: number;
  highest_yearly_earnings: number;
  growth_target: number;
};

export type CategoryPerformanceRecord = {
  category: string;
  channel_count: number;
  avg_subscribers: number;
  avg_earnings: number;
  avg_growth: number;
  total_subscribers: number;
  total_earnings: number;
};

export type UploadGrowthBucketRecord = {
  upload_bucket: string;
  channel_count: number;
  avg_growth: number;
  avg_earnings: number;
  avg_subscribers: number;
};
