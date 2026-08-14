/**
 * Time Kairo - Core E-Commerce & Interactive Logic
 * Phone/WhatsApp: 0741565677 (International: +94741565677)
 * Address: Galedanda, Gonawala
 * Email: timekairo8@gmail.com
 */

// Global State
let products = getStoredProducts();
let cart = JSON.parse(localStorage.getItem("timekairo_cart")) || [];
let selectedQuickProduct = null;
let selectedSize = null;
let selectedColor = null;

// Theme Switcher System (Light / Dark Mode - Defaults to Light Theme for first-time visitors)
function initTheme() {
  const savedTheme = localStorage.getItem("timekairo_theme") || "light";
  const icon = document.getElementById("theme-toggle-icon");
  const mIcon = document.getElementById("mobile-theme-icon");
  const mText = document.getElementById("mobile-theme-text");
  const isLight = savedTheme === "light";
  document.body.classList.toggle("light-theme", isLight);
  document.documentElement.classList.toggle("light-theme", isLight);
  if (icon) {
    icon.className = isLight ? "fa-solid fa-moon text-lg text-indigo-500" : "fa-solid fa-sun text-lg text-amber-400";
  }
  if (mIcon) {
    mIcon.className = isLight ? "fa-solid fa-sun text-amber-400" : "fa-solid fa-moon text-indigo-400";
  }
  if (mText) {
    mText.innerText = isLight ? "Light Mode" : "Dark Mode";
  }
}

function toggleSiteTheme() {
  const isLight = document.body.classList.toggle("light-theme");
  document.documentElement.classList.toggle("light-theme", isLight);
  const icon = document.getElementById("theme-toggle-icon");
  const mIcon = document.getElementById("mobile-theme-icon");
  const mText = document.getElementById("mobile-theme-text");
  if (isLight) {
    localStorage.setItem("timekairo_theme", "light");
    if (icon) icon.className = "fa-solid fa-moon text-lg text-indigo-500";
    if (mIcon) mIcon.className = "fa-solid fa-sun text-amber-400";
    if (mText) mText.innerText = "Light Mode";
    showToast("☀️ Switched to Light Theme!");
  } else {
    localStorage.setItem("timekairo_theme", "dark");
    if (icon) icon.className = "fa-solid fa-sun text-lg text-amber-400";
    if (mIcon) mIcon.className = "fa-solid fa-moon text-indigo-400";
    if (mText) mText.innerText = "Dark Mode";
    showToast("🌙 Switched to Dark Theme!");
  }
}
window.toggleSiteTheme = toggleSiteTheme;
window.initTheme = initTheme;

// Immediate theme execution to prevent dark flash
if (document.body) {
  initTheme();
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderHomeProducts();
  renderShopProducts();
  updateCartUI();
  setupEventListeners();
  renderAdminProductTable();
  if (typeof renderAdminOrdersTable === "function") renderAdminOrdersTable();
  renderBrandInfoUI();
  if (typeof applySitePhotosUI === "function") applySitePhotosUI();
  if (typeof checkStreakReset === "function") checkStreakReset();
  if (typeof renderCustomerReviews === "function") renderCustomerReviews();

  // Check URL parameters for direct order tracking or direct product viewing:
  // e.g. ?product=TK-P01&size=XL&color=Black
  const urlParams = new URLSearchParams(window.location.search);
  const trackParam = urlParams.get("track");
  const productParam = urlParams.get("product") || urlParams.get("p");
  const sizeParam = urlParams.get("size");
  const colorParam = urlParams.get("color");
  
  if (trackParam) {
    switchPage("track");
    const trackInput = document.getElementById("track-search-input");
    if (trackInput) trackInput.value = trackParam;
    if (typeof searchAndTrackOrder === "function") searchAndTrackOrder(trackParam);
  } else if (productParam) {
    switchPage("shop");
    setTimeout(() => {
      openQuickView(productParam, sizeParam, colorParam);
    }, 400);
  } else {
    // Check URL hash for direct page navigation if present
    const hash = window.location.hash.replace("#", "");
    if (hash && hash.startsWith("track-")) {
      const orderIdFromHash = hash.replace("track-", "");
      switchPage("track");
      if (typeof searchAndTrackOrder === "function") searchAndTrackOrder(orderIdFromHash);
    } else if (hash && hash.startsWith("product-")) {
      const prodIdFromHash = hash.replace("product-", "");
      switchPage("shop");
      setTimeout(() => openQuickView(prodIdFromHash), 400);
    } else if (hash && document.getElementById(`page-${hash}`)) {
      switchPage(hash);
      if (hash === "track" && typeof searchAndTrackOrder === "function") {
        searchAndTrackOrder();
      }
    }
  }
});

/* ==========================================
   NAVIGATION & PAGE SWITCHING
   ========================================== */
function openAdminLoginModal() {
  const modal = document.getElementById("admin-login-modal");
  const input = document.getElementById("admin-pin-input");
  const error = document.getElementById("admin-pin-error");
  if (error) error.classList.add("hidden");
  if (input) input.value = "";
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    setTimeout(() => { if (input) input.focus(); }, 150);
  }
}
window.openAdminLoginModal = openAdminLoginModal;

function closeAdminLoginModal() {
  const modal = document.getElementById("admin-login-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}
window.closeAdminLoginModal = closeAdminLoginModal;

function submitAdminPin(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("admin-pin-input");
  const error = document.getElementById("admin-pin-error");
  const pin = input ? input.value.trim() : "";

  if (pin === "986964") {
    sessionStorage.setItem("admin_authenticated", "true");
    if (error) error.classList.add("hidden");
    closeAdminLoginModal();
    showToast("🔑 Owner Access Granted!");
    switchPage("admin");
  } else {
    if (error) error.classList.remove("hidden");
    showToast("❌ Incorrect Owner PIN Code!");
  }
}
window.submitAdminPin = submitAdminPin;

function switchPage(pageId) {
  // Always close mobile drawer menu when navigating
  if (typeof closeMobileMenu === "function") {
    closeMobileMenu();
  }

  if (pageId === "admin" && !sessionStorage.getItem("admin_authenticated")) {
    openAdminLoginModal();
    return;
  }

  if (pageId === "track" && !checkTrackAuthentication()) {
    return;
  }

  const sections = document.querySelectorAll(".page-section");
  sections.forEach(sec => sec.classList.remove("active"));

  const targetSection = document.getElementById(`page-${pageId}`);
  if (targetSection) {
    targetSection.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (pageId === "admin" && typeof renderAdminOrdersTable === "function") {
    renderAdminOrdersTable();
  } else if (pageId === "track" && typeof searchAndTrackOrder === "function") {
    searchAndTrackOrder();
  }

  // Update nav links active styling
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    if (link.dataset.page === pageId) {
      link.classList.add("text-cyan-400", "border-b-2", "border-cyan-400");
      link.classList.remove("text-gray-300");
    } else {
      link.classList.remove("text-cyan-400", "border-b-2", "border-cyan-400");
      link.classList.add("text-gray-300");
    }
  });

  // Close mobile drawer if open
  closeMobileMenu();
}

function logoutAdmin() {
  sessionStorage.removeItem("admin_authenticated");
  showToast("🔒 Owner Panel Logged Out");
  switchPage("home");
}

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  if (menu) menu.classList.toggle("hidden");
}

function closeMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  if (menu) menu.classList.add("hidden");
}

window.switchPage = switchPage;
window.logoutAdmin = logoutAdmin;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

/* ==========================================
   PRODUCT RENDERING LOGIC
   ========================================== */
function renderHomeProducts() {
  const container = document.getElementById("home-featured-grid");
  if (!container) return;

  const currentProducts = getStoredProducts();
  let featured = currentProducts.filter(p => p.isFeatured);
  if (featured.length === 0) {
    featured = currentProducts;
  }
  featured = featured.slice(0, 8);

  if (featured.length === 0) {
    container.innerHTML = `<p class="col-span-full text-center text-gray-400">No featured products found.</p>`;
    return;
  }

  container.innerHTML = featured.map(p => createProductCardHTML(p)).join("");
}

function renderShopProducts() {
  const container = document.getElementById("shop-products-grid");
  if (!container) return;

  const currentProducts = getStoredProducts();
  
  // Filter variables
  const categoryFilter = document.querySelector(".cat-btn.active")?.dataset.category || "all";
  const searchQuery = (document.getElementById("shop-search-input")?.value || "").toLowerCase().trim();
  const sortOption = document.getElementById("shop-sort-select")?.value || "featured";

  let filtered = currentProducts.filter(p => {
    const prodCat = (p.category || "").toLowerCase();
    const filterCat = (categoryFilter || "all").toLowerCase();
    const matchesCat = filterCat === "all" || prodCat === filterCat || prodCat.includes(filterCat) || filterCat.includes(prodCat);
    const matchesSearch = (p.name || "").toLowerCase().includes(searchQuery) || (p.description || "").toLowerCase().includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  // Sorting
  if (sortOption === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortOption === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortOption === "newest") {
    filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16 text-gray-400">
        <i class="fa-solid fa-box-open text-5xl mb-4 text-cyan-400 opacity-50"></i>
        <p class="text-xl font-medium">No items found matching your criteria</p>
        <button onclick="resetShopFilters()" class="mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded-full text-sm font-semibold transition">Clear Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => createProductCardHTML(p)).join("");
}

function createProductCardHTML(p) {
  const discountBadge = p.originalPrice > p.price 
    ? `<span class="bg-cyan-500 text-black font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">SALE</span>` 
    : (p.isNew ? `<span class="bg-amber-400 text-black font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">NEW DROP</span>` : '');

  return `
    <article class="product-card-item group relative liquid-glass-card rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
      <div>
        <div onclick="openQuickView('${p.id}')" class="relative w-full h-72 overflow-hidden product-img-box bg-slate-900/50 cursor-pointer">
          <img src="${p.image}" alt="${p.name} - Time Kairo premium T-shirt Sri Lanka" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy">
          <div class="absolute top-3 left-3 flex flex-col gap-2 z-10">
            ${discountBadge}
          </div>
          <!-- Quick view action bar -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-20">
            <button onclick="event.stopPropagation(); openQuickView('${p.id}')" class="bg-cyan-400 hover:bg-cyan-300 text-black font-bold p-3 rounded-full shadow-lg transform hover:scale-110 transition cursor-pointer" title="Quick View">
              <i class="fa-solid fa-eye text-lg"></i>
            </button>
            <button onclick="event.stopPropagation(); directAddToCart('${p.id}')" class="bg-white hover:bg-gray-200 text-black font-bold p-3 rounded-full shadow-lg transform hover:scale-110 transition cursor-pointer" title="Add to Cart">
              <i class="fa-solid fa-bag-shopping text-lg"></i>
            </button>
          </div>
        </div>
        <div class="p-5 product-card-body">
          <div class="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1 p-cat-tag">${p.category}</div>
          <h3 onclick="openQuickView('${p.id}')" class="font-heading text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 p-title cursor-pointer">${p.name}</h3>
          <p class="text-xs text-gray-400 mt-1 line-clamp-2 p-desc">${p.description}</p>
        </div>
      </div>
      <div class="px-5 pb-5 pt-0 flex items-center justify-between product-card-footer border-t border-gray-800/80 mt-2">
        <div class="pt-3">
          <span class="text-xl font-extrabold text-white p-price">LKR ${p.price.toLocaleString()}</span>
          ${p.originalPrice > p.price ? `<span class="text-xs text-gray-400 line-through ml-2 p-orig-price">LKR ${p.originalPrice.toLocaleString()}</span>` : ''}
        </div>
        <button onclick="openQuickView('${p.id}')" class="pt-3 text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider transition flex items-center gap-1 p-buy-btn cursor-pointer">
          Buy Now <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </article>
  `;
}

function resetShopFilters() {
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.classList.remove("active", "bg-cyan-400", "text-black");
    btn.classList.add("bg-gray-900", "text-gray-300");
  });
  const allBtn = document.querySelector('.cat-btn[data-category="all"]');
  if (allBtn) {
    allBtn.classList.add("active", "bg-cyan-400", "text-black");
  }
  const searchInput = document.getElementById("shop-search-input");
  if (searchInput) searchInput.value = "";
  renderShopProducts();
}

/* ==========================================
   QUICK VIEW MODAL & MULTI-IMAGE GALLERY
   ========================================== */
window.currentQuickViewImages = [];
window.currentQuickViewImageIndex = 0;

