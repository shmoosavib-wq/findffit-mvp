const AldoAdapter = require('./aldoAdapter');

class SearchService {
  constructor() {
    this.adapters = {
      aldo: new AldoAdapter(),
    };
    this.defaultSource = 'aldo';
  }

  async search(searchRequest, source = null) {
    const sourceKey = source || this.defaultSource;
    const adapter = this.adapters[sourceKey];
    if (!adapter) {
      throw new Error(`Source "${sourceKey}" not supported`);
    }
    return await adapter.search(searchRequest);
  }

  async searchAll(searchRequest) {
    const promises = Object.entries(this.adapters).map(([key, adapter]) =>
      adapter.search(searchRequest).then(result => ({ source: key, ...result }))
    );
    return await Promise.all(promises);
  }
}

const searchService = new SearchService();
module.exports = { searchService, SearchService };
