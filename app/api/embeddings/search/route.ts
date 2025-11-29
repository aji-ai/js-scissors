import { NextResponse } from "next/server";
import { getScenarioById } from "@/lib/scenarios";
import { searchChunksByPhrase, computeAllSimilarities } from "@/lib/embeddings";
import type { EmbeddingSearchRequest, ScenarioChunk } from "@/lib/types";
import { openaiFromRequest } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EmbeddingSearchRequest;
    const { scenarioId, phrase, minSimilarity, extraChunks, embeddingModel } = body || {};

    if (!scenarioId || typeof phrase !== "string") {
      return NextResponse.json(
        { error: "scenarioId and phrase are required" },
        { status: 400 }
      );
    }
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Unknown scenarioId" }, { status: 404 });
    }
    const threshold =
      typeof minSimilarity === "number" && minSimilarity >= 0 && minSimilarity <= 1
        ? minSimilarity
        : 0.75;

    const safeExtras: ScenarioChunk[] = Array.isArray(extraChunks)
      ? extraChunks
          .filter(
            (c) =>
              c &&
              typeof c.id === "string" &&
              typeof c.title === "string" &&
              typeof c.body === "string"
          )
          .slice(0, 50) // guardrails
      : [];

    const model = embeddingModel && typeof embeddingModel === "string" ? embeddingModel : "text-embedding-3-small";

    const openai = openaiFromRequest(request);
    const [results, scores] = await Promise.all([
      searchChunksByPhrase(openai, scenario, phrase, threshold, model, safeExtras),
      computeAllSimilarities(openai, scenario, phrase, model, safeExtras)
    ]);
    return NextResponse.json({ results, scores });
  } catch (error: unknown) {
    console.error("/api/embeddings/search error", error);
    return NextResponse.json(
      { error: "Failed to search embeddings" },
      { status: 500 }
    );
  }
}


