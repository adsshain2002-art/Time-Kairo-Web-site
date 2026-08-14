/**
 * Time Kairo - Initial Catalog Data & Storage Manager
 * Slogan: Wear Beyond Time
 */

const DEFAULT_PRODUCTS = [
  {
    id: "tk-001",
    name: "KAIRO OVERSIZED GRAPHIC TEE",
    category: "tshirts",
    price: 4800,
    originalPrice: 5500,
    image: "images/tee.jpg",
    images: ["images/tee.jpg", "images/hero.jpg", "images/hoodie.jpg", "images/jacket.jpg", "images/cargo.jpg"],
    description: "Premium 280GSM heavy cotton oversized fit T-shirt featuring futuristic back print with signature 'Wear Beyond Time' motif. Breathable, durable, and designed for ultimate urban street aesthetic.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Cyber Cyan"],
    isNew: true,
    isFeatured: true,
    stock: "In Stock"
  },
  {
    id: "tk-002",
    name: "CHRONO CYBER HEAVYWEIGHT HOODIE",
    category: "hoodies",
    price: 8900,
    originalPrice: 9800,
    image: "images/hoodie.jpg",
    images: ["images/hoodie.jpg", "images/hero.jpg", "images/tee.jpg", "images/jacket.jpg", "images/cargo.jpg"],
    description: "Ultra-heavyweight 450GSM French Terry fleece hoodie. Designed with custom metallic zipper hardware, sleeve logo accents, and relaxed dropped shoulder silhouette.",
    sizes: ["M", "L", "XL"],
    colors: ["Obsidian Black", "Gold Line"],
    isNew: true,
    isFeatured: true,
    stock: "In Stock"
  },
  {
    id: "tk-003",
    name: "BEYOND TIME LUXURY BOMBER JACKET",
    category: "jackets",
    price: 14500,
    originalPrice: 16500,
    image: "images/jacket.jpg",
    images: ["images/jacket.jpg", "images/hero.jpg", "images/cargo.jpg", "images/tee.jpg", "images/hoodie.jpg"],
    description: "Architectural bomber jacket crafted from weather-resistant tech nylon. Features custom gold hardware trims, utility arm pocket, and satin inner lining with Time Kairo monogram.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Midnight Black", "Stealth Grey"],
    isNew: false,
    isFeatured: true,
    stock: "Limited Stock"
  },
  {
    id: "tk-004",
    name: "MODULAR TACTICAL CARGO PANTS",
    category: "pants",
    price: 7900,
    originalPrice: 8500,
    image: "images/cargo.jpg",
    images: ["images/cargo.jpg", "images/hero.jpg", "images/jacket.jpg", "images/tee.jpg", "images/hoodie.jpg"],
    description: "Heavy-duty ripstop cargo trousers with 6 ergonomic utility pockets, adjustable ankle strap pullers, and reinforced stitching for daily urban movement.",
    sizes: ["30", "32", "34", "36"],
    colors: ["Tactical Black"],
    isNew: true,
    isFeatured: true,
    stock: "In Stock"
  },
  {
    id: "tk-005",
    name: "TIME KAIRO SIGNATURE OVERSIZED HOODIE",
    category: "hoodies",
    price: 9200,
    originalPrice: 10500,
    image: "images/hoodie.jpg",
    images: ["images/hoodie.jpg", "images/hero.jpg", "images/tee.jpg", "images/cargo.jpg", "images/jacket.jpg"],
    description: "Limited edition minimal black hoodie with chest embroidery 'Time Kairo • Wear Beyond Time'. Premium finish with plush fleece interior.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Charcoal Black"],
    isNew: false,
    isFeatured: false,
    stock: "In Stock"
  },
  {
    id: "tk-006",
    name: "MATRIX TECHWEAR OVERSIZED TEE",
    category: "tshirts",
    price: 4500,
    originalPrice: 5000,
    image: "images/tee.jpg",
    images: ["images/tee.jpg", "images/hero.jpg", "images/jacket.jpg", "images/hoodie.jpg", "images/cargo.jpg"],
    description: "Cyberpunk aesthetic oversized graphic shirt with high-density print logo and boxy cut silhouette.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Neon Black"],
    isNew: true,
    isFeatured: false,
    stock: "In Stock"
  }
];

// Deleted products registry management (IDs and Names)
function getDeletedProductIds() {
  const saved = localStorage.getItem("timekairo_deleted_ids");
  if (saved) {
    try {
      return JSON.parse(saved) || [];
    } catch (e) {
      console.error("Failed to parse deleted product ids", e);
    }
  }
  return [];
}

function getDeletedProductNames() {
  const saved = localStorage.getItem("timekairo_deleted_names");
  if (saved) {
    try {
      return JSON.parse(saved) || [];
    } catch (e) {
      console.error("Failed to parse deleted product names", e);
    }
  }
  return [];
}

