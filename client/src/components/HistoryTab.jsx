import React, { useState } from 'react';
import { History, Calendar, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Clock, Mail } from 'lucide-react';

export function HistoryTab({ history, onRefreshHistory }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Historial de Campañas</h2>
            <p className="text-xs text-slate-400">Registro histórico de tus correos enviados desde Gmail</p>
          </div>
        </div>
        <button
          onClick={onRefreshHistory}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          Actualizar Historial
        </button>
      </div>

      {/* List / Table */}
      <div className="space-y-3">
        {history.length === 0 ? (
          <div className="text-center py-12 border border-slate-800 rounded-xl bg-slate-950/40">
            <Mail className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Aún no hay campañas registradas</p>
            <p className="text-xs text-slate-500 mt-1">Los envíos que realices aparecerán registrados aquí automáticamente.</p>
          </div>
        ) : (
          history.map((record) => {
            const isExpanded = expandedId === record.id;
            const dateStr = record.startedAt ? new Date(record.startedAt).toLocaleString() : 'Fecha desconocida';

            return (
              <div key={record.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                {/* Record Bar */}
                <div
                  onClick={() => toggleExpand(record.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate max-w-md">{record.subject}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                        record.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" /> {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Delay: {record.delaySeconds}s
                      </span>
                    </div>
                  </div>

                  {/* Badges & Toggle */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {record.sentCount} Enviados
                      </span>
                      {record.failedCount > 0 && (
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {record.failedCount} Fallidos
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-slate-900/90 border-t border-slate-800 text-xs space-y-2">
                    <h4 className="font-semibold text-slate-300">Registros de la campaña:</h4>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-40 overflow-y-auto font-mono space-y-1">
                      {record.logs?.map((l, i) => (
                        <div key={i} className="text-slate-400">
                          [{l.timestamp}] <strong className="text-slate-200">{l.recipient}</strong> - {l.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
