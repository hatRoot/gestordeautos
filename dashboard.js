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
    const remisionesView = document.getElementById('remisionesView');
    const badgeRemisionesCount = document.getElementById('badgeRemisionesCount');
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
        if (typeof lastDeletedRemision !== 'undefined' && lastDeletedRemision) {
            if (typeof window.restaurarUltimaRemision === 'function') {
                window.restaurarUltimaRemision();
                return;
            }
        }
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
            if ((lastDeletedItem || (typeof lastDeletedRemision !== 'undefined' && lastDeletedRemision)) && undoToast && undoToast.style.display !== 'none') {
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
                if (cotizadorView) cotizadorView.style.display = 'none';
                if (remisionesView) remisionesView.style.display = 'none';
                liberacionesView.style.display = 'block';
                if (filterPills) filterPills.style.display = 'flex';
                viewTitleH2.textContent = 'Liberaciones en Módulo';
                viewSubtitle.textContent = 'Gestión y control de trámites de liberación y estatus en módulo.';
                btnNewItem.style.display = 'inline-flex';
                await loadData();
            } else if (menu === 'cotizador') {
                liberacionesView.style.display = 'none';
                if (remisionesView) remisionesView.style.display = 'none';
                if (filterPills) filterPills.style.display = 'none';
                btnNewItem.style.display = 'none';
                if (cotizadorView) cotizadorView.style.display = 'flex';
                viewTitleH2.textContent = 'Cotizador Vehicular';
                viewSubtitle.textContent = 'Generador de presupuestos para clientes y empresas con desglose y datos bancarios.';
                actualizarVistaPreviaCarta(false);
            } else if (menu === 'remisiones') {
                liberacionesView.style.display = 'none';
                if (cotizadorView) cotizadorView.style.display = 'none';
                if (filterPills) filterPills.style.display = 'none';
                btnNewItem.style.display = 'none';
                if (remisionesView) remisionesView.style.display = 'flex';
                viewTitleH2.textContent = 'Notas de Remisión';
                viewSubtitle.textContent = 'Comprobantes de entrega, recepción de anticipos y liquidación de trámites.';
                if (typeof cargarCotizacionesRecientesSelect === 'function') {
                    cargarCotizacionesRecientesSelect();
                }
                if (typeof actualizarVistaPreviaRemision === 'function') {
                    actualizarVistaPreviaRemision(false);
                }
                if (typeof renderRemisionesTable === 'function') {
                    renderRemisionesTable();
                }
                if (typeof updateRemisionesStats === 'function') {
                    updateRemisionesStats();
                }
            } else {
                // Otros módulos demostrativos
                if (cotizadorView) cotizadorView.style.display = 'none';
                if (remisionesView) remisionesView.style.display = 'none';
                liberacionesView.style.display = 'block';
                const menuTitle = item.querySelector('span')?.textContent || 'Módulo';
                viewTitleH2.textContent = menuTitle;
                viewSubtitle.textContent = `Registros y trámites correspondientes a ${menuTitle}.`;
            }
        });
    });

    // =====================================================================
    // LÓGICA DEL COTIZADOR VEHICULAR
    // =====================================================================
    const cotizadorView = document.getElementById('cotizadorView');
    const conceptosBody = document.getElementById('conceptosBody');
    const btnAddConcepto = document.getElementById('btnAddConcepto');
    const btnToggleIva = document.getElementById('btnToggleIva');
    const btnToggleAnticipo = document.getElementById('btnToggleAnticipo');
    const cotSubtotalText = document.getElementById('cotSubtotalText');
    const cotIvaRow = document.getElementById('cotIvaRow');
    const cotIvaText = document.getElementById('cotIvaText');
    const cotTotalText = document.getElementById('cotTotalText');
    const cotAnticipoRow = document.getElementById('cotAnticipoRow');
    const cotAnticipoText = document.getElementById('cotAnticipoText');
    const cotSaldoRow = document.getElementById('cotSaldoRow');
    const cotSaldoText = document.getElementById('cotSaldoText');
    const btnLimpiarCotizador = document.getElementById('btnLimpiarCotizador');
    const btnCopiarWhatsApp = document.getElementById('btnCopiarWhatsApp');
    const cotFolioInput = document.getElementById('cotFolio');
    const btnGenFolio = document.getElementById('btnGenFolio');
    const cotFechaInput = document.getElementById('cotFecha');
    const cotTiempoEntregaInput = document.getElementById('cotTiempoEntrega');
    const cotModalidadInput = document.getElementById('cotModalidad');
    const btnGenerarPdf = document.getElementById('btnGenerarPdf');
    const btnImprimirCotizador = document.getElementById('btnImprimirCotizador'); // Fallback si existiera
    const btnZoomPreview = document.getElementById('btnZoomPreview');
    const miniLetterSheet = document.getElementById('miniLetterSheet');
    const zoomBtnText = document.getElementById('zoomBtnText');

    let isIvaActive = false;
    let isAnticipoActive = false;
    let currentSecurityHash = '';

    function formatMoney(amount) {
        return '$' + Number(amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function generarFolioAleatorio() {
        const anio = new Date().getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `COT-${anio}-${randomNum}`;
    }

    function generarTokenSeguridad() {
        const anio = new Date().getFullYear();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let rand = '';
        for (let i = 0; i < 5; i++) {
            rand += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const timeCode = Date.now().toString(36).toUpperCase().slice(-3);
        return `GA-${anio}-${rand}-${timeCode}`;
    }

    let qrDebounceTimer = null;

    function renderQr(containerId, text, size) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
            try {
                new QRCode(container, {
                    text: text,
                    width: size,
                    height: size,
                    colorDark: '#0f172a',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            } catch (e) {
                console.warn('Error al generar QRCode:', e);
            }
        }
    }

    function actualizarQr(forceNewHash = false) {
        if (forceNewHash || !currentSecurityHash) {
            currentSecurityHash = generarTokenSeguridad();
        }

        const folio = cotFolioInput?.value.trim() || 'COT-2026-0001';
        const cleanTotal = cotTotalText ? cotTotalText.textContent : '$0.00';
        const cliente = document.getElementById('cotCliente')?.value.trim() || 'Cliente Particular';
        const marca = document.getElementById('cotMarca')?.value.trim() || '';
        const modelo = document.getElementById('cotModelo')?.value.trim() || '';
        const anio = document.getElementById('cotAnio')?.value.trim() || '';
        const vehiculoStr = [marca, modelo, anio].filter(Boolean).join(' ') || 'Vehículo sin especificar';
        const vin = document.getElementById('cotSerie')?.value.trim() || '';

        // Actualizar badges de texto del hash
        const prevSecurityHash = document.getElementById('prevSecurityHash');
        if (prevSecurityHash) prevSecurityHash.textContent = currentSecurityHash;
        const pdfSecurityHashDisplay = document.getElementById('pdfSecurityHashDisplay');
        if (pdfSecurityHashDisplay) pdfSecurityHashDisplay.textContent = currentSecurityHash;
        const pdfQrTokenDisplay = document.getElementById('pdfQrTokenDisplay');
        if (pdfQrTokenDisplay) pdfQrTokenDisplay.textContent = currentSecurityHash;

        // Enlace de validación oficial por WhatsApp con todos los datos reales y actualizados
        let qrMsg = `Hola Gestor de Autos, solicito validar la cotización Folio: *${folio}*\n`;
        qrMsg += `*Cliente:* ${cliente}\n`;
        qrMsg += `*Vehículo:* ${vehiculoStr}`;
        if (vin) qrMsg += ` (VIN: ${vin})`;
        qrMsg += `\n*Total a Liquidar:* ${cleanTotal}\n`;
        if (isAnticipoActive) {
            qrMsg += `*Anticipo Inicial (50%):* ${cotAnticipoText ? cotAnticipoText.textContent : ''}\n`;
        }
        qrMsg += `*Vigencia:* 24 Horas\n`;
        qrMsg += `*Código de Validación:* ${currentSecurityHash}\n`;
        qrMsg += `🌐 www.GestorDeAutos.com.mx`;

        const qrUrl = `https://wa.me/525535757364?text=${encodeURIComponent(qrMsg)}`;

        // Renderizar en la vista previa del tercio derecho (1/3)
        renderQr('prevQrCode', qrUrl, 52);

        // Renderizar en el documento imprimible PDF
        renderQr('pdfQrCode', qrUrl, 68);
    }

    function actualizarVistaPreviaCarta(forceNewHash = false) {
        if (forceNewHash) {
            currentSecurityHash = generarTokenSeguridad();
        } else if (!currentSecurityHash) {
            currentSecurityHash = generarTokenSeguridad();
        }

        const folio = cotFolioInput?.value.trim() || 'COT-2026-0001';
        const fechaVal = cotFechaInput?.value || new Date().toISOString().split('T')[0];
        let fechaFormateada = fechaVal;
        if (fechaVal && fechaVal.includes('-')) {
            const parts = fechaVal.split('-');
            if (parts.length === 3) fechaFormateada = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        const cliente = document.getElementById('cotCliente')?.value.trim() || 'Cliente Particular';
        const gestor = document.getElementById('cotGestor')?.value.trim() || 'Ing. Joel Durán';
        const vin = document.getElementById('cotSerie')?.value.trim() || 'No registrado';
        const marca = document.getElementById('cotMarca')?.value.trim() || '';
        const modelo = document.getElementById('cotModelo')?.value.trim() || '';
        const anio = document.getElementById('cotAnio')?.value.trim() || '';
        const vehiculoStr = [marca, modelo, anio].filter(Boolean).join(' ') || 'Vehículo sin especificar';
        const tiempoEntrega = cotTiempoEntregaInput?.value.trim() || '24 a 48 Horas Hábiles';
        const modalidadEntrega = cotModalidadInput?.value.trim() || 'Entrega exprés a domicilio / oficina';

        // Elementos del mini sheet (1/3)
        const prevFolio = document.getElementById('prevFolio');
        const prevFecha = document.getElementById('prevFecha');
        const prevCliente = document.getElementById('prevCliente');
        const prevVehiculo = document.getElementById('prevVehiculo');
        const prevVin = document.getElementById('prevVin');
        const prevGestor = document.getElementById('prevGestor');
        const prevGestorHeader = document.getElementById('prevGestorHeader');
        const prevTiempoEntrega = document.getElementById('prevTiempoEntrega');
        const prevModalidad = document.getElementById('prevModalidad');
        const prevSecurityHash = document.getElementById('prevSecurityHash');

        if (prevFolio) prevFolio.textContent = folio;
        if (prevFecha) prevFecha.textContent = fechaFormateada;
        if (prevCliente) prevCliente.textContent = cliente;
        if (prevVehiculo) prevVehiculo.textContent = vehiculoStr;
        if (prevVin) prevVin.textContent = vin;
        if (prevGestor) prevGestor.textContent = gestor;
        if (prevGestorHeader) prevGestorHeader.textContent = gestor;
        if (prevTiempoEntrega) prevTiempoEntrega.textContent = tiempoEntrega;
        if (prevModalidad) prevModalidad.textContent = modalidadEntrega;
        if (prevSecurityHash) prevSecurityHash.textContent = currentSecurityHash;

        // Tabla de conceptos miniatura (homologada con columnas exactas del PDF)
        const prevTableBody = document.getElementById('prevTableBody');
        if (prevTableBody && conceptosBody) {
            prevTableBody.innerHTML = '';
            const filas = conceptosBody.querySelectorAll('tr');
            let count = 0;

            filas.forEach(row => {
                const desc = row.querySelector('.cot-desc-input')?.value.trim();
                const cant = parseFloat(row.querySelector('.cot-cant-input')?.value) || 1;
                const precio = parseFloat(row.querySelector('.cot-precio-input')?.value) || 0;
                const rowTotal = cant * precio;

                if (desc || precio > 0) {
                    count++;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="text-align: center; color: #64748b;">${count}</td>
                        <td><strong>${escapeHtml(desc || 'Trámite Vehicular')}</strong></td>
                        <td style="text-align: center;">${cant}</td>
                        <td style="text-align: right; color: #475569;">${formatMoney(precio)}</td>
                        <td style="text-align: right; font-weight: 700; color: #0f172a;">${formatMoney(rowTotal)}</td>
                    `;
                    prevTableBody.appendChild(tr);
                }
            });

            if (count === 0) {
                prevTableBody.innerHTML = `
                    <tr>
                        <td style="text-align: center; color: #64748b;">1</td>
                        <td><strong>Trámite y Gestoría Vehicular</strong></td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: right; color: #475569;">$0.00</td>
                        <td style="text-align: right; font-weight: 700;">$0.00</td>
                    </tr>
                `;
            }
        }

        // Totales miniatura
        const prevSubtotal = document.getElementById('prevSubtotal');
        const prevIvaRow = document.getElementById('prevIvaRow');
        const prevIva = document.getElementById('prevIva');
        const prevTotal = document.getElementById('prevTotal');
        const prevAnticipoRow = document.getElementById('prevAnticipoRow');
        const prevAnticipo = document.getElementById('prevAnticipo');
        const prevSaldoRow = document.getElementById('prevSaldoRow');
        const prevSaldo = document.getElementById('prevSaldo');

        const subtotalText = cotSubtotalText ? cotSubtotalText.textContent : '$0.00';
        const totalText = cotTotalText ? cotTotalText.textContent : '$0.00';

        if (prevSubtotal) prevSubtotal.textContent = subtotalText;
        if (prevIvaRow && prevIva) {
            if (isIvaActive) {
                prevIvaRow.style.display = 'flex';
                prevIva.textContent = cotIvaText ? cotIvaText.textContent : '$0.00';
            } else {
                prevIvaRow.style.display = 'none';
            }
        }
        if (prevTotal) prevTotal.textContent = totalText;

        if (prevAnticipoRow && prevAnticipo) {
            if (isAnticipoActive) {
                prevAnticipoRow.style.display = 'flex';
                prevAnticipo.textContent = cotAnticipoText ? cotAnticipoText.textContent : '$0.00';
            } else {
                prevAnticipoRow.style.display = 'none';
            }
        }

        if (prevSaldoRow && prevSaldo) {
            if (isAnticipoActive) {
                prevSaldoRow.style.display = 'flex';
                prevSaldo.textContent = cotSaldoText ? cotSaldoText.textContent : '$0.00';
            } else {
                prevSaldoRow.style.display = 'none';
            }
        }

        // Debounce para redibujar el código QR con los datos actualizados sin ralentizar la escritura
        clearTimeout(qrDebounceTimer);
        qrDebounceTimer = setTimeout(() => {
            actualizarQr(false);
        }, 50);
    }

    // Inicializar Folio y Fecha del día
    if (cotFolioInput && !cotFolioInput.value) {
        cotFolioInput.value = generarFolioAleatorio();
    }
    if (btnGenFolio) {
        btnGenFolio.addEventListener('click', () => {
            if (cotFolioInput) {
                cotFolioInput.value = generarFolioAleatorio();
                btnGenFolio.style.transform = 'rotate(180deg)';
                btnGenFolio.style.transition = 'transform 0.3s ease';
                setTimeout(() => {
                    btnGenFolio.style.transform = '';
                }, 300);
                actualizarVistaPreviaCarta(true);
            }
        });
    }
    if (cotFechaInput && !cotFechaInput.value) {
        cotFechaInput.value = new Date().toISOString().split('T')[0];
    }

    // Escuchar cambios en campos de texto para actualizar la vista previa en vivo
    ['cotCliente', 'cotSerie', 'cotMarca', 'cotModelo', 'cotAnio', 'cotGestor', 'cotFecha', 'cotTiempoEntrega', 'cotModalidad'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                actualizarVistaPreviaCarta(false);
            });
        }
    });

    if (cotFolioInput) {
        cotFolioInput.addEventListener('input', () => {
            actualizarVistaPreviaCarta(true);
        });
    }

    // Control de Zoom / Expansión de la Vista Previa
    if (btnZoomPreview && miniLetterSheet) {
        btnZoomPreview.addEventListener('click', () => {
            const isZoomed = miniLetterSheet.classList.toggle('zoomed');
            if (zoomBtnText) {
                zoomBtnText.textContent = isZoomed ? 'Restaurar' : 'Agrandar';
            }
            const icon = btnZoomPreview.querySelector('i');
            if (icon) {
                icon.className = isZoomed ? 'fas fa-compress-alt' : 'fas fa-expand-alt';
            }
        });
    }

    function recalcularTotales() {
        let subtotal = 0;
        const rows = conceptosBody ? conceptosBody.querySelectorAll('tr') : [];

        rows.forEach(row => {
            const cantInput = row.querySelector('.cot-cant-input');
            const precioInput = row.querySelector('.cot-precio-input');
            const subtotalEl = row.querySelector('.cot-row-subtotal');

            const cant = parseFloat(cantInput?.value) || 0;
            const precio = parseFloat(precioInput?.value) || 0;
            const rowSubtotal = cant * precio;

            if (subtotalEl) {
                subtotalEl.textContent = formatMoney(rowSubtotal);
            }
            subtotal += rowSubtotal;
        });

        if (cotSubtotalText) cotSubtotalText.textContent = formatMoney(subtotal);

        const iva = isIvaActive ? (subtotal * 0.16) : 0;
        if (cotIvaText) cotIvaText.textContent = formatMoney(iva);
        if (cotIvaRow) cotIvaRow.style.display = isIvaActive ? 'flex' : 'none';

        const total = subtotal + iva;
        if (cotTotalText) cotTotalText.textContent = formatMoney(total);

        const anticipo = isAnticipoActive ? Math.round(total * 0.5) : 0;
        const saldo = isAnticipoActive ? (total - anticipo) : 0;

        if (cotAnticipoText) cotAnticipoText.textContent = formatMoney(anticipo);
        if (cotSaldoText) cotSaldoText.textContent = formatMoney(saldo);
        if (cotAnticipoRow) cotAnticipoRow.style.display = isAnticipoActive ? 'flex' : 'none';
        if (cotSaldoRow) cotSaldoRow.style.display = isAnticipoActive ? 'flex' : 'none';

        // Sincronizar en tiempo real con la hoja carta (1/3)
        actualizarVistaPreviaCarta(false);
    }

    function agregarFilaConcepto(desc = '', cant = 1, precio = '') {
        if (!conceptosBody) return;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="text" class="cot-row-input cot-desc-input" placeholder="Ej. Alta de Placas EdoMex / Gestoría" value="${escapeHtml(desc)}">
            </td>
            <td style="text-align: center;">
                <input type="number" class="cot-row-input cot-cant-input" value="${cant}" min="1" style="text-align: center; width: 60px;">
            </td>
            <td style="text-align: right;">
                <input type="number" class="cot-row-input cot-precio-input" placeholder="0.00" value="${precio}" min="0" step="50" style="text-align: right; width: 100px;">
            </td>
            <td style="text-align: right; font-weight: 700; color: #1e293b;" class="cot-row-subtotal">
                $0.00
            </td>
            <td style="text-align: center;">
                <button type="button" class="cot-delete-btn" title="Eliminar concepto">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;

        const descInput = tr.querySelector('.cot-desc-input');
        const cantInput = tr.querySelector('.cot-cant-input');
        const precioInput = tr.querySelector('.cot-precio-input');
        const btnDelete = tr.querySelector('.cot-delete-btn');

        if (descInput) {
            descInput.addEventListener('input', () => {
                actualizarVistaPreviaCarta(false);
            });
        }
        cantInput.addEventListener('input', recalcularTotales);
        precioInput.addEventListener('input', recalcularTotales);

        btnDelete.addEventListener('click', () => {
            if (conceptosBody.children.length > 1) {
                tr.remove();
                recalcularTotales();
            } else {
                tr.querySelector('.cot-desc-input').value = '';
                cantInput.value = 1;
                precioInput.value = '';
                recalcularTotales();
            }
        });

        conceptosBody.appendChild(tr);
        recalcularTotales();
    }

    // Inicializar Cotizador con ejemplos prácticos
    if (conceptosBody) {
        agregarFilaConcepto('Alta de Placas Particulares Estado de México', 1, 2800);
        agregarFilaConcepto('Gestoría vehicular y entrega exprés a domicilio', 1, 600);
    }

    if (btnAddConcepto) {
        btnAddConcepto.addEventListener('click', () => {
            agregarFilaConcepto('', 1, '');
        });
    }

    if (btnToggleIva) {
        btnToggleIva.addEventListener('click', () => {
            isIvaActive = !isIvaActive;
            btnToggleIva.classList.toggle('active', isIvaActive);
            const textEl = document.getElementById('ivaToggleText');
            if (textEl) {
                textEl.textContent = isIvaActive ? 'IVA (16%) Incluido' : 'Agregar IVA (16%)';
            }
            recalcularTotales();
        });
    }

    if (btnToggleAnticipo) {
        btnToggleAnticipo.addEventListener('click', () => {
            isAnticipoActive = !isAnticipoActive;
            btnToggleAnticipo.classList.toggle('active', isAnticipoActive);
            const textEl = document.getElementById('anticipoToggleText');
            if (textEl) {
                textEl.textContent = isAnticipoActive ? 'Anticipo (50%) Incluido' : 'Desglosar Anticipo (50%)';
            }
            recalcularTotales();
        });
    }

    if (btnLimpiarCotizador) {
        btnLimpiarCotizador.addEventListener('click', () => {
            if (confirm('¿Deseas limpiar todos los campos del cotizador?')) {
                const clienteInput = document.getElementById('cotCliente');
                const serieInput = document.getElementById('cotSerie');
                const marcaInput = document.getElementById('cotMarca');
                const modeloInput = document.getElementById('cotModelo');
                const anioInput = document.getElementById('cotAnio');

                if (cotFolioInput) cotFolioInput.value = generarFolioAleatorio();
                if (cotFechaInput) cotFechaInput.value = new Date().toISOString().split('T')[0];
                if (clienteInput) clienteInput.value = '';
                if (serieInput) serieInput.value = '';
                if (marcaInput) marcaInput.value = '';
                if (modeloInput) modeloInput.value = '';
                if (anioInput) anioInput.value = '';
                if (cotTiempoEntregaInput) cotTiempoEntregaInput.value = '24 a 48 Horas Hábiles';
                if (cotModalidadInput) cotModalidadInput.value = 'Entrega exprés a domicilio / oficina';

                if (conceptosBody) {
                    conceptosBody.innerHTML = '';
                    agregarFilaConcepto('', 1, '');
                }

                if (isIvaActive && btnToggleIva) {
                    btnToggleIva.click();
                }
                if (isAnticipoActive && btnToggleAnticipo) {
                    btnToggleAnticipo.click();
                }
                recalcularTotales();
                actualizarVistaPreviaCarta(true);
            }
        });
    }

    // Preparar el documento imprimible para PDF
    function prepararDocumentoPdf() {
        const folio = cotFolioInput?.value.trim() || generarFolioAleatorio();
        if (cotFolioInput && !cotFolioInput.value) cotFolioInput.value = folio;

        const fechaVal = cotFechaInput?.value || new Date().toISOString().split('T')[0];
        let fechaFormateada = fechaVal;
        if (fechaVal && fechaVal.includes('-')) {
            const parts = fechaVal.split('-');
            if (parts.length === 3) {
                fechaFormateada = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }

        const cliente = document.getElementById('cotCliente')?.value.trim() || 'Cliente Particular';
        const gestor = document.getElementById('cotGestor')?.value.trim() || 'Ing. Joel Durán';
        const vin = document.getElementById('cotSerie')?.value.trim() || 'No registrado';
        const marca = document.getElementById('cotMarca')?.value.trim() || '';
        const modelo = document.getElementById('cotModelo')?.value.trim() || '';
        const anio = document.getElementById('cotAnio')?.value.trim() || '';
        const tiempoEntrega = cotTiempoEntregaInput?.value.trim() || '24 a 48 Horas Hábiles';
        const modalidadEntrega = cotModalidadInput?.value.trim() || 'Entrega Directa a Domicilio / Oficina';

        const vehiculoStr = [marca, modelo].filter(Boolean).join(' ') || 'Vehículo sin especificar';

        // Inyectar datos en la plantilla de impresión
        const pdfFolioDisplay = document.getElementById('pdfFolioDisplay');
        const pdfFechaDisplay = document.getElementById('pdfFechaDisplay');
        const pdfGestorDisplay = document.getElementById('pdfGestorDisplay');
        const pdfClienteDisplay = document.getElementById('pdfClienteDisplay');
        const pdfVehiculoDisplay = document.getElementById('pdfVehiculoDisplay');
        const pdfVinDisplay = document.getElementById('pdfVinDisplay');
        const pdfAnioDisplay = document.getElementById('pdfAnioDisplay');
        const pdfModalidadDisplay = document.getElementById('pdfModalidadDisplay');
        const pdfTiempoDisplay = document.getElementById('pdfTiempoDisplay');
        const pdfSecurityHashDisplay = document.getElementById('pdfSecurityHashDisplay');
        const pdfQrTokenDisplay = document.getElementById('pdfQrTokenDisplay');

        if (pdfFolioDisplay) pdfFolioDisplay.textContent = folio;
        if (pdfFechaDisplay) pdfFechaDisplay.textContent = fechaFormateada;
        if (pdfGestorDisplay) pdfGestorDisplay.textContent = gestor;
        if (pdfClienteDisplay) pdfClienteDisplay.textContent = cliente;
        if (pdfVehiculoDisplay) pdfVehiculoDisplay.textContent = vehiculoStr;
        if (pdfVinDisplay) pdfVinDisplay.textContent = vin;
        if (pdfAnioDisplay) pdfAnioDisplay.textContent = anio || 'No especificado';
        if (pdfModalidadDisplay) pdfModalidadDisplay.textContent = modalidadEntrega;
        if (pdfTiempoDisplay) pdfTiempoDisplay.textContent = tiempoEntrega;
        if (pdfSecurityHashDisplay) pdfSecurityHashDisplay.textContent = currentSecurityHash;
        if (pdfQrTokenDisplay) pdfQrTokenDisplay.textContent = currentSecurityHash;

        const pdfSignName = document.getElementById('pdfSignName');
        if (pdfSignName) pdfSignName.textContent = gestor;

        // Inyectar tabla de conceptos clonada (5 columnas completas)
        const pdfTableBody = document.getElementById('pdfTableBody');
        if (pdfTableBody && conceptosBody) {
            pdfTableBody.innerHTML = '';
            const filas = conceptosBody.querySelectorAll('tr');
            let count = 0;

            filas.forEach(row => {
                const desc = row.querySelector('.cot-desc-input')?.value.trim();
                const cant = parseFloat(row.querySelector('.cot-cant-input')?.value) || 1;
                const precio = parseFloat(row.querySelector('.cot-precio-input')?.value) || 0;
                const rowTotal = cant * precio;

                if (desc || precio > 0) {
                    count++;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="text-align: center; color: #64748b; font-weight: 600;">${count}</td>
                        <td><strong>${escapeHtml(desc || 'Trámite Vehicular')}</strong></td>
                        <td style="text-align: center;">${cant}</td>
                        <td style="text-align: right;">${formatMoney(precio)}</td>
                        <td style="text-align: right; font-weight: 700; color: #0f172a;">${formatMoney(rowTotal)}</td>
                    `;
                    pdfTableBody.appendChild(tr);
                }
            });

            if (count === 0) {
                pdfTableBody.innerHTML = `
                    <tr>
                        <td style="text-align: center; color: #64748b;">1</td>
                        <td><strong>Trámite y Gestoría Vehicular Especializada</strong></td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: right;">$0.00</td>
                        <td style="text-align: right; font-weight: 700;">$0.00</td>
                    </tr>
                `;
            }
        }

        // Inyectar totales
        const pdfSubtotalDisplay = document.getElementById('pdfSubtotalDisplay');
        const pdfIvaRowDisplay = document.getElementById('pdfIvaRowDisplay');
        const pdfIvaDisplay = document.getElementById('pdfIvaDisplay');
        const pdfTotalDisplay = document.getElementById('pdfTotalDisplay');
        const pdfAnticipoRowDisplay = document.getElementById('pdfAnticipoRowDisplay');
        const pdfAnticipoDisplay = document.getElementById('pdfAnticipoDisplay');
        const pdfSaldoRowDisplay = document.getElementById('pdfSaldoRowDisplay');
        const pdfSaldoDisplay = document.getElementById('pdfSaldoDisplay');

        if (pdfSubtotalDisplay && cotSubtotalText) {
            pdfSubtotalDisplay.textContent = cotSubtotalText.textContent;
        }
        if (pdfIvaRowDisplay && pdfIvaDisplay) {
            if (isIvaActive) {
                pdfIvaRowDisplay.style.display = 'flex';
                pdfIvaDisplay.textContent = cotIvaText ? cotIvaText.textContent : '$0.00';
            } else {
                pdfIvaRowDisplay.style.display = 'none';
            }
        }
        if (pdfTotalDisplay && cotTotalText) {
            pdfTotalDisplay.textContent = cotTotalText.textContent;
        }

        if (pdfAnticipoRowDisplay && pdfAnticipoDisplay) {
            if (isAnticipoActive) {
                pdfAnticipoRowDisplay.style.display = 'flex';
                pdfAnticipoDisplay.textContent = cotAnticipoText ? cotAnticipoText.textContent : '$0.00';
            } else {
                pdfAnticipoRowDisplay.style.display = 'none';
            }
        }

        if (pdfSaldoRowDisplay && pdfSaldoDisplay) {
            if (isAnticipoActive) {
                pdfSaldoRowDisplay.style.display = 'flex';
                pdfSaldoDisplay.textContent = cotSaldoText ? cotSaldoText.textContent : '$0.00';
            } else {
                pdfSaldoRowDisplay.style.display = 'none';
            }
        }

        // Asegurar que el QR impreso esté sincronizado con los datos actuales sin cambiar de token
        actualizarQr(false);

        return { folio, cliente };
    }

    // Botón Guardar Cotización y Exportar a Archivo (.json)
    const btnGuardarCotizacion = document.getElementById('btnGuardarCotizacion');
    if (btnGuardarCotizacion) {
        btnGuardarCotizacion.addEventListener('click', () => {
            guardarYExportarCotizacion();
        });
    }

    function compilarObjetoCotizacion() {
        const folio = cotFolioInput?.value.trim() || 'COT-2026-0001';
        const fechaVal = cotFechaInput?.value || new Date().toISOString().split('T')[0];
        const cliente = document.getElementById('cotCliente')?.value.trim() || 'Cliente Particular';
        const gestor = document.getElementById('cotGestor')?.value.trim() || 'Ing. Joel Durán';
        const vin = document.getElementById('cotSerie')?.value.trim() || '';
        const marca = document.getElementById('cotMarca')?.value.trim() || '';
        const modelo = document.getElementById('cotModelo')?.value.trim() || '';
        const anio = document.getElementById('cotAnio')?.value.trim() || '';
        const tiempoEntrega = cotTiempoEntregaInput?.value.trim() || '24 a 48 Horas Hábiles';
        const modalidadEntrega = cotModalidadInput?.value.trim() || 'Entrega exprés a domicilio / oficina';

        const filas = conceptosBody ? conceptosBody.querySelectorAll('tr') : [];
        const conceptos = [];
        filas.forEach(row => {
            const desc = row.querySelector('.cot-desc-input')?.value.trim() || '';
            const cant = Number(row.querySelector('.cot-cant-input')?.value || 1);
            const precio = Number(row.querySelector('.cot-precio-input')?.value || 0);
            if (desc) {
                conceptos.push({
                    descripcion: desc,
                    cantidad: cant,
                    precio: precio,
                    importe: cant * precio
                });
            }
        });

        const subtotalNum = conceptos.reduce((sum, c) => sum + c.importe, 0);
        const ivaNum = isIvaActive ? Math.round(subtotalNum * 0.16) : 0;
        const totalNum = subtotalNum + ivaNum;
        const anticipoNum = isAnticipoActive ? Math.round(totalNum * 0.5) : 0;
        const saldoNum = totalNum - anticipoNum;

        return {
            tipo: 'cotizacion_gestor_autos',
            version: '1.0',
            folio: folio,
            fecha: fechaVal,
            cliente: cliente,
            gestor: gestor,
            tiempoEntrega: tiempoEntrega,
            modalidad: modalidadEntrega,
            vehiculo: {
                serie: vin,
                marca: marca,
                modelo: modelo,
                anio: anio
            },
            conceptos: conceptos,
            subtotal: subtotalNum,
            iva: ivaNum,
            total: totalNum,
            anticipo: anticipoNum,
            saldo: saldoNum,
            token: currentSecurityHash || 'GA-2026-AUTH',
            guardadoEn: new Date().toISOString()
        };
    }

    function guardarYExportarCotizacion() {
        const cotData = compilarObjetoCotizacion();
        
        // 1. Guardar en lista de cotizaciones en localStorage
        let cotizaciones = [];
        try {
            cotizaciones = JSON.parse(localStorage.getItem('ga_cotizaciones_guardadas') || '[]');
        } catch (e) {
            cotizaciones = [];
        }
        
        const existIdx = cotizaciones.findIndex(c => c.folio === cotData.folio);
        if (existIdx !== -1) {
            cotizaciones[existIdx] = cotData;
        } else {
            cotizaciones.unshift(cotData);
        }
        localStorage.setItem('ga_cotizaciones_guardadas', JSON.stringify(cotizaciones));
        
        // Actualizar selector en remisiones
        if (typeof cargarCotizacionesRecientesSelect === 'function') {
            cargarCotizacionesRecientesSelect();
        }

        // 2. Descargar archivo .json a la carpeta del usuario
        const cleanClient = cotData.cliente.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_').substring(0, 30);
        const fileName = `Cotizacion_${cotData.folio}_${cleanClient}.json`;
        const blob = new Blob([JSON.stringify(cotData, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`✅ Cotización "${cotData.folio}" guardada con éxito.\nSe descargó el archivo "${fileName}".\nPuedes guardarlo en cualquier carpeta de tu equipo y seleccionarlo directamente desde la herramienta de Notas de Remisión.`);
    }

    // Botón Generar PDF Cotizador
    if (btnGenerarPdf) {
        btnGenerarPdf.addEventListener('click', () => {
            const { folio, cliente } = prepararDocumentoPdf();
            const origTitle = document.title;
            const cleanClient = cliente.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_').substring(0, 30);
            document.title = `Cotizacion_${folio}_${cleanClient}`;
            
            document.body.classList.remove('printing-remision');
            document.body.classList.add('printing-cotizacion');

            // Garantizar que el navegador procese los cambios del DOM antes de abrir el modal de impresión
            setTimeout(() => {
                window.print();
                setTimeout(() => {
                    document.title = origTitle;
                    document.body.classList.remove('printing-cotizacion');
                }, 1000);
            }, 60);
        });
    }

    // Compatibilidad si aún se llama a imprimir directamente
    if (btnImprimirCotizador) {
        btnImprimirCotizador.addEventListener('click', () => {
            prepararDocumentoPdf();
            document.body.classList.remove('printing-remision');
            document.body.classList.add('printing-cotizacion');
            window.print();
            setTimeout(() => {
                document.body.classList.remove('printing-cotizacion');
            }, 1000);
        });
    }

    if (btnCopiarWhatsApp) {
        btnCopiarWhatsApp.addEventListener('click', () => {
            const folio = cotFolioInput?.value.trim() || 'COT-2026-0001';
            const fechaVal = cotFechaInput?.value || new Date().toISOString().split('T')[0];
            const cliente = document.getElementById('cotCliente')?.value.trim() || 'Cliente';
            const gestor = document.getElementById('cotGestor')?.value.trim() || 'Ing. Joel Durán';
            const vin = document.getElementById('cotSerie')?.value.trim() || 'N/A';
            const marca = document.getElementById('cotMarca')?.value.trim() || '';
            const modelo = document.getElementById('cotModelo')?.value.trim() || '';
            const anio = document.getElementById('cotAnio')?.value.trim() || '';
            const tiempoEntrega = cotTiempoEntregaInput?.value.trim() || '24 a 48 Horas Hábiles';
            const modalidadEntrega = cotModalidadInput?.value.trim() || 'Entrega exprés a domicilio / oficina';

            const vehiculoStr = [marca, modelo, anio].filter(Boolean).join(' ') || 'Vehículo sin especificar';

            const filas = conceptosBody ? conceptosBody.querySelectorAll('tr') : [];
            let conceptosTexto = '';

            filas.forEach(row => {
                const desc = row.querySelector('.cot-desc-input')?.value.trim();
                const cant = row.querySelector('.cot-cant-input')?.value || 1;
                const precio = row.querySelector('.cot-precio-input')?.value || 0;
                const rowTotal = cant * precio;
                if (desc) {
                    conceptosTexto += `• *${desc}* (x${cant}): ${formatMoney(rowTotal)}\n`;
                }
            });

            const subtotal = cotSubtotalText ? cotSubtotalText.textContent : '$0.00';
            const total = cotTotalText ? cotTotalText.textContent : '$0.00';

            let msj = `📋 *COTIZACIÓN DE TRÁMITES VEHICULARES*\n`;
            msj += `*Folio:* ${folio}\n`;
            msj += `*Fecha:* ${fechaVal}\n`;
            msj += `*Vigencia:* 24 Horas\n`;
            if (currentSecurityHash) {
                msj += `*Código de Validación:* ${currentSecurityHash}\n`;
            }
            msj += `*Gestor:* ${gestor}\n`;
            msj += `*Cliente:* ${cliente}\n`;
            msj += `*Vehículo:* ${vehiculoStr}\n`;
            msj += `*Serie/VIN:* ${vin}\n`;
            msj += `*Modalidad:* ${modalidadEntrega}\n`;
            msj += `*Tiempo Estimado:* ${tiempoEntrega}\n`;
            msj += `─────────────────────────\n`;
            msj += `*CONCEPTOS:*\n${conceptosTexto || '• Trámite vehicular\n'}`;
            msj += `─────────────────────────\n`;
            msj += `*Subtotal:* ${subtotal}\n`;
            if (isIvaActive) {
                const iva = cotIvaText ? cotIvaText.textContent : '$0.00';
                msj += `*IVA (16%):* ${iva}\n`;
            }
            msj += `*TOTAL A LIQUIDAR:* ${total}\n`;
            if (isAnticipoActive) {
                msj += `*Anticipo Inicial (50%):* ${cotAnticipoText ? cotAnticipoText.textContent : ''}\n`;
                msj += `*Saldo contra Entrega:* ${cotSaldoText ? cotSaldoText.textContent : ''}\n`;
            }
            msj += `─────────────────────────\n`;
            msj += `*ESTATUS LEGAL:* 100% oficial y verificable en portal del gobierno (SEMOVI / Finanzas).\n`;
            msj += `─────────────────────────\n`;
            msj += `🏦 *DATOS BANCARIOS PARA PAGO (BBVA):*\n`;
            msj += `• *Titular:* Joel Emmanuel Duran Mendoza\n`;
            msj += `• *Banco:* BBVA México\n`;
            msj += `• *CLABE (SPEI):* 012180015766935846\n`;
            msj += `• *Cuenta BBVA:* 1576693584\n`;
            msj += `• *Tarjeta Débito (OXXO/7-Eleven):* 4152314669183751\n`;
            msj += `• *Celular Vinculado (Dimo/SPEI):* 55 3575 7364\n`;
            msj += `─────────────────────────\n`;
            msj += `*Favor de enviar tu comprobante de pago por este chat para procesar tu trámite de inmediato.*\n`;
            msj += `─────────────────────────\n`;
            msj += `🌐 *Sitio Web:* www.GestorDeAutos.com.mx\n`;
            msj += `📄 *Términos y Condiciones:* https://gestordeautos.com.mx/aviso-privacidad.html`;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(msj).then(() => {
                    alert('✅ Cotización con folio y datos bancarios copiada al portapapeles. ¡Lista para enviar por WhatsApp!');
                }).catch(() => {
                    prompt('Copia tu cotización para WhatsApp:', msj);
                });
            } else {
                prompt('Copia tu cotización para WhatsApp:', msj);
            }
        });
    }

    // Copiado rápido de datos bancarios individuales
    window.copiarDatoBancario = function(texto, btn) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(texto).then(() => {
                const span = btn ? btn.querySelector('span') : null;
                const orig = span ? span.textContent : '';
                if (span) span.textContent = '¡Copiado!';
                if (btn) {
                    btn.style.background = '#10b981';
                    btn.style.borderColor = '#059669';
                    btn.style.color = '#ffffff';
                }
                setTimeout(() => {
                    if (span) span.textContent = orig;
                    if (btn) {
                        btn.style.background = '';
                        btn.style.borderColor = '';
                        btn.style.color = '';
                    }
                }, 1800);
            });
        } else {
            prompt('Copiar dato bancario:', texto);
        }
    };

    // Activar pestaña por parámetro de URL (?tab=cotizador)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'cotizador') {
        const cotItem = document.querySelector('.mac-sidebar-item[data-menu="cotizador"]');
        if (cotItem) {
            cotItem.click();
        }
    }

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

    // =====================================================================
    // MÓDULO DE NOTAS DE REMISIÓN PROFESIONAL
    // =====================================================================
    let remisiones = [];
    try {
        remisiones = JSON.parse(localStorage.getItem('ga_remisiones') || '[]');
    } catch (e) {
        remisiones = [];
    }

    let currentEditingRemId = null;
    let currentRemSecurityHash = '';
    let lastDeletedRemision = null;

    // Elementos DOM de Remisiones
    const btnTabRemEditor = document.getElementById('btnTabRemEditor');
    const btnTabRemHistorial = document.getElementById('btnTabRemHistorial');
    const remHistorialCountBadge = document.getElementById('remHistorialCountBadge');
    const btnRemNewNoteTop = document.getElementById('btnRemNewNoteTop');
    const btnRemNuevaDesdeHistorial = document.getElementById('btnRemNuevaDesdeHistorial');
    const remEditorSection = document.getElementById('remEditorSection');
    const remHistorialSection = document.getElementById('remHistorialSection');

    // Importación desde archivo o cotización
    const remFileInputCotizacion = document.getElementById('remFileInputCotizacion');
    const btnRemCargarArchivo = document.getElementById('btnRemCargarArchivo');
    const remSelectCotRecientes = document.getElementById('remSelectCotRecientes');
    const btnRemPegarWhatsApp = document.getElementById('btnRemPegarWhatsApp');

    // Inputs Formulario Remisión
    const remFolioInput = document.getElementById('remFolio');
    const btnGenFolioRem = document.getElementById('btnGenFolioRem');
    const remCotOrigenInput = document.getElementById('remCotizacionOrigen');
    const remFechaInput = document.getElementById('remFecha');
    const remEstatusSelect = document.getElementById('remEstatus');
    const remClienteInput = document.getElementById('remCliente');
    const remTelefonoInput = document.getElementById('remTelefono');
    const remGestorInput = document.getElementById('remGestor');
    const remDireccionEntregaInput = document.getElementById('remDireccionEntrega');
    const remSerieInput = document.getElementById('remSerie');
    const remPlacasInput = document.getElementById('remPlacas');
    const remMarcaInput = document.getElementById('remMarca');
    const remModeloInput = document.getElementById('remModelo');
    const remAnioInput = document.getElementById('remAnio');
    const remColorInput = document.getElementById('remColor');
    const remConceptosBody = document.getElementById('remConceptosBody');
    const btnRemAddConcepto = document.getElementById('btnRemAddConcepto');
    const remAnticipoInput = document.getElementById('remAnticipoInput');
    const btnRemAnticipo50 = document.getElementById('btnRemAnticipo50');
    const btnRemAnticipo100 = document.getElementById('btnRemAnticipo100');
    const btnRemAnticipoCero = document.getElementById('btnRemAnticipoCero');
    const remMetodoPagoSelect = document.getElementById('remMetodoPago');
    const remReferenciaPagoInput = document.getElementById('remReferenciaPago');
    const remNotasInput = document.getElementById('remNotas');

    // Textos de Totales
    const remSubtotalText = document.getElementById('remSubtotalText');
    const remTotalText = document.getElementById('remTotalText');
    const remAnticipoText = document.getElementById('remAnticipoText');
    const remSaldoText = document.getElementById('remSaldoText');

    // Botones de acción
    const btnRemLimpiar = document.getElementById('btnRemLimpiar');
    const btnRemCopiarWhatsApp = document.getElementById('btnRemCopiarWhatsApp');
    const btnRemEliminarActual = document.getElementById('btnRemEliminarActual');
    const btnRemGuardar = document.getElementById('btnRemGuardar');
    const btnRemGenerarPdf = document.getElementById('btnRemGenerarPdf');
    const btnZoomRemPreview = document.getElementById('btnZoomRemPreview');
    const miniRemLetterSheet = document.getElementById('miniRemLetterSheet');
    const remZoomBtnText = document.getElementById('remZoomBtnText');

    // Elementos de Historial
    const statRemTotal = document.getElementById('statRemTotal');
    const statRemPendientes = document.getElementById('statRemPendientes');
    const statRemLiquidadas = document.getElementById('statRemLiquidadas');
    const statRemMontoTotal = document.getElementById('statRemMontoTotal');
    const remSearchInput = document.getElementById('remSearchInput');
    const remFilterStatus = document.getElementById('remFilterStatus');
    const btnRemEliminarSeleccionadas = document.getElementById('btnRemEliminarSeleccionadas');
    const btnRemVaciarTodo = document.getElementById('btnRemVaciarTodo');
    const chkSelectAllRem = document.getElementById('chkSelectAllRem');
    const remCountSelected = document.getElementById('remCountSelected');
    const remisionesTableBody = document.getElementById('remisionesTableBody');

    // Generar folios y tokens
    function generarFolioRemision() {
        const anio = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `REM-${anio}-${rand}`;
    }

    function generarTokenSeguridadRem() {
        const anio = new Date().getFullYear();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let rand = '';
        for (let i = 0; i < 5; i++) {
            rand += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const timeCode = Date.now().toString(36).toUpperCase().slice(-3);
        return `GA-REM-${anio}-${rand}-${timeCode}`;
    }

    // Actualizar Badges y Estadísticas
    function updateRemisionesBadge() {
        const count = remisiones.length;
        if (badgeRemisionesCount) badgeRemisionesCount.textContent = count;
        if (remHistorialCountBadge) remHistorialCountBadge.textContent = count;
    }

    function updateRemisionesStats() {
        updateRemisionesBadge();
        if (!statRemTotal) return;

        const total = remisiones.length;
        const pendientes = remisiones.filter(r => (Number(r.saldo || 0) > 0) || r.estatus === 'En proceso' || r.estatus === 'Anticipo pagado').length;
        const liquidadas = remisiones.filter(r => r.estatus === 'Liquidada' || r.estatus === 'Entregada').length;
        const sumaTotal = remisiones.reduce((acc, r) => acc + (Number(r.total) || 0), 0);

        statRemTotal.textContent = total;
        statRemPendientes.textContent = pendientes;
        statRemLiquidadas.textContent = liquidadas;
        statRemMontoTotal.textContent = formatMoney(sumaTotal);
    }

    // Inicializar Fechas y Folio por Defecto
    if (remFechaInput) {
        remFechaInput.value = new Date().toISOString().split('T')[0];
    }
    if (remFolioInput && !remFolioInput.value) {
        remFolioInput.value = generarFolioRemision();
    }
    if (btnGenFolioRem) {
        btnGenFolioRem.addEventListener('click', () => {
            remFolioInput.value = generarFolioRemision();
            actualizarVistaPreviaRemision(true);
        });
    }

    // Alternar Pestañas Sub-Navbar (Editor vs Historial)
    function switchRemTab(tab) {
        if (tab === 'editor') {
            if (btnTabRemEditor) btnTabRemEditor.classList.add('active');
            if (btnTabRemHistorial) btnTabRemHistorial.classList.remove('active');
            if (remEditorSection) remEditorSection.style.display = 'flex';
            if (remHistorialSection) remHistorialSection.style.display = 'none';
            actualizarVistaPreviaRemision(false);
        } else {
            if (btnTabRemEditor) btnTabRemEditor.classList.remove('active');
            if (btnTabRemHistorial) btnTabRemHistorial.classList.add('active');
            if (remEditorSection) remEditorSection.style.display = 'none';
            if (remHistorialSection) remHistorialSection.style.display = 'block';
            renderRemisionesTable();
            updateRemisionesStats();
        }
    }

    if (btnTabRemEditor) btnTabRemEditor.addEventListener('click', () => switchRemTab('editor'));
    if (btnTabRemHistorial) btnTabRemHistorial.addEventListener('click', () => switchRemTab('historial'));
    if (btnRemNewNoteTop) btnRemNewNoteTop.addEventListener('click', () => {
        limpiarFormularioRemision();
        switchRemTab('editor');
    });
    if (btnRemNuevaDesdeHistorial) btnRemNuevaDesdeHistorial.addEventListener('click', () => {
        limpiarFormularioRemision();
        switchRemTab('editor');
    });

    // Cargar Lista Desplegable de Cotizaciones Recientes
    window.cargarCotizacionesRecientesSelect = function() {
        if (!remSelectCotRecientes) return;
        let cotizaciones = [];
        try {
            cotizaciones = JSON.parse(localStorage.getItem('ga_cotizaciones_guardadas') || '[]');
        } catch (e) {
            cotizaciones = [];
        }

        remSelectCotRecientes.innerHTML = '<option value="">-- O elegir cotización reciente guardada --</option>';
        cotizaciones.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.folio;
            opt.textContent = `${c.folio} - ${c.cliente} (${formatMoney(c.total)})`;
            remSelectCotRecientes.appendChild(opt);
        });
    };

    if (remSelectCotRecientes) {
        remSelectCotRecientes.addEventListener('change', (e) => {
            const folio = e.target.value;
            if (!folio) return;
            let cotizaciones = [];
            try {
                cotizaciones = JSON.parse(localStorage.getItem('ga_cotizaciones_guardadas') || '[]');
            } catch (err) {
                cotizaciones = [];
            }
            const found = cotizaciones.find(c => c.folio === folio);
            if (found) {
                cargarDatosDesdeObjetoCotizacion(found, `Cotización ${folio}`);
            }
        });
    }

    // Cargar Cotización desde Archivo Seleccionado Manualmente desde Carpeta
    if (btnRemCargarArchivo && remFileInputCotizacion) {
        btnRemCargarArchivo.addEventListener('click', () => {
            remFileInputCotizacion.value = '';
            remFileInputCotizacion.click();
        });

        remFileInputCotizacion.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = JSON.parse(evt.target.result);
                    cargarDatosDesdeObjetoCotizacion(data, file.name);
                    alert(`✅ ¡Cotización cargada correctamente desde "${file.name}"!\nTodos los datos y conceptos han sido capturados.`);
                } catch (err) {
                    console.error('Error al procesar archivo JSON:', err);
                    alert('⚠️ Error al leer el archivo. Asegúrate de seleccionar un archivo .json de cotización válido de Gestor de Autos.');
                }
            };
            reader.readAsText(file);
        });
    }

    // Parser Inteligente de texto de Cotización de WhatsApp
    if (btnRemPegarWhatsApp) {
        btnRemPegarWhatsApp.addEventListener('click', () => {
            const rawText = prompt('Pega aquí el texto de la cotización que copiaste de WhatsApp:');
            if (!rawText || !rawText.trim()) return;

            try {
                const text = rawText.trim();
                
                // Extraer folio
                const folioMatch = text.match(/Folio:\s*\*?([A-Z0-9-]+)/i);
                if (folioMatch && remCotOrigenInput) remCotOrigenInput.value = folioMatch[1].trim();

                // Extraer cliente
                const clienteMatch = text.match(/Cliente:\s*\*?([^\n*]+)/i);
                if (clienteMatch && remClienteInput) remClienteInput.value = clienteMatch[1].trim();

                // Extraer gestor
                const gestorMatch = text.match(/Gestor:\s*\*?([^\n*]+)/i);
                if (gestorMatch && remGestorInput) remGestorInput.value = gestorMatch[1].trim();

                // Extraer serie/VIN
                const vinMatch = text.match(/(?:Serie\/VIN|VIN|Serie):\s*\*?([A-Z0-9]+)/i);
                if (vinMatch && remSerieInput) remSerieInput.value = vinMatch[1].trim();

                // Extraer vehículo
                const vehiculoMatch = text.match(/Vehículo:\s*\*?([^\n*]+)/i);
                if (vehiculoMatch && remMarcaInput) {
                    const fullVeh = vehiculoMatch[1].trim();
                    const parts = fullVeh.split(' ');
                    remMarcaInput.value = parts[0] || '';
                    remModeloInput.value = parts.slice(1).join(' ') || '';
                }

                // Extraer conceptos con viñeta •
                const conceptos = [];
                const lineas = text.split('\n');
                lineas.forEach(line => {
                    const cMatch = line.match(/•\s*\*?([^\n*]+?)\*?\s*(?:\(x(\d+)\))?:\s*\$([0-9,.]+)/i);
                    if (cMatch) {
                        const desc = cMatch[1].trim();
                        const cant = cMatch[2] ? Number(cMatch[2]) : 1;
                        const precio = parseFloat(cMatch[3].replace(/,/g, '')) || 0;
                        conceptos.push({ descripcion: desc, cantidad: cant, precio: precio });
                    }
                });

                if (conceptos.length > 0 && remConceptosBody) {
                    remConceptosBody.innerHTML = '';
                    conceptos.forEach(c => addConceptoRemFila(c.descripcion, c.cantidad, c.precio));
                }

                // Extraer total o anticipo
                const totalMatch = text.match(/(?:Total a Liquidar|Total):\s*\*?\$([0-9,.]+)/i);
                if (totalMatch && remAnticipoInput) {
                    const totalVal = parseFloat(totalMatch[1].replace(/,/g, '')) || 0;
                    remAnticipoInput.value = Math.round(totalVal * 0.5);
                }

                recalcularTotalesRemision();
                actualizarVistaPreviaRemision(false);
                switchRemTab('editor');
                alert('✅ Datos capturados automáticamente desde el texto de WhatsApp.');
            } catch (err) {
                console.error(err);
                alert('No se pudieron extraer todos los datos del texto. Verifica el formato.');
            }
        });
    }

    // Función Central para Vaciar Objeto de Cotización en el Formulario de Remisión
    function cargarDatosDesdeObjetoCotizacion(cot, sourceName = '') {
        if (!cot) return;

        // Folio origen
        if (remCotOrigenInput) {
            remCotOrigenInput.value = cot.folio || '';
        }

        // Cliente y Gestor
        if (remClienteInput) remClienteInput.value = cot.cliente || '';
        if (remTelefonoInput && cot.telefono) remTelefonoInput.value = cot.telefono;
        if (remGestorInput) remGestorInput.value = cot.gestor || 'Ing. Joel Durán';
        if (remDireccionEntregaInput) {
            remDireccionEntregaInput.value = cot.modalidad || 'Entrega directa a domicilio / oficina';
        }

        // Vehículo
        const veh = cot.vehiculo || {};
        if (remSerieInput) remSerieInput.value = veh.serie || cot.serie || '';
        if (remMarcaInput) remMarcaInput.value = veh.marca || cot.marca || '';
        if (remModeloInput) remModeloInput.value = veh.modelo || cot.modelo || '';
        if (remAnioInput) remAnioInput.value = veh.anio || cot.anio || '';
        if (remPlacasInput && cot.placas) remPlacasInput.value = cot.placas;

        // Conceptos
        if (remConceptosBody) {
            remConceptosBody.innerHTML = '';
            if (Array.isArray(cot.conceptos) && cot.conceptos.length > 0) {
                cot.conceptos.forEach(c => {
                    addConceptoRemFila(c.descripcion || '', c.cantidad || 1, c.precio || c.importe || 0);
                });
            } else {
                addConceptoRemFila('Gestoría Vehicular y Derechos Oficiales', 1, cot.total || 0);
            }
        }

        // Anticipo recibido
        if (remAnticipoInput) {
            if (cot.anticipo && Number(cot.anticipo) > 0) {
                remAnticipoInput.value = cot.anticipo;
                if (remEstatusSelect) remEstatusSelect.value = 'Anticipo pagado';
            } else if (cot.total && Number(cot.total) > 0) {
                // Sugerencia estándar: 50% de anticipo
                remAnticipoInput.value = Math.round(Number(cot.total) * 0.5);
                if (remEstatusSelect) remEstatusSelect.value = 'Anticipo pagado';
            }
        }

        recalcularTotalesRemision();
        actualizarVistaPreviaRemision(false);
        switchRemTab('editor');
    }

    // Filas Dinámicas de Conceptos de Remisión
    function addConceptoRemFila(desc = '', cant = 1, precio = 0) {
        if (!remConceptosBody) return;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" class="mac-input rem-desc-input" value="${escapeHtml(desc)}" placeholder="Descripción del trámite o derecho..." style="width: 100%; font-size: 11.5px;">
            </td>
            <td style="text-align: center;">
                <input type="number" class="mac-input rem-cant-input" value="${cant}" min="1" max="99" style="width: 55px; text-align: center; font-size: 11.5px;">
            </td>
            <td style="text-align: right;">
                <input type="number" class="mac-input rem-precio-input" value="${precio}" min="0" step="50" style="width: 90px; text-align: right; font-size: 11.5px; font-weight: 600;">
            </td>
            <td style="text-align: right; font-weight: 700; color: #047857;" class="rem-row-importe">
                ${formatMoney(cant * precio)}
            </td>
            <td style="text-align: center;">
                <button type="button" class="btn-del-concepto-rem" title="Eliminar concepto" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 2px 4px;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;

        const descInp = row.querySelector('.rem-desc-input');
        const cantInp = row.querySelector('.rem-cant-input');
        const precioInp = row.querySelector('.rem-precio-input');
        const delBtn = row.querySelector('.btn-del-concepto-rem');

        const updateRow = () => {
            const c = Number(cantInp.value || 1);
            const p = Number(precioInp.value || 0);
            row.querySelector('.rem-row-importe').textContent = formatMoney(c * p);
            recalcularTotalesRemision();
            actualizarVistaPreviaRemision(false);
        };

        descInp.addEventListener('input', () => actualizarVistaPreviaRemision(false));
        cantInp.addEventListener('input', updateRow);
        precioInp.addEventListener('input', updateRow);

        delBtn.addEventListener('click', () => {
            row.remove();
            recalcularTotalesRemision();
            actualizarVistaPreviaRemision(false);
        });

        remConceptosBody.appendChild(row);
        recalcularTotalesRemision();
        actualizarVistaPreviaRemision(false);
    }

    if (btnRemAddConcepto) {
        btnRemAddConcepto.addEventListener('click', () => {
            addConceptoRemFila('', 1, 0);
        });
    }

    // Inicializar fila por defecto si el body está vacío
    if (remConceptosBody && remConceptosBody.children.length === 0) {
        addConceptoRemFila('Alta de Placas Estado de México 2026', 1, 1800);
    }

    // Botones de Anticipo Rápido
    if (btnRemAnticipo50) {
        btnRemAnticipo50.addEventListener('click', () => {
            const total = calcularSubtotalRemision();
            remAnticipoInput.value = Math.round(total * 0.5);
            recalcularTotalesRemision();
            actualizarVistaPreviaRemision(false);
        });
    }
    if (btnRemAnticipo100) {
        btnRemAnticipo100.addEventListener('click', () => {
            const total = calcularSubtotalRemision();
            remAnticipoInput.value = total;
            if (remEstatusSelect) remEstatusSelect.value = 'Liquidada';
            recalcularTotalesRemision();
            actualizarVistaPreviaRemision(false);
        });
    }
    if (btnRemAnticipoCero) {
        btnRemAnticipoCero.addEventListener('click', () => {
            remAnticipoInput.value = 0;
            if (remEstatusSelect) remEstatusSelect.value = 'En proceso';
            recalcularTotalesRemision();
            actualizarVistaPreviaRemision(false);
        });
    }

    // Cálculo Financiero
    function calcularSubtotalRemision() {
        if (!remConceptosBody) return 0;
        let sub = 0;
        const rows = remConceptosBody.querySelectorAll('tr');
        rows.forEach(r => {
            const cant = Number(r.querySelector('.rem-cant-input')?.value || 1);
            const precio = Number(r.querySelector('.rem-precio-input')?.value || 0);
            sub += (cant * precio);
        });
        return sub;
    }

    function recalcularTotalesRemision() {
        const subtotal = calcularSubtotalRemision();
        const anticipo = Math.max(0, Number(remAnticipoInput?.value || 0));
        const saldo = Math.max(0, subtotal - anticipo);

        if (remSubtotalText) remSubtotalText.textContent = formatMoney(subtotal);
        if (remTotalText) remTotalText.textContent = formatMoney(subtotal);
        if (remAnticipoText) remAnticipoText.textContent = formatMoney(anticipo);
        if (remSaldoText) remSaldoText.textContent = formatMoney(saldo);

        // Auto-ajuste de estatus sugerido si el saldo es cero
        if (remEstatusSelect) {
            if (saldo === 0 && subtotal > 0 && anticipo >= subtotal) {
                if (remEstatusSelect.value !== 'Entregada') {
                    remEstatusSelect.value = 'Liquidada';
                }
            } else if (anticipo > 0 && saldo > 0) {
                if (remEstatusSelect.value !== 'Entregada') {
                    remEstatusSelect.value = 'Anticipo pagado';
                }
            }
        }
    }

    if (remAnticipoInput) {
        remAnticipoInput.addEventListener('input', () => {
            recalcularTotalesRemision();
            actualizarVistaPreviaRemision(false);
        });
    }

    // Listeners de actualización en vivo para todos los inputs
    const remInputsToWatch = [
        remFolioInput, remCotOrigenInput, remFechaInput, remEstatusSelect,
        remClienteInput, remTelefonoInput, remGestorInput, remDireccionEntregaInput,
        remSerieInput, remPlacasInput, remMarcaInput, remModeloInput, remAnioInput, remColorInput,
        remMetodoPagoSelect, remReferenciaPagoInput, remNotasInput
    ];
    remInputsToWatch.forEach(inp => {
        if (inp) {
            inp.addEventListener('input', () => actualizarVistaPreviaRemision(false));
            inp.addEventListener('change', () => actualizarVistaPreviaRemision(false));
        }
    });

    // Checkboxes de Documentos Entregados
    const remDocCheckboxes = document.querySelectorAll('.rem-doc-chk');
    remDocCheckboxes.forEach(chk => {
        chk.addEventListener('change', () => actualizarVistaPreviaRemision(false));
    });

    // Zoom Vista Previa Remisión
    if (btnZoomRemPreview && miniRemLetterSheet) {
        btnZoomRemPreview.addEventListener('click', () => {
            const isZoomed = miniRemLetterSheet.classList.toggle('zoomed-real-size');
            if (remZoomBtnText) {
                remZoomBtnText.textContent = isZoomed ? 'Compactar' : 'Agrandar';
            }
        });
    }

    // Actualizar Vista Previa en Vivo Carta (1/3) y QR
    function actualizarVistaPreviaRemision(forceNewHash = false) {
        if (forceNewHash || !currentRemSecurityHash) {
            currentRemSecurityHash = generarTokenSeguridadRem();
        }

        const folio = remFolioInput?.value.trim() || 'REM-2026-0001';
        const cotOrigen = remCotOrigenInput?.value.trim() || 'N/A';
        const fechaVal = remFechaInput?.value || new Date().toISOString().split('T')[0];
        let fechaFormateada = fechaVal;
        if (fechaVal && fechaVal.includes('-')) {
            const p = fechaVal.split('-');
            if (p.length === 3) fechaFormateada = `${p[2]}/${p[1]}/${p[0]}`;
        }

        const estatus = remEstatusSelect?.value || 'En proceso';
        const cliente = remClienteInput?.value.trim() || 'Cliente Particular';
        const telefono = remTelefonoInput?.value.trim() || '55 3575 7364';
        const entrega = remDireccionEntregaInput?.value.trim() || 'Entrega a domicilio';
        const gestor = remGestorInput?.value.trim() || 'Ing. Joel Durán';

        const marca = remMarcaInput?.value.trim() || '';
        const modelo = remModeloInput?.value.trim() || '';
        const anio = remAnioInput?.value.trim() || '';
        const vehiculoStr = [marca, modelo, anio].filter(Boolean).join(' ') || 'Vehículo sin especificar';
        const vin = remSerieInput?.value.trim() || 'No registrado';
        const placas = remPlacasInput?.value.trim() || 'En trámite';

        // Actualizar datos de cabecera preview
        const prevRemFolio = document.getElementById('prevRemFolio');
        const prevRemCotOrigen = document.getElementById('prevRemCotOrigen');
        const prevRemFecha = document.getElementById('prevRemFecha');
        const prevRemEstatus = document.getElementById('prevRemEstatus');
        const prevRemCliente = document.getElementById('prevRemCliente');
        const prevRemTelefono = document.getElementById('prevRemTelefono');
        const prevRemEntrega = document.getElementById('prevRemEntrega');
        const prevRemVehiculo = document.getElementById('prevRemVehiculo');
        const prevRemVin = document.getElementById('prevRemVin');
        const prevRemPlacas = document.getElementById('prevRemPlacas');
        const prevRemGestorSign = document.getElementById('prevRemGestorSign');
        const prevRemClienteSign = document.getElementById('prevRemClienteSign');

        if (prevRemFolio) prevRemFolio.textContent = folio;
        if (prevRemCotOrigen) prevRemCotOrigen.textContent = cotOrigen;
        if (prevRemFecha) prevRemFecha.textContent = fechaFormateada;
        if (prevRemEstatus) prevRemEstatus.textContent = estatus;
        if (prevRemCliente) prevRemCliente.textContent = cliente;
        if (prevRemTelefono) prevRemTelefono.textContent = telefono;
        if (prevRemEntrega) prevRemEntrega.textContent = entrega;
        if (prevRemVehiculo) prevRemVehiculo.textContent = vehiculoStr;
        if (prevRemVin) prevRemVin.textContent = vin;
        if (prevRemPlacas) prevRemPlacas.textContent = placas;
        if (prevRemGestorSign) prevRemGestorSign.textContent = gestor;
        if (prevRemClienteSign) prevRemClienteSign.textContent = cliente;

        // Tabla de conceptos preview
        const prevRemTableBody = document.getElementById('prevRemTableBody');
        if (prevRemTableBody && remConceptosBody) {
            prevRemTableBody.innerHTML = '';
            const rows = remConceptosBody.querySelectorAll('tr');
            let idx = 1;
            rows.forEach(r => {
                const desc = r.querySelector('.rem-desc-input')?.value.trim() || 'Trámite vehicular';
                const cant = Number(r.querySelector('.rem-cant-input')?.value || 1);
                const precio = Number(r.querySelector('.rem-precio-input')?.value || 0);
                const imp = cant * precio;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align: center; color: #64748b;">${idx++}</td>
                    <td style="font-weight: 600;">${escapeHtml(desc)}</td>
                    <td style="text-align: center;">${cant}</td>
                    <td style="text-align: right;">${formatMoney(precio)}</td>
                    <td style="text-align: right; font-weight: 700;">${formatMoney(imp)}</td>
                `;
                prevRemTableBody.appendChild(tr);
            });
        }

        // Totales preview
        const subtotal = calcularSubtotalRemision();
        const anticipo = Math.max(0, Number(remAnticipoInput?.value || 0));
        const saldo = Math.max(0, subtotal - anticipo);

        const prevRemSubtotal = document.getElementById('prevRemSubtotal');
        const prevRemTotal = document.getElementById('prevRemTotal');
        const prevRemAnticipo = document.getElementById('prevRemAnticipo');
        const prevRemSaldo = document.getElementById('prevRemSaldo');

        if (prevRemSubtotal) prevRemSubtotal.textContent = formatMoney(subtotal);
        if (prevRemTotal) prevRemTotal.textContent = formatMoney(subtotal);
        if (prevRemAnticipo) prevRemAnticipo.textContent = formatMoney(anticipo);
        if (prevRemSaldo) prevRemSaldo.textContent = formatMoney(saldo);

        // Checklist de documentos preview
        const prevRemChecklistTags = document.getElementById('prevRemChecklistTags');
        if (prevRemChecklistTags) {
            prevRemChecklistTags.innerHTML = '';
            remDocCheckboxes.forEach(chk => {
                if (chk.checked) {
                    const labelText = chk.parentElement.textContent.trim();
                    const tag = document.createElement('span');
                    tag.className = 'mini-check-tag';
                    tag.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> ${escapeHtml(labelText)}`;
                    prevRemChecklistTags.appendChild(tag);
                }
            });
        }

        // Código QR Dinámico
        let qrMsg = `Hola Gestor de Autos, solicito validar la Nota de Remisión Folio: *${folio}*\n`;
        qrMsg += `*Cliente:* ${cliente}\n`;
        qrMsg += `*Vehículo:* ${vehiculoStr} (Placas: ${placas})\n`;
        if (vin !== 'No registrado') qrMsg += `*VIN:* ${vin}\n`;
        qrMsg += `*Total:* ${formatMoney(subtotal)}\n`;
        qrMsg += `*Anticipo Recibido:* ${formatMoney(anticipo)}\n`;
        qrMsg += `*Saldo Pendiente:* ${formatMoney(saldo)}\n`;
        qrMsg += `*Estatus:* ${estatus}\n`;
        qrMsg += `*Código de Validación:* ${currentRemSecurityHash}\n`;
        qrMsg += `🌐 www.GestorDeAutos.com.mx`;

        const qrUrl = `https://wa.me/525535757364?text=${encodeURIComponent(qrMsg)}`;
        renderQr('prevRemQrCode', qrUrl, 52);
        renderQr('pdfRemQrCode', qrUrl, 68);
    }

    // Preparar Documento PDF de Impresión Dedicado
    function prepararDocumentoPdfRemision() {
        actualizarVistaPreviaRemision(false);

        const folio = remFolioInput?.value.trim() || 'REM-2026-0001';
        const cotOrigen = remCotOrigenInput?.value.trim() || 'N/A';
        const fechaVal = remFechaInput?.value || new Date().toISOString().split('T')[0];
        let fechaFormateada = fechaVal;
        if (fechaVal && fechaVal.includes('-')) {
            const p = fechaVal.split('-');
            if (p.length === 3) fechaFormateada = `${p[2]}/${p[1]}/${p[0]}`;
        }
        const estatus = remEstatusSelect?.value || 'En proceso';
        const cliente = remClienteInput?.value.trim() || 'Cliente Particular';
        const telefono = remTelefonoInput?.value.trim() || '55 3575 7364';
        const entrega = remDireccionEntregaInput?.value.trim() || 'Entrega directa a domicilio';
        const gestor = remGestorInput?.value.trim() || 'Ing. Joel Durán';

        const marca = remMarcaInput?.value.trim() || '';
        const modelo = remModeloInput?.value.trim() || '';
        const anio = remAnioInput?.value.trim() || '';
        const vehiculoStr = [marca, modelo, anio].filter(Boolean).join(' ') || 'Vehículo no especificado';
        const vin = remSerieInput?.value.trim() || 'No registrado';
        const placas = remPlacasInput?.value.trim() || 'En trámite';
        const notas = remNotasInput?.value.trim() || 'Trámite 100% legal y oficial verificable en portales de gobierno.';
        const metodoPago = remMetodoPagoSelect?.value || 'SPEI BBVA';
        const refPago = remReferenciaPagoInput?.value.trim() || '';

        // Encabezado
        const pdfRemFolioDisplay = document.getElementById('pdfRemFolioDisplay');
        const pdfRemCotOrigenDisplay = document.getElementById('pdfRemCotOrigenDisplay');
        const pdfRemFechaDisplay = document.getElementById('pdfRemFechaDisplay');
        const pdfRemEstatusDisplay = document.getElementById('pdfRemEstatusDisplay');
        const pdfRemGestorDisplay = document.getElementById('pdfRemGestorDisplay');
        const pdfRemSecurityHashDisplay = document.getElementById('pdfRemSecurityHashDisplay');
        const pdfRemQrTokenDisplay = document.getElementById('pdfRemQrTokenDisplay');

        if (pdfRemFolioDisplay) pdfRemFolioDisplay.textContent = folio;
        if (pdfRemCotOrigenDisplay) pdfRemCotOrigenDisplay.textContent = cotOrigen;
        if (pdfRemFechaDisplay) pdfRemFechaDisplay.textContent = fechaFormateada;
        if (pdfRemEstatusDisplay) pdfRemEstatusDisplay.textContent = estatus;
        if (pdfRemGestorDisplay) pdfRemGestorDisplay.textContent = gestor;
        if (pdfRemSecurityHashDisplay) pdfRemSecurityHashDisplay.textContent = currentRemSecurityHash;
        if (pdfRemQrTokenDisplay) pdfRemQrTokenDisplay.textContent = currentRemSecurityHash;

        // Fichas
        const pdfRemClienteDisplay = document.getElementById('pdfRemClienteDisplay');
        const pdfRemTelefonoDisplay = document.getElementById('pdfRemTelefonoDisplay');
        const pdfRemEntregaDisplay = document.getElementById('pdfRemEntregaDisplay');
        const pdfRemVehiculoDisplay = document.getElementById('pdfRemVehiculoDisplay');
        const pdfRemVinDisplay = document.getElementById('pdfRemVinDisplay');
        const pdfRemPlacasDisplay = document.getElementById('pdfRemPlacasDisplay');
        const pdfRemSignName = document.getElementById('pdfRemSignName');
        const pdfRemSignCliente = document.getElementById('pdfRemSignCliente');

        if (pdfRemClienteDisplay) pdfRemClienteDisplay.textContent = cliente;
        if (pdfRemTelefonoDisplay) pdfRemTelefonoDisplay.textContent = telefono;
        if (pdfRemEntregaDisplay) pdfRemEntregaDisplay.textContent = entrega;
        if (pdfRemVehiculoDisplay) pdfRemVehiculoDisplay.textContent = vehiculoStr;
        if (pdfRemVinDisplay) pdfRemVinDisplay.textContent = vin;
        if (pdfRemPlacasDisplay) pdfRemPlacasDisplay.textContent = placas;
        if (pdfRemSignName) pdfRemSignName.textContent = gestor;
        if (pdfRemSignCliente) pdfRemSignCliente.textContent = cliente;

        // Tabla de conceptos imprimible
        const pdfRemTableBody = document.getElementById('pdfRemTableBody');
        if (pdfRemTableBody && remConceptosBody) {
            pdfRemTableBody.innerHTML = '';
            const rows = remConceptosBody.querySelectorAll('tr');
            let idx = 1;
            rows.forEach(r => {
                const desc = r.querySelector('.rem-desc-input')?.value.trim() || 'Trámite vehicular';
                const cant = Number(r.querySelector('.rem-cant-input')?.value || 1);
                const precio = Number(r.querySelector('.rem-precio-input')?.value || 0);
                const imp = cant * precio;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align: center; color: #64748b;">${idx++}</td>
                    <td style="font-weight: 600;">${escapeHtml(desc)}</td>
                    <td style="text-align: center;">${cant}</td>
                    <td style="text-align: right;">${formatMoney(precio)}</td>
                    <td style="text-align: right; font-weight: 700;">${formatMoney(imp)}</td>
                `;
                pdfRemTableBody.appendChild(tr);
            });
        }

        // Totales y pagos imprimible
        const subtotal = calcularSubtotalRemision();
        const anticipo = Math.max(0, Number(remAnticipoInput?.value || 0));
        const saldo = Math.max(0, subtotal - anticipo);

        const pdfRemSubtotalDisplay = document.getElementById('pdfRemSubtotalDisplay');
        const pdfRemTotalDisplay = document.getElementById('pdfRemTotalDisplay');
        const pdfRemAnticipoDisplay = document.getElementById('pdfRemAnticipoDisplay');
        const pdfRemSaldoDisplay = document.getElementById('pdfRemSaldoDisplay');
        const pdfRemNotasDisplay = document.getElementById('pdfRemNotasDisplay');
        const pdfRemMetodoPagoDisplay = document.getElementById('pdfRemMetodoPagoDisplay');
        const pdfRemRefPagoWrap = document.getElementById('pdfRemRefPagoWrap');
        const pdfRemRefPagoDisplay = document.getElementById('pdfRemRefPagoDisplay');

        if (pdfRemSubtotalDisplay) pdfRemSubtotalDisplay.textContent = formatMoney(subtotal);
        if (pdfRemTotalDisplay) pdfRemTotalDisplay.textContent = formatMoney(subtotal);
        if (pdfRemAnticipoDisplay) pdfRemAnticipoDisplay.textContent = formatMoney(anticipo);
        if (pdfRemSaldoDisplay) pdfRemSaldoDisplay.textContent = formatMoney(saldo);
        if (pdfRemNotasDisplay) pdfRemNotasDisplay.textContent = notas;
        if (pdfRemMetodoPagoDisplay) pdfRemMetodoPagoDisplay.textContent = metodoPago;
        if (pdfRemRefPagoWrap && pdfRemRefPagoDisplay) {
            if (refPago) {
                pdfRemRefPagoWrap.style.display = 'inline';
                pdfRemRefPagoDisplay.textContent = refPago;
            } else {
                pdfRemRefPagoWrap.style.display = 'none';
            }
        }

        // Checklist imprimible
        const pdfRemChecklistDisplay = document.getElementById('pdfRemChecklistDisplay');
        if (pdfRemChecklistDisplay) {
            pdfRemChecklistDisplay.innerHTML = '';
            remDocCheckboxes.forEach(chk => {
                if (chk.checked) {
                    const text = chk.parentElement.textContent.trim();
                    const span = document.createElement('span');
                    span.style.background = '#f1f5f9';
                    span.style.border = '1px solid #cbd5e1';
                    span.style.padding = '2px 8px';
                    span.style.borderRadius = '3px';
                    span.innerHTML = `<strong>✔</strong> ${escapeHtml(text)}`;
                    pdfRemChecklistDisplay.appendChild(span);
                }
            });
        }

        return { folio, cliente };
    }

    // Botón Generar PDF / Imprimir Nota de Remisión
    if (btnRemGenerarPdf) {
        btnRemGenerarPdf.addEventListener('click', () => {
            const { folio, cliente } = prepararDocumentoPdfRemision();
            const origTitle = document.title;
            const cleanClient = cliente.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_').substring(0, 30);
            document.title = `Nota_Remision_${folio}_${cleanClient}`;

            document.body.classList.remove('printing-cotizacion');
            document.body.classList.add('printing-remision');

            setTimeout(() => {
                window.print();
                setTimeout(() => {
                    document.title = origTitle;
                    document.body.classList.remove('printing-remision');
                }, 1000);
            }, 60);
        });
    }

    // Copiar Comprobante para WhatsApp
    if (btnRemCopiarWhatsApp) {
        btnRemCopiarWhatsApp.addEventListener('click', () => {
            const folio = remFolioInput?.value.trim() || 'REM-2026-0001';
            const fechaVal = remFechaInput?.value || new Date().toISOString().split('T')[0];
            const estatus = remEstatusSelect?.value || 'En proceso';
            const cliente = remClienteInput?.value.trim() || 'Cliente';
            const gestor = remGestorInput?.value.trim() || 'Ing. Joel Durán';
            const vin = remSerieInput?.value.trim() || 'No registrado';
            const placas = remPlacasInput?.value.trim() || 'En trámite';
            const marca = remMarcaInput?.value.trim() || '';
            const modelo = remModeloInput?.value.trim() || '';
            const anio = remAnioInput?.value.trim() || '';
            const vehiculoStr = [marca, modelo, anio].filter(Boolean).join(' ') || 'Vehículo sin especificar';
            const entrega = remDireccionEntregaInput?.value.trim() || 'A domicilio';
            const metodoPago = remMetodoPagoSelect?.value || 'SPEI BBVA';
            const refPago = remReferenciaPagoInput?.value.trim() || '';

            const subtotal = calcularSubtotalRemision();
            const anticipo = Math.max(0, Number(remAnticipoInput?.value || 0));
            const saldo = Math.max(0, subtotal - anticipo);

            // Conceptos
            let conceptosTexto = '';
            const rows = remConceptosBody ? remConceptosBody.querySelectorAll('tr') : [];
            rows.forEach(r => {
                const desc = r.querySelector('.rem-desc-input')?.value.trim();
                const cant = Number(r.querySelector('.rem-cant-input')?.value || 1);
                const precio = Number(r.querySelector('.rem-precio-input')?.value || 0);
                if (desc) {
                    conceptosTexto += `• *${desc}* (x${cant}): ${formatMoney(cant * precio)}\n`;
                }
            });

            // Checklist
            let docsTexto = '';
            remDocCheckboxes.forEach(chk => {
                if (chk.checked) {
                    docsTexto += `✔ ${chk.parentElement.textContent.trim()}\n`;
                }
            });

            let msj = `🧾 *NOTA DE REMISIÓN Y COMPROBANTE DE PAGO*\n`;
            msj += `*Folio:* ${folio}\n`;
            msj += `*Fecha:* ${fechaVal}\n`;
            msj += `*Estatus:* ${estatus}\n`;
            msj += `*Gestor:* ${gestor}\n`;
            msj += `*Cliente:* ${cliente}\n`;
            msj += `*Vehículo:* ${vehiculoStr}\n`;
            msj += `*Serie/VIN:* ${vin}\n`;
            msj += `*Placas:* ${placas}\n`;
            msj += `*Lugar de Entrega:* ${entrega}\n`;
            msj += `─────────────────────────\n`;
            msj += `*SERVICIOS AMPARADOS:*\n${conceptosTexto || '• Gestoría vehicular y derechos\n'}`;
            msj += `─────────────────────────\n`;
            msj += `*Total General:* ${formatMoney(subtotal)}\n`;
            msj += `*Anticipo Recibido:* ${formatMoney(anticipo)} (${metodoPago}${refPago ? ' - Ref: ' + refPago : ''})\n`;
            msj += `*SALDO PENDIENTE:* ${formatMoney(saldo)} (Contra entrega)\n`;
            if (docsTexto) {
                msj += `─────────────────────────\n`;
                msj += `*Documentos y Materiales Amparados:*\n${docsTexto}`;
            }
            msj += `─────────────────────────\n`;
            if (currentRemSecurityHash) {
                msj += `*Código de Validación:* ${currentRemSecurityHash}\n`;
            }
            msj += `Trámites 100% legales y oficiales verificables en portal de gobierno.\n`;
            msj += `🌐 www.GestorDeAutos.com.mx`;

            navigator.clipboard.writeText(msj).then(() => {
                alert('✅ Comprobante de remisión copiado al portapapeles. ¡Listo para enviar por WhatsApp!');
            }).catch(err => {
                console.error(err);
                alert('No se pudo copiar automáticamente. Puedes seleccionar el texto manualmente.');
            });
        });
    }

    // Guardar Nota de Remisión en el Sistema
    function compilarObjetoRemision() {
        const folio = remFolioInput?.value.trim() || generarFolioRemision();
        const cotOrigen = remCotOrigenInput?.value.trim() || '';
        const fecha = remFechaInput?.value || new Date().toISOString().split('T')[0];
        const estatus = remEstatusSelect?.value || 'En proceso';
        const cliente = remClienteInput?.value.trim() || 'Cliente Particular';
        const telefono = remTelefonoInput?.value.trim() || '';
        const gestor = remGestorInput?.value.trim() || 'Ing. Joel Durán';
        const entrega = remDireccionEntregaInput?.value.trim() || '';

        const serie = remSerieInput?.value.trim() || '';
        const placas = remPlacasInput?.value.trim() || '';
        const marca = remMarcaInput?.value.trim() || '';
        const modelo = remModeloInput?.value.trim() || '';
        const anio = remAnioInput?.value.trim() || '';
        const color = remColorInput?.value.trim() || '';

        const conceptos = [];
        const rows = remConceptosBody ? remConceptosBody.querySelectorAll('tr') : [];
        rows.forEach(r => {
            const desc = r.querySelector('.rem-desc-input')?.value.trim() || '';
            const cant = Number(r.querySelector('.rem-cant-input')?.value || 1);
            const precio = Number(r.querySelector('.rem-precio-input')?.value || 0);
            if (desc) {
                conceptos.push({
                    descripcion: desc,
                    cantidad: cant,
                    precio: precio,
                    importe: cant * precio
                });
            }
        });

        const subtotal = calcularSubtotalRemision();
        const anticipo = Math.max(0, Number(remAnticipoInput?.value || 0));
        const saldo = Math.max(0, subtotal - anticipo);
        const metodoPago = remMetodoPagoSelect?.value || 'SPEI BBVA';
        const refPago = remReferenciaPagoInput?.value.trim() || '';
        const notas = remNotasInput?.value.trim() || '';

        const docsChecklist = [];
        remDocCheckboxes.forEach(chk => {
            if (chk.checked) {
                docsChecklist.push(chk.parentElement.textContent.trim());
            }
        });

        return {
            id: currentEditingRemId || Date.now(),
            folio: folio,
            cotOrigen: cotOrigen,
            fecha: fecha,
            estatus: estatus,
            cliente: cliente,
            telefono: telefono,
            gestor: gestor,
            entrega: entrega,
            vehiculo: {
                serie: serie,
                placas: placas,
                marca: marca,
                modelo: modelo,
                anio: anio,
                color: color
            },
            conceptos: conceptos,
            subtotal: subtotal,
            total: subtotal,
            anticipo: anticipo,
            saldo: saldo,
            metodoPago: metodoPago,
            refPago: refPago,
            notas: notas,
            docsChecklist: docsChecklist,
            token: currentRemSecurityHash || generarTokenSeguridadRem(),
            actualizadoEn: new Date().toISOString()
        };
    }

    if (btnRemGuardar) {
        btnRemGuardar.addEventListener('click', () => {
            if (!remClienteInput || !remClienteInput.value.trim()) {
                alert('Por favor ingresa el nombre del cliente o empresa.');
                remClienteInput?.focus();
                return;
            }

            const remData = compilarObjetoRemision();

            const existingIndex = remisiones.findIndex(r => r.id === remData.id || r.folio === remData.folio);
            if (existingIndex !== -1) {
                remisiones[existingIndex] = remData;
            } else {
                remisiones.unshift(remData);
            }

            currentEditingRemId = remData.id;
            localStorage.setItem('ga_remisiones', JSON.stringify(remisiones));

            if (btnRemEliminarActual) {
                btnRemEliminarActual.style.display = 'inline-flex';
            }

            updateRemisionesStats();
            renderRemisionesTable();
            alert(`✅ Nota de remisión "${remData.folio}" guardada con éxito en el sistema.`);
        });
    }

    // Limpiar Formulario de Remisión
    function limpiarFormularioRemision() {
        currentEditingRemId = null;
        if (remFolioInput) remFolioInput.value = generarFolioRemision();
        if (remCotOrigenInput) remCotOrigenInput.value = '';
        if (remFechaInput) remFechaInput.value = new Date().toISOString().split('T')[0];
        if (remEstatusSelect) remEstatusSelect.value = 'En proceso';
        if (remClienteInput) remClienteInput.value = '';
        if (remTelefonoInput) remTelefonoInput.value = '';
        if (remDireccionEntregaInput) remDireccionEntregaInput.value = 'Entrega directa a domicilio / oficina';
        if (remSerieInput) remSerieInput.value = '';
        if (remPlacasInput) remPlacasInput.value = '';
        if (remMarcaInput) remMarcaInput.value = '';
        if (remModeloInput) remModeloInput.value = '';
        if (remAnioInput) remAnioInput.value = '';
        if (remColorInput) remColorInput.value = '';
        if (remAnticipoInput) remAnticipoInput.value = 0;
        if (remReferenciaPagoInput) remReferenciaPagoInput.value = '';
        if (remNotasInput) remNotasInput.value = '';

        if (remConceptosBody) {
            remConceptosBody.innerHTML = '';
            addConceptoRemFila('Alta de Placas Estado de México 2026', 1, 1800);
        }

        remDocCheckboxes.forEach((chk, i) => {
            chk.checked = (i < 4);
        });

        if (btnRemEliminarActual) {
            btnRemEliminarActual.style.display = 'none';
        }

        recalcularTotalesRemision();
        actualizarVistaPreviaRemision(true);
    }

    if (btnRemLimpiar) {
        btnRemLimpiar.addEventListener('click', () => {
            if (confirm('¿Limpiar el formulario para crear una nueva nota de remisión?')) {
                limpiarFormularioRemision();
            }
        });
    }

    // =====================================================================
    // HERRAMIENTAS DE ELIMINACIÓN Y GESTIÓN DE HISTORIAL DE REMISIONES
    // =====================================================================

    // Eliminar Nota Actual desde el Editor
    if (btnRemEliminarActual) {
        btnRemEliminarActual.addEventListener('click', () => {
            if (!currentEditingRemId) return;
            const item = remisiones.find(r => r.id === currentEditingRemId);
            if (!item) return;

            if (confirm(`¿Estás seguro de eliminar la nota de remisión "${item.folio}"? Esta acción se puede deshacer.`)) {
                eliminarRemisionPorId(item.id);
                limpiarFormularioRemision();
                switchRemTab('historial');
            }
        });
    }

    // Eliminar una Remisión por ID
    window.eliminarRemisionPorId = function(id) {
        const item = remisiones.find(r => r.id === id);
        if (!item) return;

        lastDeletedRemision = { ...item };
        remisiones = remisiones.filter(r => r.id !== id);
        localStorage.setItem('ga_remisiones', JSON.stringify(remisiones));

        if (currentEditingRemId === id) {
            currentEditingRemId = null;
            if (btnRemEliminarActual) btnRemEliminarActual.style.display = 'none';
        }

        updateRemisionesStats();
        renderRemisionesTable();

        // Mostrar notificación de deshacer
        if (undoToast) {
            undoToast.style.display = 'flex';
            undoToast.querySelector('span').innerHTML = `<i class="fas fa-trash-alt" style="color: #f87171; margin-right: 6px;"></i> Nota ${item.folio} eliminada`;
            clearTimeout(undoTimeout);
            undoTimeout = setTimeout(() => {
                undoToast.style.display = 'none';
            }, 8000);
        }
    };

    window.clickEliminarRemision = function(e, id) {
        e.stopPropagation();
        const item = remisiones.find(r => r.id === id);
        if (!item) return;
        if (confirm(`¿Eliminar la nota de remisión con folio "${item.folio}" de "${item.cliente}"?`)) {
            eliminarRemisionPorId(id);
        }
    };

    // Restaurar Nota Eliminada (Deshacer)
    window.restaurarUltimaRemision = function() {
        if (!lastDeletedRemision) return;
        remisiones.unshift({ ...lastDeletedRemision });
        localStorage.setItem('ga_remisiones', JSON.stringify(remisiones));
        lastDeletedRemision = null;
        if (undoToast) undoToast.style.display = 'none';
        updateRemisionesStats();
        renderRemisionesTable();
    };

    // Cargar Nota para Edición desde Historial
    window.editarRemision = function(id) {
        const item = remisiones.find(r => r.id === id);
        if (!item) return;

        currentEditingRemId = item.id;
        if (remFolioInput) remFolioInput.value = item.folio || '';
        if (remCotOrigenInput) remCotOrigenInput.value = item.cotOrigen || '';
        if (remFechaInput) remFechaInput.value = item.fecha || '';
        if (remEstatusSelect) remEstatusSelect.value = item.estatus || 'En proceso';
        if (remClienteInput) remClienteInput.value = item.cliente || '';
        if (remTelefonoInput) remTelefonoInput.value = item.telefono || '';
        if (remGestorInput) remGestorInput.value = item.gestor || 'Ing. Joel Durán';
        if (remDireccionEntregaInput) remDireccionEntregaInput.value = item.entrega || '';

        const veh = item.vehiculo || {};
        if (remSerieInput) remSerieInput.value = veh.serie || '';
        if (remPlacasInput) remPlacasInput.value = veh.placas || '';
        if (remMarcaInput) remMarcaInput.value = veh.marca || '';
        if (remModeloInput) remModeloInput.value = veh.modelo || '';
        if (remAnioInput) remAnioInput.value = veh.anio || '';
        if (remColorInput) remColorInput.value = veh.color || '';

        if (remConceptosBody) {
            remConceptosBody.innerHTML = '';
            if (Array.isArray(item.conceptos) && item.conceptos.length > 0) {
                item.conceptos.forEach(c => addConceptoRemFila(c.descripcion, c.cantidad, c.precio));
            } else {
                addConceptoRemFila('Gestoría Vehicular', 1, item.total || 0);
            }
        }

        if (remAnticipoInput) remAnticipoInput.value = item.anticipo || 0;
        if (remMetodoPagoSelect) remMetodoPagoSelect.value = item.metodoPago || 'Transferencia SPEI (BBVA)';
        if (remReferenciaPagoInput) remReferenciaPagoInput.value = item.refPago || '';
        if (remNotasInput) remNotasInput.value = item.notas || '';

        // Checkboxes
        if (Array.isArray(item.docsChecklist)) {
            remDocCheckboxes.forEach(chk => {
                chk.checked = item.docsChecklist.includes(chk.parentElement.textContent.trim());
            });
        }

        if (btnRemEliminarActual) btnRemEliminarActual.style.display = 'inline-flex';

        recalcularTotalesRemision();
        actualizarVistaPreviaRemision(false);
        switchRemTab('editor');
    };

    // Imprimir directamente desde la fila del historial
    window.imprimirRemisionDesdeFila = function(e, id) {
        e.stopPropagation();
        editarRemision(id);
        setTimeout(() => {
            if (btnRemGenerarPdf) btnRemGenerarPdf.click();
        }, 150);
    };

    // Compartir por WhatsApp directamente desde la fila
    window.whatsappRemisionDesdeFila = function(e, id) {
        e.stopPropagation();
        editarRemision(id);
        setTimeout(() => {
            if (btnRemCopiarWhatsApp) btnRemCopiarWhatsApp.click();
        }, 150);
    };

    // Renderizar Tabla de Historial de Remisiones
    window.renderRemisionesTable = function() {
        if (!remisionesTableBody) return;

        const q = (remSearchInput?.value || '').toLowerCase().trim();
        const statusFilter = remFilterStatus?.value || 'todos';

        const filtered = remisiones.filter(r => {
            const matchesStatus = (statusFilter === 'todos') || (r.estatus === statusFilter);
            if (!matchesStatus) return false;

            if (!q) return true;
            const folio = (r.folio || '').toLowerCase();
            const cliente = (r.cliente || '').toLowerCase();
            const serie = (r.vehiculo?.serie || '').toLowerCase();
            const placas = (r.vehiculo?.placas || '').toLowerCase();
            const marca = (r.vehiculo?.marca || '').toLowerCase();
            const modelo = (r.vehiculo?.modelo || '').toLowerCase();

            return folio.includes(q) || cliente.includes(q) || serie.includes(q) || placas.includes(q) || marca.includes(q) || modelo.includes(q);
        });

        if (filtered.length === 0) {
            remisionesTableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 24px; color: #64748b;">
                        <i class="fas fa-inbox" style="font-size: 24px; color: #cbd5e1; margin-bottom: 6px; display: block;"></i>
                        No hay notas de remisión registradas ${q ? 'que coincidan con la búsqueda' : ''}.
                    </td>
                </tr>
            `;
            actualizarSeleccionadasCount();
            return;
        }

        remisionesTableBody.innerHTML = filtered.map(r => {
            const veh = r.vehiculo || {};
            const vehStr = [veh.marca, veh.modelo, veh.anio].filter(Boolean).join(' ') || 'Sin especificar';
            const placasStr = veh.placas || 'En trámite';
            
            let badgeClass = 'background: #fef3c7; color: #b45309;'; // En proceso (amarillo)
            if (r.estatus === 'Anticipo pagado') badgeClass = 'background: #e0f2fe; color: #0369a1;'; // Azul
            if (r.estatus === 'Liquidada') badgeClass = 'background: #dcfce7; color: #15803d;'; // Verde
            if (r.estatus === 'Entregada') badgeClass = 'background: #f3e8ff; color: #7e22ce;'; // Púrpura

            const fechaFormat = r.fecha || '-';

            return `
                <tr onclick="editarRemision(${r.id})" style="cursor: pointer;">
                    <td style="text-align: center;" onclick="event.stopPropagation()">
                        <input type="checkbox" class="rem-row-chk" data-id="${r.id}" onchange="actualizarSeleccionadasCount()">
                    </td>
                    <td><strong style="color: #047857;">${escapeHtml(r.folio)}</strong></td>
                    <td style="color: #64748b; font-size: 11px;">${escapeHtml(fechaFormat)}</td>
                    <td><strong>${escapeHtml(r.cliente)}</strong></td>
                    <td>
                        <div style="font-size: 11.5px;">${escapeHtml(vehStr)}</div>
                        <div style="font-size: 10px; color: #64748b;">Placas: <strong style="color: #1e3a8a;">${escapeHtml(placasStr)}</strong></div>
                    </td>
                    <td style="text-align: right; font-weight: 700;">${formatMoney(r.total)}</td>
                    <td style="text-align: right; color: #0284c7; font-weight: 600;">${formatMoney(r.anticipo)}</td>
                    <td style="text-align: right; color: ${Number(r.saldo || 0) > 0 ? '#dc2626' : '#10b981'}; font-weight: 800;">${formatMoney(r.saldo)}</td>
                    <td style="text-align: center;">
                        <span style="display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 700; ${badgeClass}">
                            ${escapeHtml(r.estatus || 'En proceso')}
                        </span>
                    </td>
                    <td style="text-align: center;" onclick="event.stopPropagation()">
                        <div style="display: flex; gap: 4px; justify-content: center;">
                            <button type="button" class="mac-btn" style="padding: 2px 6px;" title="Editar nota" onclick="editarRemision(${r.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="mac-btn" style="padding: 2px 6px; color: #047857;" title="Imprimir / PDF" onclick="imprimirRemisionDesdeFila(event, ${r.id})">
                                <i class="fas fa-print"></i>
                            </button>
                            <button type="button" class="mac-btn" style="padding: 2px 6px; color: #25D366;" title="WhatsApp" onclick="whatsappRemisionDesdeFila(event, ${r.id})">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                            <button type="button" class="mac-btn" style="padding: 2px 6px; color: #ef4444;" title="Eliminar nota" onclick="clickEliminarRemision(event, ${r.id})">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        actualizarSeleccionadasCount();
    };

    // Actualizar Contador y Botón de Eliminación Múltiple
    window.actualizarSeleccionadasCount = function() {
        const checked = document.querySelectorAll('.rem-row-chk:checked');
        const count = checked.length;
        if (remCountSelected) remCountSelected.textContent = count;
        if (btnRemEliminarSeleccionadas) {
            btnRemEliminarSeleccionadas.style.display = count > 0 ? 'inline-flex' : 'none';
        }
        if (chkSelectAllRem) {
            const all = document.querySelectorAll('.rem-row-chk');
            chkSelectAllRem.checked = all.length > 0 && count === all.length;
        }
    };

    if (chkSelectAllRem) {
        chkSelectAllRem.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.rem-row-chk').forEach(chk => {
                chk.checked = isChecked;
            });
            actualizarSeleccionadasCount();
        });
    }

    // Botón Eliminar Seleccionadas
    if (btnRemEliminarSeleccionadas) {
        btnRemEliminarSeleccionadas.addEventListener('click', () => {
            const checked = document.querySelectorAll('.rem-row-chk:checked');
            const count = checked.length;
            if (count === 0) return;

            if (confirm(`¿Estás seguro de eliminar las ${count} notas de remisión seleccionadas?`)) {
                const idsToDelete = Array.from(checked).map(chk => Number(chk.getAttribute('data-id')));
                remisiones = remisiones.filter(r => !idsToDelete.includes(r.id));
                localStorage.setItem('ga_remisiones', JSON.stringify(remisiones));

                if (idsToDelete.includes(currentEditingRemId)) {
                    currentEditingRemId = null;
                    if (btnRemEliminarActual) btnRemEliminarActual.style.display = 'none';
                }

                updateRemisionesStats();
                renderRemisionesTable();
                alert(`✅ Se eliminaron ${count} notas de remisión correctamente.`);
            }
        });
    }

    // Botón Vaciar Todo el Historial
    if (btnRemVaciarTodo) {
        btnRemVaciarTodo.addEventListener('click', () => {
            if (remisiones.length === 0) {
                alert('No hay notas de remisión para eliminar.');
                return;
            }
            if (confirm(`⚠️ ALERTA DE SEGURIDAD:\n¿Estás completamente seguro de vaciar TODO el historial de notas de remisión (${remisiones.length} registros)?\nEsta acción eliminará las notas del almacenamiento.`)) {
                remisiones = [];
                localStorage.setItem('ga_remisiones', JSON.stringify([]));
                currentEditingRemId = null;
                if (btnRemEliminarActual) btnRemEliminarActual.style.display = 'none';
                updateRemisionesStats();
                renderRemisionesTable();
                alert('✅ El historial de notas de remisión ha sido vaciado.');
            }
        });
    }

    // Búsqueda y Filtro de Historial
    if (remSearchInput) {
        remSearchInput.addEventListener('input', () => renderRemisionesTable());
    }
    if (remFilterStatus) {
        remFilterStatus.addEventListener('change', () => renderRemisionesTable());
    }

    // Inicializar Estadísticas y Badges de Remisión
    updateRemisionesStats();
    cargarCotizacionesRecientesSelect();

    // =====================================================================
    // FIN MÓDULO DE NOTAS DE REMISIÓN
    // =====================================================================

    // Iniciar
    loadData();
});
