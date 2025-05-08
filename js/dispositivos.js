// dispositivos.js - Gestión de dispositivos del cliente

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const dispositivosGrid = document.getElementById('dispositivos-grid');
    
    // Verificar autenticación y cargar datos
    auth.onAuthStateChanged(user => {
        if (user) {
            loadDevices(user.uid);
        }
    });
    
    // Cargar dispositivos del usuario
    async function loadDevices(userId) {
        if (!dispositivosGrid) return;
        
        // Mostrar mensaje de carga
        dispositivosGrid.innerHTML = '<div class="loading-message">Cargando dispositivos...</div>';
        
        try {
            // Consultar dispositivos del usuario
            const query = db.collection('dispositivos')
                .where('clientId', '==', userId);
            
            const snapshot = await query.get();
            
            // Manejar caso de no resultados
            if (snapshot.empty) {
                dispositivosGrid.innerHTML = `
                    <div class="empty-message">
                        <i class="fas fa-shield-alt"></i>
                        <p>No hay dispositivos registrados. Contacte con soporte para agregar dispositivos a su cuenta.</p>
                    </div>
                `;
                return;
            }
            
            // Obtener ubicaciones para mapear con dispositivos
            const locationsSnapshot = await db.collection('ubicaciones')
                .where('clientId', '==', userId)
                .get();
            
            const locations = {};
            locationsSnapshot.forEach(doc => {
                locations[doc.id] = doc.data();
            });
            
            // Preparar dispositivos
            const devices = [];
            snapshot.forEach(doc => {
                devices.push({
                    id: doc.id,
                    data: doc.data()
                });
            });
            
            // Limpiar contenedor
            dispositivosGrid.innerHTML = '';
            
            // Ordenar por estado (activos primero)
            devices.sort((a, b) => {
                if (a.data.status === 'active' && b.data.status !== 'active') return -1;
                if (a.data.status !== 'active' && b.data.status === 'active') return 1;
                return 0;
            });
            
            // Crear tarjeta para cada dispositivo
            devices.forEach(device => {
                createDeviceCard(device.id, device.data, locations);
            });
            
        } catch (error) {
            console.error('Error al cargar dispositivos:', error);
            dispositivosGrid.innerHTML = '<div class="error-message">Error al cargar dispositivos: ' + error.message + '</div>';
        }
    }
    
    // Crear tarjeta de dispositivo
    function createDeviceCard(deviceId, deviceData, locations) {
        const card = document.createElement('div');
        card.className = 'device-card';
        
        // Determinar estado e icono del dispositivo
        const deviceStatus = deviceData.status || 'inactive';
        let statusClass = 'inactive';
        let statusText = 'Inactivo';
        
        if (deviceStatus === 'active') {
            statusClass = 'active';
            statusText = 'Activo';
        } else if (deviceStatus === 'error') {
            statusClass = 'error';
            statusText = 'Error';
        } else if (deviceStatus === 'maintenance') {
            statusClass = 'warning';
            statusText = 'Mantenimiento';
        }
        
        // Determinar icono según tipo de dispositivo
        let deviceIcon = 'fa-shield-alt';
        if (deviceData.type === 'camera') {
            deviceIcon = 'fa-video';
        } else if (deviceData.type === 'sensor') {
            deviceIcon = 'fa-project-diagram';
        } else if (deviceData.type === 'alarm') {
            deviceIcon = 'fa-bell';
        } else if (deviceData.type === 'lock') {
            deviceIcon = 'fa-lock';
        }
        
        // Obtener información de ubicación
        let locationName = 'Sin ubicación';
        if (deviceData.locationId && locations[deviceData.locationId]) {
            locationName = locations[deviceData.locationId].name;
        }
        
        // Obtener última actividad
        const lastActivity = deviceData.lastActivity ? 
                           getTimeAgo(deviceData.lastActivity) : 'Desconocida';
        
        // Crear HTML de la tarjeta
        card.innerHTML = `
            <div class="device-header">
                <div class="device-icon ${statusClass}">
                    <i class="fas ${deviceIcon}"></i>
                </div>
                <div class="device-status ${statusClass}">
                    <span>${statusText}</span>
                </div>
            </div>
            <div class="device-body">
                <h3 class="device-name">${deviceData.name || 'Dispositivo sin nombre'}</h3>
                <div class="device-details">
                    <div class="device-detail">
                        <span class="device-detail-label">Tipo:</span>
                        <span class="device-detail-value">${getDeviceTypeName(deviceData.type)}</span>
                    </div>
                    <div class="device-detail">
                        <span class="device-detail-label">Ubicación:</span>
                        <span class="device-detail-value">${locationName}</span>
                    </div>
                    <div class="device-detail">
                        <span class="device-detail-label">Modelo:</span>
                        <span class="device-detail-value">${deviceData.model || 'N/A'}</span>
                    </div>
                    <div class="device-detail">
                        <span class="device-detail-label">Serial:</span>
                        <span class="device-detail-value">${deviceData.serialNumber || deviceId.substring(0, 8)}</span>
                    </div>
                </div>
                
                <div class="device-stats">
                    <div class="device-stat">
                        <i class="fas fa-sync-alt"></i>
                        <span>Última actividad: ${lastActivity}</span>
                    </div>
                    ${deviceData.battery ? `
                    <div class="device-stat">
                        <i class="fas fa-battery-${getBatteryIcon(deviceData.battery)}"></i>
                        <span>Batería: ${deviceData.battery}%</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="device-footer">
                <button class="device-action view-device" data-id="${deviceId}">
                    <i class="fas fa-info-circle"></i>
                    <span>Ver Detalles</span>
                </button>
                <button class="device-action report-issue" data-id="${deviceId}" data-name="${deviceData.name || 'Dispositivo'}">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Reportar Problema</span>
                </button>
            </div>
        `;
        
        // Agregar eventos a los botones
        const viewButton = card.querySelector('.view-device');
        if (viewButton) {
            viewButton.addEventListener('click', function() {
                viewDeviceDetails(deviceId, deviceData, locations);
            });
        }
        
        const reportButton = card.querySelector('.report-issue');
        if (reportButton) {
            reportButton.addEventListener('click', function() {
                openReportModal(deviceId, deviceData.name);
            });
        }
        
        // Agregar tarjeta al contenedor
        dispositivosGrid.appendChild(card);
    }
    
    // Ver detalles del dispositivo
    function viewDeviceDetails(deviceId, deviceData, locations) {
        // Crear modal dinámicamente
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'device-details-modal';
        
        // Determinar estado del dispositivo
        const deviceStatus = deviceData.status || 'inactive';
        let statusClass = 'inactive';
        let statusText = 'Inactivo';
        
        if (deviceStatus === 'active') {
            statusClass = 'active';
            statusText = 'Activo';
        } else if (deviceStatus === 'error') {
            statusClass = 'error';
            statusText = 'Error';
        } else if (deviceStatus === 'maintenance') {
            statusClass = 'warning';
            statusText = 'Mantenimiento';
        }
        
        // Obtener información de ubicación
        let locationName = 'Sin ubicación';
        let locationAddress = 'N/A';
        if (deviceData.locationId && locations[deviceData.locationId]) {
            const location = locations[deviceData.locationId];
            locationName = location.name;
            locationAddress = location.address || 'N/A';
        }
        
        // Obtener fechas
        const installDate = deviceData.installDate ? 
                          formatFirestoreDate(deviceData.installDate) : 'N/A';
        const lastMaintenance = deviceData.lastMaintenance ? 
                             formatFirestoreDate(deviceData.lastMaintenance) : 'N/A';
        const lastActivity = deviceData.lastActivity ? 
                           getTimeAgo(deviceData.lastActivity) : 'Desconocida';
        
        // Crear contenido del modal
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalles del Dispositivo</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="device-details-section">
                        <div class="device-details-header">
                            <h4>${deviceData.name || 'Dispositivo sin nombre'}</h4>
                            <div class="device-status ${statusClass}">
                                <span>${statusText}</span>
                            </div>
                        </div>
                        
                        <div class="device-details-body">
                            <div class="detail-row">
                                <div class="detail-label">Tipo:</div>
                                <div class="detail-value">${getDeviceTypeName(deviceData.type)}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Modelo:</div>
                                <div class="detail-value">${deviceData.model || 'N/A'}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Número de Serie:</div>
                                <div class="detail-value">${deviceData.serialNumber || deviceId.substring(0, 8)}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Fecha de Instalación:</div>
                                <div class="detail-value">${installDate}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Último Mantenimiento:</div>
                                <div class="detail-value">${lastMaintenance}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Última Actividad:</div>
                                <div class="detail-value">${lastActivity}</div>
                            </div>
                            ${deviceData.battery ? `
                            <div class="detail-row">
                                <div class="detail-label">Batería:</div>
                                <div class="detail-value">
                                    <div class="battery-indicator">
                                        <div class="battery-level" style="width: ${deviceData.battery}%"></div>
                                    </div>
                                    ${deviceData.battery}%
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="device-details-section">
                        <h4>Ubicación</h4>
                        <div class="detail-row">
                            <div class="detail-label">Nombre:</div>
                            <div class="detail-value">${locationName}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Dirección:</div>
                            <div class="detail-value">${locationAddress}</div>
                        </div>
                    </div>
                    
                    ${deviceData.features ? `
                    <div class="device-details-section">
                        <h4>Características</h4>
                        <ul class="features-list">
                            ${getFeaturesList(deviceData.features)}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${deviceData.notes ? `
                    <div class="device-details-section">
                        <h4>Notas</h4>
                        <div class="device-notes">
                            ${deviceData.notes}
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary close-details-btn">Cerrar</button>
                    <button class="btn-primary report-issue-btn" data-id="${deviceId}" data-name="${deviceData.name || 'Dispositivo'}">
                        <i class="fas fa-exclamation-triangle"></i>
                        Reportar Problema
                    </button>
                </div>
            </div>
        `;
        
        // Estilos adicionales
        const style = document.createElement('style');
        style.textContent = `
            .device-details-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .device-details-header h4 {
                margin: 0;
                font-size: 1.2rem;
            }
            
            .device-details-body {
                margin-bottom: 20px;
            }
            
            .battery-indicator {
                display: inline-block;
                width: 60px;
                height: 12px;
                background-color: #E5E7EB;
                border-radius: 6px;
                margin-right: 8px;
                position: relative;
                overflow: hidden;
            }
            
            .battery-level {
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                background-color: var(--success-color);
                border-radius: 6px;
            }
            
            .features-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .features-list li {
                padding: 8px 0;
                border-bottom: 1px solid var(--border-color);
            }
            
            .features-list li:last-child {
                border-bottom: none;
            }
            
            .device-notes {
                background-color: #F9FAFB;
                border-radius: var(--border-radius);
                padding: 15px;
                font-size: 0.9rem;
                white-space: pre-line;
            }
        `;
        
        // Agregar estilos a la modal
        modal.appendChild(style);
        
        // Agregar modal al DOM
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Evento para botón de cerrar
        const closeBtn = modal.querySelector('.modal-close');
        const closeDetailsBtn = modal.querySelector('.close-details-btn');
        const reportProblemBtn = modal.querySelector('.report-issue-btn');
        
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
        
        // Evento para botón de reportar problema
        if (reportProblemBtn) {
            reportProblemBtn.addEventListener('click', function() {
                closeModal();
                openReportModal(deviceId, deviceData.name);
            });
        }
        
        // Cerrar al hacer clic fuera del contenido
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    
    // Abrir modal de reporte
    function openReportModal(deviceId, deviceName) {
        // Cambiar a la sección de reportes
        document.querySelector('.sidebar-menu a[data-section="reportes"]').click();
        
        // Abrir modal de reporte
        const addReportBtn = document.getElementById('add-report-btn');
        if (addReportBtn) {
            // Simular clic en el botón de agregar reporte
            addReportBtn.click();
            
            // Esperar a que se abra el modal
            setTimeout(() => {
                // Seleccionar el dispositivo en el selector
                const deviceSelect = document.getElementById('report-device');
                if (deviceSelect) {
                    deviceSelect.value = deviceId;
                }
                
                // Pre-llenar título con nombre del dispositivo
                const titleInput = document.getElementById('report-title');
                if (titleInput) {
                    titleInput.value = `Problema con ${deviceName}`;
                }
            }, 300);
        }
    }
    
    // Obtener nombre legible del tipo de dispositivo
    function getDeviceTypeName(type) {
        const types = {
            'camera': 'Cámara',
            'sensor': 'Sensor',
            'alarm': 'Alarma',
            'lock': 'Cerradura',
            'control': 'Control de Acceso',
            'motion': 'Sensor de Movimiento',
            'smoke': 'Detector de Humo',
            'water': 'Detector de Agua',
            'temperature': 'Sensor de Temperatura'
        };
        
        return types[type] || 'Dispositivo';
    }
    
    // Obtener icono de batería
    function getBatteryIcon(percentage) {
        if (percentage >= 75) return 'full';
        if (percentage >= 50) return 'three-quarters';
        if (percentage >= 25) return 'half';
        return 'quarter';
    }
    
    // Generar lista de características
    function getFeaturesList(features) {
        if (!features || !Array.isArray(features)) return '';
        
        let html = '';
        features.forEach(feature => {
            html += `<li><i class="fas fa-check-circle"></i> ${feature}</li>`;
        });
        
        return html;
    }
});