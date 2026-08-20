import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';

import authRoutes from './routes/auth.js';
import emailRoutes from './routes/email.js';
import templateRoutes from './routes/templates.js';
import historyRoutes from './routes/history.js';

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.VERCEL ? 'vercel-serverless' : 'local', timestamp: new Date().toISOString() });
});

// Registrar rutas
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/history', historyRoutes);

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// Solo iniciar listener TCP si no estamos en entorno Vercel Serverless
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`🚀 Servidor Gmail Outreach CRM corriendo en:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`================================================`);
  });
}

export default app;
