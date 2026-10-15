import fs from 'fs';
import path from 'path';
import { STORE_FILE, DATA_DIR, GOOGLE_CONFIG, STORAGE_CONFIG } from '../config.js';

export function normalizeUserEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const clean = email.trim().toLowerCase();
  return clean.includes('@') ? clean : null;
}

const initialTemplates = [
  {
    id: 'template-1',
    name: 'Postulación Desarrollador Software',
    subject: 'Postulación a posición de Software Developer - {nombre}',
    body: 'Hola {nombre},\n\nEspero que te encuentres muy bien. Te escribo con gran entusiasmo ya que he estado siguiendo el trabajo de {empresa} y me identifico mucho con su visión.\n\nActualmente me encuentro buscando una nueva oportunidad como {puesto}. Adjunto mi CV en PDF para tu revisión.\n\nQuedo atento a tus comentarios y agradezco tu tiempo.\n\nSaludos cordiales,',
    createdAt: new Date().toISOString()
  },
  {
    id: 'template-2',
    name: 'Contacto Directo con Recruiter',
    subject: 'Contacto profesional - Oportunidades en {empresa}',
    body: 'Estimado/a {nombre},\n\nLe escribo directamente tras ver las oportunidades disponibles en {empresa}. Cuento con experiencia relevante para la posición de {puesto}.\n\nMe encantaría conversar brevemente o compartir más detalles sobre mi perfil. Adjunto mi CV actualizado.\n\nMuchas gracias por su atención,\nUn saludo,',
    createdAt: new Date().toISOString()
  }
];

const initialData = {
  tokens: null,
  userInfo: null,
  credentials: {
    clientId: GOOGLE_CONFIG.clientId || '',
    clientSecret: GOOGLE_CONFIG.clientSecret || ''
  },
  templates: initialTemplates,
  savedLists: [],
  history: [],
  users: {}
};

// Respaldo en memoria
let memoryStore = JSON.parse(JSON.stringify(initialData));
let kvInitialized = false;

function ensureStoreExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Advertencia: Sistema de archivos no escribible, usando almacenamiento en memoria:', err.message);
  }
}

// Sincronización asíncrona con Upstash Redis / Vercel KV si está configurado
async function syncToKv(store) {
  if (!STORAGE_CONFIG.kvUrl || !STORAGE_CONFIG.kvToken) return;
  try {
    await fetch(`${STORAGE_CONFIG.kvUrl}/set/gmail_crm_store`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STORAGE_CONFIG.kvToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(store))
    });
  } catch (err) {
    console.warn('[Vercel KV] Error sincronizando a la nube:', err.message);
  }
}

async function fetchFromKv() {
  if (!STORAGE_CONFIG.kvUrl || !STORAGE_CONFIG.kvToken) return null;
  try {
    const res = await fetch(`${STORAGE_CONFIG.kvUrl}/get/gmail_crm_store`, {
      headers: { Authorization: `Bearer ${STORAGE_CONFIG.kvToken}` }
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.result) return null;
    return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
  } catch (err) {
    console.warn('[Vercel KV] Error leyendo de la nube:', err.message);
    return null;
  }
}

// Inicializar KV en segundo plano si está disponible
if (STORAGE_CONFIG.kvUrl && STORAGE_CONFIG.kvToken) {
  fetchFromKv().then(remoteData => {
    if (remoteData && typeof remoteData === 'object') {
      memoryStore = { ...memoryStore, ...remoteData };
      kvInitialized = true;
      console.log('✅ Base de datos en la nube (Vercel KV / Upstash) conectada y sincronizada.');
    }
  }).catch(() => {});
}

export function getStore() {
  ensureStoreExists();
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (!parsed.users) parsed.users = {};
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Advertencia leyendo de archivo, usando memoria:', error.message);
  }
  if (!memoryStore.users) memoryStore.users = {};
  return memoryStore;
}

export function saveStore(data) {
  if (!data.users) data.users = {};
  memoryStore = data;
  ensureStoreExists();
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Advertencia guardando en disco, conservado en memoria:', error.message);
  }
  // Sincronizar en la nube si hay KV disponible
  syncToKv(data);
}

