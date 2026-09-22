// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Lovable hosts these figures in R2. The sibling PNGs let this dev server
// show the same charts when that CDN is not in front of the app.
const localUlcerFigures: Record<string, string> = {
  "/__l5e/assets-v1/bcf12bae-ea50-4d7c-bc66-58d4bbae98aa/wagner-ulcer-classification.png":
    "src/assets/wagner-ulcer-classification.png",
  "/__l5e/assets-v1/6a86cff7-9548-4787-9328-8c7828050a4a/wifi-classification.png":
    "src/assets/wifi-classification.png",
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  plugins: [
    {
      name: "serve-local-ulcer-figures",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = req.url?.split("?")[0];
          const rel = pathname ? localUlcerFigures[pathname] : undefined;
          if (!rel) return next();
          const file = path.resolve(rel);
          if (!fs.existsSync(file)) return next();
          res.setHeader("Content-Type", "image/png");
          res.setHeader("Cache-Control", "no-cache");
          fs.createReadStream(file).pipe(res);
        });
      },
    },
  ],
});
