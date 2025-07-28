import BasePage from './base-page';
import Valinteca from "./valinteca";

class Products extends BasePage {
    onReady() {
        // Sort Products
        app.on('change', '#product-filter', event =>
            window.location.href = salla.helpers.addParamToUrl('by', event.target.value)
        );
    }

    registerEvents() {
        Valinteca.initSuggestedModal();
    }

}

Products.initiateWhenReady([
    'product.index',
    'product.index.latest',
    'product.index.offers', 'product.index.search',
    'product.index.tag',
]);