function ensureUserBucket(store, email) {
  const norm = normalizeUserEmail(email);
  if (!norm) return null;
  if (!store.users) store.users = {};
  if (!store.users[norm]) {
    store.users[norm] = {
      savedLists: [],
      templates: JSON.parse(JSON.stringify(initialTemplates)),
      history: [],
      activeRecipients: [],
      tokens: null,
      userInfo: { email: norm }
    };
  }
  if (!store.users[norm].savedLists) store.users[norm].savedLists = [];
  if (!store.users[norm].templates) store.users[norm].templates = JSON.parse(JSON.stringify(initialTemplates));
  if (!store.users[norm].history) store.users[norm].history = [];
  return store.users[norm];
}

export function getStorageInfo() {
  if (STORAGE_CONFIG.kvUrl && STORAGE_CONFIG.kvToken) {
    return {
      type: 'vercel-kv',
      name: 'Vercel KV / Upstash Redis',
      isPersistent: true,
      description: 'Sincronización multi-dispositivo en la nube activa.'
    };
  }
  if (STORAGE_CONFIG.isVercel) {
    return {
      type: 'ephemeral-vercel',
      name: 'Almacenamiento Temporal (Vercel)',
      isPersistent: false,
      description: 'Ejecutando en serverless sin base de datos KV. Configura Vercel KV en 1 clic para persistencia permanente.'
    };
  }
  return {
    type: 'local-disk',
    name: 'Almacenamiento Local Permanente',
    isPersistent: true,
    description: 'Archivo store.json guardado en disco del servidor.'
  };
}

export function updateCredentials(clientId, clientSecret) {
  const store = getStore();
  store.credentials = { clientId, clientSecret };
  saveStore(store);
}

export function getCredentials() {
  const store = getStore();
  const creds = store.credentials || {};
  return {
    clientId: creds.clientId || GOOGLE_CONFIG.clientId || '',
    clientSecret: creds.clientSecret || GOOGLE_CONFIG.clientSecret || ''
  };
}

export function saveTokens(tokens, userEmail = null) {
  const store = getStore();
  const current = store.tokens || {};
  store.tokens = { ...current, ...tokens };

  const norm = normalizeUserEmail(userEmail);
  if (norm) {
    const user = ensureUserBucket(store, norm);
    if (user) {
      user.tokens = { ...(user.tokens || {}), ...tokens };
    }
  }
  saveStore(store);
}

export function getTokens(userEmail = null) {
  const store = getStore();
  const norm = normalizeUserEmail(userEmail);
  if (norm && store.users && store.users[norm]?.tokens) {
    return store.users[norm].tokens;
  }
  return store.tokens;
}

export function saveUserInfo(userInfo) {
  const store = getStore();
  store.userInfo = userInfo;
  if (userInfo && userInfo.email) {
    const norm = normalizeUserEmail(userInfo.email);
    if (norm) {
      const user = ensureUserBucket(store, norm);
      if (user) {
        user.userInfo = userInfo;
      }
    }
  }
  saveStore(store);
}

export function getUserInfo(userEmail = null) {
  const store = getStore();
  const norm = normalizeUserEmail(userEmail);
  if (norm && store.users && store.users[norm]?.userInfo) {
    return store.users[norm].userInfo;
  }
  return store.userInfo;
}

export function clearAuth(userEmail = null) {
  const store = getStore();
  const norm = normalizeUserEmail(userEmail);
  if (norm && store.users && store.users[norm]) {
    store.users[norm].tokens = null;
  }
  store.tokens = null;
  store.userInfo = null;
  saveStore(store);
}

// ==========================================
// LISTAS DE CONTACTOS (Sincronizadas por Usuario)
// ==========================================

export function getSavedLists(userEmail = null) {
  const store = getStore();
  const norm = normalizeUserEmail(userEmail);
  if (norm && store.users && store.users[norm]) {
    const userLists = store.users[norm].savedLists || [];
    // Si el usuario aún no tiene listas en su buzón pero hay listas globales previas, vincularlas
    if (userLists.length === 0 && Array.isArray(store.savedLists) && store.savedLists.length > 0) {
      store.users[norm].savedLists = JSON.parse(JSON.stringify(store.savedLists));
      saveStore(store);
      return store.users[norm].savedLists;
    }
    return userLists;
  }
  return store.savedLists || [];
}

