import React, { useState } from 'react';
import { Users, Plus, Trash2, Upload, CheckCircle2, AlertCircle, Sparkles, Filter, ClipboardList, FileSpreadsheet, Check, X } from 'lucide-react';

export function RecipientEditor({ recipients, onChangeRecipients }) {
  const [activeMode, setActiveMode] = useState('table'); // 'table' | 'paste'
  const [pasteText, setPasteText] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [quickPasteInput, setQuickPasteInput] = useState('');

  // Agregar fila vacía a la tabla
  const handleAddRow = () => {
    onChangeRecipients([
      ...recipients,
      { email: '', nombre: '', empresa: '', puesto: '' }
    ]);
  };

  // Actualizar un campo de un contacto específico
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
      setQuickPasteInput('');
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

  // Procesar pegado de texto rápido en bloque
  const processRawText = (rawText) => {
    if (!rawText.trim()) return [];

    const lines = rawText.split(/\r?\n/);
    const newItems = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Formato CSV (email, nombre, empresa, puesto)
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
        // Formato simple (correos separados por espacios o líneas)
        const emailsInLine = trimmed.split(/\s+/);
        emailsInLine.forEach(em => {
          if (em && em.includes('@')) {
            newItems.push({ email: em, nombre: '', empresa: '', puesto: '' });
          }
        });
      }
    });

    return newItems;
  };

  const handleProcessPaste = () => {
    const newItems = processRawText(pasteText);
    if (newItems.length > 0) {
      onChangeRecipients([...recipients, ...newItems]);
      setPasteText('');
      setActiveMode('table');
    } else {
      alert('No se detectaron correos válidos en el texto ingresado.');
    }
  };

  const handleProcessQuickPaste = () => {
    const newItems = processRawText(quickPasteInput);
    if (newItems.length > 0) {
      onChangeRecipients([...recipients, ...newItems]);
      setQuickPasteInput('');
      setIsQuickPasteOpen(false);
    } else {
      alert('No se encontraron direcciones de correo válidas.');
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
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Destinatarios</h2>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-500/15 text-sky-300 rounded-full border border-sky-500/30">
                {recipients.length} {recipients.length === 1 ? 'Contacto' : 'Contactos'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Edita datos de personalización o importa correos masivos</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode('table')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeMode === 'table'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Tabla de Datos
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('paste')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeMode === 'paste'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Pegar Texto / CSV
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="py-4 flex-1 flex flex-col min-h-[360px]">
        {activeMode === 'table' ? (
          <>
            {/* Control & Search Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder="Filtrar por nombre, correo, empresa..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
                <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                {filterQuery && (
                  <button
                    onClick={() => setFilterQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsQuickPasteOpen(!isQuickPasteOpen)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                    isQuickPasteOpen
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5 text-sky-400" /> Pegar Bloque Correos
                </button>

                <button
                  type="button"
                  onClick={handleRemoveDuplicates}
                  title="Eliminar correos repetidos automáticamente"
                  className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Limpiar Duplicados
                </button>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3.5 py-1.5 text-xs bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-all flex items-center gap-1 shadow-md shadow-sky-500/20"
                >
                  <Plus className="w-4 h-4" /> Nueva Fila
                </button>

                {recipients.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
                    title="Vaciar toda la lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Mass Paste Collapsible Box */}
            {isQuickPasteOpen && (
              <div className="mb-3.5 p-3.5 bg-slate-950 border border-sky-500/30 rounded-2xl space-y-2 animate-fade-in shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4" /> Pegar lista de correos rápidos
                  </span>
                  <span className="text-[11px] text-slate-400">Pega múltiples correos (un correo por línea o separados por coma)</span>
                </div>
                <textarea
                  rows={4}
                  placeholder="ejemplo1@empresa.com&#10;ejemplo2@empresa.com&#10;ejemplo3@empresa.com, Juan, TechCorp, Manager"
                  value={quickPasteInput}
                  onChange={(e) => setQuickPasteInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickPasteOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-medium"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessQuickPaste}
                    className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg shadow-md shadow-sky-500/20 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar {processRawText(quickPasteInput).length} Contactos
                  </button>
                </div>
              </div>
            )}

            {/* Spacious Responsive Scrollable Table Container */}
            <div className="flex-1 border border-slate-800 rounded-2xl overflow-x-auto overflow-y-auto bg-slate-950/70 max-h-[420px] shadow-inner">
              {recipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400 shadow-lg">
                    <Users className="w-7 h-7 text-sky-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-200">No hay destinatarios en la lista</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Añade filas individualmente o usa el botón <strong>"Pegar Bloque Correos"</strong> para agregar tu lista en segundos.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Añadir Fila
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQuickPasteOpen(true)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
                    >
                      <ClipboardList className="w-4 h-4" /> Pegar Varios
                    </button>
                  </div>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 sticky top-0 z-10 font-semibold tracking-wide">
                      <th className="py-3 px-3.5 w-10 text-center text-slate-500 font-mono">#</th>
                      <th className="py-3 px-3.5 min-w-[240px]">Correo Electrónico <span className="text-red-400">*</span></th>
                      <th className="py-3 px-3.5 min-w-[150px]">
                        Nombre <span className="text-sky-400 font-mono font-normal">({`{nombre}`})</span>
                      </th>
                      <th className="py-3 px-3.5 min-w-[150px]">
                        Empresa <span className="text-sky-400 font-mono font-normal">({`{empresa}`})</span>
                      </th>
                      <th className="py-3 px-3.5 min-w-[150px]">
                        Puesto <span className="text-sky-400 font-mono font-normal">({`{puesto}`})</span>
                      </th>
                      <th className="py-3 px-3.5 w-12 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredRecipients.map((item, idx) => {
                      const isValidEmail = item.email && item.email.includes('@');
                      return (
                        <tr key={idx} className="hover:bg-slate-900/60 transition-colors group">
                          <td className="py-2.5 px-3.5 text-slate-500 text-center font-mono text-[11px]">{idx + 1}</td>

                          {/* Email Input Field */}
                          <td className="py-2.5 px-3.5">
                            <div className="relative flex items-center">
                              <input
                                type="email"
                                placeholder="ejemplo@empresa.com"
                                value={item.email}
                                onChange={(e) => handleUpdateRow(idx, 'email', e.target.value)}
                                className={`w-full py-2 pl-3 pr-8 rounded-xl border bg-slate-900/90 text-white placeholder-slate-600 focus:outline-none font-mono text-xs transition-all ${
                                  !item.email
                                    ? 'border-slate-800 focus:border-sky-500'
                                    : isValidEmail
                                    ? 'border-emerald-500/40 bg-emerald-950/10 focus:border-emerald-400'
                                    : 'border-rose-500/50 bg-rose-950/10 focus:border-rose-400'
                                }`}
                              />
                              {item.email && (
                                <div className="absolute right-2.5 pointer-events-none">
                                  {isValidEmail ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-rose-400" />
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Nombre Input Field */}
                          <td className="py-2.5 px-3.5">
                            <input
                              type="text"
                              placeholder="Ej: Carlos Ruiz"
                              value={item.nombre}
                              onChange={(e) => handleUpdateRow(idx, 'nombre', e.target.value)}
                              className="w-full py-2 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors text-xs"
                            />
                          </td>

                          {/* Empresa Input Field */}
                          <td className="py-2.5 px-3.5">
                            <input
                              type="text"
                              placeholder="Ej: TechCorp"
                              value={item.empresa}
                              onChange={(e) => handleUpdateRow(idx, 'empresa', e.target.value)}
                              className="w-full py-2 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors text-xs"
                            />
                          </td>

                          {/* Puesto Input Field */}
                          <td className="py-2.5 px-3.5">
                            <input
                              type="text"
                              placeholder="Ej: Recruiter Lead"
                              value={item.puesto}
                              onChange={(e) => handleUpdateRow(idx, 'puesto', e.target.value)}
                              className="w-full py-2 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors text-xs"
                            />
                          </td>

                          {/* Delete Row Action */}
                          <td className="py-2.5 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Eliminar fila"
                            >
                              <Trash2 className="w-4 h-4" />
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
          /* Paste / Import CSV Bulk View */
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-sky-400" /> Carga Masiva de Texto o Archivo CSV
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ingresa correos separados por salto de línea o en formato CSV (<code>email, nombre, empresa, puesto</code>)
                </p>
              </div>

              <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shrink-0">
                <Upload className="w-4 h-4" /> Cargar Archivo CSV / TXT
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={10}
              placeholder={`ejemplo1@empresa.com, Maria, Globant, HR Specialist\nejemplo2@empresa.com, Carlos, MercadoLibre, Tech Lead\ncontacto3@startup.io`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full flex-1 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none leading-relaxed shadow-inner"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Contactos detectados: <strong className="text-sky-400 font-mono font-bold">{processRawText(pasteText).length}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('table')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleProcessPaste}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Insertar a la Tabla ({processRawText(pasteText).length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" /> {validCount} Válidos
          </span>
          {invalidCount > 0 && (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <AlertCircle className="w-4 h-4" /> {invalidCount} Incompletos
            </span>
          )}
        </div>
        <span className="text-slate-500 hidden sm:inline">Desliza horizontalmente la tabla si necesitas más espacio.</span>
      </div>
    </div>
  );
}
