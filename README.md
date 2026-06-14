# CarGurus Trip Planner Extension

A powerful, 100% standalone browser extension designed to help users manage, visualize, and plan trips to see their saved CarGurus listings. 

This tool transforms the standard "Saved Cars" list into an interactive geographic dashboard, complete with advanced filtering, real-world multi-stop route building, dark mode, rich vehicle data, and one-click navigation.

## 🚀 Key Features

### 1. One-Click Intelligent Sync
*   **Toolbar Integration:** Trigger a full data sync directly from the pinned extension icon while on your Saved Cars page.
*   **Automatic Extraction:** Seamlessly grabs high-fidelity vehicle data (images, specs, seller info) directly from your active CarGurus session.
*   **Live Feedback:** Displays a native, unobtrusive "Toast" notification during sync to let you know when it's done or if it encounters an error.

### 2. Interactive Geographic Dashboard
*   **Visual Mapping:** View all your saved cars on a high-performance map using CartoDB tiles. 
*   **Real Geocoding:** Features a robust, entirely offline dataset of nearly 30,000 US cities, accurately mapping cars no matter where they are located in the country.
*   **Dark Mode Support:** Click the "🌙" icon to toggle a sleek dark theme that dims the sidebar, popups, and seamlessly switches the CartoDB map tiles to a night-friendly dark version.
*   **Smart Jittering:** Prevents overlapping markers for multiple cars located at the same dealership.
*   **Auto-Centering:** The map automatically zooms and pans to fit your filtered results.

### 3. Trip Route Builder (Multi-Stop Routing)
*   **Custom Itineraries:** Use the "➕ Add to Route" button on any car to add it to your custom Trip Builder list.
*   **One-Click Navigation:** Ready to go? Click "Start Trip in Google Maps" to instantly open a pre-loaded, multi-stop driving route containing all of your selected vehicles!

### 4. Advanced Parameterized Filtering
*   **Multi-Criteria Search:** Filter by Year, Make, Model, or City using the real-time search bar.
*   **Range Filters:** Fine-tune your view with specific ranges for Minimum/Maximum Price, Maximum Mileage, Vehicle Year, and Official Deal Rating (Great, Good, Fair, etc.).

### 5. Rich Sidebar & Detailed View
*   **Image Thumbnails:** Browse your list visually with high-quality vehicle previews.
*   **Expandable Accordion:** Click any car to reveal deep-dive data including specific Trim, Days on Market, Saved Date, and Seller Rating (★).
*   **Seller Intelligence:** See the Seller's name, formatted phone number, and cleaned-up street address.

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
3.  A notification will appear letting you know it is syncing.
4.  The extension will open your **Interactive Dashboard** automatically.
5.  Browse, filter, toggle Dark Mode, and use the Route Builder to plan your test-drive route!

## 🏗 Technical Architecture

*   **Manifest V3:** Built on the latest Chrome Extension standards for security and performance.
*   **Zero-Server & Offline-First:** Uses `chrome.storage.local` for data persistence. Incorporates a local US Cities database for geocoding—no external databases, servers, or API limits.
*   **Hybrid Execution:** Utilizes `chrome.scripting` to access page-level React state data (`window.__remixContext`) and a background service worker for processing.
*   **Leaflet.js:** Bundled locally to ensure 100% CSP compliance and offline UI rendering.

---
*Created as a professional tool for streamlined car-buying.*