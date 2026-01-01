import { AppDatabase } from '../types';

// Configuration
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DB_FILE_NAME = 'db.json'; 

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

/**
 * 1. Authentication & Initialization
 */
export const initializeGoogleServices = async (apiKey: string, clientId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const checkGapi = () => {
      if ((window as any).gapi) {
        (window as any).gapi.load('client', async () => {
          try {
            await (window as any).gapi.client.init({
              apiKey: apiKey,
              discoveryDocs: [DISCOVERY_DOC],
            });
            gapiInited = true;
            if (gisInited) resolve();
          } catch (err) {
            reject(err);
          }
        });
      } else {
        setTimeout(checkGapi, 100);
      }
    };

    const checkGis = () => {
      if ((window as any).google) {
        tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: '', // Callback defined at request time
        });
        gisInited = true;
        if (gapiInited) resolve();
      } else {
        setTimeout(checkGis, 100);
      }
    };

    checkGapi();
    checkGis();
  });
};

export const signIn = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject('Google Services not initialized');

    tokenClient.callback = async (resp: any) => {
      if (resp.error) reject(resp);
      resolve();
    };

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const trySilentSignIn = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!tokenClient) {
        resolve(false); 
        return;
    }

    // Try to request token without prompt. 
    // Note: GIS doesn't strictly support silent auth like gapi.auth2 did, 
    // but we can check if gapi has a valid token or try a non-consenting request.
    // Ideally, for "Ready to Use", we rely on the session remaining active in the browser tab 
    // or simply prompting once.
    
    // However, we can try to skip consent if previously granted
    tokenClient.callback = (resp: any) => {
        if (resp.error) {
            resolve(false);
        } else {
            resolve(true);
        }
    };
    
    // 'select_account' is less intrusive than 'consent', but still shows a popup.
    // Currently, best practice for SPA is just prompt when action needed.
    // But for this "App" feel, we return false and let user click connect if needed,
    // OR we can assume if they have a token in gapi client it's good.
    
    const currentToken = (window as any).gapi?.client?.getToken();
    if (currentToken && Date.now() < currentToken.expires_in * 1000 + currentToken.issued_at) {
        resolve(true);
    } else {
        // We cannot force silent renewal without backend. 
        // We will return false, requiring user to click "Connect" again if session lost.
        resolve(false);
    }
  });
};

export const hasValidToken = (): boolean => {
    return (window as any).gapi?.client?.getToken() !== null;
}

export const signOut = () => {
  const token = (window as any).gapi.client.getToken();
  if (token !== null) {
    (window as any).google.accounts.oauth2.revoke(token.access_token);
    (window as any).gapi.client.setToken('');
  }
};

/**
 * 2. File Initialization
 */
export const initDatabaseFile = async (defaultData: AppDatabase): Promise<string> => {
  try {
    const response = await (window as any).gapi.client.drive.files.list({
      q: `name = '${DB_FILE_NAME}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    
    const files = response.result.files;
    
    if (files && files.length > 0) {
      return files[0].id;
    }

    return await createDatabaseFile(defaultData);
  } catch (err) {
    console.error('Error initializing DB file:', err);
    throw err;
  }
};

const createDatabaseFile = async (data: AppDatabase): Promise<string> => {
  const fileContent = JSON.stringify(data);
  const metadata = {
    name: DB_FILE_NAME,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const accessToken = (window as any).gapi.client.getToken().access_token;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  });

  const result = await response.json();
  return result.id;
};

/**
 * 3. CRUD Operations
 */
export const getData = async (fileId: string): Promise<AppDatabase> => {
  try {
    const response = await (window as any).gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    return response.result as AppDatabase;
  } catch (err) {
    console.error('Error fetching data:', err);
    throw err;
  }
};

export const updateData = async (fileId: string, newData: AppDatabase): Promise<void> => {
  const fileContent = JSON.stringify(newData, null, 2);
  const metadata = { mimeType: 'application/json' };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const accessToken = (window as any).gapi.client.getToken().access_token;

  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
    method: 'PATCH',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  });
};