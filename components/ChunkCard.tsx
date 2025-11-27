import { ScenarioChunk } from "@/lib/types";

interface ChunkCardProps {
  chunk: ScenarioChunk;
  checked: boolean;
  onChange: (checked: boolean) => void;
  highlight?: boolean;
  score?: number;
}

export function ChunkCard({ chunk, checked, onChange, highlight, score }: ChunkCardProps) {
  return (
    <div className="relative">
      {typeof score === "number" && (
        <div
          className="absolute right-2 top-2 rounded bg-gray-900 text-white text-xs px-2 py-0.5 dark:bg-gray-700"
          title="Dot product score"
        >
          {score.toFixed(2)}
        </div>
      )}
      <label
        className={`flex flex-col rounded-md border p-3 cursor-pointer gap-2 transition overflow-hidden
        ${checked ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/40" : "border-gray-200 dark:border-gray-700"}
        ${highlight ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-white dark:bg-gray-800"}
      `}
      >
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <div className="min-w-0">
            <div className="font-medium">{chunk.title}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words break-all max-w-full overflow-hidden">
              {chunk.body}
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}


