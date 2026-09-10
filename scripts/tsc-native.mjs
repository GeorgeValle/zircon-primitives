// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const manifestPath = require.resolve("@typescript/native/package.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

if (manifest.version !== "7.0.2") {
  throw new Error(
    `Expected @typescript/native 7.0.2, resolved ${manifest.version ?? "unknown"}`,
  );
}

const tscBin = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.tsc;

if (typeof tscBin !== "string") {
  throw new Error("@typescript/native does not declare a tsc binary");
}

const result = spawnSync(
  process.execPath,
  [resolve(dirname(manifestPath), tscBin), ...process.argv.slice(2)],
  { stdio: "inherit" },
);

if (result.error) {
  throw result.error;
}

if (result.signal) {
  process.kill(process.pid, result.signal);
}

process.exit(result.status ?? 1);