export function saveContactList(userEmailOrList, listMaybe) {
  let userEmail = null;
  let listObj = null;

  if (typeof userEmailOrList === 'object' && userEmailOrList !== null) {
    listObj = userEmailOrList;
  } else {
    userEmail = userEmailOrList;
    listObj = listMaybe || {};
  }

  const store = getStore();
  const norm = normalizeUserEmail(userEmail);
  const id = listObj.id || `list-${Date.now()}`;
  const newItem = {
    id,
    name: listObj.name || `Lista de Contactos (${listObj.recipients?.length || 0})`,
    recipients: listObj.recipients || [],
    updatedAt: new Date().toISOString()
  };

  // Guardar en la partición del usuario específico si existe
  if (norm) {
    const user = ensureUserBucket(store, norm);
    if (user) {
      const uIdx = user.savedLists.findIndex(l => l.id === id || l.name.toLowerCase() === newItem.name.toLowerCase());
      if (uIdx !== -1) {
        user.savedLists[uIdx] = { ...user.savedLists[uIdx], ...newItem };
      } else {
        user.savedLists.unshift(newItem);
      }
    }
  }

  // Guardar también en store.savedLists para compatibilidad
  if (!store.savedLists) store.savedLists = [];
  const idx = store.savedLists.findIndex(l => l.id === id || l.name.toLowerCase() === newItem.name.toLowerCase());
  if (idx !== -1) {
    store.savedLists[idx] = { ...store.savedLists[idx], ...newItem };
  } else {
    store.savedLists.unshift(newItem);
  }

  saveStore(store);

  if (norm && store.users && store.users[norm]) {
    return store.users[norm].savedLists;
  }
  return store.savedLists;
}

export function deleteContactList(userEmailOrId, idMaybe) {
  let userEmail = null;
  let id = null;

  if (idMaybe) {
    userEmail = userEmailOrId;
    id = idMaybe;
  } else {
    id = userEmailOrId;
  }

  const store = getStore();
  const norm = normalizeUserEmail(userEmail);

  if (norm && store.users && store.users[norm]) {
    store.users[norm].savedLists = (store.users[norm].savedLists || []).filter(l => l.id !== id);
  }
  store.savedLists = (store.savedLists || []).filter(l => l.id !== id);
  saveStore(store);

  if (norm && store.users && store.users[norm]) {
    return store.users[norm].savedLists;
  }
  return store.savedLists;
}

