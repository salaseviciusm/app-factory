export interface Usage {
  costUsd: number;
  inputTokens: number;
  rawInputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  outputTokens: number;
  pricedSteps: number;
}

export interface RunSummary {
  id: string;
  workflow: string;
  rig: string;
  prompt: string;
  state: string;
  auto: boolean;
  parentRun: string | null;
  childRun: string | null;
  stepIndex: number | null;
  artifactUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
  worktreeMissing: boolean;
  stalled: boolean;
  source: "dir" | "db" | "both";
  usage: Usage | null;
}

export interface StepRow {
  step_id: string;
  attempt: number;
  status: string;
  summary: string | null;
  started_at: string;
  finished_at: string;
  duration_s: number | null;
  cost_usd: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_read_tokens: number | null;
  cache_creation_tokens: number | null;
}

export interface ArtifactRow {
  step_id: string;
  type: string;
  value: string;
  created_at: string;
}

export interface WorkflowStep {
  id: string;
  type: string;
  prompt?: string;
  model?: string;
  timeoutMinutes?: number;
  source?: string;
  onFail?: string;
  maxLoops?: number;
  onRecover?: string;
  note?: string;
  planFile?: string;
  workflow?: string;
  rig?: string;
}

export interface Workflow {
  name: string;
  description?: string;
  worktree?: boolean;
  steps: WorkflowStep[];
}

export interface HistoryEntry {
  state: string;
  detail: string | null;
  at: string;
}

/** One deploy-recovery cycle: the run branch was rebased onto the drifted base. */
export interface RecoveryAttempt {
  at: string;
  fromSha: string;
  toSha: string;
  conflicted: boolean;
  outcome: string;
}

/** Deploy-recovery state persisted in run.json (absent until the base drifts). */
export interface Recovery {
  iterations: number;
  attempts: RecoveryAttempt[];
  pending?: string;
}

/** Per-attempt documents available for one step (attempt numbers, ascending). */
export interface StepDocAttempts {
  prompt: number[];
  output: number[];
  transcript: number[];
}

export type StepDocKind = keyof StepDocAttempts;

export interface RunDetail {
  run: RunSummary;
  repoUrl: string | null;
  history: HistoryEntry[];
  steps: StepRow[];
  artifacts: ArtifactRow[];
  workflow: Workflow | null;
  recovery: Recovery | null;
  planMd: string | null;
  findingsMd: string | null;
  steeringMd: string | null;
  deviationsMd: string | null;
  conflictMd: string | null;
  escalationMd: string | null;
  review: { verdict?: string; findings?: string[] } | null;
  stepDocs: Record<string, StepDocAttempts>;
  logs: string[];
}

export interface RunsResponse {
  runs: RunSummary[];
}

export interface SettingsResponse {
  rigsRaw: string;
  workflows: Workflow[];
}

/** Per-repo cost bucket (quickfire factory:<app> rigs collapse into "factory-apps"). */
export interface RepoUsage {
  repo: string;
  costUsd: number;
  pricedSteps: number;
  runs: number;
}

/** Cost/token aggregates for one trailing window (or all time). */
export interface UsageWindow {
  costUsd: number;
  inputTokens: number;
  rawInputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  outputTokens: number;
  pricedSteps: number;
  runs: number;
  repos: RepoUsage[];
}

export type UsageWindowKey = "all" | "d31" | "d7" | "d1";

export interface StorageCategory {
  key: string;
  label: string;
  bytes: number;
  files: number;
}

export interface UsageResponse {
  cost: Record<UsageWindowKey, UsageWindow>;
  storage: {
    categories: StorageCategory[];
    totalBytes: number;
    totalFiles: number;
  };
}
