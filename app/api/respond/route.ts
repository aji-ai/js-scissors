import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import type { RespondRequestBody } from "@/lib/types";

function buildInputText(prompt: string, context: { title: string; body: string }[]) {
  const lines: string[] = [];
  lines.push("[Context]");
  for (const c of context) {
    lines.push(`- ${c.title}: ${c.body}`);
  }
  lines.push("");
  lines.push("[Task]");
  lines.push(prompt);
  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RespondRequestBody;
    const { model, prompt, context, useWeb } = body || {};
    if (!model || typeof prompt !== "string" || !Array.isArray(context)) {
      return NextResponse.json(
        { error: "model, prompt, and context[] are required" },
        { status: 400 }
      );
    }

    const input = buildInputText(
      prompt,
      context.map((c) => ({ title: c.title, body: c.body }))
    );

    const t0 = Date.now();
    const max_output_tokens = 1024; // reference cap for UI indicator
    const response = await openai.responses.create({
      model,
      input,
      // Use the official web search tool type per Responses API docs
      ...(useWeb
        ? { tools: [{ type: "web_search_preview" } as any], tool_choice: "auto" as any }
        : {}),
      max_output_tokens
    });
    const durationMs = Date.now() - t0;

    // Prefer convenience accessor if present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyResp: any = response as any;
    const outputText: string =
      anyResp.output_text ??
      // Fallback parse of tool output structure
      (Array.isArray(anyResp.output) &&
      anyResp.output[0] &&
      anyResp.output[0].content &&
      anyResp.output[0].content[0] &&
      anyResp.output[0].content[0].text
        ? anyResp.output[0].content[0].text
        : "");

    return NextResponse.json({
      output: outputText ?? "",
      usage: response.usage,
      durationMs,
      maxOutputTokens: max_output_tokens
    });
  } catch (error: unknown) {
    console.error("/api/respond error", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}


