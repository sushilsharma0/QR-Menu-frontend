const DB = 'pos-offline'
const STORE = 'outbox'
const VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export async function enqueueOfflinePosAction(record) {
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.objectStore(STORE).add({
        ...record,
        createdAt: Date.now(),
      })
    })
    db.close()
  } catch {
  }
}

export async function drainOfflinePosQueue(handler) {
  let db
  try {
    db = await openDb()
  } catch {
    return
  }
  const rows = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const q = tx.objectStore(STORE).getAll()
    q.onsuccess = () => resolve(q.result || [])
    q.onerror = () => reject(q.error)
  })

  for (const row of rows) {
    try {
      await handler(row)
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.objectStore(STORE).delete(row.id)
      })
    } catch {
    }
  }
  db.close()
}

export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}
