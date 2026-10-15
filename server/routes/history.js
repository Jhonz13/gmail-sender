import express from 'express';
import { getHistory } from '../services/dbStore.js';
import { getUserEmailFromRequest } from '../services/authHelper.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const userEmail = getUserEmailFromRequest(req);
    res.json(getHistory(userEmail));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
