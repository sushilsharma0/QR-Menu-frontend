import React from 'react'
import {
  FiArchive,
  FiDatabase,
  FiDownload,
  FiRefreshCw,
  FiTrash2,
  FiUpload,
} from 'react-icons/fi'
import Card from '../../common/Card'
import Button from '../../common/Button'

const BACKUP_SECTION_OPTIONS = [
  'menu',
  'tables',
  'inventory',
  'employees',
  'accounting',
  'payroll',
  'settings',
  'promotions',
  'analytics',
  'logs',
]

export default function BackupSettingsSection({
  backupBusy,
  backupHistory,
  backupSchedules,
  backupSections,
  completedBackups,
  latestBackup,
  restoreFile,
  restorePreview,
  restoreMode,
  formatBackupSize,
  onRefresh,
  onCreateBackup,
  onToggleSection,
  onSaveSchedule,
  onRestoreFileChange,
  onRestoreModeChange,
  onPreviewRestore,
  onRunRestore,
  onDownload,
  onDelete,
}) {
  return (
    <Card
      title="Backup & Restore"
      icon={FiDatabase}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={backupBusy}>
          <FiRefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { label: 'Backups', value: completedBackups },
            {
              label: 'Last backup',
              value: latestBackup ? new Date(latestBackup.createdAt).toLocaleDateString() : 'None',
            },
            {
              label: 'Schedules',
              value: backupSchedules.filter((schedule) => schedule.isActive).length,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">{item.label}</p>
              <p className="mt-2 text-xl font-black text-gray-950 dark:text-gray-100">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => onCreateBackup('full')} disabled={backupBusy}>
                <FiArchive className="mr-2 h-4 w-4" />
                Full Backup
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onCreateBackup('partial')}
                disabled={backupBusy}
              >
                Partial Backup
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onCreateBackup('incremental')}
                disabled={backupBusy}
              >
                Incremental
              </Button>
            </div>

            <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Backup Sections
                </p>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {backupSections.length} selected
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {BACKUP_SECTION_OPTIONS.map((section) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => onToggleSection(section)}
                    className={`min-h-11 rounded-lg border px-3 text-sm font-bold capitalize transition hover:-translate-y-0.5 ${
                      backupSections.includes(section)
                        ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300'
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">Scheduled Backups</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {backupSchedules.length
                      ? `${backupSchedules.length} schedule${backupSchedules.length === 1 ? '' : 's'} configured`
                      : 'No active backup schedule'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['daily', 'weekly', 'monthly'].map((frequency) => (
                    <Button
                      key={frequency}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onSaveSchedule(frequency)}
                      disabled={backupBusy}
                    >
                      {frequency}
                    </Button>
                  ))}
                </div>
              </div>
              {backupSchedules.length > 0 && (
                <div className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                  {backupSchedules.map((schedule) => (
                    <div
                      key={schedule._id}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="font-bold capitalize text-gray-800 dark:text-gray-100">
                        {schedule.frequency}
                      </span>
                      <span className="text-right text-gray-500 dark:text-gray-400">
                        {new Date(schedule.nextRunAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">Restore Backup</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {restoreFile ? restoreFile.name : 'No backup file selected'}
                </p>
              </div>
              {restorePreview && (
                <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-black text-accent-700 dark:bg-gray-800 dark:text-accent-300">
                  Previewed
                </span>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <input
                id="restore-backup-input"
                type="file"
                accept=".qrbak,application/octet-stream"
                onChange={onRestoreFileChange}
                className="hidden"
              />
              <label
                htmlFor="restore-backup-input"
                className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white px-4 py-5 text-center transition hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900"
              >
                <FiUpload className="h-6 w-6 text-primary-600" />
                <span className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                  Choose encrypted backup
                </span>
                <span className="mt-1 max-w-full truncate text-xs text-gray-500 dark:text-gray-400">
                  {restoreFile?.name || '.qrbak'}
                </span>
              </label>

              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Restore mode
                <select
                  value={restoreMode}
                  onChange={onRestoreModeChange}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="merge">Merge</option>
                  <option value="replace">Replace</option>
                  <option value="create_new_branch">Create new branch</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={onPreviewRestore} disabled={backupBusy}>
                  Preview
                </Button>
                <Button type="button" onClick={onRunRestore} disabled={backupBusy || !restorePreview}>
                  Restore
                </Button>
              </div>
            </div>

            {restorePreview && (
              <div className="mt-5 rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Preview</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(restorePreview.counts || {})
                    .slice(0, 10)
                    .map(([key, count]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-950"
                      >
                        <span className="truncate capitalize text-gray-600 dark:text-gray-300">{key}</span>
                        <span className="font-black text-gray-900 dark:text-gray-100">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
            <thead className="bg-gray-50 text-left text-xs font-black uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
              {backupHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No backups yet.
                  </td>
                </tr>
              ) : (
                backupHistory.map((backup) => (
                  <tr key={backup._id} className="transition hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-4 py-3 font-bold capitalize text-gray-900 dark:text-gray-100">
                      {backup.type}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {formatBackupSize(backup.size)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-black capitalize ${
                          backup.status === 'completed'
                            ? 'bg-accent-50 text-accent-700 dark:bg-gray-800 dark:text-accent-300'
                            : backup.status === 'failed'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {backup.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onDownload(backup._id)}
                          className="rounded-lg p-2 text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-gray-800"
                        >
                          <FiDownload />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(backup._id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}
