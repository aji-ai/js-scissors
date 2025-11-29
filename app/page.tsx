"use client";
import { AppStateProvider, useAppState } from "@/components/AppState";
import { ContextColumn } from "@/components/ContextColumn";
import { CognitionColumn } from "@/components/CognitionColumn";
import { PredictionColumn } from "@/components/PredictionColumn";
import { GlobalScenarioBar } from "@/components/GlobalScenarioBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Modal } from "@/components/Modal";
import { useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";

function AppColumns() {
  const s = useAppState();
  const [aboutOpen, setAboutOpen] = useState(false);
  return (
    <>
      <header className="mx-auto w-full max-w-screen-2xl 2xl:max-w-[2200px] p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="max-[960px]:w-full">
            <h1 className="font-semibold xl:text-3xl lg:text-2xl md:text-xl max-[960px]:text-lg">
              <button
                type="button"
                onClick={() => setAboutOpen(true)}
                className="hover:underline underline-offset-4 decoration-dotted"
                title="Click to view app image"
              >
                Context × Cognition → Prediction
              </button>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 xl:text-base lg:text-sm md:text-sm max-[960px]:text-xs hidden sm:block">
              Embeddings Model × Completion Model → Inference Output
            </p>
            <div className="mt-2 max-[960px]:w-full">
              <HeaderControls showScenario={true} showKeyButton={false} />
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <HeaderControls showScenario={false} showKeyButton={true} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-2xl 2xl:max-w-[2200px] p-4 pb-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <div className="lg:col-span-1 xl:col-span-1">
            <ContextColumn
              chunks={s.chunks}
              selectedChunkIds={s.selectedChunkIds}
              highlightedChunkIds={s.highlightedChunkIds}
              onToggleChunk={s.toggleChunk}
              onToggleAll={s.toggleAll}
              onSearch={s.search}
              onChangeTolerance={s.applyTolerance}
              onAddChunk={s.addChunk}
              onUpdateChunk={s.updateChunk}
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
          <div className="lg:col-span-1 xl:col-span-1">
            <CognitionColumn
              prompt={s.prompt}
              onChangePrompt={s.setPrompt}
              model={s.modelId}
              onChangeModel={s.setModelId}
              availableModels={s.availableModels}
              modelHints={s.modelHints}
              modelPricing={s.modelPricing}
              useWeb={s.useWeb}
              onChangeUseWeb={s.setUseWeb}
              onRun={s.run}
              isProcessing={s.isProcessing}
            />
          </div>
          <div className="lg:col-span-2 xl:col-span-1">
            <PredictionColumn
              output={s.output}
              mode={s.viewerMode}
              onChangeMode={s.setViewerMode}
              metrics={s.metrics}
              modelId={s.modelId}
              modelPricing={s.modelPricing}
              onAddToContext={s.addChatFromPrediction}
            />
          </div>
        </div>
      </main>

      <GlobalScenarioBar />
      <Modal
        title="“Human rational behavior is shaped by a scissors whose blades are the structure of task environments and the computational capabilities of the actor.” — Herbert Simon"
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        maxWidthClass="max-w-none"
        secondaryText="Close"
      >
        <div className="flex items-center justify-center">
          <img
            src="/about.png"
            alt="About this application"
            className="rounded w-auto h-auto max-w-[calc(100vw-4rem)] max-h-[calc(100vh-4rem)] object-contain"
          />
        </div>
      </Modal>
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


