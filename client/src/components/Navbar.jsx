import React from 'react';
import { Mail, ShieldCheck, Key, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

export function Navbar({ authStatus, onOpenSetupModal, onLogout }) {
  const { isAuthenticated, userInfo, hasCredentials } = authStatus;

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">Gmail Outreach CRM</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                Personal
              </span>
            </div>
            <p className="text-xs text-slate-400">Envíos masivos controlados para búsqueda de empleo</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Credentials Button */}
          <button
            onClick={onOpenSetupModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              hasCredentials
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasCredentials ? 'Credenciales de Google' : 'Configurar OAuth ID'}</span>
          </button>

          {/* User Profile / Status */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 rounded-lg p-1.5 pl-3">
              <div className="flex items-center gap-2">
                {userInfo?.picture ? (
                  <img src={userInfo.picture} alt="Avatar" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                    G
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[160px]">
                    {userInfo?.email || 'Cuenta Conectada'}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Conectado a Gmail
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Desconectar cuenta"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700 text-slate-400 rounded-lg text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Sin cuenta de Gmail conectada</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
