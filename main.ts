// main.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const kv = await Deno.openKv(); // встроенный KV в Deno


const TOKEN = Deno.env.get("BOT_TOKEN");
const SECRET_PATH = "/testsub";
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// === CONFIG ===
const BOT_TOKEN = "YOUR_BOT_TOKEN"; // from @BotFather
const REQUIRED_CHANNELS = ["@FlapsterMiner", "@examplechannel2"];
const ACCESS_MESSAGE = "✅ You are subscribed! Here is your access: [Secret Link]";
const SUBSCRIBE_MESSAGE = "❌ Please subscribe to all channels first:\n" + REQUIRED_CHANNELS.join("\n");

const bot = new Bot(BOT_TOKEN);

// Function to check subscription
async function isSubscribed(userId: number, channel: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${channel}&user_id=${userId}`;
  const resp = await fetch(url);
  const data = await resp.json();

  if (data.result) {
    const status = data.result.status;
    return ["member", "administrator", "creator"].includes(status);
  }
  return false;
}

// /start handler
bot.command("start", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  let allSubscribed = true;
  for (const ch of REQUIRED_CHANNELS) {
    const sub = await isSubscribed(userId, ch);
    if (!sub) {
      allSubscribed = false;
      break;
    }
  }

  if (allSubscribed) {
    await ctx.reply(ACCESS_MESSAGE);
  } else {
    await ctx.reply(SUBSCRIBE_MESSAGE);
  }
});

// Start bot
bot.start();

