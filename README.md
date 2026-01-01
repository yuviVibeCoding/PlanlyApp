# Planly - Personal Dashboard

Planly is a high-end, minimalist personal dashboard designed with an Apple-esque aesthetic. It integrates a custom calendar, a hierarchical wishlist organizer, and secure authentication into a unified Progressive Web App (PWA).

## ✨ Features

- **Authentication System**
  - Custom Auth Provider.
  - Credential management via Settings (stored in Firestore).
  - Default secure access.

- **📅 Calendar Module**
  - **Month View:** Interactive grid with event indicators (dots on mobile, bars on desktop).
  - **Today View:** Focused list of daily tasks.
  - **Upcoming View:** Filterable list (Next 1 Month to 1 Year).
  - **CRUD:** Create, Read, Update, Delete events with category color coding.

- **asd Wishlist Organizer**
  - **List of Lists:** Create multiple categories (e.g., "Tech", "Groceries", "Gifts").
  - **Item Management:** Add products with URLs, descriptions, and statuses.
  - **Sorting & Filtering:** Filter by Pending/Purchased; Sort by Date/Name.

- **📱 Progressive Web App (PWA)**
  - Installable on iOS and Android home screens.
  - Offline caching via Service Worker.
  - Native-like touch interactions.

- **🎨 Design**
  - Fully responsive (Mobile Sidebar / Desktop Sidebar).
  - Dark Mode support (System based).
  - Built with Tailwind CSS and Lucide React.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js installed.
- A Google Firebase account.

### 2. Firebase Setup (Required)
This app uses **Firebase Firestore** for the backend.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. **Enable Firestore Database:**
   - Go to "Firestore Database" in the sidebar.
   - Click "Create Database".
   - Start in **Test Mode** (for development) or Production Mode (requires setting up rules).
4. **Get Configuration:**
   - Go to Project Settings (Gear icon) -> General.
   - Scroll to "Your apps" and click the Web icon (`</>`).
   - Register the app (name it "Planly").
   - Copy the `firebaseConfig` object keys.

### 3. Environment Configuration
Open `services/firebase.ts` and update the `FIREBASE_CONFIG` object with your keys, or set them as Environment Variables in your deployment platform:

```typescript
export const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

### 4. Installation & Run
```bash
npm install
npm run dev
```

---

## 📖 Walkthrough

### 🔐 Login
When you first load the app, you will be prompted to log in.
- **Default Username:** `im_suka`
- **Default Password:** `ThisIsThePassword`

*Note: You can change these credentials inside the app under the "Settings" tab.*

### 📅 Managing Events
1. Navigate to the **Calendar** tab.
2. Click on a specific day grid or the "New Event" button.
3. Fill in the Title, Date, Category, and Description.
4. **Swipe Left** on an event in the list view to reveal the **Delete** button, or click the event to **Edit**.

### 🛍️ Using the Wishlist
1. Navigate to the **Wishlist** tab.
2. Click **Create New List** to start a category (e.g., "Holiday Shopping").
3. Click into the list card to view items.
4. Add items with optional URLs.
5. Click the checkbox to mark items as **Purchased**.

### 📲 Installing on Mobile (iOS)
1. Open the app in **Safari**.
2. Tap the **Share** button (rectangle with arrow).
3. Scroll down and tap **"Add to Home Screen"**.
4. The app will appear on your home screen with the custom app icon and launch in full-screen mode.

---

## 🛠 Tech Stack
- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Backend:** Firebase Firestore
- **Date Handling:** date-fns

---

## License
MIT
