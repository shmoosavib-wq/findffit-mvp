const { Markup } = require('telegraf');

module.exports = async (ctx, intentEngine, searchService, sessions) => {
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;

  await ctx.reply('🔍 در حال جستجو...');

  try {
    const intent = await intentEngine.parseIntent(userMessage);
    const searchRequest = {
      query: intent.query || userMessage,
      filters: intent.filters || {},
      limit: 10,
    };

    const result = await searchService.search(searchRequest);

    if (!result.products || result.products.length === 0) {
      await ctx.reply('😕 متأسفم، چیزی مطابق با درخواست شما پیدا نکردم. لطفاً عبارت دیگری امتحان کنید.');
      return;
    }

    sessions.set(userId, {
      lastResult: result,
      lastRequest: searchRequest,
      page: 0,
    });

    for (const product of result.products.slice(0, 3)) {
      let text = `👟 *${product.title}*\n`;
      text += `💰 ${product.price} ${product.currency}`;
      if (product.discount_percentage > 0) {
        text += `  ~~${product.original_price}~~  🔥 ${product.discount_percentage}% تخفیف`;
      }
      text += '\n';
      if (product.colors && product.colors.length) {
        text += `🎨 رنگ‌ها: ${product.colors.join(', ')}\n`;
      }
      if (product.variants && product.variants.length) {
        const sizes = product.variants.map(v => v.size).filter(Boolean).join(', ');
        if (sizes) text += `📏 سایزهای موجود: ${sizes}\n`;
      }
      text += `[مشاهده محصول](${product.product_url})`;

      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback('✅ این رو می‌خوام', `select_${product.id}`),
      ]);
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('➡️ بیشتر', 'more')],
      [Markup.button.callback('🔄 اصلاح جستجو', 'refine')],
    ]);
    await ctx.reply('برای دیدن گزینه‌های بیشتر یا اصلاح جستجو، دکمه‌های زیر را بزنید.', keyboard);

  } catch (error) {
    console.error('Search error:', error);
    await ctx.reply('❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.');
  }
};
