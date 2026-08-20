import React, { useState } from 'react';
import { Users, Plus, Trash2, Upload, FileText, CheckCircle, AlertCircle, Copy, Sparkles, Filter } from 'lucide-react';

export function RecipientEditor({ recipients, onChangeRecipients }) {
  const [activeMode, setActiveMode] = useState('table'); // 'table' | 'paste'
  const [pasteText, setPasteText] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Agregar fila vacía a la tabla
  const handleAddRow = () => {
    onChangeRecipients([
      ...recipients,
      { email: '', nombre: '', empresa: '', puesto: '' }
    ]);
  };

  // Actualizar un campo de un contacto especifico
  const handleUpdateRow = (index, field, value) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    onChangeRecipients(updated);
  };

  // Eliminar una fila
  const handleDeleteRow = (index) => {
    const updated = recipients.filter((_, i) => i !== index);
    onChangeRecipients(updated);
  };

  // Eliminar todos los contactos
  const handleClearAll = () => {
    if (window.confirm('¿Seguro que deseas borrar toda la lista de destinatarios?')) {
      onChangeRecipients([]);
      setPasteText('');
    }
  };

  // Eliminar duplicados automáticamente
  const handleRemoveDuplicates = () => {
    const seen = new Set();
    const unique = recipients.filter(r => {
      const emailClean = (r.email || '').trim().toLowerCase();
      if (!emailClean || seen.has(emailClean)) return false;
      seen.add(emailClean);
      return true;
    });
    onChangeRecipients(unique);
  };

  // Procesar pegado de texto rápido (formato email o email,nombre,empresa,puesto)
  const handleProcessPaste = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.split(/\r?\n/);
    const newItems = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Si la línea contiene comas o tabulaciones
      if (trimmed.includes(',') || trimmed.includes('\t')) {
        const parts = trimmed.split(/,|\t/).map(p => p.trim());
        const email = parts[0];
        const nombre = parts[1] || '';
        const empresa = parts[2] || '';
        const puesto = parts[3] || '';
        if (email && email.includes('@')) {
          newItems.push({ email, nombre, empresa, puesto });
        }
      } else {
        // Correos separados por espacios o líneas simples
        const emailsInLine = trimmed.split(/\s+/);
        emailsInLine.forEach(em => {
          if (em && em.includes('@')) {
            newItems.push({ email: em, nombre: '', empresa: '', puesto: '' });
          }
        });
      }
    });

    if (newItems.length > 0) {
      onChangeRecipients([...recipients, ...newItems]);
      setPasteText('');
      setActiveMode('table');
    } else {
      alert('No se detectaron correos válidos en el texto pegado.');
    }
  };

  // Cargar archivo CSV
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setPasteText(content);
        setActiveMode('paste');
      }
    };
    reader.readAsText(file);
  };

  // Filtrar lista para búsqueda rápida
  const filteredRecipients = recipients.filter(r => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      (r.email || '').toLowerCase().includes(q) ||
      (r.nombre || '').toLowerCase().includes(q) ||
      (r.empresa || '').toLowerCase().includes(q) ||
      (r.puesto || '').toLowerCase().includes(q)
    );
  });

  const validCount = recipients.filter(r => r.email && r.email.includes('@')).length;
  const invalidCount = recipients.length - validCount;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header & Modes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Lista de Destinatarios</h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-sky-500/20 text-sky-300 rounded-full border border-sky-500/30">
                {recipients.length} {recipients.length === 1 ? 'Contacto' : 'Contactos'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Personaliza {`{nombre}`}, {`{empresa}`} y {`{puesto}`} para cada destinatario</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('table')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeMode === 'table'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tabla Contactos
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('paste')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeMode === 'paste'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pegar Texto / CSV
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="py-4 flex-1 flex flex-col min-h-[320px]">
        {activeMode === 'table' ? (
          <>
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Buscar destinatario..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRemoveDuplicates}
                  title="Limpiar correos repetidos"
                  className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Sin Duplicados
                </button>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 text-xs bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-sky-500/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir Fila
                </button>
                {recipients.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Vaciar lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-[360px] overflow-y-auto">
              {recipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3 text-slate-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">No hay destinatarios agregados</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Añade filas manualmente o usa la pestaña "Pegar Texto / CSV" para importar tus contactos.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="mt-4 px-4 py-2 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Añadir Primer Destinatario
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                      <th className="py-2.5 px-3 font-semibold w-8">#</th>
                      <th className="py-2.5 px-3 font-semibold">Correo Electrónico *</th>
                      <th className="py-2.5 px-3 font-semibold">Nombre ({`{nombre}`})</th>
                      <th className="py-2.5 px-3 font-semibold">Empresa ({`{empresa}`})</th>
                      <th className="py-2.5 px-3 font-semibold">Puesto ({`{puesto}`})</th>
                      <th className="py-2.5 px-3 font-semibold w-10 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRecipients.map((item, idx) => {
                      const isValidEmail = item.email && item.email.includes('@');
                      return (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2 px-3 text-slate-500 text-center font-mono">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <div className="relative flex items-center">
                              <input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                value={item.email}
                                onChange={(e) => handleUpdateRow(idx, 'email', e.target.value)}
                                className={`w-full py-1 px-2.5 rounded border bg-slate-900 text-white placeholder-slate-600 focus:outline-none ${
                                  !item.email
                                    ? 'border-slate-800'
                                    : isValidEmail
                                    ? 'border-emerald-500/50 focus:border-emerald-400'
                                    : 'border-red-500/60 focus:border-red-400'
                                }`}
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Ej: Juan Pérez"
                              value={item.nombre}
                              onChange={(e) => handleUpdateRow(idx, 'nombre', e.target.value)}
                              className="w-full py-1 px-2.5 rounded border border-slate-800 bg-slate-900 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Ej: TechCorp"
                              value={item.empresa}
                              onChange={(e) => handleUpdateRow(idx, 'empresa', e.target.value)}
                              className="w-full py-1 px-2.5 rounded border border-slate-800 bg-slate-900 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Ej: Recruiter / Tech Lead"
                              value={item.puesto}
                              onChange={(e) => handleUpdateRow(idx, 'puesto', e.target.value)}
                              className="w-full py-1 px-2.5 rounded border border-slate-800 bg-slate-900 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          /* Paste / Import View */
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-300">
                Pega una lista de correos (uno por línea) o formato CSV (<code>email, nombre, empresa, puesto</code>):
              </span>
              <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Cargar CSV / TXT
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={8}
              placeholder={`ejemplo1@empresa.com, Maria, Globant, HR Specialist\nejemplo2@empresa.com, Carlos, MercadoLibre, Tech Lead\ncontacto3@startup.io`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveMode('table')}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessPaste}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Procesar e Insertar a la Tabla
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> {validCount} Válidos
          </span>
          {invalidCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" /> {invalidCount} Incompletos/Sin email
            </span>
          )}
        </div>
        <span className="text-slate-500">Recuerda verificar la lista antes de enviar.</span>
      </div>
    </div>
  );
}
