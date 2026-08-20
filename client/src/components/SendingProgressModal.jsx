import React from 'react';
import { Play, Pause, XCircle, CheckCircle2, AlertTriangle, RefreshCw, Terminal, Clock } from 'lucide-react';

export function SendingProgressModal({ sendingState, onPause, onResume, onCancel, onClose }) {
  if (!sendingState || sendingState.status === 'idle') return null;

  const {
    status,
    total = 0,
    sentCount = 0,
    failedCount = 0,
    currentIndex = 0,
    delaySeconds = 5,
    logs = [],
    subject = ''
  } = sendingState;

  const processed = sentCount + failedCount;
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const isFinished = status === 'completed' || status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              status === 'running'
                ? 'bg-sky-500/10 text-sky-400 animate-spin'
                : status === 'paused'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Progreso de Envío Masivo</h2>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                  status === 'running'
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    : status === 'paused'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {status === 'running' && 'Enviando...'}
                  {status === 'paused' && 'Pausado'}
                  {status === 'completed' && 'Completado'}
                  {status === 'cancelled' && 'Cancelado'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">Asunto: {subject}</p>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center gap-2">
            {!isFinished && (
              <>
                {status === 'running' ? (
                  <button
                    onClick={onPause}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pausar
                  </button>
                ) : (
                  <button
                    onClick={onResume}
                    className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Reanudar
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancelar
                </button>
              </>
            )}

            {isFinished && (
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Cerrar Ventana
              </button>
            )}
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Progress Bar & Counter */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Procesando: <strong className="text-sky-400 font-mono">{processed} / {total}</strong> correos
              </span>
              <span className="font-mono font-bold text-sky-400">{percent}%</span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-sky-500 to-blue-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Exitosos</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">{sentCount}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Fallidos</span>
                <span className="text-red-400 font-bold font-mono text-sm">{failedCount}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Intervalo</span>
                <span className="text-amber-400 font-bold font-mono text-sm">{delaySeconds}s</span>
              </div>
            </div>
          </div>

          {/* Live Log Terminal Stream */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Log de Envíos en Tiempo Real</h3>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-56 overflow-y-auto font-mono text-xs space-y-1.5">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic py-8 text-center">Iniciando cola de envíos...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                    {log.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                    {log.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                    {log.type === 'info' && <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />}
                    <span className={
                      log.type === 'success' ? 'text-emerald-300' :
                      log.type === 'error' ? 'text-red-300' : 'text-slate-400'
                    }>
                      <strong>{log.recipient}</strong> - {log.message}
                    </span>
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
