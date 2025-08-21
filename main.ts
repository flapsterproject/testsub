// main.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const kv = await Deno.openKv();

const TOKEN = Deno.env.get("BOT_TOKEN");
const SECRET_PATH = "/testsub"; // change this
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const CHANNELS = ["@FlapsterMiner", "@Grand_Tunnel"]; // your channels

serve(async (req: Request) => {
  const { pathname } = new URL(req.url);
  if (pathname !== SECRET_PATH) {
    return new Response("Bot is running.", { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const update = await req.json();
  const message = update.message;
  const callbackQuery = update.callback_query;
  const chatId = message?.chat?.id || callbackQuery?.message?.chat?.id;
  const text = message?.text;
  const data = callbackQuery?.data;
  const messageId = callbackQuery?.message?.message_id;

  if (!chatId) return new Response("No chat ID", { status: 200 });

  // Function to check subscription
  async function isSubscribed(userId: number) {
    for (const channel of CHANNELS) {
      try {
        const res = await fetch(`${TELEGRAM_API}/getChatMember?chat_id=${channel}&user_id=${userId}`);
        const data = await res.json();
        if (!data.ok) return false;
        const status = data.result.status;
        if (status === "left" || status === "kicked") return false;
      } catch (e) {
        console.error(e);
        return false;
      }
    }
    return true;
  }

  // Handle /start command
  if (text?.startsWith("/start")) {
    const subscribed = await isSubscribed(chatId);

    if (subscribed) {
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "🎉 Thank you for subscribing to all channels! You can now use the bot."
        })
      });
    } else {
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "⚠️ You need to subscribe to all channels first! Click the button below after subscribing.",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Check Subscription ✅", callback_data: "check_sub" }],
              ...CHANNELS.map(channel => [{ text: `Join ${channel}`, url: `https://t.me/${channel.replace("@","")}` }])
            ]
          }
        })
      });
    }
  }

  // Handle inline button click
  if (data === "check_sub" && messageId) {
    const subscribed = await isSubscribed(chatId);
    const textToSend = subscribed
      ? "🎉 You are subscribed to all channels! You can now use the bot."
      : "⚠️ You are not subscribed to all channels. Please join them first!";

    await fetch(`${TELEGRAM_API}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: textToSend,
        reply_markup: subscribed ? undefined : {
          inline_keyboard: [
            [{ text: "Check Subscription ✅", callback_data: "check_sub" }],
            ...CHANNELS.map(channel => [{ text: `Join ${channel}`, url: `https://t.me/${channel.replace("@","")}` }])
          ]
        }
      })
    });

    // Answer callback query to remove loading
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id
      })
    });
  }

  return new Response("OK", { status: 200 });
});


