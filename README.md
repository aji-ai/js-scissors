## Context • Cognition • Prediction

A tiny Next.js app that teaches three patterns, end‑to‑end:
- Context: pick relevant chunks with an embeddings search.
- Cognition: write a prompt, choose a model, then run.
- Prediction: view output as Text, Markdown, or sanitized HTML.

The UI is intentionally simple and responsive so you can copy the patterns.

### Quick start (2 minutes)
- Requirements: Node 18+, an OpenAI API key.
1) Install
```bash
npm install
```
2) Create `.env.local`
```bash
OPENAI_API_KEY=sk-...your key...
```
3) Run
```bash
npm run dev
```
Open http://localhost:3000

### How to use the app
1) Choose a Scenario (top-left). This loads example context cards and a starter prompt.
2) In Context:
   - Search with embeddings and adjust Match to auto‑select similar cards.
   - Add/Edit cards as needed.
3) In Cognition:
   - Edit the prompt and pick a model (shows per‑million pricing).
   - Press Run (non‑streaming; a small spinner shows while waiting).
4) In Prediction:
   - Switch viewer: Text, Markdown, or HTML (sanitized).
   - Optionally compact and “Add to Context”.

### What to learn from the code
- Embeddings search flow (server route) used to select relevant context.
- Simple Responses API call (server route) for completions.
- Responsive 3‑column layout:
  - Sticky footers only on larger screens; regular flow on mobile.
  - Mobile textarea height tuned for usability.
  - Token pricing block grows to fill unused space across breakpoints.
  - Consistent label contrast in light/dark mode.
- Clean state wiring in a single `AppState` provider.

### Minimal file map
- `app/api/embeddings/search/route.ts` – embeddings search.
- `app/api/respond/route.ts` – Responses API call.
- `components/ContextColumn.tsx` – cards, search, tolerance, add/edit.
- `components/CognitionColumn.tsx` – prompt, model picker, run + spinner.
- `components/PredictionColumn.tsx` – output viewer (text/md/html).
- `components/GlobalScenarioBar.tsx` – footer with link to design.co.
- `lib/*` – OpenAI client, embeddings math/cache, scenarios loader.
- `data/scenarios/*.json` – example scenarios.

### Notes
- Your API key stays server‑side (Next.js Route Handlers).
- Add scenarios by dropping JSON files into `data/scenarios/` and registering via `lib/scenarios.ts`.

Happy learning and remixing. Designed by John Maeda (footer links to https://design.co).