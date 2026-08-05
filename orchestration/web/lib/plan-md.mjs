/*
 * Plan-markdown pure core: lex a plan.md against the strict "plan profile"
 * (one `# Plan:` H1, the six fixed `##` sections in order, `-` bullets, `1.`
 * numbered lists, bold/italic/inline code/links, fenced code — no raw HTML,
 * tables, images, blockquotes, or horizontal rules) and report line-numbered
 * problems. Consumed by bin/plan-lint, the engine's post-plan/post-discussion
 * verification in bin/factory-run (CJS require(esm), like discussion.mjs), and
 * the web test suite. Dependency-free on purpose — the engine and plan-lint
 * are zero-npm-dependency, and the strict profile is exactly what makes a
 * line-based lexer reliable here. The frontend's markdown.ts mirrors these
 * rules on marked's token stream for rendering.
 */

/** The six H2 sections every plan must carry, in this order. */
export const REQUIRED_SECTIONS = [
  "What and why",
  "Angles considered",
  "Touch points",
  "Acceptance criteria",
  "Out of scope",
  "Open questions",
];

const FENCE_RE = /^\s*(```|~~~)/;
const HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
// An HTML tag or comment opener. Deliberately loose: `<pre>`, `</div>`,
// `<script src=…>`, `<!--` all match; `a < b` and `2<3` do not.
const HTML_RE = /<\/?[a-zA-Z][a-zA-Z0-9-]*(\s[^<>]*)?\/?>|<!--/;

/** Mask inline code spans so their content is exempt from the raw-HTML and
 *  image checks (writing `<pre>` as inline code is the sanctioned spelling). */
function maskInlineCode(line) {
  return line.replace(/`+[^`]+`+/g, "`code`");
}

/**
 * Lex plan markdown into a flat block list: [{type, line, section, text}].
 * `line` is 1-based, `section` the enclosing H2 title (null before the first),
 * `type` one of heading / bullet / ordered / code / paragraph / html / table /
 * rule / blockquote. Never throws — hostile input becomes blocks the linter
 * then flags. Fence state is returned so the linter can flag unclosed fences.
 */
export function lexBlocks(text) {
  const lines = String(text).split("\n");
  const blocks = [];
  let section = null;
  let inFence = false;
  let fenceLine = 0;
  let paragraph = null; // { type, line, section, text } being accumulated

  const flush = () => {
    if (paragraph) blocks.push(paragraph);
    paragraph = null;
  };

  lines.forEach((rawLine, i) => {
    const n = i + 1;
    if (FENCE_RE.test(rawLine)) {
      if (!inFence) {
        flush();
        inFence = true;
        fenceLine = n;
        blocks.push({ type: "code", line: n, section, text: rawLine });
      } else {
        inFence = false;
      }
      return;
    }
    if (inFence) return; // fenced content is opaque to the profile
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flush();
      return;
    }
    const h = line.match(HEADING_RE);
    if (h) {
      flush();
      if (h[1].length === 2) section = h[2];
      blocks.push({ type: "heading", line: n, section, text: h[2], depth: h[1].length });
      return;
    }
    if (/^\s*\|/.test(line)) {
      flush();
      blocks.push({ type: "table", line: n, section, text: line });
      return;
    }
    if (/^\s*>/.test(line)) {
      flush();
      blocks.push({ type: "blockquote", line: n, section, text: line });
      return;
    }
    if (/^\s*(-{3,}|\*{3,}|_{3,}|={3,})\s*$/.test(line)) {
      flush();
      blocks.push({ type: "rule", line: n, section, text: line });
      return;
    }
    const bullet = line.match(/^\s*([-*+])\s+(.*)$/);
    if (bullet) {
      flush();
      blocks.push({ type: "bullet", line: n, section, text: bullet[2], marker: bullet[1] });
      return;
    }
    const ordered = line.match(/^\s*(\d{1,3})([.)])\s+(.*)$/);
    if (ordered) {
      flush();
      blocks.push({ type: "ordered", line: n, section, text: ordered[3], marker: ordered[2] });
      return;
    }
    if (/^\s{2,}\S/.test(rawLine) && blocks.length && !paragraph) {
      // Indented continuation of the previous bullet/numbered item — part of
      // that block, not a new paragraph.
      const prev = blocks[blocks.length - 1];
      if (prev.type === "bullet" || prev.type === "ordered") {
        prev.text += ` ${line.trim()}`;
        return;
      }
    }
    if (paragraph) paragraph.text += ` ${line.trim()}`;
    else paragraph = { type: "paragraph", line: n, section, text: line.trim() };
  });
  flush();
  return { blocks, unclosedFenceLine: inFence ? fenceLine : 0 };
}

