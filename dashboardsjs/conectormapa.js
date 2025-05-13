// reportes-ubicaciones-connector.js
// Script para conectar la funcionalidad de reportes con ubicaciones en el mapa

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined') {
        console.error('Firebase no está definido. Asegúrate de cargar los scripts de Firebase.');
        return;
    }

    // Referencias a Firebase
    const db = firebase.firestore();
    const auth = firebase.auth();
    const reportsRef = db.collection('reportes');
    const locationsRef = db.collection('ubicaciones');
    
    // Referencias al DOM
    const mapContainer = document.getElementById('client-map');
    const reportsContainer = document.querySelector('.reports-container');
    
    // Variables de estado
    let currentRole = 'visitor'; // Por defecto visitante, se actualizará a 'admin' o 'user'
    let markers = {}; // Para almacenar referencias a los marcadores del mapa
    let reportDetailsModal = null; // Referencia al modal de detalles de reporte

    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            // Verificar rol del usuario
            db.collection('usuarios').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const userData = doc.data();
                        currentRole = userData.role || 'user';
                        initReportSystem(user.uid);
                    }
                })
                .catch(error => {
                    console.error('Error al obtener datos del usuario:', error);
                });
        }
    });

    // Inicializar sistema de reportes
    function initReportSystem(userId) {
        // Si es administrador, configurar funcionalidades avanzadas
        if (currentRole === 'admin') {
            setupReportStatusListeners();
            setupRealtimeReportListeners();
            connectMapWithReports();
        } 
        
        // Funcionalidad común para ambos roles
        setupReportNotifications(userId);
    }

    // Conectar mapa con reportes (solo para administradores)
    function connectMapWithReports() {
        // Verificar si el mapa está inicializado
        if (!mapContainer || typeof L === 'undefined') {
            // Si no está inicializado, esperar hasta que esté disponible
            const checkInterval = setInterval(() => {
                const map = window.map; // Asumiendo que el mapa está disponible globalmente
                if (map) {
                    clearInterval(checkInterval);
                    setupMapReportConnection(map);
                }
            }, 500);
            return;
        }
        
        // Si ya está inicializado, configurar la conexión
        setupMapReportConnection(window.map);
    }

    // Configurar conexión entre mapa y reportes
    function setupMapReportConnection(map) {
        console.log('Conectando mapa con reportes...');
        
        // Cargar reportes activos y ubicaciones
        loadActiveReportsForMap(map);
        
        // Agregar botón para mostrar/ocultar reportes en el mapa
        addReportMapToggle(map);
    }

    // Cargar reportes activos para mostrar en el mapa
    function loadActiveReportsForMap(map) {
        // Consultar reportes pendientes o en proceso
        reportsRef.where('status', 'in', ['pending', 'in-progress'])
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log('No hay reportes activos para mostrar en el mapa');
                    return;
                }
                
                // Procesar cada reporte
                snapshot.forEach(doc => {
                    const reportData = doc.data();
                    const reportId = doc.id;
                    
                    // Si el reporte tiene un deviceId, buscar su ubicación
                    if (reportData.deviceId) {
                        // Buscar el dispositivo para obtener su ubicación
                        db.collection('dispositivos').doc(reportData.deviceId).get()
                            .then(deviceDoc => {
                                if (deviceDoc.exists) {
                                    const deviceData = deviceDoc.data();
                                    
                                    // Si el dispositivo tiene locationId, buscar la ubicación
                                    if (deviceData.locationId) {
                                        locationsRef.doc(deviceData.locationId).get()
                                            .then(locationDoc => {
                                                if (locationDoc.exists) {
                                                    const locationData = locationDoc.data();
                                                    
                                                    // Mostrar el reporte en el mapa
                                                    addReportMarkerToMap(map, reportId, reportData, locationData);
                                                }
                                            });
                                    }
                                }
                            });
                    }
                });
            })
            .catch(error => {
                console.error('Error al cargar reportes activos para el mapa:', error);
            });
    }

    // Agregar marcador de reporte al mapa
    function addReportMarkerToMap(map, reportId, reportData, locationData) {
        const lat = parseFloat(locationData.lat);
        const lng = parseFloat(locationData.lng);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Determinar color según tipo y estado del reporte
        const reportColors = {
            'alert': '#FF5252', // Rojo para alertas
            'error': '#FF9800', // Naranja para errores
            'maintenance': '#2196F3', // Azul para mantenimiento
            'info': '#4CAF50'  // Verde para información
        };
        
        // Color por defecto o según tipo
        const baseColor = reportColors[reportData.type] || reportColors.info;
        
        // Modificar opacidad según estado
        let opacity = 0.8;
        if (reportData.status === 'in-progress') {
            opacity = 0.6;
        } else if (reportData.status === 'completed') {
            opacity = 0.4;
        }
        
        // Crear marcador con ícono personalizado
        const reportMarker = L.circleMarker([lat, lng], {
            radius: 10,
            fillColor: baseColor,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: opacity
        }).addTo(map);
        
        // Crear contenido del popup
        const popupContent = document.createElement('div');
        popupContent.className = 'report-popup';
        
        popupContent.innerHTML = `
            <div class="report-popup-header">
                <h3>${reportData.title || 'Reporte sin título'}</h3>
                <span class="status-badge ${reportData.status}">${getStatusName(reportData.status)}</span>
            </div>
            <div class="report-popup-details">
                <p><strong>Cliente:</strong> ${reportData.clientName || 'N/A'}</p>
                <p><strong>Tipo:</strong> ${getTypeName(reportData.type)}</p>
                <p><strong>Dispositivo:</strong> ${reportData.deviceName || 'N/A'}</p>
                <p><strong>Descripción:</strong> ${truncateText(reportData.description, 100)}</p>
            </div>
            <div class="report-popup-actions">
                <button class="view-report-btn" data-id="${reportId}">Ver Detalles</button>
            </div>
        `;
        
        // Agregar popup al marcador
        reportMarker.bindPopup(popupContent);
        
        // Agregar animación de parpadeo si es pendiente
        if (reportData.status === 'pending') {
            animateReportMarker(reportMarker, baseColor);
        }
        
        // Guardar referencia al marcador
        markers[reportId] = reportMarker;
        
        // Agregar evento al botón de ver detalles
        setTimeout(() => {
            const popupContent = reportMarker.getPopup().getContent();
            if (popupContent instanceof HTMLElement) {
                const viewBtn = popupContent.querySelector('.view-report-btn');
                if (viewBtn) {
                    viewBtn.addEventListener('click', function() {
                        const reportId = this.getAttribute('data-id');
                        openReportDetailsFromMap(reportId);
                    });
                }
            }
        }, 100);
    }

    // Animar marcador de reporte en el mapa (parpadeo)
    function animateReportMarker(marker, color) {
        let opacity = 1.0;
        let increasing = false;
        
        // Intervalo para cambiar opacidad
        const intervalId = setInterval(function() {
            if (increasing) {
                opacity += 0.1;
                if (opacity >= 1.0) {
                    opacity = 1.0;
                    increasing = false;
                }
            } else {
                opacity -= 0.1;
                if (opacity <= 0.4) {
                    opacity = 0.4;
                    increasing = true;
                }
            }
            
            // Actualizar opacidad del marcador
            marker.setStyle({ fillOpacity: opacity });
        }, 500);
        
        // Guardar ID del intervalo en el marcador para poder limpiarlo después
        marker.intervalId = intervalId;
    }

    // Configurar escuchadores para cambios en el estado de reportes
    function setupReportStatusListeners() {
        // Buscar todos los elementos con clase "edit-status" que se agreguen dinámicamente
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit-status') || 
                e.target.closest('.edit-status')) {
                const btn = e.target.classList.contains('edit-status') ? 
                          e.target : e.target.closest('.edit-status');
                const reportId = btn.getAttribute('data-id');
                
                if (reportId) {
                    // Obtener datos actuales del reporte
                    reportsRef.doc(reportId).get()
                        .then(doc => {
                            if (doc.exists) {
                                const reportData = doc.data();
                                openStatusModal(reportId, reportData);
                            }
                        })
                        .catch(error => {
                            console.error('Error al obtener reporte:', error);
                        });
                }
            }
            
            // Manejar clic en botón para guardar nuevo estado
            if (e.target.classList.contains('save-status-btn') || 
                e.target.closest('.save-status-btn')) {
                const btn = e.target.classList.contains('save-status-btn') ? 
                          e.target : e.target.closest('.save-status-btn');
                const reportId = btn.getAttribute('data-id');
                
                if (reportId) {
                    const newStatus = document.getElementById('new-status').value;
                    const note = document.getElementById('status-note').value.trim();
                    
                    updateReportStatus(reportId, newStatus, note);
                }
            }
        });
    }

    // Abrir modal para cambiar estado de reporte
    function openStatusModal(reportId, reportData) {
        // Verificar si ya existe un modal
        let modal = document.getElementById('status-modal');
        
        if (!modal) {
            // Crear modal dinámicamente si no existe
            modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'status-modal';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Cambiar Estado del Reporte</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Reporte:</strong> ${reportData.title}</p>
                        <p><strong>Estado actual:</strong> ${getStatusName(reportData.status)}</p>
                        
                        <div class="form-group">
                            <label for="new-status">Nuevo Estado:</label>
                            <select id="new-status">
                                <option value="pending" ${reportData.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                                <option value="in-progress" ${reportData.status === 'in-progress' ? 'selected' : ''}>En Proceso</option>
                                <option value="completed" ${reportData.status === 'completed' ? 'selected' : ''}>Resuelto</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="status-note">Nota (opcional):</label>
                            <textarea id="status-note"></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary cancel-status-btn">Cancelar</button>
                            <button type="button" class="btn-primary save-status-btn" data-id="${reportId}">Guardar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        } else {
            // Actualizar contenido del modal existente
            modal.querySelector('p:first-of-type').innerHTML = `<strong>Reporte:</strong> ${reportData.title}`;
            modal.querySelector('p:nth-of-type(2)').innerHTML = `<strong>Estado actual:</strong> ${getStatusName(reportData.status)}`;
            
            const statusSelect = modal.querySelector('#new-status');
            statusSelect.value = reportData.status;
            
            const saveBtn = modal.querySelector('.save-status-btn');
            saveBtn.setAttribute('data-id', reportId);
            
            // Limpiar nota
            modal.querySelector('#status-note').value = '';
        }
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Event listeners para cerrar
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.cancel-status-btn');
        
        closeBtn.onclick = function() {
            modal.classList.remove('active');
        };
        
        cancelBtn.onclick = function() {
            modal.classList.remove('active');
        };
        
        // Cerrar al hacer clic fuera del contenido
        modal.onclick = function(e) {
            if (e.target === this) {
                modal.classList.remove('active');
            }
        };
    }

    // Actualizar estado de un reporte
    function updateReportStatus(reportId, newStatus, note) {
        // Cerrar modal
        const modal = document.getElementById('status-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Obtener reporte actual
        reportsRef.doc(reportId).get()
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
            })
            .then(() => {
                console.log('Estado actualizado correctamente');
                
                // Mostrar notificación de éxito
                if (typeof showToast === 'function') {
                    showToast('Éxito', 'Estado del reporte actualizado correctamente', 'success');
                }
                
                // Actualizar marcador en el mapa si existe
                updateMapMarker(reportId, newStatus);
                
                // Enviar notificación al cliente
                if (typeof createNotification === 'function') {
                    // Obtener los datos actualizados del reporte
                    reportsRef.doc(reportId).get().then(doc => {
                        if (doc.exists) {
                            const reportData = doc.data();
                            
                            // Enviar notificación al cliente
                            sendStatusUpdateNotification(reportData.clientId, reportId, reportData.title, newStatus, note);
                        }
                    });
                }
                
                // Actualizar UI: recargar reportes si existe la función
                if (typeof loadReports === 'function') {
                    loadReports();
                }
            })
            .catch(error => {
                console.error('Error al actualizar estado:', error);
                
                if (typeof showToast === 'function') {
                    showToast('Error', 'No se pudo actualizar el estado: ' + error.message, 'error');
                } else {
                    alert('Error al actualizar estado: ' + error.message);
                }
            });
    }

    // Actualizar marcador en el mapa
    function updateMapMarker(reportId, newStatus) {
        // Verificar si existe el marcador
        if (markers[reportId]) {
            const marker = markers[reportId];
            
            // Obtener el reporte para determinar el color
            reportsRef.doc(reportId).get()
                .then(doc => {
                    if (doc.exists) {
                        const reportData = doc.data();
                        
                        // Determinar color según tipo de reporte
                        const reportColors = {
                            'alert': '#FF5252', // Rojo para alertas
                            'error': '#FF9800', // Naranja para errores
                            'maintenance': '#2196F3', // Azul para mantenimiento
                            'info': '#4CAF50'  // Verde para información
                        };
                        
                        // Color por defecto o según tipo
                        const baseColor = reportColors[reportData.type] || reportColors.info;
                        
                        // Modificar opacidad según nuevo estado
                        let opacity = 0.8; // Pendiente
                        if (newStatus === 'in-progress') {
                            opacity = 0.6;
                        } else if (newStatus === 'completed') {
                            opacity = 0.4;
                        }
                        
                        // Actualizar estilo del marcador
                        marker.setStyle({ fillOpacity: opacity });
                        
                        // Detener o iniciar animación según estado
                        if (marker.intervalId) {
                            clearInterval(marker.intervalId);
                            marker.intervalId = null;
                        }
                        
                        if (newStatus === 'pending') {
                            animateReportMarker(marker, baseColor);
                        }
                        
                        // Actualizar popup
                        const popupContent = marker.getPopup().getContent();
                        if (popupContent instanceof HTMLElement) {
                            const statusBadge = popupContent.querySelector('.status-badge');
                            if (statusBadge) {
                                statusBadge.className = `status-badge ${newStatus}`;
                                statusBadge.textContent = getStatusName(newStatus);
                            }
                        }
                    }
                });
        }
    }

    // Enviar notificación de actualización de estado al cliente
    function sendStatusUpdateNotification(clientId, reportId, reportTitle, newStatus, note) {
        if (!clientId) return;
        
        const statusNames = {
            'pending': 'Pendiente',
            'in-progress': 'En Proceso',
            'completed': 'Resuelto'
        };
        
        const statusName = statusNames[newStatus] || newStatus;
        
        // Determinar tipo y mensaje según estado
        let type = 'info';
        if (newStatus === 'completed') {
            type = 'success';
        } else if (newStatus === 'in-progress') {
            type = 'warning';
        }
        
        const title = `Actualización de Reporte`;
        const message = `Su reporte "${reportTitle}" ha cambiado a estado: ${statusName}${note ? ': ' + note : ''}`;
        
        // Crear notificación
        if (typeof window.createNotification === 'function') {
            window.createNotification(clientId, {
                title: title,
                message: message,
                type: type,
                link: `reportes:view:${reportId}`
            });
        } else {
            // Usar Firestore directamente si la función no está disponible
            db.collection('notifications').add({
                userId: clientId,
                title: title,
                message: message,
                type: type,
                read: false,
                link: `reportes:view:${reportId}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    }

    // Agregar botón para mostrar/ocultar reportes en el mapa
    function addReportMapToggle(map) {
        // Crear control personalizado
        const reportsControl = L.Control.extend({
            options: {
                position: 'topright'
            },
            
            onAdd: function(map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-reports');
                container.innerHTML = '<a href="#" title="Mostrar/Ocultar Reportes" role="button" aria-label="Mostrar/Ocultar Reportes"><i class="fas fa-exclamation-triangle"></i></a>';
                
                // Prevenir eventos de propagación
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
                L.DomEvent.on(container, 'click', L.DomEvent.preventDefault);
                
                // Agregar evento de clic
                container.onclick = function() {
                    toggleReportsOnMap();
                    
                    // Alternar clase activa
                    container.classList.toggle('active');
                };
                
                return container;
            }
        });
        
        // Agregar control al mapa
        map.addControl(new reportsControl());
    }

    // Mostrar/ocultar reportes en el mapa
    function toggleReportsOnMap() {
        // Iterar por todos los marcadores de reportes
        Object.values(markers).forEach(marker => {
            if (marker._map) {
                marker.remove();
            } else {
                marker.addTo(window.map);
            }
        });
    }

    // Configurar escuchadores en tiempo real para reportes
    function setupRealtimeReportListeners() {
        // Escuchar nuevos reportes o cambios de estado
        reportsRef.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                // Solo procesar cambios o adiciones, no eliminaciones
                if (change.type === 'added' || change.type === 'modified') {
                    const reportData = change.doc.data();
                    const reportId = change.doc.id;
                    
                    // Si es un reporte nuevo
                    if (change.type === 'added' && reportData.status === 'pending') {
                        // Mostrar notificación para administradores
                        notifyNewReport(reportId, reportData);
                    }
                    
                    // Actualizar marcador en el mapa si existe
                    if (markers[reportId]) {
                        updateMapMarker(reportId, reportData.status);
                    } else if (reportData.deviceId && (reportData.status === 'pending' || reportData.status === 'in-progress')) {
                        // Buscar ubicación y agregar marcador si no existe
                        addReportToMap(reportId, reportData);
                    }
                }
            });
        });
    }

    // Agregar un reporte al mapa
    function addReportToMap(reportId, reportData) {
        if (!reportData.deviceId) return;
        
        // Buscar el dispositivo para obtener su ubicación
        db.collection('dispositivos').doc(reportData.deviceId).get()
            .then(deviceDoc => {
                if (deviceDoc.exists) {
                    const deviceData = deviceDoc.data();
                    
                    // Si el dispositivo tiene locationId, buscar la ubicación
                    if (deviceData.locationId) {
                        locationsRef.doc(deviceData.locationId).get()
                            .then(locationDoc => {
                                if (locationDoc.exists) {
                                    const locationData = locationDoc.data();
                                    
                                    // Mostrar el reporte en el mapa
                                    if (window.map) {
                                        addReportMarkerToMap(window.map, reportId, reportData, locationData);
                                    }
                                }
                            });
                    }
                }
            });
    }

    // Notificar de un nuevo reporte a los administradores
    function notifyNewReport(reportId, reportData) {
        if (currentRole !== 'admin') return;
        
        // Determinar tipo de notificación según tipo de reporte
        let notificationType = 'info';
        if (reportData.type === 'alert') {
            notificationType = 'error';
        } else if (reportData.type === 'error') {
            notificationType = 'warning';
        }
        
        // Mostrar notificación
        if (typeof showToast === 'function') {
            showToast(
                'Nuevo reporte', 
                `${reportData.title} - Cliente: ${reportData.clientName}`,
                notificationType
            );
        }
        
        // Reproducir sonido si está disponible
        if (typeof playNotificationSound === 'function') {
            playNotificationSound(notificationType);
        }
    }

    // Abrir detalles de un reporte desde el mapa
    function openReportDetailsFromMap(reportId) {
        // Verificar si estamos en la sección de reportes
        const reportSection = document.getElementById('reports-section');
        
        if (!reportSection || !reportSection.classList.contains('active')) {
            // Si no estamos en la sección de reportes, navegar a ella
            const reportLink = document.querySelector('a[data-section="reports"]');
            if (reportLink) {
                reportLink.click();
                
                // Esperar a que cambie de sección
                setTimeout(() => {
                    fetchAndOpenReportDetails(reportId);
                }, 500);
            }
        } else {
            // Si ya estamos en la sección de reportes, abrir detalles directamente
            fetchAndOpenReportDetails(reportId);
        }
    }

    // Obtener y abrir detalles de un reporte
    function fetchAndOpenReportDetails(reportId) {
        reportsRef.doc(reportId).get()
            .then(doc => {
                if (doc.exists) {
                    const reportData = doc.data();
                    
                    // Verificar si existe la función externa para abrir detalles
                    if (typeof openReportDetails === 'function') {
                        openReportDetails(reportId, reportData);
                    } else {
                        // Crear modal propio si no existe la función
                        createAndOpenReportDetailsModal(reportId, reportData);
                    }
                }
            })
            .catch(error => {
                console.error('Error al obtener detalles del reporte:', error);
            });
    }

    // Crear y abrir modal de detalles del reporte
    function createAndOpenReportDetailsModal(reportId, reportData) {
        // Si ya existe un modal, elimnarlo
        if (reportDetailsModal) {
            document.body.removeChild(reportDetailsModal);
        }
        
        // Crear modal
        reportDetailsModal = document.createElement('div');
        reportDetailsModal.className = 'modal';
        reportDetailsModal.id = 'report-details-modal';
        
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
        // Continuación del archivo reportes-ubicaciones-connector.js

        // Crear contenido del modal
        reportDetailsModal.innerHTML = `
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
                        <h4>Cliente y Ubicación</h4>
                        <div class="detail-row">
                            <div class="detail-label">Cliente:</div>
                            <div class="detail-value">${reportData.clientName || 'Desconocido'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Email:</div>
                            <div class="detail-value">${reportData.clientEmail || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Ubicación:</div>
                            <div class="detail-value">${reportData.locationName || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Dispositivo:</div>
                            <div class="detail-value">${reportData.deviceName || reportData.deviceId || 'N/A'}</div>
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
                    ${reportData.status !== 'completed' ? `
                        <button class="btn-primary edit-status-btn" data-id="${reportId}">Cambiar Estado</button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Agregar modal al DOM
        document.body.appendChild(reportDetailsModal);
        
        // Mostrar modal
        setTimeout(() => {
            reportDetailsModal.classList.add('active');
        }, 10);
        
        // Evento para botón de cerrar
        const closeBtn = reportDetailsModal.querySelector('.modal-close');
        const closeDetailsBtn = reportDetailsModal.querySelector('.close-details-btn');
        
        // Función para cerrar modal
        const closeModal = () => {
            reportDetailsModal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(reportDetailsModal);
                reportDetailsModal = null;
            }, 300);
        };
        
        // Asignar eventos
        closeBtn.addEventListener('click', closeModal);
        closeDetailsBtn.addEventListener('click', closeModal);
        
        // Cerrar al hacer clic fuera del contenido
        reportDetailsModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        
        // Evento para cambiar estado
        const editStatusBtn = reportDetailsModal.querySelector('.edit-status-btn');
        if (editStatusBtn) {
            editStatusBtn.addEventListener('click', function() {
                const reportId = this.getAttribute('data-id');
                closeModal();
                
                // Obtener datos actualizados del reporte
                reportsRef.doc(reportId).get()
                    .then(doc => {
                        if (doc.exists) {
                            openStatusModal(reportId, doc.data());
                        }
                    });
            });
        }
    }

    // Configurar notificaciones de reportes
    function setupReportNotifications(userId) {
        // Si es cliente, escuchar actualizaciones de reportes propios
        if (currentRole === 'user') {
            reportsRef
                .where('clientId', '==', userId)
                .onSnapshot(snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'modified') {
                            const reportData = change.doc.data();
                            const reportId = change.doc.id;
                            
                            // Verificar si es un cambio de estado
                            const oldStatus = change.oldIndex; // Esta es una aproximación, no siempre funciona
                            const newStatus = reportData.status;
                            
                            if (oldStatus !== newStatus) {
                                // Notificar cambio de estado
                                notifyReportStatusChange(reportId, reportData, newStatus);
                            }
                        }
                    });
                });
        }
    }

    // Notificar cambio de estado de reporte al cliente
    function notifyReportStatusChange(reportId, reportData, newStatus) {
        // Solo proceder si es rol de cliente
        if (currentRole !== 'user') return;
        
        // Determinar tipo de notificación según estado
        let notificationType = 'info';
        if (newStatus === 'completed') {
            notificationType = 'success';
        } else if (newStatus === 'in-progress') {
            notificationType = 'warning';
        }
        
        // Obtener nombre del estado
        const statusNames = {
            'pending': 'Pendiente',
            'in-progress': 'En Proceso',
            'completed': 'Resuelto'
        };
        
        const statusName = statusNames[newStatus] || newStatus;
        
        // Mostrar notificación
        if (typeof showToast === 'function') {
            showToast(
                'Actualización de Reporte', 
                `Su reporte "${reportData.title}" ahora está: ${statusName}`,
                notificationType
            );
        }
        
        // Reproducir sonido si está disponible
        if (typeof playNotificationSound === 'function') {
            playNotificationSound(notificationType);
        }
    }

    // Funciones auxiliares
    // Obtener nombre de estado
    function getStatusName(status) {
        const statuses = {
            'pending': 'Pendiente',
            'in-progress': 'En Proceso',
            'completed': 'Resuelto'
        };
        
        return statuses[status] || status;
    }
    
    // Obtener nombre de tipo
    function getTypeName(type) {
        const types = {
            'alert': 'Alerta',
            'error': 'Error',
            'maintenance': 'Mantenimiento',
            'info': 'Información'
        };
        
        return types[type] || type;
    }
    
    // Formatear fecha de Firestore
    function formatFirestoreDate(timestamp) {
        if (!timestamp) return 'N/A';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    
    // Truncar texto largo
    function truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        
        return text.substring(0, maxLength) + '...';
    }
    
    // Hacer función disponible globalmente
    window.updateReportStatus = updateReportStatus;
    window.openReportDetailsFromMap = openReportDetailsFromMap;
});