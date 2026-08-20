import express from 'express';
import { getTemplates, saveTemplate, deleteTemplate } from '../services/dbStore.js';

const router = express.Router();

// Listar plantillas
router.get('/', (req, res) => {
  res.json(getTemplates());
});

// Crear o actualizar plantilla
router.post('/', (req, res) => {
  const { id, name, subject, body } = req.body;
  if (!name || !subject || !body) {
    return res.status(400).json({ error: 'Nombre, asunto y cuerpo son requeridos para guardar una plantilla.' });
  }
  const updatedList = saveTemplate({ id, name, subject, body });
  res.json({ message: 'Plantilla guardada con éxito', templates: updatedList });
});

// Eliminar plantilla
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const updatedList = deleteTemplate(id);
  res.json({ message: 'Plantilla eliminada', templates: updatedList });
});

export default router;
