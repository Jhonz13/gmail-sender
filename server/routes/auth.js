import express from 'express';
import { getAuthUrl, handleOAuthCallback, revokeOAuthToken } from '../services/gmailService.js';
import { getTokens, getUserInfo, updateCredentials, getCredentials } from '../services/dbStore.js';

const router = express.Router();

// Estado de autenticación actual
router.get('/status', (req, res) => {
  const tokens = getTokens();
  const userInfo = getUserInfo();
  const credentials = getCredentials();

  const hasValidAuth = !!(tokens && (tokens.access_token || tokens.refresh_token));

  res.json({
    isAuthenticated: hasValidAuth,
    userInfo: userInfo || (hasValidAuth ? { email: 'Cuenta Gmail Conectada' } : null),
    hasCredentials: !!(credentials.clientId && credentials.clientSecret),
    credentials
  });
});

// Guardar credenciales personalizadas de Google Client ID & Secret
router.post('/credentials', (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'Debes proporcionar Client ID y Client Secret válidos.' });
  }
  updateCredentials(clientId.trim(), clientSecret.trim());
  res.json({ message: 'Credenciales de Google actualizadas correctamente.' });
});

// URL para redirigir a Google OAuth login
router.get('/google/url', (req, res) => {
  try {
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const dynamicRedirectUri = `${protocol}://${host}/api/auth/google/callback`;
    
    const url = getAuthUrl(dynamicRedirectUri);
    res.json({ url, redirectUri: dynamicRedirectUri });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Callback de respuesta de Google OAuth
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('No se recibió el código de autorización.');
  }

  try {
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const dynamicRedirectUri = `${protocol}://${host}/api/auth/google/callback`;

    await handleOAuthCallback(code, dynamicRedirectUri);
    // Redirigir de regreso a la interfaz de usuario en React
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Autenticación Exitosa</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: #f8fafc; margin: 0; }
            .card { background: #1e293b; padding: 2rem; border-radius: 1rem; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: #38bdf8; margin-bottom: 0.5rem; }
            p { color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>¡Autenticación con Gmail Exitosa!</h2>
            <p>Puedes cerrar esta ventana y regresar a la aplicación.</p>
          </div>
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage('oauth-success', '*');
                window.close();
              } else {
                window.location.href = window.location.origin;
              }
            }, 1200);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error en callback de OAuth:', err);
    res.status(500).send(`Error de autenticación: ${err.message}`);
  }
});

// Desconectar / revocar acceso de Gmail
router.post('/logout', async (req, res) => {
  try {
    await revokeOAuthToken();
    res.json({ message: 'Cuenta desconectada exitosamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
