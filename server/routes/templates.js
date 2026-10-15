import express from 'express';
import { getTemplates, saveTemplate, deleteTemplate } from '../services/dbStore.js';
import { getUserEmailFromRequest } from '../services/authHelper.js';

const router = express.Router();

// Listar plantillas del usuario
router.get('/', (req, res) => {
  try {
    const userEmail = getUserEmailFromRequest(req);
    res.json(getTemplates(userEmail));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear o actualizar plantilla para el usuario
router.post('/', (req, res) => {
  try {
    const userEmail = getUserEmailFromRequest(req);
    const { id, name, subject, body } = req.body;
    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'Nombre, asunto y cuerpo son requeridos para guardar una plantilla.' });
    }
    const updatedList = saveTemplate(userEmail, { id, name, subject, body });
    res.json({ message: 'Plantilla guardada con éxito', templates: updatedList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar plantilla
router.delete('/:id', (req, res) => {
  try {
    const userEmail = getUserEmailFromRequest(req);
    const { id } = req.params;
    const updatedList = deleteTemplate(userEmail, id);
    res.json({ message: 'Plantilla eliminada', templates: updatedList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
