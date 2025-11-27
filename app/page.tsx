"use client";
import { AppStateProvider, useAppState } from "@/components/AppState";
import { ContextColumn } from "@/components/ContextColumn";
import { CognitionColumn } from "@/components/CognitionColumn";
import { PredictionColumn } from "@/components/PredictionColumn";
import { GlobalScenarioBar } from "@/components/GlobalScenarioBar";
import { SCENARIOS } from "@/lib/scenarios";
import { ThemeToggle } from "@/components/ThemeToggle";

function AppColumns() {
  const s = useAppState();
  return (
    <>
      <header className="mx-auto w-full max-w-screen-2xl 2xl:max-w-[1800px] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Context × Cognition → Prediction</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Embeddings Model × Completion Model → Inference Output
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-2xl 2xl:max-w-[1800px] p-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <ContextColumn
              chunks={s.chunks}
              selectedChunkIds={s.selectedChunkIds}
              highlightedChunkIds={s.highlightedChunkIds}
              onToggleChunk={s.toggleChunk}
              onToggleAll={s.toggleAll}
              onSearch={s.search}
              onChangeTolerance={s.applyTolerance}
              onAddChunk={s.addChunk}
              initialSearchPhrase={s.searchPhrase}
              initialMinSimilarity={s.minSimilarity}
              statusText={
                s.searchStatus === "no_results"
                  ? "No embeddings matched. Try lowering tolerance or a different phrase."
                  : s.searchStatus === "error"
                  ? s.searchError
                  : undefined
              }
              isSearching={s.isSearching}
              scoreByChunkId={s.similarityByChunk}
              embeddingModel={s.embeddingModel}
              availableEmbeddingModels={s.availableEmbeddingModels}
              embeddingPricing={s.embeddingPricing}
              onChangeEmbeddingModel={s.setEmbeddingModel}
              embeddingHints={s.embeddingHints}
            />
          </div>
          <div className="md:col-span-1">
            <CognitionColumn
              prompt={s.prompt}
              onChangePrompt={s.setPrompt}
              model={s.modelId}
              onChangeModel={s.setModelId}
              availableModels={s.availableModels}
              modelHints={s.modelHints}
              modelPricing={s.modelPricing}
              onRun={s.run}
              isProcessing={s.isProcessing}
            />
          </div>
          <div className="md:col-span-1">
            <PredictionColumn
              output={s.output}
              mode={s.viewerMode}
              onChangeMode={s.setViewerMode}
              metrics={s.metrics}
              modelId={s.modelId}
              modelPricing={s.modelPricing}
            />
          </div>
        </div>
      </main>

      <GlobalScenarioBar
        scenarioId={s.scenarioId}
        scenarios={SCENARIOS.map((x) => ({ id: x.id, name: x.name }))}
        onChangeScenario={s.setScenarioId}
      />
    </>
  );
}

export default function HomePage() {
  return (
    <AppStateProvider>
      <AppColumns />
    </AppStateProvider>
  );
}


