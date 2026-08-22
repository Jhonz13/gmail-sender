import express from 'express';
import { 
  searchAraguaLeads, 
  crawlWebsiteForEmails, 
  ARAGUA_CITIES, 
  ARAGUA_SECTORS 
} from '../services/scraperService.js';

const router = express.Router();

// Obtener metadatos: ciudades de Aragua y sectores precargados
router.get('/options', (req, res) => {
  res.json({
    success: true,
    cities: ARAGUA_CITIES,
    sectors: ARAGUA_SECTORS
  });
});

// Buscar leads en Aragua
router.post('/search', async (req, res) => {
  try {
    const { cityId, sectorId, customQuery, limit } = req.body;
    const results = await searchAraguaLeads({ 
      cityId, 
      sectorId, 
      customQuery, 
      limit: parseInt(limit, 10) || 25 
    });
    res.json(results);
  } catch (error) {
    console.error('Error al realizar scraping de leads:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error en el motor de scraping: ' + error.message 
    });
  }
});

// Rastreo profundo directo a una URL o sitio web corporativo
router.post('/crawl-site', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Debe ingresar una URL válida' });
    }
    const result = await crawlWebsiteForEmails(url);
    res.json({
      success: true,
      url,
      ...result
    });
  } catch (error) {
    console.error('Error en rastreo web profundo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
