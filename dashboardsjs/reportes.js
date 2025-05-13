// Módulo de reportes y errores
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined') {
        console.error('Firebase no está definido. Asegúrate de cargar los scripts de Firebase.');
        return;
    }

    // Elementos del DOM
    const reportsContainer = document.querySelector('.reports-container');
    const reportStatusFilter = document.getElementById('report-status-filter');
    const reportTypeFilter = document.getElementById('report-type-filter');
    const reportDateFilter = document.getElementById('report-date-filter');
    
    // Referencias a Firebase
    const db = firebase.firestore();
    const reportsRef = db.collection('reportes');
    
    // Variables de estado
    let currentPage = 1;
    const reportsPerPage = 9;
    
    // Inicializar componentes
    initReportFilters();
    loadReports();
    
    // Inicializar filtros de reportes
    function initReportFilters() {
        if (reportStatusFilter) {
            reportStatusFilter.addEventListener('change', function() {
                currentPage = 1;
                loadReports();
            });
        }
        
        if (reportTypeFilter) {
            reportTypeFilter.addEventListener('change', function() {
                currentPage = 1;
                loadReports();
            });
        }
        
        if (reportDateFilter) {
            reportDateFilter.addEventListener('change', function() {
                currentPage = 1;
                loadReports();
            });
        }
        
        // Paginación
        const prevPageBtn = document.getElementById('prev-report-page-btn');
        const nextPageBtn = document.getElementById('next-report-page-btn');
        
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    loadReports();
                }
            });
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', function() {
                currentPage++;
                loadReports();
            });
        }
        
        // Establecer fecha por defecto (mes actual)
        if (reportDateFilter) {
            const today = new Date();
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const formattedDate = firstDayOfMonth.toISOString().split('T')[0];
            reportDateFilter.value = formattedDate;
        }
    }
    
    // Cargar reportes desde Firestore
    function loadReports() {
        if (!reportsContainer) return;
        
        // Mostrar mensaje de carga
        reportsContainer.innerHTML = '<div class="loading-message">Cargando reportes...</div>';
        
        // Obtener valores de filtros
        const statusFilter = reportStatusFilter ? reportStatusFilter.value : 'all';
        const typeFilter = reportTypeFilter ? reportTypeFilter.value : 'all';
        const dateFilter = reportDateFilter ? reportDateFilter.value : '';
        
        // Construir consulta
        let query = reportsRef.orderBy('createdAt', 'desc');
        
        if (statusFilter !== 'all') {
            query = query.where('status', '==', statusFilter);
        }
        
        if (typeFilter !== 'all') {
            query = query.where('type', '==', typeFilter);
        }
        
        if (dateFilter) {
            const startDate = new Date(dateFilter);
            const endDate = new Date(dateFilter);
            endDate.setMonth(endDate.getMonth() + 1);
            
            query = query.where('createdAt', '>=', startDate)
                         .where('createdAt', '<', endDate);
        }
        
        // Ejecutar consulta
        query.get()
            .then(snapshot => {
                if (snapshot.empty) {
                    reportsContainer.innerHTML = '<div class="empty-message">No se encontraron reportes</div>';
                    updatePagination(0);
                    return;
                }
                
                // Procesar reportes
                const reports = [];
                snapshot.forEach(doc => {
                    const reportData = doc.data();
                    reports.push({
                        id: doc.id,
                        ...reportData
                    });
                });
                
                // Paginación
                const startIndex = (currentPage - 1) * reportsPerPage;
                const endIndex = Math.min(startIndex + reportsPerPage, reports.length);
                const reportsToShow = reports.slice(startIndex, endIndex);
                
                // Actualizar paginación
                updatePagination(reports.length);
                
                // Limpiar contenedor
                reportsContainer.innerHTML = '';
                
                // Mostrar reportes
                reportsToShow.forEach(report => {
                    createReportCard(report);
                });
            })
            .catch(error => {
                console.error('Error al cargar reportes:', error);
                reportsContainer.innerHTML = '<div class="error-message">Error al cargar reportes: ' + error.message + '</div>';
            });
    }
    
    // Crear tarjeta de reporte
    function createReportCard(report) {
        const reportCard = document.createElement('div');
        reportCard.className = 'report-card';
        
        // Convertir timestamp a fecha legible
        const createdDate = report.createdAt ? new Date(report.createdAt.seconds * 1000) : new Date();
        const formattedDate = createdDate.toLocaleDateString() + ' ' + createdDate.toLocaleTimeString();
        
        // Título del reporte
        const reportTitle = report.title || 'Reporte sin título';
        
        // Tipo de reporte
        const reportTypes = {
            'alert': { name: 'Alerta', icon: 'fa-exclamation-circle', class: 'error' },
            'error': { name: 'Error', icon: 'fa-exclamation-triangle', class: 'error' },
            'maintenance': { name: 'Mantenimiento', icon: 'fa-tools', class: 'warning' },
            'info': { name: 'Información', icon: 'fa-info-circle', class: 'info' }
        };
        
        const reportType = reportTypes[report.type] || reportTypes.info;
        
        // Estado del reporte
        const reportStatuses = {
            'pending': { name: 'Pendiente', class: 'pending' },
            'in-progress': { name: 'En Proceso', class: 'in-progress' },
            'completed': { name: 'Resuelto', class: 'completed' }
        };
        
        const reportStatus = reportStatuses[report.status] || reportStatuses.pending;
        
        // Construir HTML de la tarjeta
        reportCard.innerHTML = `
            <div class="report-header">
                <div class="report-type">
                    <div class="report-icon ${reportType.class}">
                        <i class="fas ${reportType.icon}"></i>
                    </div>
                    <span class="report-type-name">${reportType.name}</span>
                </div>
                <div class="report-status ${reportStatus.class}">
                    <span>${reportStatus.name}</span>
                </div>
            </div>
            <div class="report-body">
                <h3 class="report-title">${reportTitle}</h3>
                <div class="report-details">
                    <div class="report-detail">
                        <span class="report-detail-label">Cliente:</span>
                        <span class="report-detail-value">${report.clientName || 'Desconocido'}</span>
                    </div>
                    <div class="report-detail">
                        <span class="report-detail-label">Ubicación:</span>
                        <span class="report-detail-value">${report.locationName || 'N/A'}</span>
                    </div>
                    <div class="report-detail">
                        <span class="report-detail-label">Dispositivo:</span>
                        <span class="report-detail-value">${report.deviceId || 'N/A'}</span>
                    </div>
                </div>
                <p class="report-description">${report.description || 'Sin descripción'}</p>
                <div class="report-footer">
                    <span class="report-date">${formattedDate}</span>
                    <div class="report-actions">
                        <button class="btn-icon edit-status" title="Cambiar Estado" data-id="${report.id}">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="btn-icon info" title="Ver Detalles" data-id="${report.id}">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar event listeners a los botones
        const editStatusBtn = reportCard.querySelector('.edit-status');
        const infoBtn = reportCard.querySelector('.info');
        
        if (editStatusBtn) {
            editStatusBtn.addEventListener('click', function() {
                openStatusModal(report);
            });
        }
        
        if (infoBtn) {
            infoBtn.addEventListener('click', function() {
                openReportDetails(report);
            });
        }
        
        // Agregar tarjeta al contenedor
        reportsContainer.appendChild(reportCard);
    }
    
    // Actualizar paginación
    function updatePagination(totalReports) {
        const totalPages = Math.ceil(totalReports / reportsPerPage);
        const currentPageEl = document.querySelector('.current-page');
        const totalPagesEl = document.querySelector('.total-pages');
        const prevPageBtn = document.getElementById('prev-report-page-btn');
        const nextPageBtn = document.getElementById('next-report-page-btn');
        
        if (currentPageEl) {
            currentPageEl.textContent = currentPage;
        }
        
        if (totalPagesEl) {
            totalPagesEl.textContent = totalPages || 1;
        }
        
        if (prevPageBtn) {
            prevPageBtn.disabled = currentPage <= 1;
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = currentPage >= totalPages;
        }
    }
    
    // Abrir modal para cambiar estado
    function openStatusModal(report) {
        // Crear modal dinámicamente
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'status-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Cambiar Estado del Reporte</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Reporte:</strong> ${report.title}</p>
                    <p><strong>Estado actual:</strong> ${getStatusName(report.status)}</p>
                    
                    <div class="form-group">
                        <label for="new-status">Nuevo Estado:</label>
                        <select id="new-status">
                            <option value="pending" ${report.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                            <option value="in-progress" ${report.status === 'in-progress' ? 'selected' : ''}>En Proceso</option>
                            <option value="completed" ${report.status === 'completed' ? 'selected' : ''}>Resuelto</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="status-note">Nota (opcional):</label>
                        <textarea id="status-note"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary cancel-status-btn">Cancelar</button>
                        <button type="button" class="btn-primary save-status-btn" data-id="${report.id}">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar modal al body
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.cancel-status-btn');
        const saveBtn = modal.querySelector('.save-status-btn');
        
        // Cerrar modal
        function closeModal() {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
        
        // Event listeners para cerrar
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // Click fuera del modal
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        
        // Guardar nuevo estado
        saveBtn.addEventListener('click', function() {
            const newStatus = document.getElementById('new-status').value;
            const note = document.getElementById('status-note').value.trim();
            
            // Actualizar en Firestore
            updateReportStatus(report.id, newStatus, note)
                .then(() => {
                    closeModal();
                    loadReports(); // Recargar reportes
                })
                .catch(error => {
                    console.error('Error al actualizar estado:', error);
                    alert('Error al actualizar estado: ' + error.message);
                });
        });
    }
    
    // Abrir detalles del reporte
    function openReportDetails(report) {
        // Crear modal dinámicamente
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'report-details-modal';
        
        // Convertir timestamp a fecha legible
        const createdDate = report.createdAt ? new Date(report.createdAt.seconds * 1000) : new Date();
        const formattedDate = createdDate.toLocaleDateString() + ' ' + createdDate.toLocaleTimeString();
        
        // Historial de estado
        let statusHistoryHtml = '<p>No hay historial de estados</p>';
        
        if (report.statusHistory && report.statusHistory.length > 0) {
            statusHistoryHtml = '<ul class="status-history">';
            
            report.statusHistory.forEach(item => {
                const itemDate = item.date ? new Date(item.date.seconds * 1000) : new Date();
                const itemFormattedDate = itemDate.toLocaleDateString() + ' ' + itemDate.toLocaleTimeString();
                
                statusHistoryHtml += `
                    <li>
                        <span class="status-history-status">${getStatusName(item.status)}</span>
                        <span class="status-history-date">${itemFormattedDate}</span>
                        ${item.note ? `<p class="status-history-note">${item.note}</p>` : ''}
                    </li>
                `;
            });
            
            statusHistoryHtml += '</ul>';
        }
        
        // HTML del modal
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalles del Reporte</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="report-details-section">
                        <h4>Información General</h4>
                        <div class="detail-row">
                            <div class="detail-label">Título:</div>
                            <div class="detail-value">${report.title || 'Sin título'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Tipo:</div>
                            <div class="detail-value">${getTypeName(report.type)}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Estado:</div>
                            <div class="detail-value">${getStatusName(report.status)}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Fecha:</div>
                            <div class="detail-value">${formattedDate}</div>
                        </div>
                    </div>
                    
                    <div class="report-details-section">
                        <h4>Cliente y Ubicación</h4>
                        <div class="detail-row">
                            <div class="detail-label">Cliente:</div>
                            <div class="detail-value">${report.clientName || 'Desconocido'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Email:</div>
                            <div class="detail-value">${report.clientEmail || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Ubicación:</div>
                            <div class="detail-value">${report.locationName || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Dispositivo:</div>
                            <div class="detail-value">${report.deviceId || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="report-details-section">
                        <h4>Descripción</h4>
                        <div class="report-full-description">
                            ${report.description || 'Sin descripción'}
                        </div>
                    </div>
                    
                    <div class="report-details-section">
                        <h4>Historial de Estados</h4>
                        ${statusHistoryHtml}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary close-details-btn">Cerrar</button>
                    <button class="btn-primary edit-status-btn" data-id="${report.id}">Cambiar Estado</button>
                </div>
            </div>
        `;
        
        // Agregar modal al body
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const closeDetailsBtn = modal.querySelector('.close-details-btn');
        const editStatusBtn = modal.querySelector('.edit-status-btn');
        
        // Cerrar modal
        function closeModal() {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
        
        // Event listeners para cerrar
        closeBtn.addEventListener('click', closeModal);
        closeDetailsBtn.addEventListener('click', closeModal);
        
        // Click fuera del modal
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        
        // Botón para cambiar estado
        editStatusBtn.addEventListener('click', function() {
            closeModal();
            openStatusModal(report);
        });
    }
    
   // Actualizar estado de un reporte
// Función para actualizar el estado de una ubicación basado en reportes
function updateLocationStatusBasedOnReports(locationId) {
    console.log('Actualizando estado de ubicación', locationId);
    
    // Verificar que exista el ID de la ubicación
    if (!locationId) {
        console.error('ID de ubicación no proporcionado');
        return Promise.reject('ID de ubicación no proporcionado');
    }
    
    // Buscar reportes activos para esta ubicación
    return db.collection('reportes')
        .where('locationId', '==', locationId)
        .where('status', 'in', ['pending', 'in-progress'])
        .get()
        .then(snapshot => {
            // Determinar el nuevo estado basado en reportes
            let newStatus = 'active'; // estado predeterminado
            
            // Si hay reportes pendientes o en proceso, cambiar estado
            if (!snapshot.empty) {
                // Verificar si hay reportes de tipo error o alerta
                let hasErrorReports = false;
                let hasPendingReports = false;
                
                snapshot.forEach(doc => {
                    const reportData = doc.data();
                    
                    if (reportData.type === 'error' || reportData.type === 'alert') {
                        hasErrorReports = true;
                    }
                    
                    if (reportData.status === 'pending') {
                        hasPendingReports = true;
                    }
                });
                
                // Determinar estado según prioridad: error > pending > active
                if (hasErrorReports) {
                    newStatus = 'error';
                } else if (hasPendingReports) {
                    newStatus = 'pending';
                }
            }
            
            // Actualizar estado de la ubicación
            return db.collection('ubicaciones').doc(locationId).update({
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            console.log('Estado de ubicación actualizado correctamente');
            // Recargar ubicaciones para actualizar mapa
            if (typeof loadLocations === 'function') {
                loadLocations();
            }
            return true;
        })
        .catch(error => {
            console.error('Error al actualizar estado de ubicación:', error);
            return Promise.reject(error);
        });
}

// Modificar la función updateReportStatus para que también actualice la ubicación
function updateReportStatus(reportId, newStatus, note) {
    // Obtener reporte actual
    return reportsRef.doc(reportId).get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('El reporte no existe');
            }
            
            const reportData = doc.data();
            let locationId = reportData.locationId;
            
            // Crear entrada para historial
            const statusEntry = {
                status: newStatus,
                date: new Date(), // Usar Date normal en lugar de ServerTimestamp
                note: note || ''
            };
            
            // Actualizar historial
            let statusHistory = reportData.statusHistory || [];
            statusHistory.push(statusEntry);
            
            // Actualizar reporte
            return reportsRef.doc(reportId).update({
                status: newStatus,
                statusHistory: statusHistory,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                // Si tiene una ubicación asociada, actualizar su estado
                if (locationId) {
                    return updateLocationStatusBasedOnReports(locationId);
                }
                return Promise.resolve();
            });
        });
}
    // Obtener nombre de estado
    function getStatusName(status) {
        const statuses = {
            'pending': 'Pendiente',
            'in-progress': 'En Proceso',
            'completed': 'Resuelto'
        };
        
        return statuses[status] || 'Desconocido';
    }
    // Agregar esta función para vincular explícitamente los reportes con el mapa
