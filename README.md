## Context • Cognition • Prediction (Next.js + OpenAI Responses API)

A three-column demo showing how embeddings (for context selection) and the OpenAI Responses API (for completions) cooperate:

- Context: Select which chunks to include (search via embeddings + tolerance).
- Cognition: Provide a prompt and pick a model; non-streaming with a spinner.
- Prediction: View the raw output as text, markdown, or sanitized HTML.

### Prerequisites
- Node 18+
- An OpenAI API key

### Setup
1) Install deps:

```bash
npm install
```

2) Create `.env.local` in the project root:

```bash
OPENAI_API_KEY=sk-...your key...
```

3) Run dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

### How it works
- Scenario packs live in `data/scenarios/*.json`. Switching the scenario pre-populates the context chunks and a sample prompt.
- The Context column’s search calls `/api/embeddings/search`:
  - Uses `text-embedding-3-small` to embed the search phrase.
  - Compares against cached per-chunk embeddings (computed on first search per scenario).
  - Auto-selects chunks above the tolerance.
- The Cognition column’s Run calls `/api/respond`:
  - Assembles the selected context + prompt into a single `input` string.
  - Calls `openai.responses.create({ model, input })`.
  - Non-streaming; a spinner shows while waiting.
- The Prediction column displays results:
  - Text, Markdown (via `react-markdown`), or HTML (via `dompurify` to sanitize).

### Key files
- `app/api/embeddings/search/route.ts` – embeddings search endpoint.
- `app/api/respond/route.ts` – OpenAI Responses API caller.
- `components/ContextColumn.tsx` – cards grid, search, tolerance slider, Select All.
- `components/CognitionColumn.tsx` – prompt, model picker, run button + spinner.
- `components/PredictionColumn.tsx` – output viewer (text/md/html).
- `components/GlobalScenarioBar.tsx` – bottom bar to switch scenarios.
- `components/AppState.tsx` – global client-side state and wiring.
- `lib/embeddings.ts` – embeddings + cosine similarity + caching.
- `lib/openai.ts` – OpenAI client (reads `OPENAI_API_KEY`).
- `lib/scenarios.ts` – loads scenario JSONs and exposes helpers.

### Notes
- Keep your `OPENAI_API_KEY` server-side only. This app calls OpenAI from Next.js route handlers.
- To add a new scenario, place a JSON file in `data/scenarios/` and register it via `lib/scenarios.ts`.


