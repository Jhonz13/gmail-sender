import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function ScraperDashboard({ onImportToCampaign }) {
  const [cities, setCities] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedCity, setSelectedCity] = useState('maracay');
  const [selectedSector, setSelectedSector] = useState('comercio');
  const [customQuery, setCustomQuery] = useState('');
  const [limit, setLimit] = useState(50);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [filterGmailOnly, setFilterGmailOnly] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Crawl sitio único en vivo
  const [singleUrl, setSingleUrl] = useState('');
  const [crawlingSingle, setCrawlingSingle] = useState(false);
  const [singleResult, setSingleResult] = useState(null);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const res = await api.getScraperOptions();
      if (res.cities) setCities(res.cities);
      if (res.sectors) setSectors(res.sectors);
    } catch (err) {
      console.error('Error al cargar opciones de scraper:', err);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);
    setSelectedLeads(new Set());

    try {
      const data = await api.searchLeads({
        cityId: selectedCity,
        sectorId: selectedSector,
        customQuery,
        limit
      });
      setResults(data);
      if (data.leads) {
        // Seleccionar por defecto todos los Gmails encontrados
        const initialSelected = new Set(
          data.leads.map(l => l.id)
        );
        setSelectedLeads(initialSelected);
      }
    } catch (err) {
      setError(err.message || 'Error durante la búsqueda de leads');
    } finally {
      setLoading(false);
    }
  };

  const handleCrawlSingleSite = async (e) => {
    e.preventDefault();
    if (!singleUrl.trim()) return;
    setCrawlingSingle(true);
    setSingleResult(null);

    try {
      const res = await api.crawlSite(singleUrl);
      setSingleResult(res);
      if (res.emails && res.emails.length > 0) {
        // Generar leads automáticamente para importarlos
        const newLeads = res.emails.map((email, idx) => ({
          id: `crawl_${Date.now()}_${idx}`,
          companyName: res.title || `Empresa de ${singleUrl}`,
          email: email,
          isGmail: email.includes('@gmail.com'),
          phone: res.phones[0] || 'N/A',
          city: 'Estado Aragua',
          sector: 'Rastreo Web en Vivo',
          sourceUrl: singleUrl
        }));

        setResults({
          success: true,
          query: { city: 'Rastreo Web', sector: singleUrl },
          totalFound: newLeads.length,
          gmailsFound: newLeads.filter(l => l.isGmail).length,
          corporateFound: newLeads.filter(l => !l.isGmail).length,
          leads: newLeads
        });
        setSelectedLeads(new Set(newLeads.map(l => l.id)));
      }
    } catch (err) {
      alert('Error en rastreo web: ' + err.message);
    } finally {
      setCrawlingSingle(false);
    }
  };

  const toggleSelectLead = (id) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedLeads(next);
  };

  const toggleSelectAll = (filteredLeads) => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const exportToCSV = (leadsToExport) => {
    if (!leadsToExport || leadsToExport.length === 0) return;
    
    const headers = ['Empresa', 'Email', 'Es Gmail', 'Teléfono', 'Ciudad', 'Fuente'];
    const rows = leadsToExport.map(l => [
      `"${(l.companyName || '').replace(/"/g, '""')}"`,
      `"${l.email}"`,
      l.isGmail ? 'Sí' : 'No',
      `"${l.phone || ''}"`,
      `"${l.city}"`,
      `"${l.sourceUrl || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_aragua_${selectedCity}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSelected = () => {
    if (!results || !results.leads) return;
    const leadsToImport = results.leads.filter(l => selectedLeads.has(l.id));
    if (leadsToImport.length === 0) {
      alert('Por favor selecciona al menos un lead para importar.');
      return;
    }

    const formattedRecipients = leadsToImport.map(l => ({
      email: l.email,
      nombre: l.companyName.split(' ')[0] || 'Contacto',
      empresa: l.companyName,
      puesto: 'Gerencia / Contacto Comercial'
    }));

    if (onImportToCampaign) {
      onImportToCampaign(formattedRecipients);
    }
  };

  // Filtrado de resultados
  const filteredLeads = (results?.leads || []).filter(lead => {
    if (filterGmailOnly && !lead.isGmail) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        lead.email.toLowerCase().includes(q) ||
        lead.companyName.toLowerCase().includes(q) ||
        (lead.phone && lead.phone.includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      {/* Encabezado Principal */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(234, 67, 53, 0.15) 0%, rgba(66, 133, 244, 0.15) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        marginBottom: '1.5rem',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              🔍 Buscador de Gmails & Leads en Vivo (Estado Aragua)
            </h1>
            <p style={{ margin: '0.4rem 0 0 0', color: '#9aa0a6', fontSize: '0.95rem' }}>
              Extracción directa de empresas en Maracay, Turmero, Cagua, La Victoria, Palo Negro, El Limón, Villa de Cura y San Mateo.
            </p>
          </div>
          <div style={{ background: '#1e2330', padding: '0.6rem 1rem', borderRadius: '10px', fontSize: '0.85rem', color: '#e8eaed', border: '1px solid #3c4043' }}>
            🇻🇪 Región Objetivo: <strong>Estado Aragua, Venezuela</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Columna Izquierda: Filtros y Configuración */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <form onSubmit={handleSearch} style={{
            background: '#1e2330',
            border: '1px solid #3c4043',
            borderRadius: '14px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#4285f4', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚙️ Filtros de Búsqueda
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9aa0a6', marginBottom: '0.3rem' }}>
                📍 Ciudad / Municipio de Aragua:
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  background: '#131722',
                  color: '#fff',
                  border: '1px solid #3c4043',
                  fontSize: '0.9rem'
                }}
              >
                {cities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9aa0a6', marginBottom: '0.3rem' }}>
                📦 Sector / Categoría Económica:
              </label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  background: '#131722',
                  color: '#fff',
                  border: '1px solid #3c4043',
                  fontSize: '0.9rem'
                }}
              >
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9aa0a6', marginBottom: '0.3rem' }}>
                🔎 Término Personalizado (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ej: repuestos toyota, bodegón..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  background: '#131722',
                  color: '#fff',
                  border: '1px solid #3c4043',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9aa0a6', marginBottom: '0.3rem' }}>
                🎯 Cantidad Máxima de Leads:
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  background: '#131722',
                  color: '#fff',
                  border: '1px solid #3c4043',
                  fontSize: '0.9rem'
                }}
              >
                <option value={15}>15 contactos</option>
                <option value={25}>25 contactos</option>
                <option value={50}>50 contactos (Extensivo)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                background: loading ? '#555' : 'linear-gradient(135deg, #ea4335 0%, #4285f4 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>⏳ Buscando leads en Aragua...</>
              ) : (
                <>🚀 Buscar Leads en Aragua</>
              )}
            </button>
          </form>

          {/* Rastrear sitio corporativo específico en vivo */}
          <div style={{
            background: '#1e2330',
            border: '1px solid #3c4043',
            borderRadius: '14px',
            padding: '1.25rem'
          }}>
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem', color: '#e8eaed' }}>
              🌐 Rastreador Web de Sitio / URL en Vivo
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#9aa0a6', margin: '0 0 0.8rem 0' }}>
              Ingresa cualquier URL o dominio web para rastrear sus correos en vivo:
            </p>
            <form onSubmit={handleCrawlSingleSite} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <input
                type="text"
                placeholder="https://empresa-maracay.com"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                style={{
                  padding: '0.5rem 0.7rem',
                  borderRadius: '6px',
                  background: '#131722',
                  color: '#fff',
                  border: '1px solid #3c4043',
                  fontSize: '0.85rem'
                }}
              />
              <button
                type="submit"
                disabled={crawlingSingle}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: '#34a853',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: crawlingSingle ? 'not-allowed' : 'pointer'
                }}
              >
                {crawlingSingle ? 'Rastreando sitio...' : 'Rastrear Correos en Vivo'}
              </button>
            </form>

            {singleResult && (
              <div style={{ marginTop: '0.8rem', background: '#131722', padding: '0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 'bold', color: '#34a853' }}>✅ Título: {singleResult.title || 'Sitio procesado'}</div>
                <div style={{ marginTop: '0.3rem' }}>
                  <strong>Correos:</strong> {singleResult.emails.length > 0 ? singleResult.emails.join(', ') : 'Ninguno hallado'}
                </div>
                {singleResult.phones.length > 0 && (
                  <div><strong>Teléfonos:</strong> {singleResult.phones.join(', ')}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Resultados y Acciones */}
        <div>
          {error && (
            <div style={{
              background: 'rgba(234, 67, 53, 0.15)',
              border: '1px solid #ea4335',
              borderRadius: '10px',
              padding: '1rem',
              color: '#ea4335',
              marginBottom: '1rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          {loading && (
            <div style={{
              background: '#1e2330',
              border: '1px solid #3c4043',
              borderRadius: '14px',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔄</div>
              <h3 style={{ margin: 0, color: '#4285f4' }}>Obteniendo gmails de empresas en {cities.find(c => c.id === selectedCity)?.name || 'Aragua'}...</h3>
              <p style={{ color: '#9aa0a6', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Procesando empresas de la zona. Priorizando cuentas @gmail.com reales con datos de contacto...
              </p>
            </div>
          )}

          {!loading && !results && !error && (
            <div style={{
              background: '#1e2330',
              border: '1px dashed #3c4043',
              borderRadius: '14px',
              padding: '4rem 2rem',
              textAlign: 'center',
              color: '#9aa0a6'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
              <h3 style={{ margin: 0, color: '#e8eaed' }}>Buscador de Leads Aragua</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Selecciona tu ciudad objetivo (Maracay, Turmero, Cagua, La Victoria, etc.) y sector empresarial y presiona <strong>"Buscar Leads en Aragua"</strong>.
              </p>
            </div>
          )}

          {!loading && results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Barra de Estadísticas y Filtros Rápidos */}
              <div style={{
                background: '#1e2330',
                border: '1px solid #3c4043',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#9aa0a6', display: 'block' }}>Total Leads:</span>
                    <strong style={{ fontSize: '1.2rem', color: '#e8eaed' }}>{results.totalFound}</strong>
                  </div>
                  <div style={{ height: '30px', width: '1px', background: '#3c4043' }} />
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#9aa0a6', display: 'block' }}>🟢 Gmails:</span>
                    <strong style={{ fontSize: '1.2rem', color: '#34a853' }}>{results.gmailsFound}</strong>
                  </div>
                  <div style={{ height: '30px', width: '1px', background: '#3c4043' }} />
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#9aa0a6', display: 'block' }}>🔵 Corporativos:</span>
                    <strong style={{ fontSize: '1.2rem', color: '#4285f4' }}>{results.corporateFound}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={filterGmailOnly}
                      onChange={(e) => setFilterGmailOnly(e.target.checked)}
                    />
                    Solo Gmails (@gmail.com)
                  </label>
                  
                  <input
                    type="text"
                    placeholder="Filtrar resultados..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{
                      padding: '0.4rem 0.7rem',
                      borderRadius: '6px',
                      background: '#131722',
                      color: '#fff',
                      border: '1px solid #3c4043',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Acciones para leads seleccionados */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#9aa0a6' }}>
                  Seleccionados: <strong>{selectedLeads.size}</strong> de {filteredLeads.length} leads
                </div>

                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button
                    onClick={() => exportToCSV(filteredLeads.filter(l => selectedLeads.has(l.id)))}
                    disabled={selectedLeads.size === 0}
                    style={{
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      background: selectedLeads.size === 0 ? '#333' : '#1e2330',
                      color: selectedLeads.size === 0 ? '#666' : '#fff',
                      border: '1px solid #3c4043',
                      cursor: selectedLeads.size === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    📥 Exportar CSV
                  </button>

                  <button
                    onClick={handleImportSelected}
                    disabled={selectedLeads.size === 0}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '8px',
                      background: selectedLeads.size === 0 ? '#444' : '#34a853',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: selectedLeads.size === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: selectedLeads.size > 0 ? '0 0 12px rgba(52, 168, 83, 0.4)' : 'none'
                    }}
                  >
                    ➕ Cargar {selectedLeads.size} a Envíos masivos
                  </button>
                </div>
              </div>

              {/* Tabla de Resultados */}
              <div style={{
                background: '#1e2330',
                border: '1px solid #3c4043',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#131722', borderBottom: '1px solid #3c4043', color: '#9aa0a6' }}>
                      <th style={{ padding: '0.8rem', width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={filteredLeads.length > 0 && selectedLeads.size === filteredLeads.length}
                          onChange={() => toggleSelectAll(filteredLeads)}
                        />
                      </th>
                      <th style={{ padding: '0.8rem' }}>Empresa / Negocio</th>
                      <th style={{ padding: '0.8rem' }}>Correo Electrónico</th>
                      <th style={{ padding: '0.8rem' }}>Teléfono</th>
                      <th style={{ padding: '0.8rem' }}>Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#9aa0a6' }}>
                          No se encontraron leads con los filtros actuales.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => {
                        const isSelected = selectedLeads.has(lead.id);
                        return (
                          <tr
                            key={lead.id}
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              background: isSelected ? 'rgba(66, 133, 244, 0.08)' : 'transparent',
                              transition: 'background 0.15s'
                            }}
                          >
                            <td style={{ padding: '0.8rem' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectLead(lead.id)}
                              />
                            </td>
                            <td style={{ padding: '0.8rem', fontWeight: '500', color: '#e8eaed' }}>
                              {lead.companyName}
                              {lead.sourceUrl && (
                                <div style={{ fontSize: '0.75rem', color: '#9aa0a6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                  {lead.sourceUrl}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '0.8rem' }}>
                              <span style={{
                                fontFamily: 'monospace',
                                color: lead.isGmail ? '#81c995' : '#8ab4f8',
                                fontWeight: 'bold',
                                marginRight: '0.5rem'
                              }}>
                                {lead.email}
                              </span>
                              {lead.isGmail ? (
                                <span style={{ background: 'rgba(52, 168, 83, 0.2)', color: '#34a853', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', border: '1px solid rgba(52, 168, 83, 0.4)' }}>
                                  🟢 Gmail
                                </span>
                              ) : (
                                <span style={{ background: 'rgba(66, 133, 244, 0.2)', color: '#4285f4', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', border: '1px solid rgba(66, 133, 244, 0.4)' }}>
                                  🔵 Web
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.8rem', color: '#fbbc04', fontFamily: 'monospace' }}>
                              {lead.phone || '—'}
                            </td>
                            <td style={{ padding: '0.8rem', color: '#9aa0a6' }}>
                              📍 {lead.city}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