// Colocar al final de reportes.js

// Función global para actualizar el mapa desde cualquier parte de la aplicación
window.updateMapAfterReportChange = function(locationId) {
    console.log('Actualizando mapa después de cambio en reporte para ubicación:', locationId);
    
    // Si no hay ID de ubicación, no hay nada que actualizar
    if (!locationId) {
        console.log('No hay ID de ubicación para actualizar');
        return;
    }
    
    // Buscar todos los reportes activos para esta ubicación
    db.collection('reportes')
        .where('locationId', '==', locationId)
        .where('status', 'in', ['pending', 'in-progress'])
        .get()
        .then(snapshot => {
            // Determinar el estado basado en los reportes
            let newStatus = 'active'; // Por defecto, activo (verde)
            
            if (!snapshot.empty) {
                let hasErrorReports = false;
                
                snapshot.forEach(doc => {
                    const reportData = doc.data();
                    
                    // Si hay algún reporte de error o alerta, marcar como error
                    if (reportData.type === 'error' || reportData.type === 'alert') {
                        hasErrorReports = true;
                    }
                });
                
                // Priorizar errores sobre pendientes
                if (hasErrorReports) {
                    newStatus = 'error'; // Rojo
                } else {
                    newStatus = 'pending'; // Amarillo
                }
            }
            
            // Actualizar estado de la ubicación
            return db.collection('ubicaciones').doc(locationId).update({
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            console.log('Estado de ubicación actualizado a:', newStatus);
            
            // Intentar recargar el mapa si estamos en la página de ubicaciones
            if (document.getElementById('locations-section').classList.contains('active')) {
                console.log('Recargando mapa en sección de ubicaciones');
                
                // Si la función loadLocations existe en el ámbito global, llamarla
                if (typeof window.loadLocations === 'function') {
                    window.loadLocations();
                } else {
                    console.log('Función loadLocations no encontrada en ámbito global');
                    
                    // Intentar buscar la instancia del mapa y recargar marcadores
                    if (window.map) {
                        console.log('Invalidando tamaño del mapa');
                        window.map.invalidateSize();
                        
                        // Si hay una función de limpieza de marcadores, usarla
                        if (typeof window.clearMarkers === 'function') {
                            window.clearMarkers();
                        }
                    }
                }
            } else {
                console.log('No estamos en la sección de ubicaciones, no es necesario recargar el mapa');
            }
        })
        .catch(error => {
            console.error('Error al actualizar estado de ubicación en el mapa:', error);
        });
};

// Modificar updateReportStatus para que use la nueva función global
function updateReportStatus(reportId, newStatus, note) {
    console.log('Actualizando estado de reporte:', reportId, 'a', newStatus);
    
    // Obtener reporte actual
    return reportsRef.doc(reportId).get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('El reporte no existe');
            }
            
            const reportData = doc.data();
            const locationId = reportData.locationId;
            
            // Crear entrada para historial
            const statusEntry = {
                status: newStatus,
                date: new Date(),
                note: note || ''
            };
            
            // Actualizar historial
            let statusHistory = reportData.statusHistory || [];
            statusHistory.push(statusEntry);
            
            // Actualizar reporte
            return reportsRef.doc(reportId).update({
                status: newStatus,
                statusHistory: statusHistory,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                // Después de actualizar el reporte, actualizar el mapa si hay ubicación asociada
                if (locationId) {
                    console.log('Reporte actualizado, actualizando mapa para ubicación:', locationId);
                    
                    // Usar la función global para actualizar el mapa
                    window.updateMapAfterReportChange(locationId);
                } else {
                    console.log('Reporte no tiene ubicación asociada, no se actualiza el mapa');
                }
                
                // Recargar reportes para mostrar los cambios
                loadReports();
                
                return Promise.resolve();
            });
        });
}
   
});
// Mejora a la función updateReportStatus para integrar notificaciones
// Agregar esta versión al final de reportes.js