function openQuickView(productId, initialSize, initialColor) {
  const currentProducts = getStoredProducts();
  const product = currentProducts.find(p => p.id === productId);
  if (!product) return;

  selectedQuickProduct = product;
  
  if (initialSize && product.sizes && product.sizes.includes(initialSize)) {
    selectedSize = initialSize;
  } else {
    selectedSize = product.sizes ? product.sizes[0] : "Standard";
  }

  if (initialColor && product.colors && product.colors.includes(initialColor)) {
    selectedColor = initialColor;
  } else {
    selectedColor = product.colors ? product.colors[0] : "Standard";
  }

  // Setup images array (up to 5 photos)
  const productImages = (product.images && Array.isArray(product.images) && product.images.length > 0) 
    ? product.images 
    : [product.image || "images/tee.jpg"];

  window.currentQuickViewImages = productImages;
  window.currentQuickViewImageIndex = 0;

  const modal = document.getElementById("quickview-modal");
  const modalContent = document.getElementById("quickview-content");

  modalContent.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      
      <!-- Multi-Image Gallery Display Section -->
      <div class="space-y-4">
        <div id="quickview-main-container" class="relative rounded-2xl overflow-hidden bg-gray-900 h-72 sm:h-96 group shadow-2xl border border-gray-800 select-none">
          <img id="quickview-main-image" src="${productImages[0]}" alt="${product.name} - Time Kairo Sri Lanka" class="w-full h-full object-cover transition-all duration-300">
          
          ${productImages.length > 1 ? `
            <button type="button" onclick="changeQuickViewGalleryImage(-1)" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-cyan-400 hover:text-black text-cyan-300 flex items-center justify-center backdrop-blur-md transition-all shadow-xl z-10 cursor-pointer border border-cyan-500/30">
              <i class="fa-solid fa-chevron-left text-sm"></i>
            </button>
            <button type="button" onclick="changeQuickViewGalleryImage(1)" class="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-cyan-400 hover:text-black text-cyan-300 flex items-center justify-center backdrop-blur-md transition-all shadow-xl z-10 cursor-pointer border border-cyan-500/30">
              <i class="fa-solid fa-chevron-right text-sm"></i>
            </button>
            <div id="quickview-image-counter" class="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-bold px-3 py-1 rounded-full shadow-md">
              1 / ${productImages.length}
            </div>
          ` : ''}
          
          <span class="absolute top-3 left-3 bg-gray-900/90 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">${product.stock || 'In Stock'}</span>
          <span class="absolute bottom-3 left-3 bg-black/80 text-gray-300 border border-gray-700 text-[10px] font-mono px-2.5 py-1 rounded-full">SKU: ${product.id}</span>
        </div>

        <!-- Thumbnails Selector Row (Shows up to 5 photos) -->
        ${productImages.length > 1 ? `
          <div>
            <div class="text-[11px] font-extrabold uppercase tracking-widest text-cyan-400 mb-2 flex items-center gap-1.5">
              <i class="fa-solid fa-images text-xs"></i> View Photo Angles (${productImages.length} Available)
            </div>
            <div class="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none" id="quickview-thumbnails-row">
              ${productImages.map((imgUrl, idx) => `
                <button type="button" onclick="selectQuickViewGalleryImage(${idx})" class="qv-thumb-btn relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${idx === 0 ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105 opacity-100' : 'border-gray-800 opacity-60 hover:opacity-100 hover:border-gray-500'}">
                  <img src="${imgUrl}" alt="Photo ${idx + 1}" class="w-full h-full object-cover">
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Product Information Column -->
      <div class="flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start">
            <div>
              <span class="text-xs font-bold text-cyan-400 uppercase tracking-widest">${product.category}</span>
              <h2 class="font-heading text-2xl md:text-3xl font-extrabold text-white mt-1">${product.name}</h2>
            </div>
            <button onclick="closeQuickView()" class="text-gray-400 hover:text-white text-2xl font-bold p-1">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="my-4 flex items-baseline justify-between">
            <div>
              <span class="text-2xl md:text-3xl font-black text-cyan-400">LKR ${product.price.toLocaleString()}</span>
              ${product.originalPrice > product.price ? `<span class="text-sm text-gray-400 line-through ml-3">LKR ${product.originalPrice.toLocaleString()}</span>` : ''}
            </div>
          </div>
          <p class="text-gray-300 text-sm leading-relaxed mb-6">${product.description}</p>
          
          <!-- Size Selector -->
          ${product.sizes && product.sizes.length ? `
            <div class="mb-6">
              <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Size</label>
              <div class="flex flex-wrap gap-2" id="size-options">
                ${product.sizes.map((s) => `
                  <button onclick="selectSizeOption('${s}')" class="size-btn px-4 py-2 rounded-lg border text-sm font-bold transition ${s === selectedSize ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300' : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'}">${s}</button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Color Selector -->
          ${product.colors && product.colors.length ? `
            <div class="mb-6">
              <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Color Variant</label>
              <div class="flex flex-wrap gap-2" id="color-options">
                ${product.colors.map((c) => `
                  <button onclick="selectColorOption('${c}')" class="color-btn px-4 py-2 rounded-lg border text-xs font-bold transition ${c === selectedColor ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300' : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'}">${c}</button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="space-y-3 pt-4 border-t border-gray-800">
          <button onclick="addQuickViewToCart()" class="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-cyan-500/20 cursor-pointer">
            <i class="fa-solid fa-cart-plus text-base"></i> Add To Shopping Bag
          </button>
          <button onclick="orderDirectWhatsApp()" class="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 cursor-pointer">
            <i class="fa-brands fa-whatsapp text-lg"></i> Instant Order On WhatsApp
          </button>
          <button onclick="copyProductLink('${product.id}')" class="w-full bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700 font-bold py-2.5 rounded-xl text-xs uppercase flex items-center justify-center gap-2 transition cursor-pointer">
            <i class="fa-solid fa-share-nodes text-cyan-400"></i> Copy & Share Direct Product Link
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // Touch Swipe Gesture for Mobile Gallery Preview
  const mainContainer = document.getElementById("quickview-main-container");
  if (mainContainer) {
    let touchStartX = 0;
    mainContainer.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    mainContainer.addEventListener("touchend", (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          changeQuickViewGalleryImage(1); // Swipe left -> next image
        } else {
          changeQuickViewGalleryImage(-1); // Swipe right -> prev image
        }
      }
    }, { passive: true });
  }
}

function selectQuickViewGalleryImage(index) {
  if (!window.currentQuickViewImages || !window.currentQuickViewImages[index]) return;
  window.currentQuickViewImageIndex = index;
  const mainImg = document.getElementById("quickview-main-image");
  const counter = document.getElementById("quickview-image-counter");
  if (mainImg) {
    mainImg.src = window.currentQuickViewImages[index];
  }
  if (counter) {
    counter.innerText = `${index + 1} / ${window.currentQuickViewImages.length}`;
  }
  const thumbs = document.querySelectorAll(".qv-thumb-btn");
  thumbs.forEach((t, i) => {
    if (i === index) {
      t.className = "qv-thumb-btn relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer border-cyan-400 ring-2 ring-cyan-400/50 scale-105 opacity-100";
    } else {
      t.className = "qv-thumb-btn relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer border-gray-800 opacity-60 hover:opacity-100 hover:border-gray-500";
    }
  });
}

function changeQuickViewGalleryImage(delta) {
  if (!window.currentQuickViewImages || window.currentQuickViewImages.length === 0) return;
  let newIdx = window.currentQuickViewImageIndex + delta;
  if (newIdx < 0) newIdx = window.currentQuickViewImages.length - 1;
  if (newIdx >= window.currentQuickViewImages.length) newIdx = 0;
  selectQuickViewGalleryImage(newIdx);
}

window.selectQuickViewGalleryImage = selectQuickViewGalleryImage;
window.changeQuickViewGalleryImage = changeQuickViewGalleryImage;

function copyProductLink(productId) {
  const baseUrl = window.location.origin + window.location.pathname;
  const size = selectedSize || "Standard";
  const color = selectedColor || "Standard";
  const shareUrl = `${baseUrl}?product=${encodeURIComponent(productId)}&size=${encodeURIComponent(size)}&color=${encodeURIComponent(color)}`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast("📋 Direct Product Link copied to clipboard!");
    }).catch(() => {
      prompt("Copy product link below:", shareUrl);
    });
  } else {
    prompt("Copy product link below:", shareUrl);
  }
}
window.copyProductLink = copyProductLink;

function selectSizeOption(size) {
  selectedSize = size;
  document.querySelectorAll("#size-options .size-btn").forEach(btn => {
    if (btn.innerText.trim() === size) {
      btn.className = "size-btn px-4 py-2 rounded-lg border text-sm font-bold transition border-cyan-400 bg-cyan-400/20 text-cyan-300";
    } else {
      btn.className = "size-btn px-4 py-2 rounded-lg border text-sm font-bold transition border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500";
    }
  });
}

function selectColorOption(color) {
  selectedColor = color;
  document.querySelectorAll("#color-options .color-btn").forEach(btn => {
    if (btn.innerText.trim() === color) {
      btn.className = "color-btn px-4 py-2 rounded-lg border text-xs font-bold transition border-cyan-400 bg-cyan-400/20 text-cyan-300";
    } else {
      btn.className = "color-btn px-4 py-2 rounded-lg border text-xs font-bold transition border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500";
    }
  });
}

