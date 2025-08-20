import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Polyfills (wichtig vor Anchor/Web3)
import { Buffer } from "buffer";
if (!(globalThis as any).Buffer) (globalThis as any).Buffer = Buffer;
if (!(globalThis as any).process) (globalThis as any).process = { env: {} };

// Wallet Adapter UI Styles
import "@solana/wallet-adapter-react-ui/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
