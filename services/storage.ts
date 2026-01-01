import { CalendarEvent, UserConfig, WishlistItem, INITIAL_CREDENTIALS, AppDatabase, DriveConfig } from '../types';
import * as driveService from './drive';

const STORAGE_KEYS = {
  AUTH: 'planly_auth',
  EVENTS: 'planly_events',
  WISHLIST: 'planly_wishlist',
  DRIVE_CONFIG: 'planly_drive_config'
};

// --- Reactivity / Listeners ---
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notifyListeners = () => {
  listeners.forEach(l => l());
};

// Helper for generating IDs
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// --- Config Logic ---

export const getDriveConfig = (): DriveConfig => {
  const storedString = localStorage.getItem(STORAGE_KEYS.DRIVE_CONFIG);
  
  // "Backend" Config
  const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  const envApiKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';

  let config: DriveConfig;

  if (storedString) {
    config = JSON.parse(storedString);
  } else {
    config = { 
      clientId: '', 
      apiKey: '', 
      connected: false 
    };
  }

  // FORCE override with Env vars if they exist (Simulate Backend Config)
  if (envClientId) config.clientId = envClientId;
  if (envApiKey) config.apiKey = envApiKey;

  return config;
};

export const setDriveConfig = (config: DriveConfig) => {
  localStorage.setItem(STORAGE_KEYS.DRIVE_CONFIG, JSON.stringify(config));
  // We generally don't notify on config change, but we could
};

// Consolidate current state into one object
const getFullDatabase = async (): Promise<AppDatabase> => {
  const auth = await getAuthInfo();
  const events = await getEvents();
  const wishlist = await getWishlist();
  return {
    auth,
    events,
    wishlist,
    lastUpdated: new Date().toISOString()
  };
};

// --- Sync Logic ---

// Push to Drive if connected
const syncToDrive = async () => {
  const config = getDriveConfig();
  if (!config.connected || !config.fileId || !driveService.hasValidToken()) return;

  try {
    const data = await getFullDatabase();
    await driveService.updateData(config.fileId, data);
    console.log("Synced to Drive (db.json)");
  } catch (error) {
    console.error("Background sync failed:", error);
  }
};

// Initialize App: 1. Init GAPI 2. Try Silent Sign In 3. Sync
export const initializeStorage = async (): Promise<boolean> => {
  const config = getDriveConfig();
  
  // If we have "Backend" config, we init GAPI immediately
  if (config.clientId && config.apiKey) {
    try {
      await driveService.initializeGoogleServices(config.apiKey, config.clientId);
      
      // If we were previously connected, try to silently restore session
      if (config.connected) {
        const restored = await driveService.trySilentSignIn();
        if (restored) {
            console.log("Session restored silently");
            await syncFromDrive(); // Pull latest data
            return true;
        }
      }
      return true; 
    } catch (e) {
      console.error("Failed to init Drive on load", e);
      return false;
    }
  }
  return false;
};

// Explicit Sync Pull (used after login or connection)
export const syncFromDrive = async (): Promise<void> => {
  const config = getDriveConfig();
  if (!config.connected) return;

  try {
    const currentData = await getFullDatabase();
    
    // This finds 'db.json' or creates it
    const fileId = await driveService.initDatabaseFile(currentData);
      
    const newConfig = { ...config, fileId };
    setDriveConfig(newConfig);

    // Read Data
    const data = await driveService.getData(fileId);
    
    // Hydrate Local Storage
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(data.auth));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(data.events));
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(data.wishlist));
    
    notifyListeners(); // Tell UI to update
    
  } catch (error) {
    console.error("Sync from Drive failed:", error);
    // If sync fails (e.g. token expired), we might want to set connected to false
    // but for now we'll just log it.
    throw error;
  }
};

// --- Auth / Config ---

export const getAuthInfo = async (): Promise<UserConfig> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (stored) return JSON.parse(stored);
    return INITIAL_CREDENTIALS;
  } catch (error) {
    return INITIAL_CREDENTIALS;
  }
};

export const updateAuthInfo = async (config: UserConfig): Promise<void> => {
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(config));
  syncToDrive();
};

// --- Events ---

export const getEvents = async (): Promise<CalendarEvent[]> => {
  const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
  return stored ? JSON.parse(stored) : [];
};

export const createEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
  const events = await getEvents();
  const newEvent = { ...event, id: generateId() };
  events.push(newEvent);
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  notifyListeners();
  syncToDrive();
  return newEvent;
};

export const updateEvent = async (event: CalendarEvent): Promise<void> => {
  const events = await getEvents();
  const index = events.findIndex(e => e.id === event.id);
  if (index !== -1) {
    events[index] = event;
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    notifyListeners();
    syncToDrive();
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  const events = await getEvents();
  const filtered = events.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(filtered));
  notifyListeners();
  syncToDrive();
};

// --- Wishlist ---

export const getWishlist = async (): Promise<WishlistItem[]> => {
  const stored = localStorage.getItem(STORAGE_KEYS.WISHLIST);
  return stored ? JSON.parse(stored) : [];
};

export const createWishlistItem = async (item: Omit<WishlistItem, 'id' | 'dateAdded'>): Promise<WishlistItem> => {
  const list = await getWishlist();
  const newItem = {
    ...item,
    id: generateId(),
    dateAdded: new Date().toISOString()
  };
  list.push(newItem);
  localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(list));
  notifyListeners();
  syncToDrive();
  return newItem;
};

export const updateWishlistItem = async (item: WishlistItem): Promise<void> => {
  const list = await getWishlist();
  const index = list.findIndex(i => i.id === item.id);
  if (index !== -1) {
    list[index] = item;
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(list));
    notifyListeners();
    syncToDrive();
  }
};

export const deleteWishlistItem = async (id: string): Promise<void> => {
  const list = await getWishlist();
  const filtered = list.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(filtered));
  notifyListeners();
  syncToDrive();
};