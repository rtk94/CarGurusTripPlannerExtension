# CarGurus Trip Planner Extension

A powerful, 100% standalone browser extension designed to help users manage, visualize, and plan trips to see their saved CarGurus listings. 

This tool transforms the standard "Saved Cars" list into an interactive geographic dashboard, complete with advanced filtering, rich vehicle data, and one-click navigation.

## 🚀 Key Features

### 1. One-Click Intelligent Sync
*   **Toolbar Integration:** Trigger a full data sync directly from the pinned extension icon.
*   **Automatic Extraction:** Seamlessly grabs high-fidelity vehicle data (images, specs, seller info) directly from your active CarGurus session.
*   **Auto-Redirect:** Automatically opens your personal map dashboard immediately after syncing.

### 2. Interactive Geographic Dashboard
*   **Visual Mapping:** View all your saved cars on a high-performance map using CartoDB Voyager tiles.
*   **Smart Jittering:** Prevents overlapping markers for multiple cars located at the same dealership.
*   **Auto-Centering:** The map automatically zooms and pans to fit your filtered results (can be toggled on/off).

### 3. Advanced Parameterized Filtering
*   **Multi-Criteria Search:** Filter by Year, Make, Model, or City using the real-time search bar.
*   **Range Filters:** Fine-tune your view with specific ranges for:
    *   Minimum and Maximum Price
    *   Maximum Mileage
    *   Vehicle Year
    *   Official Deal Rating (Great, Good, Fair, etc.)

### 4. Rich Sidebar & Detailed View
*   **Image Thumbnails:** Browse your list visually with high-quality vehicle previews.
*   **Expandable Accordion:** Click any car to reveal deep-dive data including specific Trim, Days on Market, and Saved Date.
*   **Seller Intelligence:** See the Seller"s name, formatted phone number, and cleaned-up street address.

### 5. Trip Planning & Navigation
*   **📍 One-Click Navigation:** Every vehicle includes a direct link to Google Maps navigation, pre-loaded with the seller"s address.
*   **CSV Export:** Download your entire dataset as a clean `.csv` file for offline analysis or sharing.

## 🛠 Installation (Developer Mode)

As this is a standalone tool, you can load it directly into any Chromium-based browser (Chrome, Edge, Brave):

1.  **Download/Clone** this repository to your local machine.
2.  Open your browser and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** using the toggle in the top-right corner.
4.  Click the **Load unpacked** button.
5.  Select the `CarGurusExtension` folder.
6.  **Tip:** Click the "Puzzle Piece" icon in your toolbar and **Pin** the CarGurus Trip Planner for easy access.

## 📖 Usage Instructions

1.  Navigate to your **[CarGurus Saved Cars](https://www.cargurus.com/Cars/myAccount/saved-listings)** page.
2.  Click the **Extension Icon** (blue car) in your browser toolbar.
3.  The extension will sync your listings and open your **Interactive Dashboard**.
4.  Browse, filter, and plan your test-drive route!

## 🏗 Technical Architecture

*   **Manifest V3:** Built on the latest Chrome Extension standards for security and performance.
*   **Zero-Server:** Uses `chrome.storage.local` for data persistence—no external databases or servers required.
*   **Hybrid Execution:** Utilizes `chrome.scripting` to access page-level data (`MAIN` world) and a background service worker for processing.
*   **Leaflet.js:** Bundled locally to ensure 100% CSP compliance and offline-first UI rendering.

---
*Created as a professional tool for streamlined car-buying.*