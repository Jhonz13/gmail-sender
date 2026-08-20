import React, { useState } from 'react';
import { X, Save, Trash2, FileText, Check } from 'lucide-react';

export function TemplateManager({ isOpen, onClose, templates, onSaveTemplate, onDeleteTemplate, currentSubject, currentBody }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState(currentSubject || '');
  const [body, setBody] = useState(currentBody || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !body.trim()) return;
    setIsSaving(true);
    try {
      await onSaveTemplate({ name: name.trim(), subject: subject.trim(), body: body.trim() });
      setName('');
      onClose();
    } catch (err) {
      alert('Error al guardar plantilla: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <Save className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Gestor de Plantillas</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Create New Template Form */}
          <form onSubmit={handleSave} className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Guardar Plantilla Actual</h3>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre de la Plantilla</label>
              <input
                type="text"
                required
                placeholder="ej: Contacto Desarrollador Senior"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Asunto</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cuerpo del mensaje</label>
              <textarea
                rows={4}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 resize-none font-sans"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Guardar Nueva Plantilla
              </button>
            </div>
          </form>

          {/* List of Existing Templates */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Plantillas Almacenadas</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No hay plantillas guardadas aún.</p>
              ) : (
                templates.map(tpl => (
                  <div key={tpl.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate">{tpl.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{tpl.subject}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteTemplate(tpl.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded"
                      title="Eliminar plantilla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