// Actualizar estado de un reporte con notificaciones
function updateReportStatus(reportId, newStatus, note) {
    console.log('Actualizando estado de reporte:', reportId, 'a', newStatus);
    
    if (!reportId || !newStatus) {
        console.error('ID de reporte o nuevo estado no proporcionados');
        return Promise.reject('Datos incompletos');
    }
    
    // Obtener reporte actual
    return reportsRef.doc(reportId).get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('El reporte no existe');
            }
            
            const reportData = doc.data();
            const clientId = reportData.clientId;
            
            // Si el estado ya es el mismo, no hacer nada
            if (reportData.status === newStatus) {
                console.log('El reporte ya tiene el estado:', newStatus);
                return Promise.resolve();
            }
            
            // Crear entrada para historial
            const statusEntry = {
                status: newStatus,
                date: new Date(), // Usar Date normal en lugar de ServerTimestamp
                note: note || ''
            };
            
            // Actualizar historial
            let statusHistory = reportData.statusHistory || [];
            statusHistory.push(statusEntry);
            
            // Actualizar reporte
            return reportsRef.doc(reportId).update({
                status: newStatus,
                statusHistory: statusHistory,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                // Notificar al cliente sobre el cambio de estado
                if (clientId && typeof window.notifyReportStatusChanged === 'function') {
                    console.log('Enviando notificación al cliente:', clientId);
                    return window.notifyReportStatusChanged(reportId, newStatus, clientId);
                } else {
                    console.log('No se pudo notificar al cliente. ID:', clientId);
                    return Promise.resolve();
                }
            }).then(() => {
                // Actualizar ubicación si existe
                const locationId = reportData.locationId;
                if (locationId) {
                    console.log('Actualizando ubicación:', locationId);
                    return updateLocationStatus(locationId, reportData.type, newStatus);
                }
                return Promise.resolve();
            }).then(() => {
                // Recargar lista de reportes
                loadReports();
                
                // Mostrar mensaje de éxito
                showToast('Éxito', 'Estado del reporte actualizado correctamente', 'success');
                
                return Promise.resolve();
            });
        })
        .catch(error => {
            console.error('Error al actualizar estado del reporte:', error);
            showToast('Error', 'No se pudo actualizar el reporte: ' + error.message, 'error');
            return Promise.reject(error);
        });
}

