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

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  renderHomeProducts();
  renderShopProducts();
  updateCartUI();
  setupEventListeners();
  renderAdminProductTable();
  renderBrandInfoUI();

  // Check URL hash for direct page navigation if present
  const hash = window.location.hash.replace("#", "");
  if (hash && document.getElementById(`page-${hash}`)) {
    switchPage(hash);
  }
});

/* ==========================================
   NAVIGATION & PAGE SWITCHING
   ========================================== */
function switchPage(pageId) {
  if (pageId === "admin" && !sessionStorage.getItem("admin_authenticated")) {
    const pin = prompt("🔒 Enter Time Kairo Owner PIN code to access Admin Dashboard:");
    if (pin === "7415" || pin === "1234") {
      sessionStorage.setItem("admin_authenticated", "true");
      showToast("🔑 Owner Access Granted!");
    } else {
      if (pin !== null) alert("❌ Incorrect Owner PIN Code!");
      return;
    }
  }

  const sections = document.querySelectorAll(".page-section");
  sections.forEach(sec => sec.classList.remove("active"));

  const targetSection = document.getElementById(`page-${pageId}`);
  if (targetSection) {
    targetSection.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  menu.classList.toggle("hidden");
}

function closeMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  if (menu) menu.classList.add("hidden");
}

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
    ? `<span class="bg-cyan-500 text-black font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">SALE</span>` 
    : (p.isNew ? `<span class="bg-amber-400 text-black font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">NEW DROP</span>` : '');

  return `
    <div class="group relative glass-panel rounded-2xl overflow-hidden border-glow-hover flex flex-col justify-between">
      <div>
        <div class="relative w-full h-72 overflow-hidden bg-gray-900">
          <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy">
          <div class="absolute top-3 left-3 flex flex-col gap-2">
            ${discountBadge}
          </div>
          <!-- Quick view action bar -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
            <button onclick="openQuickView('${p.id}')" class="bg-cyan-400 hover:bg-cyan-300 text-black font-bold p-3 rounded-full shadow-lg transform hover:scale-110 transition" title="Quick View">
              <i class="fa-solid fa-eye text-lg"></i>
            </button>
            <button onclick="directAddToCart('${p.id}')" class="bg-white hover:bg-gray-200 text-black font-bold p-3 rounded-full shadow-lg transform hover:scale-110 transition" title="Add to Cart">
              <i class="fa-solid fa-bag-shopping text-lg"></i>
            </button>
          </div>
        </div>
        <div class="p-5">
          <div class="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1">${p.category}</div>
          <h3 class="font-heading text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">${p.name}</h3>
          <p class="text-xs text-gray-400 mt-1 line-clamp-2">${p.description}</p>
        </div>
      </div>
      <div class="px-5 pb-5 pt-0 flex items-center justify-between border-t border-gray-800/80 mt-2">
        <div class="pt-3">
          <span class="text-xl font-extrabold text-white">LKR ${p.price.toLocaleString()}</span>
          ${p.originalPrice > p.price ? `<span class="text-xs text-gray-400 line-through ml-2">LKR ${p.originalPrice.toLocaleString()}</span>` : ''}
        </div>
        <button onclick="openQuickView('${p.id}')" class="pt-3 text-xs font-bold text-cyan-400 hover:text-white uppercase tracking-wider transition flex items-center gap-1">
          Buy Now <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
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
   QUICK VIEW MODAL
   ========================================== */
function openQuickView(productId) {
  const currentProducts = getStoredProducts();
  const product = currentProducts.find(p => p.id === productId);
  if (!product) return;

  selectedQuickProduct = product;
  selectedSize = product.sizes ? product.sizes[0] : "Standard";
  selectedColor = product.colors ? product.colors[0] : "Standard";

  const modal = document.getElementById("quickview-modal");
  const modalContent = document.getElementById("quickview-content");

  modalContent.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="relative rounded-2xl overflow-hidden bg-gray-900 h-80 md:h-full">
        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
        <span class="absolute top-4 left-4 bg-gray-900/80 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">${product.stock || 'In Stock'}</span>
      </div>
      <div class="flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start">
            <div>
              <span class="text-xs font-bold text-cyan-400 uppercase tracking-widest">${product.category}</span>
              <h2 class="font-heading text-2xl md:text-3xl font-extrabold text-white mt-1">${product.name}</h2>
            </div>
            <button onclick="closeQuickView()" class="text-gray-400 hover:text-white text-2xl font-bold">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="my-4">
            <span class="text-2xl md:text-3xl font-black text-cyan-400">LKR ${product.price.toLocaleString()}</span>
            ${product.originalPrice > product.price ? `<span class="text-sm text-gray-400 line-through ml-3">LKR ${product.originalPrice.toLocaleString()}</span>` : ''}
          </div>
          <p class="text-gray-300 text-sm leading-relaxed mb-6">${product.description}</p>
          
          <!-- Size Selector -->
          ${product.sizes && product.sizes.length ? `
            <div class="mb-6">
              <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Size</label>
              <div class="flex flex-wrap gap-2" id="size-options">
                ${product.sizes.map((s, idx) => `
                  <button onclick="selectSizeOption('${s}')" class="size-btn px-4 py-2 rounded-lg border text-sm font-bold transition ${idx === 0 ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300' : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'}">${s}</button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Color Selector -->
          ${product.colors && product.colors.length ? `
            <div class="mb-6">
              <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Color Variant</label>
              <div class="flex flex-wrap gap-2" id="color-options">
                ${product.colors.map((c, idx) => `
                  <button onclick="selectColorOption('${c}')" class="color-btn px-4 py-2 rounded-lg border text-xs font-bold transition ${idx === 0 ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300' : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'}">${c}</button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="space-y-3 pt-4 border-t border-gray-800">
          <button onclick="addQuickViewToCart()" class="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-cyan-500/20">
            <i class="fa-solid fa-cart-plus text-base"></i> Add To Shopping Bag
          </button>
          <button onclick="orderDirectWhatsApp()" class="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20">
            <i class="fa-brands fa-whatsapp text-lg"></i> Instant Order On WhatsApp
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

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
   WHATSAPP ORDER BUILDER
   ========================================== */
function orderDirectWhatsApp() {
  if (!selectedQuickProduct) return;

  const brand = getStoredBrandInfo();
  const phone = brand.whatsappPhone || "94741565677";
  const message = `Hello TIME KAIRO! 👋\nI want to order:\n\n📌 *Product*: ${selectedQuickProduct.name}\n📏 *Size*: ${selectedSize}\n🎨 *Color*: ${selectedColor}\n💰 *Price*: LKR ${selectedQuickProduct.price.toLocaleString()}\n\nSlogan: ${brand.slogan} ⏳\nPlease confirm availability & delivery details.`;

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
  let itemsText = cart.map((item, idx) => 
    `${idx + 1}. *${item.name}* (Size: ${item.size}) x ${item.qty} = LKR ${(item.price * item.qty).toLocaleString()}`
  ).join("\n");

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const message = `Hello TIME KAIRO! 🛍️\nI would like to place an order from your website:\n\n${itemsText}\n\n💵 *Total Amount*: LKR ${total.toLocaleString()}\n\n📍 Delivery Address: (Please reply with your address)\n⏳ *${brand.slogan}*`;

  const encodedUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(encodedUrl, "_blank");
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

  const processSave = (imageUrl) => {
    const newProduct = {
      id: "tk-custom-" + Date.now(),
      name: name,
      category: category,
      price: price,
      originalPrice: origPrice,
      image: imageUrl || "images/tee.jpg",
      description: description,
      sizes: sizes,
      colors: ["Standard"],
      isNew: true,
      isFeatured: true,
      stock: "In Stock"
    };

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
    showToast("✨ New Clothing Item Added Successfully!");
  };

  // Check if file uploaded
  if (imgFileInput && imgFileInput.files && imgFileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      processSave(e.target.result);
    };
    reader.readAsDataURL(imgFileInput.files[0]);
  } else if (imgUrlInput) {
    processSave(imgUrlInput);
  } else {
    processSave("images/tee.jpg");
  }
}

function deleteAdminProduct(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    products = getStoredProducts().filter(p => p.id !== id);
    saveProducts(products);
    
    if (typeof window.deleteProductFromFirebase === "function") {
      window.deleteProductFromFirebase(id);
    }

    renderHomeProducts();
    renderShopProducts();
    renderAdminProductTable();
    showToast("Product deleted.");
  }
}

function resetCatalogToDefault() {
  if (confirm("Reset catalog back to original seed items?")) {
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
      apkDownloadUrl
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
