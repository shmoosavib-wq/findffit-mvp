const OpenAI = require('openai');

class IntentEngine {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  async parseIntent(userMessage) {
    const prompt = `
      شما یک دستیار هستید که درخواست خرید کاربر را به یک شیء JSON تبدیل می‌کنید.
      درخواست کاربر: "${userMessage}"

      خروجی باید دقیقاً به این شکل باشد:
      {
        "query": "عبارت جستجو (مثلاً کفش ورزشی)",
        "filters": {
          "category": "women|men|kids|unisex|",
          "gender": "female|male|girl|boy|",
          "age_months": عدد,
          "max_price": عدد,
          "min_discount": عدد,
          "style": ["راحت", "مجلسی", ...],
          "color": ["قرمز", "آبی", ...],
          "size": "مثلاً 6 یا 38"
        }
      }
      فقط JSON خروجی بده، هیچ توضیح دیگری نده.
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse intent');
    return JSON.parse(jsonMatch[0]);
  }
}

module.exports = IntentEngine;
