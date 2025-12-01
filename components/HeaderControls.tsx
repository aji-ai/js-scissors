"use client";
import { Fragment, useEffect, useState } from "react";
import { useAppState } from "@/components/AppState";
import { SCENARIOS } from "@/lib/scenarios";
import { Modal } from "@/components/Modal";

type HeaderControlsProps = {
  showScenario?: boolean;
  showKeyButton?: boolean;
};

export function HeaderControls({ showScenario = true, showKeyButton = true }: HeaderControlsProps) {
  const s = useAppState();
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [hasEnvKey, setHasEnvKey] = useState<boolean | null>(null);
  const [localKey, setLocalKey] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load existing local key (if any)
    try {
      const k = localStorage.getItem("openai_api_key") || "";
      setLocalKey(k);
    } catch {}
  }, []);

  async function fetchEnvStatus() {
    try {
      const res = await fetch("/api/openai/config", { method: "GET" });
      const data: { hasEnvKey: boolean } = await res.json();
      setHasEnvKey(!!data.hasEnvKey);
    } catch {
      setHasEnvKey(null);
    }
  }

  async function onTest() {
    try {
      setTesting(true);
      setStatus("idle");
      setMessage("");
      const headers: HeadersInit = {};
      if (localKey && hasEnvKey === false) {
        headers["x-openai-key"] = localKey;
      }
      const res = await fetch("/api/openai/test", { method: "GET", headers });
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

  function openModal() {
    setModalOpen(true);
    fetchEnvStatus();
    setStatus("idle");
    setMessage("");
  }

  function saveLocalKey() {
    setSaving(true);
    try {
      localStorage.setItem("openai_api_key", (localKey || "").trim());
    } catch {}
    setTimeout(() => setSaving(false), 150);
  }

  return (
    <div className="contents">
      {showScenario && (
        <div className="flex items-center gap-3 max-[960px]:w-full">
          <span className="text-sm text-gray-700 dark:text-gray-200">Scenario</span>
          <select
            className="rounded border px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 max-[960px]:flex-1 max-[960px]:w-auto"
            value={s.scenarioId}
            onChange={(e) => s.setScenarioId(e.target.value)}
          >
            <option key="__divider_foundations__" value="__divider_foundations__" disabled>
              ───────── Foundations ─────────
            </option>
            {SCENARIOS.map((sc, idx) => {
              const option = (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              );
              // Add Domains divider after agent-playground (index 2)
              if (sc.id === "agent-playground") {
                return (
                  <Fragment key={`grp-${sc.id}`}>
                    {option}
                    <option key="__divider_domains__" value="__divider_domains__" disabled>
                      ───────── Domains ─────────
                    </option>
                  </Fragment>
                );
              }
              // Add Applications divider after healthcare-phr
              if (sc.id === "healthcare-phr") {
                return (
                  <Fragment key={`grp-${sc.id}`}>
                    {option}
                    <option key="__divider_applications__" value="__divider_applications__" disabled>
                      ───────── Applications ─────────
                    </option>
                  </Fragment>
                );
              }
              return option;
            })}
          </select>
        </div>
      )}
      {showKeyButton && (
        <button
          onClick={openModal}
          className="rounded border p-2 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          aria-label="Manage API Key"
          title="Manage API Key"
        >
          {/* Bootstrap Icons: key-fill */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="h-4 w-4 fill-current">
            <path d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2M2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
          </svg>
        </button>
      )}

      <Modal
        title="API Key"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        secondaryText="Close"
      >
        {hasEnvKey === null ? (
          <div className="text-sm text-gray-600 dark:text-gray-300">Checking configuration…</div>
        ) : hasEnvKey ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-700 dark:text-gray-200">
              OPENAI_API_KEY is configured via .env. You cannot edit it here.
            </div>
            <div className="flex items-center gap-2">
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
              {status !== "idle" && (
                <span className={`text-xs ${status === "ok" ? "text-green-700" : "text-red-700"}`}>
                  {message}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-gray-700 dark:text-gray-200">OpenAI API Key</span>
              <input
                type="password"
                className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                placeholder="sk-..."
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={saveLocalKey}
                disabled={saving}
                className="rounded bg-blue-600 text-white px-3 py-2"
              >
                {saving ? "Saving…" : "Save"}
              </button>
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
              {status !== "idle" && (
                <span className={`text-xs ${status === "ok" ? "text-green-700" : "text-red-700"}`}>
                  {message}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Your key is stored locally in this browser and sent only to this app for requests.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