function addDeletedProduct(productOrId) {
  if (!productOrId) return;

  let id = null;
  let name = null;

  if (typeof productOrId === "object") {
    id = productOrId.id ? String(productOrId.id).trim() : null;
    name = productOrId.name ? String(productOrId.name).trim() : null;
  } else {
    const refStr = String(productOrId).trim();
    id = refStr;

    // Look up product in stored products before it's cleared
    const saved = localStorage.getItem("timekairo_products");
    if (saved) {
      try {
        const stored = JSON.parse(saved);
        if (Array.isArray(stored)) {
          const found = stored.find(p => p && (String(p.id) === refStr || (p.name && p.name.toLowerCase().trim() === refStr.toLowerCase())));
          if (found) {
            id = found.id ? String(found.id).trim() : id;
            name = found.name;
          }
        }
      } catch (e) {}
    }

    // Look up in DEFAULT_PRODUCTS as fallback
    if (typeof DEFAULT_PRODUCTS !== "undefined") {
      const defFound = DEFAULT_PRODUCTS.find(p => p && (String(p.id) === refStr || (p.name && p.name.toLowerCase().trim() === refStr.toLowerCase())));
      if (defFound) {
        id = defFound.id ? String(defFound.id).trim() : id;
        if (!name) name = defFound.name;
      }
    }
  }

  if (id) {
    const deletedIds = getDeletedProductIds();
    const idStr = String(id).trim();
    if (idStr && !deletedIds.includes(idStr)) {
      deletedIds.push(idStr);
      localStorage.setItem("timekairo_deleted_ids", JSON.stringify(deletedIds));
    }
  }

  if (name) {
    const deletedNames = getDeletedProductNames();
    const normName = String(name).toLowerCase().trim();
    if (normName && !deletedNames.includes(normName)) {
      deletedNames.push(normName);
      localStorage.setItem("timekairo_deleted_names", JSON.stringify(deletedNames));
    }
  }
}

function removeDeletedProduct(productOrId) {
  if (!productOrId) return;
  let id = typeof productOrId === "object" ? productOrId.id : String(productOrId);
  let name = typeof productOrId === "object" ? productOrId.name : null;

  if (id) {
    const idStr = String(id).trim();
    const deletedIds = getDeletedProductIds().filter(i => String(i).trim() !== idStr);
    localStorage.setItem("timekairo_deleted_ids", JSON.stringify(deletedIds));
  }
  if (name) {
    const normName = String(name).toLowerCase().trim();
    const deletedNames = getDeletedProductNames().filter(n => String(n).toLowerCase().trim() !== normName);
    localStorage.setItem("timekairo_deleted_names", JSON.stringify(deletedNames));
  }
}

// Backward compatibility alias
function addDeletedProductId(id) {
  addDeletedProduct(id);
}

function clearDeletedProductIds() {
  localStorage.removeItem("timekairo_deleted_ids");
  localStorage.removeItem("timekairo_deleted_names");
}

function filterOutDeletedProducts(productsList) {
  if (!Array.isArray(productsList)) return [];
  const deletedIds = getDeletedProductIds().map(i => String(i).trim());
  const deletedNames = getDeletedProductNames().map(n => String(n).toLowerCase().trim());
  
  if (deletedIds.length === 0 && deletedNames.length === 0) return productsList;

  return productsList.filter(p => {
    if (!p) return false;
    const pId = p.id ? String(p.id).trim() : "";
    const pName = p.name ? String(p.name).toLowerCase().trim() : "";

    if (pId && deletedIds.includes(pId)) return false;
    if (pName && deletedNames.includes(pName)) return false;
    return true;
  });
}


// Helper to get products from LocalStorage or initialize default
function getStoredProducts() {
  const saved = localStorage.getItem("timekairo_products");
  let prods = [];
  if (saved) {
    try {
      prods = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved products", e);
      prods = DEFAULT_PRODUCTS;
    }
  } else {
    prods = DEFAULT_PRODUCTS;
  }
  const filtered = filterOutDeletedProducts(prods);

  // Normalize product images array for all catalog items
  filtered.forEach(p => {
    if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
      p.images = p.image ? [p.image] : ["images/tee.jpg"];
    }
  });

  localStorage.setItem("timekairo_products", JSON.stringify(filtered));
  return filtered;
}

// Helper to save products array to LocalStorage
function saveProducts(products) {
  const filtered = filterOutDeletedProducts(products);
  localStorage.setItem("timekairo_products", JSON.stringify(filtered));
}


// Dynamic Category Default Data & Storage Manager
const DEFAULT_CATEGORIES = [
  { id: "all", name: "All Items" },
  { id: "tshirts", name: "T-Shirts" },
  { id: "hoodies", name: "Hoodies" },
  { id: "jackets", name: "Jackets" },
  { id: "pants", name: "Pants & Cargos" },
  { id: "accessories", name: "Accessories" }
];

