"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ScenarioChunk, ViewerMode } from "@/lib/types";
import { getScenarioById, SCENARIOS } from "@/lib/scenarios";

type AppState = {
  // data
  scenarioId: string;
  chunks: ScenarioChunk[];
  selectedChunkIds: Set<string>;
  highlightedChunkIds: Set<string>;
  searchStatus: "idle" | "ok" | "no_results" | "error";
  searchError?: string;
  isSearching: boolean;
  similarityByChunk: Map<string, number>;
  cosineByChunk: Map<string, number>;
  // search
  searchPhrase: string;
  minSimilarity: number;
  embeddingModel: string;
  availableEmbeddingModels: string[];
  embeddingPricing: Record<string, number>;
  embeddingHints: Record<string, string>;
  // cognition
  prompt: string;
  modelId: string;
  availableModels: string[];
  modelHints: Record<string, { label: string; hint: string }>;
  modelPricing: Record<string, { input?: number; output?: number }>;
  isProcessing: boolean;
  useWeb: boolean;
  // prediction
  output: string;
  viewerMode: ViewerMode;
  metrics: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number | null;
    durationMs?: number;
  };
  // actions
  setScenarioId: (id: string) => void;
  toggleChunk: (chunkId: string, checked: boolean) => void;
  toggleAll: (checked: boolean) => void;
  addChunk: (title: string, body: string) => void;
  updateChunk: (chunkId: string, patch: { title?: string; body?: string }) => void;
  setEmbeddingModel: (m: string) => void;
  search: (phrase: string, min: number) => void;
  setPrompt: (val: string) => void;
  setModelId: (val: string) => void;
  run: () => void;
  setViewerMode: (mode: ViewerMode) => void;
  applyTolerance: (min: number) => void;
  addChatFromPrediction: (compact: boolean) => void;
  setUseWeb: (val: boolean) => void;
};

const MODELS = [
  "gpt-5.1",
  "gpt-5-mini",
  "gpt-5-pro",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano"
];

const MODEL_INFO: Record<string, { label: string; hint: string }> = {
  "gpt-5.1": {
    label: "GPT-5.1",
    hint: "Best for coding and agentic tasks; configurable reasoning."
  },
  "gpt-5-mini": {
    label: "GPT-5 mini",
    hint: "Fast, cost-efficient for well-defined tasks."
  },
  "gpt-5-nano": {
    label: "GPT-5 nano",
    hint: "Fastest and most cost-efficient option."
  },
  "gpt-5-pro": {
    label: "GPT-5 pro",
    hint: "Smarter, more precise responses than GPT-5."
  },
  "gpt-5": {
    label: "GPT-5",
    hint: "Previous reasoning model for coding/agentic tasks with configurable effort."
  },
  "gpt-4o": {
    label: "GPT-4o",
    hint: "Fast multimodal flagship; great quality/cost balance."
  },
  "gpt-4o-mini": {
    label: "GPT-4o mini",
    hint: "Very low cost; good for large batch tasks."
  },
  "gpt-4.1": {
    label: "GPT-4.1",
    hint: "Strong general model (non-reasoning)."
  },
  "gpt-4.1-mini": {
    label: "GPT-4.1 mini",
    hint: "Smaller 4.1 variant; good quality at lower cost and latency."
  },
  "gpt-4.1-nano": {
    label: "GPT-4.1 nano",
    hint: "Fastest, most cost‑efficient 4.1 class for lightweight tasks."
  }
};

