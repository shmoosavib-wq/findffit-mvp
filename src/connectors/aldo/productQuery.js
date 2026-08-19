const GET_PRODUCT_QUERY = `
query getProduct($id: ID!)
@inContext(country: CA) {
  product(id: $id) {
    id
    title
    handle
    description
    productType
    tags
    vendor
    collections(first: 20) {
      nodes {
        id
        title
        handle
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 20) {
      nodes {
        url
      }
    }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }
}
`;

module.exports = {
  GET_PRODUCT_QUERY
};
