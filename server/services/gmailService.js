import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { GOOGLE_CONFIG } from '../config.js';
import { getCredentials, getTokens, saveTokens, saveUserInfo, clearAuth } from './dbStore.js';

export function getOAuth2Client() {
  const customCreds = getCredentials();
  const clientId = customCreds.clientId || GOOGLE_CONFIG.clientId;
  const clientSecret = customCreds.clientSecret || GOOGLE_CONFIG.clientSecret;

  if (!clientId || !clientSecret) {
    throw new Error('Falta configurar el GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.');
  }

  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    GOOGLE_CONFIG.redirectUri
  );

  const savedTokens = getTokens();
  if (savedTokens) {
    oAuth2Client.setCredentials(savedTokens);
  }

  oAuth2Client.on('tokens', (tokens) => {
    const currentTokens = getTokens() || {};
    const mergedTokens = { ...currentTokens, ...tokens };
    saveTokens(mergedTokens);
  });

  return oAuth2Client;
}

export function getAuthUrl() {
  const oAuth2Client = getOAuth2Client();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_CONFIG.scopes
  });
}

export async function handleOAuthCallback(code) {
  const oAuth2Client = getOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  saveTokens(tokens);

  // Intentar obtener info del usuario conectado
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
    const userRes = await oauth2.userinfo.get();
    const userInfo = {
      email: userRes.data.email,
      name: userRes.data.name,
      picture: userRes.data.picture
    };
    saveUserInfo(userInfo);
    return { tokens, userInfo };
  } catch (err) {
    console.warn('No se pudo obtener información ampliada del usuario:', err.message);
    const userInfo = { email: 'Cuenta Conectada' };
    saveUserInfo(userInfo);
    return { tokens, userInfo };
  }
}

export async function revokeOAuthToken() {
  const tokens = getTokens();
  if (tokens && tokens.access_token) {
    try {
      const oAuth2Client = getOAuth2Client();
      await oAuth2Client.revokeToken(tokens.access_token);
    } catch (e) {
      console.warn('No se pudo revocar token remotamente:', e.message);
    }
  }
  clearAuth();
}

/**
 * Convierte un mail en formato RFC 822 / MIME usando Nodemailer y lo envía mediante Gmail API
 */
export async function sendEmailViaGmail({ to, subject, bodyHtml, bodyText, attachment }) {
  const oAuth2Client = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // Usamos nodemailer mailcomposer para generar el mensaje base64url limpio
  const mailOptions = {
    to,
    subject,
    html: bodyHtml,
    text: bodyText || bodyHtml.replace(/<[^>]+>/g, '')
  };

  if (attachment) {
    mailOptions.attachments = [
      {
        filename: attachment.originalname || attachment.filename,
        path: attachment.path,
        contentType: attachment.mimetype
      }
    ];
  }

  const transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows'
  });

  const mailInfo = await transporter.sendMail(mailOptions);

  // Convertir stream a buffer
  const rawMessageBuffer = await new Promise((resolve, reject) => {
    const chunks = [];
    mailInfo.message.on('data', (chunk) => chunks.push(chunk));
    mailInfo.message.on('end', () => resolve(Buffer.concat(chunks)));
    mailInfo.message.on('error', reject);
  });

  // Codificación segura Base64URL requerida por la API de Gmail
  const rawBase64Url = rawMessageBuffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: rawBase64Url
    }
  });

  return response.data;
}
