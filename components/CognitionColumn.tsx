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
          value={typeof prompt === "string" ? prompt.replaceAll("\\n", "\n") : prompt}
          onChange={(e) => onChangePrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isProcessing) {
              e.preventDefault();
              onRun();
            }
          }}
          className="w-full h-40 md:h-[50vh] rounded border p-3 resize-vertical dark:bg-gray-900 dark:border-gray-700"
          placeholder="Enter your prompt..."
        />
      </div>

      <div className="column-sticky-footer p-3 rounded-t-md">
        <div className="flex items-start gap-3">
          {/* Column: selector + full-width blurb below */}
          <div className="flex flex-col min-w-0 flex-none">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">Model</label>
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
          </div>

          {/* Column: in/out pricing */}
          <div className="flex flex-1 flex-col leading-tight min-w-0">
            <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              {price?.input != null || price?.output != null
                ? `↑ ${price?.input != null ? `$${price.input}` : "—"} | ↓ ${
                    price?.output != null ? `$${price.output}` : "—"
                  }`
                : "↑ — | ↓ —"}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">per 1M tokens</span>
          </div>

          <button
            disabled={isProcessing}
            onClick={onRun}
            className={`rounded px-4 py-2 flex items-center justify-center gap-1.5 min-w-[80px] ${
              isProcessing ? "bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200" : "bg-green-600 text-white"
            }`}
            title="Click or press ⌘+Enter (Ctrl+Enter on Windows) to run"
          >
            {isProcessing ? (
              <div
                className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent dark:border-gray-400 dark:border-t-transparent"
                aria-label="Loading"
              />
            ) : (
              <>
                <span>Run</span>
                <span className="text-[10px] opacity-70">⌘↵</span>
              </>
            )}
          </button>
        </div>
        {/* Full-width model description below selector row */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {modelHints[model]?.hint}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={useWeb}
              onChange={(e) => onChangeUseWeb(e.target.checked)}
              disabled={model === "gpt-4.1-nano"}
            />
            Use web search (Responses API)
          </label>
          {model === "gpt-4.1-nano" && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
              (not available for gpt-4.1-nano)
            </span>
          )}
        </div>
      </div>
    </section>
  );
}


