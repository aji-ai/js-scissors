import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  // Soft warning to help during dev; routes will still 500 meaningfully.
  console.warn("[openai] OPENAI_API_KEY not set. API routes will fail until configured.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Returns an OpenAI client using an override key from request headers if provided,
 * otherwise falls back to the process environment key.
 *
 * Header: x-openai-key
 */
export function openaiFromRequest(request: Request): OpenAI {
  try {
    const headerKey = request.headers.get("x-openai-key");
    if (headerKey && headerKey.trim().length > 0) {
      return new OpenAI({ apiKey: headerKey.trim() });
    }
  } catch {}
  return openai;
}

