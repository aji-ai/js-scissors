"use client";
import React from "react";

export function GlobalScenarioBar() {
  return (
    <div className="global-bottom-bar p-3">
      <div className="mx-auto w-full max-w-screen-2xl 2xl:max-w-[1800px] flex items-center justify-start">
        <a
          href="https://design.co"
          className="text-xs text-gray-500 dark:text-gray-400 hover:underline underline-offset-2"
        >
          Designed by John Maeda
        </a>
      </div>
    </div>
  );
}


