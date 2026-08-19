module.exports = async (ctx, sessions) => {
  const userId = ctx.from.id;
  const session = sessions.get(userId);
  if (!session) {
    await ctx.reply('لطفاً ابتدا یک جستجو انجام دهید.');
    return;
  }
  await ctx.reply('چگونه می‌خواهید جستجو را اصلاح کنید؟ (مثلاً رنگ، بودجه، سبک)');
};