// Función específica para actualizar el estado de una ubicación basado en un reporte
function updateLocationStatus(locationId, reportType, reportStatus) {
    console.log('Actualizando estado de ubicación:', locationId, 'basado en reporte tipo:', reportType, 'estado:', reportStatus);
    
    if (!locationId) {
        return Promise.resolve(); // No hay ubicación para actualizar
    }
    
    // Si el reporte se completó, verificar si hay otros reportes activos
    if (reportStatus === 'completed') {
        return checkActiveReportsForLocation(locationId);
    } else {
        // Para reportes activos, actualizar según tipo
        let newLocationStatus = 'active';
        
        if (reportType === 'error' || reportType === 'alert') {
            newLocationStatus = 'error';
        } else if (reportStatus === 'pending') {
            newLocationStatus = 'pending';
        }
        
        return db.collection('ubicaciones').doc(locationId).update({
            status: newLocationStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('Estado de ubicación actualizado a:', newLocationStatus);
            triggerMapUpdate();
            return Promise.resolve();
        }).catch(error => {
            console.error('Error al actualizar ubicación:', error);
            return Promise.reject(error);
        });
    }
}

// Verificar si hay reportes activos para una ubicación
function checkActiveReportsForLocation(locationId) {
    return db.collection('reportes')
        .where('locationId', '==', locationId)
        .where('status', 'in', ['pending', 'in-progress'])
        .get()
        .then(snapshot => {
            // Determinar nuevo estado basado en reportes activos
            let newStatus = 'active'; // Por defecto, si no hay reportes activos
            
            if (!snapshot.empty) {
                let hasErrorReports = false;
                let hasPendingReports = false;
                
                snapshot.forEach(doc => {
                    const reportData = doc.data();
                    
                    if (reportData.type === 'error' || reportData.type === 'alert') {
                        hasErrorReports = true;
                    }
                    
                    if (reportData.status === 'pending') {
                        hasPendingReports = true;
                    }
                });
                
                if (hasErrorReports) {
                    newStatus = 'error';
                } else if (hasPendingReports) {
                    newStatus = 'pending';
                }
            }
            
            // Actualizar estado de la ubicación
            return db.collection('ubicaciones').doc(locationId).update({
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log('Estado de ubicación actualizado a:', newStatus, 'basado en reportes activos');
                triggerMapUpdate();
                return Promise.resolve();
            });
        })
        .catch(error => {
            console.error('Error al verificar reportes activos:', error);
            return Promise.reject(error);
        });
}

