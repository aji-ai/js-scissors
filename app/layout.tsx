import "../styles/globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Context × Cognition → Prediction",
  description: "Embeddings Model × Completion Model → Inference Output",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>✂️</text></svg>",
        type: "image/svg+xml"
      }
    ]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var dark = stored ? stored === 'dark' : prefers;
                  if (dark) { document.documentElement.classList.add('dark'); }
                  else { document.documentElement.classList.remove('dark'); }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}


