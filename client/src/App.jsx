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
import ScraperDashboard from './components/ScraperDashboard';
import { api } from './services/api';
import { Send, Users, History as HistoryIcon, ShieldAlert, LayoutGrid, Rows, Search } from 'lucide-react';

export default function App() {
  // Estado de Autenticación con auto-recuperación de localStorage
  const [authStatus, setAuthStatus] = useState(() => {
    try {
      const saved = localStorage.getItem('gmail_crm_auth_status');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      isAuthenticated: false,
      userInfo: null,
      hasCredentials: false
    };
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
  const [activeTab, setActiveTab] = useState('composer'); // 'composer' | 'history' | 'scraper'
  const [layoutMode, setLayoutMode] = useState('stacked'); // 'stacked' (ancho completo cómodo) | 'side'
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSendingModalOpen, setIsSendingModalOpen] = useState(false);

  // Importar leads desde el Scraper directo a la tabla de destinatarios del CRM
  const handleImportFromScraper = (scrapedRecipients) => {
    setRecipients(prev => {
      const existingEmails = new Set(prev.map(r => r.email.toLowerCase()));
      const newRecs = scrapedRecipients.filter(r => !existingEmails.has(r.email.toLowerCase()));
      return [...prev, ...newRecs];
    });
    alert(`¡Se han cargado ${scrapedRecipients.length} contactos de Aragua a tu lista de envíos masivos!`);
    setActiveTab('composer');
  };

  // Guardar destinatarios automáticamente en localStorage cada vez que cambien
  useEffect(() => {
    try {
      localStorage.setItem('gmail_crm_saved_recipients', JSON.stringify(recipients));
      const activeEmail = authStatus?.userInfo?.email || localStorage.getItem('gmail_crm_user_email');
      if (activeEmail) {
        localStorage.setItem(`gmail_crm_recipients_${activeEmail}`, JSON.stringify(recipients));
      }
    } catch (e) {
      console.warn('Error guardando en localStorage:', e);
    }
  }, [recipients, authStatus?.userInfo?.email]);

  // Cargar estado inicial al montar
  useEffect(() => {
    const initApp = async () => {
      await checkAuthStatus();
      const savedEmail = localStorage.getItem('gmail_crm_user_email');
      await reloadUserData(savedEmail);
    };
    initApp();

    // Escuchar mensaje emergente de OAuth popup
    const handleOAuthMessage = async (event) => {
      const isSuccess = event.data === 'oauth-success' || (event.data && event.data.type === 'oauth-success');
      if (isSuccess) {
        let userEmail = null;
        if (event.data && typeof event.data === 'object') {
          if (event.data.tokens) {
            localStorage.setItem('gmail_crm_tokens', JSON.stringify(event.data.tokens));
          }
          if (event.data.userInfo) {
            localStorage.setItem('gmail_crm_user_info', JSON.stringify(event.data.userInfo));
            userEmail = event.data.userInfo.email;
          }
        }
        if (userEmail) {
          localStorage.setItem('gmail_crm_user_email', userEmail);
        }
        const updatedStatus = {
          isAuthenticated: true,
          userInfo: event.data?.userInfo || { email: userEmail || 'Cuenta Gmail Conectada' },
          hasCredentials: true
        };
        localStorage.setItem('gmail_crm_auth_status', JSON.stringify(updatedStatus));
        setAuthStatus(updatedStatus);
        await checkAuthStatus();

        // ¡CRÍTICO! Sincronizar inmediatamente listas, plantillas e historial asociados a esta cuenta de Gmail
        await reloadUserData(userEmail);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const reloadUserData = async (emailOverride) => {
    try {
      await Promise.allSettled([
        loadSavedLists(emailOverride),
        loadTemplates(),
        loadHistory()
      ]);
    } catch (e) {
      console.error('Error al recargar datos del usuario:', e);
    }
  };

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
      if (data && data.isAuthenticated) {
        localStorage.setItem('gmail_crm_auth_status', JSON.stringify(data));
        if (data.userInfo?.email) {
          localStorage.setItem('gmail_crm_user_email', data.userInfo.email);
        }
      }
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

  const loadSavedLists = async (emailOverride) => {
    try {
      const activeEmail = emailOverride || authStatus?.userInfo?.email || localStorage.getItem('gmail_crm_user_email');
      const cacheKey = activeEmail ? `gmail_crm_saved_lists_${activeEmail}` : 'gmail_crm_saved_lists';

      // 1. Revisar si hay listas en caché local del navegador
      let localLists = [];
      try {
        const cached = localStorage.getItem(cacheKey);
        const legacy = localStorage.getItem('gmail_crm_saved_lists');
        if (cached) localLists = JSON.parse(cached);
        else if (legacy) localLists = JSON.parse(legacy);
      } catch (e) {}

      // Si tenemos listas locales y el usuario está conectado con Gmail, sincronizarlas/fusionarlas con su cuenta
      if (activeEmail && Array.isArray(localLists) && localLists.length > 0) {
        try {
          const syncRes = await api.syncContactLists(localLists);
          if (syncRes && Array.isArray(syncRes.lists)) {
            setSavedLists(syncRes.lists);
            localStorage.setItem(cacheKey, JSON.stringify(syncRes.lists));
            localStorage.setItem('gmail_crm_saved_lists', JSON.stringify(syncRes.lists));
            return;
          }
        } catch (syncErr) {
          console.warn('Sync inicial con el servidor no completado, cargando directo:', syncErr);
        }
      }

      // 2. Consultar listas remotas del servidor para esta cuenta
      const lists = await api.getSavedLists();
      if (Array.isArray(lists) && lists.length > 0) {
        setSavedLists(lists);
        localStorage.setItem(cacheKey, JSON.stringify(lists));
        localStorage.setItem('gmail_crm_saved_lists', JSON.stringify(lists));
      } else if (Array.isArray(localLists) && localLists.length > 0) {
        setSavedLists(localLists);
      } else {
        setSavedLists([]);
      }
    } catch (e) {
      console.error('Error cargando listas guardadas:', e);
      try {
        const activeEmail = emailOverride || authStatus?.userInfo?.email || localStorage.getItem('gmail_crm_user_email');
        const cacheKey = activeEmail ? `gmail_crm_saved_lists_${activeEmail}` : 'gmail_crm_saved_lists';
        const local = localStorage.getItem(cacheKey) || localStorage.getItem('gmail_crm_saved_lists');
        if (local) setSavedLists(JSON.parse(local));
      } catch (err) {}
    }
  };

  const handleSaveContactList = async (name) => {
    const activeEmail = authStatus?.userInfo?.email || localStorage.getItem('gmail_crm_user_email');
    const cacheKey = activeEmail ? `gmail_crm_saved_lists_${activeEmail}` : 'gmail_crm_saved_lists';

    try {
      const res = await api.saveContactList({ name, recipients });
      const updated = res.lists || [];
      setSavedLists(updated);
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      localStorage.setItem('gmail_crm_saved_lists', JSON.stringify(updated));
      alert(`¡Lista "${name}" guardada y sincronizada con tu cuenta de Gmail exitosamente!`);
    } catch (e) {
      console.warn('Error guardando en servidor, respaldo local:', e);
      const newListItem = {
        id: `list-${Date.now()}`,
        name: name || `Lista (${recipients.length})`,
        recipients,
        updatedAt: new Date().toISOString()
      };
      const updated = [newListItem, ...savedLists];
      setSavedLists(updated);
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      localStorage.setItem('gmail_crm_saved_lists', JSON.stringify(updated));
      alert(`¡Lista "${name}" guardada localmente! Se sincronizará automáticamente con tu cuenta al reconectar.`);
    }
  };

  const handleDeleteContactList = async (id) => {
    const activeEmail = authStatus?.userInfo?.email || localStorage.getItem('gmail_crm_user_email');
    const cacheKey = activeEmail ? `gmail_crm_saved_lists_${activeEmail}` : 'gmail_crm_saved_lists';

    try {
      const res = await api.deleteContactList(id);
      const updated = res.lists || [];
      setSavedLists(updated);
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      localStorage.setItem('gmail_crm_saved_lists', JSON.stringify(updated));
    } catch (e) {
      const updated = savedLists.filter(l => l.id !== id);
      setSavedLists(updated);
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      localStorage.setItem('gmail_crm_saved_lists', JSON.stringify(updated));
    }
  };

  const handleImportContactLists = async (importedLists) => {
    if (!Array.isArray(importedLists) || importedLists.length === 0) {
      alert('El archivo no contiene listas válidas.');
      return;
    }
    const activeEmail = authStatus?.userInfo?.email || localStorage.getItem('gmail_crm_user_email');
    const cacheKey = activeEmail ? `gmail_crm_saved_lists_${activeEmail}` : 'gmail_crm_saved_lists';

    try {
      const res = await api.syncContactLists(importedLists);
      const updated = res.lists || [];
      setSavedLists(updated);
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      localStorage.setItem('gmail_crm_saved_lists', JSON.stringify(updated));
      alert(`¡Se importaron y sincronizaron ${importedLists.length} listas con éxito!`);
    } catch (e) {
      console.warn('Error sincronizando importación con servidor, aplicando localmente:', e);
      const merged = [...importedLists, ...savedLists];
      setSavedLists(merged);
      localStorage.setItem(cacheKey, JSON.stringify(merged));
      localStorage.setItem('gmail_crm_saved_lists', JSON.stringify(merged));
      alert(`¡Se importaron ${importedLists.length} listas en tu navegador!`);
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
      } catch (e) {
        console.warn('Error al cerrar sesión remotamente:', e.message);
      }
      localStorage.removeItem('gmail_crm_auth_status');
      setAuthStatus({ isAuthenticated: false, userInfo: null, hasCredentials: true });
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

    if (!authStatus.isAuthenticated) {
      alert('Por favor conecta tu cuenta de Gmail para comenzar el envío.');
      handleConnectGmail();
      return;
    }

    const finalSubject = subject.trim() || '(Sin asunto)';

    // Advertencia Anti-Spam para envíos de más de 20 correos
    if (validRecipients.length > 20) {
      const confirmLarge = window.confirm(
        `Vas a enviar ${validRecipients.length} correos. Para proteger la reputación de tu cuenta de Gmail, asegúrate de mantener un intervalo de al menos 5-10 segundos.\n\n¿Deseas continuar?`
      );
      if (!confirmLarge) return;
    }

    const formData = new FormData();
    formData.append('recipientsJson', JSON.stringify(validRecipients));
    formData.append('subject', finalSubject);
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
              onClick={() => setActiveTab('scraper')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'scraper'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Search className="w-4 h-4" /> Buscador de Leads (Aragua)
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

        {/* Tab Scraper / Buscador de Leads */}
        {activeTab === 'scraper' ? (
          <ScraperDashboard onImportToCampaign={handleImportFromScraper} />
        ) : activeTab === 'composer' ? (
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
                onImportLists={handleImportContactLists}
                userEmail={authStatus?.userInfo?.email || localStorage.getItem('gmail_crm_user_email')}
                storageInfo={authStatus?.storage}
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
                  onImportLists={handleImportContactLists}
                  userEmail={authStatus?.userInfo?.email || localStorage.getItem('gmail_crm_user_email')}
                  storageInfo={authStatus?.storage}
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