function closeQuickView() {
  const modal = document.getElementById("quickview-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

/* ==========================================
   CART MANAGEMENT LOGIC
   ========================================== */
function directAddToCart(productId) {
  const currentProducts = getStoredProducts();
  const product = currentProducts.find(p => p.id === productId);
  if (!product) return;

  addToCart(product, product.sizes ? product.sizes[0] : "Standard", product.colors ? product.colors[0] : "Standard");
}

function addQuickViewToCart() {
  if (selectedQuickProduct) {
    addToCart(selectedQuickProduct, selectedSize, selectedColor);
    closeQuickView();
  }
}

function addToCart(product, size, color) {
  const existingIndex = cart.findIndex(item => item.id === product.id && item.size === size && item.color === color);
  
  if (existingIndex > -1) {
    cart[existingIndex].qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: size,
      color: color,
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added ${product.name} (${size}) to your bag!`);
  openCartDrawer();
}

function updateQuantity(index, delta) {
  if (cart[index]) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
    updateCartUI();
  }
}

function removeFromCart(index) {
  if (cart[index]) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
    showToast("Item removed from bag.");
  }
}

function saveCart() {
  localStorage.setItem("timekairo_cart", JSON.stringify(cart));
}

function updateCartUI() {
  const cartBadge = document.getElementById("cart-count-badge");
  const cartItemsContainer = document.getElementById("cart-items-container");
  const cartSubtotalEl = document.getElementById("cart-subtotal");

  const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  if (cartBadge) {
    cartBadge.innerText = totalCount;
    cartBadge.style.display = totalCount > 0 ? "inline-flex" : "none";
  }

  if (cartSubtotalEl) {
    cartSubtotalEl.innerText = `LKR ${subtotal.toLocaleString()}`;
  }

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="text-center py-12 text-gray-400">
        <i class="fa-solid fa-bag-shopping text-4xl mb-3 text-cyan-400/50"></i>
        <p class="text-sm font-medium">Your shopping bag is empty</p>
        <button onclick="closeCartDrawer(); switchPage('shop')" class="mt-4 px-5 py-2 bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded-full text-xs font-bold uppercase tracking-wider">Browse Collection</button>
      </div>
    `;
    return;
  }

  cartItemsContainer.innerHTML = cart.map((item, idx) => `
    <div class="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-900/60 border border-gray-800">
      <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-bold text-white truncate">${item.name}</h4>
        <div class="text-xs text-gray-400 mt-0.5">Size: <span class="text-cyan-300 font-semibold">${item.size}</span> | LKR ${item.price.toLocaleString()}</div>
        <div class="flex items-center gap-2 mt-2">
          <button onclick="updateQuantity(${idx}, -1)" class="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center font-bold text-xs">-</button>
          <span class="text-xs font-bold text-white px-1">${item.qty}</span>
          <button onclick="updateQuantity(${idx}, 1)" class="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center font-bold text-xs">+</button>
        </div>
      </div>
      <div class="text-right">
        <div class="text-sm font-bold text-cyan-400">LKR ${(item.price * item.qty).toLocaleString()}</div>
        <button onclick="removeFromCart(${idx})" class="text-red-400 hover:text-red-300 text-xs mt-2" title="Remove">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function openCartDrawer() {
  document.getElementById("cart-drawer")?.classList.remove("translate-x-full");
  document.getElementById("cart-backdrop")?.classList.remove("hidden");
}

function closeCartDrawer() {
  document.getElementById("cart-drawer")?.classList.add("translate-x-full");
  document.getElementById("cart-backdrop")?.classList.add("hidden");
}

/* ==========================================
   WHATSAPP ORDER BUILDER & AUTOMATIC ORDER GENERATION
   ========================================== */
function orderDirectWhatsApp() {
  if (!selectedQuickProduct) return;

  const brand = getStoredBrandInfo();
  const phone = brand.whatsappPhone || "94741565677";
  const newOrderId = typeof generateOrderId === "function" ? generateOrderId() : `TK-${Math.floor(10000 + Math.random() * 90000)}`;
  const baseUrl = window.location.origin + window.location.pathname;
  const trackingLink = `${baseUrl}?track=${newOrderId}`;

  // Automatically save order locally and push to Firestore
  const now = new Date();
  const timeStr = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const autoOrder = {
    id: newOrderId,
    customerName: "Website Customer",
    customerPhone: "",
    address: "Pending Address Confirmation",
    items: [
      { name: selectedQuickProduct.name, size: selectedSize || "Standard", color: selectedColor || "Standard", price: selectedQuickProduct.price, qty: 1 }
    ],
    totalPrice: selectedQuickProduct.price,
    status: "placed",
    statusStep: 1,
    locationNote: "Order initiated via Website. Awaiting WhatsApp confirmation.",
    createdAt: timeStr,
    updatedAt: timeStr
  };

  if (typeof saveSingleOrder === "function") saveSingleOrder(autoOrder);
  if (typeof window.syncOrderToFirebase === "function") window.syncOrderToFirebase(autoOrder);

  const productLink = `${baseUrl}?product=${encodeURIComponent(selectedQuickProduct.id)}&size=${encodeURIComponent(selectedSize || 'Standard')}&color=${encodeURIComponent(selectedColor || 'Standard')}`;

  const message = `Hello TIME KAIRO! 👋\nI would like to order:\n\n📦 *Order ID*: #${newOrderId}\n📌 *Product*: ${selectedQuickProduct.name}\n🏷️ *Product SKU*: ${selectedQuickProduct.id}\n📏 *Selected Size*: ${selectedSize || 'Standard'}\n🎨 *Color Variant*: ${selectedColor || 'Standard'}\n💰 *Price*: LKR ${selectedQuickProduct.price.toLocaleString()}\n\n🔗 *Direct Product Link*:\n${productLink}\n\n📍 *Live Order Tracking Link*:\n${trackingLink}\n\n⏳ *${brand.slogan}*`;

  const encodedUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(encodedUrl, "_blank");
}

function checkoutCartWhatsApp() {
  if (cart.length === 0) {
    showToast("Your cart is empty!");
    return;
  }

  const brand = getStoredBrandInfo();
  const phone = brand.whatsappPhone || "94741565677";
  const newOrderId = typeof generateOrderId === "function" ? generateOrderId() : `TK-${Math.floor(10000 + Math.random() * 90000)}`;
  const baseUrl = window.location.origin + window.location.pathname;
  const trackingLink = `${baseUrl}?track=${newOrderId}`;

  let itemsText = cart.map((item, idx) => 
    `${idx + 1}. *${item.name}* (Size: ${item.size}) x ${item.qty} = LKR ${(item.price * item.qty).toLocaleString()}`
  ).join("\n");

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // Save auto order
  const now = new Date();
  const timeStr = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const autoOrder = {
    id: newOrderId,
    customerName: "Website Customer",
    customerPhone: "",
    address: "Pending Address Confirmation",
    items: JSON.parse(JSON.stringify(cart)),
    totalPrice: total,
    status: "placed",
    statusStep: 1,
    locationNote: "Cart Order placed via Website. Awaiting WhatsApp confirmation.",
    createdAt: timeStr,
    updatedAt: timeStr
  };

  if (typeof saveSingleOrder === "function") saveSingleOrder(autoOrder);
  if (typeof window.syncOrderToFirebase === "function") window.syncOrderToFirebase(autoOrder);

  const message = `Hello TIME KAIRO! 🛍️\nI would like to place an order from your website:\n\n📦 *Order ID*: #${newOrderId}\n\n${itemsText}\n\n💵 *Total Amount*: LKR ${total.toLocaleString()}\n\n📍 *Live Order Tracking Link*:\n${trackingLink}\n\n⏳ *${brand.slogan}*`;

  const encodedUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(encodedUrl, "_blank");
}

/* ==========================================
   LIVE ORDER TRACKING & OWNER CONTROLS
   ========================================== */
const TRACKING_REQUIRED_PASSCODE = "2002";
let activeTrackOrderId = null;

function isTrackUnlocked() {
  return localStorage.getItem("track_unlocked") === "true";
}

function checkTrackAuthentication() {
  renderTrackPageContent();
  return isTrackUnlocked();
}

function renderTrackPageContent() {
  const lockScreen = document.getElementById("track-password-screen");
  const mainContent = document.getElementById("track-main-content");
  const unlocked = isTrackUnlocked();

  if (lockScreen && mainContent) {
    if (unlocked) {
      lockScreen.classList.add("hidden");
      mainContent.classList.remove("hidden");
    } else {
      lockScreen.classList.remove("hidden");
      mainContent.classList.add("hidden");
    }
  }
}
window.renderTrackPageContent = renderTrackPageContent;

function verifyTrackPassword(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("track-passcode-input");
  const error = document.getElementById("track-passcode-error");
  const val = input ? input.value.trim() : "";

  if (val === TRACKING_REQUIRED_PASSCODE) {
    localStorage.setItem("track_unlocked", "true");
    if (error) error.classList.add("hidden");
    if (typeof showToast === "function") showToast("🔓 Live Tracking Access Unlocked!");
    renderTrackPageContent();
    if (typeof searchAndTrackOrder === "function") searchAndTrackOrder();
  } else {
    if (error) error.classList.remove("hidden");
    if (typeof showToast === "function") showToast("❌ Incorrect Passcode!");
  }
}
window.verifyTrackPassword = verifyTrackPassword;

function logoutTrackAccess() {
  localStorage.removeItem("track_unlocked");
  activeTrackOrderId = null;
  const searchInput = document.getElementById("track-search-input");
  if (searchInput) searchInput.value = "";
  renderTrackPageContent();
  if (typeof showToast === "function") showToast("🔒 Live Tracking View Locked");
}
window.logoutTrackAccess = logoutTrackAccess;

function searchAndTrackOrder(queryId) {
  const container = document.getElementById("tracking-result-container");
  if (!container) return;

  const orders = typeof getStoredOrders === "function" ? getStoredOrders() : [];
  const searchInput = document.getElementById("track-search-input");
  const query = (queryId || (searchInput ? searchInput.value : "")).trim().toUpperCase();

  if (!query) {
    if (orders.length > 0) {
      renderOrderTrackingUI(orders[0]);
      activeTrackOrderId = orders[0].id;
    } else {
      container.innerHTML = `
        <div class="text-center py-16 glass-panel rounded-3xl border border-gray-800">
          <i class="fa-solid fa-truck-ramp-box text-5xl text-gray-600 mb-4"></i>
          <h3 class="font-heading text-xl font-bold text-white">No Active Orders Yet</h3>
          <p class="text-xs text-gray-400 mt-2">Enter your Order ID above (e.g. TK-84920) to view your live tracking status.</p>
        </div>
      `;
    }
    return;
  }

  const matchedOrder = orders.find(o => 
    o.id.toUpperCase() === query || 
    (o.customerPhone && o.customerPhone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, '')))
  );

  if (matchedOrder) {
    activeTrackOrderId = matchedOrder.id;
    renderOrderTrackingUI(matchedOrder);
  } else {
    activeTrackOrderId = null;
    container.innerHTML = `
      <div class="text-center py-16 glass-panel rounded-3xl border border-red-500/30 bg-red-950/10">
        <i class="fa-solid fa-circle-exclamation text-5xl text-rose-500 mb-4 animate-bounce"></i>
        <h3 class="font-heading text-xl font-bold text-white">Order ID "${query}" Not Found</h3>
        <p class="text-xs text-gray-400 mt-2">Please double check your Order ID or contact the Time Kairo team on WhatsApp.</p>
        <a href="https://wa.me/94741565677?text=Hi%20Time%20Kairo!%20I%20am%20trying%20to%20track%20order%20${encodeURIComponent(query)}" target="_blank" class="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-full text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20">
          <i class="fa-brands fa-whatsapp text-base"></i> Ask Us On WhatsApp
        </a>
      </div>
    `;
  }
}

function handleCustomerTrackSearch(event) {
  event.preventDefault();
  const inputVal = document.getElementById("track-search-input").value;
  searchAndTrackOrder(inputVal);
}

function refreshActiveCustomerTracking() {
  if (activeTrackOrderId) {
    const orders = typeof getStoredOrders === "function" ? getStoredOrders() : [];
    const updatedOrder = orders.find(o => o.id === activeTrackOrderId);
    if (updatedOrder) {
      renderOrderTrackingUI(updatedOrder);
    }
  }
}

function renderOrderTrackingUI(order) {
  const container = document.getElementById("tracking-result-container");
  if (!container) return;

  const currentStep = order.statusStep || (order.status === "delivered" ? 4 : (order.status === "in_transit" ? 3 : (order.status === "processing" ? 2 : 1)));
  const progressPercent = ((currentStep - 1) / 3) * 100;

  let statusBadgeHTML = '';
  if (order.status === 'delivered') {
    statusBadgeHTML = `<span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"><i class="fa-solid fa-circle-check"></i> Delivered Successfully</span>`;
  } else if (order.status === 'in_transit') {
    statusBadgeHTML = `<span class="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"><i class="fa-solid fa-truck-fast animate-pulse"></i> In Transit / On The Way</span>`;
  } else if (order.status === 'processing') {
    statusBadgeHTML = `<span class="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"><i class="fa-solid fa-gears animate-spin"></i> Processing & Packing</span>`;
  } else {
    statusBadgeHTML = `<span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"><i class="fa-solid fa-box font-bold"></i> Order Received</span>`;
  }

  container.innerHTML = `
    <!-- MAIN LIVE STATUS CARD -->
    <div class="glass-panel p-6 sm:p-10 rounded-3xl border border-cyan-500/40 mb-8 bg-gradient-to-br from-gray-900/90 via-black to-cyan-950/20 shadow-2xl">
      
      <!-- Top Order Bar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <span class="text-[10px] font-black uppercase text-gray-400 tracking-widest">Time Kairo Official Live Tracking</span>
          <div class="flex flex-wrap items-center gap-3 mt-1">
            <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-white">ORDER #${order.id}</h2>
            ${statusBadgeHTML}
          </div>
          <p class="text-xs text-gray-400 mt-1">Placed on: <span class="text-gray-300 font-semibold">${order.createdAt || 'Recent'}</span></p>
        </div>

        <div class="flex items-center gap-3">
          <button onclick="copyTrackingLink('${order.id}')" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2">
            <i class="fa-solid fa-link"></i> Copy Tracking Link
          </button>
        </div>
      </div>

      <!-- VISUAL STEPPER TIMELINE -->
      <div class="py-10">
        <div class="relative max-w-3xl mx-auto px-4">
          
          <!-- Background Bar -->
          <div class="tracking-stepper-line mb-8">
            <div class="tracking-stepper-progress" style="width: ${progressPercent}%;"></div>
          </div>

          <!-- Step Nodes Grid -->
          <div class="grid grid-cols-4 gap-2 text-center relative z-10 -mt-14">
            
            <!-- Step 1: Order Placed -->
            <div class="flex flex-col items-center">
              <div class="tracking-step-dot ${currentStep >= 1 ? (currentStep > 1 ? 'completed' : 'active') : ''}">
                <i class="fa-solid ${currentStep > 1 ? 'fa-check text-sm' : 'fa-box text-sm'}"></i>
              </div>
              <h4 class="font-bold text-xs ${currentStep >= 1 ? 'text-cyan-300' : 'text-gray-500'} mt-3 uppercase tracking-wider">Order Placed</h4>
              <p class="text-[10px] text-gray-400 hidden sm:block mt-0.5">Confirmed & Queued</p>
            </div>

            <!-- Step 2: Processing -->
            <div class="flex flex-col items-center">
              <div class="tracking-step-dot ${currentStep >= 2 ? (currentStep > 2 ? 'completed' : 'active') : ''}">
                <i class="fa-solid ${currentStep > 2 ? 'fa-check text-sm' : 'fa-shirt text-sm'}"></i>
              </div>
              <h4 class="font-bold text-xs ${currentStep >= 2 ? 'text-cyan-300' : 'text-gray-500'} mt-3 uppercase tracking-wider">Processing</h4>
              <p class="text-[10px] text-gray-400 hidden sm:block mt-0.5">Quality Check & Packing</p>
            </div>

            <!-- Step 3: In Transit -->
            <div class="flex flex-col items-center">
              <div class="tracking-step-dot ${currentStep >= 3 ? (currentStep > 3 ? 'completed' : 'active') : ''}">
                <i class="fa-solid ${currentStep > 3 ? 'fa-check text-sm' : 'fa-truck-fast text-sm'}"></i>
              </div>
              <h4 class="font-bold text-xs ${currentStep >= 3 ? 'text-cyan-300' : 'text-gray-500'} mt-3 uppercase tracking-wider">On The Way</h4>
              <p class="text-[10px] text-gray-400 hidden sm:block mt-0.5">Handed to Courier</p>
            </div>

            <!-- Step 4: Delivered -->
            <div class="flex flex-col items-center">
              <div class="tracking-step-dot ${currentStep >= 4 ? 'completed active' : ''}">
                <i class="fa-solid ${currentStep >= 4 ? 'fa-check text-sm' : 'fa-house-flag text-sm'}"></i>
              </div>
              <h4 class="font-bold text-xs ${currentStep >= 4 ? 'text-emerald-400' : 'text-gray-500'} mt-3 uppercase tracking-wider">Delivered</h4>
              <p class="text-[10px] text-gray-400 hidden sm:block mt-0.5">Package Arrived</p>
            </div>

          </div>
        </div>
      </div>

      <!-- LIVE LOCATION & COURIER UPDATE BOX -->
      <div class="p-6 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-xl flex-shrink-0">
          <i class="fa-solid fa-location-dot animate-bounce"></i>
        </div>
        <div class="flex-1">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span class="text-xs font-black uppercase text-cyan-400 tracking-wider">Live Courier Location & Status Note</span>
            <span class="text-[10px] text-gray-400">Last Updated: ${order.updatedAt || 'Just Now'}</span>
          </div>
          <p class="text-sm font-bold text-white mt-1 leading-relaxed">${order.locationNote || 'Package prepared at Time Kairo HQ.'}</p>
        </div>
      </div>

    </div>

    <!-- ORDER DETAILS & ITEMS LIST GRID -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Items Summary (2 Cols) -->
      <div class="md:col-span-2 glass-panel p-6 rounded-3xl border border-gray-800">
        <h3 class="font-heading text-lg font-bold text-white mb-4 uppercase flex items-center gap-2">
          <i class="fa-solid fa-bag-shopping text-cyan-400"></i> Items Included In Order
        </h3>
        
        <div class="space-y-3">
          ${(order.items || []).map(item => `
            <div class="flex items-center justify-between p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-sm">
                  <i class="fa-solid fa-shirt"></i>
                </div>
                <div>
                  <h4 class="font-bold text-white text-sm">${item.name}</h4>
                  <p class="text-xs text-gray-400">Size: <span class="text-cyan-300 font-bold">${item.size || 'Standard'}</span> ${item.color ? `| Color: ${item.color}` : ''}</p>
                </div>
              </div>
              <div class="text-right">
                <div class="font-black text-cyan-400 text-sm">LKR ${(item.price * (item.qty || 1)).toLocaleString()}</div>
                <div class="text-[10px] text-gray-400">Qty: ${item.qty || 1}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="mt-6 pt-4 border-t border-gray-800 flex justify-between items-center">
          <span class="text-xs uppercase text-gray-400 font-extrabold">Total Amount</span>
          <span class="font-heading text-2xl font-black text-white">LKR ${(order.totalPrice || 0).toLocaleString()}</span>
        </div>
      </div>

      <!-- Customer Info Card (1 Col) -->
      <div class="glass-panel p-6 rounded-3xl border border-gray-800 flex flex-col justify-between">
        <div>
          <h3 class="font-heading text-lg font-bold text-white mb-4 uppercase flex items-center gap-2">
            <i class="fa-solid fa-user-check text-cyan-400"></i> Shipping Details
          </h3>

          <div class="space-y-3 text-xs">
            <div>
              <span class="text-gray-400 block uppercase font-bold text-[10px]">Customer Name</span>
              <span class="text-white font-bold text-sm">${order.customerName || 'Customer'}</span>
            </div>
            <div>
              <span class="text-gray-400 block uppercase font-bold text-[10px]">Contact Phone</span>
              <span class="text-cyan-300 font-bold text-sm">${order.customerPhone || 'N/A'}</span>
            </div>
            <div>
              <span class="text-gray-400 block uppercase font-bold text-[10px]">Delivery Address</span>
              <span class="text-gray-200 font-medium text-xs leading-relaxed block mt-0.5">${order.address || 'Sri Lanka'}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-800">
          <a href="https://wa.me/94741565677?text=${encodeURIComponent(`Hi Time Kairo! I am inquiring about my Order #${order.id}`)}" target="_blank" class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl uppercase tracking-wider text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
            <i class="fa-brands fa-whatsapp text-lg"></i> Need Order Help? Chat Us
          </a>
        </div>
      </div>

    </div>
  `;
}

/* ==========================================
   OWNER ADMIN ORDERS CONTROL PANEL
   ========================================== */
function renderAdminOrdersTable() {
  const container = document.getElementById("admin-orders-container");
  if (!container) return;

  const orders = typeof getStoredOrders === "function" ? getStoredOrders() : [];

  if (orders.length === 0) {
    container.innerHTML = `<p class="text-center py-8 text-gray-400 text-xs">No orders created yet. Click "Create Manual Order" above.</p>`;
    return;
  }

  container.innerHTML = orders.map(order => {
    const isCustom = order.isCustomOrder || (order.id && order.id.includes("CUST"));
    const customItem = isCustom && order.items ? order.items[0] : null;

    return `
      <div class="p-5 rounded-2xl bg-gray-900/80 border ${isCustom ? 'border-cyan-500/40 bg-gradient-to-r from-cyan-950/20 via-gray-900 to-gray-900' : 'border-gray-800'} space-y-4">
        
        <!-- Order Top Info Bar -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-800/80">
          <div class="flex flex-wrap items-center gap-3">
            <span class="font-heading font-black text-lg text-cyan-400">#${order.id}</span>
            ${isCustom ? `<span class="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><i class="fa-solid fa-wand-magic-sparkles"></i> Custom Order</span>` : ''}
            <span class="text-xs text-white font-bold">${order.customerName}</span>
            <span class="text-xs text-gray-400">(${order.customerPhone || 'Phone N/A'})</span>
          </div>
          <div class="text-xs font-bold text-gray-300">
            Total: <span class="text-white">LKR ${(order.totalPrice || 0).toLocaleString()}</span>
          </div>
        </div>

        ${customItem ? `
        <!-- Custom T-Shirt Details & Artwork Preview Bar -->
        <div class="p-3 rounded-xl bg-gray-950 border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            ${customItem.photoUrl ? `
              <img src="${customItem.photoUrl}" class="w-14 h-14 object-cover rounded-lg border border-cyan-500/40 flex-shrink-0">
            ` : `
              <div class="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg flex-shrink-0">
                <i class="fa-solid fa-shirt"></i>
              </div>
            `}
            <div class="text-xs space-y-0.5">
              <div class="font-bold text-white">${customItem.name} (${customItem.size || 'M'}, ${customItem.color || 'Black'})</div>
              <div class="text-cyan-300 font-semibold text-[11px]">Placement: ${customItem.placement || 'Front Center'}</div>
              ${customItem.customText ? `<div class="text-amber-300 text-[11px]">Print Text: "${customItem.customText}"</div>` : ''}
              ${customItem.notes ? `<div class="text-gray-400 text-[11px]">Notes: ${customItem.notes}</div>` : ''}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Status & Courier Note Controls -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          <!-- Status Dropdown -->
          <div>
            <label class="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">Live Order Status</label>
            <select id="admin-status-${order.id}" class="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none">
              <option value="placed" ${order.status === 'placed' ? 'selected' : ''}>Order Placed 📦 (Step 1)</option>
              <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing & Packing ⚙️ (Step 2)</option>
              <option value="in_transit" ${order.status === 'in_transit' ? 'selected' : ''}>On The Way / In Transit 🚚 (Step 3)</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered ✅ (Step 4)</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled ❌</option>
            </select>
          </div>

          <!-- Location Note Input -->
          <div>
            <label class="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">Current Courier Location / Note</label>
            <input type="text" id="admin-location-${order.id}" value="${order.locationNote || ''}" placeholder="e.g. Colombo Hub - Dispatched" class="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none">
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-2 pt-4 md:pt-0">
            <button onclick="openAdminOrderTracking('${order.id}')" class="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow" title="Open Live Tracking Page">
              <i class="fa-solid fa-eye"></i> <span>View Live Tracking</span>
            </button>
            <button onclick="updateAdminOrderStatus('${order.id}')" class="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition shadow">
              <i class="fa-solid fa-floppy-disk"></i> Save & Sync
            </button>
            <button onclick="shareTrackingWhatsApp('${order.id}')" class="p-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/40 rounded-xl text-xs transition" title="Share via WhatsApp">
              <i class="fa-brands fa-whatsapp text-lg"></i>
            </button>
            <button onclick="copyTrackingLink('${order.id}')" class="p-2 bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs transition" title="Copy Live Link">
              <i class="fa-solid fa-link"></i>
            </button>
          </div>

        </div>

      </div>
    `;
  }).join('');
}

