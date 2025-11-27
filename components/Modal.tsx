"use client";
import { useEffect, useState } from "react";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onPrimary?: () => void;
  primaryText?: string;
  secondaryText?: string;
  children: React.ReactNode;
  maxWidthClass?: string; // allows wide content (e.g., full-size images)
}

export function Modal({
  title,
  open,
  onClose,
  onPrimary,
  primaryText = "OK",
  secondaryText = "Cancel",
  children,
  maxWidthClass = "max-w-lg"
}: ModalProps) {
  // Basic enter/exit animation state
  const DURATION = 250;
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setRender(true);
      // Ensure we start from hidden state, then promote to visible
      setVisible(false);
      // Double-raf to guarantee initial paint with hidden styles before transition
      const id1 = requestAnimationFrame(() => {
        const id2 = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id2);
      });
      return () => cancelAnimationFrame(id1);
    } else {
      setVisible(false);
      const t = setTimeout(() => setRender(false), DURATION);
      return () => clearTimeout(t);
    }
  }, [open]);

  function closeWithAnimation() {
    setVisible(false);
    setTimeout(() => onClose(), DURATION);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeWithAnimation();
    }
    if (render) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [render]);

  if (!render) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeWithAnimation}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${maxWidthClass} rounded-lg bg-white dark:bg-gray-900 shadow-lg transform transition-all duration-200 ease-out ${
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1"
        }`}
      >
        <div className="border-b px-4 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button className="rounded border px-3 py-2" onClick={closeWithAnimation}>
            {secondaryText}
          </button>
          {onPrimary && (
            <button
              className="rounded bg-blue-600 text-white px-3 py-2"
              onClick={() => {
                onPrimary?.();
                closeWithAnimation();
              }}
            >
              {primaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


