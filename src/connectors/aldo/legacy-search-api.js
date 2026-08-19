const axios = require("axios");

/**
 * دریافت همه‌ی محصولات از API به صورت Pagination
 * @param {string} baseApiUrl - آدرس پایه API از تنظیمات
 * @returns {Promise<Array>} - لیست کامل محصولات خام
 */
async function fetchProducts(baseApiUrl) {
  let allProducts = [];
  let start = 0;
  const rows = 45; // تعداد آیتم در هر درخواست
  let hasMore = true;

  console.log("Starting to fetch all products from ALDO API...");

  while (hasMore) {
    try {
      // جایگزین کردن مقدار start در URL برای رفتن به صفحه بعد
      const pageUrl = baseApiUrl
        .replace(/start=\d+/, `start=${start}`)
        .replace(/rows=\d+/, `rows=${rows}`);

      console.log(`Fetching items ${start} to ${start + rows}...`);
      
      const response = await axios.get(pageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json"
        }
      });

      const docs = response.data?.response?.docs || [];
      const numFound = response.data?.response?.numFound || 0;

      if (docs.length === 0) {
        hasMore = false;
        break;
      }

      allProducts = allProducts.concat(docs);
      console.log(`Fetched ${docs.length} products. Total accumulated: ${allProducts.length}/${numFound}`);

      // اگر به انتهای لیست رسیدیم یا محصول جدیدی دریافت نکردیم
      if (allProducts.length >= numFound || docs.length < rows) {
        hasMore = false;
      } else {
        start += rows;
        // یک تاخیر کوتاه ۵۰۰ میلی‌ثانیه‌ای برای شبیه‌سازی رفتار انسانی و جلوگیری از بلاک شدن
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error(`Error fetching products at start ${start}:`, error.message);
      hasMore = false; // در صورت بروز خطا حلقه را متوقف می‌کنیم تا برنامه کرش نکند
    }
  }

  return allProducts;
}

module.exports = { fetchProducts };
