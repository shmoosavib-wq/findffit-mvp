function toNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value.replace(/[^0-9.-]/g, "").trim();
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    if (value && typeof value === "object") {
        if ("amount" in value) {
            return toNumber(value.amount);
        }

        if ("price" in value) {
            return toNumber(value.price);
        }
    }

    return 0;
}

function normalizeText(value) {
    return String(value || "").trim();
}

function normalizeArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeCollections(product = {}) {
    const source =
        product.collections ??
        product.raw?.collections ??
        product.raw?.product?.collections ??
        [];

    if (Array.isArray(source)) {
        return source;
    }

    if (Array.isArray(source?.nodes)) {
        return source.nodes;
    }

    if (Array.isArray(source?.edges)) {
        return source.edges
            .map((edge) => edge?.node)
            .filter(Boolean);
    }

    return [];
}

function buildSearchText(product = {}) {
    const tags = normalizeArray(product.tags).map((tag) =>
        String(tag).toLowerCase()
    );

    const collections = normalizeCollections(product)
        .map((item) => `${item?.title || ""} ${item?.handle || ""}`)
        .join(" ")
        .toLowerCase();

    const text = [
        product.title,
        product.productType,
        product.description,
        collections,
        ...tags
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return {
        text,
        tags
    };
}

function getCurrentPrice(product = {}) {
    return (
        toNumber(product.price) ||
        toNumber(product.finalPrice) ||
        toNumber(product.minPrice) ||
        toNumber(product.raw?.price) ||
        0
    );
}

function getCompareAtPrice(product = {}) {
    return (
        toNumber(product.compareAtPrice) ||
        toNumber(product.originalPrice) ||
        toNumber(product.raw?.compareAtPrice) ||
        0
    );
}

function getDiscountPercent(product = {}) {
    const explicitDiscount = Number(product.discount);

    if (Number.isFinite(explicitDiscount) && explicitDiscount > 0) {
        return Math.max(0, Math.round(explicitDiscount));
    }

    const price = getCurrentPrice(product);
    const compareAtPrice = getCompareAtPrice(product);

    if (compareAtPrice > price && compareAtPrice > 0) {
        return Math.max(
            0,
            Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
        );
    }

    return 0;
}

function getSavingsAmount(product = {}) {
    const price = getCurrentPrice(product);
    const compareAtPrice = getCompareAtPrice(product);

    if (compareAtPrice > price) {
        return Math.max(0, compareAtPrice - price);
    }

    return 0;
}

function getAvailableSizes(product = {}) {
    const directSizes = normalizeArray(product.availableSizes)
        .map((size) => normalizeText(size))
        .filter(Boolean);

    if (directSizes.length) {
        return [...new Set(directSizes)];
    }

    const variants = normalizeArray(product.variants);

    const variantSizes = variants
        .filter((variant) => variant?.availableForSale)
        .map((variant) => {
            if (variant?.size) {
                return normalizeText(variant.size);
            }

            const selectedOptions = normalizeArray(variant?.selectedOptions);
            const sizeOption = selectedOptions.find((option) =>
                ["size", "us size", "shoe size"].includes(
                    String(option?.name || "").toLowerCase().trim()
                )
            );

            return normalizeText(sizeOption?.value);
        })
        .filter(Boolean);

    return [...new Set(variantSizes)];
}

function getAvailableVariantCount(product = {}) {
    const variants = normalizeArray(product.variants);

    if (!variants.length) {
        return 0;
    }

    return variants.filter((variant) => variant?.availableForSale).length;
}

function hasImage(product = {}) {
    if (normalizeText(product.imageUrl)) {
        return true;
    }

    if (normalizeText(product.image)) {
        return true;
    }

    const images = normalizeArray(product.images);
    return images.length > 0;
}

function calculateDiscountScore(product = {}) {
    const discount = getDiscountPercent(product);
    const savings = getSavingsAmount(product);

    let score = 0;
    const reasons = [];

    if (discount >= 70) {
        score += 34;
        reasons.push(`🔥 ${discount}% تخفیف خیلی قوی`);
    } else if (discount >= 60) {
        score += 30;
        reasons.push(`🔥 ${discount}% تخفیف عالی`);
    } else if (discount >= 50) {
        score += 26;
        reasons.push(`💥 ${discount}% تخفیف جذاب`);
    } else if (discount >= 40) {
        score += 20;
        reasons.push(`🛍 ${discount}% تخفیف خوب`);
    } else if (discount >= 30) {
        score += 14;
        reasons.push(`🛍 ${discount}% تخفیف قابل توجه`);
    } else if (discount > 0) {
        score += 8;
    }

    if (savings >= 80) {
        score += 11;
        if (!reasons.length) {
            reasons.push(`💰 صرفه‌جویی ${Math.round(savings)} دلاری`);
        }
    } else if (savings >= 50) {
        score += 8;
    } else if (savings >= 25) {
        score += 5;
    } else if (savings > 0) {
        score += 2;
    }

    return {
        score: Math.min(score, 45),
        reasons
    };
}

function calculatePriceFitScore(product = {}) {
    const price = getCurrentPrice(product);

    let score = 0;
    const reasons = [];

    if (price > 0 && price < 50) {
        score = 25;
        reasons.push("💰 قیمت نهایی خیلی مناسب");
    } else if (price >= 50 && price <= 90) {
        score = 19;
        reasons.push("💵 قیمت نهایی مناسب");
    } else if (price > 90 && price <= 140) {
        score = 11;
    } else if (price > 140) {
        score = 4;
    }

    return {
        score,
        reasons
    };
}

function calculateAvailabilityScore(product = {}) {
    const sizes = getAvailableSizes(product);
    const availableVariantCount = getAvailableVariantCount(product);

    let score = 0;
    const reasons = [];

    if (sizes.length >= 6) {
        score = 15;
        reasons.push("📏 سایزبندی کامل‌تر");
    } else if (sizes.length >= 4) {
        score = 12;
        reasons.push(`📏 ${sizes.length} سایز موجود`);
    } else if (sizes.length >= 2) {
        score = 8;
        reasons.push(`👠 ${sizes.length} سایز موجود`);
    } else if (sizes.length === 1) {
        score = 4;
    } else if (availableVariantCount >= 3) {
        score = 6;
    } else if (availableVariantCount >= 1) {
        score = 3;
    }

    return {
        score,
        reasons
    };
}

function calculateAppealScore(product = {}) {
    const { text, tags } = buildSearchText(product);

    let score = 0;
    const reasons = [];
    const hasTag = (keyword) =>
        tags.some((tag) => tag.includes(keyword.toLowerCase()));

    const hasKeyword = (keyword) => text.includes(keyword.toLowerCase());

    if (
        hasKeyword("heel") ||
        hasKeyword("heels") ||
        hasKeyword("pump") ||
        hasKeyword("pumps") ||
        hasKeyword("sandal") ||
        hasKeyword("sandals") ||
        hasKeyword("sneaker") ||
        hasKeyword("crossbody") ||
        hasKeyword("handbag") ||
        hasKeyword("tote") ||
        hasKeyword("bag")
    ) {
        score += 4;
        reasons.push("✨ دسته جذاب برای پیشنهاد");
    }

    if (
        hasKeyword("pillow walk") ||
        hasTag("pillow walk")
    ) {
        score += 4;
        reasons.push("🛋 دارای ویژگی راحتی Pillow Walk");
    }

    if (
        hasKeyword("leather") ||
        hasKeyword("smooth leather")
    ) {
        score += 3;
        reasons.push("👞 متریال جذاب");
    }

    if (
        hasKeyword("new") ||
        hasKeyword("featured") ||
        hasKeyword("bestseller") ||
        hasKeyword("must-have") ||
        hasKeyword("essential") ||
        hasTag("new") ||
        hasTag("featured") ||
        hasTag("bestseller")
    ) {
        score += 2;
    }

    if (hasImage(product)) {
        score += 1;
    }

    if (normalizeText(product.description).length >= 120) {
        score += 1;
    }

    return {
        score: Math.min(score, 15),
        reasons
    };
}

function uniqueReasons(reasons = []) {
    return [...new Set(reasons.filter(Boolean))];
}

function calculateRecommendationScore(product = {}) {
    const discountResult = calculateDiscountScore(product);
    const priceFitResult = calculatePriceFitScore(product);
    const availabilityResult = calculateAvailabilityScore(product);
    const appealResult = calculateAppealScore(product);

    const totalScore = Math.min(
        100,
        Math.round(
            discountResult.score +
                priceFitResult.score +
                availabilityResult.score +
                appealResult.score
        )
    );

    const reasons = uniqueReasons([
        ...discountResult.reasons,
        ...priceFitResult.reasons,
        ...availabilityResult.reasons,
        ...appealResult.reasons
    ]).slice(0, 3);

    return {
        score: totalScore,
        reasons,
        breakdown: {
            discount: discountResult.score,
            priceFit: priceFitResult.score,
            availability: availabilityResult.score,
            appeal: appealResult.score
        }
    };
}

module.exports = {
    calculateRecommendationScore
};
