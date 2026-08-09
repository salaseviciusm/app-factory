import { Component, createElement, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Token, Tokens } from "marked";
import { parsePlan, type PlanBlock } from "../markdown";

/*
 * Rendered-markdown plan widget: marked is the LEXER only — React elements are
 * built from the token stream, so there is no dangerouslySetInnerHTML anywhere
 * on this path and text (including any `<script>`) stays literal text. In
 * strict mode (plans) lexer failure or a render-breaking profile violation
 * (raw HTML, tables) falls back to the raw <pre> view with a loud notice —
 * never a blank panel. In lenient mode (generic markdown files) every token
 * renders: tables and task lists as real elements, raw HTML as literal source
 * text, and any block the renderer chokes on degrades to its raw source while
 * the rest of the document keeps rendering.
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
      case "image": {
        // Relative paths can't resolve inside the modal (files come through
        // token-authenticated blob fetches), so an image is its alt text,
        // linked when the URL is plain http(s).
        const img = t as Tokens.Image;
        const alt = img.text || img.href;
        if (!/^https?:/i.test(img.href)) return <span key={i}>{alt}</span>;
        return (
          <a key={i} href={img.href} target="_blank" rel="noreferrer">
            {alt}
          </a>
        );
      }
      case "html":
        // Inline HTML stays literal source text — never injected.
        return <span key={i}>{t.raw}</span>;
      default:
        // Anything unexpected renders as its literal source text.
        return <span key={i}>{t.raw}</span>;
    }
  });
}

/** List item, with a GFM task checkbox when the item carries one. */
function ListItemNode({ item }: { item: Tokens.ListItem }) {
  if (item.task) {
    return (
      <li className="md-task">
        <input type="checkbox" checked={!!item.checked} disabled />
        <BlockNodes tokens={item.tokens} />
      </li>
    );
  }
  return (
    <li>
      <BlockNodes tokens={item.tokens} />
    </li>
  );
}

/** One block token as React elements (unkeyed — BlockNodes keys the wrapper). */
function BlockContent({ token: t }: { token: Token }): ReactNode {
  switch (t.type) {
    case "heading": {
      const h = t as Tokens.Heading;
      return createElement(`h${h.depth}`, null, <InlineNodes tokens={h.tokens} />);
    }
    case "paragraph":
      return (
        <p>
          <InlineNodes tokens={(t as Tokens.Paragraph).tokens} />
        </p>
      );
    case "list": {
      const list = t as Tokens.List;
      const items = list.items.map((item, j) => <ListItemNode key={j} item={item} />);
      return list.ordered ? <ol start={Number(list.start || 1)}>{items}</ol> : <ul>{items}</ul>;
    }
    case "code":
      return (
        <pre className="md-code">
          <code>{(t as Tokens.Code).text}</code>
        </pre>
      );
    case "blockquote":
      return (
        <blockquote>
          <BlockNodes tokens={(t as Tokens.Blockquote).tokens} />
        </blockquote>
      );
    case "table": {
      const table = t as Tokens.Table;
      const cellStyle = (align: Tokens.TableCell["align"]) => (align ? { textAlign: align } : undefined);
      return (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {table.header.map((cell, j) => (
                  <th key={j} style={cellStyle(cell.align)}>
                    <InlineNodes tokens={cell.tokens} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, j) => (
                    <td key={j} style={cellStyle(cell.align)}>
                      <InlineNodes tokens={cell.tokens} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "hr":
      return <hr />;
    case "text":
      // Tight list items wrap their content in block-level text tokens.
      return <InlineNodes tokens={(t as Tokens.Text).tokens ?? [t]} />;
    case "html":
    default:
      // Block HTML and anything unexpected show as raw source — never injected.
      return <pre className="md-code">{t.raw}</pre>;
  }
}

/** Render-error guard: a block whose renderer throws degrades to its raw
 *  markdown source instead of blanking the whole document. */
class BlockBoundary extends Component<{ raw: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <pre className="md-code">{this.props.raw}</pre>;
    return this.props.children;
  }
}

function BlockNodes({ tokens }: { tokens: Token[] | undefined }): ReactNode {
  return (tokens ?? []).map((t, i) => {
    if (t.type === "space" || t.type === "def") return null;
    return (
      <BlockBoundary key={i} raw={t.raw}>
        <BlockContent token={t} />
      </BlockBoundary>
    );
  });
}

/** One plan block rendered standalone (editor rows) — list items keep their
 *  real numbering via a single-item list. */
export function BlockNode({ block }: { block: PlanBlock }) {
  if (block.listItem) {
    const li = <ListItemNode item={block.token as Tokens.ListItem} />;
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

/** Fullscreen rendered-markdown modal (fixed overlay, so the page underneath
 *  keeps its DOM and scroll position): title, raw/rendered toggle, close
 *  button, Escape-to-close, raw fallback with notice on parse failure.
 *  `markdown === null` shows a loading state. Lenient by default (generic
 *  files render tables/HTML/etc.); pass `strict` for plan-profile documents. */
export function MarkdownModal({
  title,
  markdown,
  error,
  onClose,
  strict = false,
}: {
  title: string;
  markdown: string | null;
  error?: string | null;
  onClose: () => void;
  strict?: boolean;
}) {
  const parse = useMemo(() => (markdown === null ? null : parsePlan(markdown, { strict })), [markdown, strict]);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const raw = showRaw || (parse !== null && !parse.ok);
  return (
    <div className="plan-fullscreen" role="dialog" aria-label={title}>
      <div className="plan-controls md-modal-head">
        <h3>{title}</h3>
        <span className="md-modal-btns">
          {parse?.ok && (
            <button className="btn btn-ghost" onClick={() => setShowRaw(!showRaw)}>
              {showRaw ? "rendered" : "raw"}
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            ✕ close
          </button>
        </span>
      </div>
      {error && <div className="error-box">preview failed to load: {error}</div>}
      {markdown === null && !error && <div className="empty-state">Loading markdown…</div>}
      {parse && !parse.ok && (
        <div className="error-box">showing raw — markdown failed to render ({parse.problems.join("; ")})</div>
      )}
      {markdown !== null &&
        (raw ? (
          <pre className="doc-view plan-doc">{markdown}</pre>
        ) : (
          <div className="markdown plan-doc">
            <BlockNodes tokens={parse!.tokens} />
          </div>
        ))}
    </div>
  );
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
