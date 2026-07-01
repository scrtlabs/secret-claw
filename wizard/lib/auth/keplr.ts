"use client";

import { KEPLR_CHAIN_ID, KEPLR_LCD_URL, WALLET_AUTH_MESSAGE } from "./constants";

export function keplrDetect(): boolean {
  if (typeof window === "undefined") return false;
  return !!((window as any).keplr || (window as any).leap);
}

export async function connectKeplrAndGetWalletInfo(): Promise<{
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
    if (typeof window === "undefined" || !(window as any).keplr) {
      throw new Error("Keplr extension is not installed.");
    }

    const keplr = (window as any).keplr;
    await keplr.enable(KEPLR_CHAIN_ID);

    const offlineSigner = (window as any).getOfflineSigner!(KEPLR_CHAIN_ID);
    const accounts = await offlineSigner.getAccounts();
    const walletAddress: string = accounts[0].address;

    const signature = await keplr.signArbitrary(
      KEPLR_CHAIN_ID,
      walletAddress,
      WALLET_AUTH_MESSAGE,
    );

    const walletName: string = (await keplr.getKey(KEPLR_CHAIN_ID)).name;

    // Lazy-import secretjs only in browser to avoid SSR issues
    const { SecretNetworkClient } = await import("secretjs");
    const secretjs = new SecretNetworkClient({
      url: KEPLR_LCD_URL,
      chainId: KEPLR_CHAIN_ID,
    });
    const balance: any = await secretjs.query.bank.balance({
      address: walletAddress,
      denom: "uscrt",
    });

    return {
      success: true,
      walletInfo: {
        name: walletName,
        address: walletAddress,
        balance: balance?.amount || "0",
        signature: signature.signature,
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