export function syncContactLists(userEmailOrLists, listsMaybe) {
  let userEmail = null;
  let incomingLists = [];

  if (Array.isArray(userEmailOrLists)) {
    incomingLists = userEmailOrLists;
  } else {
    userEmail = userEmailOrLists;
    incomingLists = Array.isArray(listsMaybe) ? listsMaybe : [];
  }

  const store = getStore();
  const norm = normalizeUserEmail(userEmail);
  const user = norm ? ensureUserBucket(store, norm) : null;
  const targetList = user ? user.savedLists : (store.savedLists || []);

  incomingLists.forEach(incoming => {
    if (!incoming || !Array.isArray(incoming.recipients)) return;
    const existingIndex = targetList.findIndex(
      l => (incoming.id && l.id === incoming.id) || (incoming.name && l.name.trim().toLowerCase() === incoming.name.trim().toLowerCase())
    );

    if (existingIndex !== -1) {
      const current = targetList[existingIndex];
      const incomingTime = new Date(incoming.updatedAt || 0).getTime();
      const currentTime = new Date(current.updatedAt || 0).getTime();
      if (incomingTime >= currentTime || (incoming.recipients.length > (current.recipients?.length || 0))) {
        targetList[existingIndex] = {
          ...current,
          ...incoming,
          id: current.id || incoming.id,
          updatedAt: incoming.updatedAt || new Date().toISOString()
        };
      }
    } else {
      targetList.unshift({
        id: incoming.id || `list-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: incoming.name || `Lista (${incoming.recipients.length})`,
        recipients: incoming.recipients || [],
        updatedAt: incoming.updatedAt || new Date().toISOString()
      });
    }
  });

  // Mantener también en el almacenamiento global como respaldo
  if (user) {
    store.savedLists = user.savedLists;
  }
  saveStore(store);
  return targetList;
}

// ==========================================
// PLANTILLAS (Sincronizadas por Usuario)
// ==========================================

export function getTemplates(userEmail = null) {
  const store = getStore();
  const norm = normalizeUserEmail(userEmail);
  if (norm && store.users && store.users[norm]) {
    return store.users[norm].templates || initialTemplates;
  }
  return store.templates || initialTemplates;
}

export function saveTemplate(userEmailOrTemplate, templateMaybe) {
  let userEmail = null;
  let template = null;

  if (typeof userEmailOrTemplate === 'object' && userEmailOrTemplate !== null) {
    template = userEmailOrTemplate;
  } else {
    userEmail = userEmailOrTemplate;
    template = templateMaybe || {};
  }

  const store = getStore();
  const norm = normalizeUserEmail(userEmail);
  const id = template.id || `tpl-${Date.now()}`;
  const newTemplate = {
    ...template,
    id,
    updatedAt: new Date().toISOString()
  };

  if (norm) {
    const user = ensureUserBucket(store, norm);
    if (user) {
      const idx = user.templates.findIndex(t => t.id === id);
      if (idx !== -1) {
        user.templates[idx] = { ...user.templates[idx], ...newTemplate };
      } else {
        user.templates.push({ ...newTemplate, createdAt: new Date().toISOString() });
      }
    }
  }

  if (!store.templates) store.templates = JSON.parse(JSON.stringify(initialTemplates));
  const idx = store.templates.findIndex(t => t.id === id);
  if (idx !== -1) {
    store.templates[idx] = { ...store.templates[idx], ...newTemplate };
  } else {
    store.templates.push({ ...newTemplate, createdAt: new Date().toISOString() });
  }

  saveStore(store);
  if (norm && store.users && store.users[norm]) {
    return store.users[norm].templates;
  }
  return store.templates;
}

export function deleteTemplate(userEmailOrId, idMaybe) {
  let userEmail = null;
  let id = null;

  if (idMaybe) {
    userEmail = userEmailOrId;
    id = idMaybe;
  } else {
    id = userEmailOrId;
  }

  const store = getStore();
  const norm = normalizeUserEmail(userEmail);
  if (norm && store.users && store.users[norm]) {
    store.users[norm].templates = (store.users[norm].templates || []).filter(t => t.id !== id);
  }
  store.templates = (store.templates || []).filter(t => t.id !== id);
  saveStore(store);

  if (norm && store.users && store.users[norm]) {
    return store.users[norm].templates;
  }
  return store.templates;
}

// ==========================================
// HISTORIAL DE ENVÍOS (Sincronizado por Usuario)
// ==========================================

export function addHistoryRecord(userEmailOrRecord, recordMaybe) {
  let userEmail = null;
  let record = null;

  if (typeof userEmailOrRecord === 'object' && userEmailOrRecord !== null) {
    record = userEmailOrRecord;
  } else {
    userEmail = userEmailOrRecord;
    record = recordMaybe || {};
  }

  const store = getStore();
  const norm = normalizeUserEmail(userEmail);

  if (norm) {
    const user = ensureUserBucket(store, norm);
    if (user) {
      if (!user.history) user.history = [];
      user.history.unshift(record);
    }
  }

  if (!store.history) store.history = [];
  store.history.unshift(record);
  saveStore(store);

  if (norm && store.users && store.users[norm]) {
    return store.users[norm].history;
  }
  return store.history;
}

export function getHistory(userEmail = null) {
  const store = getStore();
  const norm = normalizeUserEmail(userEmail);
  if (norm && store.users && store.users[norm]) {
    return store.users[norm].history || [];
  }
  return store.history || [];
}
