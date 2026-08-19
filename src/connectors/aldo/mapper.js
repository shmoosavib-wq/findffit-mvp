const { getSettings } = require("../../services/settingsService");

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

function mapImages(product) {
  return (product?.images?.nodes || [])
    .map((img) => img?.url)
    .filter(Boolean);
}

function mapVariants(product) {
  return (product?.variants?.nodes || []).map((variant) => {
    const options = variant?.selectedOptions || [];

    const color =
      options.find((o) => o.name?.toLowerCase() === "color")?.value || "";

    const size =
      options.find((o) => o.name?.toLowerCase() === "size")?.value || "";

    return {
      id: variant?.id || "",
      title: variant?.title || "",
      availableForSale: Boolean(variant?.availableForSale),
      price: toNumber(variant?.price?.amount),
      compareAtPrice: toNumber(variant?.compareAtPrice?.amount),
      color,
      size,
      selectedOptions: options
    };
  });
}

function calculatePrice(product, variants) {
  const basePrice = toNumber(
    product?.priceRange?.minVariantPrice?.amount
  );

  const settings = getSettings();

  const exchangeRate = toNumber(settings?.pricing?.exchangeRate);
  const multiplier = toNumber(settings?.pricing?.priceMultiplier);
  const shippingRateUsdPerKg = toNumber(
    settings?.pricing?.shippingRateUsdPerKg
  );

  const usdPrice = basePrice;

  const price = Math.round(
    basePrice * multiplier * exchangeRate
  );

  const comparePrices = variants
    .map((v) => v.compareAtPrice)
    .filter((v) => v > 0);

  const usdCompareAtPrice = comparePrices.length
    ? Math.max(...comparePrices)
    : 0;

  const compareAtPrice = usdCompareAtPrice
    ? Math.round(
        usdCompareAtPrice * multiplier * exchangeRate
      )
    : 0;

  let discount = 0;

  if (compareAtPrice > price && price > 0) {
    discount = Math.round(
      ((compareAtPrice - price) / compareAtPrice) * 100
    );
  }

  return {
    usdPrice,
    usdCompareAtPrice,
    shippingRateUsdPerKg,
    price,
    compareAtPrice,
    discount
  };
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

const CATEGORY_KEYWORDS = {
  shoes: [
    "shoe",
    "shoes",
    "footwear",
    "boot",
    "boots",
    "ankle boot",
    "heel",
    "heels",
    "sandal",
    "sandals",
    "sneaker",
    "sneakers",
    "loafer",
    "loafers",
    "flat",
    "flats",
    "mule",
    "mules",
    "slipper",
    "slippers",
    "pump",
    "pumps",
    "oxford",
    "derby",
    "dress shoe",
    "dress shoes"
  ],

  bags: [
    "bag",
    "bags",
    "handbag",
    "handbags",
    "wallet",
    "wallets",
    "purse",
    "purses",
    "clutch",
    "crossbody",
    "tote",
    "backpack",
    "backpacks",
    "shoulder bag",
    "satchel",
    "mini bag",
    "travel bag",
    "luggage"
  ],

  accessories: [
    "accessory",
    "accessories",
    "access",
    "belt",
    "belts",
    "charm",
    "charms",
    "earring",
    "earrings",
    "necklace",
    "necklaces",
    "bracelet",
    "bracelets",
    "ring",
    "rings",
    "jewel",
    "jewelry",
    "watch",
    "watches",
    "sunglass",
    "sunglasses",
    "scarf",
    "scarves",
    "hat",
    "hats",
    "glove",
    "gloves",
    "sock",
    "socks",
    "keychain",
    "key chain",
    "hair accessory",
    "luggage tag",
    "umbrella",
    "shoe care",
    "shoe cleaner",
    "cleaner",
    "insole",
    "insoles",
    "lace",
    "laces",
    "shoelace",
    "shoelaces"
  ],

  clothing: [
    "clothing",
    "clothes",
    "apparel",
    "garment",
    "garments",
    "dress",
    "dresses",
    "shirt",
    "shirts",
    "top",
    "tops",
    "pant",
    "pants",
    "trouser",
    "trousers",
    "jacket",
    "jackets",
    "coat",
    "coats",
    "skirt",
    "skirts",
    "blazer",
    "blazers",
    "hoodie",
    "hoodies",
    "sweater",
    "sweaters",
    "outerwear"
  ]
};

function hasAnyKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getCategorySourceValues(product) {
  const values = [];

  if (product?.productType) {
    values.push({
      source: "productType",
      value: product.productType
    });
  }

  if (product?.title) {
    values.push({
      source: "title",
      value: product.title
    });
  }

  if (product?.handle) {
    values.push({
      source: "handle",
      value: product.handle
    });
  }

  if (Array.isArray(product?.tags)) {
    product.tags.forEach((tag) => {
      values.push({
        source: "tag",
        value: tag
      });
    });
  }

  if (product?.vendor) {
    values.push({
      source: "vendor",
      value: product.vendor
    });
  }

  const collectionNodes = product?.collections?.nodes;

  if (Array.isArray(collectionNodes)) {
    collectionNodes.forEach((collection) => {
      if (collection?.title) {
        values.push({
          source: "collection.title",
          value: collection.title
        });
      }

      if (collection?.handle) {
        values.push({
          source: "collection.handle",
          value: collection.handle
        });
      }
    });
  }

  return values;
}

function getStrongProductTypeCategory(product) {
  const productType = normalizeText(product?.productType);

  if (!productType) {
    return null;
  }

  // ابتدا اولویت تشخیص با اکسسوری (شامل کمربند) است تا با Handbags & Accessories تداخل پیدا نکند
  if (
    hasAnyKeyword(productType, [
      "belt",
      "belts",
      "accessory",
      "accessories",
      "jewelry",
      "jewel"
    ])
  ) {
    return "اکسسوری";
  }

  if (
    hasAnyKeyword(productType, [
      "footwear",
      "shoe",
      "shoes",
      "boots",
      "boot"
    ])
  ) {
    return "کفش";
  }

  if (
    hasAnyKeyword(productType, [
      "handbag",
      "handbags",
      "bag",
      "bags",
      "purse",
      "wallet",
      "luggage"
    ])
  ) {
    return "کیف";
  }

  return null;
}

function getCollectionCategory(text) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return null;
  }

  /*
   * کالکشن‌هایی مانند:
   * Women's Brown Shoes & Accessories
   * کالکشن عمومی هستند و نباید به‌تنهایی
   * محصول HANDBAGS را کفش کنند.
   */
  const isGenericMixedCollection =
    normalized.includes("shoes accessories") ||
    normalized.includes("shoe accessories") ||
    normalized.includes("brown shoes accessories");

  if (isGenericMixedCollection) {
    return null;
  }

  if (hasAnyKeyword(normalized, CATEGORY_KEYWORDS.bags)) {
    return "کیف";
  }

  if (hasAnyKeyword(normalized, CATEGORY_KEYWORDS.shoes)) {
    return "کفش";
  }

  if (hasAnyKeyword(normalized, CATEGORY_KEYWORDS.accessories)) {
    return "اکسسوری";
  }

  if (hasAnyKeyword(normalized, CATEGORY_KEYWORDS.clothing)) {
    return "لباس";
  }

  return null;
}

