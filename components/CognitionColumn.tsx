interface CognitionColumnProps {
  prompt: string;
  onChangePrompt: (value: string) => void;
  model: string;
  onChangeModel: (value: string) => void;
  availableModels: string[];
  modelHints: Record<string, { label: string; hint: string }>;
  modelPricing?: Record<string, { input?: number; output?: number }>;
  useWeb: boolean;
  onChangeUseWeb: (value: boolean) => void;
  onRun: () => void;
  isProcessing: boolean;
}

export function CognitionColumn({
  prompt,
  onChangePrompt,
  model,
  onChangeModel,
  availableModels,
  modelHints,
  modelPricing,
  useWeb,
  onChangeUseWeb,
  onRun,
  isProcessing
}: CognitionColumnProps) {
  const price = modelPricing?.[model];
  return (
    <section className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-2">
        <span className="text-5xl align-middle mr-1">✃</span> Cognition
      </h2>
      <div className="flex-1">
        <textarea
          value={prompt}
          onChange={(e) => onChangePrompt(e.target.value)}
          className="w-full h-[50vh] rounded border p-3 resize-vertical dark:bg-gray-900 dark:border-gray-700"
          placeholder="Enter your prompt..."
        />
      </div>

      <div className="column-sticky-footer p-3 rounded-t-md">
        <div className="flex items-start gap-4">
          {/* Column: selector + full-width blurb below */}
          <div className="flex flex-col min-w-[260px] flex-1">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700">Model</label>
              <select
                className="rounded border px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                value={model}
                onChange={(e) => onChangeModel(e.target.value)}
              >
                {availableModels.map((m) => {
                  const info = modelHints[m];
                  return (
                    <option key={m} value={m}>
                      {info?.label ?? m}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {modelHints[model]?.hint}
            </div>
          </div>

          {/* Column: in/out pricing */}
          <div className="hidden lg:flex flex-col leading-tight">
            <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              {price?.input != null || price?.output != null
                ? `↑ ${price?.input != null ? `$${price.input}` : "—"} | ↓ ${
                    price?.output != null ? `$${price.output}` : "—"
                  }`
                : "↑ — | ↓ —"}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">per 1M tokens</span>
          </div>

          <div className="flex-1" />
          <button
            disabled={isProcessing}
            onClick={onRun}
            className={`rounded px-4 py-2 ${
              isProcessing ? "bg-gray-300 text-gray-700" : "bg-green-600 text-white"
            }`}
          >
            {isProcessing ? "Running..." : "Run"}
          </button>
          {isProcessing && (
            <div
              className="ml-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"
              aria-label="Loading"
            />
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={useWeb}
              onChange={(e) => onChangeUseWeb(e.target.checked)}
            />
            Use web search (Responses API)
          </label>
        </div>
      </div>
    </section>
  );
}


