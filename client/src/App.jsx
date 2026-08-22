import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthBanner } from './components/AuthBanner';
import { GoogleSetupModal } from './components/GoogleSetupModal';
import { RecipientEditor } from './components/RecipientEditor';
import { EmailComposer } from './components/EmailComposer';
import { TemplateManager } from './components/TemplateManager';
import { PreviewModal } from './components/PreviewModal';
import { SendingProgressModal } from './components/SendingProgressModal';
import { HistoryTab } from './components/HistoryTab';
import { api } from './services/api';
import { Send, Users, History as HistoryIcon, ShieldAlert, LayoutGrid, Rows } from 'lucide-react';

export default function App() {
  // Estado de Autenticación
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    userInfo: null,
    hasCredentials: false
  });

  // Estado de Campaña y Correo con Auto-Recuperación de localStorage
  const [recipients, setRecipients] = useState(() => {
    try {
      const saved = localStorage.getItem('gmail_crm_saved_recipients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error cargando contactos de localStorage:', e);
    }
    return [
      { email: 'contacto@ejemplo.com', nombre: 'Carlos Ruiz', empresa: 'Tech Corp', puesto: 'Head of Engineering' }
    ];
  });
  const [subject, setSubject] = useState('Postulación a vacante de Software Developer - {nombre}');
  const [body, setBody] = useState(
    'Hola {nombre},\n\nEspero que te encuentres muy bien. Te escribo con interés en la posición de {puesto} en {empresa}.\n\nCuento con experiencia relevante en desarrollo web y gestión de proyectos. Adjunto mi CV en PDF para tu revisión.\n\nQuedo a tu disposición para conversar.\n\nSaludos cordiales,'
  );
  const [attachment, setAttachment] = useState(null);
  const [delaySeconds, setDelaySeconds] = useState(5);

  // Datos Auxiliares
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [savedLists, setSavedLists] = useState([]);
  const [sendingState, setSendingState] = useState({ status: 'idle' });

  // Pestañas y Modales
  const [activeTab, setActiveTab] = useState('composer'); // 'composer' | 'history'
  const [layoutMode, setLayoutMode] = useState('stacked'); // 'stacked' (ancho completo cómodo) | 'side'
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSendingModalOpen, setIsSendingModalOpen] = useState(false);

  // Guardar destinatarios automáticamente en localStorage cada vez que cambien
  useEffect(() => {
    try {
      localStorage.setItem('gmail_crm_saved_recipients', JSON.stringify(recipients));
    } catch (e) {
      console.warn('Error guardando en localStorage:', e);
    }
  }, [recipients]);

  // Cargar estado inicial al montar
  useEffect(() => {
    checkAuthStatus();
    loadTemplates();
    loadHistory();
    loadSavedLists();

    // Escuchar mensaje emergente de OAuth popup
    const handleOAuthMessage = (event) => {
      if (event.data === 'oauth-success') {
        checkAuthStatus();
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Polling de estado de envío si hay campaña activa
  useEffect(() => {
    let interval = null;
    if (sendingState.status === 'running' || sendingState.status === 'paused') {
      interval = setInterval(async () => {
        try {
          const state = await api.getCampaignStatus();
          setSendingState(state);
          if (state.status === 'completed' || state.status === 'cancelled') {
            loadHistory();
          }
        } catch (e) {
          console.error('Error al obtener estado de envío:', e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sendingState.status]);

  const checkAuthStatus = async () => {
    try {
      const data = await api.getAuthStatus();
      setAuthStatus(data);
    } catch (e) {
      console.error('Error verificando autenticación:', e);
    }
  };

  const loadTemplates = async () => {
    try {
      const list = await api.getTemplates();
      setTemplates(list);
    } catch (e) {
      console.error('Error cargando plantillas:', e);
    }
  };

  const loadHistory = async () => {
    try {
      const list = await api.getHistory();
      setHistory(list);
    } catch (e) {
      console.error('Error cargando historial:', e);
    }
  };

  const loadSavedLists = async () => {
    try {
      const lists = await api.getSavedLists();
      setSavedLists(lists);
    } catch (e) {
      console.error('Error cargando listas guardadas:', e);
    }
  };

  const handleSaveContactList = async (name) => {
    try {
      const res = await api.saveContactList({ name, recipients });
      setSavedLists(res.lists || []);
      alert(`¡Lista "${name}" guardada con éxito en la base de datos!`);
    } catch (e) {
      alert('Error guardando lista: ' + e.message);
    }
  };

  const handleDeleteContactList = async (id) => {
    try {
      const res = await api.deleteContactList(id);
      setSavedLists(res.lists || []);
    } catch (e) {
      alert('Error eliminando lista: ' + e.message);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const { url } = await api.getAuthUrl();
      // Abrir ventana popup de Google OAuth
      window.open(url, 'GoogleOAuthPopup', 'width=550,height=650');
    } catch (e) {
      alert('Error al iniciar autenticación: ' + e.message);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('¿Deseas desconectar tu cuenta de Gmail?')) {
      try {
        await api.logout();
        checkAuthStatus();
      } catch (e) {
        alert('Error al cerrar sesión: ' + e.message);
      }
    }
  };

  const handleSaveCredentials = async (clientId, clientSecret) => {
    await api.saveCredentials(clientId, clientSecret);
    await checkAuthStatus();
  };

  const handleSaveTemplate = async (template) => {
    const updated = await api.saveTemplate(template);
    setTemplates(updated.templates || []);
  };

  const handleDeleteTemplate = async (id) => {
    const updated = await api.deleteTemplate(id);
    setTemplates(updated.templates || []);
  };

  const handleSelectTemplate = (tpl) => {
    setSubject(tpl.subject || '');
    setBody(tpl.body || '');
  };

  // Iniciar el proceso de envío masivo
  const handleStartSend = async () => {
    const validRecipients = recipients.filter(r => r.email && r.email.includes('@'));

    if (validRecipients.length === 0) {
      alert('Debes incluir al menos un correo válido.');
      return;
    }

    if (!subject.trim() && !body.trim() && !attachment) {
      alert('Debes escribir un asunto, un mensaje o adjuntar un archivo PDF.');
      return;
    }

    // Advertencia Anti-Spam para envíos de más de 20 correos
    if (validRecipients.length > 20) {
      const confirmLarge = window.confirm(
        `Vas a enviar ${validRecipients.length} correos. Para proteger la reputación de tu cuenta de Gmail, asegúrate de mantener un intervalo de al menos 5-10 segundos.\n\n¿Deseas continuar?`
      );
      if (!confirmLarge) return;
    }

    const formData = new FormData();
    formData.append('recipientsJson', JSON.stringify(validRecipients));
    formData.append('subject', subject);
    formData.append('body', body);
    formData.append('delaySeconds', delaySeconds);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const res = await api.sendCampaign(formData);
      setSendingState(res.state);
      setIsSendingModalOpen(true);
    } catch (err) {
      alert('Error al iniciar envío: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Navbar Superior */}
      <Navbar
        authStatus={authStatus}
        onOpenSetupModal={() => setIsSetupModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Banner de Estado Auth */}
      <AuthBanner
        authStatus={authStatus}
        onConnect={handleConnectGmail}
        onOpenSetup={() => setIsSetupModalOpen(true)}
      />

      {/* Navegación Pestañas Principales */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('composer')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'composer'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Send className="w-4 h-4" /> Crear Campaña
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <HistoryIcon className="w-4 h-4" /> Historial de Envíos ({history.length})
            </button>
          </div>

          {activeTab === 'composer' && (
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setLayoutMode('stacked')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  layoutMode === 'stacked'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vista Cómoda Completa (Sin Scrollbar)"
              >
                <Rows className="w-3.5 h-3.5" /> Vista Cómoda
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('side')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  layoutMode === 'side'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vista Lado a Lado"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Vista Dividida
              </button>
            </div>
          )}
        </div>

        {/* Tab Composer */}
        {activeTab === 'composer' ? (
          layoutMode === 'stacked' ? (
            /* Vista Cómoda a Ancho Completo (Sin compresión de columnas) */
            <div className="space-y-6">
              {/* Sección 1: Destinatarios a Ancho Completo */}
              <RecipientEditor
                recipients={recipients}
                onChangeRecipients={setRecipients}
                savedLists={savedLists}
                onSaveList={handleSaveContactList}
                onLoadList={(list) => setRecipients(list.recipients || [])}
                onDeleteList={handleDeleteContactList}
              />

              {/* Sección 2: Compositor de Correo a Ancho Completo */}
              <EmailComposer
                subject={subject}
                onSubjectChange={setSubject}
                body={body}
                onBodyChange={setBody}
                attachment={attachment}
                onAttachmentChange={setAttachment}
                delaySeconds={delaySeconds}
                onDelaySecondsChange={setDelaySeconds}
                templates={templates}
                onSelectTemplate={handleSelectTemplate}
                onOpenSaveTemplate={() => setIsTemplateModalOpen(true)}
                onOpenPreview={() => setIsPreviewModalOpen(true)}
                onSend={handleStartSend}
                recipientsCount={recipients.filter(r => r.email && r.email.includes('@')).length}
                isAuthenticated={authStatus.isAuthenticated}
              />
            </div>
          ) : (
            /* Vista Dividida */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 h-full">
                <RecipientEditor
                  recipients={recipients}
                  onChangeRecipients={setRecipients}
                  savedLists={savedLists}
                  onSaveList={handleSaveContactList}
                  onLoadList={(list) => setRecipients(list.recipients || [])}
                  onDeleteList={handleDeleteContactList}
                />
              </div>

              <div className="lg:col-span-7 h-full">
                <EmailComposer
                  subject={subject}
                  onSubjectChange={setSubject}
                  body={body}
                  onBodyChange={setBody}
                  attachment={attachment}
                  onAttachmentChange={setAttachment}
                  delaySeconds={delaySeconds}
                  onDelaySecondsChange={setDelaySeconds}
                  templates={templates}
                  onSelectTemplate={handleSelectTemplate}
                  onOpenSaveTemplate={() => setIsTemplateModalOpen(true)}
                  onOpenPreview={() => setIsPreviewModalOpen(true)}
                  onSend={handleStartSend}
                  recipientsCount={recipients.filter(r => r.email && r.email.includes('@')).length}
                  isAuthenticated={authStatus.isAuthenticated}
                />
              </div>
            </div>
          )
        ) : (
          /* Tab History */
          <HistoryTab history={history} onRefreshHistory={loadHistory} />
        )}
      </main>

      {/* Modales */}
      <GoogleSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        initialCredentials={authStatus.credentials}
        onSaveCredentials={handleSaveCredentials}
      />

      <TemplateManager
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        currentSubject={subject}
        currentBody={body}
      />

      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        subject={subject}
        body={body}
        recipients={recipients.filter(r => r.email && r.email.includes('@'))}
        attachment={attachment}
        onConfirmSend={handleStartSend}
      />

      <SendingProgressModal
        isOpen={isSendingModalOpen}
        sendingState={sendingState}
        onPause={async () => {
          const s = await api.pauseCampaign();
          setSendingState(s);
        }}
        onResume={async () => {
          const s = await api.resumeCampaign();
          setSendingState(s);
        }}
        onCancel={async () => {
          const s = await api.cancelCampaign();
          setSendingState(s);
        }}
        onClose={() => {
          setIsSendingModalOpen(false);
          setSendingState({ status: 'idle' });
        }}
      />
    </div>
  );
}
