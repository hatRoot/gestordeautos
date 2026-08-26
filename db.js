/**
 * db.js - Gestor de Base de Datos Local (IndexedDB con fallback a localStorage)
 * Gestor de Autos - Sistema Administrativo
 */

const DB_NAME = 'GestorAutosDB';
const DB_VERSION = 3;

class DatabaseManager {
    constructor() {
        this.db = null;
        this.isReady = this.init();
    }

    async init() {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB no soportado, usando localStorage');
                this._initLocalStorage();
                resolve(this);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Almacén de Registros de Accesos (Logins)
                if (!db.objectStoreNames.contains('logins')) {
                    const loginStore = db.createObjectStore('logins', { keyPath: 'id', autoIncrement: true });
                    loginStore.createIndex('usuario', 'usuario', { unique: false });
                    loginStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Almacén de Liberaciones en Módulo
                if (db.objectStoreNames.contains('liberaciones')) {
                    db.deleteObjectStore('liberaciones');
                }
                const libStore = db.createObjectStore('liberaciones', { keyPath: 'id', autoIncrement: true });
                libStore.createIndex('folio', 'folio', { unique: false });
                libStore.createIndex('fecha', 'fecha', { unique: false });
                libStore.createIndex('tipo', 'tipo', { unique: false });
                libStore.createIndex('estatus', 'estatus', { unique: false });
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this);
            };

