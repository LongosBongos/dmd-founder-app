import type * as anchor from "@coral-xyz/anchor";

export const IDL = {
  version: "0.1.0",
  name: "dmd_anchor",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "vault", isMut: true, isSigner: false },
        { name: "buyerState", isMut: true, isSigner: false },
        { name: "founder", isMut: true, isSigner: true },
        { name: "mint", isMut: true, isSigner: false },
        { name: "founderTokenAccount", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [{ name: "initialPriceSol", type: "u64" }]
    },
    {
      name: "togglePublicSale",
      accounts: [
        { name: "vault", isMut: true, isSigner: false },
        { name: "founder", isMut: true, isSigner: true }
      ],
      args: [{ name: "active", type: "bool" }]
    },
    {
      name: "whitelistAdd",
      accounts: [{ name: "buyerState", isMut: true, isSigner: false }],
      args: [{ name: "status", type: "bool" }]
    },
    {
      name: "buyDmd",
      accounts: [
        { name: "vault", isMut: true, isSigner: false },
        { name: "buyerState", isMut: true, isSigner: false },
        { name: "founder", isMut: true, isSigner: true },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "founderTokenAccount", isMut: true, isSigner: false },
        { name: "buyerTokenAccount", isMut: true, isSigner: false },
        { name: "buyer", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [{ name: "solContribution", type: "u64" }]
    },
    {
      name: "claimReward",
      accounts: [
        { name: "vault", isMut: true, isSigner: false },
        { name: "buyerState", isMut: true, isSigner: false }
      ],
      args: []
    },
    {
      name: "sellDmd",
      accounts: [
        { name: "vault", isMut: true, isSigner: false },
        { name: "buyerState", isMut: true, isSigner: false }
      ],
      args: [{ name: "amount", type: "u64" }]
    }
  ],
  accounts: [
    {
      name: "vault",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "totalSupply", type: "u64" },
          { name: "presaleSold", type: "u64" },
          { name: "initialPriceSol", type: "u64" },
          { name: "publicSaleActive", type: "bool" },
          { name: "mint", type: "publicKey" },
          { name: "mintDecimals", type: "u8" }
        ]
      }
    },
    {
      name: "buyerState",
      type: {
        kind: "struct",
        fields: [
          { name: "totalDmd", type: "u64" },
          { name: "lastRewardClaim", type: "i64" },
          { name: "lastSell", type: "i64" },
          { name: "holdingSince", type: "i64" },
          { name: "lastBuyDay", type: "i64" },
          { name: "buyCountToday", type: "u64" },
          { name: "whitelisted", type: "bool" }
        ]
      }
    }
  ]
} as anchor.Idl;
