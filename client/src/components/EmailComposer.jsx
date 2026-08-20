import React, { useState } from 'react';
import { Send, Eye, Paperclip, Sparkles, FolderOpen, Save, Clock, ShieldAlert, X, FileText } from 'lucide-react';

export function EmailComposer({
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  attachment,
  onAttachmentChange,
  delaySeconds,
  onDelaySecondsChange,
  templates,
  onSelectTemplate,
  onOpenSaveTemplate,
  onOpenPreview,
  onSend,
  recipientsCount,
  isAuthenticated
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Inserción de variable en el cuerpo o asunto
  const insertVariable = (variableKey) => {
    const variableText = `{${variableKey}}`;
    onBodyChange(body + (body ? ' ' : '') + variableText);
  };

  // Manejo de carga de CV / PDF
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo supera el tamaño máximo permitido de 10MB.');
      return;
    }
    onAttachmentChange(file);
  };

  // Cambio de plantilla seleccionada
  const handleTemplateDropdown = (e) => {
    const tplId = e.target.value;
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) {
      onSelectTemplate(tpl);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      {/* Header & Template Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Compositor de Correo</h2>
            <p className="text-xs text-slate-400">Diseña el mensaje y personaliza tu propuesta de trabajo</p>
          </div>
        </div>

        {/* Template Selector Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedTemplateId}
              onChange={handleTemplateDropdown}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:border-sky-500 appearance-none cursor-pointer"
            >
              <option value="">-- Cargar Plantilla Guardada --</option>
              {templates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
            <FolderOpen className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={onOpenSaveTemplate}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1"
            title="Guardar plantilla actual"
          >
            <Save className="w-3.5 h-3.5 text-sky-400" /> Guardar
          </button>
        </div>
      </div>

      {/* Subject Line Input */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          Asunto del Correo <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          placeholder="Ej: Postulación a posición de {puesto} - {nombre}"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Body Input & Variable Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Cuerpo del Mensaje <span className="text-red-400">*</span>
          </label>

          {/* Dynamic Variables Chips */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Insertar:
            </span>
            {['nombre', 'empresa', 'puesto'].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="px-2 py-0.5 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border border-sky-500/30 rounded text-[11px] font-mono font-medium transition-colors"
              >
                {`{${v}}`}
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={10}
          placeholder="Hola {nombre},&#10;&#10;Me pongo en contacto con ustedes en {empresa} para expresar mi interés en la vacante de {puesto}..."
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none font-sans leading-relaxed"
        />
      </div>

      {/* Attachments & Delay Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
        {/* PDF Attachment Upload */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Paperclip className="w-4 h-4 text-sky-400" /> Adjunto de Campaña (CV / PDF)
          </span>

          {attachment ? (
            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-medium text-slate-200 truncate">{attachment.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {(attachment.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAttachmentChange(null)}
                className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="border border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-900/60 p-2.5 rounded-lg text-center cursor-pointer transition-colors block">
              <span className="text-xs text-sky-400 font-medium hover:underline">
                Haz clic para adjuntar tu Curriculum Vitae (PDF)
              </span>
              <span className="block text-[10px] text-slate-500 mt-0.5">Formatos PDF, DOCX (Máx 10MB)</span>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Sending Delay Settings */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" /> Intervalo de Seguridad entre Envíos
            </span>
            <span className="text-xs font-bold font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {delaySeconds} Segundos
            </span>
          </div>

          <input
            type="range"
            min={3}
            max={30}
            step={1}
            value={delaySeconds}
            onChange={(e) => onDelaySecondsChange(parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />

          <p className="text-[11px] text-slate-500 mt-2">
            Un retardo de 5 a 15s protege tu cuenta contra los algoritmos de detección de spam de Gmail.
          </p>
        </div>
      </div>

      {/* Main Action Buttons Footer */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenPreview}
          disabled={!subject || !body || recipientsCount === 0}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Eye className="w-4 h-4 text-sky-400" /> Vista Previa del Correo
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={!isAuthenticated || !subject || !body || recipientsCount === 0}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4.5 h-4.5" />
          <span>Enviar Correos Masivos ({recipientsCount})</span>
        </button>
      </div>
    </div>
  );
}
