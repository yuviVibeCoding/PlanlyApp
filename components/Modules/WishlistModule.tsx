import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  ExternalLink, 
  Trash2, 
  Filter, 
  ArrowUpDown, 
  Plus,
  ShoppingBag,
  FolderOpen,
  ArrowLeft,
  ChevronRight,
  List as ListIcon
} from 'lucide-react';
import { WishlistItem, Wishlist } from '../../types';
import * as storage from '../../services/storage';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

export const WishlistModule: React.FC = () => {
  // Navigation State
  const [activeList, setActiveList] = useState<Wishlist | null>(null);

  // Data State
  const [lists, setLists] = useState<Wishlist[]>([]);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all');
  const [sort, setSort] = useState<'date' | 'name'>('date');
  
  // Modals
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [listTitle, setListTitle] = useState('');
  const [listDesc, setListDesc] = useState('');
  
  const [itemName, setItemName] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemDesc, setItemDesc] = useState('');

  // --- Initialization ---

  useEffect(() => {
    loadLists();
    const unsubscribe = storage.subscribe(() => {
        loadLists();
        if (activeList) loadItems(activeList.id);
    });
    return () => {
      unsubscribe();
    };
  }, [activeList]); // Re-subscribe if activeList changes to ensure logic flow

  const loadLists = async () => {
    setLoading(true);
    const data = await storage.getWishlists();
    setLists(data);
    setLoading(false);
  };

  const loadItems = async (listId: string) => {
      // Don't set main loading here to prevent full flicker when adding items
      const data = await storage.getWishlistItems(listId);
      setItems(data);
  };

  // --- Actions: Lists ---

  const handleCreateList = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!listTitle) return;
      setIsSubmitting(true);
      try {
          await storage.createWishlist(listTitle, listDesc);
          setIsListModalOpen(false);
          setListTitle('');
          setListDesc('');
      } catch (err) {
          console.error(err);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteList = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Delete this list? All items inside will be lost access to (simulated).")) {
          await storage.deleteWishlist(id);
      }
  }

  // --- Actions: Items ---

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !activeList) return;

    setIsSubmitting(true);
    try {
      await storage.createWishlistItem({ 
        listId: activeList.id,
        name: itemName, 
        url: itemUrl, 
        description: itemDesc, 
        status: 'pending' 
      });

      setIsItemModalOpen(false);
      setItemName(''); setItemUrl(''); setItemDesc('');
      loadItems(activeList.id);
    } catch (error) {
      console.error("Failed to create item:", error);
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
      // Optimistic update handled by listener or manual reload
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Delete this item?')) {
      try {
        await storage.deleteWishlistItem(id);
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    }
  };

  // --- Render Views ---

  const renderListsView = () => {
      if (lists.length === 0 && !loading) {
          return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FolderOpen size={48} className="mb-4 opacity-50" />
                <p className="text-lg mb-4">No wishlists created yet.</p>
                <Button onClick={() => setIsListModalOpen(true)}>Create First List</Button>
            </div>
          );
      }

      return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map(list => (
                  <div 
                    key={list.id}
                    onClick={() => { setActiveList(list); loadItems(list.id); }}
                    className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md relative"
                  >
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                              <ListIcon size={24} />
                          </div>
                          <button 
                             onClick={(e) => handleDeleteList(e, list.id)}
                             className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{list.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {list.description || "No description"}
                      </p>
                      
                      <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                          View Items <ChevronRight size={16} className="ml-1" />
                      </div>
                  </div>
              ))}
              
              {/* Add New List Card */}
              <button 
                onClick={() => setIsListModalOpen(true)}
                className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all min-h-[180px]"
              >
                  <Plus size={32} className="mb-2" />
                  <span className="font-medium">Create New List</span>
              </button>
          </div>
      );
  };

  const renderItemsView = () => {
    if (!activeList) return null;

    const filteredItems = items
        .filter(item => filter === 'all' ? true : item.status === filter)
        .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        });

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 bg-gray-50 dark:bg-black/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4">
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
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
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
                <Button onClick={() => setIsItemModalOpen(true)} size="sm" className="w-full sm:w-auto">
                    <Plus size={16} /> Add Item
                </Button>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                        <ShoppingBag size={48} className="mb-4 opacity-50" />
                        <p>This list is empty.</p>
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
                                onClick={() => handleDeleteItem(item.id)}
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
        </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Module Header */}
      <div className="flex items-center gap-4 mb-8">
        {activeList ? (
            <button 
                onClick={() => setActiveList(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
                <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
            </button>
        ) : null}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeList ? activeList.title : "Wishlists"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {activeList ? activeList.description || "Manage items" : "Organize your shopping lists."}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar pb-12">
        {activeList ? renderItemsView() : renderListsView()}
      </div>

      {/* Modal: Create List */}
      <Modal isOpen={isListModalOpen} onClose={() => !isSubmitting && setIsListModalOpen(false)} title="Create New List">
        <form onSubmit={handleCreateList} className="space-y-4">
          <Input 
            label="List Title" 
            value={listTitle} 
            onChange={e => setListTitle(e.target.value)} 
            required 
            placeholder="e.g. Tech Upgrades"
            disabled={isSubmitting}
          />
          <Input 
            label="Description" 
            value={listDesc} 
            onChange={e => setListDesc(e.target.value)} 
            placeholder="What's in this list?"
            disabled={isSubmitting}
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsListModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>Create List</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Item */}
      <Modal isOpen={isItemModalOpen} onClose={() => !isSubmitting && setIsItemModalOpen(false)} title="Add Item">
        <form onSubmit={handleCreateItem} className="space-y-4">
          <Input 
            label="Product Name" 
            value={itemName} 
            onChange={e => setItemName(e.target.value)} 
            required 
            placeholder="e.g. Mechanical Keyboard"
            disabled={isSubmitting}
          />
          <Input 
            label="Product URL" 
            value={itemUrl} 
            onChange={e => setItemUrl(e.target.value)} 
            placeholder="https://..."
            disabled={isSubmitting}
          />
          <Input 
            label="Notes" 
            value={itemDesc} 
            onChange={e => setItemDesc(e.target.value)} 
            placeholder="Size, Color, Details..."
            disabled={isSubmitting}
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsItemModalOpen(false)}
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