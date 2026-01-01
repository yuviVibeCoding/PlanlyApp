import { CalendarEvent, UserConfig, WishlistItem, Wishlist, INITIAL_CREDENTIALS } from '../types';
import { db, isConfigured } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc,
  query,
  where
} from 'firebase/firestore';

// --- Collections ---
const COLL_USERS = 'users';
const COLL_EVENTS = 'events';
const COLL_WISHLISTS = 'wishlists';
const COLL_WISHLIST_ITEMS = 'wishlist_items';

// --- Reactivity ---
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notifyListeners = () => {
  listeners.forEach(l => l());
};

// --- Initialization ---
export const initializeStorage = async (): Promise<boolean> => {
  return isConfigured;
};

// We keep the "DriveConfig" export for type safety compatibility but it's unused now
export const getDriveConfig = () => ({ connected: isConfigured, clientId: '', apiKey: '' });
export const setDriveConfig = () => {};
export const syncFromDrive = async () => {}; // No-op, realtime DB syncs automatically

// --- Auth ---

export const getAuthInfo = async (): Promise<UserConfig> => {
  if (!db) return INITIAL_CREDENTIALS;

  try {
    const docRef = doc(db, COLL_USERS, 'auth_info');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserConfig;
    } else {
      // Create default if not exists
      await setDoc(docRef, INITIAL_CREDENTIALS);
      return INITIAL_CREDENTIALS;
    }
  } catch (error) {
    console.error("Error fetching auth:", error);
    return INITIAL_CREDENTIALS;
  }
};

export const updateAuthInfo = async (config: UserConfig): Promise<void> => {
  if (!db) return;
  const docRef = doc(db, COLL_USERS, 'auth_info');
  await setDoc(docRef, config);
};

// --- Events ---

export const getEvents = async (): Promise<CalendarEvent[]> => {
  if (!db) return [];
  try {
    const querySnapshot = await getDocs(collection(db, COLL_EVENTS));
    const events: CalendarEvent[] = [];
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() } as CalendarEvent);
    });
    return events;
  } catch (e) {
    console.error("Get Events Error:", e);
    return [];
  }
};

export const createEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
  if (!db) throw new Error("Database not connected");
  
  const docRef = await addDoc(collection(db, COLL_EVENTS), event);
  const newEvent = { ...event, id: docRef.id };
  notifyListeners();
  return newEvent;
};

export const updateEvent = async (event: CalendarEvent): Promise<void> => {
  if (!db) return;
  const { id, ...data } = event;
  const eventRef = doc(db, COLL_EVENTS, id);
  await updateDoc(eventRef, data);
  notifyListeners();
};

export const deleteEvent = async (id: string): Promise<void> => {
  if (!db) return;
  await deleteDoc(doc(db, COLL_EVENTS, id));
  notifyListeners();
};

// --- Wishlists (Groups) ---

export const getWishlists = async (): Promise<Wishlist[]> => {
  if (!db) return [];
  try {
    const querySnapshot = await getDocs(collection(db, COLL_WISHLISTS));
    const lists: Wishlist[] = [];
    querySnapshot.forEach((doc) => {
      lists.push({ id: doc.id, ...doc.data() } as Wishlist);
    });
    return lists;
  } catch (e) {
    console.error("Get Wishlists Error:", e);
    return [];
  }
};

export const createWishlist = async (title: string, description: string): Promise<Wishlist> => {
    if (!db) throw new Error("Database not connected");
    const newList = {
        title,
        description,
        createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLL_WISHLISTS), newList);
    const result = { ...newList, id: docRef.id };
    notifyListeners();
    return result;
};

export const deleteWishlist = async (id: string): Promise<void> => {
    if (!db) return;
    // Note: In a real app, you'd batch delete items inside the list too.
    await deleteDoc(doc(db, COLL_WISHLISTS, id));
    notifyListeners();
};

// --- Wishlist Items ---

export const getWishlistItems = async (listId: string): Promise<WishlistItem[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, COLL_WISHLIST_ITEMS), where("listId", "==", listId));
    const querySnapshot = await getDocs(q);
    const items: WishlistItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as WishlistItem);
    });
    return items;
  } catch (e) {
    console.error("Get Wishlist Items Error:", e);
    return [];
  }
};

export const createWishlistItem = async (item: Omit<WishlistItem, 'id' | 'dateAdded'>): Promise<WishlistItem> => {
  if (!db) throw new Error("Database not connected");
  
  const newItemData = {
    ...item,
    dateAdded: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, COLL_WISHLIST_ITEMS), newItemData);
  const newItem = { ...newItemData, id: docRef.id };
  notifyListeners();
  return newItem;
};

export const updateWishlistItem = async (item: WishlistItem): Promise<void> => {
  if (!db) return;
  const { id, ...data } = item;
  const itemRef = doc(db, COLL_WISHLIST_ITEMS, id);
  await updateDoc(itemRef, data);
  notifyListeners();
};

export const deleteWishlistItem = async (id: string): Promise<void> => {
  if (!db) return;
  await deleteDoc(doc(db, COLL_WISHLIST_ITEMS, id));
  notifyListeners();
};