import { Lexer, type Token, type Tokens } from "marked";

/*
 * Plan-markdown helpers shared by the viewer (PlanView) and editor (PlanEditor):
 * lex with marked (lexer ONLY — we render React elements from the token stream,
 * never HTML strings), extract the block tree with section references, and
 * mirror the profile rules web/lib/plan-md.mjs enforces server-side. Raw HTML
 * and tables are the render-breaking violations here; structural rules (the
 * six sections) stay server-side so non-plan documents (e.g. self-review
 * improvement plans) still render.
 */

/** One editable block of the plan: a top-level token, or a single list item
 *  promoted to its own block so an edit can reference "item 3". */
export interface PlanBlock {
  key: string;
  /** Enclosing section heading text (H1/H2), or null before the first. */
  section: string | null;
  /** Human-readable reference within the section: "item 3", "paragraph 1", … */
  label: string;
  token: Token;
  /** Exact source text of the block (what edits quote). */
  raw: string;
  /** Set on list-item blocks so they render with their real list numbering. */
  listItem?: { ordered: boolean; start: number };
}

export interface PlanParse {
  ok: boolean;
  problems: string[];
  tokens: Token[];
  blocks: PlanBlock[];
}

export interface ParsePlanOptions {
  /** Strict (default) enforces the plan profile: raw HTML and tables are
   *  render-breaking violations. Lenient (generic file viewing) renders
   *  them instead — only a lexer failure yields `ok: false`. */
  strict?: boolean;
}

function walkTokens(tokens: Token[] | undefined, visit: (t: Token) => void) {
  for (const token of tokens ?? []) {
    visit(token);
    if (token.type === "list") {
      walkTokens((token as Tokens.List).items, visit);
    } else if ("tokens" in token && Array.isArray(token.tokens)) {
      walkTokens(token.tokens as Token[], visit);
    }
  }
}

/** Lex plan markdown and extract the render/edit block tree. `ok: false`
 *  (lexer failure or, in strict mode, a render-breaking profile violation —
 *  raw HTML, tables) means the caller must fall back to the raw text view.
 *  Never throws. */
export function parsePlan(markdown: string, { strict = true }: ParsePlanOptions = {}): PlanParse {
  let tokens: Token[];
  try {
    tokens = new Lexer({ gfm: true }).lex(markdown);
  } catch (e) {
    return { ok: false, problems: [`markdown failed to lex: ${e instanceof Error ? e.message : e}`], tokens: [], blocks: [] };
  }

  const problems: string[] = [];
  if (strict) {
    walkTokens(tokens, (t) => {
      if (t.type === "html") problems.push("raw HTML in the plan");
      if (t.type === "table") problems.push("table syntax in the plan");
    });
  }

  const blocks: PlanBlock[] = [];
  let section: string | null = null;
  const counters = new Map<string, number>();
  const next = (kind: string) => {
    const key = `${section ?? ""}|${kind}`;
    const n = (counters.get(key) ?? 0) + 1;
    counters.set(key, n);
    return n;
  };
  const push = (label: string, token: Token, raw: string, listItem?: PlanBlock["listItem"]) => {
    blocks.push({ key: `b${blocks.length}`, section, label, token, raw: raw.trimEnd(), listItem });
  };

  for (const token of tokens) {
    if (token.type === "space") continue;
    if (token.type === "heading") {
      const h = token as Tokens.Heading;
      if (h.depth <= 2) section = h.text;
      push(`heading "${h.text}"`, token, token.raw);
      continue;
    }
    if (token.type === "list") {
      const list = token as Tokens.List;
      const start = list.ordered ? Number(list.start || 1) : 1;
      list.items.forEach((item, i) => {
        push(`item ${start + i}`, item, item.raw, { ordered: list.ordered, start: start + i });
      });
      continue;
    }
    if (token.type === "code") {
      push(`code block ${next("code")}`, token, token.raw);
      continue;
    }
    push(`paragraph ${next("paragraph")}`, token, token.raw);
  }

  return { ok: problems.length === 0, problems: [...new Set(problems)], tokens, blocks };
}

/** Compile pending block edits into the single founder reply the discussion
 *  agent applies verbatim. Only edited blocks are included, each referenced by
 *  section + block label and quoting the original text. */
export interface PlanEdit {
  block: PlanBlock;
  op: "delete" | "replace" | "comment";
  text: string; // replacement text or comment body ("" for delete)
}

const quote = (text: string) =>
  text
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");

export function compileEdits(edits: PlanEdit[]): string {
  const parts = edits.map((e, i) => {
    const where = `In "${e.block.section ?? "the preamble"}", ${e.block.label}`;
    if (e.op === "delete") return `${i + 1}. ${where} — delete:\n${quote(e.block.raw)}`;
    if (e.op === "replace") return `${i + 1}. ${where} — replace:\n${quote(e.block.raw)}\nwith:\n${quote(e.text)}`;
    return `${i + 1}. ${where} — comment (not plan text — answer or apply it):\n${quote(e.block.raw)}\nComment: ${e.text}`;
  });
  return `Plan edits from the founder (apply to plan.md verbatim):\n\n${parts.join("\n\n")}`;
}
