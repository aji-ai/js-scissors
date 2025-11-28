import { ScenarioChunk } from "@/lib/types";

interface ChunkCardProps {
  chunk: ScenarioChunk;
  checked: boolean;
  onChange: (checked: boolean) => void;
  highlight?: boolean;
  score?: number;
  onEdit?: (chunk: ScenarioChunk) => void;
}

export function ChunkCard({ chunk, checked, onChange, highlight, score, onEdit }: ChunkCardProps) {
  return (
    <div>
      <label
        className={`relative flex flex-col rounded-md border p-3 pr-7 pb-6 cursor-pointer gap-2 transition overflow-hidden
        ${checked ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/40" : "border-gray-200 dark:border-gray-700"}
        ${highlight ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-white dark:bg-gray-800"}
      `}
      >
        {typeof score === "number" && (
          <div
            className="absolute right-2 top-2 rounded bg-gray-900 text-white text-xs px-2 py-0.5 dark:bg-gray-700"
            title="Dot product score"
          >
            {score.toFixed(2)}
          </div>
        )}
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
        {onEdit && (
          <button
            type="button"
            title="Edit"
            aria-label="Edit chunk"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(chunk);
            }}
            className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-gray-600 bg-transparent"
          >
            {/* Bootstrap pencil-square icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="h-4 w-4 fill-current">
              <path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1.793 1.793-2.121-2.121L13.38.525a1.5 1.5 0 0 1 2.122 0z"/>
              <path d="M11.439 2.439 2 11.879V14h2.121l9.439-9.439-2.121-2.121z"/>
            </svg>
          </button>
        )}
      </label>
    </div>
  );
}


