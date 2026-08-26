/**
 * dashboard.js - Lógica interactiva del Dashboard estilo macOS Lion
 * Gestor de Autos - Sistema Administrativo
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificación básica de sesión
    const session = JSON.parse(localStorage.getItem('ga_active_session') || sessionStorage.getItem('ga_active_session') || 'null');
    const userNameDisplay = document.getElementById('currentUserName');
    if (session && session.user) {
        if (userNameDisplay) userNameDisplay.textContent = session.user;
    }

    // 2. Estado de la aplicación
    let liberaciones = [];
    let currentFilter = 'todos';
    let searchQuery = '';
    let selectedRowId = null;

    // 3. Elementos del DOM
    const tableBody = document.getElementById('liberacionesTableBody');
    const totalCountEl = document.getElementById('totalCount');
    const searchInput = document.getElementById('macSearchInput');
    const filterButtons = document.querySelectorAll('.mac-filter-btn');
    const sidebarItems = document.querySelectorAll('.mac-sidebar-item');
    const sheetOverlay = document.getElementById('itemSheetOverlay');
    const libForm = document.getElementById('liberacionForm');
    const btnNewItem = document.getElementById('btnNewItem');
    const btnCancelSheet = document.getElementById('btnCancelSheet');
    const sheetTitle = document.getElementById('sheetTitle');
    const viewTitleH2 = document.getElementById('viewTitleH2');
    const viewSubtitle = document.getElementById('viewSubtitle');
    const liberacionesView = document.getElementById('liberacionesView');
    const accesosView = document.getElementById('accesosView');
    const accesosTableBody = document.getElementById('accesosTableBody');

    // 4. Inicializar y cargar datos desde la DB
    async function loadData() {
        if (!window.appDB) {
            setTimeout(loadData, 100);
            return;
        }
        liberaciones = await window.appDB.getLiberaciones();
        updateStats();
        renderTable();
    }

    function updateStats() {
        const total = liberaciones.length;
        const concluidos = liberaciones.filter(l => l.estatus === 'Concluido').length;
        const enProceso = liberaciones.filter(l => l.estatus === 'En proceso').length;

        if (totalCountEl) totalCountEl.textContent = `${total} ítems (${concluidos} concluidos, ${enProceso} en proceso)`;
        
        const badgeCount = document.getElementById('badgeLiberacionesCount');
        if (badgeCount) badgeCount.textContent = total;
    }

    // 5. Renderizado de la tabla tipo celdas macOS Lion
    function renderTable() {
        if (!tableBody) return;

        let filtered = liberaciones.filter(item => {
            // Filtro por pestañas / botones
            if (currentFilter === 'liberacion' && item.tipo !== 'Liberación') return false;
            if (currentFilter === 'tramite' && item.tipo !== 'Trámite') return false;
            if (currentFilter === 'en-proceso' && item.estatus !== 'En proceso') return false;
            if (currentFilter === 'concluido' && item.estatus !== 'Concluido') return false;

            // Filtro por buscador
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchFolio = (item.folio || '').toLowerCase().includes(q);
                const matchNotas = (item.notas || '').toLowerCase().includes(q);
                const matchTipo = (item.tipo || '').toLowerCase().includes(q);
                const matchRfc = (item.rfc || '').toLowerCase().includes(q);
                return matchFolio || matchNotas || matchTipo || matchRfc;
            }

            return true;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr style="height: 32px;">
                    <td colspan="8" style="text-align: center; color: #8a94a6; font-style: italic; font-size: 11.5px; height: 32px; line-height: 32px;">
                        <i class="fas fa-inbox" style="margin-right: 6px; opacity: 0.7;"></i> Sin registros en este módulo. Haz clic en "+ Nueva Liberación" para agregar uno.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filtered.map(item => {
            const isConcluido = item.estatus === 'Concluido';
            const isLiberacion = item.tipo === 'Liberación';
            const isSelected = selectedRowId === item.id;
            const displayCost = item.costo || (isLiberacion ? '300' : '800');

            return `
                <tr class="${isSelected ? 'selected' : ''}" data-id="${item.id}" onclick="selectRow(${item.id})">
                    <td class="folio-cell">
                        <i class="fas fa-folder" style="margin-right: 6px; opacity: 0.7; color: ${isSelected ? '#fff' : '#4b82d4'};"></i>
                        ${escapeHtml(item.folio)}
                    </td>
                    <td>
                        <i class="far fa-calendar-alt" style="margin-right: 4px; opacity: 0.6;"></i>
                        ${escapeHtml(item.fecha)}
                    </td>
                    <td>
                        <span class="mac-pill-type ${isLiberacion ? 'liberacion' : 'tramite'}">
                            <i class="fas ${isLiberacion ? 'fa-key' : 'fa-file-signature'}"></i>
                            ${escapeHtml(item.tipo)}
                        </span>
                    </td>
                    <td>
                        <code style="font-size: 11.5px; font-weight: 600; color: ${isSelected ? '#ffffff' : '#334155'}; background: ${isSelected ? 'rgba(255,255,255,0.2)' : '#f1f5f9'}; padding: 2px 6px; border-radius: 4px;">
                            ${escapeHtml(item.rfc || 'Sin RFC')}
                        </code>
                    </td>
                    <td>
                        <span style="font-weight: 700; color: ${isSelected ? '#ffffff' : '#059669'}; font-size: 12px;">
                            $${escapeHtml(displayCost)}
                        </span>
                    </td>
                    <td class="notes-cell" title="${escapeHtml(item.notas)}">
                        ${escapeHtml(item.notas || 'Sin notas registradas')}
                    </td>
                    <td>
                        <span class="mac-status-tag ${isConcluido ? 'concluido' : 'en-proceso'}" 
                              title="Haz clic para alternar estatus" 
                              onclick="toggleStatus(event, ${item.id})">
                            <span class="status-dot"></span>
                            ${escapeHtml(item.estatus)}
                        </span>
                    </td>
                    <td class="actions-cell" style="text-align: center; white-space: nowrap;">
                        <button class="table-icon-btn" title="Editar registro" onclick="openEditModal(event, ${item.id})" style="color: #2563eb; font-size: 13px; padding: 4px 6px; margin-right: 4px;">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="table-icon-btn delete" title="Eliminar registro" onclick="deleteItem(event, ${item.id})" style="color: #ef4444; font-size: 13px; padding: 4px 6px;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 6. Selección de Fila estilo macOS
    window.selectRow = function(id) {
        selectedRowId = (selectedRowId === id) ? null : id;
        renderTable();
    };

    // 7. Alternar Estatus rápido (Concluido / En proceso)
    window.toggleStatus = async function(e, id) {
        e.stopPropagation();
        const item = liberaciones.find(l => l.id === id);
        if (!item) return;

        const newStatus = item.estatus === 'Concluido' ? 'En proceso' : 'Concluido';
        await window.appDB.updateLiberacion(id, { estatus: newStatus });
        await loadData();
    };

    // Función global para actualizar costo automático al cambiar tipo de trabajo
    window.updateCostoAuto = function() {
        const tipo = document.getElementById('itemTipo').value;
        const costoInput = document.getElementById('itemCosto');
        if (tipo === 'Trámite') {
            costoInput.value = '800';
        } else {
            costoInput.value = '300';
        }
    };

    // 8. Abrir Modal / Sheet para Nuevo o Editar
    btnNewItem.addEventListener('click', () => {
        sheetTitle.innerHTML = '<i class="fas fa-plus-circle" style="color: #2b7de9;"></i> Nueva Liberación o Trámite';
        libForm.reset();
        document.getElementById('itemId').value = '';
        document.getElementById('itemFolio').value = ''; // Folio en blanco
        document.getElementById('itemFecha').value = new Date().toISOString().split('T')[0];
        document.getElementById('itemTipo').value = 'Liberación';
        document.getElementById('itemEstatus').value = 'En proceso';
        document.getElementById('itemRfc').value = '';
        document.getElementById('itemCosto').value = '300';
        sheetOverlay.style.display = 'flex';
        setTimeout(() => document.getElementById('itemFolio').focus(), 50);
    });

    window.openEditModal = function(e, id) {
        e.stopPropagation();
        const item = liberaciones.find(l => l.id === id);
        if (!item) return;

        sheetTitle.innerHTML = '<i class="fas fa-edit" style="color: #2b7de9;"></i> Editar Registro';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemFolio').value = item.folio || '';
        document.getElementById('itemFecha').value = item.fecha;
        document.getElementById('itemTipo').value = item.tipo || 'Liberación';
        document.getElementById('itemEstatus').value = item.estatus || 'En proceso';
        document.getElementById('itemRfc').value = item.rfc || '';
        document.getElementById('itemCosto').value = item.costo || (item.tipo === 'Trámite' ? '800' : '300');
        document.getElementById('itemNotas').value = item.notas || '';

        sheetOverlay.style.display = 'flex';
    };

    btnCancelSheet.addEventListener('click', () => {
        sheetOverlay.style.display = 'none';
    });

    // Cerrar sheet al hacer clic afuera
    sheetOverlay.addEventListener('click', (e) => {
        if (e.target === sheetOverlay) {
            sheetOverlay.style.display = 'none';
        }
    });

    // Guardar (Crear / Actualizar)
    const handleSave = async (e) => {
        if (e) e.preventDefault();
        
        const id = document.getElementById('itemId').value;
        const folioVal = document.getElementById('itemFolio').value.trim();
        const fechaVal = document.getElementById('itemFecha').value || new Date().toISOString().split('T')[0];
        const tipoVal = document.getElementById('itemTipo').value || 'Liberación';
        const estatusVal = document.getElementById('itemEstatus').value || 'En proceso';
        const rfcVal = document.getElementById('itemRfc').value.trim().toUpperCase();
        const costoVal = document.getElementById('itemCosto').value.trim() || (tipoVal === 'Trámite' ? '800' : '300');
        const notasVal = document.getElementById('itemNotas').value.trim();

        if (!folioVal) {
            alert('Por favor ingresa un número de Folio.');
            document.getElementById('itemFolio').focus();
            return;
        }

        const btnSave = document.getElementById('btnSaveSheet');
        if (btnSave) {
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            btnSave.disabled = true;
        }

        const data = {
            folio: folioVal,
            fecha: fechaVal,
            tipo: tipoVal,
            estatus: estatusVal,
            rfc: rfcVal,
            costo: costoVal,
            notas: notasVal
        };

        try {
            if (id) {
                if (window.appDB) {
                    await window.appDB.updateLiberacion(Number(id), data);
                } else {
                    const idx = liberaciones.findIndex(l => l.id === Number(id));
                    if (idx !== -1) liberaciones[idx] = { ...liberaciones[idx], ...data };
                }
            } else {
                if (window.appDB) {
                    await window.appDB.addLiberacion(data);
                } else {
                    data.id = Date.now();
                    liberaciones.unshift(data);
                }
            }

            sheetOverlay.style.display = 'none';
            await loadData();

        } catch (err) {
            console.error('Error al guardar registro:', err);
            // Fallback de emergencia local
            if (!id) {
                data.id = Date.now();
                liberaciones.unshift(data);
            } else {
                const idx = liberaciones.findIndex(l => l.id === Number(id));
                if (idx !== -1) liberaciones[idx] = { ...liberaciones[idx], ...data };
            }
            try {
                localStorage.setItem('ga_liberaciones', JSON.stringify(liberaciones));
            } catch (storageErr) {
                console.warn(storageErr);
            }
            sheetOverlay.style.display = 'none';
            updateStats();
            renderTable();
        } finally {
            if (btnSave) {
                btnSave.innerHTML = 'Guardar';
                btnSave.disabled = false;
            }
        }
    };

    libForm.addEventListener('submit', handleSave);

    const btnSaveSheet = document.getElementById('btnSaveSheet');
    if (btnSaveSheet) {
        btnSaveSheet.addEventListener('click', (e) => {
            if (libForm.checkValidity()) {
                handleSave(e);
            }
        });
    }

    // 9. Eliminar Registro con Historial de Recuperación (Undo / Cmd+Z)
    let lastDeletedItem = null;
    let undoTimeout = null;
    const undoToast = document.getElementById('undoToast');
    const btnUndoDelete = document.getElementById('btnUndoDelete');

    window.deleteItem = async function(e, id) {
        e.stopPropagation();
        const itemToDelete = liberaciones.find(l => l.id === id);
        if (!itemToDelete) return;

        if (confirm(`¿Eliminar el registro con folio "${itemToDelete.folio}"?`)) {
            lastDeletedItem = { ...itemToDelete };
            await window.appDB.deleteLiberacion(id);
            await loadData();

            // Mostrar notificación flotante para Deshacer
            if (undoToast) {
                undoToast.style.display = 'flex';
                clearTimeout(undoTimeout);
                undoTimeout = setTimeout(() => {
                    undoToast.style.display = 'none';
                }, 8000);
            }
        }
    };

    // Restaurar el último registro eliminado
    window.restoreLastDeleted = async function() {
        if (!lastDeletedItem) return;
        const restored = { ...lastDeletedItem };
        delete restored.id; // Asignar nuevo id autoincrementable
        
        await window.appDB.addLiberacion(restored);
        lastDeletedItem = null;
        if (undoToast) undoToast.style.display = 'none';
        await loadData();
    };

    if (btnUndoDelete) {
        btnUndoDelete.addEventListener('click', window.restoreLastDeleted);
    }

    // Atajo de teclado macOS (Cmd+Z o Ctrl+Z) para deshacer eliminación
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
            if (lastDeletedItem && undoToast && undoToast.style.display !== 'none') {
                e.preventDefault();
                window.restoreLastDeleted();
            }
        }
    });

    // 10. Buscador en vivo
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTable();
    });

    // 11. Filtros de vista
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTable();
        });
    });

    // 12. Navegación por la barra lateral izquierda (Sidebar)
    sidebarItems.forEach(item => {
        item.addEventListener('click', async () => {
            const menu = item.dataset.menu;

            if (menu === 'logout') {
                if (confirm('¿Cerrar sesión del panel administrativo?')) {
                    if (window.gaSupabase) {
                        await window.gaSupabase.logout();
                    }
                    localStorage.removeItem('ga_active_session');
                    sessionStorage.removeItem('ga_active_session');
                    window.location.href = 'login.html';
                }
                return;
            }

            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            if (menu === 'liberaciones') {
                liberacionesView.style.display = 'flex';
                viewTitleH2.textContent = 'Liberaciones en Módulo';
                viewSubtitle.textContent = 'Gestión y control de trámites de liberación y estatus en módulo.';
                btnNewItem.style.display = 'inline-flex';
                await loadData();
            } else {
                // Otros módulos demostrativos
                liberacionesView.style.display = 'flex';
                const menuTitle = item.querySelector('span')?.textContent || 'Módulo';
                viewTitleH2.textContent = menuTitle;
                viewSubtitle.textContent = `Registros y trámites correspondientes a ${menuTitle}.`;
            }
        });
    });

    // 13. Papelera de Reciclaje Persistente (Recuperar incluso tras recargar)
    const btnOpenTrash = document.getElementById('btnOpenTrash');
    const trashSheetOverlay = document.getElementById('trashSheetOverlay');
    const btnCloseTrash = document.getElementById('btnCloseTrash');
    const trashTableBody = document.getElementById('trashTableBody');

    if (btnOpenTrash) {
        btnOpenTrash.addEventListener('click', async () => {
            await renderTrash();
            if (trashSheetOverlay) trashSheetOverlay.style.display = 'flex';
        });
    }

    if (btnCloseTrash) {
        btnCloseTrash.addEventListener('click', () => {
            if (trashSheetOverlay) trashSheetOverlay.style.display = 'none';
        });
    }

    if (trashSheetOverlay) {
        trashSheetOverlay.addEventListener('click', (e) => {
            if (e.target === trashSheetOverlay) {
                trashSheetOverlay.style.display = 'none';
            }
        });
    }

    async function renderTrash() {
        if (!trashTableBody) return;
        const items = await window.appDB.getPapelera();

        if (items.length === 0) {
            trashTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; padding:24px; color:#888; font-style:italic;">
                        La papelera está vacía. No hay registros eliminados.
                    </td>
                </tr>
            `;
            return;
        }

        trashTableBody.innerHTML = items.map(item => `
            <tr>
                <td><strong>${escapeHtml(item.folio)}</strong></td>
                <td><span class="mac-pill-type ${item.tipo === 'Liberación' ? 'liberacion' : 'tramite'}">${escapeHtml(item.tipo)}</span></td>
                <td style="color:#64748b; font-size:11px;">${escapeHtml(item.eliminadoEn || 'Recientemente')}</td>
                <td style="text-align: center;">
                    <button class="mac-btn mac-btn-primary" style="padding:2px 8px; font-size:11px;" onclick="restoreFromTrash(${item.id})">
                        <i class="fas fa-undo"></i> Restaurar
                    </button>
                </td>
            </tr>
        `).join('');
    }

    window.restoreFromTrash = async function(id) {
        await window.appDB.restaurarDePapelera(id);
        await renderTrash();
        await loadData();
    };

    // Escape helper
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Iniciar
    loadData();
});
