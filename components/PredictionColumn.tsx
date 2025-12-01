"use client";
import type { ViewerMode } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import DOMPurify, { Config as DOMPurifyConfig } from "dompurify";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useMemo } from "react";

interface PredictionColumnProps {
  output: string;
  mode: ViewerMode;
  onChangeMode: (mode: ViewerMode) => void;
  metrics?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number | null;
    durationMs?: number;
    maxOutputTokensCap?: number;
  };
  modelId?: string;
  modelPricing?: Record<string, { input?: number; output?: number }>;
  onAddToContext?: (compact: boolean) => void;
}

export function PredictionColumn({
  output,
  mode,
  onChangeMode,
  metrics,
  modelId,
  modelPricing,
  onAddToContext
}: PredictionColumnProps) {
  const iframeDoc = useMemo(() => {
    if (mode !== "html") return "";
    const raw = output ?? "";
    
    // Extract HTML from various formats:
    // 1. Fenced code blocks: ```html, ```HTML, ```htm (case-insensitive)
    // 2. Raw HTML starting with <!DOCTYPE or <html
    let extracted = raw;
    const fencedMatch = raw.match(/```(html|htm)/i);
    if (fencedMatch) {
      // Extract content between fenced markers
      const fencedContent = raw.match(/```(?:html|htm)([\s\S]*?)```/i)?.[1];
      if (fencedContent) {
        extracted = fencedContent;
      }
    } else if (/^\s*<!doctype html>/i.test(raw) || /^\s*<html[\s>]/i.test(raw)) {
      // Raw HTML document detected - use as-is
      extracted = raw;
    }
    
    const trimmed = extracted.trim();
    const sanitized = DOMPurify.sanitize(trimmed, {
      USE_PROFILES: { html: true },
      WHOLE_DOCUMENT: true
    } as DOMPurifyConfig);
    
    // Check if this is a complete HTML document
    const hasHtmlShell =
      /^<!doctype html>/i.test(sanitized) ||
      /<html[\s>]/i.test(sanitized);
    if (hasHtmlShell) return sanitized;
    
    // Check if this is a partial HTML fragment (common tags that indicate HTML content)
    const isLikelyHtmlFragment =
      /<(div|section|article|header|footer|main|nav|aside|body|head|style|script|link|meta)[\s>]/i.test(sanitized);
    
    // Wrap partial HTML into a minimal document to isolate in iframe
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base target="_blank" />
    <style>
      :root { color-scheme: light dark; }
      body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
    </style>
  </head>
  <body>
    ${sanitized}
  </body>
</html>`;
  }, [mode, output]);

  const estCostText =
    typeof metrics?.estimatedCostUsd === "number"
      ? `Est. $${metrics.estimatedCostUsd.toFixed(4)}`
      : "Est. $—";
  const perMillionNote = useMemo(() => {
    const price = modelId && modelPricing ? modelPricing[modelId] : undefined;
    const inP = price?.input != null ? `$${price.input}` : "—";
    const outP = price?.output != null ? `$${price.output}` : "—";
    return `↑ ${inP} | ↓ ${outP}`;
  }, [modelId, modelPricing]);
  const durationText =
    typeof metrics?.durationMs === "number" ? `${Math.round(metrics.durationMs)} ms` : "— ms";

  // Token cap progress calculations
  const cap = metrics?.maxOutputTokensCap ?? undefined;
  const inTok = typeof metrics?.inputTokens === "number" ? metrics!.inputTokens : undefined;
  const outTok = typeof metrics?.outputTokens === "number" ? metrics!.outputTokens : undefined;
  const pctIn = cap ? Math.min(100, Math.round(((inTok ?? 0) / cap) * 100)) : 0;
  const pctOut = cap ? Math.min(100, Math.round(((outTok ?? 0) / cap) * 100)) : 0;
  const showCapBar = cap != null && (inTok != null || outTok != null);

  return (
    <section className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-2">
        <span className="text-5xl align-middle mr-1">✂</span> Prediction
      </h2>
      {showCapBar && (
        <div className="mb-2">
          <div className="relative h-2.5 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {/* Input segment */}
            <div
              className="absolute left-0 top-0 h-full bg-gray-500/70 dark:bg-gray-400/60"
              style={{ width: `${pctIn}%` }}
              title={`Input ~ ${inTok?.toLocaleString() ?? "—"} / ${cap.toLocaleString()}`}
            />
            {/* Output segment stacked to the right of input */}
            <div
              className="absolute top-0 h-full bg-green-600 dark:bg-green-500 mix-blend-normal opacity-90"
              style={{
                left: `${pctIn}%`,
                width: `${Math.max(0, Math.min(100 - pctIn, pctOut))}%`
              }}
              title={`Output ~ ${outTok?.toLocaleString() ?? "—"} / ${cap.toLocaleString()}`}
            />
          </div>
          <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
            <span>↑ in {inTok?.toLocaleString() ?? "—"}</span>
            <span> • </span>
            <span className="text-green-600 dark:text-green-500">↓ out {outTok?.toLocaleString() ?? "—"}</span>
            <span> • {cap?.toLocaleString()} max tokens</span>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto rounded border bg-white p-3 dark:bg-gray-800 dark:border-gray-700">
        {mode === "text" && <pre className="whitespace-pre-wrap text-sm">{output}</pre>}
        {mode === "markdown" && (
          <div className="prose max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {(() => {
                // If raw HTML document is detected, strip the DOCTYPE and html/body wrappers
                // to prevent breaking markdown rendering, but preserve inner content
                const raw = output ?? "";
                if (/^\s*<!doctype html>/i.test(raw) || /^\s*<html[\s>]/i.test(raw)) {
                  // Extract body content if present, otherwise extract everything inside <html>
                  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                  if (bodyMatch) return bodyMatch[1];
                  const htmlMatch = raw.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
                  if (htmlMatch) {
                    // Remove <head> section if present
                    const withoutHead = htmlMatch[1].replace(/<head[^>]*>[\s\S]*?<\/head>/i, "");
                    return withoutHead;
                  }
                }
                return raw;
              })()}
            </ReactMarkdown>
          </div>
        )}
        {mode === "html" && <iframe className="w-full h-[60vh] border-0 rounded" sandbox="" srcDoc={iframeDoc} />}
      </div>

      <div className="column-sticky-footer p-3 rounded-t-md">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Viewer</span>
          <div className="flex gap-2">
            <button
              className={`rounded border px-3 py-1 ${
                mode === "text"
                  ? "bg-gray-900 text-white dark:bg-gray-700 dark:text-white border-gray-700"
                  : "bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              }`}
              onClick={() => onChangeMode("text")}
              aria-label="Plain text view"
              title="Plain text"
            >
              {/* Bootstrap card-text icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="h-4 w-4 fill-current">
                <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z"/>
                <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8m0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"/>
              </svg>
            </button>
            <button
              className={`rounded border px-3 py-1 ${
                mode === "markdown"
                  ? "bg-gray-900 text-white dark:bg-gray-700 dark:text-white border-gray-700"
                  : "bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              }`}
              onClick={() => onChangeMode("markdown")}
              aria-label="Markdown view"
              title="Markdown"
            >
              {/* Bootstrap markdown icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="h-4 w-4 fill-current">
                <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
                <path fillRule="evenodd" d="M9.146 8.146a.5.5 0 0 1 .708 0L11.5 9.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708"/>
                <path fillRule="evenodd" d="M11.5 5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 1 .5-.5"/>
                <path d="M3.56 11V7.01h.056l1.428 3.239h.774l1.42-3.24h.056V11h1.073V5.001h-1.2l-1.71 3.894h-.039l-1.71-3.894H2.5V11z"/>
              </svg>
            </button>
            <button
              className={`rounded border px-3 py-1 ${
                mode === "html"
                  ? "bg-gray-900 text-white dark:bg-gray-700 dark:text-white border-gray-700"
                  : "bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              }`}
              onClick={() => onChangeMode("html")}
              aria-label="Raw HTML view"
              title="Raw HTML"
            >
              {/* Bootstrap code-slash icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="h-4 w-4 fill-current">
                <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0m6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0"/>
              </svg>
            </button>
          </div>
          <div className="ml-auto hidden xl:flex items-center gap-2">
            <div className="flex flex-col leading-tight text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              <span>{estCostText}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">per 1M: {perMillionNote}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{durationText}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <label className="hidden lg:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <input
              type="checkbox"
              className="h-4 w-4"
              id="compact-checkbox"
              onChange={(e) => {
                // store on element dataset if needed; we'll read at click
                (e.currentTarget as any)._compactValue = e.currentTarget.checked;
              }}
            />
            Compact to ~128 tokens if long
          </label>
          <div className="flex-1" />
          <button
            className="rounded border px-3 py-1 text-xs dark:border-gray-600 disabled:opacity-60"
            disabled={!output || output.trim().length === 0 || !onAddToContext}
            onClick={() => {
              const cb = document.getElementById("compact-checkbox") as HTMLInputElement | null;
              const compact = cb ? cb.checked : false;
              onAddToContext?.(compact);
            }}
          >
            Add to Context
          </button>
        </div>
      </div>
    </section>
  );
}


