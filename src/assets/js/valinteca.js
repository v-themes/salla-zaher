import { setTranslations, expiredStorage, checkLocalStorage } from './helpers';

export default {
  registerEvents() {
    //! Components should only work on homePage
    if (salla.url.is_page('index')) {
      this.registercollectionComponent();
    }
    this.registerMenuCategoriesComponent();

    this.productAddToCompare();
    this.removeProductFromCompare();

    this.cartItemDeleted();

    this.initVoiceSearch();
  },

  // ? COMPARE HANDLAR
  productAddToCompare() {
    salla.event.on('product::add-to-compare', (response) => {
      const button = response.button;
      const productId = button.getAttribute('product-id');
      button.disable();
      button.load();
      setTimeout(() => {
        const compareProductIds =
          salla.storage.get('compare-products-ids') ?? [];
        if (compareProductIds.includes(productId)) {
          salla.notify.info(
            setTranslations('المنتج موجود بالفعل', 'Product already exists')
          );
        } else {
          if (compareProductIds.length >= 4) {
            salla.notify.error(
              setTranslations(
                'لا يمكن إضافة أكثر من أربعة منتجات',
                "You can't add more than four products to compare"
              )
            );
          } else {
            salla.notify.success(
              setTranslations(
                'تم إضافة المنتج إلى المقارنة بنجاح',
                'Product added to compare'
              )
            );
            compareProductIds.push(productId);
            salla.storage.set('compare-products-ids', compareProductIds);
            updateCompareIndicator();
          }
        }
        button.stop();
        button.enable();
      }, 500);
    });
  },
  removeProductFromCompare() {
    salla.event.on('product::remove-from-compare', (response) => {
      const button = response.button;
      const productId = button.getAttribute('product-id');
      const compareProductIds = salla.storage.get('compare-products-ids') ?? [];
      if (compareProductIds.includes(productId)) {
        const productIndex = compareProductIds.indexOf(productId);
        compareProductIds.splice(productIndex, 1);
        salla.storage.set('compare-products-ids', compareProductIds);
        button.closest('.product-column').remove();
        salla.notify.success(
          setTranslations(
            'تم حذف المنتج من المقارنة بنجاح',
            'Product removed form compare'
          )
        );
        updateCompareIndicator();
        if (compareProductIds.length === 0) {
          document
            .querySelector('#compare-products-alert')
            .classList.remove('hidden');
          document
            .querySelector('#compare-products-container .products-wrapper')
            .classList.add('hidden');
        }
      } else {
        salla.notify.info(
          setTranslations(
            'المنتج لم يعد موجود بالمقارنة',
            "Product doesn't exist in compare"
          )
        );
      }
    });
  },

  initSuggestedModal() {
    const modal = document.getElementById('suggested-products-modal');
    if (!modal) return;

    salla.cart.event.onItemAdded((response, product_id) => {
      if (!response.success || !modal.classList.contains('s-hidden')) return;
      const productsSlider = modal.querySelector('.products-placeholder');

      const slider_config = {
        slidesPerView: 1,
        spaceBetween: 10,
        centerInsufficientSlides: true,
        breakpoints: {
          320: { slidesPerView: 2 },
          640: { slidesPerView: 3 },
        },
      };
      productsSlider.innerHTML = `
                <salla-products-slider 
                    source="related"
                    autoplay="true"
                    slider-config=${JSON.stringify(slider_config)}
                    source-value=${product_id}
                    class="suggested-products-slider">
                </salla-products-slider>
            `;

      modal.open();
    });
  },

  cartItemDeleted() {
    salla.cart.event.onItemDeleted((response) => {
      if (!response.success) return;
      salla.storage.set(
        'cart_items',
        response.data.cart.items.map((item) => item.product_id.toString())
      );
    });
  },

  // ? CATEGORIES HANDLER
  registerMenuCategoriesComponent() {
    let menu_categories = checkLocalStorage('menu_categories');
    if (!menu_categories) {
      salla.product.categories().then((response) => {
        if (response.status != 200) return;

        this.fillMenuCategories(response.data);
        if (salla.url.is_page('index'))
          this.registerCategoriesComponent(response.data);

        expiredStorage('menu_categories', response.data);
      });
    } else {
      if (salla.url.is_page('index'))
        this.registerCategoriesComponent(menu_categories);

      this.fillMenuCategories(menu_categories);
    }
  },
  fillMenuCategories(categories) {
    const categoryMenu = document.querySelector('.category-menu-items');
    let htmlContentToRendered = '';

    categories
      .filter((category) => category.name)
      .forEach((categoryItem) => {
        if (
          categoryItem.sub_categories &&
          categoryItem.sub_categories.length > 0
        ) {
          htmlContentToRendered += `<li><span class="sub-category-name">
                <i class="sicon-keyboard_arrow_down"></i>${categoryItem.name}</span>
                <ul class="sub-categories-content">`;
          categoryItem.sub_categories
            .filter((subCategory) => subCategory.name)
            .forEach((subCategory) => {
              htmlContentToRendered += `<li><a href="${subCategory.url}">${subCategory.name}</a></li>`;
            });
          if (categoryItem.sub_categories.length > 1) {
            htmlContentToRendered += `<li><a href="${
              categoryItem.url
            }">${setTranslations('عرض الكل', 'Show all')}</a></li>`;
          }
          htmlContentToRendered += `</ul></li>`;
        } else {
          htmlContentToRendered += `<li><a href="${categoryItem.url}">${categoryItem.name}</a></li>`;
        }
      });
    categoryMenu.innerHTML = htmlContentToRendered;

    let subCategoryHeading = document.querySelectorAll('.sub-category-name');
    subCategoryHeading.forEach((subCategoryElement) => {
      subCategoryElement.addEventListener('click', () => {
        subCategoryElement.classList.toggle('rotate-arrow');
        subCategoryElement
          .closest('li')
          .querySelector('ul')
          .classList.toggle('show-sub-menu-item');
      });
    });
  },
  registerCategoriesComponent(storedCategories) {
    const categoriesComponents = document.querySelectorAll(
      '.js-categories-component'
    );
    if (categoriesComponents.length < 1) return;

    let categories = [];
    for (let storedCategory of storedCategories) {
      categories.push(storedCategory);
      for (let storedSubCategory of storedCategory.sub_categories ?? []) {
        categories.push(storedSubCategory);
      }
    }
    categoriesComponents.forEach(async (comp) => {
      let urlsTags = comp.querySelectorAll('.js-categories-component-url');
      this.registerCategoryUrls(categories, urlsTags);
    });
  },
  registerCategoryUrls(categories, tags) {
    tags.forEach((tag) => {
      let categoryId = tag.getAttribute('data-id');
      if (categories)
        tag.setAttribute(
          'href',
          categories?.find((category) => category.id_ == categoryId)?.url ?? ''
        );
    });
  },

  // ? ZAHER-COLLECTIONS HANDLER
  registercollectionComponent() {
    const collectionComponents = document.querySelectorAll(
      '.js-collection-component'
    );
    collectionComponents.forEach(async (comp, idx) => {
      let collectionsItms = comp.querySelectorAll('.collection__item'),
        key = `${comp.getAttribute('data-key')}-${idx}`;

      // Check if the collection is already exist in local storage
      const storedCollection = checkLocalStorage(`collection-${key}`) || [];
      for (let item of collectionsItms) {
        const productId = item.getAttribute('data-id'),
          productData = storedCollection.find((item) => item.id == productId);
        if (productData) {
          if (item.classList.contains('style-1'))
            this.renderProductStyle1(item, productData);
          if (item.classList.contains('style-2'))
            this.renderProductStyle2(item, productData);
        } else {
          await this.getProductData(item, key);
        }
      }
    });
  },
  async getProductData(item, key) {
    const productId = item.getAttribute('data-id');
    salla.product
      .getDetails(productId, ['images', 'category'])
      .then((res) => {
        if (res.status != 200) return;
        // Render product data
        if (item.classList.contains('style-1'))
          this.renderProductStyle1(item, res.data);
        if (item.classList.contains('style-2'))
          this.renderProductStyle2(item, res.data);
        // Handle local storage
        let collectionData = salla.storage.get(`collection-${key}`)?.data || [];
        collectionData.push(res.data);
        expiredStorage(`collection-${key}`, collectionData);
      })
      .catch((err) => {
        // console.log(err.message);
      });
  },
  renderProductStyle1(item, data) {
    if (!data) return;

    const {
      id,
      name,
      status,
      is_available,
      type,
      regular_price,
      sale_price,
      is_on_sale,
      images,
      image,
    } = data;

    const subImg = images.length > 1 ? images[1].url : image.url;
    const bgImg = item.getAttribute('data-bg-src');

    const mainImg = item.querySelector('.main-img'),
      miniCard = item.querySelector('.mini-card'),
      cardImg = miniCard.querySelector('img'),
      cardInfo = miniCard.querySelector('.card-info');

    mainImg.setAttribute('src', `${bgImg ? bgImg : image.url}`);
    mainImg.setAttribute('alt', `${image.alt}`);

    cardImg.setAttribute('src', `${subImg}`);
    cardImg.setAttribute('alt', `${image.alt}`);

    if (!is_available) cardImg.classList.add('not-available');
    cardInfo.innerHTML += `
            <h5 class="p-2-line">${name}</h5>
            <div class="flex-1 flex items-end gap-3">
            ${
              is_on_sale
                ? `
                <span class="text-base text-gray-400 line-through leading-none">${salla.money(
                  regular_price
                )}</span>
                <span class="text-lg text-primary font-bold leading-none">${salla.money(
                  sale_price
                )}</span>
            `
                : `
                <span class="text-lg text-primary font-bold leading-none">${salla.money(
                  regular_price
                )}</span>
            `
            }
            </div>
        `;
    miniCard.innerHTML += `
            <salla-add-product-button product-id="${id}"
                product-status="${status}" product-type="${type}">
                <i class="sicon-cart-add"></i>
            </salla-add-product-button>
        `;
    this.indicatorHandler(item);
    this.cancelHandler(item);
  },
  indicatorHandler(item) {
    const indicator = item.querySelector('.indicator');

    const topAttr = indicator.getAttribute('data-top');
    const leftAttr = indicator.getAttribute('data-left');
    const topPosition =
      (topAttr > 0 ? topAttr : Math.floor(Math.random() * 70) + 10) + '%';
    const leftPosition =
      (leftAttr > 0 ? leftAttr : Math.floor(Math.random() * 70) + 10) + '%';
    indicator.style.top = topPosition;
    indicator.style.left = leftPosition;

    indicator.addEventListener('click', () => {
      const miniCard = item.querySelector('.mini-card');
      miniCard.classList.toggle('active');
    });
  },
  cancelHandler(item) {
    const cancelIcon = item.querySelector('.cancel-icon');
    cancelIcon.addEventListener('click', () => {
      const miniCard = item.querySelector('.mini-card');
      miniCard.classList.remove('active');
    });
  },
  renderProductStyle2(item, data) {
    if (!data) return;
    const mainImg = item.querySelector('img'),
      productLink = item.querySelector('a');

    const { url, image, name, id } = data;

    // update slider
    mainImg.setAttribute('src', `${image.url}`);
    mainImg.setAttribute('alt', `${name}`);
    productLink.setAttribute('href', `${url}`);

    // Update thumbs
    const thumb = document.querySelector(
      `.js-collection-slider img[data-id="${id}"]`
    );
    thumb.setAttribute('src', `${image.url}`);
    thumb.setAttribute('alt', `${name}`);
  },

  initVoiceSearch() {
    const voiceSearchBtn = document.querySelector('.voice-search-btn');
    voiceSearchBtn.addEventListener('click', () => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const speechRecognition = new SpeechRecognition();
      speechRecognition.lang = 'ar-SA';
      speechRecognition.start();
      voiceSearchBtn.classList.add('is-recording');

      speechRecognition.onresult = (event) => {
        const searchInput = document.querySelector(
          '.header-search .s-search-input'
        );
        const inputEvent = new KeyboardEvent('input');
        const currentResult = event.resultIndex;
        const transcript = event.results[currentResult][0].transcript;
        searchInput.focus();
        searchInput.value = transcript;
        searchInput.dispatchEvent(inputEvent);
        voiceSearchBtn.classList.remove('is-recording');
      };

      speechRecognition.onerror = (event) => {
        console.error(event.error);
        voiceSearchBtn.classList.remove('is-recording');
      };

      speechRecognition.onend = (event) => {
        voiceSearchBtn.classList.remove('is-recording');
      };
    });
  },
};
