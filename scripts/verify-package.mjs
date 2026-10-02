// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const corepack = process.platform === "win32" ? "corepack.cmd" : "corepack";
const expectedPackageFiles = [
  "dist/components/Button.d.ts",
  "dist/components/Divider.d.ts",
  "dist/components/Input.d.ts",
  "dist/components/Skeleton.d.ts",
  "dist/index.d.ts",
  "dist/index.js",
  "dist/styles.css",
  "LICENSE",
  "NOTICE",
  "package.json",
  "README.md",
];
const expectedArchiveFiles = expectedPackageFiles.map((path) => `package/${path}`);
const expectedDevDependencies = {
  "@types/node": "24.13.3",
  "@types/react": "19.2.18",
  "@types/react-dom": "19.2.7",
  "@typescript/native": "npm:typescript@7.0.2",
  react: "19.2.8",
  "react-dom": "19.2.8",
  typescript: "npm:@typescript/typescript6@6.0.2",
  vite: "8.2.2",
  "vite-plugin-dts": "5.1.0",
  vitest: "4.1.10",
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with exit code ${result.status}\n${result.stdout}\n${result.stderr}`,
    );
  }

  return result.stdout;
}

function gitStatus() {
  return run("git", ["status", "--porcelain=v1", "--untracked-files=all"]);
}

function assertNoNpmrc(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".npmrc") {
      throw new Error(`Unexpected .npmrc at ${relative(root, join(directory, entry.name))}`);
    }

    if (
      entry.isDirectory() &&
      ![".git", "dist", "node_modules"].includes(entry.name)
    ) {
      assertNoNpmrc(join(directory, entry.name));
    }
  }
}

function assertManifest(manifest) {
  assert.equal(manifest.name, "@zircon-labs/primitives");
  assert.equal(manifest.version, "0.0.0");
  assert.equal(manifest.private, true);
  assert.equal(manifest.type, "module");
  assert.equal(manifest.license, "Apache-2.0");
  assert.equal(manifest.main, "./dist/index.js");
  assert.equal(manifest.types, "./dist/index.d.ts");
  assert.deepEqual(manifest.files, ["dist", "README.md", "LICENSE", "NOTICE"]);
  assert.deepEqual(manifest.exports, {
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    },
    "./styles.css": "./dist/styles.css",
  });
  assert.deepEqual(manifest.sideEffects, ["**/*.css"]);
  assert.equal(manifest.packageManager, "pnpm@10.33.0");
  assert.equal("engines" in manifest, false);
  assert.equal("publishConfig" in manifest, false);

  for (const field of ["dependencies", "optionalDependencies"]) {
    assert.equal(field in manifest, false, `${field} must be absent`);
  }

  assert.deepEqual(manifest.peerDependencies, { react: "^19.0.0" });

  assert.deepEqual(manifest.devDependencies, expectedDevDependencies);

  for (const [name, specifier] of Object.entries(manifest.devDependencies)) {
    assert.equal(isAbsolute(specifier), false, `${name} uses an absolute path`);
    assert.equal(/^[A-Za-z]:[\\/]/.test(specifier), false, `${name} uses an absolute path`);
    assert.equal(
      /^(?:file|link|workspace|git|git\+|github|https?):/i.test(specifier),
      false,
      `${name} uses a disallowed source`,
    );
  }

  for (const name of Object.keys(manifest.scripts)) {
    assert.equal(
      /^(?:pre|post)?(?:publish|release|version)/i.test(name),
      false,
      `Disallowed lifecycle script: ${name}`,
    );
  }
}

const initialStatus = gitStatus();
const temporaryRoot = mkdtempSync(join(tmpdir(), "zircon-primitives-"));
let verificationError;

try {
  const userConfig = join(temporaryRoot, "npmrc");
  writeFileSync(userConfig, "", "utf8");

  const isolatedEnv = { ...process.env };
  for (const name of [
    "NPM_TOKEN",
    "NODE_AUTH_TOKEN",
    "npm_token",
    "node_auth_token",
  ]) {
    delete isolatedEnv[name];
  }
  isolatedEnv.NPM_CONFIG_USERCONFIG = userConfig;
  isolatedEnv.npm_config_userconfig = userConfig;

  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assertManifest(manifest);
  assertNoNpmrc(root);
  assert.equal(
    readFileSync(join(root, "NOTICE"), "utf8"),
    "Zircon Primitives\nCopyright 2026 Jorge Guillermo Valle\n",
  );

  const bundle = readFileSync(join(root, "dist", "index.js"), "utf8");
  assert.match(bundle, /from ["']react\/jsx-runtime["']/);
  assert.doesNotMatch(bundle, /@zircon-labs\/iu|react\.production|minified React error/i);
  const exportedNames = bundle.match(/export \{([^}]+)\}/)?.[1] ?? "";
  for (const name of ["Button", "Divider", "Input", "Skeleton"]) {
    assert.match(exportedNames, new RegExp(`\\b${name}\\b`), `Missing public export: ${name}`);
  }

  const stylesheet = readFileSync(join(root, "dist", "styles.css"), "utf8");
  for (const token of [
    "--zircon-divider-color-subtle",
    "--zircon-divider-color-neutral",
    "--zircon-divider-spacing-md",
    "--zircon-button-primary-background",
    "--zircon-button-danger-background",
    "--zircon-input-background",
    "--zircon-input-border",
    "--zircon-skeleton-background",
    "--zircon-skeleton-highlight",
    "--zircon-skeleton-radius",
  ]) {
    assert.ok(stylesheet.includes(token), `Missing public CSS token: ${token}`);
  }
  assert.doesNotMatch(stylesheet, /--iu-|@zircon-labs\/iu/);
  assert.match(stylesheet, /@media\s*\(forced-colors:\s*active\)/);
  assert.equal(
    (stylesheet.match(/outline:2px solid Highlight/gi) ?? []).length,
    2,
    "Button and Input must retain visible focus outlines in forced-colors mode",
  );
  const textInputTypeSelector =
    ":is(:not([type]),[type=text],[type=email],[type=password],[type=search],[type=tel],[type=url],[type=number])";
  assert.ok(
    stylesheet.includes(textInputTypeSelector),
    "Input field styles must use an explicit text-type inclusion selector",
  );
  const appearanceRule = stylesheet.match(/[^{}]*\{[^{}]*appearance:none[^{}]*\}/)?.[0] ?? "";
  assert.ok(appearanceRule.includes(":is(:not([type]),[type=text],[type=email],[type=password],[type=search],[type=tel],[type=url])"));
  assert.doesNotMatch(appearanceRule, /\[type=number\]/);
  for (const type of [
    "checkbox",
    "radio",
    "range",
    "file",
    "color",
    "date",
    "datetime-local",
    "month",
    "time",
    "week",
    "hidden",
    "button",
    "submit",
    "reset",
    "image",
  ]) {
    assert.doesNotMatch(
      stylesheet,
      new RegExp(`\\[type=${type}\\]`),
      `Text-field styles must not target input type ${type}`,
    );
  }

  const dryRun = JSON.parse(
    run(corepack, ["pnpm", "pack", "--dry-run", "--json"], { env: isolatedEnv }),
  );
  assert.equal(Array.isArray(dryRun), false);
  assert.equal(dryRun.name, manifest.name);
  assert.equal(dryRun.version, manifest.version);
  assert.ok(Array.isArray(dryRun.files));
  assert.deepEqual(
    dryRun.files.map(({ path }) => path).sort(),
    [...expectedPackageFiles].sort(),
  );

  const packOutput = run(
    corepack,
    ["pnpm", "pack", "--json", "--pack-destination", temporaryRoot],
    { env: isolatedEnv },
  );
  const packed = JSON.parse(packOutput);
  const tarball = isAbsolute(packed.filename)
    ? packed.filename
    : join(temporaryRoot, packed.filename);
  const archiveFiles = run("tar", ["-tzf", tarball], { env: isolatedEnv })
    .trim()
    .split("\n")
    .sort();
  assert.deepEqual(archiveFiles, [...expectedArchiveFiles].sort());

  const consumer = join(temporaryRoot, "consumer");
  const consumerManifest = {
    name: "package-consumer",
    version: "0.0.0",
    private: true,
    type: "module",
    packageManager: manifest.packageManager,
    dependencies: {
      "@zircon-labs/primitives": `file:${tarball}`,
      react: "19.2.8",
      "react-dom": "19.2.8",
    },
  };
  mkdirSync(consumer);
  writeFileSync(
    join(consumer, "package.json"),
    `${JSON.stringify(consumerManifest, null, 2)}\n`,
    "utf8",
  );
  run(corepack, ["pnpm", "install", "--ignore-scripts", "--registry=https://registry.npmjs.org/"], {
    cwd: consumer,
    env: isolatedEnv,
  });
  rmSync(join(consumer, "node_modules"), { recursive: true, force: true });
  run(corepack, ["pnpm", "install", "--offline", "--frozen-lockfile", "--ignore-scripts"], {
    cwd: consumer,
    env: isolatedEnv,
  });
  const consumerCheck = `
    import { readFileSync } from "node:fs";
    import { fileURLToPath } from "node:url";
    import { createElement } from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { Button, Divider, Input, Skeleton } from "@zircon-labs/primitives";

    const button = renderToStaticMarkup(createElement(Button, { variant: "danger" }, "Remove"));
    const divider = renderToStaticMarkup(createElement(Divider, { label: "Section" }));
    const input = renderToStaticMarkup(createElement(Input, { hint: "At least one", label: "Quantity", type: "number" }));
    const skeleton = renderToStaticMarkup(createElement(Skeleton, { animated: false }));
    if (!button.includes('type="button"') || !button.includes("Remove")) process.exit(1);
    if (!divider.includes("Section") || !input.includes('type="number"')) process.exit(1);
    if (!input.includes('aria-describedby=') || !skeleton.includes('aria-hidden="true"')) process.exit(1);

    const stylesUrl = import.meta.resolve("@zircon-labs/primitives/styles.css");
    const styles = readFileSync(fileURLToPath(stylesUrl), "utf8");
    if (!styles.includes("--zircon-divider-color-subtle")) process.exit(1);
  `;
  run(process.execPath, ["--input-type=module", "--eval", consumerCheck], {
    cwd: consumer,
    env: isolatedEnv,
  });
} catch (error) {
  verificationError = error;
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

const finalStatus = gitStatus();
if (finalStatus !== initialStatus) {
  const statusError = new Error(
    `Package verification changed the working tree:\nBefore:\n${initialStatus}\nAfter:\n${finalStatus}`,
  );
  verificationError = verificationError
    ? new AggregateError([verificationError, statusError])
    : statusError;
}

if (verificationError) {
  throw verificationError;
}

console.log("Package verification passed.");
