const fs = require("fs");
const path = require("path");

const settingsPath = path.join(__dirname, "../config/runtime-settings.json");

function getSettings() {
  try {
    const file = fs.readFileSync(settingsPath, "utf8");
    return JSON.parse(file);
  } catch (error) {
    console.error("Error reading settings:", error);
    // بازگرداندن مقادیر پیش‌فرض در صورت نبود فایل یا خطای خواندن
    return {
      pricing: {
        exchangeRate: 182000,
        priceMultiplier: 1.5,
        shippingRateUsdPerKg: 50
      },
      meta: {
        updatedAt: new Date().toISOString(),
        updatedBy: "fallback"
      }
    };
  }
}

function updatePricing(patch) {
  try {
    const current = getSettings();
    const next = {
      ...current,
      pricing: {
        ...(current.pricing || {}),
        ...patch
      },
      meta: {
        updatedAt: new Date().toISOString(),
        updatedBy: "admin"
      }
    };

    fs.writeFileSync(
      settingsPath,
      JSON.stringify(next, null, 2) + "\n",
      "utf8"
    );
    return next;
  } catch (error) {
    console.error("Error writing settings:", error);
    throw error;
  }
}

module.exports = {
  getSettings,
  updatePricing
};
