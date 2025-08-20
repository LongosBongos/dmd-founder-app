import { useEffect, useMemo, useState, useCallback } from "react";
import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

import { CONFIG } from "./config";
import { IDL } from "./idl";

function AppInner() {
  const { publicKey, signTransaction, signAllTransactions, sendTransaction, connected } = useWallet();

  const connection = useMemo(() => new Connection(CONFIG.RPC, "confirmed"), []);
  const provider = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    const wallet = {
      publicKey,
      signTransaction,
      signAllTransactions
    };
    return new anchor.AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new anchor.Program(IDL, CONFIG.PROGRAM_ID, provider);
  }, [provider]);

  const [vaultPda, setVaultPda] = useState<PublicKey | null>(null);
  const [buyerStatePda, setBuyerStatePda] = useState<PublicKey | null>(null);
  const [status, setStatus] = useState<string>("");

  // PDAs
  useEffect(() => {
    if (!publicKey) { setVaultPda(null); setBuyerStatePda(null); return; }
    (async () => {
      const [vault] = await PublicKey.findProgramAddress([Buffer.from(CONFIG.VAULT_SEED)], CONFIG.PROGRAM_ID);
      setVaultPda(vault);
      const [buyerState] = await PublicKey.findProgramAddress(
        [Buffer.from(CONFIG.BUYER_SEED), vault.toBuffer(), publicKey.toBuffer()],
        CONFIG.PROGRAM_ID
      );
      setBuyerStatePda(buyerState);
    })();
  }, [publicKey]);

  const ensureAta = useCallback(async (owner: PublicKey) => {
    const ata = await getAssociatedTokenAddress(CONFIG.DMD_MINT, owner);
    const info = await connection.getAccountInfo(ata);
    if (!info) {
      const ix = createAssociatedTokenAccountInstruction(owner, ata, owner, CONFIG.DMD_MINT);
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setStatus(s => s + `\nATA erstellt: ${ata.toBase58()}`);
    }
    return ata;
  }, [connection, sendTransaction]);

  const handleInitialize = useCallback(async () => {
    if (!program || !publicKey || !vaultPda || !buyerStatePda) return;
    try {
      const founderAta = await ensureAta(publicKey);
      const sig = await program.methods.initialize(new anchor.BN(2 * LAMPORTS_PER_SOL)).accounts({
        vault: vaultPda,
        buyerState: buyerStatePda,
        founder: publicKey,
        mint: CONFIG.DMD_MINT,
        founderTokenAccount: founderAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      }).rpc();
      setStatus(s => s + `\n✅ initialize: ${sig}`);
    } catch (e: any) {
      setStatus(s => s + `\nℹ️ initialize: ${e?.error?.errorMessage || e.message}`);
    }
  }, [program, publicKey, vaultPda, buyerStatePda, ensureAta]);

  const handleToggleSale = useCallback(async (active: boolean) => {
    if (!program || !publicKey || !vaultPda) return;
    try {
      const sig = await program.methods.togglePublicSale(active).accounts({
        vault: vaultPda,
        founder: publicKey
      }).rpc();
      setStatus(s => s + `\n✅ togglePublicSale(${active}): ${sig}`);
    } catch (e: any) {
      setStatus(s => s + `\nℹ️ togglePublicSale: ${e?.error?.errorMessage || e.message}`);
    }
  }, [program, publicKey, vaultPda]);

  const handleCreateMyAta = useCallback(async () => {
    if (!publicKey) return;
    await ensureAta(publicKey);
  }, [publicKey, ensureAta]);

  const handleBuy = useCallback(async (sol: number) => {
    if (!program || !publicKey || !vaultPda) return;
    try {
      const founderAta = await ensureAta(publicKey); // Founder = publicKey nur im Test; in echter Founder-UI würdest du Founder separat setzen
      const buyerAta = await ensureAta(publicKey);

      // ACHTUNG: Für echte Founder-App muss founderTokenAccount die Founder-ATA sein.
      // Hier nehmen wir vereinfachend dieselbe Wallet (Testmodus im Browser).
      const sig = await program.methods.buyDmd(new anchor.BN(sol * LAMPORTS_PER_SOL)).accounts({
        vault: vaultPda,
        buyerState: buyerStatePda!,
        founder: publicKey,
        treasury: CONFIG.TREASURY,
        founderTokenAccount: founderAta,
        buyerTokenAccount: buyerAta,
        buyer: publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      }).rpc();
      setStatus(s => s + `\n✅ buy_dmd(${sol} SOL): ${sig}`);
    } catch (e: any) {
      setStatus(s => s + `\n⚠️ buy_dmd: ${e?.error?.errorMessage || e.message}`);
    }
  }, [program, publicKey, vaultPda, buyerStatePda, ensureAta]);

  const [vaultState, setVaultState] = useState<any>(null);
  const [buyerState, setBuyerState] = useState<any>(null);

  const refresh = useCallback(async () => {
    if (!program || !vaultPda) return;
    try {
      const v = await program.account.vault.fetch(vaultPda);
      setVaultState(v);
    } catch (e) {
      setVaultState(null);
    }
    if (program && buyerStatePda) {
      try {
        const b = await program.account.buyerState.fetch(buyerStatePda);
        setBuyerState(b);
      } catch (e) {
        setBuyerState(null);
      }
    }
  }, [program, vaultPda, buyerStatePda]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16, fontFamily: "Inter, system-ui, Arial" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>DMD Founder App</h1>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <WalletMultiButton />
        <button onClick={refresh} disabled={!connected}>Refresh</button>
      </div>

      {!connected && <p>Bitte Wallet verbinden.</p>}

      {connected && (
        <>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
              <h3>Setup</h3>
              <button onClick={handleInitialize}>Initialize</button>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => handleToggleSale(true)}>Sale ON</button>
                <button onClick={() => handleToggleSale(false)}>Sale OFF</button>
              </div>
              <button style={{ marginTop: 8 }} onClick={handleCreateMyAta}>Create my DMD ATA</button>
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
              <h3>Test Buy</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[0.5, 1, 1.5, 2].map(v => (
                  <button key={v} onClick={() => handleBuy(v)}>{v} SOL</button>
                ))}
              </div>
              <p style={{ fontSize: 12, marginTop: 8 }}>
                Hinweis: Im echten Betrieb ist <b>founderTokenAccount</b> die Founder-ATA (nicht die Buyer-Wallet).
              </p>
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
              <h3>Vault</h3>
              {vaultPda && <p><b>Vault PDA:</b> {vaultPda.toBase58()}</p>}
              {vaultState ? (
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
{JSON.stringify({
  owner: vaultState.owner?.toBase58?.() ?? String(vaultState.owner),
  totalSupply: Number(vaultState.totalSupply),
  presaleSold: Number(vaultState.presaleSold),
  initialPriceSol: Number(vaultState.initialPriceSol) / LAMPORTS_PER_SOL,
  publicSaleActive: vaultState.publicSaleActive,
  mint: vaultState.mint?.toBase58?.() ?? String(vaultState.mint),
  mintDecimals: vaultState.mintDecimals
}, null, 2)}
                </pre>
              ) : <p>keine Daten</p>}
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
              <h3>BuyerState (connected wallet)</h3>
              {buyerStatePda && <p><b>PDA:</b> {buyerStatePda.toBase58()}</p>}
              {buyerState ? (
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
{JSON.stringify({
  totalDmd: Number(buyerState.totalDmd),
  lastRewardClaim: Number(buyerState.lastRewardClaim),
  lastSell: Number(buyerState.lastSell),
  holdingSince: Number(buyerState.holdingSince),
  lastBuyDay: Number(buyerState.lastBuyDay),
  buyCountToday: Number(buyerState.buyCountToday),
  whitelisted: buyerState.whitelisted
}, null, 2)}
                </pre>
              ) : <p>keine Daten</p>}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>Log</h3>
            <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>{status || "–"}</pre>
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );
  return (
    <ConnectionProvider endpoint={CONFIG.RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
