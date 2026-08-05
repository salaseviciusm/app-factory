import { createElement, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Token, Tokens } from "marked";
import { parsePlan, type PlanBlock } from "../markdown";

/*
 * Rendered-markdown plan widget: marked is the LEXER only — React elements are
 * built from the token stream, so there is no dangerouslySetInnerHTML anywhere
 * on this path and text (including any `<script>`) stays literal text. Lexer
 * failure or a render-breaking profile violation (raw HTML, tables) falls back
 * to the raw <pre> view with a loud notice — never a blank panel.
 */

const SAFE_HREF_RE = /^(https?:|mailto:|#)/i;

function InlineNodes({ tokens }: { tokens: Token[] | undefined }): ReactNode {
  return (tokens ?? []).map((t, i) => {
    switch (t.type) {
      case "text": {
        const text = t as Tokens.Text;
        return text.tokens ? <InlineNodes key={i} tokens={text.tokens} /> : <span key={i}>{text.text}</span>;
      }
      case "escape":
        return <span key={i}>{(t as Tokens.Escape).text}</span>;
      case "strong":
        return (
          <strong key={i}>
            <InlineNodes tokens={(t as Tokens.Strong).tokens} />
          </strong>
        );
      case "em":
        return (
          <em key={i}>
            <InlineNodes tokens={(t as Tokens.Em).tokens} />
          </em>
        );
      case "del":
        return (
          <del key={i}>
            <InlineNodes tokens={(t as Tokens.Del).tokens} />
          </del>
        );
      case "codespan":
        return <code key={i}>{(t as Tokens.Codespan).text}</code>;
      case "br":
        return <br key={i} />;
      case "link": {
        const link = t as Tokens.Link;
        if (!SAFE_HREF_RE.test(link.href)) return <InlineNodes key={i} tokens={link.tokens} />;
        return (
          <a key={i} href={link.href} target="_blank" rel="noreferrer">
            <InlineNodes tokens={link.tokens} />
          </a>
        );
      }
      default:
        // Anything unexpected renders as its literal source text.
        return <span key={i}>{t.raw}</span>;
    }
  });
}

function BlockNodes({ tokens }: { tokens: Token[] | undefined }): ReactNode {
  return (tokens ?? []).map((t, i) => {
    switch (t.type) {
      case "space":
        return null;
      case "heading": {
        const h = t as Tokens.Heading;
        return createElement(`h${h.depth}`, { key: i }, <InlineNodes tokens={h.tokens} />);
      }
      case "paragraph":
        return (
          <p key={i}>
            <InlineNodes tokens={(t as Tokens.Paragraph).tokens} />
          </p>
        );
      case "list": {
        const list = t as Tokens.List;
        const items = list.items.map((item, j) => (
          <li key={j}>
            <BlockNodes tokens={item.tokens} />
          </li>
        ));
        return list.ordered ? (
          <ol key={i} start={Number(list.start || 1)}>
            {items}
          </ol>
        ) : (
          <ul key={i}>{items}</ul>
        );
      }
      case "code":
        return (
          <pre key={i} className="md-code">
            <code>{(t as Tokens.Code).text}</code>
          </pre>
        );
      case "blockquote":
        return (
          <blockquote key={i}>
            <BlockNodes tokens={(t as Tokens.Blockquote).tokens} />
          </blockquote>
        );
      case "hr":
        return <hr key={i} />;
      case "text":
        // Tight list items wrap their content in block-level text tokens.
        return <InlineNodes key={i} tokens={(t as Tokens.Text).tokens ?? [t]} />;
      case "def":
        return null;
      default:
        return <pre key={i} className="md-code">{t.raw}</pre>;
    }
  });
}

/** One plan block rendered standalone (editor rows) — list items keep their
 *  real numbering via a single-item list. */
export function BlockNode({ block }: { block: PlanBlock }) {
  if (block.listItem) {
    const li = (
      <li>
        <BlockNodes tokens={(block.token as Tokens.ListItem).tokens} />
      </li>
    );
    return block.listItem.ordered ? (
      <ol start={block.listItem.start} className="md-single-item">
        {li}
      </ol>
    ) : (
      <ul className="md-single-item">{li}</ul>
    );
  }
  return <BlockNodes tokens={[block.token]} />;
}

/** Rendered plan panel: markdown by default, raw/rendered toggle, fullscreen
 *  overlay with Escape-to-close, raw fallback with notice on parse failure. */
export function PlanView({ markdown }: { markdown: string }) {
  const parse = useMemo(() => parsePlan(markdown), [markdown]);
  const [showRaw, setShowRaw] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const raw = showRaw || !parse.ok;
  const body = (
    <>
      <div className="plan-controls">
        {parse.ok && (
          <button className="btn btn-ghost" onClick={() => setShowRaw(!showRaw)}>
            {showRaw ? "rendered" : "raw"}
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => setFullscreen(!fullscreen)}>
          {fullscreen ? "✕ close" : "⛶ fullscreen"}
        </button>
      </div>
      {!parse.ok && (
        <div className="error-box">showing raw — plan markdown failed to parse ({parse.problems.join("; ")})</div>
      )}
      {raw ? (
        <pre className="doc-view plan-doc">{markdown}</pre>
      ) : (
        <div className="markdown plan-doc">
          <BlockNodes tokens={parse.tokens} />
        </div>
      )}
    </>
  );

  if (fullscreen) {
    return (
      <div className="plan-fullscreen" role="dialog" aria-label="Plan (fullscreen)">
        {body}
      </div>
    );
  }
  return <div className="plan-view">{body}</div>;
}
