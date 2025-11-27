import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  // Soft warning to help during dev; routes will still 500 meaningfully.
  console.warn("[openai] OPENAI_API_KEY not set. API routes will fail until configured.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


