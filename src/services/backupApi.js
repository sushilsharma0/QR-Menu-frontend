import api from './api'

export const backupApi = {
  getHistory: () => api.get('/restaurant/backup/history'),
  createBackup: (body) => api.post('/restaurant/backup/create', body),
  deleteBackup: (id) => api.delete(`/restaurant/backup/${id}`),
  downloadBackup: (id) => api.get(`/restaurant/backup/download/${id}`, { responseType: 'blob' }),
  saveSchedule: (body) => api.post('/restaurant/backup/schedule', body),
  cloneBranch: (body) => api.post('/restaurant/backup/clone-branch', body),

  validateBackup: (formData) =>
    api.post('/restaurant/backup/validate', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  previewBackup: (formData) =>
    api.post('/restaurant/backup/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  requestRestoreOtp: (body) => api.post('/restaurant/backup/restore/otp/request', body),
  verifyRestoreOtp: (body) => api.post('/restaurant/backup/restore/otp/verify', body),
  startRestore: (formData) =>
    api.post('/restaurant/backup/restore/start', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getRestoreJob: (jobId) => api.get(`/restaurant/backup/restore/jobs/${jobId}`),
  cancelRestoreJob: (jobId) => api.post(`/restaurant/backup/restore/jobs/${jobId}/cancel`),
  rollbackSnapshot: (snapshotId) => api.post(`/restaurant/backup/restore/rollback/${snapshotId}`),
}

export default backupApi
