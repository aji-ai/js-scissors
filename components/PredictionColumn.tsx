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
  };
  modelId?: string;
  modelPricing?: Record<string, { input?: number; output?: number }>;
}

export function PredictionColumn({
  output,
  mode,
  onChangeMode,
  metrics,
  modelId,
  modelPricing
}: PredictionColumnProps) {
  const iframeDoc = useMemo(() => {
    if (mode !== "html") return "";
    const raw = output ?? "";
    // Extract fenced ```html blocks if present
    const fenced = raw.match(/```html([\s\S]*?)```/i)?.[1] ?? raw;
    const trimmed = fenced.trim();
    const sanitized = DOMPurify.sanitize(trimmed, {
      USE_PROFILES: { html: true },
      WHOLE_DOCUMENT: true
    } as DOMPurifyConfig);
    const hasHtmlShell =
      /^<!doctype html>/i.test(sanitized) ||
      /<html[\s>]/i.test(sanitized);
    if (hasHtmlShell) return sanitized;
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

  const inputTokensText =
    typeof metrics?.inputTokens === "number" ? metrics.inputTokens.toLocaleString() : "—";
  const outputTokensText =
    typeof metrics?.outputTokens === "number" ? metrics.outputTokens.toLocaleString() : "—";
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

  return (
    <section className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-2">Prediction</h2>
      <div className="flex-1 overflow-auto rounded border bg-white p-3 dark:bg-gray-800 dark:border-gray-700">
        {mode === "text" && <pre className="whitespace-pre-wrap text-sm">{output}</pre>}
        {mode === "markdown" && (
          <div className="prose max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {output}
            </ReactMarkdown>
          </div>
        )}
        {mode === "html" && <iframe className="w-full h-[60vh] border-0 rounded" sandbox="" srcDoc={iframeDoc} />}
      </div>

      <div className="column-sticky-footer p-3 rounded-t-md">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">Viewer</span>
          <div className="flex gap-2">
            <button
              className={`rounded border px-3 py-1 ${
                mode === "text"
                  ? "bg-gray-900 text-white dark:bg-gray-700 dark:text-white border-gray-700"
                  : "bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              }`}
              onClick={() => onChangeMode("text")}
            >
              Text
            </button>
            <button
              className={`rounded border px-3 py-1 ${
                mode === "markdown"
                  ? "bg-gray-900 text-white dark:bg-gray-700 dark:text-white border-gray-700"
                  : "bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              }`}
              onClick={() => onChangeMode("markdown")}
            >
              Markdown
            </button>
            <button
              className={`rounded border px-3 py-1 ${
                mode === "html"
                  ? "bg-gray-900 text-white dark:bg-gray-700 dark:text-white border-gray-700"
                  : "bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              }`}
              onClick={() => onChangeMode("html")}
            >
              HTML
            </button>
          </div>
          <div className="flex-1" />
          <div className="flex items-end gap-4">
            <div className="flex flex-col leading-tight text-xs text-gray-700 dark:text-gray-300 tabular-nums">
              <span>
                ↑ {inputTokensText} | ↓ {outputTokensText}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">tokens</span>
            </div>
            <div className="flex flex-col leading-tight text-xs text-gray-700 dark:text-gray-300 tabular-nums">
              <span>{estCostText}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">per 1M: {perMillionNote}</span>
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300">{durationText}</div>
          </div>
        </div>
      </div>
    </section>
  );
}


