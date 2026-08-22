import express from 'express';
import { getSavedLists, saveContactList, deleteContactList } from '../services/dbStore.js';

const router = express.Router();

// Obtener todas las listas guardadas
router.get('/', (req, res) => {
  try {
    const lists = getSavedLists();
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guardar o actualizar una lista de contactos
router.post('/', (req, res) => {
  try {
    const { id, name, recipients } = req.body;
    if (!recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'La lista de destinatarios es requerida.' });
    }

    const updatedLists = saveContactList({ id, name, recipients });
    res.json({ message: 'Lista guardada con éxito', lists: updatedLists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una lista guardada por ID
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updatedLists = deleteContactList(id);
    res.json({ message: 'Lista eliminada', lists: updatedLists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
