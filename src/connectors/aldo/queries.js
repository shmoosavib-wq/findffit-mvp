const GET_PRODUCTS_QUERY = `
query getProducts(
  $first: Int = 100,
  $query: String = "tag:sale",
  $after: String
) @inContext(country: CA) {

  products(
    first: $first,
    query: $query,
    after: $after
  ) {

    edges {
      cursor

      node {

        id
        title
        handle
        description

        productType
        tags
        vendor

        collections(first: 10) {
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

        images(first: 10) {
          nodes {
            url
          }
        }

        variants(first: 20) {
          nodes {

            id
            title
            availableForSale

            price {
              amount
              currencyCode
            }

            compareAtPrice {
              amount
              currencyCode
            }

            selectedOptions {
              name
              value
            }

          }
        }

      }
    }

    pageInfo {
      hasNextPage
      endCursor
    }

  }
}
`;

module.exports = {
  GET_PRODUCTS_QUERY
};
