import { openai } from "./openai";
import type { ScenarioPack, EmbeddingSearchResult, ScenarioChunk } from "./types";

type ChunkEmbeddingCache = Map<string, number[]>; // chunkId -> vector
// cache key is scenarioId|model
const scenarioEmbeddingsCache = new Map<string, ChunkEmbeddingCache>();

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

export async function getScenarioChunkEmbeddings(
  scenario: ScenarioPack,
  model: string
): Promise<ChunkEmbeddingCache> {
  const cacheKey = `${scenario.id}|${model}`;
  const cached = scenarioEmbeddingsCache.get(cacheKey);
  if (cached) return cached;

  const inputs = scenario.chunks.map((c) => `${c.title}\n\n${c.body}`);
  const vecs = await embedBatch(inputs, model);
  const vectors = new Map<string, number[]>();
  scenario.chunks.forEach((chunk, idx) => {
    const emb = vecs[idx];
    if (emb) vectors.set(chunk.id, emb);
  });
  scenarioEmbeddingsCache.set(cacheKey, vectors);
  return vectors;
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
  for (const [chunkId, vector] of cache.entries()) {
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