            request.onerror = (event) => {
                console.error('Error al abrir IndexedDB:', event.target.error);
                this._initLocalStorage();
                resolve(this);
            };
        });
    }

    _initLocalStorage() {
        if (!localStorage.getItem('ga_liberaciones')) {
            localStorage.setItem('ga_liberaciones', JSON.stringify([]));
        }
        if (!localStorage.getItem('ga_logins')) {
            localStorage.setItem('ga_logins', JSON.stringify([]));
        }
    }

    _getDefaultLiberaciones() {
        return [];
    }

    async _seedInitialDataIfNeeded() {
        const count = await this.getLiberacionesCount();
        if (count === 0) {
            const defaults = this._getDefaultLiberaciones();
            for (const item of defaults) {
                await this.addLiberacion(item);
            }
        }
    }

    // ==========================================
    // MÉTODOS DE REGISTRO DE ACCESOS (LOGINS)
    // ==========================================
    async registrarAcceso(usuario, ipInfo = 'Navegador Local') {
        await this.isReady;
        const record = {
            usuario: usuario || 'Administrador',
            fechaHora: new Date().toLocaleString('es-MX', {
                dateStyle: 'medium',
                timeStyle: 'medium'
            }),
            timestamp: Date.now(),
            navegador: navigator.userAgent.split(' ')[0] || 'Browser',
            origen: window.location.pathname || 'login.html',
            ipInfo: ipInfo,
            estado: 'Exitoso'
        };

        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('logins', 'readwrite');
                const store = tx.objectStore('logins');
                const request = store.add(record);
                request.onsuccess = (e) => {
                    record.id = e.target.result;
                    resolve(record);
                };
                request.onerror = (e) => reject(e.target.error);
            });
        } else {
            const logins = JSON.parse(localStorage.getItem('ga_logins') || '[]');
            record.id = Date.now();
            logins.unshift(record);
            localStorage.setItem('ga_logins', JSON.stringify(logins));
            return record;
        }
    }

    async getHistorialAccesos() {
        await this.isReady;
        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('logins', 'readonly');
                const store = tx.objectStore('logins');
                const request = store.getAll();
                request.onsuccess = () => {
                    const list = request.result || [];
                    list.sort((a, b) => b.timestamp - a.timestamp);
                    resolve(list);
                };
                request.onerror = (e) => reject(e.target.error);
            });
        } else {
            return JSON.parse(localStorage.getItem('ga_logins') || '[]');
        }
    }

    // ==========================================
    // MÉTODOS DE LIBERACIONES EN MÓDULO
    // ==========================================
    async getLiberaciones() {
        await this.isReady;
        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('liberaciones', 'readonly');
                const store = tx.objectStore('liberaciones');
                const request = store.getAll();
                request.onsuccess = () => {
                    const list = request.result || [];
                    list.sort((a, b) => (b.id || 0) - (a.id || 0));
                    resolve(list);
                };
                request.onerror = (e) => reject(e.target.error);
            });
        } else {
            return JSON.parse(localStorage.getItem('ga_liberaciones') || '[]');
        }
    }

    async getLiberacionesCount() {
        await this.isReady;
        if (this.db) {
            return new Promise((resolve) => {
                const tx = this.db.transaction('liberaciones', 'readonly');
                const store = tx.objectStore('liberaciones');
                const request = store.count();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(0);
            });
        } else {
            const list = JSON.parse(localStorage.getItem('ga_liberaciones') || '[]');
            return list.length;
        }
    }

    async addLiberacion(item) {
        await this.isReady;
        const record = {
            folio: item.folio || `FOL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
            fecha: item.fecha || new Date().toISOString().split('T')[0],
            tipo: item.tipo || 'Liberación',
            costo: item.costo || (item.tipo === 'Trámite' ? '800' : '300'),
            rfc: item.rfc || '',
            notas: item.notas || '',
            estatus: item.estatus || 'En proceso',
            creadoEn: Date.now()
        };

        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('liberaciones', 'readwrite');
                const store = tx.objectStore('liberaciones');
                const request = store.add(record);
                request.onsuccess = (e) => {
                    record.id = e.target.result;
                    resolve(record);
                };
                request.onerror = (e) => reject(e.target.error);
            });
        } else {
            const list = JSON.parse(localStorage.getItem('ga_liberaciones') || '[]');
            record.id = Date.now();
            list.unshift(record);
            localStorage.setItem('ga_liberaciones', JSON.stringify(list));
            return record;
        }
    }

    async updateLiberacion(id, updatedFields) {
        await this.isReady;
        const numId = Number(id);
        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('liberaciones', 'readwrite');
                const store = tx.objectStore('liberaciones');
                const getReq = store.get(numId);
                getReq.onsuccess = () => {
                    const existing = getReq.result;
                    if (!existing) {
                        reject(new Error('Registro no encontrado'));
                        return;
                    }
                    const merged = { ...existing, ...updatedFields, id: numId };
                    const putReq = store.put(merged);
                    putReq.onsuccess = () => resolve(merged);
                    putReq.onerror = (e) => reject(e.target.error);
                };
                getReq.onerror = (e) => reject(e.target.error);
            });
        } else {
            const list = JSON.parse(localStorage.getItem('ga_liberaciones') || '[]');
            const idx = list.findIndex(item => Number(item.id) === numId);
            if (idx !== -1) {
                list[idx] = { ...list[idx], ...updatedFields };
                localStorage.setItem('ga_liberaciones', JSON.stringify(list));
                return list[idx];
            }
            throw new Error('Registro no encontrado');
        }
    }

    async deleteLiberacion(id) {
        await this.isReady;
        const numId = Number(id);
        let deletedRecord = null;

        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('liberaciones', 'readwrite');
                const store = tx.objectStore('liberaciones');
                const getReq = store.get(numId);
                getReq.onsuccess = () => {
                    deletedRecord = getReq.result;
                    const req = store.delete(numId);
                    req.onsuccess = () => {
                        if (deletedRecord) {
                            this._guardarEnPapelera(deletedRecord);
                        }
                        resolve(true);
                    };
                    req.onerror = (e) => reject(e.target.error);
                };
                getReq.onerror = (e) => reject(e.target.error);
            });
        } else {
            let list = JSON.parse(localStorage.getItem('ga_liberaciones') || '[]');
            const idx = list.findIndex(item => Number(item.id) === numId);
            if (idx !== -1) {
                deletedRecord = list[idx];
                list.splice(idx, 1);
                localStorage.setItem('ga_liberaciones', JSON.stringify(list));
                if (deletedRecord) {
                    this._guardarEnPapelera(deletedRecord);
                }
            }
            return true;
        }
    }

    _guardarEnPapelera(record) {
        try {
            const papelera = JSON.parse(localStorage.getItem('ga_papelera') || '[]');
            record.eliminadoEn = new Date().toLocaleString('es-MX');
            papelera.unshift(record);
            localStorage.setItem('ga_papelera', JSON.stringify(papelera));
        } catch (e) {
            console.warn('Error al guardar en papelera:', e);
        }
    }

    async getPapelera() {
        return JSON.parse(localStorage.getItem('ga_papelera') || '[]');
    }

    async restaurarDePapelera(id) {
        const papelera = JSON.parse(localStorage.getItem('ga_papelera') || '[]');
        const idx = papelera.findIndex(item => Number(item.id) === Number(id));
        if (idx !== -1) {
            const itemToRestore = papelera.splice(idx, 1)[0];
            localStorage.setItem('ga_papelera', JSON.stringify(papelera));
            delete itemToRestore.id;
            delete itemToRestore.eliminadoEn;
            await this.addLiberacion(itemToRestore);
            return true;
        }
        return false;
    }
}

// Instancia global
window.appDB = new DatabaseManager();
