import { useMemo, useState } from "react";
import type { ScenarioChunk } from "@/lib/types";
import { ChunkCard } from "./ChunkCard";
import { Modal } from "./Modal";

interface ContextColumnProps {
  chunks: ScenarioChunk[];
  selectedChunkIds: Set<string>;
  highlightedChunkIds?: Set<string>;
  onToggleChunk: (chunkId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onSearch: (phrase: string, minSimilarity: number) => void;
  onChangeTolerance?: (minSimilarity: number) => void;
  onAddChunk?: (title: string, body: string) => void;
  initialSearchPhrase?: string;
  initialMinSimilarity?: number;
  statusText?: string;
  isSearching?: boolean;
  scoreByChunkId?: Map<string, number>;
  embeddingModel: string;
  availableEmbeddingModels: string[];
  embeddingPricing: Record<string, number>;
  onChangeEmbeddingModel: (m: string) => void;
}

export function ContextColumn({
  chunks,
  selectedChunkIds,
  highlightedChunkIds,
  onToggleChunk,
  onToggleAll,
  onSearch,
  onChangeTolerance,
  onAddChunk,
  initialSearchPhrase,
  initialMinSimilarity,
  statusText,
  isSearching,
  scoreByChunkId,
  embeddingModel,
  availableEmbeddingModels,
  embeddingPricing,
  onChangeEmbeddingModel
}: ContextColumnProps) {
  const [phrase, setPhrase] = useState(initialSearchPhrase ?? "");
  const [minSim, setMinSim] = useState(initialMinSimilarity ?? 0.75);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const allSelected = useMemo(
    () => chunks.length > 0 && chunks.every((c) => selectedChunkIds.has(c.id)),
    [chunks, selectedChunkIds]
  );

  return (
    <section className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-2">Context</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-24">
        {chunks.map((chunk) => {
          const checked = selectedChunkIds.has(chunk.id);
          const highlight = highlightedChunkIds?.has(chunk.id);
          const score = scoreByChunkId?.get(chunk.id);
          return (
            <ChunkCard
              key={chunk.id}
              chunk={chunk}
              checked={checked}
              highlight={highlight}
              score={score}
              onChange={(next) => onToggleChunk(chunk.id, next)}
            />
          );
        })}
        {/* Add Card tile (last) */}
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-3 hover:border-gray-400 hover:bg-gray-50 transition"
          aria-label="Add card"
        >
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path fillRule="evenodd" d="M12 4.5a.75.75 0 01.75.75V11h5.75a.75.75 0 010 1.5H12.75v5.75a.75.75 0 01-1.5 0V12.5H5.5a.75.75 0 010-1.5h5.75V5.25A.75.75 0 0112 4.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mt-2 text-sm font-medium text-gray-700">Add Card</div>
          </div>
        </button>
      </div>

      <div className="column-sticky-footer p-3 rounded-t-md">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 min-w-24">Embedding</label>
            <select
              className="rounded border px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              value={embeddingModel}
              onChange={(e) => onChangeEmbeddingModel(e.target.value)}
            >
              {availableEmbeddingModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-600 tabular-nums">
              ↑ ${embeddingPricing[embeddingModel]?.toFixed(2) ?? "—"} per 1M
            </span>
          </div>
          <div className="flex gap-2">
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Search phrase (embeddings)"
              className="flex-1 rounded border px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!isSearching) onSearch(phrase, minSim);
                }
              }}
            />
            <button
              className={`rounded px-4 py-2 border ${
                isSearching
                  ? "bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                  : "bg-blue-600 text-white dark:bg-blue-600 dark:text-white dark:border-blue-600"
              }`}
              onClick={() => onSearch(phrase, minSim)}
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
            {isSearching && (
              <div
                className="ml-1 inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"
                aria-label="Loading"
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 min-w-16">Match</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={minSim}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setMinSim(v);
                onChangeTolerance?.(v);
              }}
              className="flex-1"
              disabled={isSearching}
            />
            <div className="text-xs tabular-nums w-12 text-right">{minSim.toFixed(2)}</div>
            <button
              className="ml-auto rounded border px-3 py-2 dark:border-gray-600 dark:text-gray-100"
              onClick={() => onToggleAll(!allSelected)}
              disabled={isSearching}
            >
              {allSelected ? "None" : "All"}
            </button>
          </div>
          {statusText && <div className="text-xs text-gray-600">{statusText}</div>}
        </div>
      </div>
      <Modal
        title="Add Context Card"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onPrimary={() => {
          const t = newTitle.trim();
          const b = newBody.trim();
          if (!t || !b) return;
          onAddChunk?.(t, b);
          setNewTitle("");
          setNewBody("");
          setAddOpen(false);
        }}
        primaryText="Add"
        secondaryText="Cancel"
      >
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter card title"
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Body</label>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Enter card content"
              className="w-full rounded border px-3 py-2 h-32 resize-vertical"
            />
          </div>
        </div>
      </Modal>
    </section>
  );
}


