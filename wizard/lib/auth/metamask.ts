"use client";

import { WALLET_AUTH_MESSAGE } from "./constants";

const BASE_MAINNET = {
  chainId: "0x2105",
  chainName: "Base Mainnet",
  rpcUrls: ["https://mainnet.base.org"],
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://basescan.org"],
} as const;

async function ensureBaseMainnet(ethereum: any) {
  const current = await ethereum.request({ method: "eth_chainId" });
  if (String(current || "").toLowerCase() === BASE_MAINNET.chainId.toLowerCase()) return;
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_MAINNET.chainId }],
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [BASE_MAINNET],
      });
      return;
    }
    throw new Error("Please switch MetaMask to Base Mainnet to continue.");
  }
}

export function metamaskDetect(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as any).ethereum?.isMetaMask);
}

export async function connectMetamaskAndGetWalletInfo(): Promise<{
  success: boolean;
  walletInfo: {
    name: string;
    address: string;
    balance: string;
    signature?: string;
    message?: string;
  } | null;
  error?: string;
}> {
  try {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      throw new Error("MetaMask extension is not installed.");
    }

    const ethereum = (window as any).ethereum;
    await ethereum.request({ method: "eth_requestAccounts" });
    await ensureBaseMainnet(ethereum);

    const { ethers } = await import("ethers");
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const walletAddress = await signer.getAddress();

    const balanceWei = await provider.getBalance(walletAddress);
    const balance = ethers.formatEther(balanceWei);

    const signature = await signer.signMessage(WALLET_AUTH_MESSAGE);

    return {
      success: true,
      walletInfo: {
        name: "MetaMask",
        address: walletAddress,
        balance,
        signature,
        message: WALLET_AUTH_MESSAGE,
      },
    };
  } catch (error) {
    return {
      success: false,
      walletInfo: null,
      error: (error as Error).message,
    };
  }
}
