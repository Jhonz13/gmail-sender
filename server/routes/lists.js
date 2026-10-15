import express from 'express';
import { getSavedLists, saveContactList, deleteContactList, syncContactLists } from '../services/dbStore.js';
import { getUserEmailFromRequest } from '../services/authHelper.js';

const router = express.Router();

// Obtener todas las listas guardadas del usuario actual
router.get('/', (req, res) => {
  try {
    const userEmail = getUserEmailFromRequest(req);
    const lists = getSavedLists(userEmail);
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guardar o actualizar una lista de contactos para el usuario
router.post('/', (req, res) => {
  try {
    const userEmail = getUserEmailFromRequest(req);
    const { id, name, recipients } = req.body;
    if (!recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'La lista de destinatarios es requerida.' });
    }

    const updatedLists = saveContactList(userEmail, { id, name, recipients });
    res.json({ message: 'Lista guardada con éxito', lists: updatedLists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sincronizar listas en lote (para fusionar listas locales al iniciar sesión o importar respaldo)
router.post('/sync', (req, res) => {
  try {
    const userEmail = getUserEmailFromRequest(req);
    const { lists } = req.body;
    if (!Array.isArray(lists)) {
      return res.status(400).json({ error: 'Se requiere un arreglo de listas para sincronizar.' });
    }

    const updatedLists = syncContactLists(userEmail, lists);
    res.json({ message: 'Listas sincronizadas con éxito', lists: updatedLists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una lista guardada por ID
router.delete('/:id', (req, res) => {
  try {
    const userEmail = getUserEmailFromRequest(req);
    const { id } = req.params;
    const updatedLists = deleteContactList(userEmail, id);
    res.json({ message: 'Lista eliminada', lists: updatedLists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