function getWebsiteBaseUrl() {
  const brand = typeof getStoredBrandInfo === "function" ? getStoredBrandInfo() : {};
  if (brand.websiteUrl && brand.websiteUrl.startsWith("http")) {
    return brand.websiteUrl.endsWith("/") ? brand.websiteUrl.slice(0, -1) : brand.websiteUrl;
  }
  if (window.location && window.location.href) {
    return window.location.href.split('#')[0].split('?')[0];
  }
  return window.location.origin + window.location.pathname;
}

function openAdminOrderTracking(orderId) {
  localStorage.setItem("track_unlocked", "true");
  sessionStorage.setItem("track_authenticated", "true");
  switchPage('track');
  const trackInput = document.getElementById("track-search-input");
  if (trackInput) trackInput.value = orderId;
  if (typeof searchAndTrackOrder === "function") searchAndTrackOrder(orderId);
  showToast(`👁️ Viewing Live Tracking for Order #${orderId}`);
}

function updateAdminOrderStatus(orderId) {
  const orders = typeof getStoredOrders === "function" ? getStoredOrders() : [];
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const statusSelect = document.getElementById(`admin-status-${orderId}`);
  const locationInput = document.getElementById(`admin-location-${orderId}`);

  if (statusSelect) order.status = statusSelect.value;
  if (locationInput) order.locationNote = locationInput.value.trim();

  if (order.status === "delivered") order.statusStep = 4;
  else if (order.status === "in_transit") order.statusStep = 3;
  else if (order.status === "processing") order.statusStep = 2;
  else order.statusStep = 1;

  const now = new Date();
  order.updatedAt = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (typeof saveSingleOrder === "function") saveSingleOrder(order);

  if (typeof window.syncOrderToFirebase === "function") {
    window.syncOrderToFirebase(order);
  }

  renderAdminOrdersTable();
  if (activeTrackOrderId === orderId) {
    renderOrderTrackingUI(order);
  }

  showToast(`⚡ Order #${orderId} status updated live!`);
}

function copyTrackingLink(orderId) {
  const baseUrl = getWebsiteBaseUrl();
  const link = `${baseUrl}?track=${orderId}`;

  navigator.clipboard.writeText(link).then(() => {
    showToast(`📋 Live Tracking Link copied for Order #${orderId}!`);
  }).catch(() => {
    prompt("Copy this Live Tracking Link:", link);
  });
}

function shareTrackingWhatsApp(orderId) {
  const orders = typeof getStoredOrders === "function" ? getStoredOrders() : [];
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const baseUrl = getWebsiteBaseUrl();
  const trackingLink = `${baseUrl}?track=${orderId}`;

  const message = `Hello ${order.customerName}! 👋\nTrack your TIME KAIRO order live here:\n\n📦 *Order ID*: #${order.id}\n🚚 *Status*: ${order.status.toUpperCase()}\n📍 *Location*: ${order.locationNote || 'In Progress'}\n\n👉 *Live Tracking Link*:\n${trackingLink}\n\nWear Beyond Time ⏳`;

  let phone = (order.customerPhone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith("0")) phone = "94" + phone.slice(1);

  const waUrl = `https://wa.me/${phone || '94741565677'}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, "_blank");
}

function openCreateOrderModal() {
  const modal = document.getElementById("create-order-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closeCreateOrderModal() {
  const modal = document.getElementById("create-order-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function handleCreateOrderSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("order-customer-name").value.trim();
  const phone = document.getElementById("order-customer-phone").value.trim();
  const address = document.getElementById("order-customer-address").value.trim();
  const itemDesc = document.getElementById("order-item-desc").value.trim();
  const totalPrice = parseFloat(document.getElementById("order-total-price").value) || 0;
  const status = document.getElementById("order-initial-status").value;
  const locationNote = document.getElementById("order-initial-location").value.trim() || "Time Kairo HQ";

  const newOrderId = typeof generateOrderId === "function" ? generateOrderId() : `TK-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date();
  const timeStr = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newOrder = {
    id: newOrderId,
    customerName: name,
    customerPhone: phone,
    address: address,
    items: [
      { name: itemDesc, size: "Standard", price: totalPrice, qty: 1 }
    ],
    totalPrice: totalPrice,
    status: status,
    statusStep: status === 'delivered' ? 4 : (status === 'in_transit' ? 3 : (status === 'processing' ? 2 : 1)),
    locationNote: locationNote,
    createdAt: timeStr,
    updatedAt: timeStr
  };

  if (typeof saveSingleOrder === "function") saveSingleOrder(newOrder);

  if (typeof window.syncOrderToFirebase === "function") {
    window.syncOrderToFirebase(newOrder);
  }

  renderAdminOrdersTable();
  closeCreateOrderModal();
  document.getElementById("create-order-form").reset();

  showToast(`✨ New Order #${newOrderId} Created!`);
  copyTrackingLink(newOrderId);
}

/* ==========================================
   ADMIN PRODUCT MANAGEMENT
   ========================================== */
function handleAddProduct(event) {
  event.preventDefault();

  const name = document.getElementById("admin-name").value.trim();
  const category = document.getElementById("admin-category").value;
  const price = parseFloat(document.getElementById("admin-price").value);
  const origPrice = parseFloat(document.getElementById("admin-orig-price").value) || price;
  const description = document.getElementById("admin-desc").value.trim();
  const sizesInput = document.getElementById("admin-sizes").value.trim();
  const imgUrlInput = document.getElementById("admin-img-url").value.trim();
  const imgFileInput = document.getElementById("admin-img-file");

  const sizes = sizesInput ? sizesInput.split(",").map(s => s.trim()) : ["S", "M", "L", "XL"];

  const processSave = (imagesArray) => {
    const validImages = Array.isArray(imagesArray) && imagesArray.length > 0 
      ? imagesArray 
      : [typeof imagesArray === "string" && imagesArray ? imagesArray : "images/tee.jpg"];
    
    const primaryImage = validImages[0] || "images/tee.jpg";

    const newProduct = {
      id: "tk-custom-" + Date.now(),
      name: name,
      category: category,
      price: price,
      originalPrice: origPrice,
      image: primaryImage,
      images: validImages,
      description: description,
      sizes: sizes,
      colors: ["Standard"],
      isNew: true,
      isFeatured: true,
      stock: "In Stock"
    };

    if (typeof removeDeletedProduct === "function") {
      removeDeletedProduct(newProduct);
    }

    products = getStoredProducts();
    products.unshift(newProduct);
    saveProducts(products);

    if (typeof window.syncProductToFirebase === "function") {
      window.syncProductToFirebase(newProduct);
    }

    renderHomeProducts();
    renderShopProducts();
    renderAdminProductTable();

    document.getElementById("admin-add-form").reset();
    showToast(`✨ New Clothing Item Added With ${validImages.length} Photo(s)!`);
  };

  // Check if multiple file photos uploaded (up to 5 photos)
  if (imgFileInput && imgFileInput.files && imgFileInput.files.length > 0) {
    const selectedFiles = Array.from(imgFileInput.files).slice(0, 5);
    const readPromises = selectedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(results => {
      const filteredResults = results.filter(Boolean);
      processSave(filteredResults.length > 0 ? filteredResults : ["images/tee.jpg"]);
    });
  } else if (imgUrlInput) {
    const urlList = imgUrlInput.split(",").map(u => u.trim()).filter(Boolean).slice(0, 5);
    processSave(urlList.length > 0 ? urlList : ["images/tee.jpg"]);
  } else {
    processSave(["images/tee.jpg"]);
  }
}

function deleteAdminProduct(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    const currentProducts = getStoredProducts();
    const targetProduct = currentProducts.find(p => String(p.id) === String(id)) ||
                          currentProducts.find(p => p.name && p.name.toLowerCase().trim() === String(id).toLowerCase().trim());
    const prodRef = targetProduct || id;

    if (typeof addDeletedProduct === "function") {
      addDeletedProduct(prodRef);
    }

    products = currentProducts.filter(p => {
      if (String(p.id) === String(id)) return false;
      if (targetProduct && String(p.id) === String(targetProduct.id)) return false;
      if (targetProduct && targetProduct.name && p.name && p.name.toLowerCase().trim() === targetProduct.name.toLowerCase().trim()) return false;
      return true;
    });
    saveProducts(products);
    
    if (typeof window.deleteProductFromFirebase === "function") {
      window.deleteProductFromFirebase(prodRef);
    }

    renderHomeProducts();
    renderShopProducts();
    renderAdminProductTable();
    showToast("Product deleted.");
  }
}

function resetCatalogToDefault() {
  if (confirm("Reset catalog back to original seed items?")) {
    if (typeof clearDeletedProductIds === "function") {
      clearDeletedProductIds();
    }
    localStorage.removeItem("timekairo_products");
    products = getStoredProducts();
    renderHomeProducts();
    renderShopProducts();
    renderAdminProductTable();
    showToast("Catalog reset to default!");
  }
}


function renderAdminProductTable() {
  const tbody = document.getElementById("admin-products-table-body");
  if (!tbody) return;

  const currentProducts = getStoredProducts();
  tbody.innerHTML = currentProducts.map(p => `
    <tr class="border-b border-gray-800 hover:bg-gray-900/50">
      <td class="p-3">
        <img src="${p.image}" class="w-12 h-12 object-cover rounded-lg">
      </td>
      <td class="p-3 font-bold text-white">${p.name}</td>
      <td class="p-3 text-xs uppercase text-cyan-400 font-semibold">${p.category}</td>
      <td class="p-3 font-bold text-gray-200">LKR ${p.price.toLocaleString()}</td>
      <td class="p-3 text-right">
        <button onclick="deleteAdminProduct('${p.id}')" class="px-3 py-1 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg text-xs font-bold transition">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

/* ==========================================
   EVENT LISTENERS & UTILITIES
   ========================================== */
function setupEventListeners() {
  // Category filter buttons
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".cat-btn").forEach(b => {
        b.classList.remove("active", "bg-cyan-400", "text-black");
        b.classList.add("bg-gray-900", "text-gray-300");
      });
      btn.classList.add("active", "bg-cyan-400", "text-black");
      renderShopProducts();
    });
  });

  // Search input
  const searchInput = document.getElementById("shop-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", renderShopProducts);
  }

  // Sort dropdown
  const sortSelect = document.getElementById("shop-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", renderShopProducts);
  }
}

function sendContactWhatsApp(event) {
  event.preventDefault();
  const brand = getStoredBrandInfo();
  const name = document.getElementById("contact-name").value;
  const message = document.getElementById("contact-msg").value;
  const waUrl = `https://wa.me/${brand.whatsappPhone || '94741565677'}?text=${encodeURIComponent(`Hi Time Kairo! My name is ${name}.\n\nMessage: ${message}`)}`;
  window.open(waUrl, "_blank");
}

function showToast(msg) {
  let toast = document.getElementById("toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notification";
    toast.className = "fixed bottom-6 right-6 bg-cyan-400 text-black font-extrabold px-5 py-3 rounded-xl shadow-2xl z-50 transition-all duration-300 opacity-0 translate-y-4 flex items-center gap-3";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check text-xl"></i> <span>${msg}</span>`;
  toast.classList.remove("opacity-0", "translate-y-4");
  
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-4");
  }, 3000);
}

/* ==========================================
   DYNAMIC BRAND & CONTACT INFO RENDERER
   ========================================== */
