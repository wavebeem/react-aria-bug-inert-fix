"use client";

import { useRef } from "react";

// Modal is built from the `react-aria` UMBRELLA (3.50.0) hooks.
import { Overlay, useModalOverlay } from "react-aria";
import { useOverlayTriggerState } from "react-stately";

// Select comes from `react-aria-components` (1.17.0 -> its own react-aria 3.48.0).
// => two react-aria copies, each with its own module-level `observerStack` inside
// ariaHideOutside. This mirrors a design system that depends on BOTH `react-aria`
// (for the modal) and `react-aria-components` (for the Select).
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from "react-aria-components";

function ReproModal({ state, children }) {
  const ref = useRef(null);
  const { modalProps, underlayProps } = useModalOverlay(
    { isDismissable: true },
    state,
    ref,
  );
  return (
    <Overlay>
      <div className="react-aria-ModalOverlay" {...underlayProps}>
        <div className="react-aria-Modal" {...modalProps} ref={ref}>
          {children}
        </div>
      </div>
    </Overlay>
  );
}

export default function Home() {
  const state = useOverlayTriggerState({});
  return (
    <main>
      <h1>react-aria-components: Select-in-Modal inert repro</h1>
      <p>
        Reproduces only in a <strong>production build</strong>{" "}
        (<code>next build &amp;&amp; next start</code>), not <code>next dev</code>.
      </p>
      <ol>
        <li>Click “Open Modal”.</li>
        <li>Click the Select.</li>
        <li>Hover the options.</li>
      </ol>
      <p>
        <strong>Patched.</strong> Same two-copy setup as the repro (Modal from{" "}
        <code>react-aria</code> 3.50, Select from <code>react-aria-components</code> →
        react-aria 3.48), but <code>scripts/patch-observer-stack.mjs</code> makes both
        copies share one <code>globalThis</code>-backed <code>observerStack</code>. The
        options are interactive again even with two copies loaded.
      </p>

      <button type="button" onClick={() => state.open()}>
        Open Modal
      </button>

      {state.isOpen ? (
        <ReproModal state={state}>
          <p>Modal is open. Now open the Select and hover the options:</p>
          <Select>
            <Label>Pick an option</Label>
            <Button>
              <SelectValue />
              <span aria-hidden="true"> ▾</span>
            </Button>
            <Popover>
              <ListBox>
                <ListBoxItem id="a">Option A</ListBoxItem>
                <ListBoxItem id="b">Option B</ListBoxItem>
                <ListBoxItem id="c">Option C</ListBoxItem>
              </ListBox>
            </Popover>
          </Select>
          <p>
            <button type="button" onClick={() => state.close()}>
              Close
            </button>
          </p>
        </ReproModal>
      ) : null}
    </main>
  );
}
