const API_BASE = '/api';

function getAuthHeaders() {
  const headers = {};
  const savedTokens = localStorage.getItem('gmail_crm_tokens');
  if (savedTokens) {
    headers['x-google-tokens'] = savedTokens;
  }
  const savedCreds = localStorage.getItem('gmail_crm_credentials');
  if (savedCreds) {
    headers['x-google-credentials'] = savedCreds;
  }
  return headers;
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error en la petición al servidor');
  }
  return data;
}

export const api = {
  // Auth
  async getAuthStatus() {
    const res = await fetch(`${API_BASE}/auth/status`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async saveCredentials(clientId, clientSecret) {
    localStorage.setItem('gmail_crm_credentials', JSON.stringify({ clientId, clientSecret }));
    const res = await fetch(`${API_BASE}/auth/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ clientId, clientSecret })
    });
    return handleResponse(res);
  },

  async getAuthUrl() {
    const res = await fetch(`${API_BASE}/auth/google/url`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async logout() {
    localStorage.removeItem('gmail_crm_tokens');
    localStorage.removeItem('gmail_crm_user_info');
    localStorage.removeItem('gmail_crm_auth_status');
    const res = await fetch(`${API_BASE}/auth/logout`, { 
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Email Campaign
  async sendCampaign(formData) {
    const savedTokens = localStorage.getItem('gmail_crm_tokens');
    const savedCreds = localStorage.getItem('gmail_crm_credentials');
    if (savedTokens && !formData.has('tokensJson')) {
      formData.append('tokensJson', savedTokens);
    }
    if (savedCreds && !formData.has('credentialsJson')) {
      formData.append('credentialsJson', savedCreds);
    }

    const res = await fetch(`${API_BASE}/email/send`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData // Form data con JSON y adjunto PDF opcional
    });
    return handleResponse(res);
  },

  async getCampaignStatus() {
    const res = await fetch(`${API_BASE}/email/status`);
    return handleResponse(res);
  },

  async pauseCampaign() {
    const res = await fetch(`${API_BASE}/email/pause`, { method: 'POST' });
    return handleResponse(res);
  },

  async resumeCampaign() {
    const res = await fetch(`${API_BASE}/email/resume`, { method: 'POST' });
    return handleResponse(res);
  },

  async cancelCampaign() {
    const res = await fetch(`${API_BASE}/email/cancel`, { method: 'POST' });
    return handleResponse(res);
  },

  // Templates
  async getTemplates() {
    const res = await fetch(`${API_BASE}/templates`);
    return handleResponse(res);
  },

  async saveTemplate(template) {
    const res = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    });
    return handleResponse(res);
  },

  async deleteTemplate(id) {
    const res = await fetch(`${API_BASE}/templates/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // History
  async getHistory() {
    const res = await fetch(`${API_BASE}/history`);
    return handleResponse(res);
  },

  // Saved Contact Lists
  async getSavedLists() {
    const res = await fetch(`${API_BASE}/lists`);
    return handleResponse(res);
  },

  async saveContactList(listObj) {
    const res = await fetch(`${API_BASE}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listObj)
    });
    return handleResponse(res);
  },

  async deleteContactList(id) {
    const res = await fetch(`${API_BASE}/lists/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Scraper API
  async getScraperOptions() {
    const res = await fetch(`${API_BASE}/scraper/options`);
    return handleResponse(res);
  },

  async searchLeads(searchParams) {
    const res = await fetch(`${API_BASE}/scraper/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchParams)
    });
    return handleResponse(res);
  },

  async crawlSite(url) {
    const res = await fetch(`${API_BASE}/scraper/crawl-site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return handleResponse(res);
  }
};
