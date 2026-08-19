class Product {
    constructor(data = {}) {
        this.id = data.id || null;

        this.brand = data.brand || "";

        this.title = data.title || "";

        this.category = data.category || "";

        this.description = data.description || "";

        this.price = data.price || 0;

        this.discount = data.discount || 0;

        this.compareAtPrice = data.compareAtPrice || 0;

        this.url = data.url || "";

        this.images = data.images || [];

        this.color = data.color || "";

        this.sizes = data.sizes || [];

        this.features = data.features || [];

        this.badges = data.badges || [];

        this.metadata = data.metadata || {};
    }
}

module.exports = Product;