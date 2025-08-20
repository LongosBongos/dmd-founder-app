import { PublicKey } from "@solana/web3.js";

export const CONFIG = {
  RPC: "https://devnet.helius-rpc.com/?api-key=cba27cb3-9d36-4095-ae3a-4025bc7ff611",
  PROGRAM_ID: new PublicKey("B5ye4KPWZhk9H1gT5Wgm2y5ebSAsaJLzYenQXTiomNt6"),
  DMD_MINT: new PublicKey("3W8wtdW8pA8eUfUMJrCnJh9Dto8rc23nfQRJamuh1AWb"),
  TREASURY: new PublicKey("CEUmazdgtbUCcQyLq6NCm4BuQbvCsYFzKsS5wdRvZehV"),
  VAULT_SEED: "vault",
  BUYER_SEED: "buyer"
} as const;
