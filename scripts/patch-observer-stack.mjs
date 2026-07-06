// Patches EVERY installed copy of react-aria's `ariaHideOutside` so its module-level
// `observerStack` array is backed by a single global (globalThis). When react-aria is
// loaded more than once, each copy otherwise keeps its own `observerStack`, so a modal
// registered by copy A and a popover opened by copy B never coordinate and the popover
// gets stuck `inert`. Sharing the stack across copies fixes the nesting coordination.
//
// Pure Node.js (no `find`, no shell) so it also runs in restricted environments like
// StackBlitz WebContainers. Applied via postinstall / predev / prebuild.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const GLOBAL =
  "(globalThis.__reactAriaSharedObserverStack || (globalThis.__reactAriaSharedObserverStack = []))";

const TARGETS = new Set([
  "ariaHideOutside.js",
  "ariaHideOutside.mjs",
  "ariaHideOutside.cjs",
]);
const PATH_MARKER = ["react-aria", "dist", "private", "overlays"].join("/");

function collect(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // unreadable dir, skip
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collect(full, out);
    } else if (TARGETS.has(entry.name) && full.replace(/\\/g, "/").includes(PATH_MARKER)) {
      out.push(full);
    }
  }
}

const files = [];
collect("node_modules", files);

let patched = 0;
for (const file of files) {
  let src = readFileSync(file, "utf8");
  if (src.includes("__reactAriaSharedObserverStack")) continue;

  // Replace the module-scope initializer `<var>observerStack = []` (declaration only;
  // every other reference is a mutation like .push/.pop/.splice on the same array).
  const re = /([A-Za-z0-9_$]*observerStack)\s*=\s*\[\]/;
  if (!re.test(src)) continue;

  src = src.replace(re, `$1 = ${GLOBAL}`);
  writeFileSync(file, src);
  patched++;
  console.log("[patch-observer-stack] patched", file);
}

console.log(`[patch-observer-stack] patched ${patched} file(s)`);
