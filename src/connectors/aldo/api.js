const { GET_PRODUCTS_QUERY } = require("./queries");
const { GET_PRODUCT_QUERY } = require("./productQuery");
const { mapAldoProducts, mapAldoProduct } = require("./mapper");
const axios = require('axios');

const ALDO_GRAPHQL_URL = "https://www.aldoshoes.com/api/graphql";
const MAX_PAGES = 100;

// هدرهای شبیه‌سازی مرورگر
const DEFAULT_HEADERS = {
    "X-Shopify-Storefront-Access-Token": process.env.ALDO_STOREFRONT_TOKEN || "",
    "Authorization": `Bearer ${process.env.ALDO_API_TOKEN || ""}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.aldoshoes.com/',
    'Origin': 'https://www.aldoshoes.com',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
};

async function fetchAldoGraphQL(query, variables = {}) {
    try {
        const response = await axios({
            method: 'POST',
            url: ALDO_GRAPHQL_URL,
            headers: DEFAULT_HEADERS,
            data: {
                query,
                variables
            },
            timeout: 30000,
            // اگر از proxy استفاده می‌کنید، این بخش را فعال کنید
            // proxy: {
            //   host: 'your-proxy-ip',
            //   port: 8080
            // }
        });

        if (response.data.errors?.length) {
            throw new Error(`ALDO GraphQL Errors: ${JSON.stringify(response.data.errors)}`);
        }

        return response.data.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`ALDO GraphQL HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

async function getAldoProducts() {
    const allNodes = [];
    let after = null;
    let hasNextPage = true;
    let pageCount = 0;

    while (hasNextPage && pageCount < MAX_PAGES) {
        const data = await fetchAldoGraphQL(
            GET_PRODUCTS_QUERY,
            {
                first: 100,
                query: "tag:sale",
                after
            }
        );

        const edges = data?.products?.edges || [];
        allNodes.push(...edges.map(edge => edge.node));

        const pageInfo = data?.products?.pageInfo;
        hasNextPage = Boolean(pageInfo?.hasNextPage);
        after = pageInfo?.endCursor || null;
        pageCount++;
    }

    console.log("ALDO PRODUCTS FETCHED", {
        total: allNodes.length,
        pages: pageCount
    });

    return mapAldoProducts(allNodes);
}

async function getAldoProduct(productId) {
    if (!productId) return null;

    const data = await fetchAldoGraphQL(
        GET_PRODUCT_QUERY,
        { id: productId }
    );

    const product = data?.product || data?.node || data?.productByHandle || null;
    if (!product) return null;

    return mapAldoProduct(product);
}

function normalizeStoreCategory(value = "") {
    const text = String(value).toLowerCase().trim();
    if (!text) return null;

    if (text.includes("shoe") || text.includes("boot") || text.includes("heel") || text.includes("sandal") || text.includes("sneaker") || text.includes("loafer") || text.includes("flat") || text.includes("footwear")) {
        return "کفش";
    }
    if (text.includes("bag") || text.includes("handbag") || text.includes("wallet") || text.includes("purse") || text.includes("clutch") || text.includes("tote")) {
        return "کیف";
    }
    if (text.includes("access") || text.includes("belt") || text.includes("jewelry") || text.includes("watch") || text.includes("sunglass") || text.includes("scarf") || text.includes("hat") || text.includes("sock")) {
        return "اکسسوری";
    }
    if (text.includes("clothing") || text.includes("apparel") || text.includes("shirt") || text.includes("top") || text.includes("pant") || text.includes("jacket") || text.includes("dress")) {
        return "لباس";
    }

    return null;
}

function extractDynamicCategories(products = []) {
    const categoriesMap = new Map();

    for (const product of products) {
        let unique = [];
        
        if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
            unique = [...new Set(product.categories)];
        } else {
            const sources = [];
            if (product?.productType) sources.push(product.productType);
            if (Array.isArray(product?.tags)) sources.push(...product.tags);

            const detectedCategories = sources
                .map(normalizeStoreCategory)
                .filter(Boolean);
            
            unique = [...new Set(detectedCategories)];

            if (unique.length === 0) {
                console.log("UNCATEGORIZED PRODUCT FOUND:", {
                    title: product.title,
                    type: product.productType,
                    tags: product.tags
                });
            }
        }

        for (const category of unique) {
            if (!categoriesMap.has(category)) {
                categoriesMap.set(category, {
                    id: category,
                    label: category,
                    count: 1
                });
            } else {
                categoriesMap.get(category).count++;
            }
        }
    }

    return Array.from(categoriesMap.values())
        .sort((a, b) => b.count - a.count);
}

module.exports = {
    fetchAldoGraphQL,
    getAldoProducts,
    getAldoProduct,
    extractDynamicCategories
};