// Pricing estimates (USD per 1M tokens). Verify against pricing docs:
// https://platform.openai.com/docs/pricing
// Leave fields undefined if pricing is not confirmed.
const PRICING_PER_MTOK: Record<string, { input?: number; output?: number }> = {
  // GPT‑5 family (from pricing table)
  "gpt-5.1": { input: 1.25, output: 10.0 },
  "gpt-5-mini": { input: 0.25, output: 2.0 },
  "gpt-5-pro": { input: 15.0, output: 120.0 },
  // Other popular models (verify on pricing page)
  "gpt-4o": { input: 5.0, output: 15.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  // Update gpt-4.1 per table shown
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-4.1-mini": { input: 0.40, output: 0.10 },
  "gpt-4.1-nano": { input: 0.10, output: 0.025 }
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const sortedModels = useMemo(() => {
    const score = (m: string) => {
      const p = PRICING_PER_MTOK[m];
      return (p?.input ?? 0) + (p?.output ?? 0);
    };
    return [...MODELS].sort((a, b) => score(b) - score(a));
  }, []);
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0]?.id ?? "marketing");
  const [chunks, setChunks] = useState<ScenarioChunk[]>([]);
  const [selectedChunkIds, setSelectedChunkIds] = useState<Set<string>>(new Set());
  const [highlightedChunkIds, setHighlightedChunkIds] = useState<Set<string>>(new Set());
  const [searchStatus, setSearchStatus] = useState<"idle" | "ok" | "no_results" | "error">("idle");
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [similarityByChunk, setSimilarityByChunk] = useState<Map<string, number>>(new Map());
  const [cosineByChunk, setCosineByChunk] = useState<Map<string, number>>(new Map());

  const [searchPhrase, setSearchPhrase] = useState<string>("");
  const [minSimilarity, setMinSimilarity] = useState<number>(0.75);
  // Embedding models (highest price to lowest)
  const EMBEDDING_PRICES: Record<string, number> = useMemo(
    () => ({
      "text-embedding-3-large": 0.13,
      "text-embedding-ada-002": 0.10,
      "text-embedding-3-small": 0.02
    }),
    []
  );
  const availableEmbeddingModels = useMemo(
    () =>
      Object.keys(EMBEDDING_PRICES).sort(
        (a, b) => (EMBEDDING_PRICES[b] ?? 0) - (EMBEDDING_PRICES[a] ?? 0)
      ),
    [EMBEDDING_PRICES]
  );
  const [embeddingModel, setEmbeddingModel] = useState<string>(
    availableEmbeddingModels.includes("text-embedding-ada-002")
      ? "text-embedding-ada-002"
      : availableEmbeddingModels[availableEmbeddingModels.length - 1]
  );
  const EMBEDDING_HINTS: Record<string, string> = useMemo(
    () => ({
      "text-embedding-3-large": "2024 model • Highest quality modern embeddings.",
      "text-embedding-3-small": "2024 model • Small, fast, cost‑efficient.",
      "text-embedding-ada-002": "2022 model • Legacy ada embeddings, cheaper but older."
    }),
    []
  );

  const [prompt, setPrompt] = useState<string>("");
  const [modelId, setModelId] = useState<string>(() => {
    if (sortedModels.includes("gpt-4.1-nano")) return "gpt-4.1-nano";
    return sortedModels[sortedModels.length - 1]; // fallback to cheapest
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [useWeb, setUseWeb] = useState<boolean>(false);

  const [output, setOutput] = useState<string>("");
  const [viewerMode, setViewerMode] = useState<ViewerMode>("text");
  const [userChunks, setUserChunks] = useState<ScenarioChunk[]>([]);
  const [editedChunkIds, setEditedChunkIds] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<{
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number | null;
    durationMs?: number;
    maxOutputTokensCap?: number;
  }>({});

  // Load scenario data on change
  useEffect(() => {
    const pack = getScenarioById(scenarioId) ?? SCENARIOS[0];
    if (pack) {
      setChunks(pack.chunks);
      setSelectedChunkIds(new Set(pack.chunks.map((c) => c.id)));
      setHighlightedChunkIds(new Set());
      setSearchStatus("idle");
      setSearchError(undefined);
      setPrompt(pack.samplePrompt);
      setOutput("");
      setSearchPhrase("");
      setMinSimilarity(0.75);
      setSimilarityByChunk(new Map());
      setCosineByChunk(new Map());
      setUserChunks([]);
      setEditedChunkIds(new Set());
    }
  }, [scenarioId]);

  const toggleChunk = useCallback((chunkId: string, checked: boolean) => {
    setSelectedChunkIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(chunkId);
      else next.delete(chunkId);
      return next;
    });
  }, []);

  const toggleAll = useCallback((checked: boolean) => {
    setSelectedChunkIds((_) => {
      if (checked) return new Set(chunks.map((c) => c.id));
      return new Set();
    });
  }, [chunks]);

  const search = useCallback(
    async (phrase: string, min: number) => {
      try {
        setSearchPhrase(phrase);
        setMinSimilarity(min);
        setSearchError(undefined);
        setIsSearching(true);
        // Clear any prior highlights immediately so new matches stand out
        setHighlightedChunkIds(new Set());
        if (!phrase.trim()) {
          setHighlightedChunkIds(new Set());
          setSearchStatus("idle");
          setSimilarityByChunk(new Map());
          setCosineByChunk(new Map());
          return;
        }
        // Also clear current selections so only new matches are selected
        setSelectedChunkIds(new Set());
        const res = await fetch("/api/embeddings/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId,
            phrase,
            minSimilarity: min,
            // Send user-created chunks and any edited scenario chunks as overrides
            extraChunks: [
              ...userChunks,
              ...chunks.filter((c) => editedChunkIds.has(c.id))
            ],
            embeddingModel
          })
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data: {
          results: { chunkId: string; similarity: number }[];
          scores: { chunkId: string; dot: number; cosine: number }[];
        } = await res.json();
        // Build dot product score map for all chunks
        const scoreMap = new Map<string, number>();
        const cosMap = new Map<string, number>();
        for (const s of data.scores || []) {
          scoreMap.set(s.chunkId, s.dot);
          cosMap.set(s.chunkId, s.cosine);
        }
        setSimilarityByChunk(scoreMap);
        setCosineByChunk(cosMap);
        const ids = new Set<string>(data.results.map((r) => r.chunkId));
        if (ids.size === 0) {
          // No results: keep current selection, just clear highlights and show status.
          setHighlightedChunkIds(new Set());
          setSearchStatus("no_results");
        } else {
          // Auto-select matches; de-select others
          setSelectedChunkIds(ids);
          setHighlightedChunkIds(ids);
          setSearchStatus("ok");
        }
      } catch (e) {
        console.error("search error", e);
        setSearchStatus("error");
        setSearchError(
          "Search failed. Ensure OPENAI_API_KEY is configured and try again."
        );
      } finally {
        setIsSearching(false);
      }
    },
    [scenarioId, userChunks, embeddingModel]
  );

  // Re-apply tolerance locally using cached cosine similarities
  const applyTolerance = useCallback(
    (min: number) => {
      setMinSimilarity(min);
      if (cosineByChunk.size === 0) return; // nothing cached yet
      const ids = new Set<string>();
      cosineByChunk.forEach((cos, id) => {
        if (cos >= min) ids.add(id);
      });
      if (ids.size === 0) {
        setHighlightedChunkIds(new Set());
        setSearchStatus("no_results");
      } else {
        setSelectedChunkIds(ids);
        setHighlightedChunkIds(ids);
        setSearchStatus("ok");
      }
    },
    [cosineByChunk]
  );

  const run = useCallback(async () => {
    try {
      setIsProcessing(true);
      const allChunks = [...chunks, ...userChunks];
      const selected = allChunks.filter((c) => selectedChunkIds.has(c.id));
      const res = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelId, prompt, context: selected, useWeb })
      });
      if (!res.ok) throw new Error(`Respond failed: ${res.status}`);
      const data: {
        output: string;
        usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
        durationMs?: number;
        maxOutputTokens?: number;
      } = await res.json();
      setOutput(data.output || "");
      const inputTokens = data.usage?.input_tokens ?? undefined;
      const outputTokens = data.usage?.output_tokens ?? undefined;
      const totalTokens = data.usage?.total_tokens ?? undefined;
      const durationMs = data.durationMs ?? undefined;
      let estimatedCostUsd: number | null = null;
      const pricing = PRICING_PER_MTOK[modelId];
      if (pricing) {
        const inCost = (inputTokens ?? 0) * (pricing.input / 1_000_000);
        const outCost = (outputTokens ?? 0) * (pricing.output / 1_000_000);
        estimatedCostUsd = inCost + outCost;
      }
      setMetrics({
        inputTokens,
        outputTokens,
        totalTokens,
        durationMs,
        estimatedCostUsd,
        maxOutputTokensCap: data.maxOutputTokens
      });
    } catch (e) {
      console.error("run error", e);
      setOutput("Error generating response. Check server logs and API key configuration.");
      setMetrics({});
    } finally {
      setIsProcessing(false);
    }
  }, [chunks, userChunks, selectedChunkIds, modelId, prompt, useWeb]);

  const addChunk = useCallback((title: string, body: string) => {
    const id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const chunk: ScenarioChunk = { id, title, body };
    setUserChunks((prev) => [...prev, chunk]);
    setChunks((prev) => [...prev, chunk]);
    setSelectedChunkIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const addChatFromPrediction = useCallback(
    async (makeCompact: boolean) => {
      const assistantText = (output || "").trim();
      const userText = (prompt || "").trim();
      if (!assistantText) return;
      // Build combined chat body including the prompt above the assistant reply
      let assistantToStore = assistantText;
      const isLong = assistantText.length > 800;
      if (makeCompact && isLong) {
        try {
          const res = await fetch("/api/compact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: assistantText, targetTokens: 128 })
          });
          if (res.ok) {
            const data: { compact: string } = await res.json();
            assistantToStore = (data.compact || assistantText).trim();
          }
        } catch {
          // If compaction fails, fall back to original
        }
      }
      const bodyParts: string[] = [];
      if (userText) bodyParts.push(`User: ${userText}`);
      bodyParts.push(`\nAssistant: ${assistantToStore}`);
      const body = bodyParts.join("\n\n");
      // Determine next chat turn index
      const existing = chunks.filter((c) => c.title.startsWith("Chat Turn"));
      const nextIdx = existing.length + 1;
      addChunk(`Chat Turn ${nextIdx}: User + Assistant`, body);
    },
    [output, prompt, chunks, addChunk]
  );

  const updateChunk = useCallback(
    (chunkId: string, patch: { title?: string; body?: string }) => {
      setChunks((prev) =>
        prev.map((c) => (c.id === chunkId ? { ...c, ...patch } : c))
      );
      setUserChunks((prev) =>
        prev.map((c) => (c.id === chunkId ? { ...c, ...patch } : c))
      );
      setEditedChunkIds((prev) => {
        const next = new Set(prev);
        next.add(chunkId);
        return next;
      });
    },
    []
  );

  const value: AppState = useMemo(
    () => ({
      scenarioId,
      chunks,
      selectedChunkIds,
      highlightedChunkIds,
      searchPhrase,
      minSimilarity,
      embeddingModel,
      availableEmbeddingModels,
      embeddingPricing: EMBEDDING_PRICES,
      embeddingHints: EMBEDDING_HINTS,
      searchStatus,
      searchError,
      prompt,
      modelId,
      availableModels: sortedModels,
      modelHints: MODEL_INFO,
      modelPricing: PRICING_PER_MTOK,
      isProcessing,
      useWeb,
      similarityByChunk,
      cosineByChunk,
      output,
      viewerMode,
      metrics,
      isSearching,
      setScenarioId,
      toggleChunk,
      toggleAll,
      addChunk,
      updateChunk,
      setEmbeddingModel,
      search,
      setPrompt,
      setModelId,
      run,
      setViewerMode,
      applyTolerance
      ,
      addChatFromPrediction
      ,
      setUseWeb
    }),
    [
      scenarioId,
      chunks,
      selectedChunkIds,
      highlightedChunkIds,
      searchPhrase,
      minSimilarity,
      embeddingModel,
      prompt,
      modelId,
      isProcessing,
      useWeb,
      similarityByChunk,
      cosineByChunk,
      output,
      viewerMode,
      metrics,
      isSearching,
      searchStatus,
      searchError,
      toggleChunk,
      toggleAll,
      addChunk,
      updateChunk,
      setEmbeddingModel,
      search,
      run,
      applyTolerance
      ,
      addChatFromPrediction,
      setUseWeb
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}


