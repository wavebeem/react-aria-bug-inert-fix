# Fix demo: sharing `observerStack` across react-aria copies

Companion to the reproduction for https://github.com/adobe/react-spectrum/issues/8784

This is the **same** Select-in-Modal setup as the repro (two `react-aria` copies:
`react-aria@3.50.0` for the modal, `react-aria-components@1.17.0` → `react-aria@3.48.0`
for the Select), **plus a patch** that makes both copies share one `observerStack`.

With the patch, the Select's options are interactive again (not `inert`) even though two
copies are still loaded.

## The patch

`ariaHideOutside` keeps its bookkeeping in a module-level array:

```js
let observerStack = [];
```

`scripts/patch-observer-stack.mjs` rewrites every installed copy's `ariaHideOutside` to:

```js
let observerStack = (globalThis.__reactAriaSharedObserverStack ||= []);
```

Now the modal (copy A) and the Select popover (copy B) push/pop against the **same** stack,
so when the popover opens, the modal's observer is correctly disconnected and never marks
the popover `inert`. (`push`/`pop`/`splice` mutate the shared array; the reference is never
reassigned, so aliasing the module var to the global is sufficient.)

The `dev` and `build` scripts run the patch **inline** (`node scripts/... && next ...`) so it
applies even where npm lifecycle hooks are disabled (`ignore-scripts`). It's pure Node.js (no
`find`/shell) so it also works in StackBlitz WebContainers.

## Run

```bash
npm install
npm run build && npm run start   # http://localhost:9021
```

Open the modal → open the Select → hover the options: they highlight and are clickable.
Compare against the unpatched repro (options are dead).

## Upstream fix idea

Store `observerStack` (and the related counters) somewhere shared across duplicate module
instances — e.g. `globalThis`/`document` — or make `ariaHideOutside` skip elements that are
themselves react-aria top-layer/portal popovers. Either removes the dependency on there
being exactly one copy of the module in the bundle.

## Versions

- next 16.2.6, react 18.3.1
- react-aria 3.50.0, react-aria-components 1.17.0 (→ react-aria 3.48.0)
