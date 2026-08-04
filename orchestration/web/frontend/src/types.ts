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

export interface RunDetail {
  run: RunSummary;
  history: HistoryEntry[];
  steps: StepRow[];
  artifacts: ArtifactRow[];
  workflow: Workflow | null;
  planMd: string | null;
  findingsMd: string | null;
  review: { verdict?: string; findings?: string[] } | null;
  logs: string[];
}

export interface RunsResponse {
  runs: RunSummary[];
}

export interface SettingsResponse {
  rigsRaw: string;
  workflows: Workflow[];
}
