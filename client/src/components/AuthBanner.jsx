import React from 'react';
import { LogIn, ShieldCheck, Info, AlertTriangle, Key } from 'lucide-react';

export function AuthBanner({ authStatus, onConnect, onOpenSetup }) {
  const { isAuthenticated, userInfo, hasCredentials } = authStatus;

  if (isAuthenticated) {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border-b border-sky-500/20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-sky-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Autenticado como <strong className="text-white">{userInfo?.email}</strong>. Tus correos se enviarán directamente desde tu Gmail.
            </span>
          </div>
          <div className="text-slate-400 text-xs hidden md:block">
            Límite recomendado de Gmail: máx 500 correos/día
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-b border-amber-500/30 px-4 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-white">Conecta tu cuenta de Gmail para comenzar</p>
            <p className="text-amber-200/80">
              La aplicación utiliza la API oficial de Google mediante OAuth 2.0. No almacenamos tus contraseñas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!hasCredentials && (
            <button
              onClick={onOpenSetup}
              className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" /> Ingresar Client ID & Secret
            </button>
          )}

          <button
            onClick={onConnect}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs sm:text-sm rounded-lg shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Conectar con Gmail
          </button>
        </div>
      </div>
    </div>
  );
}