function renderBrandInfoUI() {
  const brand = typeof getStoredBrandInfo === 'function' ? getStoredBrandInfo() : {};
  if (!brand.phone) return;

  // 1. Announcement Ticker
  const tickerPhone = document.getElementById("ticker-phone");
  if (tickerPhone) tickerPhone.innerText = brand.phone;
  const tickerAddress = document.getElementById("ticker-address");
  if (tickerAddress) tickerAddress.innerText = brand.address.toUpperCase();
  const tickerSlogan = document.getElementById("ticker-slogan");
  if (tickerSlogan) tickerSlogan.innerText = brand.slogan.toUpperCase();

  // 2. Header Navigation
  const navWaLink = document.getElementById("nav-wa-link");
  if (navWaLink) navWaLink.href = `https://wa.me/${brand.whatsappPhone || '94741565677'}`;
  const navWaPhone = document.getElementById("nav-wa-phone");
  if (navWaPhone) navWaPhone.innerText = brand.phone;

  // 3. Hero Section
  const heroWaBtn = document.getElementById("hero-wa-btn");
  if (heroWaBtn) heroWaBtn.href = `https://wa.me/${brand.whatsappPhone || '94741565677'}?text=${encodeURIComponent('Hi Time Kairo! I want to inquire about your latest clothing drops.')}`;
  const heroWaPhone = document.getElementById("hero-wa-phone");
  if (heroWaPhone) heroWaPhone.innerText = brand.phone;

  // 4. About Us Section
  const aboutMotto = document.getElementById("about-motto");
  if (aboutMotto) aboutMotto.innerText = `"${brand.slogan.toUpperCase()}"`;
  const aboutImg = document.getElementById("about-img");
  if (aboutImg) aboutImg.src = brand.aboutImage || "images/hero.jpg";
  const aboutPhilosophy = document.getElementById("about-philosophy-text");
  if (aboutPhilosophy && brand.aboutPhilosophy) {
    const paragraphs = brand.aboutPhilosophy.split('\n\n').filter(p => p.trim());
    aboutPhilosophy.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
  }
  const stat1Val = document.getElementById("stat1-val");
  if (stat1Val) stat1Val.innerText = brand.stat1Value || "100%";
  const stat1Lbl = document.getElementById("stat1-lbl");
  if (stat1Lbl) stat1Lbl.innerText = brand.stat1Label || "Premium Quality";

  const stat2Val = document.getElementById("stat2-val");
  if (stat2Val) stat2Val.innerText = brand.stat2Value || "280+ GSM";
  const stat2Lbl = document.getElementById("stat2-lbl");
  if (stat2Lbl) stat2Lbl.innerText = brand.stat2Label || "Heavyweight Fabric";

  const stat3Val = document.getElementById("stat3-val");
  if (stat3Val) stat3Val.innerText = brand.stat3Value || "Islandwide";
  const stat3Lbl = document.getElementById("stat3-lbl");
  if (stat3Lbl) stat3Lbl.innerText = brand.stat3Label || "Fast Shipping";

  // 5. Contact Us Cards
  const contactWaCard = document.getElementById("contact-wa-card");
  if (contactWaCard) contactWaCard.href = `https://wa.me/${brand.whatsappPhone || '94741565677'}`;
  const contactPhoneVal = document.getElementById("contact-phone-val");
  if (contactPhoneVal) contactPhoneVal.innerText = brand.phone;

  const contactAddressVal = document.getElementById("contact-address-val");
  if (contactAddressVal) contactAddressVal.innerText = brand.address;

  const contactEmailCard = document.getElementById("contact-email-card");
  if (contactEmailCard) contactEmailCard.href = `mailto:${brand.email}`;
  const contactEmailVal = document.getElementById("contact-email-val");
  if (contactEmailVal) contactEmailVal.innerText = brand.email;

  // Social Grid
  const socialWa = document.getElementById("social-wa-link");
  if (socialWa) {
    socialWa.href = `https://wa.me/${brand.whatsappPhone || '94741565677'}`;
    const handle = socialWa.querySelector(".social-handle");
    if (handle) handle.innerText = brand.phone;
  }
  const socialTiktok = document.getElementById("social-tiktok-link");
  if (socialTiktok) {
    socialTiktok.href = brand.tiktokUrl;
    const handle = socialTiktok.querySelector(".social-handle");
    if (handle) handle.innerText = brand.tiktokHandle || "@timekairo";
  }
  const socialIg = document.getElementById("social-ig-link");
  if (socialIg) {
    socialIg.href = brand.instagramUrl;
    const handle = socialIg.querySelector(".social-handle");
    if (handle) handle.innerText = brand.instagramHandle || "@timekairo";
  }
  const socialFb = document.getElementById("social-fb-link");
  if (socialFb) {
    socialFb.href = brand.facebookUrl;
    const handle = socialFb.querySelector(".social-handle");
    if (handle) handle.innerText = brand.facebookHandle || "Time Kairo Official";
  }

  // 6. Admin APK Download Button
  const adminApkBtn = document.getElementById("admin-apk-btn");
  if (adminApkBtn) adminApkBtn.href = brand.apkDownloadUrl;

  // 7. Admin Brand Form Prefill
  const inputPhone = document.getElementById("admin-brand-phone");
  if (inputPhone && !inputPhone.dataset.userEdited) inputPhone.value = brand.phone;
  const inputWa = document.getElementById("admin-brand-wa");
  if (inputWa && !inputWa.dataset.userEdited) inputWa.value = brand.whatsappPhone;
  const inputAddress = document.getElementById("admin-brand-address");
  if (inputAddress && !inputAddress.dataset.userEdited) inputAddress.value = brand.address;
  const inputEmail = document.getElementById("admin-brand-email");
  if (inputEmail && !inputEmail.dataset.userEdited) inputEmail.value = brand.email;
  const inputSlogan = document.getElementById("admin-brand-slogan");
  if (inputSlogan && !inputSlogan.dataset.userEdited) inputSlogan.value = brand.slogan;
  const inputAbout = document.getElementById("admin-brand-about");
  if (inputAbout && !inputAbout.dataset.userEdited) inputAbout.value = brand.aboutPhilosophy;
  const inputAboutImgUrl = document.getElementById("admin-brand-about-img-url");
  if (inputAboutImgUrl && !inputAboutImgUrl.dataset.userEdited) inputAboutImgUrl.value = brand.aboutImage || "";
  const inputTiktok = document.getElementById("admin-brand-tiktok");
  if (inputTiktok && !inputTiktok.dataset.userEdited) inputTiktok.value = brand.tiktokUrl;
  const inputIg = document.getElementById("admin-brand-ig");
  if (inputIg && !inputIg.dataset.userEdited) inputIg.value = brand.instagramUrl;
  const inputFb = document.getElementById("admin-brand-fb");
  if (inputFb && !inputFb.dataset.userEdited) inputFb.value = brand.facebookUrl;
  const inputApk = document.getElementById("admin-brand-apk");
  if (inputApk && !inputApk.dataset.userEdited) inputApk.value = brand.apkDownloadUrl;
  const inputWebUrl = document.getElementById("admin-brand-weburl");
  if (inputWebUrl && !inputWebUrl.dataset.userEdited) inputWebUrl.value = brand.websiteUrl || "";

  // 8. Footer
  const footerSlogan = document.getElementById("footer-slogan");
  if (footerSlogan) footerSlogan.innerText = `"${brand.slogan.toUpperCase()}"`;

  const footerWaLink = document.getElementById("footer-wa-link");
  if (footerWaLink) footerWaLink.href = `https://wa.me/${brand.whatsappPhone || '94741565677'}`;
  const footerWaPhone = document.getElementById("footer-wa-phone");
  if (footerWaPhone) footerWaPhone.innerText = brand.phone;

  const footerAddress = document.getElementById("footer-address");
  if (footerAddress) footerAddress.innerText = brand.address;

  const footerEmailLink = document.getElementById("footer-email-link");
  if (footerEmailLink) footerEmailLink.href = `mailto:${brand.email}`;
  const footerEmailVal = document.getElementById("footer-email-val");
  if (footerEmailVal) footerEmailVal.innerText = brand.email;

  const footerTiktok = document.getElementById("footer-tiktok-link");
  if (footerTiktok) footerTiktok.href = brand.tiktokUrl;
  const footerIg = document.getElementById("footer-ig-link");
  if (footerIg) footerIg.href = brand.instagramUrl;
  const footerFb = document.getElementById("footer-fb-link");
  if (footerFb) footerFb.href = brand.facebookUrl;
}

function handleSaveBrandInfo(event) {
  event.preventDefault();

  const phone = document.getElementById("admin-brand-phone").value.trim();
  let whatsappPhone = document.getElementById("admin-brand-wa").value.trim();
  if (!whatsappPhone) {
    whatsappPhone = phone.replace(/[^0-9]/g, '');
    if (whatsappPhone.startsWith("0")) whatsappPhone = "94" + whatsappPhone.slice(1);
  }
  const address = document.getElementById("admin-brand-address").value.trim();
  const email = document.getElementById("admin-brand-email").value.trim();
  const slogan = document.getElementById("admin-brand-slogan").value.trim();
  const aboutPhilosophy = document.getElementById("admin-brand-about").value.trim();
  const tiktokUrl = document.getElementById("admin-brand-tiktok").value.trim();
  const instagramUrl = document.getElementById("admin-brand-ig").value.trim();
  const facebookUrl = document.getElementById("admin-brand-fb").value.trim();
  const apkDownloadUrl = document.getElementById("admin-brand-apk").value.trim();
  const websiteUrl = document.getElementById("admin-brand-weburl") ? document.getElementById("admin-brand-weburl").value.trim() : "";
  const aboutImgUrl = document.getElementById("admin-brand-about-img-url") ? document.getElementById("admin-brand-about-img-url").value.trim() : "";
  const fileInput = document.getElementById("admin-brand-about-img-file");

  const saveFinalBrandInfo = (finalAboutImg) => {
    const updatedInfo = saveBrandInfo({
      phone,
      whatsappPhone,
      address,
      email,
      slogan,
      aboutPhilosophy,
      aboutImage: finalAboutImg,
      tiktokUrl,
      instagramUrl,
      facebookUrl,
      apkDownloadUrl,
      websiteUrl
    });

    renderBrandInfoUI();

    if (typeof window.syncBrandInfoToFirebase === "function") {
      window.syncBrandInfoToFirebase(updatedInfo);
    }

    showToast("⚙️ Brand & Contact Details Saved Successfully!");
  };

  if (fileInput && fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      saveFinalBrandInfo(e.target.result);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    const existing = getStoredBrandInfo();
    const finalAboutImg = aboutImgUrl || existing.aboutImage || "images/hero.jpg";
    saveFinalBrandInfo(finalAboutImg);
  }
}

/* ==========================================
   CUSTOM T-SHIRT STUDIO LOGIC & WHATSAPP SYNC
   ========================================== */
let customStudioState = {
  garmentType: "280GSM Heavyweight Oversized Tee",
  colorHex: "#121218",
  colorName: "Obsidian Black",
  size: "M",
  qty: 1,
  placement: "front-center",
  placementName: "Front Center Chest",
  view: "front",
  photoDataUrl: "",
  photoFilename: "",
  text: "",
  font: "'Syne', sans-serif",
  scale: 100,
  notes: ""
};

function setCustomGarmentType(typeKey, typeName) {
  customStudioState.garmentType = typeName;
  document.querySelectorAll(".garment-type-btn").forEach(btn => {
    if (btn.innerText.includes(typeName.split(" ")[0]) || btn.getAttribute("onclick")?.includes(typeKey)) {
      btn.className = "garment-type-btn active p-3 rounded-xl border text-left transition border-cyan-400 bg-cyan-400/10 text-white";
    } else {
      btn.className = "garment-type-btn p-3 rounded-xl border text-left transition border-gray-800 bg-gray-900/60 text-gray-300 hover:border-gray-700";
    }
  });
  updateStudioCanvasBadge();
}

function setCustomGarmentColor(hex, colorName) {
  customStudioState.colorHex = hex;
  customStudioState.colorName = colorName;

  // Change SVG T-Shirt fill color
  const svgBody = document.getElementById("svg-shirt-body");
  if (svgBody) {
    svgBody.setAttribute("fill", hex);
    // If white or very light, adjust stroke so silhouette remains visible
    if (hex === '#f8fafc' || hex === '#f5f5f4') {
      svgBody.setAttribute("stroke", "#94a3b8");
    } else {
      svgBody.setAttribute("stroke", "rgba(255,255,255,0.15)");
    }
  }

  // Update color swatch UI
  document.querySelectorAll(".color-swatch-ring").forEach(swatch => {
    if (swatch.title === colorName) {
      swatch.classList.add("active");
    } else {
      swatch.classList.remove("active");
    }
  });

  const label = document.getElementById("selected-color-label");
  if (label) label.innerText = `Selected Color: ${colorName}`;

  updateStudioCanvasBadge();

  if (window.Studio3D && Studio3D.isInitialized) {
    Studio3D.updateTexture();
  }
}

function setCustomPlacement(placementKey) {
  customStudioState.placement = placementKey;
  const area = document.getElementById("studio-printable-area");
  
  if (!area) return;

  // Reset placement classes
  area.className = "studio-printable-area";

  let name = "Front Center Chest";
  if (placementKey === "pocket") {
    area.classList.add("pocket-area");
    name = "Left Chest / Pocket";
  } else if (placementKey === "full-back") {
    area.classList.add("back-area");
    name = "Full Back";
  } else if (placementKey === "sleeve") {
    area.classList.add("sleeve-area");
    name = "Sleeve Accent";
  }

  customStudioState.placementName = name;

  // Highlight button
  document.querySelectorAll(".placement-btn").forEach(btn => {
    if (btn.getAttribute("onclick")?.includes(placementKey)) {
      btn.className = "placement-btn active p-2.5 rounded-xl border text-center transition border-cyan-400 bg-cyan-400/10 text-cyan-300 font-bold text-xs";
    } else {
      btn.className = "placement-btn p-2.5 rounded-xl border text-center transition border-gray-800 bg-gray-900/60 text-gray-300 hover:border-gray-700 font-bold text-xs";
    }
  });
}

function setCustomView(view) {
  customStudioState.view = view;
  const frontBtn = document.getElementById("view-btn-front");
  const backBtn = document.getElementById("view-btn-back");

  if (view === "front") {
    if (frontBtn) frontBtn.className = "px-3 py-1 rounded-full bg-cyan-400 text-black font-extrabold transition";
    if (backBtn) backBtn.className = "px-3 py-1 rounded-full text-gray-400 hover:text-white transition";
    if (customStudioState.placement === "full-back") {
      setCustomPlacement("front-center");
    }
  } else {
    if (backBtn) backBtn.className = "px-3 py-1 rounded-full bg-cyan-400 text-black font-extrabold transition";
    if (frontBtn) frontBtn.className = "px-3 py-1 rounded-full text-gray-400 hover:text-white transition";
    setCustomPlacement("full-back");
  }

  if (window.Studio3D && Studio3D.isInitialized) {
    Studio3D.setPresetView(view);
    Studio3D.updateTexture();
  }
}

function updateStudioCanvasBadge() {
  const badge = document.getElementById("studio-canvas-label");
  if (badge) {
    badge.innerText = `${customStudioState.garmentType} (${customStudioState.colorName})`;
  }
}

function handleCustomPhotoUpload(event) {
  const file = event.target.files ? event.target.files[0] : null;
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    alert("⚠️ File size is larger than 10MB. Please choose a smaller image.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    customStudioState.photoDataUrl = e.target.result;
    customStudioState.photoFilename = file.name;

    // Show image on canvas
    const imgEl = document.getElementById("studio-artwork-img");
    const placeholder = document.getElementById("studio-placeholder-text");
    const scaleCtrl = document.getElementById("studio-scale-control");
    
    if (imgEl) {
      imgEl.src = e.target.result;
      imgEl.classList.remove("hidden");
    }
    if (placeholder) placeholder.classList.add("hidden");
    if (scaleCtrl) scaleCtrl.classList.remove("hidden");

    // Update upload zone active state UI
    const idleState = document.getElementById("upload-idle-state");
    const activeState = document.getElementById("upload-active-state");
    const thumb = document.getElementById("custom-photo-thumb");
    const filenameEl = document.getElementById("custom-photo-filename");

    if (idleState) idleState.classList.add("hidden");
    if (activeState) activeState.classList.remove("hidden");
    if (thumb) thumb.src = e.target.result;
    if (filenameEl) filenameEl.innerText = file.name;

    showToast("📸 Photo loaded onto T-Shirt canvas!");

    if (window.Studio3D && Studio3D.isInitialized) {
      Studio3D.updateTexture();
    }
  };
  reader.readAsDataURL(file);
}

