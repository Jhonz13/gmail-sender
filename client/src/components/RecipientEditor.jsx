import React, { useState, useRef } from 'react';
import { Users, Plus, Trash2, Upload, CheckCircle2, AlertCircle, Sparkles, Filter, ClipboardList, FileSpreadsheet, Save, FolderOpen, X, Check, Database, Download, Cloud } from 'lucide-react';

export function RecipientEditor({
  recipients,
  onChangeRecipients,
  savedLists = [],
  onSaveList,
  onLoadList,
  onDeleteList,
  onImportLists,
  userEmail,
  storageInfo
}) {
  const fileImportRef = useRef(null);
  const [activeMode, setActiveMode] = useState('table'); // 'table' | 'paste'
  const [pasteText, setPasteText] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [quickPasteInput, setQuickPasteInput] = useState('');

  // Modales de listas guardadas
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showListsModal, setShowListsModal] = useState(false);
  const [listNameInput, setListNameInput] = useState('');

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

  // Guardar lista en BD
  const handleConfirmSaveList = () => {
    const finalName = listNameInput.trim() || `Lista de ${recipients.length} Contactos`;
    if (onSaveList) {
      onSaveList(finalName);
    }
    setListNameInput('');
    setShowSaveModal(false);
  };

  // Exportar todas las listas guardadas a un archivo JSON de respaldo
  const handleExportLists = () => {
    if (!savedLists || savedLists.length === 0) {
      alert('No hay listas guardadas para exportar.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedLists, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gmail_crm_listas_${(userEmail || 'respaldo').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Importar listas guardadas desde un archivo JSON
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (onImportLists) onImportLists(parsed);
        } else {
          alert('El archivo no contiene un formato de listas válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
      setShowQuickPaste(false);
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full relative">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">1. Lista de Destinatarios</h2>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-500/15 text-sky-300 rounded-full border border-sky-500/30">
                {recipients.length} {recipients.length === 1 ? 'Contacto' : 'Contactos'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Auto-guardado en tu navegador
              </span>
            </p>
          </div>
        </div>

        {/* Action Mode Toggle */}
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

      {/* Main Table / Entry View */}
      <div className="py-4 flex-1 flex flex-col min-h-[300px]">
        {activeMode === 'table' ? (
          <>
            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
              <div className="relative flex-1 min-w-[160px]">
                <input
                  type="text"
                  placeholder="Buscar en la lista..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Botón Guardar Lista en BD */}
                <button
                  type="button"
                  onClick={() => {
                    setListNameInput(`Mis ${recipients.length} Correos - ${new Date().toLocaleDateString()}`);
                    setShowSaveModal(true);
                  }}
                  disabled={recipients.length === 0}
                  className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  title="Guardar esta lista en la Base de Datos"
                >
                  <Save className="w-3.5 h-3.5" /> Guardar Lista
                </button>

                {/* Botón Abrir Listas Guardadas */}
                <button
                  type="button"
                  onClick={() => setShowListsModal(true)}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                  title="Cargar una lista guardada previamente"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Mis Listas ({savedLists.length})
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickPaste(!showQuickPaste)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                    showQuickPaste
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30 text-sky-300 border-sky-500/30'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 text-sky-400" />
                  <span>{showQuickPaste ? 'Ocultar' : '⚡ Pegar Varios Correos'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3.5 py-1.5 text-xs bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-all flex items-center gap-1 shadow-md shadow-sky-500/20"
                >
                  <Plus className="w-4 h-4" /> + Fila
                </button>

                <button
                  type="button"
                  onClick={handleRemoveDuplicates}
                  title="Eliminar correos repetidos"
                  className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sin Duplicados
                </button>

                {recipients.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
                    title="Vaciar lista completa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal para Guardar Lista con Nombre */}
            {showSaveModal && (
              <div className="mb-3.5 p-4 bg-slate-950 border border-emerald-500/40 rounded-2xl space-y-3 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Save className="w-4 h-4" /> Guardar Lista en la Base de Datos ({recipients.length} contactos)
                  </span>
                  <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ej: Mis 29 Correos - Postulaciones Marzo"
                  value={listNameInput}
                  onChange={(e) => setListNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmSaveList}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md shadow-emerald-600/20"
                  >
                    Confirmar y Guardar
                  </button>
                </div>
              </div>
            )}

            {/* Modal para Abrir Listas Guardadas */}
            {showListsModal && (
              <div className="mb-3.5 p-4 bg-slate-950 border border-sky-500/40 rounded-2xl space-y-3 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-sky-300">
                      Mis Listas Guardadas ({savedLists.length})
                    </span>
                  </div>
                  <button onClick={() => setShowListsModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Banner de Estado de Sincronización Multi-Dispositivo */}
                {userEmail ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Sincronizado con: <strong className="text-white">{userEmail}</strong></span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                      Multi-Dispositivo Activo
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 bg-amber-950/40 border border-amber-500/30 rounded-xl text-[11px] text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Modo Local (Sin sincronizar)</span>
                    </div>
                    <span className="text-[10px] text-amber-400/90">
                      Conecta tu Gmail para sincronizar con tus otros dispositivos
                    </span>
                  </div>
                )}

                {savedLists.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No tienes listas guardadas aún. Haz clic en "Guardar Lista" para respaldar tus contactos.</p>
                ) : (
                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                    {savedLists.map((l) => (
                      <div key={l.id} className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800 hover:border-sky-500/40">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-200">{l.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {l.recipients?.length || 0} Contactos • Guardado: {new Date(l.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (onLoadList) onLoadList(l);
                              setShowListsModal(false);
                            }}
                            className="px-3 py-1 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 rounded-lg text-xs font-semibold"
                          >
                            Cargar
                          </button>
                          {onDeleteList && (
                            <button
                              onClick={() => onDeleteList(l.id)}
                              className="p-1 text-slate-500 hover:text-red-400"
                              title="Eliminar lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Barra de herramientas para Importar/Exportar Respaldo entre dispositivos */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileImportRef}
                      onChange={handleImportFile}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileImportRef.current?.click()}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                      title="Importar un archivo JSON con listas guardadas"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" /> Importar Respaldo JSON
                    </button>

                    <button
                      type="button"
                      onClick={handleExportLists}
                      disabled={savedLists.length === 0}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-40"
                      title="Descargar tus listas en un archivo JSON para pasarlo a otro dispositivo"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar Respaldo JSON
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Mass Paste Dropdown Panel */}
            {showQuickPaste && (
              <div className="mb-3.5 p-3.5 bg-slate-950 border border-sky-500/40 rounded-2xl space-y-2.5 shadow-xl animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Pegar lista masiva de correos</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Pega tu lista (uno por línea o separados por coma)</span>
                </div>

                <textarea
                  rows={4}
                  placeholder={`correo1@empresa.com\ncorreo2@empresa.com, Carlos, TechCorp, Lead\ncorreo3@empresa.com`}
                  value={quickPasteInput}
                  onChange={(e) => setQuickPasteInput(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none shadow-inner"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-sky-400 font-mono">
                    Correos detectados: <strong>{processRawText(quickPasteInput).length}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickPaste(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleProcessQuickPaste}
                      className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-lg text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar {processRawText(quickPasteInput).length} a la Tabla
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FLUID 100% VISIBLE TABLE CONTAINER */}
            <div className="flex-1 border border-slate-800 rounded-2xl overflow-y-auto bg-slate-950/80 max-h-[380px] shadow-inner">
              {recipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400 shadow-md">
                    <Users className="w-6 h-6 text-sky-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-200">No hay destinatarios agregados</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Usa el botón <strong>"⚡ Pegar Varios Correos"</strong> para agregar tu lista en 1 segundo o añade filas manualmente.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowQuickPaste(true)}
                      className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5"
                    >
                      <ClipboardList className="w-4 h-4" /> Pegar Varios Correos
                    </button>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> + Fila
                    </button>
                  </div>
                </div>
              ) : (
                <table className="w-full table-fixed text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 sticky top-0 z-10 font-semibold">
                      <th className="py-2.5 px-2 w-[6%] text-center text-slate-500 font-mono">#</th>
                      <th className="py-2.5 px-2 w-[44%]">Correo Electrónico <span className="text-red-400">*</span></th>
                      <th className="py-2.5 px-2 w-[16%]">Nombre <span className="text-slate-500 text-[10px]">({`{nombre}`})</span></th>
                      <th className="py-2.5 px-2 w-[15%]">Empresa <span className="text-slate-500 text-[10px]">({`{empresa}`})</span></th>
                      <th className="py-2.5 px-2 w-[13%]">Puesto <span className="text-slate-500 text-[10px]">({`{puesto}`})</span></th>
                      <th className="py-2.5 px-1 w-[6%] text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredRecipients.map((item, idx) => {
                      const isValidEmail = item.email && item.email.includes('@');
                      return (
                        <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2 px-1 text-slate-500 text-center font-mono text-[11px]">{idx + 1}</td>

                          {/* Email Input Field */}
                          <td className="py-2 px-1.5">
                            <div className="relative flex items-center w-full">
                              <input
                                type="email"
                                placeholder="ejemplo@empresa.com"
                                value={item.email}
                                onChange={(e) => handleUpdateRow(idx, 'email', e.target.value)}
                                className={`w-full py-1.5 pl-2.5 pr-7 rounded-xl border bg-slate-900/90 text-white placeholder-slate-600 focus:outline-none font-mono text-xs transition-all truncate ${
                                  !item.email
                                    ? 'border-slate-800 focus:border-sky-500'
                                    : isValidEmail
                                    ? 'border-emerald-500/50 bg-emerald-950/20 focus:border-emerald-400'
                                    : 'border-rose-500/60 bg-rose-950/20 focus:border-rose-400'
                                }`}
                              />
                              {item.email && (
                                <div className="absolute right-2 pointer-events-none">
                                  {isValidEmail ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Nombre Input Field */}
                          <td className="py-2 px-1.5">
                            <input
                              type="text"
                              placeholder="Nombre"
                              value={item.nombre}
                              onChange={(e) => handleUpdateRow(idx, 'nombre', e.target.value)}
                              className="w-full py-1.5 px-2 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 text-xs truncate"
                            />
                          </td>

                          {/* Empresa Input Field */}
                          <td className="py-2 px-1.5">
                            <input
                              type="text"
                              placeholder="Empresa"
                              value={item.empresa}
                              onChange={(e) => handleUpdateRow(idx, 'empresa', e.target.value)}
                              className="w-full py-1.5 px-2 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 text-xs truncate"
                            />
                          </td>

                          {/* Puesto Input Field */}
                          <td className="py-2 px-1.5">
                            <input
                              type="text"
                              placeholder="Puesto"
                              value={item.puesto}
                              onChange={(e) => handleUpdateRow(idx, 'puesto', e.target.value)}
                              className="w-full py-1.5 px-2 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 text-xs truncate"
                            />
                          </td>

                          {/* Delete Action */}
                          <td className="py-2 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Eliminar fila"
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
          /* Paste / Import CSV Bulk View */
          <div className="flex-1 flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-sky-400" /> Carga Masiva de Texto o Archivo CSV
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ingresa correos (un correo por línea) o en formato CSV (<code>email, nombre, empresa, puesto</code>)
                </p>
              </div>

              <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shrink-0">
                <Upload className="w-4 h-4" /> Cargar Archivo CSV / TXT
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={9}
              placeholder={`ejemplo1@empresa.com, Maria, Globant, HR Specialist\nejemplo2@empresa.com, Carlos, MercadoLibre, Tech Lead\ncontacto3@startup.io`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full flex-1 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none leading-relaxed shadow-inner"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">
                Contactos detectados: <strong className="text-sky-400 font-mono font-bold">{processRawText(pasteText).length}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('table')}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
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

      {/* Footer Status Bar */}
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
        <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> Tus {recipients.length} contactos están protegidos y guardados automáticamente.
        </span>
      </div>
    </div>
  );
}
