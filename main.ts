// main.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const kv = await Deno.openKv();

const TOKEN = Deno.env.get("BOT_TOKEN");
const SECRET_PATH = "/testsub"; // change this
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const CHANNELS = ["@FlapsterMiner", "@channel2"]; // your channels

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
  const chatId = message?.chat?.id;
  const text = message?.text;

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
          text: "⚠️ You need to subscribe to all channels first!",
          reply_markup: {
            inline_keyboard: CHANNELS.map(channel => [{ text: `Join ${channel}`, url: `https://t.me/${channel.replace("@","")}` }])
          }
        })
      });
    }
  }

  return new Response("OK", { status: 200 });
});