function removeCustomPhoto() {
  customStudioState.photoDataUrl = "";
  customStudioState.photoFilename = "";

  const fileInput = document.getElementById("custom-photo-input");
  if (fileInput) fileInput.value = "";

  const imgEl = document.getElementById("studio-artwork-img");
  const placeholder = document.getElementById("studio-placeholder-text");
  const scaleCtrl = document.getElementById("studio-scale-control");

  if (imgEl) {
    imgEl.src = "";
    imgEl.classList.add("hidden");
  }
  if (!customStudioState.text && placeholder) {
    placeholder.classList.remove("hidden");
  }
  if (scaleCtrl) scaleCtrl.classList.add("hidden");

  const idleState = document.getElementById("upload-idle-state");
  const activeState = document.getElementById("upload-active-state");

  if (idleState) idleState.classList.remove("hidden");
  if (activeState) activeState.classList.add("hidden");

  showToast("Photo removed from canvas.");
}

function updateCustomImageScale() {
  const scaleInput = document.getElementById("studio-img-scale");
  if (scaleInput) {
    customStudioState.scale = scaleInput.value;
    applyArtworkTransform();
  }
}

/* 2D / 3D Mode Switcher */
function setStudioViewMode(mode) {
  customStudioState.viewMode = mode;
  const wrapper3d = document.getElementById("studio-3d-wrapper");
  const svg2d = document.getElementById("studio-tshirt-svg");
  const printArea2d = document.getElementById("studio-printable-area");
  const texture = document.getElementById("studio-fabric-texture");
  const shadow = document.getElementById("studio-fabric-shadow");
  const btn2d = document.getElementById("viewmode-btn-2d");
  const btn3d = document.getElementById("viewmode-btn-3d");

  if (mode === "3d") {
    if (wrapper3d) wrapper3d.classList.remove("hidden");
    if (svg2d) svg2d.classList.add("hidden");
    if (printArea2d) printArea2d.classList.add("hidden");
    if (texture) texture.classList.add("hidden");
    if (shadow) shadow.classList.add("hidden");

    if (btn3d) btn3d.className = "px-3 py-1 rounded-full bg-cyan-400 text-black font-extrabold transition shadow-lg";
    if (btn2d) btn2d.className = "px-3 py-1 rounded-full text-gray-400 hover:text-white transition";

    if (window.Studio3D) {
      Studio3D.init();
      Studio3D.updateTexture();
    }
    showToast("🧊 Switched to Interactive Real 3D Studio Mode!");
  } else {
    if (wrapper3d) wrapper3d.classList.add("hidden");
    if (svg2d) svg2d.classList.remove("hidden");
    if (printArea2d) printArea2d.classList.remove("hidden");

    if (btn2d) btn2d.className = "px-3 py-1 rounded-full bg-cyan-400 text-black font-extrabold transition shadow-lg";
    if (btn3d) btn3d.className = "px-3 py-1 rounded-full text-gray-400 hover:text-white transition";
    showToast("📐 Switched to 2D Technical Flat Mode");
  }
}

/* Interactive Touch / Mouse Artwork Dragging */
function initArtworkDragHandlers() {
  const imgEl = document.getElementById("studio-artwork-img");
  if (!imgEl) return;

  const startDrag = (e) => {
    e.preventDefault();
    customStudioState.isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    customStudioState.dragStartX = clientX - (customStudioState.offsetX || 0);
    customStudioState.dragStartY = clientY - (customStudioState.offsetY || 0);
    imgEl.classList.add("dragging");
  };

  const doDrag = (e) => {
    if (!customStudioState.isDragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    customStudioState.offsetX = clientX - customStudioState.dragStartX;
    customStudioState.offsetY = clientY - customStudioState.dragStartY;
    applyArtworkTransform();
  };

  const stopDrag = () => {
    if (customStudioState.isDragging) {
      customStudioState.isDragging = false;
      imgEl.classList.remove("dragging");
    }
  };

  imgEl.addEventListener("mousedown", startDrag);
  window.addEventListener("mousemove", doDrag);
  window.addEventListener("mouseup", stopDrag);

  imgEl.addEventListener("touchstart", startDrag, { passive: false });
  window.addEventListener("touchmove", doDrag, { passive: false });
  window.addEventListener("touchend", stopDrag);
}

function applyArtworkTransform() {
  const imgEl = document.getElementById("studio-artwork-img");
  if (imgEl) {
    const scale = customStudioState.scale || 100;
    const x = customStudioState.offsetX || 0;
    const y = customStudioState.offsetY || 0;
    imgEl.style.transform = `translate(${x}px, ${y}px) scale(${scale / 100})`;
  }

  if (window.Studio3D && Studio3D.isInitialized) {
    Studio3D.updateTexture();
  }
}

function nudgeArtwork(dir) {
  const step = 8;
  if (!customStudioState.offsetX) customStudioState.offsetX = 0;
  if (!customStudioState.offsetY) customStudioState.offsetY = 0;

  if (dir === 'left') customStudioState.offsetX -= step;
  else if (dir === 'right') customStudioState.offsetX += step;
  else if (dir === 'up') customStudioState.offsetY -= step;
  else if (dir === 'down') customStudioState.offsetY += step;
  applyArtworkTransform();
}

function resetArtworkPosition() {
  customStudioState.offsetX = 0;
  customStudioState.offsetY = 0;
  customStudioState.scale = 100;
  const scaleInput = document.getElementById("studio-img-scale");
  if (scaleInput) scaleInput.value = 100;
  applyArtworkTransform();
  showToast("Position reset to center.");
}

/* 1-Click Background Removal Tool (HTML5 Canvas Pixel Color Keying) */
function removePhotoBackground() {
  if (!customStudioState.photoDataUrl) {
    alert("⚠️ Please upload a photo first!");
    return;
  }

  showToast("✨ Processing background removal...");

  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = function() {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];

    const isWhiteBg = (bgR > 215 && bgG > 215 && bgB > 215);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (isWhiteBg) {
        if (r > 200 && g > 200 && b > 200) {
          data[i + 3] = 0; // Make pixel transparent
        }
      } else {
        const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
        if (dist < 50) {
          data[i + 3] = 0;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const transparentDataUrl = canvas.toDataURL("image/png");

    customStudioState.photoDataUrl = transparentDataUrl;

    const imgEl = document.getElementById("studio-artwork-img");
    const thumb = document.getElementById("custom-photo-thumb");

    if (imgEl) imgEl.src = transparentDataUrl;
    if (thumb) thumb.src = transparentDataUrl;

    showToast("✨ Background removed! Artwork is now transparent.");
  };
  img.src = customStudioState.photoDataUrl;
}

function updateCustomCanvasText() {
  const textInput = document.getElementById("custom-text-input");
  const fontSelect = document.getElementById("custom-font-select");
  const textOverlay = document.getElementById("studio-text-overlay");
  const placeholder = document.getElementById("studio-placeholder-text");

  const txt = textInput ? textInput.value.trim() : "";
  const font = fontSelect ? fontSelect.value : "'Syne', sans-serif";

  customStudioState.text = txt;
  customStudioState.font = font;

  if (textOverlay) {
    if (txt) {
      textOverlay.innerText = txt;
      textOverlay.style.fontFamily = font;
      textOverlay.classList.remove("hidden");
      if (placeholder) placeholder.classList.add("hidden");
    } else {
      textOverlay.innerText = "";
      textOverlay.classList.add("hidden");
      if (!customStudioState.photoDataUrl && placeholder) {
        placeholder.classList.remove("hidden");
      }
    }
  }
}

function submitCustomTShirtOrder(event) {
  event.preventDefault();

  const customerName = document.getElementById("custom-customer-name").value.trim();
  const customerPhone = document.getElementById("custom-customer-phone").value.trim();
  const customerAddress = document.getElementById("custom-customer-address").value.trim();
  const size = document.getElementById("custom-size-select").value;
  const qty = parseInt(document.getElementById("custom-qty-input").value) || 1;
  const notes = document.getElementById("custom-notes-input").value.trim();

  if (!customerName || !customerPhone || !customerAddress) {
    alert("⚠️ Please fill in your Name, WhatsApp Phone Number, and Delivery Address.");
    return;
  }

  const brand = getStoredBrandInfo();
  const phone = brand.whatsappPhone || "94741565677";
  const newOrderId = `TK-CUST-${Math.floor(10000 + Math.random() * 90000)}`;
  const baseUrl = window.location.origin + window.location.pathname;
  const trackingLink = `${baseUrl}?track=${newOrderId}`;

  // Estimate price (e.g. 4800 base for Tee, 8900 for Hoodie)
  let unitPrice = 4800;
  if (customStudioState.garmentType.toLowerCase().includes("hoodie")) {
    unitPrice = 8900;
  }
  const totalPrice = unitPrice * qty;

  const now = new Date();
  const timeStr = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Custom Order Object
  const customOrder = {
    id: newOrderId,
    isCustomOrder: true,
    customerName: customerName,
    customerPhone: customerPhone,
    address: customerAddress,
    items: [
      {
        name: `CUSTOM ${customStudioState.garmentType.toUpperCase()}`,
        size: size,
        color: customStudioState.colorName,
        placement: customStudioState.placementName,
        customText: customStudioState.text,
        artworkFilename: customStudioState.photoFilename || "Uploaded artwork",
        photoUrl: customStudioState.photoDataUrl || null,
        notes: notes,
        price: unitPrice,
        qty: qty
      }
    ],
    totalPrice: totalPrice,
    status: "placed",
    statusStep: 1,
    locationNote: "Custom Order received. Time Kairo team checking print artwork.",
    createdAt: timeStr,
    updatedAt: timeStr
  };

  // Save to Local Storage & Firebase Firestore
  if (typeof saveSingleOrder === "function") saveSingleOrder(customOrder);
  if (typeof window.syncOrderToFirebase === "function") window.syncOrderToFirebase(customOrder);

  // STREAMLINED & SUPER CLEAN WHATSAPP MESSAGE FORMAT
  let msg = `🎨 *TIME KAIRO CUSTOM ORDER*\n\n`;
  msg += `🆔 *Order ID*: #${newOrderId}\n`;
  msg += `👤 *Customer*: ${customerName} (${customerPhone})\n`;
  msg += `📍 *Delivery*: ${customerAddress}\n\n`;

  msg += `👕 *Garment*: ${customStudioState.garmentType}\n`;
  msg += `🎨 *Color*: ${customStudioState.colorName}\n`;
  msg += `📐 *Size*: ${size} | 🔢 *Qty*: ${qty}\n`;
  msg += `📍 *Placement*: ${customStudioState.placementName}\n`;
  
  if (customStudioState.photoFilename) {
    msg += `🖼️ *Artwork Photo*: ${customStudioState.photoFilename}\n`;
  }
  if (customStudioState.text) {
    msg += `📝 *Print Text*: "${customStudioState.text}"\n`;
  }
  if (notes) {
    msg += `📌 *Notes*: ${notes}\n`;
  }

  msg += `💵 *Total Amount*: LKR ${totalPrice.toLocaleString()}\n\n`;
  msg += `🔗 *Live Order Tracking*:\n${trackingLink}`;

  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank");

  showToast(`🎨 Custom Order #${newOrderId} Sent to WhatsApp!`);
}

/* Anti-Screenshot, Anti-Print, and Copy Protection Event Listeners */
function initCopyProtectionHandlers() {
  // 1. Prevent Right Click / Context Menu on studio canvas and images
  document.addEventListener("contextmenu", (e) => {
    const customizePage = document.getElementById("page-customize");
    if (customizePage && customizePage.classList.contains("active")) {
      e.preventDefault();
      showToast("🔒 Content protected — Downloading disabled");
      return false;
    }
  });

  // 2. Prevent Keyboard Copy Shortcuts (PrintScreen, Ctrl+S, Ctrl+P, F12, Ctrl+Shift+I)
  document.addEventListener("keydown", (e) => {
    const customizePage = document.getElementById("page-customize");
    const isCustomizeActive = customizePage && customizePage.classList.contains("active");

    if (!isCustomizeActive) return;

    // Block PrintScreen key
    if (e.key === "PrintScreen" || e.keyCode === 44) {
      e.preventDefault();
      showToast("🔒 Screenshot Protection Active!");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("TIME KAIRO PROTECTED PREVIEW");
      }
      return false;
    }

    // Block Ctrl+S (Save), Ctrl+P (Print), Ctrl+Shift+I (DevTools), F12 (Inspect)
    if (
      (e.ctrlKey && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P" || e.key === "u" || e.key === "U")) ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
      e.key === "F12"
    ) {
      e.preventDefault();
      showToast("🔒 Security Protection: Downloading & Inspecting disabled");
      return false;
    }
  });
}

// Initialize interactive drag & copy protection on load
setTimeout(() => {
  initArtworkDragHandlers();
  initCopyProtectionHandlers();
}, 500);

/* ==========================================
   DUAL PHOTO UPLOAD FOR CUSTOMIZE STUDIO (FRONT & BACK)
   ========================================== */
function handleCustomBackPhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const backImg = document.getElementById("studio-back-artwork-img");
    const thumb = document.getElementById("custom-back-photo-thumb");
    const filename = document.getElementById("custom-back-photo-filename");
    const idleState = document.getElementById("back-upload-idle-state");
    const activeState = document.getElementById("back-upload-active-state");
    const status = document.getElementById("back-photo-status");

    if (backImg) {
      backImg.src = dataUrl;
      backImg.classList.remove("hidden");
    }
    if (thumb) thumb.src = dataUrl;
    if (filename) filename.innerText = file.name;
    if (idleState) idleState.classList.add("hidden");
    if (activeState) activeState.classList.remove("hidden");
    if (status) {
      status.innerText = "Loaded on Back";
      status.className = "text-[10px] text-emerald-400 font-bold";
    }

    if (typeof Studio3D !== "undefined" && Studio3D.updateTexture) {
      Studio3D.updateTexture();
    }
    showToast("📷 Back photo loaded! Switch placement to Full Back or rotate 360° to view.");
  };
  reader.readAsDataURL(file);
}

function removeCustomBackPhoto() {
  const backImg = document.getElementById("studio-back-artwork-img");
  const idleState = document.getElementById("back-upload-idle-state");
  const activeState = document.getElementById("back-upload-active-state");
  const input = document.getElementById("custom-back-photo-input");
  const status = document.getElementById("back-photo-status");

  if (backImg) {
    backImg.src = "";
    backImg.classList.add("hidden");
  }
  if (input) input.value = "";
  if (idleState) idleState.classList.remove("hidden");
  if (activeState) activeState.classList.add("hidden");
  if (status) {
    status.innerText = "Not Uploaded";
    status.className = "text-[10px] text-gray-400";
  }

  if (typeof Studio3D !== "undefined" && Studio3D.updateTexture) {
    Studio3D.updateTexture();
  }
  showToast("Removed back photo.");
}

