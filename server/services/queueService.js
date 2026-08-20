import { sendEmailViaGmail } from './gmailService.js';
import { addHistoryRecord } from './dbStore.js';
import fs from 'fs';

class QueueService {
  constructor() {
    this.activeJob = null;
  }

  getCurrentState() {
    if (!this.activeJob) {
      return { status: 'idle' };
    }
    return {
      status: this.activeJob.status, // 'running', 'paused', 'completed', 'cancelled'
      jobId: this.activeJob.id,
      subject: this.activeJob.subject,
      total: this.activeJob.recipients.length,
      sentCount: this.activeJob.sentCount,
      failedCount: this.activeJob.failedCount,
      currentIndex: this.activeJob.currentIndex,
      delaySeconds: this.activeJob.delaySeconds,
      logs: this.activeJob.logs,
      startedAt: this.activeJob.startedAt,
      completedAt: this.activeJob.completedAt
    };
  }

  // Reemplazar variables dinámicas en el texto {nombre}, {empresa}, {puesto}, etc.
  interpolate(templateText, recipientData = {}) {
    if (!templateText) return '';
    let result = templateText;
    
    // Variables estándar y fallback
    const map = {
      nombre: recipientData.nombre || recipientData.name || 'Estimado/a',
      empresa: recipientData.empresa || recipientData.company || 'su empresa',
      puesto: recipientData.puesto || recipientData.position || 'la posición',
      email: recipientData.email || ''
    };

    // Reemplazar también cualquier otra propiedad
    Object.keys(recipientData).forEach(key => {
      map[key.toLowerCase()] = recipientData[key];
    });

    Object.keys(map).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      result = result.replace(regex, map[key]);
    });

    return result;
  }

  async startJob({ recipients, subject, body, delaySeconds = 5, attachment = null }) {
    if (this.activeJob && (this.activeJob.status === 'running' || this.activeJob.status === 'paused')) {
      throw new Error('Ya hay una campaña en curso. Por favor espere o cancólela.');
    }

    const jobId = `campaign-${Date.now()}`;
    this.activeJob = {
      id: jobId,
      status: 'running',
      recipients,
      subject,
      body,
      delaySeconds: parseInt(delaySeconds, 10) || 5,
      attachment,
      currentIndex: 0,
      sentCount: 0,
      failedCount: 0,
      logs: [],
      startedAt: new Date().toISOString(),
      completedAt: null
    };

    // Iniciar procesamiento asíncrono
    this.processQueue();

    return this.getCurrentState();
  }

  pauseJob() {
    if (this.activeJob && this.activeJob.status === 'running') {
      this.activeJob.status = 'paused';
      this.addLog('info', 'Sistema', 'Campaña pausada por el usuario.');
    }
    return this.getCurrentState();
  }

  resumeJob() {
    if (this.activeJob && this.activeJob.status === 'paused') {
      this.activeJob.status = 'running';
      this.addLog('info', 'Sistema', 'Campaña reanudada.');
      this.processQueue();
    }
    return this.getCurrentState();
  }

  cancelJob() {
    if (this.activeJob) {
      this.activeJob.status = 'cancelled';
      this.activeJob.completedAt = new Date().toISOString();
      this.addLog('warn', 'Sistema', 'Campaña cancelada por el usuario.');
      this.finalizeJob();
    }
    return this.getCurrentState();
  }

  addLog(type, recipientEmail, message) {
    if (!this.activeJob) return;
    const logItem = {
      timestamp: new Date().toLocaleTimeString(),
      type, // 'success', 'error', 'info', 'warn'
      recipient: recipientEmail,
      message
    };
    this.activeJob.logs.push(logItem);
  }

  async processQueue() {
    const job = this.activeJob;
    if (!job) return;

    while (job.currentIndex < job.recipients.length && job.status === 'running') {
      const recipient = job.recipients[job.currentIndex];
      const email = typeof recipient === 'string' ? recipient : recipient.email;

      if (!email || !email.includes('@')) {
        job.failedCount++;
        this.addLog('error', email || 'Inválido', 'Dirección de correo no válida.');
        job.currentIndex++;
        continue;
      }

      // Reemplazo de variables
      const personalizedSubject = this.interpolate(job.subject, recipient);
      const rawBody = this.interpolate(job.body, recipient);
      const formattedBody = rawBody.replace(/\n/g, '<br/>');

      try {
        await sendEmailViaGmail({
          to: email,
          subject: personalizedSubject,
          bodyHtml: `<div style="font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">${formattedBody}</div>`,
          bodyText: rawBody,
          attachment: job.attachment
        });

        job.sentCount++;
        this.addLog('success', email, `Correo enviado exitosamente (${job.currentIndex + 1}/${job.recipients.length})`);
      } catch (err) {
        job.failedCount++;
        const errMsg = err.response?.data?.error?.message || err.message || 'Error desconocido al enviar';
        this.addLog('error', email, `Error de envío: ${errMsg}`);
      }

      job.currentIndex++;

      // Esperar retardo configurado si no hemos llegado al final y el estado sigue activo
      if (job.currentIndex < job.recipients.length && job.status === 'running') {
        const delayMs = job.delaySeconds * 1000;
        this.addLog('info', 'Sistema', `Esperando ${job.delaySeconds} segundos de intervalo de seguridad...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    if (job.currentIndex >= job.recipients.length && job.status === 'running') {
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      this.addLog('info', 'Sistema', '🎉 Campaña de correos completada.');
      this.finalizeJob();
    }
  }

  finalizeJob() {
    if (!this.activeJob) return;

    // Eliminar archivo adjunto temporal si existe
    if (this.activeJob.attachment && fs.existsSync(this.activeJob.attachment.path)) {
      try {
        fs.unlinkSync(this.activeJob.attachment.path);
      } catch (e) {
        console.warn('No se pudo borrar archivo temporal:', e.message);
      }
    }

    // Registrar en el historial de la base de datos
    addHistoryRecord({
      id: this.activeJob.id,
      subject: this.activeJob.subject,
      totalRecipients: this.activeJob.recipients.length,
      sentCount: this.activeJob.sentCount,
      failedCount: this.activeJob.failedCount,
      delaySeconds: this.activeJob.delaySeconds,
      startedAt: this.activeJob.startedAt,
      completedAt: this.activeJob.completedAt,
      status: this.activeJob.status,
      logs: this.activeJob.logs
    });
  }
}

export const queueService = new QueueService();
