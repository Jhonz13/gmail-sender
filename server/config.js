import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

export const PORT = process.env.PORT || 3001;

export const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]
};

// Definir ubicación de almacenamiento permanente
// En servidor local (PC) usa la carpeta 'server/data' para que los datos NO se borren al reiniciar.
// En entorno serverless Vercel usa os.tmpdir()
export const DATA_DIR = process.env.VERCEL 
  ? path.join(os.tmpdir(), 'gmail-outreach-data')
  : path.join(__dirname, 'data');

export const STORE_FILE = path.join(DATA_DIR, 'store.json');
export const UPLOADS_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'gmail-outreach-uploads')
  : path.join(__dirname, 'uploads');
