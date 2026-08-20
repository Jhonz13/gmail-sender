import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Mail, Paperclip, Send, UserCheck } from 'lucide-react';

export function PreviewModal({ isOpen, onClose, subject, body, recipients, attachment, onConfirmSend }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || recipients.length === 0) return null;

  const currentRecipient = recipients[currentIndex] || recipients[0];

  // Función auxiliar de interpolación para la vista previa
  const interpolateText = (text, data) => {
    if (!text) return '';
    let res = text;
    const map = {
      nombre: data.nombre || data.name || 'Estimado/a',
      empresa: data.empresa || data.company || 'su empresa',
      puesto: data.puesto || data.position || 'la posición',
      email: data.email || ''
    };
    Object.keys(map).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      res = res.replace(regex, map[key]);
    });
    return res;
  };

  const previewSubject = interpolateText(subject, currentRecipient);
  const previewBody = interpolateText(body, currentRecipient);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Vista Previa de Correo</h2>
              <p className="text-xs text-slate-400">Verifica cómo se renderizan las variables antes del envío</p>
            </div>
          </div>

          {/* Navigation between recipients */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-semibold text-sky-400">
              {currentIndex + 1} / {recipients.length}
            </span>
            <button
              onClick={() => setCurrentIndex(Math.min(recipients.length - 1, currentIndex + 1))}
              disabled={currentIndex === recipients.length - 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Email Container */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Metadata Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-medium">Para (Destinatario):</span>
              <span className="text-white font-mono font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {currentRecipient.email}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
              <div>
                Nombre: <strong className="text-slate-200">{currentRecipient.nombre || '(Sin definir)'}</strong>
              </div>
              <div>
                Empresa: <strong className="text-slate-200">{currentRecipient.empresa || '(Sin definir)'}</strong>
              </div>
              <div>
                Puesto: <strong className="text-slate-200">{currentRecipient.puesto || '(Sin definir)'}</strong>
              </div>
            </div>
            <div className="border-t border-slate-800/80 pt-2">
              <span className="text-slate-400 font-medium">Asunto Final:</span>
              <p className="text-sm font-semibold text-sky-300 mt-0.5">{previewSubject}</p>
            </div>
          </div>

          {/* Email Body Rendering Box */}
          <div className="bg-white text-slate-900 p-6 rounded-xl shadow-inner min-h-[220px] whitespace-pre-wrap font-sans text-sm leading-relaxed border border-slate-300">
            {previewBody}
          </div>

          {/* Attachment Pill */}
          {attachment && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
              <Paperclip className="w-4 h-4 text-sky-400" />
              <span>Archivo adjunto: <strong>{attachment.name}</strong></span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
          >
            Modificar Texto
          </button>
          <button
            onClick={() => {
              onClose();
              onConfirmSend();
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Confirmar y Enviar Campaña
          </button>
        </div>
      </div>
    </div>
  );
}