/* ==========================================
   OWNER WEBSITE PHOTOS & BANNERS DYNAMIC MANAGER
   ========================================== */
function getStoredSitePhotos() {
  const saved = localStorage.getItem("timekairo_site_photos");
  if (saved) {
    try { return JSON.parse(saved); } catch(e){}
  }
  return {
    logo: "images/logo.jpg",
    hero: "images/hero.jpg",
    about: "images/hero.jpg",
    quality: "images/hero.jpg"
  };
}

function saveSitePhotos(photos) {
  localStorage.setItem("timekairo_site_photos", JSON.stringify(photos));
  applySitePhotosUI();
}

function applySitePhotosUI() {
  const photos = getStoredSitePhotos();
  
  // 1. Logo photos across the website
  if (photos.logo) {
    document.querySelectorAll('img[alt*="Logo"]').forEach(img => {
      img.src = photos.logo;
    });
  }
  // 2. Hero Banner photo
  if (photos.hero) {
    document.querySelectorAll('img[alt*="Hero"]').forEach(img => {
      img.src = photos.hero;
    });
  }
  // 3. About Section photo
  if (photos.about) {
    const aboutImg = document.querySelector("#about-story-img");
    if (aboutImg) aboutImg.src = photos.about;
  }
  // 4. Fabric Quality photo
  if (photos.quality) {
    const qualImg = document.querySelector("#quality-fabric-img");
    if (qualImg) qualImg.src = photos.quality;
  }

  // Populate admin form fields
  const logoInput = document.getElementById("admin-photo-logo-url");
  const heroInput = document.getElementById("admin-photo-hero-url");
  const aboutInput = document.getElementById("admin-photo-about-url");
  const qualInput = document.getElementById("admin-photo-quality-url");
  if (logoInput) logoInput.value = photos.logo || "";
  if (heroInput) heroInput.value = photos.hero || "";
  if (aboutInput) aboutInput.value = photos.about || "";
  if (qualInput) qualInput.value = photos.quality || "";
}

async function handleSaveSitePhotos(event) {
  if (event) event.preventDefault();
  const current = getStoredSitePhotos();
  
  const logoUrl = document.getElementById("admin-photo-logo-url")?.value.trim();
  const heroUrl = document.getElementById("admin-photo-hero-url")?.value.trim();
  const aboutUrl = document.getElementById("admin-photo-about-url")?.value.trim();
  const qualUrl = document.getElementById("admin-photo-quality-url")?.value.trim();

  const logoFile = document.getElementById("admin-photo-logo-file")?.files[0];
  const heroFile = document.getElementById("admin-photo-hero-file")?.files[0];
  const aboutFile = document.getElementById("admin-photo-about-file")?.files[0];
  const qualFile = document.getElementById("admin-photo-quality-file")?.files[0];

  const readFileAsDataUrl = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

  if (logoFile) current.logo = await readFileAsDataUrl(logoFile);
  else if (logoUrl) current.logo = logoUrl;

  if (heroFile) current.hero = await readFileAsDataUrl(heroFile);
  else if (heroUrl) current.hero = heroUrl;

  if (aboutFile) current.about = await readFileAsDataUrl(aboutFile);
  else if (aboutUrl) current.about = aboutUrl;

  if (qualFile) current.quality = await readFileAsDataUrl(qualFile);
  else if (qualUrl) current.quality = qualUrl;

  saveSitePhotos(current);
  showToast("📸 All Website Photos & Banners Updated!");
}

function resetSitePhotosToDefault() {
  if (confirm("Reset all website photos back to default images?")) {
    localStorage.removeItem("timekairo_site_photos");
    applySitePhotosUI();
    showToast("Reset website photos to default.");
  }
}

/* ==========================================
   🎮 GAME FOR GET DISCOUNT (10-DAY STREAK CHALLENGE)
   ========================================== */
function getDiscountGameState() {
  const defaultState = {
    points: 0,
    lastPlayedDate: null,
    streakHistory: Array(10).fill(false),
    discountUnlocked: false,
    discountClaimed: false
  };
  const saved = localStorage.getItem("timekairo_streak_game");
  if (!saved) return defaultState;
  try {
    return { ...defaultState, ...JSON.parse(saved) };
  } catch (e) {
    return defaultState;
  }
}

function saveDiscountGameState(state) {
  localStorage.setItem("timekairo_streak_game", JSON.stringify(state));
}

function checkStreakReset() {
  const state = getDiscountGameState();
  if (!state.lastPlayedDate) return state;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = new Date(state.lastPlayedDate);
  lastDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

  // If player missed 1 day (gap >= 2 days), STREAK RESETS TO 0!
  if (diffDays > 1) {
    state.points = 0;
    state.streakHistory = Array(10).fill(false);
    state.discountUnlocked = false;
    saveDiscountGameState(state);
    setTimeout(() => {
      showToast("⚠️ Streak Reset: You missed playing yesterday! Points reset to 0.", 5000);
    }, 1000);
  }
  return state;
}

function openDiscountGameModal() {
  const state = checkStreakReset();
  renderStreakTrackerUI(state);

  const modal = document.getElementById("game-discount-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  resetGameScreens();
}
window.openDiscountGameModal = openDiscountGameModal;

function closeDiscountGameModal() {
  const modal = document.getElementById("game-discount-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  if (window.discountGameLoopId) {
    cancelAnimationFrame(window.discountGameLoopId);
  }
  if (window.gameTimerInterval) {
    clearInterval(window.gameTimerInterval);
  }
}
window.closeDiscountGameModal = closeDiscountGameModal;

function getGameTargetForDay(day) {
  if (day >= 8) return { target: 22, basketW: 60, speedMin: 7, speedMax: 12, hasHazards: true, label: "🔥 HARDCORE MODE (Catch 22 items in 20s! Avoid 💣 red hazards!)" };
  if (day >= 4) return { target: 15, basketW: 75, speedMin: 5, speedMax: 8, hasHazards: true, label: "⚡ SPEED MODE (Catch 15 items in 20s!)" };
  return { target: 10, basketW: 90, speedMin: 3, speedMax: 5, hasHazards: false, label: "✨ BEGINNER MODE (Catch 10 items in 20s)" };
}

function renderStreakTrackerUI(state) {
  const badge = document.getElementById("streak-score-badge");
  if (badge) badge.innerText = `${state.points} / 10 Points`;

  const container = document.getElementById("streak-days-grid");
  if (!container) return;

  const todayStr = new Date().toISOString().split("T")[0];
  const alreadyPlayedToday = state.lastPlayedDate === todayStr;

  let html = "";
  for (let day = 1; day <= 10; day++) {
    const isCompleted = day <= state.points;
    const isCurrentTarget = day === state.points + 1 && !alreadyPlayedToday;

    let statusClass = "border-gray-800 bg-gray-900/60 text-gray-500";
    let icon = `<i class="fa-solid fa-lock text-[10px]"></i>`;
    if (day >= 8) statusClass += " border-amber-500/20"; // highlight hard days

    if (isCompleted) {
      statusClass = "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 font-extrabold";
      icon = `<i class="fa-solid fa-check text-xs"></i>`;
    } else if (isCurrentTarget) {
      statusClass = "border-cyan-400 bg-cyan-400/20 text-cyan-300 font-extrabold animate-pulse shadow-lg shadow-cyan-500/20";
      icon = day >= 8 ? `<i class="fa-solid fa-fire text-xs text-rose-400 animate-bounce"></i>` : `<i class="fa-solid fa-star text-xs text-amber-400"></i>`;
    }

    html += `
      <div class="p-2 rounded-xl border text-center transition ${statusClass}">
        <div class="text-[9px] uppercase tracking-wider mb-1 font-bold">Day ${day} ${day >= 8 ? '🔥' : ''}</div>
        <div class="text-sm">${icon}</div>
      </div>
    `;
  }
  container.innerHTML = html;

  const notice = document.getElementById("game-status-notice");
  const startBtn = document.getElementById("btn-start-daily-game");
  const rewardCard = document.getElementById("discount-reward-card");

  const currentDay = Math.min(10, state.points + 1);
  const targetConfig = getGameTargetForDay(currentDay);

  // Update intro description text dynamically
  const introDesc = document.querySelector("#game-start-screen p");
  if (introDesc) {
    introDesc.innerHTML = `<span class="text-amber-300 font-extrabold block mb-1">${targetConfig.label}</span> Move basket left & right to catch <span class="text-cyan-300 font-extrabold">${targetConfig.target} items</span> in 20 seconds!`;
  }

  // TIERED REWARDS DISPLAY (7% OFF for 8-9 Points, 10% OFF for 10 Points)
  if (rewardCard) {
    if (state.points >= 10 || state.discountUnlocked) {
      rewardCard.innerHTML = `
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase">
          <i class="fa-solid fa-trophy"></i> 🏆 ULTIMATE 10-DAY MASTERY UNLOCKED!
        </div>
        <h4 class="font-heading text-xl font-extrabold text-white uppercase">Full 10% Discount Promo Code Unlocked!</h4>
        <p class="text-xs text-gray-300">Congratulations on completing all 10 Days!</p>
        <div class="flex items-center justify-center gap-3 max-w-xs mx-auto pt-1">
          <span class="font-mono text-xl font-black text-emerald-400 bg-black/80 px-4 py-2 rounded-xl border border-emerald-500/40 select-all">TK10STREAK</span>
          <button type="button" onclick="claimDiscountReward('TK10STREAK', 10)" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs uppercase transition shadow-lg shadow-emerald-500/20">
            Apply 10% OFF
          </button>
        </div>
      `;
      rewardCard.classList.remove("hidden");
    } else if (state.points >= 8) {
      rewardCard.innerHTML = `
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase">
          <i class="fa-solid fa-award"></i> 🥈 TIER 1 UNLOCKED (8+ Days Streak)!
        </div>
        <h4 class="font-heading text-lg font-bold text-white uppercase">7% Discount Promo Code Unlocked!</h4>
        <p class="text-xs text-gray-300">You earned 8+ Points! Complete Days 9 & 10 to upgrade to <span class="text-emerald-400 font-bold">10% OFF</span>!</p>
        <div class="flex items-center justify-center gap-3 max-w-xs mx-auto pt-1">
          <span class="font-mono text-lg font-black text-amber-300 bg-black/80 px-4 py-2 rounded-xl border border-amber-500/40 select-all">TK7STREAK</span>
          <button type="button" onclick="claimDiscountReward('TK7STREAK', 7)" class="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-xl text-xs uppercase transition shadow-lg shadow-amber-500/20">
            Apply 7% OFF
          </button>
        </div>
      `;
      rewardCard.classList.remove("hidden");
    } else {
      rewardCard.classList.add("hidden");
    }
  }

  if (state.points >= 10 || state.discountUnlocked) {
    if (startBtn) {
      startBtn.innerText = "🏆 10-Day Streak Completed! 10% Discount Active";
      startBtn.disabled = true;
      startBtn.className = "px-8 py-3.5 bg-gray-800 text-emerald-400 font-black rounded-xl uppercase text-xs cursor-not-allowed";
    }
  } else if (alreadyPlayedToday) {
    if (notice) {
      notice.innerHTML = `✨ Today's streak point earned! Current points: <span class="font-black text-amber-300">${state.points}/10</span>. You can still practice play below!`;
      notice.classList.remove("hidden");
    }
    if (startBtn) {
      startBtn.innerText = `🎮 Play Game Mode (Day ${state.points} Done - Practice)`;
      startBtn.disabled = false;
      startBtn.className = "px-8 py-3.5 bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 hover:from-amber-400 hover:to-cyan-300 text-black font-black rounded-xl uppercase tracking-wider text-xs transition shadow-lg shadow-amber-500/20 transform hover:scale-105 cursor-pointer";
    }
  } else {
    if (notice) notice.classList.add("hidden");
    if (startBtn) {
      startBtn.innerText = `▶️ Start Day ${state.points + 1} Game (Target: ${targetConfig.target} Items)`;
      startBtn.disabled = false;
      startBtn.className = "px-8 py-3.5 bg-gradient-to-r from-cyan-400 via-amber-400 to-cyan-400 hover:from-cyan-300 hover:to-amber-300 text-black font-black rounded-xl uppercase tracking-wider text-xs transition shadow-lg shadow-cyan-500/20 transform hover:scale-105 cursor-pointer";
    }
  }
}

/* Password Lock & Touch Movement Logic for Mini-Game */
const GAME_REQUIRED_PASSCODE = "159159";

let continuousMoveTimer = null;
let lastGameTouchTime = 0;

window.startContinuousMove = function(dx, event) {
  if (event) {
    if (event.type === 'touchstart') {
      lastGameTouchTime = Date.now();
    } else if (event.type === 'mousedown' && (Date.now() - lastGameTouchTime < 500)) {
      return; // Ignore mouse event synthesized right after touchstart on mobile
    }
    if (event.cancelable) event.preventDefault();
  }
  stopContinuousMove();
  const step = dx > 0 ? 14 : -14;
  moveBasketBy(step);
  continuousMoveTimer = setInterval(() => {
    moveBasketBy(step);
  }, 25);
};

window.stopContinuousMove = function(event) {
  if (event && event.cancelable && event.type === 'touchend') {
    // Keep clean touch cycle
  }
  if (continuousMoveTimer) {
    clearInterval(continuousMoveTimer);
    continuousMoveTimer = null;
  }
};

function moveBasketBy(dx) {
  const canvas = document.getElementById("discount-game-canvas");
  if (!canvas) return;
  basketX = Math.max(0, Math.min(canvas.width - basketWidth, basketX + dx));
}

function handleGameTouch(e) {
  const canvas = document.getElementById("discount-game-canvas");
  if (!canvas) return;
  if (e.touches && e.touches.length > 0) {
    if (e.cancelable) e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      const scaleX = canvas.width / rect.width;
      const touchX = (e.touches[0].clientX - rect.left) * scaleX;
      basketX = Math.max(0, Math.min(canvas.width - basketWidth, touchX - basketWidth / 2));
    }
  }
}

function isGameUnlocked() {
  return localStorage.getItem("game_unlocked") === "true";
}

function verifyGamePassword(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("game-passcode-input");
  const error = document.getElementById("game-passcode-error");
  const val = input ? input.value.trim() : "";

  if (val === GAME_REQUIRED_PASSCODE) {
    localStorage.setItem("game_unlocked", "true");
    if (error) error.classList.add("hidden");
    showToast("🔓 Game Access Unlocked!");
    resetGameScreens();
  } else {
    if (error) error.classList.remove("hidden");
    showToast("❌ Incorrect Game Passcode!");
  }
}
window.verifyGamePassword = verifyGamePassword;

function relockGame() {
  localStorage.removeItem("game_unlocked");
  showToast("🔒 Game Security Locked");
  resetGameScreens();
}
window.relockGame = relockGame;

