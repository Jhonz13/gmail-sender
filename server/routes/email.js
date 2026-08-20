import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { UPLOADS_DIR } from '../config.js';
import { queueService } from '../services/queueService.js';
import { getTokens } from '../services/dbStore.js';

const router = express.Router();

// Garantizar que la carpeta temporal de subidas exista
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Advertencia creando UPLOADS_DIR:', e.message);
}

const upload = multer({ dest: UPLOADS_DIR, limits: { fileSize: 10 * 1024 * 1024 } }); // Máximo 10MB para CV PDF

// Verificar si se puede enviar correos (autenticado)
function requireAuth(req, res, next) {
  const tokens = getTokens();
  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: 'Debes conectar tu cuenta de Gmail antes de enviar correos.' });
  }
  next();
}

// Iniciar campaña de envíos
router.post('/send', requireAuth, upload.single('attachment'), async (req, res) => {
  try {
    const { recipientsJson, subject, body, delaySeconds } = req.body;

    if (!recipientsJson || !subject || !body) {
      return res.status(400).json({ error: 'Asunto, cuerpo y lista de destinatarios son requeridos.' });
    }

    let recipients;
    try {
      recipients = JSON.parse(recipientsJson);
    } catch (e) {
      return res.status(400).json({ error: 'El formato de destinatarios es inválido.' });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'La lista de destinatarios debe contener al menos un contacto.' });
    }

    const fileAttachment = req.file || null;

    const state = await queueService.startJob({
      recipients,
      subject,
      body,
      delaySeconds: delaySeconds || 5,
      attachment: fileAttachment
    });

    res.json({ message: 'Campaña iniciada con éxito', state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Estado actual del envío en progreso
router.get('/status', (req, res) => {
  res.json(queueService.getCurrentState());
});

// Pausar envío
router.post('/pause', (req, res) => {
  res.json(queueService.pauseJob());
});

// Reanudar envío
router.post('/resume', (req, res) => {
  res.json(queueService.resumeJob());
});

// Cancelar envío
router.post('/cancel', (req, res) => {
  res.json(queueService.cancelJob());
});

export default router;