// Función para intentar actualizar el mapa si está disponible
function triggerMapUpdate() {
    // Si estamos en la sección de ubicaciones, intentar recargar el mapa
    const locationsSection = document.getElementById('locations-section');
    
    if (locationsSection && locationsSection.classList.contains('active')) {
        console.log('Intentando recargar mapa...');
        
        // Intentar diferentes formas de recargar el mapa
        if (typeof window.loadLocations === 'function') {
            console.log('Usando función global loadLocations');
            window.loadLocations();
        } else if (typeof loadLocations === 'function') {
            console.log('Usando función local loadLocations');
            loadLocations();
        } else {
            console.log('Función loadLocations no encontrada, intentando invalidar mapa');
            
            // Si el mapa está accesible, invalidar su tamaño para forzar actualización
            if (window.map) {
                window.map.invalidateSize();
            }
        }
    } else {
        console.log('No estamos en la sección de ubicaciones, no es necesario actualizar el mapa');
    }
}

// Asegurar que showToast esté disponible
function showToast(title, message, type = 'info') {
    // Si existe la función global, usarla
    if (typeof window.showToast === 'function') {
        window.showToast(title, message, type);
    } else {
        // Implementación básica de fallback
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        
        // Solo mostrar alerta para errores para no interrumpir demasiado
        if (type === 'error') {
            alert(`${title}: ${message}`);
        }
    }
}
// Implementación de actualizaciones en tiempo real para reportes
// Agregar al final de dashboardsjs/reportes.js (dashboard admin)

