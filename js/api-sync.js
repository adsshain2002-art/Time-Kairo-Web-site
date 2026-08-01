/**
 * Time Kairo - Simple REST API Sync Manager
 * Allows Expo Go App to update website without complex Firebase SDKs
 */

// Replace BIN_ID and API_KEY with your free JSONBin.io keys or API Endpoint URL
const API_SYNC_CONFIG = {
  endpoint: "https://api.jsonbin.io/v3/b/YOUR_BIN_ID",
  apiKey: "$2a$10$YOUR_SECRET_KEY", // Optional if public bin
  autoPollIntervalMs: 5000 // Check for app updates every 5 seconds
};

let lastSyncTimestamp = 0;

// Function to fetch latest products from Cloud API for Website
async function fetchProductsFromCloud() {
  if (!API_SYNC_CONFIG.endpoint || API_SYNC_CONFIG.endpoint.includes("YOUR_BIN_ID")) {
    return; // Fallback to localStorage / default items if not configured yet
  }

  try {
    const headers = {};
    if (API_SYNC_CONFIG.apiKey) {
      headers["X-Master-Key"] = API_SYNC_CONFIG.apiKey;
    }

    const response = await fetch(`${API_SYNC_CONFIG.endpoint}/latest`, { headers });
    if (!response.ok) return;

    const result = await response.json();
    let cloudProducts = result.record || result;

    if (Array.isArray(cloudProducts)) {
      if (typeof filterOutDeletedProducts === 'function') {
        cloudProducts = filterOutDeletedProducts(cloudProducts);
      }
      const currentLocal = JSON.stringify(getStoredProducts());
      const newRemote = JSON.stringify(cloudProducts);

      // Only re-render if data actually changed to prevent UI flicker
      if (currentLocal !== newRemote) {
        saveProducts(cloudProducts);
        if (typeof products !== 'undefined') products = getStoredProducts();
        if (typeof renderHomeProducts === 'function') renderHomeProducts();
        if (typeof renderShopProducts === 'function') renderShopProducts();
        if (typeof renderAdminProductTable === 'function') renderAdminProductTable();
        console.log("⚡ Products auto-updated from Expo App cloud sync!");
      }
    }
  } catch (err) {
    console.warn("API Sync check warning:", err);
  }
}

// Function to send updated products from Website to Cloud API
async function sendProductsToCloud(updatedProducts) {
  if (!API_SYNC_CONFIG.endpoint || API_SYNC_CONFIG.endpoint.includes("YOUR_BIN_ID")) {
    return;
  }

  try {
    const headers = {
      "Content-Type": "application/json"
    };
    if (API_SYNC_CONFIG.apiKey) {
      headers["X-Master-Key"] = API_SYNC_CONFIG.apiKey;
    }

    await fetch(API_SYNC_CONFIG.endpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify(updatedProducts)
    });
    console.log("☁️ Products synced to cloud!");
  } catch (err) {
    console.error("Cloud push failed:", err);
  }
}

// Start auto-polling every 5 seconds so Expo App changes show on Website instantly
if (API_SYNC_CONFIG.autoPollIntervalMs > 0) {
  setInterval(fetchProductsFromCloud, API_SYNC_CONFIG.autoPollIntervalMs);
}
