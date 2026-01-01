import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  ExternalLink, 
  Trash2, 
  Filter, 
  ArrowUpDown, 
  Plus,
  ShoppingBag
} from 'lucide-react';
import { WishlistItem } from '../../types';
import * as storage from '../../services/storage';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

export const WishlistModule: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all');
  const [sort, setSort] = useState<'date' | 'name'>('date');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    loadItems();
    // Subscribe to external updates (e.g. background sync)
    const unsubscribe = storage.subscribe(() => {
        loadItems();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const loadItems = async () => {
    // We don't want to show loading spinner on every background update
    const data = await storage.getWishlist();
    setItems(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      const newItem = await storage.createWishlistItem({ 
        name, 
        url, 
        description: desc, 
        status: 'pending' 
      });

      setIsModalOpen(false);
      setName(''); setUrl(''); setDesc('');
      // setItems updated by listener usually, but for instant UI feedback we can optimize
      // however, storage.createWishlistItem calls notifyListeners() so it will update.
    } catch (error) {
      console.error("Failed to create item:", error);
      alert("Error adding item to local storage.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: WishlistItem) => {
    try {
      const updatedItem = {
        ...item,
        status: item.status === 'pending' ? 'purchased' : 'pending' as 'pending' | 'purchased'
      };
      await storage.updateWishlistItem(updatedItem);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Check console.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this item?')) {
      try {
        await storage.deleteWishlistItem(id);
      } catch (error) {
        console.error("Failed to delete item:", error);
        alert("Failed to delete item. Check console.");
      }
    }
  };

  const filteredItems = items
    .filter(item => filter === 'all' ? true : item.status === filter)
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    });

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Wishlist</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Organize your shopping list and purchase links.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add Item
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Filter size={16} className="text-gray-400" />
          <select 
            className="bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300 font-medium cursor-pointer"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Items</option>
            <option value="pending">Pending</option>
            <option value="purchased">Purchased</option>
          </select>
        </div>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-2 text-sm">
          <ArrowUpDown size={16} className="text-gray-400" />
          <select 
            className="bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300 font-medium cursor-pointer"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="date">Date Added</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400 flex flex-col items-center">
            <ShoppingBag size={48} className="mb-4 opacity-50" />
            <p>Your wishlist is empty.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div 
              key={item.id} 
              className={`group flex flex-col p-4 rounded-xl border transition-all
                ${item.status === 'purchased' 
                  ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800' 
                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-900'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`mt-1 w-6 h-6 rounded-md border flex items-center justify-center transition-colors flex-shrink-0
                      ${item.status === 'purchased' 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'}`}
                  >
                    {item.status === 'purchased' && <CheckSquare size={14} />}
                  </button>
                  
                  <div className="min-w-0">
                    <h3 className={`font-medium truncate pr-4 text-lg ${item.status === 'purchased' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                      {item.name}
                    </h3>
                    
                    {item.description && (
                      <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pl-4">
                  {item.url && (
                    <a 
                      href={item.url.startsWith('http') ? item.url : `https://${item.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Add to Wishlist">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input 
            label="Product Name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            placeholder="e.g. Mechanical Keyboard"
            disabled={isSubmitting}
          />
          <Input 
            label="Product URL" 
            value={url} 
            onChange={e => setUrl(e.target.value)} 
            placeholder="https://..."
            disabled={isSubmitting}
          />
          <Input 
            label="Notes" 
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
            placeholder="Size, Color, Details..."
            disabled={isSubmitting}
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>Add Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};