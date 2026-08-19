const {
    fetchAldoGraphQL,
    getAldoProducts,
    getAldoProduct,
    extractDynamicCategories
} = require("./api");

const {
    mapAldoProduct,
    mapAldoProducts,
    mapProduct,
    mapProducts,
    normalizeCategoryId
} = require("./mapper");

module.exports = {
    fetchAldoGraphQL,
    getAldoProducts,
    getAldoProduct,
    extractDynamicCategories,
    mapAldoProduct,
    mapAldoProducts,
    mapProduct,
    mapProducts,
    normalizeCategoryId
};
