import Fslightbox from 'fslightbox';
import 'lite-youtube-embed';
import BasePage from './base-page';
import { setTranslations } from './helpers';
window.fslightbox = Fslightbox;

class Product extends BasePage {
  onReady() {
    app.watchElements({
      totalPrice: '.total-price',
      beforePrice: '.before-price',
      savingValue: '.saving',
    });
  }

  registerEvents() {
    salla.product.event.onPriceUpdated((res) => {
      app.totalPrice.forEach((el) => {
        el.innerHTML = salla.money(res.data.price);
      });
      app.anime('.total-price', { scale: [0.88, 1] });
      app.anime('.before-price', { scale: [0.88, 1] });

      if (res.data.has_sale_price) {
        app.beforePrice.forEach((el) => {
          el.innerHTML = salla.money(res.data.regular_price);
        });

        const savingValue = salla
          .money(Math.floor(res.data.regular_price - res.data.price))
          .split(' ')[0];
        app.savingValue.innerHTML = `
                    ${setTranslations('وفــر مبلغ', 'You are saving')} 
                    <span class="text-lg font-bold text-green-600 mr-0.5">${savingValue}</span>
                    <i class="sicon-sar"></i>
                `;
        return;
      }
      app.beforePrice.length &&
        app.beforePrice.forEach((el) => (el.style.display = 'none'));
    });

    this.displaySavingvalue();

    app.onClick(
      '#btn-show-more',
      (e) =>
        app.all('#more-content', (div) => {
          e.target.classList.add('is-expanded');
          div.style = `max-height:${div.scrollHeight}px`;
        }) || e.target.remove()
    );
  }

  displaySavingvalue() {
    const saving = document.querySelector('.saving');
    if (!saving) return;

    const regularPrice = saving.getAttribute('data-regular'),
      salePrice = saving.getAttribute('data-sale');

    saving.innerHTML = `
            ${setTranslations('وفــر مبلغ', 'You are saving')} 
            <span class="text-lg font-bold text-green-600 mr-0.5">${salla.helpers.number(
              Math.floor(regularPrice - salePrice)
            )}</span>
           <i class="sicon-sar"></i>
        `;
  }
}

Product.initiateWhenReady(['product.single']);
