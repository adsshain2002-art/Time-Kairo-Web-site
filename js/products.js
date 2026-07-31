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
    description: "Cyberpunk aesthetic oversized graphic shirt with high-density print logo and boxy cut silhouette.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Neon Black"],
    isNew: true,
    isFeatured: false,
    stock: "In Stock"
  }
];

// Helper to get products from LocalStorage or initialize default
function getStoredProducts() {
  const saved = localStorage.getItem("timekairo_products");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved products", e);
    }
  }
  // Set default if empty
  localStorage.setItem("timekairo_products", JSON.stringify(DEFAULT_PRODUCTS));
  return DEFAULT_PRODUCTS;
}

// Helper to save products array to LocalStorage
function saveProducts(products) {
  localStorage.setItem("timekairo_products", JSON.stringify(products));
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