// Variables globales para controlar suscripciones
let reportSubscriptions = [];

// Función para inicializar actualizaciones en tiempo real
function initRealtimeReports() {
    console.log('Inicializando actualizaciones en tiempo real para reportes');
    
    // Limpiar suscripciones anteriores
    clearReportSubscriptions();
    
    // Obtener elementos necesarios para controlar estado
    const reportsContainer = document.querySelector('.reports-container');
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-message';
    loadingMessage.textContent = 'Conectando a actualizaciones en tiempo real...';
    
    // Mostrar mensaje mientras se establece la conexión
    if (reportsContainer) {
        reportsContainer.innerHTML = '';
        reportsContainer.appendChild(loadingMessage);
    }
    
    // Obtener filtros actuales
    const statusFilter = document.getElementById('report-status-filter') ? 
                        document.getElementById('report-status-filter').value : 'all';
    const typeFilter = document.getElementById('report-type-filter') ? 
                      document.getElementById('report-type-filter').value : 'all';
    
    // Construir consulta base
    let query = db.collection('reportes')
                 .orderBy('createdAt', 'desc');
    
    // Aplicar filtros adicionales si se seleccionaron
    if (statusFilter !== 'all') {
        query = query.where('status', '==', statusFilter);
    }
    
    if (typeFilter !== 'all') {
        query = query.where('type', '==', typeFilter);
    }
    
    // Suscribirse a cambios en tiempo real
    const subscription = query.onSnapshot(snapshot => {
        // Actualizar contenedor solo si existe
        if (!reportsContainer) return;
        
        // Verificar si hay cambios
        if (snapshot.empty) {
            reportsContainer.innerHTML = '<div class="empty-message">No se encontraron reportes</div>';
            return;
        }
        
        // Mostrar reportes
        reportsContainer.innerHTML = '';
        
        // Almacenar reportes para paginación
        const reports = [];
        snapshot.forEach(doc => {
            reports.push({
                id: doc.id,
                data: doc.data()
            });
        });
        
        // Actualizar paginación
        updatePagination(reports.length);
        
        // Obtener reportes para la página actual
        const startIndex = (currentPage - 1) * reportsPerPage;
        const endIndex = Math.min(startIndex + reportsPerPage, reports.length);
        const reportsToShow = reports.slice(startIndex, endIndex);
        
        // Crear tarjetas para cada reporte
        reportsToShow.forEach(report => {
            createReportCard(report.id, report.data);
        });
        
        // Mostrar notificación si hubo cambios (excepto la primera carga)
        if (!snapshot.metadata.hasPendingWrites && snapshot.docChanges().length > 0) {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added' && !change.doc.metadata.hasPendingWrites) {
                    // Nuevo reporte
                    showToast('Nuevo reporte', 'Se ha recibido un nuevo reporte', 'info');
                } else if (change.type === 'modified') {
                    // Reporte actualizado
                    showToast('Reporte actualizado', 'Un reporte ha sido actualizado', 'info');
                }
            });
        }
    }, error => {
        console.error('Error en actualizaciones en tiempo real:', error);
        if (reportsContainer) {
            reportsContainer.innerHTML = '<div class="error-message">Error al conectar actualizaciones en tiempo real: ' + error.message + '</div>';
        }
    });
    
    // Guardar suscripción para limpiarla después
    reportSubscriptions.push(subscription);
}

