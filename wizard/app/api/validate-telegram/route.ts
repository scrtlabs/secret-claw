import { NextResponse } from "next/server";
import { isDemoMode, DEMO_BOT_USERNAME } from "@/lib/demo";

export const dynamic = "force-dynamic";

const DEFAULT_TELEGRAM_URL = "https://api.telegram.org";

// A Telegram update carries its originating chat under different keys depending
// on how the user interacted with the bot (plain message, /start, adding the bot
// to a group, a button tap, …). Pull the chat id from whichever is present.
function chatIdFromUpdate(u: Record<string, unknown>): string | null {
  const containers = [
    u.message,
    u.edited_message,
    u.channel_post,
    u.edited_channel_post,
    u.my_chat_member,
    u.chat_member,
  ] as Array<{ chat?: { id?: number | string } } | undefined>;
  for (const c of containers) {
    const id = c?.chat?.id;
    if (typeof id === "number" || typeof id === "string") return String(id);
  }
  const cb = (u.callback_query as { message?: { chat?: { id?: number | string } } } | undefined)
    ?.message?.chat?.id;
  if (typeof cb === "number" || typeof cb === "string") return String(cb);
  return null;
}

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
    return NextResponse.json({
      valid: true,
      botUsername: DEMO_BOT_USERNAME,
      chatId: chatId || "123456789",
      demo: true,
    });
  }

  if (!botToken.includes(":")) {
    return NextResponse.json({ valid: false, error: "expected token in form <bot_id>:<secret>" });
  }
  if (chatId && !/^-?\d+$/.test(chatId)) {
    return NextResponse.json({ valid: false, error: "chatId must be a signed integer" });
  }

  const base = process.env.TELEGRAM_API_URL || DEFAULT_TELEGRAM_URL;
  const bot = `${base}/bot${encodeURIComponent(botToken)}`;
  try {
    // Verify the token (getMe). When the caller supplied a chat ID, verify the
    // bot can reach it (getChat); otherwise auto-discover the chat from the
    // bot's recent updates (getUpdates) so the user only has to paste a token.
    // The secondary call runs alongside getMe.
    const [meRes, chatRes, updatesRes] = await Promise.all([
      fetch(`${bot}/getMe`, { signal: AbortSignal.timeout(10000) }),
      chatId
        ? fetch(`${bot}/getChat?chat_id=${encodeURIComponent(chatId)}`, { signal: AbortSignal.timeout(10000) })
        : Promise.resolve(null),
      chatId
        ? Promise.resolve(null)
        : fetch(`${bot}/getUpdates?limit=100`, { signal: AbortSignal.timeout(10000) }),
    ]);

    if (!meRes.ok) {
      return NextResponse.json({
        valid: false,
        status: meRes.status,
        error: meRes.status === 401 || meRes.status === 404 ? "invalid bot token" : `Telegram returned ${meRes.status}`,
      });
    }
    const data = (await meRes.json()) as { ok?: boolean; result?: { username?: string; first_name?: string } };
    if (!data.ok || !data.result) {
      return NextResponse.json({ valid: false, error: "Telegram getMe returned no result" });
    }
    const botUsername = data.result.username || data.result.first_name || "(unnamed)";

    // Manual chat ID path — confirm the bot can reach the given chat.
    if (chatRes) {
      if (!chatRes.ok) {
        return NextResponse.json({
          valid: false,
          status: chatRes.status,
          error:
            chatRes.status === 400 || chatRes.status === 403
              ? "bot can't reach this chat — send it a message first, then check the chat ID"
              : `Telegram getChat returned ${chatRes.status}`,
        });
      }
      return NextResponse.json({ valid: true, botUsername, chatId });
    }

    // Auto-discover path — find the most recent chat that messaged the bot.
    if (updatesRes && !updatesRes.ok) {
      return NextResponse.json({
        valid: false,
        status: updatesRes.status,
        error:
          updatesRes.status === 409
            ? "this bot already has a webhook set — remove it or enter the chat ID manually"
            : `Telegram getUpdates returned ${updatesRes.status}`,
      });
    }
    const updates = (await updatesRes!.json()) as { ok?: boolean; result?: Array<Record<string, unknown>> };
    const list = updates.ok && Array.isArray(updates.result) ? updates.result : [];
    let discovered: string | null = null;
    for (let i = list.length - 1; i >= 0; i--) {
      discovered = chatIdFromUpdate(list[i]);
      if (discovered) break;
    }
    if (!discovered) {
      // Token is valid — we're just waiting for the user to message the bot.
      // `pending` tells the client to keep polling instead of showing an error.
      return NextResponse.json({
        valid: false,
        pending: true,
        botUsername,
        error: `Open @${botUsername} in Telegram and tap Start (or send it any message) — we're linking your chat automatically.`,
      });
    }
    return NextResponse.json({ valid: true, botUsername, chatId: discovered });
  } catch (err) {
    return NextResponse.json({
      valid: false,
      status: 0,
      error: err instanceof Error ? err.message : "network error",
    });
  }
}
