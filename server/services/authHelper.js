import { getUserInfo, normalizeUserEmail } from './dbStore.js';

export function getUserEmailFromRequest(req) {
  // 1. Header explícito enviado por el cliente
  const headerEmail = req.headers['x-user-email'];
  if (headerEmail) {
    const norm = normalizeUserEmail(headerEmail);
    if (norm) return norm;
  }

  // 2. Parámetro en el cuerpo o consulta
  const bodyEmail = req.body?.userEmail || req.query?.userEmail;
  if (bodyEmail) {
    const norm = normalizeUserEmail(bodyEmail);
    if (norm) return norm;
  }

  // 3. Tokens de Google enviados en los encabezados
  const headerTokens = req.headers['x-google-tokens'];
  if (headerTokens) {
    try {
      const parsed = typeof headerTokens === 'string' ? JSON.parse(headerTokens) : headerTokens;
      if (parsed?.email) {
        const norm = normalizeUserEmail(parsed.email);
        if (norm) return norm;
      }
    } catch (e) {}
  }

  // 4. Usuario autenticado actualmente en el almacén de datos
  const currentUser = getUserInfo();
  if (currentUser?.email) {
    const norm = normalizeUserEmail(currentUser.email);
    if (norm) return norm;
  }

  return null;
}
