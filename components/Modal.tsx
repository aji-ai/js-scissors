"use client";
import { useEffect } from "react";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onPrimary?: () => void;
  primaryText?: string;
  secondaryText?: string;
  children: React.ReactNode;
}

export function Modal({
  title,
  open,
  onClose,
  onPrimary,
  primaryText = "OK",
  secondaryText = "Cancel",
  children
}: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-lg">
        <div className="border-b px-4 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button className="rounded border px-3 py-2" onClick={onClose}>
            {secondaryText}
          </button>
          {onPrimary && (
            <button
              className="rounded bg-blue-600 text-white px-3 py-2"
              onClick={onPrimary}
            >
              {primaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


