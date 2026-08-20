import React, { useState } from 'react';
import { X, ExternalLink, Key, Check, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';

export function GoogleSetupModal({ isOpen, onClose, initialCredentials, onSaveCredentials }) {
  const [clientId, setClientId] = useState(initialCredentials?.clientId || '');
  const [clientSecret, setClientSecret] = useState(initialCredentials?.clientSecret || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' | 'guide'

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) return;
    setIsSaving(true);
    try {
      await onSaveCredentials(clientId.trim(), clientSecret.trim());
      onClose();
    } catch (err) {
      alert('Error al guardar credenciales: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Configuración Google OAuth 2.0</h2>
              <p className="text-xs text-slate-400">Ingresa tus credenciales para habilitar la API de Gmail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'credentials'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" /> Configurar Credenciales
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Guía Paso a Paso (Google Cloud)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'credentials' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sky-400">
                  <Sparkles className="w-4 h-4" /> ¿De dónde se obtienen estas credenciales?
                </div>
                <p>
                  Se obtienen de tu propia cuenta de Google mediante <strong>Google Cloud Console</strong> (gratuito). Necesitas crear un ID de cliente OAuth de tipo <em>Web Application</em>.
                </p>
                <div className="pt-1">
                  <span className="text-slate-400">URI de redirección requerido:</span>{' '}
                  <code className="bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                    http://localhost:3001/api/auth/google/callback
                  </code>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Google Client ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ejemplo: 123456789-abc.apps.googleusercontent.com"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Google Client Secret <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  className="text-xs text-sky-400 hover:text-sky-300 underline flex items-center gap-1"
                >
                  Ver guía detallada de configuración
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm rounded-lg shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSaving ? 'Guardando...' : 'Guardar Credenciales'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-center justify-between p-3 bg-sky-950/40 border border-sky-800/50 rounded-xl">
                <span className="text-slate-200">Acceso rápido al portal de Google Cloud:</span>
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-sky-500 text-white rounded-lg font-medium flex items-center gap-1.5 hover:bg-sky-400 transition-colors"
                >
                  <span>Google Cloud Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <ol className="space-y-3 list-decimal list-inside text-slate-300 leading-relaxed">
                <li className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white">Paso 1: Crear Proyecto</strong>
                  <p className="mt-1 text-slate-400 pl-4">
                    Ve a Google Cloud Console, haz clic en el selector de proyectos arriba y crea un <em>"Nuevo Proyecto"</em> (ej: <code>Mi-Gmail-Outreach</code>).
                  </p>
                </li>
                <li className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white">Paso 2: Habilitar Gmail API</strong>
                  <p className="mt-1 text-slate-400 pl-4">
                    En el menú lateral, ve a <em>"APIs y servicios" &gt; "Biblioteca"</em>. Busca <strong>Gmail API</strong> y haz clic en <strong>Habilitar</strong>.
                  </p>
                </li>
                <li className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white">Paso 3: Pantalla de Consentimiento OAuth</strong>
                  <p className="mt-1 text-slate-400 pl-4">
                    Ve a <em>"APIs y servicios" &gt; "Pantalla de consentimiento de OAuth"</em>. Selecciona <strong>External</strong> (Externa), pon nombre de app (ej: Gmail Outreach) y tu correo. En usuarios de prueba (Test Users), <strong>añade tu propio correo de Gmail</strong>.
                  </p>
                </li>
                <li className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white">Paso 4: Crear Credenciales OAuth 2.0</strong>
                  <p className="mt-1 text-slate-400 pl-4">
                    Ve a <em>"Credenciales" &gt; "Crear credenciales" &gt; "ID de cliente de OAuth"</em>.
                    <br />- Tipo de aplicación: <strong>Aplicación Web</strong>
                    <br />- URI de redireccionamiento autorizados: Añade exactamente{' '}
                    <code className="text-emerald-400 font-mono">http://localhost:3001/api/auth/google/callback</code>
                  </p>
                </li>
                <li className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white">Paso 5: Copiar Client ID y Client Secret</strong>
                  <p className="mt-1 text-slate-400 pl-4">
                    Copia la clave de Cliente (Client ID) y la clave Secreta (Client Secret) que te proporciona Google y pégalas en la pestaña <strong>Configurar Credenciales</strong> de este modal.
                  </p>
                </li>
              </ol>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setActiveTab('credentials')}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-lg"
                >
                  Entendido, ingresar mis datos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
