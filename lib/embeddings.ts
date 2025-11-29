import { openai } from "./openai";
import type { ScenarioPack, EmbeddingSearchResult, ScenarioChunk } from "./types";

// Internal cache entry stores vector and a content hash to detect edits
type CacheEntry = { vec: number[]; hash: string };
type InternalEmbeddingCache = Map<string, CacheEntry>; // chunkId -> entry
// cache key is scenarioId|model
const scenarioEmbeddingsCache = new Map<string, InternalEmbeddingCache>();

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

async function embedText(text: string, model: string): Promise<number[]> {
  const resp = await openai.embeddings.create({
    model,
    input: text
  });
  const v = resp.data[0]?.embedding;
  if (!v) throw new Error("Failed to embed text");
  return v;
}

async function embedBatch(inputs: string[], model: string): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const resp = await openai.embeddings.create({
    model,
    input: inputs
  });
  return resp.data.map((d) => d.embedding).filter(Boolean) as number[][];
}

// Fast, simple content hash (djb2 variant) for change detection
function hashContent(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = (h * 33) ^ text.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

export async function getScenarioChunkEmbeddings(
  scenario: ScenarioPack,
  model: string
): Promise<Map<string, number[]>> {
  const cacheKey = `${scenario.id}|${model}`;
  let internal = scenarioEmbeddingsCache.get(cacheKey);
  if (!internal) {
    internal = new Map<string, CacheEntry>();
    scenarioEmbeddingsCache.set(cacheKey, internal);
  }

  // Determine which chunks are missing or stale (content changed)
  const toEmbed: { id: string; text: string; hash: string }[] = [];
  for (const c of scenario.chunks) {
    const text = `${c.title}\n\n${c.body}`;
    const h = hashContent(text);
    const entry = internal.get(c.id);
    if (!entry || entry.hash !== h) {
      toEmbed.push({ id: c.id, text, hash: h });
    }
  }

  // (Re)embed as needed and update cache
  if (toEmbed.length > 0) {
    const vecs = await embedBatch(toEmbed.map((t) => t.text), model);
    toEmbed.forEach((t, i) => {
      const v = vecs[i];
      if (v) internal!.set(t.id, { vec: v, hash: t.hash });
    });
  }

  // Return a public map of vectors only
  const publicVectors = new Map<string, number[]>();
  for (const [id, entry] of internal.entries()) {
    publicVectors.set(id, entry.vec);
  }
  return publicVectors;
}

export async function computeAllSimilarities(
  scenario: ScenarioPack,
  phrase: string,
  model: string,
  extraChunks?: ScenarioChunk[]
): Promise<Array<{ chunkId: string; dot: number; cosine: number }>> {
  const [cache, queryVec, extraVecs] = await Promise.all([
    getScenarioChunkEmbeddings(scenario, model),
    embedText(phrase, model),
    embedBatch((extraChunks ?? []).map((c) => `${c.title}\n\n${c.body}`), model)
  ]);
  const all: Array<{ chunkId: string; dot: number; cosine: number }> = [];
  // If extraChunks contain overrides for existing ids, prefer the override and skip cached one
  const overrideIds = new Set((extraChunks ?? []).map((c) => c.id));
  for (const [chunkId, vector] of cache.entries()) {
    if (overrideIds.has(chunkId)) continue;
    all.push({
      chunkId,
      dot: dotProduct(queryVec, vector),
      cosine: cosineSimilarity(queryVec, vector)
    });
  }
  // Merge extra chunk scores
  if (extraChunks && extraChunks.length > 0) {
    extraChunks.forEach((c, i) => {
      const v = extraVecs[i];
      if (!v) return;
      all.push({
        chunkId: c.id,
        dot: dotProduct(queryVec, v),
        cosine: cosineSimilarity(queryVec, v)
      });
    });
  }
  return all.sort((a, b) => b.cosine - a.cosine);
}

export async function searchChunksByPhrase(
  scenario: ScenarioPack,
  phrase: string,
  minSimilarity: number,
  model: string,
  extraChunks?: ScenarioChunk[]
): Promise<EmbeddingSearchResult[]> {
  const all = await computeAllSimilarities(scenario, phrase, model, extraChunks);
  return all
    .filter((r) => r.cosine >= minSimilarity)
    .map((r) => ({ chunkId: r.chunkId, similarity: r.cosine }));
}


