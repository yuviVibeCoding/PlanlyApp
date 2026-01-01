import React from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  Clock
} from 'lucide-react';
import { ViewState } from '../../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
  showLogo?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, showLogo = true }) => {
  const menuItems = [
    { id: 'today', label: 'Today', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'upcoming', label: 'Upcoming', icon: Clock },
    { id: 'wishlist', label: 'Wishlist', icon: CheckSquare },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {showLogo && (
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Planly
          </h1>
        </div>
      )}

      <nav className={`flex-1 px-3 space-y-1 ${!showLogo ? 'pt-4' : ''}`}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${currentView === item.id 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <button
          onClick={() => onChangeView('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            ${currentView === 'settings' 
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};