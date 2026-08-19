const MarketingProduct = require("../models/marketingProduct");

function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function getEmoji(category) {
    const normalized = cleanText(category).toLowerCase();

    if (
        normalized.includes("shoe") ||
        normalized.includes("footwear") ||
        normalized.includes("sandal")
    ) {
        return "👠";
    }

    if (
        normalized.includes("bag") ||
        normalized.includes("handbag") ||
        normalized.includes("purse")
    ) {
        return "👜";
    }

    if (
        normalized.includes("jewelry") ||
        normalized.includes("accessories")
    ) {
        return "💎";
    }

    return "✨";
}


function enrich(product) {

    return new MarketingProduct({

        category: cleanText(product.category),

        title: cleanText(product.title),

        brand: cleanText(product.brand) || "ALDO",

        emoji: getEmoji(product.category),

        price: product.price || 0,

        discount: product.discount || 0,

        url: product.url || "",

        color: cleanText(
            product.color ||
            product.colors ||
            ""
        ),

        sizes: Array.isArray(product.sizes)
            ? product.sizes
            : [],

        images: product.images || [],

        badges: []

    });
}


module.exports = {
    enrich
};