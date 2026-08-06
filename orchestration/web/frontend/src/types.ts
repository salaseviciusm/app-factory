export interface Usage {
  costUsd: number;
  inputTokens: number;
  rawInputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  outputTokens: number;
  pricedSteps: number;
}

/** The release-decision agent's verdict: which EAS mechanism the preview needs.
 *  failSafe = the agent errored or was ambiguous, so it defaulted to build. */
export interface ReleaseDecision {
  kind: "build" | "update";
  reasoning: string;
  evidence: string[];
  failSafe: boolean;
  at: string;
}

/** Preview artifact state persisted in run.json (absent until published). */
export interface RunPreview {
  url?: string | null;
  qrPath?: string | null;
  kind?: "build" | "update";
  at?: string;
  decision?: ReleaseDecision;
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
  preview: RunPreview | null;
  deployHeld: boolean;
  createdAt?: string;
  updatedAt?: string;
  worktreeMissing: boolean;
  stalled: boolean;
  /** Founder-initiated retries recorded in run.json, oldest first. */
  retries: RetryEntry[];
  /** Executor pid liveness — probed only for failed/stalled runs, null elsewhere. */
  executorAlive: boolean | null;
  source: "dir" | "db" | "both";
  usage: Usage | null;
}

/** One recorded retry: which tier ran, at which workflow step. */
export interface RetryEntry {
  at: string;
  tier: "resume" | "triage";
  step: string | null;
}

/** Force-less retry classification for the detail page's Retry button. */
export interface RetryClassification {
  eligible: boolean;
  tier: "resume" | "triage" | null;
  reason: string;
  /** Only a live executor blocks the retry — confirm, then send force: true. */
  needsForce?: boolean;
  killExecutor?: boolean;
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
  agent?: string;
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
  skipWhen?: string;
  autoApprove?: boolean;
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

/**
 * Founder-gated check gate: the engine-written check-gate.json (which check
 * tripped, the rendered comparison summary, the resolution) plus the
 * renderer's whitelisted artifact filenames under runs/<id>/check-gate/.
 */
export interface CheckGate {
  cmd: string;
  renderer: string | null;
  openedAt: string;
  status: "pending" | "approved" | "rejected" | "steered" | "timeout" | "notify-failed" | "cancelled";
  summaryText: string | null;
  mediaPath: string | null;
  resolvedAt?: string;
  feedback?: string | null;
  artifacts: string[];
}

export interface RunDetail {
  run: RunSummary;
  repoUrl: string | null;
  history: HistoryEntry[];
  steps: StepRow[];
  artifacts: ArtifactRow[];
  workflow: Workflow | null;
  recovery: Recovery | null;
  retry: RetryClassification | null;
  planMd: string | null;
  findingsMd: string | null;
  steeringMd: string | null;
  deviationsMd: string | null;
  conflictMd: string | null;
  escalationMd: string | null;
  review: { verdict?: string; findings?: string[] } | null;
  checkGate: CheckGate | null;
  releaseDecision: { kind?: string; reasoning?: string; evidence?: string[] } | null;
  /** Per-run preview flag: "on" | "off" (explicit) or null (rig default). */
  previewMode: "on" | "off" | null;
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

/** One browsable file inside an allowlisted root (path is root-relative). */
export interface FileEntry {
  path: string;
  bytes: number;
  mtime: string;
}

/** Listing of one allowlisted directory root, files newest-first. */
export interface FileRootListing {
  key: string;
  label: string;
  path: string;
  exists: boolean;
  files: FileEntry[];
  count: number;
  totalBytes: number;
  truncated: boolean;
}

export interface FilesResponse {
  roots: FileRootListing[];
}

export interface UsageResponse {
  cost: Record<UsageWindowKey, UsageWindow>;
  storage: {
    categories: StorageCategory[];
    totalBytes: number;
    totalFiles: number;
  };
}
