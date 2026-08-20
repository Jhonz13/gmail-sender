import fs from 'fs';
import path from 'path';
import { STORE_FILE, DATA_DIR, GOOGLE_CONFIG } from '../config.js';

const initialData = {
  tokens: null,
  userInfo: null,
  credentials: {
    clientId: GOOGLE_CONFIG.clientId || '',
    clientSecret: GOOGLE_CONFIG.clientSecret || ''
  },
  templates: [
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
  ],
  history: []
};

// Respaldo en memoria si el sistema de archivos no es escribible
let memoryStore = JSON.parse(JSON.stringify(initialData));

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

export function getStore() {
  ensureStoreExists();
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (error) {
    console.warn('Advertencia leyendo de archivo, usando memoria:', error.message);
  }
  return memoryStore;
}

export function saveStore(data) {
  memoryStore = data;
  ensureStoreExists();
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Advertencia guardando en disco, conservado en memoria:', error.message);
  }
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

export function saveTokens(tokens) {
  const store = getStore();
  store.tokens = tokens;
  saveStore(store);
}

export function getTokens() {
  const store = getStore();
  return store.tokens;
}

export function saveUserInfo(userInfo) {
  const store = getStore();
  store.userInfo = userInfo;
  saveStore(store);
}

export function getUserInfo() {
  const store = getStore();
  return store.userInfo;
}

export function clearAuth() {
  const store = getStore();
  store.tokens = null;
  store.userInfo = null;
  saveStore(store);
}

export function getTemplates() {
  const store = getStore();
  return store.templates || [];
}

export function saveTemplate(template) {
  const store = getStore();
  if (!store.templates) store.templates = [];
  
  if (template.id) {
    const idx = store.templates.findIndex(t => t.id === template.id);
    if (idx !== -1) {
      store.templates[idx] = { ...store.templates[idx], ...template, updatedAt: new Date().toISOString() };
    } else {
      store.templates.push({ ...template, id: template.id || `tpl-${Date.now()}`, createdAt: new Date().toISOString() });
    }
  } else {
    store.templates.push({ ...template, id: `tpl-${Date.now()}`, createdAt: new Date().toISOString() });
  }
  saveStore(store);
  return store.templates;
}

export function deleteTemplate(id) {
  const store = getStore();
  store.templates = (store.templates || []).filter(t => t.id !== id);
  saveStore(store);
  return store.templates;
}

export function addHistoryRecord(record) {
  const store = getStore();
  if (!store.history) store.history = [];
  store.history.unshift(record);
  saveStore(store);
  return store.history;
}

export function getHistory() {
  const store = getStore();
  return store.history || [];
}
