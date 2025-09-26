const DB_NAME = 'SmartCRM'
const DB_VERSION = 2

class IndexedDBStorage {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        const stores = [
          'customers',
          'communications',
          'reminders',
          'opportunities',
          'scripts',
          'users',
          'teamMessages',
          'conflicts'
        ]

        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' })

            if (storeName === 'customers') {
              store.createIndex('name', 'name', { unique: false })
              store.createIndex('company', 'company', { unique: false })
              store.createIndex('importance', 'importance', { unique: false })
              store.createIndex('status', 'status', { unique: false })
            }

            if (storeName === 'communications') {
              store.createIndex('customerId', 'customerId', { unique: false })
              store.createIndex('type', 'type', { unique: false })
            }

            if (storeName === 'reminders') {
              store.createIndex('customerId', 'customerId', { unique: false })
              store.createIndex('reminderDate', 'reminderDate', { unique: false })
            }

            if (storeName === 'users') {
              store.createIndex('email', 'email', { unique: true })
              store.createIndex('role', 'role', { unique: false })
            }

            if (storeName === 'teamMessages') {
              store.createIndex('userId', 'userId', { unique: false })
              store.createIndex('customerId', 'customerId', { unique: false })
              store.createIndex('createdAt', 'createdAt', { unique: false })
            }

            if (storeName === 'conflicts') {
              store.createIndex('customerId', 'customerId', { unique: false })
            }
          }
        })
      }
    })
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  async save<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async query<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }
}

export const storage = new IndexedDBStorage()