const SearchInterface = require('./interface');
const aldoConnector = require('../connectors/aldo');

class AldoAdapter extends SearchInterface {
  async search(searchRequest) {
    const params = {
      query: searchRequest.query,
      filters: searchRequest.filters || {},
      limit: searchRequest.limit || 20,
      offset: searchRequest.offset || 0,
    };

    const result = await aldoConnector.getAldoProducts(params);

    const products = result.products.map(p => ({
      id: p.id,
      source: 'aldo',
      retailer: 'ALDO',
      platform: 'shopify',
      title: p.title,
      brand: p.brand || 'ALDO',
      category: p.category,
      gender: p.gender,
      price: p.price,
      original_price: p.original_price,
      discount_percentage: p.discount_percentage || 0,
      currency: p.currency || 'CAD',
      images: p.images || [],
      product_url: p.url,
      colors: p.colors || [],
      variants: p.variants || [],
      availability: p.availability || 'in_stock',
      extracted_at: new Date().toISOString(),
    }));

    return {
      products,
      total: result.total || products.length,
      source: 'aldo',
    };
  }
}

module.exports = AldoAdapter;

