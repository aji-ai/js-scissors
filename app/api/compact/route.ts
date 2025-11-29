import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text: string | undefined = body?.text;
    const targetTokens: number = typeof body?.targetTokens === "number" ? body.targetTokens : 128;
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    const prompt = `Compress the following assistant reply to approximately ${targetTokens} tokens while preserving key facts and intent. Use clear, readable wording.

--- BEGIN REPLY ---
${text}
--- END REPLY ---`;

    const t0 = Date.now();
    const resp = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      max_output_tokens: 1024
    });
    const anyResp: any = resp as any;
    const outputText: string =
      anyResp.output_text ??
      (Array.isArray(anyResp.output) &&
      anyResp.output[0] &&
      anyResp.output[0].content &&
      anyResp.output[0].content[0] &&
      anyResp.output[0].content[0].text
        ? anyResp.output[0].content[0].text
        : "");
    const durationMs = Date.now() - t0;
    return NextResponse.json({ compact: outputText ?? "", usage: resp.usage, durationMs });
  } catch (e) {
    console.error("/api/compact error", e);
    return NextResponse.json({ error: "Failed to compact" }, { status: 500 });
  }
}


