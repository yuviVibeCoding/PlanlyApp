import React, { useState, useEffect } from 'react';
import * as storage from '../services/storage';
import { isConfigured, FIREBASE_CONFIG } from '../services/firebase';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Database, Check, AlertTriangle, Copy } from 'lucide-react';

export const Settings: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState(false);

  useEffect(() => {
    loadConfig();
    setDbStatus(isConfigured);
  }, []);

  const loadConfig = async () => {
    // App Auth
    const config = await storage.getAuthInfo();
    setUsername(config.username);
  };

  const handleUpdateAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await storage.updateAuthInfo({ username, password });
      setMessage({ type: 'success', text: 'Credentials updated in Firestore. All users will use these to login.' });
      setPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update credentials. Check console.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings</h2>
        <p className="text-gray-500">Global application configuration.</p>
      </div>
      
      {/* Database Status */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${dbStatus ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Database Connection</h3>
            <p className="text-sm text-gray-500">
               {dbStatus ? `Connected to Firebase Project: ${FIREBASE_CONFIG.projectId}` : "Firebase not configured."}
            </p>
          </div>
        </div>

        {dbStatus ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                <Check size={20} />
                <span className="font-medium">System Online</span>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="flex items-start gap-3 text-orange-700 bg-orange-50 p-4 rounded-xl">
                    <AlertTriangle size={20} className="mt-0.5" />
                    <div className="text-sm">
                        <p className="font-bold mb-1">Missing Configuration</p>
                        <p>To connect all users to the same database, you must provide the Firebase Config in <code>services/firebase.ts</code> or via <code>.env</code> variables.</p>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Auth Section */}
      {dbStatus && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Admin Access</h3>
            <p className="text-sm text-gray-500 mb-6">
                Update the global login credentials for the dashboard. These changes will apply to <strong>all users</strong> immediately.
            </p>
            
            <form onSubmit={handleUpdateAuth} className="space-y-6">
            <Input 
                label="Username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required
            />
            <Input 
                label="New Password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter new password"
                required
            />
            
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
                </div>
            )}

            <div className="flex justify-end">
                <Button type="submit" isLoading={loading}>Update Credentials</Button>
            </div>
            </form>
        </div>
      )}
    </div>
  );
};