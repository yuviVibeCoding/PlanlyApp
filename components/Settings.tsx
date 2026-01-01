import React, { useState, useEffect } from 'react';
import { UserConfig } from '../types';
import * as storage from '../services/storage';
import * as driveService from '../services/drive';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Cloud, Check, Loader2, Server } from 'lucide-react';

export const Settings: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Drive State
  const [clientId, setClientId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [driveConnected, setDriveConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [usingBackendConfig, setUsingBackendConfig] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    // App Auth
    const config = await storage.getAuthInfo();
    setUsername(config.username);
    
    // Drive Config
    const driveConfig = storage.getDriveConfig();
    setClientId(driveConfig.clientId);
    setApiKey(driveConfig.apiKey);
    setDriveConnected(driveConfig.connected);

    // Check if we are using env vars
    const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (envId && envId.length > 0) {
        setUsingBackendConfig(true);
    }
  };

  const handleUpdateAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await storage.updateAuthInfo({ username, password });
      setMessage({ type: 'success', text: 'Credentials updated successfully.' });
      setPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update credentials.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectDrive = async () => {
    setIsSyncing(true);
    setMessage(null);

    try {
      // 1. Initialize GAPI (Already done in App.tsx usually, but safe to retry)
      await driveService.initializeGoogleServices(apiKey, clientId);
      
      // 2. Trigger Auth Popup
      await driveService.signIn();

      // 3. Save Connected State
      storage.setDriveConfig({
        clientId,
        apiKey,
        connected: true,
        fileId: undefined // Will be found during sync
      });

      // 4. Perform Initial Sync (Find file or create it)
      await storage.syncFromDrive();
      
      setDriveConnected(true);
      setMessage({ type: 'success', text: 'Connected to Google Drive! Data synced.' });
    } catch (error: any) {
      console.error(error);
      storage.setDriveConfig({ clientId, apiKey, connected: false });
      setMessage({ type: 'error', text: `Connection failed: ${error.message || 'Unknown error'}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectDrive = () => {
    driveService.signOut();
    storage.setDriveConfig({ clientId, apiKey, connected: false });
    setDriveConnected(false);
    setMessage({ type: 'success', text: 'Disconnected from Google Drive.' });
  };

  return (
    <div className="max-w-2xl space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings</h2>
        <p className="text-gray-500">Manage your account and data preferences.</p>
      </div>
      
      {/* Cloud Sync Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${driveConnected ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cloud Sync</h3>
            <p className="text-sm text-gray-500">
                {usingBackendConfig 
                    ? 'Storage configured via System Environment.' 
                    : 'Configure your Google Drive connection.'}
            </p>
          </div>
        </div>

        {usingBackendConfig ? (
            // SIMPLIFIED VIEW FOR ENV CONFIG
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    <Server size={16} />
                    <span>Project configured via <strong>.env</strong>. No manual setup required.</span>
                </div>
                
                {!driveConnected ? (
                     <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status: <strong>Not Connected</strong></span>
                        <Button onClick={handleConnectDrive} isLoading={isSyncing}>
                            Connect Account
                        </Button>
                     </div>
                ) : (
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                             <Check size={20} />
                             <span className="font-medium text-sm">Sync Active</span>
                        </div>
                        <Button variant="danger" onClick={handleDisconnectDrive}>
                            Disconnect
                        </Button>
                    </div>
                )}
            </div>
        ) : (
            // MANUAL CONFIG VIEW
            !driveConnected ? (
            <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Setup Instructions:</p>
                <ul className="list-disc pl-4 space-y-1 opacity-90">
                    <li>Create project in Google Cloud Console.</li>
                    <li>Enable Google Drive API.</li>
                    <li>Enter Client ID and API Key below.</li>
                </ul>
                </div>
                <Input 
                    label="Client ID" 
                    value={clientId} 
                    onChange={e => setClientId(e.target.value)} 
                    placeholder="apps.googleusercontent.com"
                />
                <Input 
                    label="API Key" 
                    value={apiKey} 
                    onChange={e => setApiKey(e.target.value)} 
                    placeholder="AIzaSy..."
                />
                <div className="flex justify-end pt-2">
                    <Button onClick={handleConnectDrive} isLoading={isSyncing}>
                        Connect Google Drive
                    </Button>
                </div>
            </div>
            ) : (
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                <Check size={20} />
                <span className="font-medium">Connected & Synced</span>
                </div>
                <div className="flex justify-end">
                <Button variant="danger" onClick={handleDisconnectDrive}>
                    Disconnect
                </Button>
                </div>
            </div>
            )
        )}
      </div>

      {/* Auth Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">App Credentials</h3>
        <p className="text-sm text-gray-500 mb-6">Update your login for this device.</p>
        
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
            <Button type="submit" isLoading={loading}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};