function extractCategories(product) {
  const productTypeCategory = getStrongProductTypeCategory(product);

  if (productTypeCategory) {
    return [productTypeCategory];
  }

  const sourceValues = getCategorySourceValues(product);

  const scores = {
    "کفش": 0,
    "کیف": 0,
    "اکسسوری": 0,
    "لباس": 0
  };

  sourceValues.forEach(({ source, value }) => {
    const text = normalizeText(value);

    if (!text) {
      return;
    }

    let weight = 1;

    if (source === "title" || source === "handle") {
      weight = 5;
    } else if (source === "tag") {
      weight = 4;
    } else if (source === "collection.title") {
      weight = 3;
    } else if (source === "collection.handle") {
      weight = 2;
    } else if (source === "productType") {
      weight = 5;
    }

    if (source.startsWith("collection")) {
      const collectionCategory = getCollectionCategory(text);

      if (collectionCategory) {
        scores[collectionCategory] += weight;
      }

      return;
    }

    if (hasAnyKeyword(text, CATEGORY_KEYWORDS.accessories)) {
      scores["اکسسوری"] += weight;
    }

    if (hasAnyKeyword(text, CATEGORY_KEYWORDS.bags)) {
      scores["کیف"] += weight;
    }

    if (hasAnyKeyword(text, CATEGORY_KEYWORDS.shoes)) {
      scores["کفش"] += weight;
    }

    /*
     * عبارت dress shoes قبلاً در Rule کفش شناسایی شده است.
     * بنابراین dress فقط زمانی لباس محسوب می‌شود
     * که محصول کفش نباشد.
     */
    if (
      hasAnyKeyword(text, CATEGORY_KEYWORDS.clothing) &&
      !hasAnyKeyword(text, [
        "dress shoe",
        "dress shoes"
      ])
    ) {
      scores["لباس"] += weight;
    }
  });

  const orderedCategories = [
    "کفش",
    "کیف",
    "اکسسوری",
    "لباس"
  ];

  const category = orderedCategories.reduce(
    (bestCategory, currentCategory) => {
      if (scores[currentCategory] > scores[bestCategory]) {
        return currentCategory;
      }

      return bestCategory;
    },
    orderedCategories[0]
  );

  const highestScore = scores[category];

  if (!highestScore) {
    return [];
  }

  return [category];
}

