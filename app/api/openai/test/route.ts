import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function GET() {
  try {
    // Minimal/cheap check: create a tiny embedding
    const resp = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "ping"
    });
    const ok = !!resp.data?.[0]?.embedding?.length;
    if (ok) {
      return NextResponse.json({ ok: true, message: "API key is valid." });
    }
    return NextResponse.json(
      { ok: false, message: "Embedding request returned no data." },
      { status: 500 }
    );
  } catch (error: unknown) {
    console.error("/api/openai/test error", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          "Failed to reach OpenAI. Check OPENAI_API_KEY and network connectivity."
      },
      { status: 500 }
    );
  }
}


