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
    function updateReportStatus(reportId, newStatus, note) {
        // Obtener reporte actual
        return reportsRef.doc(reportId).get()
            .then(doc => {
                if (!doc.exists) {
                    throw new Error('El reporte no existe');
                }
                
                const reportData = doc.data();
                
                // Crear entrada para historial
                const statusEntry = {
                    status: newStatus,
                    date: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                if (note) {
                    statusEntry.note = note;
                }
                
                // Actualizar historial
                let statusHistory = reportData.statusHistory || [];
                statusHistory.push(statusEntry);
                
                // Actualizar reporte
                return reportsRef.doc(reportId).update({
                    status: newStatus,
                    statusHistory: statusHistory,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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
    
    // Obtener nombre de tipo
    function getTypeName(type) {
        const types = {
            'alert': 'Alerta',
            'error': 'Error',
            'maintenance': 'Mantenimiento',
            'info': 'Información'
        };
        
        return types[type] || 'Desconocido';
    }
    
    // Crear reportes de prueba (solo para desarrollo)
    function createSampleReports() {
        // Solo ejecutar si no hay reportes
        reportsRef.limit(1).get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    console.log('Ya existen reportes en la base de datos');
                    return;
                }
                
                // Crear 10 reportes de ejemplo
                const sampleReports = [
                    {
                        title: 'Alarma disparada',
                        type: 'alert',
                        status: 'pending',
                        description: 'La alarma se ha disparado sin causa aparente.',
                        clientId: 'client1',
                        clientName: 'Juan Pérez',
                        clientEmail: 'juan@example.com',
                        locationName: 'Residencia Principal',
                        deviceId: 'ALARM-001',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    },
                    {
                        title: 'Cámara fuera de línea',
                        type: 'error',
                        status: 'in-progress',
                        description: 'La cámara del jardín trasero no está respondiendo.',
                        clientId: 'client2',
                        clientName: 'María López',
                        clientEmail: 'maria@example.com',
                        locationName: 'Casa de Playa',
                        deviceId: 'CAM-007',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    },
                    {
                        title: 'Solicitud de mantenimiento',
                        type: 'maintenance',
                        status: 'completed',
                        description: 'Se requiere mantenimiento preventivo del sistema.',
                        clientId: 'client3',
                        clientName: 'Carlos Ruiz',
                        clientEmail: 'carlos@example.com',
                        locationName: 'Oficina Central',
                        deviceId: 'SYS-123',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        statusHistory: [
                            {
                                status: 'pending',
                                date: new Date(Date.now() - 48 * 60 * 60 * 1000)
                            },
                            {
                                status: 'in-progress',
                                date: new Date(Date.now() - 24 * 60 * 60 * 1000),
                                note: 'Programada visita técnica'
                            },
                            {
                                status: 'completed',
                                date: new Date(),
                                note: 'Mantenimiento realizado correctamente'
                            }
                        ]
                    }
                ];
                
                // Crear batch para procesamiento por lotes
                const batch = db.batch();
                
                // Añadir reportes al batch
                sampleReports.forEach(report => {
                    const newReportRef = reportsRef.doc();
                    batch.set(newReportRef, report);
                });
                
                // Ejecutar batch
                return batch.commit();
            })
            .then(() => {
                console.log('Reportes de ejemplo creados correctamente');
                loadReports(); // Recargar reportes
            })
            .catch(error => {
                console.error('Error al crear reportes de ejemplo:', error);
            });
    }
    
    // Botón para crear reportes de prueba (solo para desarrollo)
    const createSamplesBtn = document.getElementById('create-sample-reports');
    if (createSamplesBtn) {
        createSamplesBtn.addEventListener('click', createSampleReports);
    }
});