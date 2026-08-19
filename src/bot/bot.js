require('dotenv').config();
const { Telegraf } = require('telegraf');
const { searchService } = require('../search');
const IntentEngine = require('../ai/intentEngine');
const { startHandler, searchHandler } = require('./handlers');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const intentEngine = new IntentEngine(process.env.OPENAI_API_KEY);
const userSessions = new Map();

bot.start((ctx) => startHandler(ctx));
bot.command('search', (ctx) => searchHandler(ctx, intentEngine, searchService, userSessions));
bot.hears(/^(.*)/, (ctx) => searchHandler(ctx, intentEngine, searchService, userSessions));

bot.launch().then(() => {
  console.log('🤖 FindFit MVP Bot is running...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
