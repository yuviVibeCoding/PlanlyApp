export interface UserConfig {
  username: string;
  password?: string; // Stored securely in real app, here for simulation
}

export type EventCategory = 'work' | 'personal' | 'important' | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string (YYYY-MM-DD)
  category: EventCategory;
}

export interface Wishlist {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  listId: string; // Link to parent Wishlist
  name: string;
  url: string;
  description: string;
  status: 'pending' | 'purchased';
  dateAdded: string; // ISO string
}

export type ViewState = 'today' | 'upcoming' | 'calendar' | 'wishlist' | 'settings';

export const INITIAL_CREDENTIALS = {
  username: 'im_suka',
  password: 'ThisIsThePassword'
};

export interface AppDatabase {
  auth: UserConfig;
  events: CalendarEvent[];
  wishlists: Wishlist[];
  wishlistItems: WishlistItem[];
  lastUpdated: string;
}

export interface DriveConfig {
  clientId: string;
  apiKey: string;
  fileId?: string;
  connected: boolean;
}