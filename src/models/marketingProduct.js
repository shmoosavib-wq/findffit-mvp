class MarketingProduct {
    constructor(data = {}) {

        this.title = data.title || "";

        this.brand = data.brand || "";

        this.emoji = data.emoji || "";

        this.shortDescription = data.shortDescription || "";

        this.features = data.features || [];

        this.price = data.price || 0;

        this.discount = data.discount || 0;

        this.url = data.url || "";

        this.images = data.images || [];

       this.category = data.category || "";
        this.badges = data.badges || [];

    }
}

module.exports = MarketingProduct;