/**
 * Lint plan markdown against the strict plan profile. Returns [{line, message}]
 * (empty = conforming). Checks: non-empty, single leading `# Plan:` H1, the six
 * REQUIRED_SECTIONS present / in order / unduplicated, no other headings, `-`
 * bullets and `1.` numbering only, no raw HTML / tables / images / blockquotes
 * / horizontal rules outside code, and closed fences. Never throws.
 */
export function lintPlan(text) {
  const problems = [];
  const push = (line, message) => problems.push({ line, message });
  if (typeof text !== "string" || !text.trim()) {
    push(1, "plan is empty");
    return problems;
  }
  const { blocks, unclosedFenceLine } = lexBlocks(text);
  if (unclosedFenceLine) push(unclosedFenceLine, "fenced code block is never closed");

  const headings = blocks.filter((b) => b.type === "heading");
  const h1s = headings.filter((b) => b.depth === 1);
  if (h1s.length === 0) push(1, "missing H1 title — the first line must be `# Plan: <title>`");
  else {
    if (blocks[0] !== h1s[0]) push(h1s[0].line, "the `# Plan: <title>` H1 must be the first content in the file");
    if (!/^Plan:\s*\S/.test(h1s[0].text)) push(h1s[0].line, "H1 must read `# Plan: <short title>`");
    for (const extra of h1s.slice(1)) push(extra.line, "only one H1 allowed (the plan title)");
  }
  for (const h of headings.filter((b) => b.depth > 2)) {
    push(h.line, `heading level ${h.depth} not allowed — only the H1 title and the six \`##\` sections`);
  }

  const h2s = headings.filter((b) => b.depth === 2);
  const seen = [];
  for (const h of h2s) {
    if (!REQUIRED_SECTIONS.includes(h.text)) {
      push(h.line, `unexpected section \`## ${h.text}\` — allowed sections are: ${REQUIRED_SECTIONS.join(", ")}`);
    } else if (seen.includes(h.text)) {
      push(h.line, `duplicate section \`## ${h.text}\``);
    } else {
      seen.push(h.text);
    }
  }
  for (const name of REQUIRED_SECTIONS) {
    if (!seen.includes(name)) push(1, `missing required section \`## ${name}\``);
  }
  const order = seen.map((name) => REQUIRED_SECTIONS.indexOf(name));
  for (let i = 1; i < order.length; i++) {
    if (order[i] < order[i - 1]) {
      const h = h2s.find((b) => b.text === seen[i]);
      push(h.line, `section \`## ${seen[i]}\` is out of order — required order: ${REQUIRED_SECTIONS.join(" → ")}`);
    }
  }

  for (const b of blocks) {
    if (b.type === "code" || b.type === "heading") continue;
    if (b.type === "table") {
      push(b.line, "table syntax not allowed in plans");
      continue;
    }
    if (b.type === "blockquote") {
      push(b.line, "blockquotes not allowed in plans");
      continue;
    }
    if (b.type === "rule") {
      push(b.line, "horizontal rules / setext underlines not allowed — use ATX headings and plain sections");
      continue;
    }
    if (b.type === "bullet" && b.marker !== "-") {
      push(b.line, `bullet marker \`${b.marker}\` not allowed — use \`-\``);
    }
    if (b.type === "ordered" && b.marker !== ".") {
      push(b.line, "numbered items must use `1.` style (not `1)`)");
    }
    const masked = maskInlineCode(b.text);
    if (HTML_RE.test(masked)) {
      push(b.line, "raw HTML not allowed — spell tags as inline code (e.g. `<pre>`)");
    }
    if (/!\[[^\]]*\]\(/.test(masked)) {
      push(b.line, "images not allowed in plans");
    }
  }

  return problems.sort((a, b) => a.line - b.line);
}