function buildProductUrl(product) {
  if (!product?.handle) {
    return "";
  }

  return `https://www.aldoshoes.com/en-ca/products/${product.handle}`;
}

function mapAldoProduct(product) {
  const variants = mapVariants(product);
  const pricing = calculatePrice(product, variants);
  const categories = extractCategories(product);

  const availableSizes = [
    ...new Set(
      variants
        .filter((v) => v.availableForSale)
        .map((v) => v.size)
        .filter(Boolean)
    )
  ];

  const availableColors = [
    ...new Set(
      variants
        .filter((v) => v.availableForSale)
        .map((v) => v.color)
        .filter(Boolean)
    )
  ];

  console.log("PRODUCT CATEGORY CHECK:", {
    title: product?.title,
    productType: product?.productType,
    tags: product?.tags,
    vendor: product?.vendor,
    collections: product?.collections?.nodes || [],
    categories
  });

  return {
    id: product?.id || "",
    title: product?.title || "",
    handle: product?.handle || "",
    description: product?.description || "",
    productType: product?.productType || "",
    categories,
    category: categories[0] || "",
    categoryId: categories[0] || "",
    tags: product?.tags || [],
    available: variants.some((v) => v.availableForSale),
    price: pricing.price,
    usdPrice: pricing.usdPrice,
    compareAtPrice: pricing.compareAtPrice,
    usdCompareAtPrice: pricing.usdCompareAtPrice,
    shippingRateUsdPerKg: pricing.shippingRateUsdPerKg,
    discount: pricing.discount,
    currencyCode:
      product?.priceRange?.minVariantPrice?.currencyCode || "CAD",
    images: mapImages(product),
    variants,
    availableSizes,
    availableColors,
    url: buildProductUrl(product),
    brand: "ALDO",
    raw: product
  };
}

function mapAldoProducts(products) {
  return (products || []).map(mapAldoProduct);
}

module.exports = {
  mapAldoProduct,
  mapAldoProducts,
  mapProduct: mapAldoProduct,
  mapProducts: mapAldoProducts
};
