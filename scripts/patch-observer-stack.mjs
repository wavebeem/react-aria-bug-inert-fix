// Patches EVERY installed copy of react-aria's `ariaHideOutside` so its module-level
// `observerStack` array is backed by a single global (globalThis). When react-aria is
// loaded more than once, each copy otherwise keeps its own `observerStack`, so a modal
// registered by copy A and a popover opened by copy B never coordinate and the popover
// gets stuck `inert`. Sharing the stack across copies fixes the nesting coordination.
//
// This mirrors what an upstream fix could do (store the stack somewhere shared instead
// of in module scope). It's applied via `postinstall` so it survives `npm install`.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const GLOBAL =
  "(globalThis.__reactAriaSharedObserverStack || (globalThis.__reactAriaSharedObserverStack = []))";

const files = execSync(
  "find node_modules -path '*react-aria/dist/private/overlays/ariaHideOutside.*' ! -name '*.map'",
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

let patched = 0;
for (const file of files) {
  let src = readFileSync(file, "utf8");
  if (src.includes("__reactAriaSharedObserverStack")) continue;

  // Replace the module-scope initializer `<var>observerStack = []` (declaration only;
  // all other references are mutations like .push/.pop/.splice, which now hit the shared array).
  const re = /([A-Za-z0-9_$]*observerStack)\s*=\s*\[\]/;
  if (!re.test(src)) continue;

  src = src.replace(re, `$1 = ${GLOBAL}`);
  writeFileSync(file, src);
  patched++;
  console.log("[patch-observer-stack] patched", file);
}

console.log(`[patch-observer-stack] patched ${patched} file(s)`);