// Función para limpiar suscripciones
function clearReportSubscriptions() {
    reportSubscriptions.forEach(subscription => {
        subscription();
    });
    reportSubscriptions = [];
}

// Modificar función de carga de reportes
const originalLoadReports = loadReports;
loadReports = function() {
    // Si estamos en modo tiempo real, no es necesario cargar manualmente
    if (reportSubscriptions.length > 0) {
        return;
    }
    
    // Usar la función original para la primera carga
    return originalLoadReports.apply(this, arguments);
};

// Inicializar sistema de tiempo real
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de reportes
    const reportsSection = document.getElementById('reports-section');
    if (!reportsSection) return;
    
    // Cuando el usuario cambie a la sección de reportes
    document.querySelectorAll('a[data-section="reports"]').forEach(link => {
        link.addEventListener('click', function() {
            setTimeout(initRealtimeReports, 500);
        });
    });
    
    // Si la sección de reportes ya está activa, inicializar
    if (reportsSection.classList.contains('active')) {
        setTimeout(initRealtimeReports, 500);
    }
    
    // Manejar cambios de filtros
    const filterElements = [
        document.getElementById('report-status-filter'),
        document.getElementById('report-type-filter'),
        document.getElementById('report-date-filter')
    ];
    
    filterElements.forEach(element => {
        if (element) {
            element.addEventListener('change', function() {
                // Al cambiar filtros, reiniciar conexión en tiempo real
                setTimeout(initRealtimeReports, 100);
            });
        }
    });
});