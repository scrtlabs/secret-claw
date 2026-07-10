import { NextResponse } from "next/server";

import { kv } from "@vercel/kv";

// Diagnostic endpoint to verify which deployment storage backend is
// active in this environment. Open /api/_debug/storage in a browser.
// Returns:
//   backend:        "kv" if both KV env vars are set, else "in-memory"
//   kv_url_set:     true if KV_REST_API_URL is in the environment
//   kv_token_set:   true if KV_REST_API_TOKEN is in the environment
//   kv_ping:        result of a roundtrip set/get against KV
//                   ("ok", "not-attempted" if backend != "kv", or an
//                    error string from @vercel/kv)
//
// If backend == "in-memory" on Vercel: connect a KV store to the
// project in Vercel dashboard → Storage tab.
//
// If backend == "kv" but kv_ping is an error: KV is connected but the
// runtime can't reach it — usually a region mismatch or expired token.

export const dynamic = "force-dynamic";

export async function GET() {
  const kvUrlSet = !!process.env.KV_REST_API_URL;
  const kvTokenSet = !!process.env.KV_REST_API_TOKEN;
  const backend: "kv" | "in-memory" = kvUrlSet && kvTokenSet ? "kv" : "in-memory";

  let kvPing: string = "not-attempted";
  if (backend === "kv") {
    const probeKey = `secret-claw:debug:storage-probe:${Date.now()}`;
    try {
      await kv.set(probeKey, "ok", { ex: 60 });
      const got = await kv.get<string>(probeKey);
      kvPing = got === "ok" ? "ok" : `set ok but got=${JSON.stringify(got)}`;
      // Best-effort cleanup; not fatal if it fails.
      await kv.del(probeKey).catch(() => undefined);
    } catch (err) {
      kvPing = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    backend,
    kv_url_set: kvUrlSet,
    kv_token_set: kvTokenSet,
    kv_ping: kvPing,
    runtime: process.env.VERCEL ? "vercel" : "local",
  });
}