function getStoredCategories() {
  const saved = localStorage.getItem("timekairo_categories");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error("Failed to parse categories", e);
    }
  }
  return DEFAULT_CATEGORIES;
}

function saveCategories(cats) {
  if (!Array.isArray(cats) || cats.length === 0) return;
  localStorage.setItem("timekairo_categories", JSON.stringify(cats));
  if (typeof renderCategoryTabs === "function") renderCategoryTabs();
  if (typeof renderCategoryAdminSection === "function") renderCategoryAdminSection();
}


// Brand Information Default Data & Storage Manager
const DEFAULT_BRAND_INFO = {
  phone: "0741565677",
  whatsappPhone: "94741565677",
  address: "Galedanda, Gonawala, Sri Lanka",
  email: "timekairo8@gmail.com",
  slogan: "WEAR BEYOND TIME",
  aboutPhilosophy: "Time Kairo was created with a bold vision: to redefine contemporary Sri Lankan streetwear by merging architectural cuts, high-density fabrics, and futuristic aesthetic motifs.\n\nOur motto — \"Wear Beyond Time\" — signifies garments engineered to transcend temporary trends. Every hoodie, oversized t-shirt, and tactical cargo is crafted with obsessive attention to weight, durability, and fit.",
  stat1Value: "100%",
  stat1Label: "Premium Quality",
  stat2Value: "280+ GSM",
  stat2Label: "Heavyweight Fabric",
  stat3Value: "Islandwide",
  stat3Label: "Fast Shipping",
  tiktokUrl: "https://www.tiktok.com/@timekairo",
  tiktokHandle: "@timekairo",
  instagramUrl: "https://www.instagram.com/timekairo",
  instagramHandle: "@timekairo",
  facebookUrl: "https://www.facebook.com/timekairo",
  facebookHandle: "Time Kairo Official",
  apkDownloadUrl: "https://wa.me/94741565677?text=Hi%20Time%20Kairo!%20Here%20is%20the%20Owner%20Android%20App%20Download%20Link.",
  aboutImage: "images/hero.jpg"
};

function getStoredBrandInfo() {
  const saved = localStorage.getItem("timekairo_brand_info");
  if (saved) {
    try {
      return { ...DEFAULT_BRAND_INFO, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Failed to parse brand info", e);
    }
  }
  return DEFAULT_BRAND_INFO;
}

function saveBrandInfo(info) {
  const current = getStoredBrandInfo();
  const updated = { ...current, ...info };
  localStorage.setItem("timekairo_brand_info", JSON.stringify(updated));
  return updated;
}

// Order Management Default Data & Storage Manager
const DEFAULT_ORDERS = [
  {
    id: "TK-84920",
    customerName: "Kusal Perera",
    customerPhone: "0771234567",
    address: "No. 45, Flower Road, Colombo 07",
    items: [
      { name: "KAIRO OVERSIZED GRAPHIC TEE", size: "L", color: "Cyber Cyan", price: 4800, qty: 1 }
    ],
    totalPrice: 4800,
    status: "in_transit", // 'placed', 'processing', 'in_transit', 'delivered', 'cancelled'
    statusStep: 3, // 1: Placed, 2: Packing, 3: In Transit, 4: Delivered
    locationNote: "Colombo Hub - Dispatched via Prompt Express Courier (Tracking #PRM-9921)",
    createdAt: "2026-07-31 09:30 AM",
    updatedAt: "2026-07-31 02:15 PM"
  },
  {
    id: "TK-73104",
    customerName: "Dilshan Silva",
    customerPhone: "0719876543",
    address: "Peradeniya Road, Kandy",
    items: [
      { name: "CHRONO CYBER HEAVYWEIGHT HOODIE", size: "XL", color: "Obsidian Black", price: 8900, qty: 1 }
    ],
    totalPrice: 8900,
    status: "processing",
    statusStep: 2,
    locationNote: "Time Kairo Workshop - Quality check & eco-packaging in progress",
    createdAt: "2026-07-31 11:00 AM",
    updatedAt: "2026-07-31 11:45 AM"
  }
];

function getStoredOrders() {
  const saved = localStorage.getItem("timekairo_orders");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved orders", e);
    }
  }
  localStorage.setItem("timekairo_orders", JSON.stringify(DEFAULT_ORDERS));
  return DEFAULT_ORDERS;
}

function saveOrders(orders) {
  localStorage.setItem("timekairo_orders", JSON.stringify(orders));
}

function saveSingleOrder(order) {
  const currentOrders = getStoredOrders();
  const index = currentOrders.findIndex(o => o.id === order.id);
  if (index > -1) {
    currentOrders[index] = order;
  } else {
    currentOrders.unshift(order);
  }
  saveOrders(currentOrders);
  return order;
}

function generateOrderId() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `TK-${randomNum}`;
}

