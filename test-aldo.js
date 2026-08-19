require('dotenv').config();
const { searchService } = require('./src/search');

async function test() {
  const request = {
    query: 'کفش زنانه',
    filters: {
      category: 'women',
      maxPrice: 100,
      minDiscount: 30,
    },
    limit: 5,
  };
  const result = await searchService.search(request);
  console.log(`🔍 تعداد نتایج: ${result.products.length}`);
  result.products.forEach((p, i) => {
    console.log(`${i+1}. ${p.title} — ${p.price} ${p.currency} (تخفیف: ${p.discount_percentage}%)`);
  });
}

test().catch(console.error);
