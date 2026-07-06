// Apply the observerStack patch before Next compiles. next.config is loaded on every
// Next boot (dev or build, `npx next dev` or `npm run dev`), so this is the reliable
// place to run it — it doesn't depend on npm lifecycle hooks or the invoking command.
import "./scripts/patch-observer-stack.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
