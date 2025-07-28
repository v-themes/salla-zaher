import 'lite-youtube-embed';
import BasePage from './base-page';
import Fslightbox from 'fslightbox';
import { setTranslations } from "./helpers";
window.fslightbox = Fslightbox;

class Product extends BasePage {
    onReady() {
        app.watchElements({
            totalPrice: '.total-price',
            beforePrice: '.before-price',
            savingValue: '.saving'
        });
    }

    registerEvents() {
        salla.product.event.onPriceUpdated((res) => {
            app.totalPrice.forEach(el => {
                const totalPrice = salla.money(res.data.price).split(' ');
                el.innerHTML = `
                    ${totalPrice[0]}<span class="text-lg mr-1 tracking-normal">${totalPrice[1]}</span>
                `;
            });

            app.anime('.total-price', { scale: [0.88, 1] });
            app.anime('.before-price', { scale: [0.88, 1] });

            if (res.data.has_sale_price) {
                const regularPrice = salla.money(res.data.regular_price).split(' ');
                app.beforePrice.forEach(el => {
                    el.style.display = 'inline';
                    el.innerHTML = `
                        ${regularPrice[0]}<span class="text-base mr-1 tracking-normal">${regularPrice[1]}</span>
                    `;
                });

                const savingValue = salla.money(Math.floor(res.data.regular_price - res.data.price)).split(' ')[0];
                app.savingValue.innerHTML = `
                    ${setTranslations("وفــر مبلغ", "You are saving")} 
                    <span class="text-lg font-bold text-green-600 mr-0.5">${savingValue}</span>
                    ${setTranslations("ر.س", "SAR")}
                `;
                return;
            }
            app.beforePrice.length && app.beforePrice.forEach(el => el.style.display = 'none');
        });

        this.displaySavingvalue();

        app.onClick('#btn-show-more', e => app.all('#more-content', div => {
            e.target.classList.add('is-expanded');
            div.style = `max-height:${div.scrollHeight}px`;
        }) || e.target.remove());
    }

    displaySavingvalue() {
        const saving = document.querySelector('.saving');
        if (!saving) return;

        const regularPrice = saving.getAttribute("data-regular"),
            salePrice = saving.getAttribute("data-sale");

        saving.innerHTML = `
            ${setTranslations("وفــر مبلغ", "You are saving")} 
            <span class="text-lg font-bold text-green-600 mr-0.5">${salla.helpers.number(Math.floor(regularPrice - salePrice))}</span>
            ${setTranslations("ر.س", "SAR")}
        `;
    }
}

Product.initiateWhenReady(['product.single']);
