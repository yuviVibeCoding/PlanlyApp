import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths, 
  parseISO, 
  addDays, 
  isWithinInterval
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Trash2, Search, X } from 'lucide-react';
import { CalendarEvent, EventCategory } from '../../types';
import * as storage from '../../services/storage';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

interface CalendarModuleProps {
  viewMode: 'calendar' | 'today' | 'upcoming';
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  work: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  personal: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  important: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

// Helper component for swipe interactions
const SwipeableEventRow: React.FC<{
  children: React.ReactNode;
  onDelete: () => void;
  onEdit: () => void;
  className?: string;
}> = ({ children, onDelete, onEdit, className }) => {
  const [offset, setOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    // Only allow swiping left, max 100px
    if (diff < 0 && diff > -120) {
      setOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (offset < -60) {
      setOffset(-80); // Snap open
    } else {
      setOffset(0); // Snap close
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Background Action Layer (Delete) */}
      <div 
        className="absolute inset-0 bg-red-500 flex justify-end items-center px-6 rounded-xl cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          setOffset(0);
        }}
      >
        <Trash2 className="text-white w-6 h-6" />
      </div>

      {/* Foreground Content Layer */}
      <div 
        className="relative z-10 bg-white dark:bg-gray-900 transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          // If open, close it; otherwise edit
          if (offset < -10) {
            setOffset(0);
          } else {
            onEdit();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const CalendarModule: React.FC<CalendarModuleProps> = ({ viewMode }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Edit State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Tooltip State
  const [tooltip, setTooltip] = useState<{ event: CalendarEvent, x: number, y: number } | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formCategory, setFormCategory] = useState<EventCategory>('personal');

  useEffect(() => {
    loadEvents();
    // Subscribe to external updates (e.g. background sync)
    const unsubscribe = storage.subscribe(() => {
        loadEvents();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const loadEvents = async () => {
    // We don't want to show loading spinner on every background update, only initial
    const data = await storage.getEvents();
    setEvents(data);
    setLoading(false);
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formStart || !formEnd) return;

    if (editingEventId) {
      await storage.updateEvent({
        id: editingEventId,
        title: formTitle,
        description: formDesc,
        startDate: formStart,
        endDate: formEnd,
        category: formCategory
      });
    } else {
      await storage.createEvent({
        title: formTitle,
        description: formDesc,
        startDate: formStart,
        endDate: formEnd,
        category: formCategory
      });
    }

    setIsModalOpen(false);
    resetForm();
    loadEvents();
  };

  const requestDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId) {
      await storage.deleteEvent(deleteConfirmationId);
      loadEvents();
      if (editingEventId === deleteConfirmationId) {
        setIsModalOpen(false);
      }
      setDeleteConfirmationId(null);
    }
  };

  const resetForm = () => {
    setEditingEventId(null);
    setFormTitle('');
    setFormDesc('');
    setFormStart('');
    setFormEnd('');
    setFormCategory('personal');
  };

  const openAddModal = (date?: Date) => {
    resetForm();
    const defaultDate = date ? format(date, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm");
    setFormStart(defaultDate);
    setFormEnd(defaultDate);
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setFormTitle(event.title);
    setFormDesc(event.description);
    setFormStart(format(parseISO(event.startDate), "yyyy-MM-dd'T'HH:mm"));
    setFormEnd(format(parseISO(event.endDate), "yyyy-MM-dd'T'HH:mm"));
    setFormCategory(event.category);
    setIsModalOpen(true);
  };

  // --- Filtering Logic ---
  
  const getFilteredEvents = () => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter(e => 
      e.title.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query) ||
      e.category.toLowerCase().includes(query)
    );
  };

  const filteredEvents = getFilteredEvents();
  const eventToDelete = deleteConfirmationId ? events.find(e => e.id === deleteConfirmationId) : null;

  // --- Views ---

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Fill start padding
    const startPadding = Array(monthStart.getDay()).fill(null);

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-gray-50 dark:bg-gray-900 p-2 text-center text-xs font-medium text-gray-500 uppercase">
            {d}
          </div>
        ))}
        {startPadding.map((_, i) => (
          <div key={`pad-${i}`} className="bg-white dark:bg-gray-900 h-24 sm:h-32" />
        ))}
        {days.map(day => {
          // Use filteredEvents here so search applies to grid
          const dayEvents = filteredEvents.filter(e => isSameDay(parseISO(e.startDate), day));
          return (
            <div 
              key={day.toString()} 
              className={`bg-white dark:bg-gray-900 p-2 min-h-[6rem] sm:min-h-[8rem] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative group
                ${isSameDay(day, new Date()) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
              onClick={() => openAddModal(day)}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
                  ${isSameDay(day, new Date()) ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {format(day, 'd')}
                </span>
                <button 
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500"
                  onClick={(e) => { e.stopPropagation(); openAddModal(day); }}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="mt-1 space-y-1">
                {dayEvents.map(ev => (
                  <div 
                    key={ev.id} 
                    onClick={(e) => { e.stopPropagation(); openEditModal(ev); }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        event: ev,
                        x: rect.left + rect.width / 2,
                        y: rect.top
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${CATEGORY_COLORS[ev.category]}`}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = (filter: 'today' | 'upcoming') => {
    // Start with the searched events
    let viewEvents = filteredEvents;
    const now = new Date();
    
    if (filter === 'today') {
      viewEvents = viewEvents.filter(e => isSameDay(parseISO(e.startDate), now));
    } else {
      const thirtyDaysLater = addDays(now, 30);
      viewEvents = viewEvents.filter(e => {
        const start = parseISO(e.startDate);
        return isWithinInterval(start, { start: now, end: thirtyDaysLater });
      }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }

    if (viewEvents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <CalendarIcon size={48} strokeWidth={1} className="mb-4 opacity-50" />
          <p className="text-lg">
            {searchQuery ? 'No matching events found.' : `No events ${filter === 'today' ? 'today' : 'upcoming'}.`}
          </p>
          {!searchQuery && (
            <Button variant="ghost" className="mt-4" onClick={() => openAddModal()}>Add Event</Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {viewEvents.map(event => (
          <SwipeableEventRow
            key={event.id}
            onEdit={() => openEditModal(event)}
            onDelete={() => requestDelete(event.id)}
            className="mb-4"
          >
            <div 
              className="group bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${CATEGORY_COLORS[event.category]}`}>
                  <span className="text-xs font-bold uppercase">{format(parseISO(event.startDate), 'MMM')}</span>
                  <span className="text-lg font-bold">{format(parseISO(event.startDate), 'd')}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                    <Clock size={14} />
                    {format(parseISO(event.startDate), 'h:mm a')} - {format(parseISO(event.endDate), 'h:mm a')}
                  </p>
                  {event.description && (
                    <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={(e) => requestDelete(event.id, e)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all hidden sm:block"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </SwipeableEventRow>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {viewMode === 'calendar' ? format(currentDate, 'MMMM yyyy') : `${viewMode} Events`}
          </h2>
          {viewMode === 'calendar' && (
            <div className="flex gap-2 mt-2">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <Button onClick={() => openAddModal()} className="shrink-0">
            <Plus size={18} />
            <span className="hidden sm:inline">New Event</span>
            <span className="inline sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar">
        {loading ? (
          <div className="w-full h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : viewMode === 'calendar' ? renderCalendarGrid() : renderListView(viewMode)}
      </div>

      {/* Edit/Create Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingEventId ? "Edit Event" : "Add Event"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Title" 
            value={formTitle} 
            onChange={e => setFormTitle(e.target.value)} 
            required 
            placeholder="Meeting with Team"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Start" 
              type="datetime-local" 
              value={formStart} 
              onChange={e => setFormStart(e.target.value)} 
              required 
            />
            <Input 
              label="End" 
              type="datetime-local" 
              value={formEnd} 
              onChange={e => setFormEnd(e.target.value)} 
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category</label>
            <div className="flex gap-2">
              {(Object.keys(CATEGORY_COLORS) as EventCategory[]).map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setFormCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all border
                    ${formCategory === cat 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500' 
                      : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <Input 
            label="Description" 
            value={formDesc} 
            onChange={e => setFormDesc(e.target.value)} 
            placeholder="Add details..."
          />
          <div className="pt-4 flex justify-end gap-3">
            {editingEventId && (
              <Button 
                type="button" 
                variant="danger" 
                onClick={() => requestDelete(editingEventId)}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingEventId ? 'Save Changes' : 'Create Event'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmationId}
        onClose={() => setDeleteConfirmationId(null)}
        title="Delete Event"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete {eventToDelete ? <span className="font-bold text-gray-900 dark:text-white">"{eventToDelete.title}"</span> : 'this event'}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirmationId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Event
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hover Tooltip */}
      {tooltip && (
        <div 
          className="fixed z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg dark:bg-gray-100 dark:text-gray-900 pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+8px)] w-max max-w-[200px]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-semibold truncate">{tooltip.event.title}</p>
          <p className="opacity-80">
            {format(parseISO(tooltip.event.startDate), 'h:mm a')} - {format(parseISO(tooltip.event.endDate), 'h:mm a')}
          </p>
          <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
        </div>
      )}
    </div>
  );
};