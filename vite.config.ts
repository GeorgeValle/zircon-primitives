// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      exclude: ["src/internal/**"],
      include: ["src"],
    }),
    {
      name: "drawer-client-boundary",
      renderChunk(code, chunk) {
        if (chunk.isEntry && chunk.name === "drawer" && !code.startsWith('"use client";')) {
          return { code: `"use client";\n${code}`, map: null };
        }
      },
      generateBundle(_options, bundle) {
        const chunks = Object.values(bundle).filter((entry) => entry.type === "chunk");
        if (chunks.map((chunk) => chunk.fileName).sort().join(",") !== "drawer.js,index.js") {
          this.error("Expected only index.js and drawer.js; shared chunks require review");
        }
        const root = chunks.find((chunk) => chunk.fileName === "index.js");
        const drawer = chunks.find((chunk) => chunk.fileName === "drawer.js");
        if (!root || !drawer || !root.isEntry || !drawer.isEntry) {
          this.error("Missing library entry chunk");
        }
        for (const id of Object.keys(root.modules)) {
          if (/\/(?:drawer\.ts|components\/Drawer\.|internal\/composeRefs\.)/.test(id.replaceAll("\\", "/"))) {
            this.error(`Drawer module leaked into the root entry: ${id}`);
          }
        }
        for (const chunk of chunks) {
          if (chunk.dynamicImports.length || chunk.imports.some((id) => id !== "react" && !id.startsWith("react/"))) {
            this.error(`Unexpected dependency in ${chunk.fileName}`);
          }
        }
        if (!drawer.code.startsWith('"use client";') || root.code.includes('"use client"')) {
          this.error("Incorrect published client boundary");
        }
      },
    },
  ],
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
        drawer: fileURLToPath(new URL("./src/drawer.ts", import.meta.url)),
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: "styles",
    },
    rollupOptions: {
      external: [/^react(?:\/.*)?$/],
    },
    sourcemap: false,
    cssCodeSplit: false,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
