export type ViewerMode = "text" | "markdown" | "html";

export interface ScenarioChunk {
  id: string;
  title: string;
  body: string;
}

export interface ScenarioPack {
  id: string;
  name: string;
  samplePrompt: string;
  chunks: ScenarioChunk[];
}

export interface EmbeddingSearchRequest {
  scenarioId: string;
  phrase: string;
  minSimilarity: number; // 0..1
  extraChunks?: ScenarioChunk[]; // optional, user-added chunks for this search
  embeddingModel?: string; // optional override of embeddings model
}

export interface EmbeddingSearchResult {
  chunkId: string;
  similarity: number; // 0..1
}

export interface RespondRequestBody {
  model: string;
  prompt: string;
  context: ScenarioChunk[];
}

export interface RespondResult {
  output: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  durationMs?: number;
  maxOutputTokens?: number;
}


