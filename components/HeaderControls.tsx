"use client";
import { Fragment, useState } from "react";
import { useAppState } from "@/components/AppState";
import { SCENARIOS } from "@/lib/scenarios";

export function HeaderControls() {
  const s = useAppState();
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function onTest() {
    try {
      setTesting(true);
      setStatus("idle");
      setMessage("");
      const res = await fetch("/api/openai/test", { method: "GET" });
      const data: { ok: boolean; message?: string } = await res.json();
      if (res.ok && data.ok) {
        setStatus("ok");
        setMessage("API key works.");
      } else {
        setStatus("error");
        setMessage(data.message || "API key test failed.");
      }
    } catch {
      setStatus("error");
      setMessage("API key test failed.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 dark:text-gray-200">Scenario</span>
        <select
          className="rounded border px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          value={s.scenarioId}
          onChange={(e) => s.setScenarioId(e.target.value)}
        >
          <option key="__divider_domains__" value="__divider_domains__" disabled>
            ───────── Domains ─────────
          </option>
          {SCENARIOS.map((sc) => {
            const option = (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            );
            if (sc.id === "healthcare-phr") {
              return (
                <Fragment key={`grp-${sc.id}`}>
                  {option}
                  <option key="__divider__" value="__divider__" disabled>
                    ───────── Applications ─────────
                  </option>
                </Fragment>
              );
            }
            return option;
          })}
        </select>
      </div>
      <div className="flex items-center gap-2">
        {status !== "idle" && (
          <span
            className={`text-xs ${
              status === "ok" ? "text-green-700" : "text-red-700"
            }`}
          >
            {message}
          </span>
        )}
        <button
          onClick={onTest}
          disabled={testing}
          className={`rounded px-3 py-2 border ${
            testing
              ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
              : "bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          }`}
        >
          {testing ? "Testing..." : "Test API Key"}
        </button>
      </div>
    </div>
  );
}


