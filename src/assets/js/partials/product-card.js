class ProductCard extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Parse product data
    this.product = this.product || JSON.parse(this.getAttribute('product'));

    if (window.app?.status === 'ready') {
      this.onReady();
    } else {
      document.addEventListener('theme::ready', () => this.onReady());
    }
  }

  onReady() {
    this.fitImageHeight = salla.config.get('store.settings.product.fit_type');
    this.placeholder = salla.url.asset('images/s-empty.png');
    this.getProps();

    this.source = salla.config.get('page.slug');
    // If the card is in the landing page, hide the add button and show the quantity
    if (this.source == 'landing-page') {
      this.hideAddBtn = true;
      this.showQuantity = window.showQuantity;
    }

    salla.lang.onLoaded(() => {
      // Language
      this.remained = salla.lang.get('pages.products.remained');
      this.donationAmount = salla.lang.get('pages.products.donation_amount');
      this.startingPrice = salla.lang.get('pages.products.starting_price');
      this.addToCart = salla.lang.get('pages.cart.add_to_cart');
      this.outOfStock = salla.lang.get('pages.products.out_of_stock');
      this.discount = salla.lang.get('card.discount');

      // re-render to update translations
      this.render();
    });

    this.render();
  }

  formatDate(date) {
    let d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  getProductBadge() {
    if (this.product.promotion_title) {
      return `<div class="absolute top-4 start-0 z-1 font-bold px-1 py-0.5 text-xs bg-primary text-white ${
        this.isHorizontal ? '' : 'max-w-[calc(100%-60px)]'
      }">
        <span class="offer-label truncate">${
          this.product.promotion_title
        }</span>
      </div>`;
    }
    return '';
  }

  getSubImage() {
    if (this.product.images && this.product.images.length > 1) {
      return `<img class="sub-image object-cover" src="${this.product.images[1].url}" alt="${this.product.name}" />`;
    }
    return '';
  }

  getPriceFormat(price) {
    if (!price || price == 0) {
      return salla.config.get('store.settings.product.show_price_as_dash')
        ? '-'
        : '';
    }
    return salla.money(price);
  }

  getProductPrice() {
    let price = '';
    let discountPercentage = Math.floor(this.product.discount_percentage || 0);

    if (this.product.is_on_sale) {
      price = `<div class="flex gap-1.5 justify-between ${
        this.isHorizontal
          ? 'flex-wrap items-center'
          : 'flex-col items-start xs:items-center xs:flex-row flex-1'
      }">
        <div class="w-full xs:w-auto flex gap-3 xs:flex-col items-start xs:gap-[1px]">
          <span class="text-[#969696] text-base font-semibold relative regular-price">${this.getPriceFormat(
            this.product.regular_price
          )}</span>
          <span class="text-primary font-bold text-lg md:text-xl">${this.getPriceFormat(
            this.product.sale_price
          )}</span>
        </div>
        ${
          this.product.discount_percentage
            ? `
        <div class="relative rounded-lg overflow-hidden">
          <span class="bg"></span>
          <span class="sale-ratio">${this.discount} ${discountPercentage}%</span>
        </div>`
            : ''
        }
      </div>`;
    } else if (this.product.starting_price) {
      price = `<div class="flex items-center gap-2.5">
        <span class="font-semibold text-red-500">${this.startingPrice}</span>
        <h4 class="text-primary font-extrabold text-sm inline-block">${this.getPriceFormat(
          this.product.starting_price
        )}</h4>
      </div>`;
    } else {
      price = `<span class="text-primary font-bold text-lg md:text-xl ${
        this.isHorizontal ? '' : 'flex-1'
      }">${this.getPriceFormat(this.product.regular_price)}</span>`;
    }

    return price;
  }

  getAddButtonLabel() {
    if (this.product.status === 'sale' && this.product.type === 'booking') {
      return salla.lang.get('pages.cart.book_now');
    }

    if (this.product.status === 'sale') {
      return salla.lang.get('pages.cart.add_to_cart');
    }

    if (this.product.type !== 'donating') {
      return salla.lang.get('pages.products.out_of_stock');
    }

    // donating
    return salla.lang.get('pages.products.donation_exceed');
  }

  getWishlistButton() {
    const isInWishlist =
      !salla.config.isGuest() &&
      salla.storage
        .get('salla::wishlist', [])
        .includes(Number(this.product.id));
    return `<salla-button shape="icon" fill="none" aria-label="Add or remove to wishlist" class="btn--wishlist animated"
      onclick="salla.wishlist.toggle(${this.product.id})" data-id="${
      this.product.id
    }">
      <i class="sicon-heart text-lg ${this.isHorizontal ? '' : 'px-1'}"></i>
    </salla-button>`;
  }

  getCompareButton() {
    if (!salla.config.get('theme.settings.enable_compare_products')) return '';

    return `<salla-button fill="solid" product-id="${
      this.product.id
    }" class="btn--compare"
      onclick="salla.event.emit('product::add-to-compare', {button: this})">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
        stroke="currentColor" class="${
          this.isHorizontal ? 'w-6 h-6' : 'w-5 h-5'
        }">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    </salla-button>`;
  }

  getAddToCartButton() {
    const addAsIcon = salla.config.get('theme.settings.add_to_cart_as_icon');

    if (!this.isHorizontal && addAsIcon) {
      return `<salla-add-product-button class="add-to-cart-custom" product-id="${this.product.id}"
        product-status="${this.product.status}" product-type="${this.product.type}">
        <i class="sicon-cart-add text-lg text-white"></i>
      </salla-add-product-button>`;
    }

    if (!this.isHorizontal && !addAsIcon) {
      return `<salla-add-product-button class="optional-btn" product-status="${
        this.product.status
      }"
        product-type="${this.product.type}" product-id="${this.product.id}">
        <i class="sicon-cart-add text-xl"></i>
        <span>${
          this.product.add_to_cart_label || this.getAddButtonLabel()
        }</span>
      </salla-add-product-button>`;
    }

    return '';
  }

  getQuickBuyButton() {
    if (
      !this.isHorizontal &&
      salla.config.get('theme.settings.enable_quick_buy')
    ) {
      return `<salla-quick-buy
        product-id="${this.product.id}"
        product-type="${this.product.type}"
        product-status="${this.product.status}">
      </salla-quick-buy>`;
    }
    return '';
  }

  getDonationInput() {
    if (!this.product.is_donation) return '';

    return `<salla-progress-bar donation='${JSON.stringify(
      this.product.donation
    )}'></salla-progress-bar>
    <div class="border-color mb-2.5 w-full">
      ${
        this.product.can_donate
          ? `
      <label for="donation-amount-${this.product.id}" class="block text-sm mb-2.5">${this.donationAmount}
        <span class="text-red-500">*</span></label>
      <input type="text" data-digits id="donation-amount-${this.product.id}" name="donating_amount" class="h-9 form-input"
        placeholder="${this.donationAmount}">`
          : ''
      }
    </div>`;
  }

  getHorizontalActions() {
    if (!this.isHorizontal) return '';

    return `<div class="actions">
      ${this.getWishlistButton()}
      <salla-add-product-button class="add-to-cart-custom" product-id="${
        this.product.id
      }"
        product-status="${this.product.status}" product-type="${
      this.product.type
    }">
        <i class="sicon-cart-add text-lg"></i>
      </salla-add-product-button>
      ${this.getCompareButton()}
    </div>`;
  }

  getProps() {
    /**
     * Horizontal card.
     */
    this.isHorizontal = this.hasAttribute('horizontal');

    /**
     * Support shadow on hover.
     */
    this.shadowOnHover = this.hasAttribute('shadowOnHover');

    /**
     * Hide add to cart button.
     */
    this.hideAddBtn = this.hasAttribute('hideAddBtn');

    /**
     * Special card.
     */
    this.isSpecial = this.hasAttribute('isSpecial');

    /**
     * Show quantity.
     */
    this.showQuantity = this.hasAttribute('showQuantity');

    /**
     * Block classes
     */
    this.blockClasses = this.getAttribute('block-classes') || '';
  }

  render() {
    this.classList.add('product-entry');

    // Only add block classes if they exist and are not empty
    if (this.blockClasses && this.blockClasses.trim()) {
      this.blockClasses.split(' ').forEach((cls) => {
        if (cls.trim()) {
          this.classList.add(cls.trim());
        }
      });
    }

    this.classList.add(
      this.isHorizontal
        ? 'product-entry--horizontal'
        : 'product-entry--vertical'
    );
    this.isSpecial && this.classList.add('product-entry--special');
    this.product?.discount_ends && this.classList.add('with-timer');
    this.fitImageHeight &&
      !this.isSpecial &&
      this.classList.add('product-entry--fit-type');
    this.product?.is_out_of_stock && this.classList.add('out-of-stock');
    this.classList.add('overflow-hidden', 'relative');

    this.setAttribute('id', `product-${this.product.id}`);

    const hasSubtitle =
      this.product.subtitle &&
      salla.config.get('theme.settings.show_sub_title');
    const addAsIcon = salla.config.get('theme.settings.add_to_cart_as_icon');

    this.innerHTML = `
      <div class="product-entry__image ${
        this.isHorizontal ? '' : 'border border-stone-100 hover:!opacity-100'
      }">
        <a href="${this.product.url}">
          <img width="100%" class="object-${
            salla.url.is_placeholder(this.product.image?.url)
              ? 'contain'
              : this.fitImageHeight || 'cover'
          } bg-stone-50 lazy"
            src="${this.placeholder}" data-src="${this.product.image?.url}"
            alt="${this.product.image?.alt}" />
          ${this.getProductBadge()}
          ${this.getSubImage()}
        </a>

        ${
          !this.isHorizontal
            ? `
        <div class="absolute rtl:left-[4px] ltr:right-[4px] top-[9px] flex flex-col items-baseline justify-center gap-2">
          ${this.getWishlistButton()}
          ${this.getCompareButton()}
        </div>`
            : ''
        }

        ${!this.isHorizontal && addAsIcon ? this.getAddToCartButton() : ''}
      </div>

      <!-- Content -->
      <div class="${this.isHorizontal ? 'py-2 px-2 md:px-3' : 'p-2'} ${
      addAsIcon ? 'pt-4 pb-2 px-2' : ''
    } ${
      this.isSpecial ? '' : 'flex-1'
    } flex flex-col gap-0.5 relative donating-wrap">
        ${
          hasSubtitle
            ? `<p class="text-sm text-gray-400 leading-6 ${
                this.isHorizontal ? 'p-2-line' : 'truncate'
              }">${this.product.subtitle}</p>`
            : ''
        }
        
        <a href="${this.product.url}">
          <span class="block max-w-full text-sm md:text-base mt-0.5 hover:text-primary transition-all duration-150 ${
            this.isHorizontal ? 'p-2-line' : 'truncate'
          }">${this.product.name}</span>
        </a>

        ${this.getDonationInput()}

        <div class="flex-1 flex flex-col gap-1.5 flex-wrap ${
          this.isHorizontal ? 'mt-3' : 'mt-1'
        }">
          ${this.getProductPrice()}

          ${
            !this.isHorizontal
              ? `
            ${!addAsIcon ? this.getAddToCartButton() : ''}
            ${this.getQuickBuyButton()}
          `
              : ''
          }
        </div>

        ${this.getHorizontalActions()}
      </div>
    `;

    // Handle donation input
    this.querySelectorAll('[name="donating_amount"]').forEach((element) => {
      element.addEventListener('input', (e) => {
        e.target
          .closest('.donating-wrap')
          .querySelector('salla-add-product-button')
          ?.setAttribute('donating-amount', e.target.value);
      });
    });

    document.lazyLoadInstance?.update(this.querySelectorAll('.lazy'));
  }
}

customElements.define('custom-salla-product-card', ProductCard);
