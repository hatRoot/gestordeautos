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
                if (cotizadorView) cotizadorView.style.display = 'none';
                liberacionesView.style.display = 'block';
                if (filterPills) filterPills.style.display = 'flex';
                viewTitleH2.textContent = 'Liberaciones en Módulo';
                viewSubtitle.textContent = 'Gestión y control de trámites de liberación y estatus en módulo.';
                btnNewItem.style.display = 'inline-flex';
                await loadData();
            } else if (menu === 'cotizador') {
                liberacionesView.style.display = 'none';
                if (filterPills) filterPills.style.display = 'none';
                btnNewItem.style.display = 'none';
                if (cotizadorView) cotizadorView.style.display = 'flex';
                viewTitleH2.textContent = 'Cotizador Vehicular';
                viewSubtitle.textContent = 'Generador de presupuestos para clientes y empresas con desglose y datos bancarios.';
                actualizarVistaPreviaCarta(false);
            } else {
                // Otros módulos demostrativos
                if (cotizadorView) cotizadorView.style.display = 'none';
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
    const cotSubtotalText = document.getElementById('cotSubtotalText');
    const cotIvaRow = document.getElementById('cotIvaRow');
    const cotIvaText = document.getElementById('cotIvaText');
    const cotTotalText = document.getElementById('cotTotalText');
    const btnLimpiarCotizador = document.getElementById('btnLimpiarCotizador');
    const btnCopiarWhatsApp = document.getElementById('btnCopiarWhatsApp');
    const cotFolioInput = document.getElementById('cotFolio');
    const btnGenFolio = document.getElementById('btnGenFolio');
    const cotFechaInput = document.getElementById('cotFecha');
    const btnGenerarPdf = document.getElementById('btnGenerarPdf');
    const btnImprimirCotizador = document.getElementById('btnImprimirCotizador'); // Fallback si existiera

    let isIvaActive = false;
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

        // Enlace de validación oficial por WhatsApp con todos los datos reales y actualizados
        let qrMsg = `Hola Gestor de Autos, solicito validar la cotización Folio: *${folio}*\n`;
        qrMsg += `*Cliente:* ${cliente}\n`;
        qrMsg += `*Vehículo:* ${vehiculoStr}`;
        if (vin) qrMsg += ` (VIN: ${vin})`;
        qrMsg += `\n*Total a Liquidar:* ${cleanTotal}\n`;
        qrMsg += `*Vigencia:* 24 Horas\n`;
        qrMsg += `*Código de Validación:* ${currentSecurityHash}\n`;
        qrMsg += `🌐 www.GestorDeAutos.com.mx`;

        const qrUrl = `https://wa.me/525535757364?text=${encodeURIComponent(qrMsg)}`;

        // Renderizar en la vista previa del tercio derecho (1/3)
        renderQr('prevQrCode', qrUrl, 52);

        // Renderizar en el documento imprimible PDF
        renderQr('pdfQrCode', qrUrl, 75);
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

        // Elementos del mini sheet (1/3)
        const prevFolio = document.getElementById('prevFolio');
        const prevFecha = document.getElementById('prevFecha');
        const prevCliente = document.getElementById('prevCliente');
        const prevVehiculo = document.getElementById('prevVehiculo');
        const prevVin = document.getElementById('prevVin');
        const prevGestor = document.getElementById('prevGestor');

        if (prevFolio) prevFolio.textContent = folio;
        if (prevFecha) prevFecha.textContent = fechaFormateada;
        if (prevCliente) prevCliente.textContent = cliente;
        if (prevVehiculo) prevVehiculo.textContent = vehiculoStr;
        if (prevVin) prevVin.textContent = vin;
        if (prevGestor) prevGestor.textContent = gestor;

        // Tabla de conceptos miniatura
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
    ['cotCliente', 'cotSerie', 'cotMarca', 'cotModelo', 'cotAnio', 'cotGestor', 'cotFecha'].forEach(id => {
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

        // Sincronizar en tiempo real con la hoja carta (1/3)
        actualizarVistaPreviaCarta(true);
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

                if (conceptosBody) {
                    conceptosBody.innerHTML = '';
                    agregarFilaConcepto('', 1, '');
                }

                if (isIvaActive && btnToggleIva) {
                    btnToggleIva.click();
                } else {
                    recalcularTotales();
                }
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

        const vehiculoStr = [marca, modelo].filter(Boolean).join(' ') || 'Vehículo sin especificar';

        // Inyectar datos en la plantilla de impresión
        const pdfFolioDisplay = document.getElementById('pdfFolioDisplay');
        const pdfFechaDisplay = document.getElementById('pdfFechaDisplay');
        const pdfGestorDisplay = document.getElementById('pdfGestorDisplay');
        const pdfClienteDisplay = document.getElementById('pdfClienteDisplay');
        const pdfVehiculoDisplay = document.getElementById('pdfVehiculoDisplay');
        const pdfVinDisplay = document.getElementById('pdfVinDisplay');
        const pdfAnioDisplay = document.getElementById('pdfAnioDisplay');

        if (pdfFolioDisplay) pdfFolioDisplay.textContent = folio;
        if (pdfFechaDisplay) pdfFechaDisplay.textContent = fechaFormateada;
        if (pdfGestorDisplay) pdfGestorDisplay.textContent = gestor;
        if (pdfClienteDisplay) pdfClienteDisplay.textContent = cliente;
        if (pdfVehiculoDisplay) pdfVehiculoDisplay.textContent = vehiculoStr;
        if (pdfVinDisplay) pdfVinDisplay.textContent = vin;
        if (pdfAnioDisplay) pdfAnioDisplay.textContent = anio || 'No especificado';

        const pdfSignName = document.getElementById('pdfSignName');
        if (pdfSignName) pdfSignName.textContent = gestor;

        // Inyectar tabla de conceptos clonada
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

        // Asegurar que el QR impreso esté sincronizado con el folio y total
        actualizarQr(folio, cotTotalText ? cotTotalText.textContent : '$0.00');

        return { folio, cliente };
    }

    // Botón Generar PDF
    if (btnGenerarPdf) {
        btnGenerarPdf.addEventListener('click', () => {
            const { folio, cliente } = prepararDocumentoPdf();
            const origTitle = document.title;
            const cleanClient = cliente.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_').substring(0, 30);
            document.title = `Cotizacion_${folio}_${cleanClient}`;
            
            // Garantizar que el navegador procese los cambios del DOM antes de abrir el modal de impresión
            setTimeout(() => {
                window.print();
                setTimeout(() => {
                    document.title = origTitle;
                }, 1000);
            }, 60);
        });
    }

    // Compatibilidad si aún se llama a imprimir directamente
    if (btnImprimirCotizador) {
        btnImprimirCotizador.addEventListener('click', () => {
            prepararDocumentoPdf();
            window.print();
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
            msj += `─────────────────────────\n`;
            msj += `*CONCEPTOS:*\n${conceptosTexto || '• Trámite vehicular\n'}`;
            msj += `─────────────────────────\n`;
            msj += `*Subtotal:* ${subtotal}\n`;
            if (isIvaActive) {
                const iva = cotIvaText ? cotIvaText.textContent : '$0.00';
                msj += `*IVA (16%):* ${iva}\n`;
            }
            msj += `*TOTAL A LIQUIDAR:* ${total}\n`;
            msj += `─────────────────────────\n`;
            msj += `*ESTATUS LEGAL:* 100% oficial y verificable en portal del gobierno.\n`;
            msj += `─────────────────────────\n`;
            msj += `🏦 *DATOS BANCARIOS PARA PAGO (BBVA):*\n`;
            msj += `• *Titular:* Joel Emmanuel Duran Mendoza\n`;
            msj += `• *Banco:* BBVA México\n`;
            msj += `• *CLABE (SPEI):* 012180015766935846\n`;
            msj += `• *Cuenta BBVA:* 1576693584\n`;
            msj += `• *Tarjeta Débito (OXXO/7-Eleven):* 4152314669183751\n`;
            msj += `• *Celular Vinculado (Dimo/SPEI):* 55 3575 7364\n`;
            msj += `─────────────────────────\n`;
            msj += `*Favor de enviar tu comprobante de pago por este chat para procesar tu trámite.*\n`;
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

    // Iniciar
    loadData();
});
