// main.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const kv = await Deno.openKv(); // встроенный KV в Deno


const TOKEN = Deno.env.get("BOT_TOKEN");
const SECRET_PATH = "/testsub";
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

import { Bot, InlineKeyboard } from "https://deno.land/x/grammy/mod.ts";

// Your bot token from @BotFather
const bot = Deno.env.get("BOT_TOKEN");

// List of channels to check
const channels = ["@FlapsterMiner", "@channel2", "@channel3"];

// Function to check if user is member of all channels
async function isSubscribed(ctx: any) {
  for (const channel of channels) {
    try {
      const member = await ctx.api.getChatMember(channel, ctx.from.id);
      if (member.status === "left" || member.status === "kicked") {
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  return true;
}

// Start command
bot.command("start", async (ctx) => {
  const subscribed = await isSubscribed(ctx);

  if (subscribed) {
    await ctx.reply("🎉 Thank you for subscribing to all channels!");
  } else {
    const keyboard = new InlineKeyboard()
      .text("Subscribe", "subscribe");

    await ctx.reply(
      "⚠️ You need to subscribe to all channels first!",
      { reply_markup: keyboard }
    );
  }
});

// Button callback
bot.callbackQuery("subscribe", async (ctx) => {
  await ctx.answerCallbackQuery("Check your subscription now!");
  const subscribed = await isSubscribed(ctx);

  if (subscribed) {
    await ctx.editMessageText("🎉 Thank you for subscribing to all channels!");
  } else {
    await ctx.editMessageText("⚠️ You still need to subscribe to all channels!");
  }
});

console.log("Bot is running...");
bot.start();

