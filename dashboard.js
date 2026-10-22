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
    const btnImprimirCotizador = document.getElementById('btnImprimirCotizador');

    let isIvaActive = false;

    function formatMoney(amount) {
        return '$' + Number(amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

        const cantInput = tr.querySelector('.cot-cant-input');
        const precioInput = tr.querySelector('.cot-precio-input');
        const btnDelete = tr.querySelector('.cot-delete-btn');

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
            }
        });
    }

    if (btnCopiarWhatsApp) {
        btnCopiarWhatsApp.addEventListener('click', () => {
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
            msj += `[Datos Bancarios se adjuntarán a continuación]`;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(msj).then(() => {
                    alert('✅ Cotización copiada al portapapeles. ¡Lista para pegar en WhatsApp!');
                }).catch(() => {
                    prompt('Copia tu cotización para WhatsApp:', msj);
                });
            } else {
                prompt('Copia tu cotización para WhatsApp:', msj);
            }
        });
    }

    if (btnImprimirCotizador) {
        btnImprimirCotizador.addEventListener('click', () => {
            window.print();
        });
    }

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
