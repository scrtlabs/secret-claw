import { NextResponse } from "next/server";
import { isDemoMode, DEMO_BOT_USERNAME } from "@/lib/demo";

export const dynamic = "force-dynamic";

const DEFAULT_TELEGRAM_URL = "https://api.telegram.org";

export async function POST(request: Request) {
  let body: { botToken?: string; chatId?: string };
  try {
    body = (await request.json()) as { botToken?: string; chatId?: string };
  } catch {
    return NextResponse.json({ valid: false, error: "invalid JSON body" }, { status: 400 });
  }
  const botToken = (body.botToken || "").trim();
  const chatId = (body.chatId || "").trim();
  if (!botToken) {
    return NextResponse.json({ valid: false, error: "botToken missing" }, { status: 400 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ valid: true, botUsername: DEMO_BOT_USERNAME, demo: true });
  }

  if (!botToken.includes(":")) {
    return NextResponse.json({ valid: false, error: "expected token in form <bot_id>:<secret>" });
  }
  if (chatId && !/^-?\d+$/.test(chatId)) {
    return NextResponse.json({ valid: false, error: "chatId must be a signed integer" });
  }

  const base = process.env.TELEGRAM_API_URL || DEFAULT_TELEGRAM_URL;
  const url = `${base}/bot${encodeURIComponent(botToken)}/getMe`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      return NextResponse.json({
        valid: false,
        status: res.status,
        error: res.status === 401 || res.status === 404 ? "invalid bot token" : `Telegram returned ${res.status}`,
      });
    }
    const data = (await res.json()) as { ok?: boolean; result?: { username?: string; first_name?: string } };
    if (!data.ok || !data.result) {
      return NextResponse.json({ valid: false, error: "Telegram getMe returned no result" });
    }
    return NextResponse.json({
      valid: true,
      botUsername: data.result.username || data.result.first_name || "(unnamed)",
    });
  } catch (err) {
    return NextResponse.json({
      valid: false,
      status: 0,
      error: err instanceof Error ? err.message : "network error",
    });
  }
}
