import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "vite-plugin-node-polyfills";

export default defineConfig({
  base: "/DMD-Founder-App/", // z.B. "/DMD-Founder-App/"
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "process", "util", "stream", "path", "events"],
      globals: { Buffer: true, process: true }
    })
  ],
  define: { "process.env": {} },
  optimizeDeps: {
    include: [
      "@coral-xyz/anchor",
      "@solana/web3.js",
      "@solana/spl-token",
      "buffer"
    ]
  },
  build: { commonjsOptions: { transformMixedEsModules: true } }
});
