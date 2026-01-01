import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import * as storage from './services/storage';
import { Sidebar } from './components/Dashboard/Sidebar';
import { CalendarModule } from './components/Modules/CalendarModule';
import { WishlistModule } from './components/Modules/WishlistModule';
import { Settings } from './components/Settings';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';
import { Menu, X } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('today');
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize App
  useEffect(() => {
    const init = async () => {
      await storage.initializeStorage();
      setIsLoading(false);
    };
    init();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const config = await storage.getAuthInfo();
      if (username === config.username && password === config.password) {
        setIsAuthenticated(true);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Database connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
            <div className="mb-8 text-center">
              <div className="w-12 h-12 bg-black dark:bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-white dark:bg-black rounded-full"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planly</h1>
              <p className="text-gray-500 mt-2">Enter your credentials to access.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <Input 
                label="Username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
              <Input 
                label="Password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <Button className="w-full" type="submit">Sign In</Button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-400">
              Default: im_suka / ThisIsThePassword
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'today':
        return <CalendarModule viewMode="today" />;
      case 'upcoming':
        return <CalendarModule viewMode="upcoming" />;
      case 'calendar':
        return <CalendarModule viewMode="calendar" />;
      case 'wishlist':
        return <WishlistModule />;
      case 'settings':
        return <Settings />;
      default:
        return <CalendarModule viewMode="today" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden relative">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <span className="font-bold text-lg dark:text-white">Menu</span>
            <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6 dark:text-white" /></button>
          </div>
          <Sidebar 
            currentView={currentView} 
            onChangeView={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }} 
            onLogout={handleLogout}
            showLogo={false} 
          />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r border-gray-200 dark:border-gray-800">
        <Sidebar 
          currentView={currentView} 
          onChangeView={setCurrentView} 
          onLogout={handleLogout} 
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full transition-all">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
          <span className="font-bold text-gray-900 dark:text-white">Planly</span>
          <div className="w-6" /> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}