function resetGameScreens() {
  const passwordScreen = document.getElementById("game-password-screen");
  const startScreen = document.getElementById("game-start-screen");
  const canvasWrapper = document.getElementById("game-canvas-wrapper");
  const resultScreen = document.getElementById("game-result-screen");
  const relockBtn = document.getElementById("btn-relock-game");

  const unlocked = isGameUnlocked();

  if (unlocked) {
    if (passwordScreen) passwordScreen.classList.add("hidden");
    if (startScreen) startScreen.classList.remove("hidden");
    if (canvasWrapper) canvasWrapper.classList.add("hidden");
    if (resultScreen) resultScreen.classList.add("hidden");
    if (relockBtn) relockBtn.classList.remove("hidden");
  } else {
    if (passwordScreen) passwordScreen.classList.remove("hidden");
    if (startScreen) startScreen.classList.add("hidden");
    if (canvasWrapper) canvasWrapper.classList.add("hidden");
    if (resultScreen) resultScreen.classList.add("hidden");
    if (relockBtn) relockBtn.classList.add("hidden");
    const input = document.getElementById("game-passcode-input");
    const error = document.getElementById("game-passcode-error");
    if (input) input.value = "";
    if (error) error.classList.add("hidden");
  }
}

/* Interactive Canvas Mini-Game Engine */
let gameScore = 0;
let gameTimeLeft = 20;
let basketX = 250;
let basketWidth = 90;
let currentGameTarget = 10;
let currentDayConfig = null;
let fallingItems = [];

function startDailyGameSession() {
  const state = checkStreakReset();

  const currentDay = Math.min(10, state.points + 1);
  currentDayConfig = getGameTargetForDay(currentDay);
  currentGameTarget = currentDayConfig.target;
  basketWidth = currentDayConfig.basketW;

  document.getElementById("game-start-screen").classList.add("hidden");
  document.getElementById("game-canvas-wrapper").classList.remove("hidden");
  document.getElementById("game-result-screen").classList.add("hidden");

  gameScore = 0;
  gameTimeLeft = 20;
  document.getElementById("game-timer").innerText = `${gameTimeLeft}s`;
  document.getElementById("game-caught-count").innerText = `${gameScore} / ${currentGameTarget}`;

  const canvas = document.getElementById("discount-game-canvas");
  if (!canvas) return;

  basketX = canvas.width / 2 - basketWidth / 2;
  fallingItems = [];

  canvas.onmousemove = function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    basketX = Math.max(0, Math.min(canvas.width - basketWidth, mouseX - basketWidth / 2));
  };

  canvas.removeEventListener("touchstart", handleGameTouch);
  canvas.removeEventListener("touchmove", handleGameTouch);
  canvas.addEventListener("touchstart", handleGameTouch, { passive: false });
  canvas.addEventListener("touchmove", handleGameTouch, { passive: false });

  canvas.onclick = function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const clickX = (e.clientX - rect.left) * scaleX;
    basketX = Math.max(0, Math.min(canvas.width - basketWidth, clickX - basketWidth / 2));
  };

  if (window.gameTimerInterval) clearInterval(window.gameTimerInterval);
  window.gameTimerInterval = setInterval(() => {
    gameTimeLeft--;
    const timerEl = document.getElementById("game-timer");
    if (timerEl) timerEl.innerText = `${gameTimeLeft}s`;

    if (gameTimeLeft <= 0) {
      clearInterval(window.gameTimerInterval);
      finishDailyGameSession();
    }
  }, 1000);

  runMiniGameLoop();
}

function runMiniGameLoop() {
  const canvas = document.getElementById("discount-game-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const cfg = currentDayConfig || { speedMin: 3, speedMax: 5, hasHazards: false };

  // Spawn items at higher rates for higher difficulty
  const spawnRate = cfg.target >= 20 ? 0.18 : (cfg.target >= 15 ? 0.12 : 0.08);
  if (Math.random() < spawnRate) {
    const isHazard = cfg.hasHazards && Math.random() < 0.28;
    fallingItems.push({
      x: Math.random() * (canvas.width - 30),
      y: -20,
      speed: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
      size: isHazard ? 24 : 26,
      isHazard: isHazard
    });
  }

  // Clear background
  ctx.fillStyle = cfg.target >= 20 ? "#12080c" : "#090d16";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid Lines
  ctx.strokeStyle = cfg.target >= 20 ? "rgba(244, 63, 94, 0.1)" : "rgba(0, 242, 254, 0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }

  // Update & Draw items
  for (let i = fallingItems.length - 1; i >= 0; i--) {
    const item = fallingItems[i];
    item.y += item.speed;

    if (item.isHazard) {
      // Red Hazard Bomb
      ctx.fillStyle = "#f43f5e";
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(item.x + item.size / 2, item.y + item.size / 2, item.size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("💣", item.x + item.size / 2, item.y + item.size / 2);
    } else {
      // Normal Cyan Clothing Item
      ctx.fillStyle = "#00f2fe";
      ctx.shadowColor = "#00f2fe";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(item.x + item.size / 2, item.y + item.size / 2, item.size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "#000";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TK", item.x + item.size / 2, item.y + item.size / 2);
    }

    // Collision Check
    const basketY = canvas.height - 25;
    if (item.y + item.size >= basketY && item.x + item.size >= basketX && item.x <= basketX + basketWidth) {
      if (item.isHazard) {
        gameScore = Math.max(0, gameScore - 2);
        showToast("💥 Hit a Bomb! -2 Score!");
      } else {
        gameScore++;
      }
      document.getElementById("game-caught-count").innerText = `${gameScore} / ${currentGameTarget}`;
      fallingItems.splice(i, 1);
      continue;
    }

    if (item.y > canvas.height) {
      fallingItems.splice(i, 1);
    }
  }

  // Draw Basket
  const basketY = canvas.height - 25;
  ctx.fillStyle = cfg.target >= 20 ? "#f43f5e" : "#e6c875";
  ctx.shadowColor = cfg.target >= 20 ? "#f43f5e" : "#e6c875";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(basketX, basketY, basketWidth, 20, 8);
  } else {
    ctx.rect(basketX, basketY, basketWidth, 20);
  }
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#000";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(basketWidth <= 60 ? "🧺 TK" : "🧺 TIME KAIRO", basketX + basketWidth / 2, basketY + 13);

  if (gameTimeLeft > 0) {
    window.discountGameLoopId = requestAnimationFrame(runMiniGameLoop);
  }
}

function finishDailyGameSession() {
  if (window.discountGameLoopId) {
    cancelAnimationFrame(window.discountGameLoopId);
  }
  document.getElementById("game-canvas-wrapper").classList.add("hidden");
  const resultScreen = document.getElementById("game-result-screen");
  const resultIcon = document.getElementById("game-result-icon");
  const resultTitle = document.getElementById("game-result-title");
  const resultMsg = document.getElementById("game-result-msg");

  resultScreen.classList.remove("hidden");

  if (gameScore >= currentGameTarget) {
    const state = getDiscountGameState();
    const todayStr = new Date().toISOString().split("T")[0];

    state.points = Math.min(10, state.points + 1);
    state.lastPlayedDate = todayStr;
    if (state.points >= 10) state.discountUnlocked = true;

    saveDiscountGameState(state);
    renderStreakTrackerUI(state);

    resultIcon.innerText = state.points >= 8 ? "🔥" : "🎉";
    resultTitle.innerText = `Day ${state.points} Goal Achieved!`;
    resultTitle.className = "font-heading text-xl font-bold text-emerald-400 uppercase";
    resultMsg.innerText = `Awesome! You caught ${gameScore}/${currentGameTarget} items and earned 1 Point for today's streak! Total streak: ${state.points}/10 Days.`;
    showToast(`⚡ Day ${state.points} Streak Completed! (+1 Point)`);
  } else {
    // Failing game session RESETS STREAK TO 0!
    const state = getDiscountGameState();
    state.points = 0;
    state.streakHistory = Array(10).fill(false);
    state.discountUnlocked = false;
    saveDiscountGameState(state);
    renderStreakTrackerUI(state);

    resultIcon.innerText = "💥";
    resultTitle.innerText = "Game Failed — Streak Reset To 0!";
    resultTitle.className = "font-heading text-xl font-bold text-rose-400 uppercase";
    resultMsg.innerText = `You caught ${gameScore}/${currentGameTarget} items in 20 seconds. Because you failed the daily challenge, your streak reset back to 0 points!`;
    showToast("💥 Challenge Failed! Streak reset to 0 Points.", 5000);
  }
}

function claimDiscountReward(code, percent) {
  const promoCode = code || "TK10STREAK";
  const pct = percent || 10;
  showToast(`🎉 ${pct}% Discount Coupon (${promoCode}) Unlocked & Applied!`);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(promoCode);
  }
}

function moveBasketStep(delta) {
  const canvas = document.getElementById("discount-game-canvas");
  const maxW = canvas ? canvas.width : 600;
  basketX = Math.max(0, Math.min(maxW - basketWidth, basketX + delta));
}

document.addEventListener("keydown", function(e) {
  const canvas = document.getElementById("discount-game-canvas");
  if (!canvas) return;
  const gameWrapper = document.getElementById("game-canvas-wrapper");
  if (!gameWrapper || gameWrapper.classList.contains("hidden")) return;

  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    moveBasketStep(-35);
  } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    moveBasketStep(35);
  }
});

/* ==========================================
   CUSTOMER REVIEWS & FEEDBACK SYSTEM
   ========================================== */
const DEFAULT_CUSTOMER_REVIEWS = [
  {
    id: "rev-1",
    name: "Kasun Dissanayake",
    location: "Colombo",
    product: "KAIRO OVERSIZED GRAPHIC TEE",
    rating: 5,
    date: "2 days ago",
    verified: true,
    comment: "The 280GSM cotton quality is unreal! Fits perfectly oversized and print didn't fade at all after washing. Easily the best streetwear brand in Sri Lanka 🔥"
  },
  {
    id: "rev-2",
    name: "Dilini Mendis",
    location: "Kandy",
    product: "CHRONO CYBER HEAVYWEIGHT HOODIE",
    rating: 5,
    date: "4 days ago",
    verified: true,
    comment: "Ordered on Tuesday, arrived in Kandy by Thursday via Prompt Express! The fleece fabric is thick and cozy. Live tracking feature made it super easy to follow."
  },
  {
    id: "rev-3",
    name: "Sahan Ranasinghe",
    location: "Galle",
    product: "ARCHITECTURAL BOMBER JACKET",
    rating: 5,
    date: "1 week ago",
    verified: true,
    comment: "Hardware zips and custom oversized silhouette are top tier. Feels like a high-end designer piece. Worth every rupee!"
  },
  {
    id: "rev-4",
    name: "Tharindu Perera",
    location: "Kurunegala",
    product: "MODULAR TACTICAL CARGO PANTS",
    rating: 5,
    date: "1 week ago",
    verified: true,
    comment: "Pockets are super functional and fit is 10/10. Exchange process was so smooth when I wanted to swap M to L size. Great service Time Kairo team!"
  }
];

function getStoredCustomerReviews() {
  const saved = localStorage.getItem("timekairo_customer_reviews");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch(e) {
      console.error(e);
    }
  }
  return DEFAULT_CUSTOMER_REVIEWS;
}

function saveCustomerReviews(reviews) {
  localStorage.setItem("timekairo_customer_reviews", JSON.stringify(reviews));
}

function renderCustomerReviews() {
  const container = document.getElementById("customer-reviews-grid");
  if (!container) return;

  const reviews = getStoredCustomerReviews();
  let html = "";

  reviews.forEach(rev => {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= rev.rating) {
        stars += `<i class="fa-solid fa-star text-amber-400"></i>`;
      } else {
        stars += `<i class="fa-regular fa-star text-gray-600"></i>`;
      }
    }

    html += `
      <div class="glass-panel p-6 rounded-3xl border border-gray-800/80 hover:border-cyan-500/40 transition duration-300 flex flex-col justify-between shadow-xl group">
        <div>
          <div class="flex items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-amber-400 text-black font-extrabold flex items-center justify-center text-sm uppercase shadow">
                ${rev.name.charAt(0)}
              </div>
              <div>
                <h4 class="font-bold text-sm text-white group-hover:text-cyan-300 transition flex items-center gap-1.5">
                  ${rev.name}
                  ${rev.verified ? `<span class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black uppercase"><i class="fa-solid fa-circle-check"></i> Verified</span>` : ''}
                </h4>
                <div class="text-[11px] text-gray-400 flex items-center gap-2">
                  <span>📍 ${rev.location}</span>
                  <span>•</span>
                  <span>${rev.date}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="text-xs text-amber-400 mb-3 flex items-center gap-1">
            ${stars}
          </div>

          <p class="text-xs text-gray-300 leading-relaxed font-normal italic">
            "${rev.comment}"
          </p>
        </div>

        <div class="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-cyan-400 font-semibold">
          <span class="truncate">Item: ${rev.product || "Time Kairo Apparel"}</span>
          <i class="fa-solid fa-quote-right text-gray-600 text-lg"></i>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
window.renderCustomerReviews = renderCustomerReviews;

let selectedReviewRating = 5;
function selectReviewStars(rating) {
  selectedReviewRating = rating;
  const ratingInput = document.getElementById("review-input-rating");
  if (ratingInput) ratingInput.value = rating;

  const starContainer = document.getElementById("review-star-rating-select");
  if (!starContainer) return;

  const stars = starContainer.querySelectorAll("i");
  stars.forEach((star, idx) => {
    if (idx < rating) {
      star.className = "fa-solid fa-star transition hover:scale-125 text-amber-400";
    } else {
      star.className = "fa-regular fa-star transition hover:scale-125 text-gray-600";
    }
  });
}
window.selectReviewStars = selectReviewStars;

function openWriteReviewModal() {
  const modal = document.getElementById("write-review-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  selectReviewStars(5);
}
window.openWriteReviewModal = openWriteReviewModal;

function closeWriteReviewModal() {
  const modal = document.getElementById("write-review-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}
window.closeWriteReviewModal = closeWriteReviewModal;

function submitCustomerReview(e) {
  if (e) e.preventDefault();
  const name = document.getElementById("review-input-name").value.trim();
  const location = document.getElementById("review-input-city").value.trim();
  const product = document.getElementById("review-input-product").value.trim();
  const comment = document.getElementById("review-input-comment").value.trim();
  const rating = parseInt(document.getElementById("review-input-rating").value || "5");

  if (!name || !location || !comment) {
    showToast("⚠️ Please fill in all required fields!");
    return;
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    name: name,
    location: location,
    product: product || "Time Kairo Official Drop",
    rating: rating,
    date: "Just now",
    verified: true,
    comment: comment
  };

  const reviews = getStoredCustomerReviews();
  reviews.unshift(newReview);
  saveCustomerReviews(reviews);
  renderCustomerReviews();

  closeWriteReviewModal();
  showToast("🎉 Thank you! Your review has been submitted.");

  // Reset form fields
  document.getElementById("review-input-name").value = "";
  document.getElementById("review-input-city").value = "";
  document.getElementById("review-input-product").value = "";
  document.getElementById("review-input-comment").value = "";
}
window.submitCustomerReview = submitCustomerReview;



