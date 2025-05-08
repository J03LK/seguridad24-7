// reportes.js - Gestión de reportes del cliente

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const reportsContainer = document.getElementById('reports-container');
    const addReportBtn = document.getElementById('add-report-btn');
    const reportModal = document.getElementById('report-modal');
    const reportForm = document.getElementById('report-form');
    const reportStatusFilter = document.getElementById('report-status-filter');
    const reportTypeFilter = document.getElementById('report-type-filter');
    const reportDateFilter = document.getElementById('report-date-filter');
    const saveReportBtn = document.getElementById('save-report-btn');
    const reportImageInput = document.getElementById('report-image');
    const reportImagePreview = document.getElementById('report-image-preview');
    const reportDeviceSelect = document.getElementById('report-device');
    
    // Variables de estado
    let currentPage = 1;
    const reportsPerPage = 6;
    let editingReportId = null;
    let totalPages = 1;
    
    // Inicializar fecha por defecto para el filtro (mes actual)
    if (reportDateFilter) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const formattedDate = firstDayOfMonth.toISOString().split('T')[0];
        reportDateFilter.value = formattedDate;
    }
    
    // Verificar autenticación y cargar datos
    auth.onAuthStateChanged(user => {
        if (user) {
            initReportSystem(user.uid);
        }
    });
    
    // Inicializar sistema de reportes
    function initReportSystem(userId) {
        // Cargar dispositivos del usuario para el selector
        loadUserDevices(userId);
        
        // Cargar reportes iniciales
        loadReports(userId);
        
        // Inicializar filtros
        initFilters(userId);
        
        // Inicializar modal y formulario
        initReportForm(userId);
        
        // Inicializar paginación
        initPagination(userId);
    }
    
    // Cargar dispositivos del usuario
    async function loadUserDevices(userId) {
        if (!reportDeviceSelect) return;
        
        try {
            // Mostrar estado de carga
            reportDeviceSelect.innerHTML = '<option value="">Cargando dispositivos...</option>';
            
            // Consultar dispositivos del usuario
            const snapshot = await db.collection('dispositivos')
                .where('clientId', '==', userId)
                .get();
            
            // Reiniciar selector
            reportDeviceSelect.innerHTML = '<option value="">Seleccionar dispositivo</option>';
            
            // Si no hay dispositivos
            if (snapshot.empty) {
                reportDeviceSelect.innerHTML += '<option value="" disabled>No hay dispositivos registrados</option>';
                return;
            }
            
            // Agregar cada dispositivo al selector
            snapshot.forEach(doc => {
                const deviceData = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = deviceData.name || `Dispositivo ${doc.id.substring(0, 8)}`;
                reportDeviceSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error al cargar dispositivos:', error);
            reportDeviceSelect.innerHTML = '<option value="" disabled>Error al cargar dispositivos</option>';
        }
    }
    
    // Inicializar filtros
    function initFilters(userId) {
        // Filtro de estado
        if (reportStatusFilter) {
            reportStatusFilter.addEventListener('change', function() {
                currentPage = 1;
                loadReports(userId);
            });
        }
        
        // Filtro de tipo
        if (reportTypeFilter) {
            reportTypeFilter.addEventListener('change', function() {
                currentPage = 1;
                loadReports(userId);
            });
        }
        
        // Filtro de fecha
        if (reportDateFilter) {
            reportDateFilter.addEventListener('change', function() {
                currentPage = 1;
                loadReports(userId);
            });
        }
    }
    
    // Inicializar paginación
    function initPagination(userId) {
        const prevPageBtn = document.getElementById('prev-report-page-btn');
        const nextPageBtn = document.getElementById('next-report-page-btn');
        
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    loadReports(userId);
                }
            });
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', function() {
                if (currentPage < totalPages) {
                    currentPage++;
                    loadReports(userId);
                }
            });
        }
    }
    
    // Cargar reportes desde Firestore
    async function loadReports(userId) {
        if (!reportsContainer) return;
        
        // Mostrar mensaje de carga
        reportsContainer.innerHTML = '<div class="loading-message">Cargando reportes...</div>';
        
        try {
            // Obtener valores de filtros
            const statusFilter = reportStatusFilter ? reportStatusFilter.value : 'all';
            const typeFilter = reportTypeFilter ? reportTypeFilter.value : 'all';
            const dateFilter = reportDateFilter ? reportDateFilter.value : '';
            
            // Construir consulta base
            let query = db.collection('reportes')
                .where('clientId', '==', userId)
                .orderBy('createdAt', 'desc');
            
            // Aplicar filtros adicionales
            if (statusFilter !== 'all') {
                query = query.where('status', '==', statusFilter);
            }
            
            if (typeFilter !== 'all') {
                query = query.where('type', '==', typeFilter);
            }
            
            // Para filtro de fecha, es mejor obtener todos y filtrar en el cliente
            // porque Firestore no permite múltiples condiciones de rango en la misma consulta
            const snapshot = await query.get();
            
            // Filtrar por fecha si es necesario
            let reports = [];
            snapshot.forEach(doc => {
                const reportData = doc.data();
                
                // Si hay filtro de fecha, verificar
                if (dateFilter) {
                    const startDate = new Date(dateFilter);
                    const endDate = new Date(dateFilter);
                    endDate.setMonth(endDate.getMonth() + 1);
                    
                    if (reportData.createdAt) {
                        const reportDate = reportData.createdAt.toDate ? 
                                        reportData.createdAt.toDate() : 
                                        new Date(reportData.createdAt);
                        
                        // Si la fecha no está en el rango, omitir
                        if (reportDate < startDate || reportDate >= endDate) {
                            return;
                        }
                    }
                }
                
                // Agregar reporte a la lista
                reports.push({
                    id: doc.id,
                    data: reportData
                });
            });
            
            // Manejar caso de no resultados
            if (reports.length === 0) {
                reportsContainer.innerHTML = '<div class="empty-message">No se encontraron reportes</div>';
                updatePagination(0);
                return;
            }
            
            // Calcular paginación
            totalPages = Math.ceil(reports.length / reportsPerPage);
            
            // Obtener reportes para la página actual
            const startIndex = (currentPage - 1) * reportsPerPage;
            const endIndex = Math.min(startIndex + reportsPerPage, reports.length);
            const reportsToShow = reports.slice(startIndex, endIndex);
            
            // Actualizar paginación
            updatePagination(reports.length);
            
            // Mostrar reportes
            reportsContainer.innerHTML = '';
            
            // Crear tarjeta para cada reporte
            reportsToShow.forEach(report => {
                createReportCard(report.id, report.data);
            });
            
        } catch (error) {
            console.error('Error al cargar reportes:', error);
            reportsContainer.innerHTML = '<div class="error-message">Error al cargar reportes: ' + error.message + '</div>';
        }
    }
    
    // Actualizar paginación
    function updatePagination(totalReports) {
        totalPages = Math.ceil(totalReports / reportsPerPage) || 1;
        
        const currentPageEl = document.querySelector('.pagination .current-page');
        const totalPagesEl = document.querySelector('.pagination .total-pages');
        const prevPageBtn = document.getElementById('prev-report-page-btn');
        const nextPageBtn = document.getElementById('next-report-page-btn');
        
        if (currentPageEl) {
            currentPageEl.textContent = currentPage;
        }
        
        if (totalPagesEl) {
            totalPagesEl.textContent = totalPages;
        }
        
        if (prevPageBtn) {
            prevPageBtn.disabled = currentPage <= 1;
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = currentPage >= totalPages;
        }
    }
    
    // Crear tarjeta de reporte
    function createReportCard(reportId, reportData) {
        const reportCard = document.createElement('div');
        reportCard.className = 'report-card';
        
        // Convertir timestamp a fecha legible
        const createdDate = reportData.createdAt ? 
                          formatFirestoreDate(reportData.createdAt) : 
                          'N/A';
        
        // Título del reporte
        const reportTitle = reportData.title || 'Reporte sin título';
        
        // Determinar tipo de reporte e icono
        const reportTypes = {
            'alert': { name: 'Alerta', icon: 'fa-exclamation-circle', class: 'error' },
            'error': { name: 'Error', icon: 'fa-exclamation-triangle', class: 'error' },
            'maintenance': { name: 'Mantenimiento', icon: 'fa-tools', class: 'warning' },
            'info': { name: 'Información', icon: 'fa-info-circle', class: 'info' }
        };
        
        const reportType = reportTypes[reportData.type] || reportTypes.info;
        
        // Determinar estado del reporte
        const reportStatuses = {
            'pending': { name: 'Pendiente', class: 'pending' },
            'in-progress': { name: 'En Proceso', class: 'in-progress' },
            'completed': { name: 'Resuelto', class: 'completed' }
        };
        
        const reportStatus = reportStatuses[reportData.status] || reportStatuses.pending;
        
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
                        <span class="report-detail-label">Dispositivo:</span>
                        <span class="report-detail-value">${reportData.deviceName || 'N/A'}</span>
                    </div>
                </div>
                <p class="report-description">${reportData.description || 'Sin descripción'}</p>
                <div class="report-footer">
                    <span class="report-date">${createdDate}</span>
                    <div class="report-actions">
                        <button class="btn-icon info" title="Ver Detalles" data-id="${reportId}">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar evento al botón de detalles
        const infoBtn = reportCard.querySelector('.info');
        if (infoBtn) {
            infoBtn.addEventListener('click', function() {
                openReportDetails(reportId, reportData);
            });
        }
        
        // Agregar tarjeta al contenedor
        reportsContainer.appendChild(reportCard);
    }
    
    // Inicializar formulario de reporte
    function initReportForm(userId) {
        // Botón para agregar reporte
        if (addReportBtn) {
            addReportBtn.addEventListener('click', function() {
                openReportModal(userId);
            });
        }
        
        // Formulario de reporte
        if (reportForm) {
            reportForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveReport(userId);
            });
        }
        
        // Preview de imagen
        if (reportImageInput) {
            reportImageInput.addEventListener('change', function() {
                previewReportImage();
            });
        }
        
        // Botones de cancelar en modales
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Botones de cerrar modal
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Cerrar modal al hacer clic fuera del contenido
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('active');
                }
            });
        });
    }
    
    // Mostrar vista previa de imagen
    function previewReportImage() {
        const file = reportImageInput.files[0];
        const previewImg = reportImagePreview.querySelector('img');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            previewImg.style.display = 'none';
        }
    }
    
    // Abrir modal para crear/editar reporte
    function openReportModal(userId, reportId = null, reportData = null) {
        if (!reportModal || !reportForm) return;
        
        // Limpiar formulario
        reportForm.reset();
        const previewImg = reportImagePreview.querySelector('img');
        previewImg.style.display = 'none';
        
        // Establecer título del modal
        const modalTitle = document.getElementById('report-modal-title');
        if (modalTitle) {
            modalTitle.textContent = reportId ? 'Editar Reporte' : 'Nuevo Reporte';
        }
        
        // Si es edición, rellenar con datos existentes
        if (reportId && reportData) {
            editingReportId = reportId;
            
            // Llenar campos
            document.getElementById('report-title').value = reportData.title || '';
            document.getElementById('report-type').value = reportData.type || '';
            document.getElementById('report-device').value = reportData.deviceId || '';
            document.getElementById('report-description').value = reportData.description || '';
            
            // Si hay imagen, mostrarla
            if (reportData.imageUrl) {
                const previewImg = reportImagePreview.querySelector('img');
                previewImg.src = reportData.imageUrl;
                previewImg.style.display = 'block';
            }
        } else {
            editingReportId = null;
        }
        
        // Mostrar modal
        reportModal.classList.add('active');
    }
    
    // Guardar reporte
    async function saveReport(userId) {
        if (!reportForm) return;
        
        // Obtener datos del formulario
        const title = document.getElementById('report-title').value.trim();
        const type = document.getElementById('report-type').value;
        const deviceId = document.getElementById('report-device').value;
        const description = document.getElementById('report-description').value.trim();
        const imageFile = reportImageInput.files[0];
        
        // Validar datos
        if (!title) {
            showToast('Error', 'El título es obligatorio', 'error');
            return;
        }
        
        if (!type) {
            showToast('Error', 'Debe seleccionar un tipo de reporte', 'error');
            return;
        }
        
        if (!deviceId) {
            showToast('Error', 'Debe seleccionar un dispositivo', 'error');
            return;
        }
        
        if (!description) {
            showToast('Error', 'La descripción es obligatoria', 'error');
            return;
        }
        
        // Mostrar estado de carga
        if (saveReportBtn) {
            saveReportBtn.disabled = true;
            saveReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        try {
            // Obtener nombre del dispositivo
            const deviceDoc = await db.collection('dispositivos').doc(deviceId).get();
            let deviceName = 'Dispositivo desconocido';
            let locationName = 'N/A';
            
            if (deviceDoc.exists) {
                const deviceData = deviceDoc.data();
                deviceName = deviceData.name || 'Dispositivo desconocido';
                
                // Si el dispositivo tiene ubicación, obtener nombre
                if (deviceData.locationId) {
                    const locationDoc = await db.collection('ubicaciones').doc(deviceData.locationId).get();
                    if (locationDoc.exists) {
                        locationName = locationDoc.data().name || 'N/A';
                    }
                }
            }
            
            // Obtener datos del usuario
            const userDoc = await db.collection('usuarios').doc(userId).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            
            // Crear objeto de datos base
            const reportData = {
                title,
                type,
                deviceId,
                deviceName,
                description,
                status: 'pending',
                clientId: userId,
                clientName: userData.name || 'Cliente',
                clientEmail: userData.email || '',
                locationName,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Si hay imagen, subirla a Storage
            let uploadPromise = Promise.resolve(null);
            if (imageFile) {
                const storageRef = storage.ref();
                const imageRef = storageRef.child(`reports/${userId}/${Date.now()}_${imageFile.name}`);
                
                uploadPromise = imageRef.put(imageFile).then(() => {
                    return imageRef.getDownloadURL();
                }).then(url => {
                    reportData.imageUrl = url;
                });
            }
            
            // Esperar a que se suba la imagen (si hay)
            await uploadPromise;
            
            // Guardar en Firestore
            if (editingReportId) {
                // Actualizar reporte existente
                await db.collection('reportes').doc(editingReportId).update(reportData);
                showToast('Éxito', 'Reporte actualizado correctamente', 'success');
            } else {
                // Crear nuevo reporte
                reportData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                reportData.statusHistory = [{
                    status: 'pending',
                    date: firebase.firestore.FieldValue.serverTimestamp(),
                    note: 'Reporte creado'
                }];
                
                const docRef = await db.collection('reportes').add(reportData);
                
                // Crear notificación para administradores
                const notificationData = {
                    type: 'report',
                    title: 'Nuevo Reporte',
                    message: `${userData.name || 'Cliente'} ha creado un nuevo reporte: ${title}`,
                    link: `reports:view:${docRef.id}`
                };
                
                // Crear notificación para el usuario
                await createUserNotification('report', 'Reporte Enviado', 'Su reporte ha sido enviado y está pendiente de revisión');
                
                // Notificar a todos los administradores (esta función está definida en admin/notificaciones.js)
                if (typeof window.createAdminNotification === 'function') {
                    window.createAdminNotification(notificationData);
                }
                
                showToast('Éxito', 'Reporte creado correctamente', 'success');
            }
            
            // Cerrar modal y recargar reportes
            reportModal.classList.remove('active');
            loadReports(userId);
            
        } catch (error) {
            console.error('Error al guardar reporte:', error);
            showToast('Error', 'No se pudo guardar el reporte: ' + error.message, 'error');
        } finally {
            // Restaurar botón
            if (saveReportBtn) {
                saveReportBtn.disabled = false;
                saveReportBtn.textContent = 'Enviar Reporte';
            }
        }
    }
    
    // Abrir detalles del reporte
    function openReportDetails(reportId, reportData) {
        // Crear modal dinámicamente
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'report-details-modal';
        
        // Convertir timestamp a fecha legible
        const createdDate = reportData.createdAt ? 
                          formatFirestoreDate(reportData.createdAt) : 'N/A';
        
        // Determinar tipo de reporte
        const reportTypes = {
            'alert': 'Alerta',
            'error': 'Error',
            'maintenance': 'Mantenimiento',
            'info': 'Información'
        };
        
        const typeName = reportTypes[reportData.type] || 'Desconocido';
        
        // Determinar estado del reporte
        const reportStatuses = {
            'pending': 'Pendiente',
            'in-progress': 'En Proceso',
            'completed': 'Resuelto'
        };
        
        const statusName = reportStatuses[reportData.status] || 'Desconocido';
        
        // Generar historial de estados
        let statusHistoryHtml = '<p>No hay historial de estados</p>';
        
        if (reportData.statusHistory && reportData.statusHistory.length > 0) {
            statusHistoryHtml = '<ul class="status-history">';
            
            reportData.statusHistory.forEach(item => {
                const itemDate = item.date ? 
                                formatFirestoreDate(item.date) : 'N/A';
                
                statusHistoryHtml += `
                    <li>
                        <span class="status-history-status">${reportStatuses[item.status] || item.status}</span>
                        <span class="status-history-date">${itemDate}</span>
                        ${item.note ? `<p class="status-history-note">${item.note}</p>` : ''}
                    </li>
                `;
            });
            
            statusHistoryHtml += '</ul>';
        }
        
        // Crear contenido del modal
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
                            <div class="detail-value">${reportData.title || 'Sin título'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Tipo:</div>
                            <div class="detail-value">${typeName}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Estado:</div>
                            <div class="detail-value">${statusName}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Fecha:</div>
                            <div class="detail-value">${createdDate}</div>
                        </div>
                    </div>
                    
                    <div class="report-details-section">
                        <h4>Dispositivo y Ubicación</h4>
                        <div class="detail-row">
                            <div class="detail-label">Dispositivo:</div>
                            <div class="detail-value">${reportData.deviceName || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Ubicación:</div>
                            <div class="detail-value">${reportData.locationName || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="report-details-section">
                        <h4>Descripción</h4>
                        <div class="report-full-description">
                            ${reportData.description || 'Sin descripción'}
                        </div>
                    </div>
                    
                    ${reportData.imageUrl ? `
                        <div class="report-details-section">
                            <h4>Imagen</h4>
                            <div class="report-image">
                                <img src="${reportData.imageUrl}" alt="Imagen del reporte">
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="report-details-section">
                        <h4>Historial de Estados</h4>
                        ${statusHistoryHtml}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary close-details-btn">Cerrar</button>
                </div>
            </div>
        `;
        
        // Agregar modal al DOM
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Evento para botón de cerrar
        const closeBtn = modal.querySelector('.modal-close');
        const closeDetailsBtn = modal.querySelector('.close-details-btn');
        
        // Función para cerrar modal
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };
        
        // Asignar eventos
        closeBtn.addEventListener('click', closeModal);
        closeDetailsBtn.addEventListener('click', closeModal);
        
        // Cerrar al hacer clic fuera del contenido
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
});