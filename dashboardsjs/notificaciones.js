// notifications.js - Real-time notification system
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not defined. Make sure to load Firebase scripts.');
        return;
    }

    // DOM Elements
    const notificationBtn = document.querySelector('.notification-btn');
    const notificationBadge = document.querySelector('.notification-badge');
    
    // References to Firebase
    const db = firebase.firestore();
    const auth = firebase.auth();
    const notificationsRef = db.collection('notifications');
    
    // State variables
    let notificationPanel = null;
    let unsubscribeListener = null;
    let notificationCount = 0;

    // Initialize notifications
    initializeNotifications();

    function initializeNotifications() {
        // Check if user is authenticated
        auth.onAuthStateChanged(user => {
            if (user) {
                setupRealtimeListener(user.uid);
                createNotificationPanel();
                setupEventListeners();
                checkUnreadNotifications();
            } else {
                if (unsubscribeListener) {
                    unsubscribeListener();
                }
            }
        });
    }

    // Setup real-time listener for notifications
    function setupRealtimeListener(userId) {
        // Listen for new notifications for the current user
        unsubscribeListener = notificationsRef
            .where('userId', '==', userId)
            .where('read', '==', false)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                // Count unread notifications
                notificationCount = snapshot.size;
                updateNotificationBadge(notificationCount);

                // Handle new notifications
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const notification = change.doc.data();
                        showToastNotification(notification);
                    }
                });
            });
    }

    // Create notification panel
    function createNotificationPanel() {
        // Check if panel already exists
        if (document.querySelector('.notification-panel')) {
            return;
        }

        notificationPanel = document.createElement('div');
        notificationPanel.className = 'notification-panel';
        notificationPanel.innerHTML = `
            <div class="notification-panel-header">
                <h3>Notificaciones</h3>
                <button class="mark-all-read-btn">Marcar todas como leídas</button>
            </div>
            <div class="notification-panel-body">
                <div class="loading">Cargando notificaciones...</div>
            </div>
            <div class="notification-panel-footer">
                <a href="#" class="view-all-notifications">Ver todas las notificaciones</a>
            </div>
        `;

        document.body.appendChild(notificationPanel);

        // Add event listener for "mark all as read"
        const markAllBtn = notificationPanel.querySelector('.mark-all-read-btn');
        markAllBtn.addEventListener('click', markAllAsRead);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Notification button click
        if (notificationBtn) {
            notificationBtn.addEventListener('click', toggleNotificationPanel);
        }

        // Close panel when clicking outside
        document.addEventListener('click', function(e) {
            if (notificationPanel && notificationPanel.classList.contains('active')) {
                if (!notificationPanel.contains(e.target) && !notificationBtn.contains(e.target)) {
                    notificationPanel.classList.remove('active');
                }
            }
        });
    }

    // Toggle notification panel
    function toggleNotificationPanel() {
        if (!notificationPanel) return;

        if (notificationPanel.classList.contains('active')) {
            notificationPanel.classList.remove('active');
        } else {
            notificationPanel.classList.add('active');
            loadNotifications();
        }
    }

    // Load notifications
    function loadNotifications() {
        const notificationBody = notificationPanel.querySelector('.notification-panel-body');
        
        auth.currentUser.getIdToken().then(token => {
            return notificationsRef
                .where('userId', '==', auth.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
        })
        .then(snapshot => {
            if (snapshot.empty) {
                notificationBody.innerHTML = '<div class="no-notifications">No hay notificaciones</div>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const notification = doc.data();
                html += createNotificationItem(doc.id, notification);
            });

            notificationBody.innerHTML = html;

            // Add click handlers to notification items
            const notificationItems = notificationBody.querySelectorAll('.notification-item');
            notificationItems.forEach(item => {
                item.addEventListener('click', function() {
                    const notificationId = this.getAttribute('data-id');
                    handleNotificationClick(notificationId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading notifications:', error);
            notificationBody.innerHTML = '<div class="error">Error al cargar notificaciones</div>';
        });
    }

    // Create notification item HTML
    function createNotificationItem(id, notification) {
        const time = formatNotificationTime(notification.createdAt);
        const iconClass = getNotificationIcon(notification.type);
        const readClass = notification.read ? 'read' : '';

        return `
            <div class="notification-item ${readClass}" data-id="${id}">
                <div class="notification-icon ${notification.type}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-text">${notification.message}</div>
                    <div class="notification-time">${time}</div>
                </div>
            </div>
        `;
    }

    // Handle notification click
    function handleNotificationClick(notificationId) {
        // Mark as read
        notificationsRef.doc(notificationId).update({
            read: true,
            readAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            // Update UI
            const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.classList.add('read');
            }

            // Update badge count
            checkUnreadNotifications();
            
            // Handle navigation if notification has a link
            return notificationsRef.doc(notificationId).get();
        })
        .then(doc => {
            if (doc.exists) {
                const notification = doc.data();
                if (notification.link) {
                    // Navigate to the linked section
                    navigateToSection(notification.link);
                }
            }
        })
        .catch(error => {
            console.error('Error marking notification as read:', error);
        });
    }

    // Mark all notifications as read
    function markAllAsRead() {
        if (!auth.currentUser) return;

        // Update all unread notifications
        notificationsRef
            .where('userId', '==', auth.currentUser.uid)
            .where('read', '==', false)
            .get()
            .then(snapshot => {
                const batch = db.batch();

                snapshot.forEach(doc => {
                    batch.update(doc.ref, {
                        read: true,
                        readAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

                return batch.commit();
            })
            .then(() => {
                // Reload notifications
                loadNotifications();
                // Update badge
                updateNotificationBadge(0);
            })
            .catch(error => {
                console.error('Error marking all notifications as read:', error);
            });
    }

    // Check unread notifications count
    function checkUnreadNotifications() {
        if (!auth.currentUser) return;

        notificationsRef
            .where('userId', '==', auth.currentUser.uid)
            .where('read', '==', false)
            .get()
            .then(snapshot => {
                notificationCount = snapshot.size;
                updateNotificationBadge(notificationCount);
            })
            .catch(error => {
                console.error('Error checking unread notifications:', error);
            });
    }

    // Update notification badge
    function updateNotificationBadge(count) {
        if (notificationBadge) {
            if (count > 0) {
                notificationBadge.textContent = count > 99 ? '99+' : count;
                notificationBadge.style.display = 'inline-flex';
            } else {
                notificationBadge.style.display = 'none';
            }
        }
    }

    // Show toast notification
    function showToastNotification(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${notification.type}`;
        
        const iconClass = getNotificationIcon(notification.type);
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Add to document
        document.body.appendChild(toast);

        // Show animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            removeToast(toast);
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            removeToast(toast);
        }, 5000);
    }

    // Remove toast notification
    function removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Get notification icon based on type
    function getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return 'fa-check-circle';
            case 'error':
            case 'alert':
                return 'fa-exclamation-circle';
            case 'warning':
                return 'fa-exclamation-triangle';
            case 'payment':
                return 'fa-credit-card';
            case 'report':
                return 'fa-file-alt';
            case 'user':
                return 'fa-user';
            case 'info':
            default:
                return 'fa-info-circle';
        }
    }

    // Format notification time
    function formatNotificationTime(timestamp) {
        if (!timestamp) return 'Fecha desconocida';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 1) return 'Ahora mismo';
        if (minutes < 60) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        if (hours < 24) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
        if (days < 7) return `Hace ${days} día${days !== 1 ? 's' : ''}`;
        
        return date.toLocaleDateString();
    }

    // Navigate to section based on notification link
    function navigateToSection(link) {
        // Close notification panel
        if (notificationPanel) {
            notificationPanel.classList.remove('active');
        }

        // Parse link type and navigate
        const [section, action, id] = link.split(':');
        
        // Find the menu item for the section
        const menuLink = document.querySelector(`a[data-section="${section}"]`);
        if (menuLink) {
            // Simulate click on menu item
            menuLink.click();

            // If there's a specific action, handle it
            if (action && id) {
                setTimeout(() => {
                    handleNotificationAction(section, action, id);
                }, 300);
            }
        }
    }

    // Handle specific notification actions
    function handleNotificationAction(section, action, id) {
        switch (section) {
            case 'reports':
                if (action === 'view') {
                    // Open report details
                    const reportRef = db.collection('reportes').doc(id);
                    reportRef.get().then(doc => {
                        if (doc.exists) {
                            const report = doc.data();
                            // Assuming openReportDetails is defined in reportes.js
                            if (typeof openReportDetails === 'function') {
                                openReportDetails(report);
                            }
                        }
                    });
                }
                break;

            case 'payments':
                if (action === 'view') {
                    // Open payment details
                    const paymentRef = db.collection('pagos').doc(id);
                    paymentRef.get().then(doc => {
                        if (doc.exists) {
                            const payment = doc.data();
                            // Assuming openPaymentDetails is defined in pagos.js
                            if (typeof openPaymentDetails === 'function') {
                                openPaymentDetails(id, payment);
                            }
                        }
                    });
                }
                break;

            // Add more cases as needed
        }
    }

    // Create notification helper functions for other modules to use
    window.createNotification = function(userId, notification) {
        const defaultNotification = {
            userId: userId,
            title: 'Notificación',
            message: '',
            type: 'info',
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Merge default with provided notification
        const finalNotification = { ...defaultNotification, ...notification };

        return notificationsRef.add(finalNotification);
    };

    // Create admin notification (for all admin users)
    window.createAdminNotification = function(notification) {
        // Get all admin users
        return db.collection('usuarios')
            .where('role', '==', 'admin')
            .get()
            .then(snapshot => {
                const batch = db.batch();

                snapshot.forEach(doc => {
                    const adminId = doc.id;
                    const notificationRef = notificationsRef.doc();
                    
                    batch.set(notificationRef, {
                        userId: adminId,
                        ...notification,
                        read: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

                return batch.commit();
            });
    };

    // Clean old notifications (optional - could be run periodically)
    window.cleanOldNotifications = function(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        return notificationsRef
            .where('createdAt', '<', cutoffDate)
            .get()
            .then(snapshot => {
                const batch = db.batch();
                
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });

                return batch.commit();
            })
            .then(() => {
                console.log(`Cleaned ${snapshot.size} old notifications`);
            })
            .catch(error => {
                console.error('Error cleaning old notifications:', error);
            });
    };
});
// Mejoras al sistema de notificaciones para asegurar la comunicación entre dashboards

// Estas funciones deberían estar al final de dashboardsjs/notificaciones.js

// Función mejorada para crear notificaciones para todos los administradores
window.createAdminNotification = function(notification) {
    console.log('Creando notificación para administradores:', notification);
    
    // Valores por defecto para la notificación
    const defaultNotification = {
        type: 'info',
        title: 'Nueva Notificación',
        message: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
    };
    
    // Combinar valores por defecto con los proporcionados
    const finalNotification = { ...defaultNotification, ...notification };
    
    // Obtener todos los usuarios administradores
    return db.collection('usuarios')
        .where('role', '==', 'admin')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No se encontraron administradores');
                return Promise.resolve();
            }
            
            console.log('Administradores encontrados:', snapshot.size);
            
            // Crear batch para operaciones en masa
            const batch = db.batch();
            
            // Crear notificación para cada administrador
            snapshot.forEach(doc => {
                const adminId = doc.id;
                console.log('Creando notificación para admin:', adminId);
                
                const notificationRef = db.collection('notifications').doc();
                
                batch.set(notificationRef, {
                    ...finalNotification,
                    userId: adminId
                });
            });
            
            // Ejecutar batch
            return batch.commit();
        })
        .then(() => {
            console.log('Notificaciones para administradores creadas con éxito');
            return Promise.resolve();
        })
        .catch(error => {
            console.error('Error al crear notificaciones para administradores:', error);
            return Promise.reject(error);
        });
};

// Función mejorada para crear notificación para un usuario específico
window.createUserNotification = function(userId, notification) {
    console.log('Creando notificación para usuario:', userId);
    
    if (!userId) {
        console.error('No se proporcionó ID de usuario');
        return Promise.reject('No se proporcionó ID de usuario');
    }
    
    // Valores por defecto para la notificación
    const defaultNotification = {
        type: 'info',
        title: 'Nueva Notificación',
        message: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
    };
    
    // Combinar valores por defecto con los proporcionados
    const finalNotification = { 
        ...defaultNotification, 
        ...notification,
        userId: userId // Asegurar que se use el ID correcto
    };
    
    // Crear la notificación
    return db.collection('notifications')
        .add(finalNotification)
        .then(docRef => {
            console.log('Notificación creada con éxito:', docRef.id);
            return docRef;
        })
        .catch(error => {
            console.error('Error al crear notificación:', error);
            return Promise.reject(error);
        });
};

// Función para mostrar una notificación toast
window.showToast = function(title, message, type = 'info') {
    console.log('Mostrando toast:', title, message, type);
    
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    
    // Determinar ícono según tipo
    let iconClass = 'fa-info-circle';
    switch (type) {
        case 'success':
            iconClass = 'fa-check-circle';
            break;
        case 'error':
        case 'alert':
            iconClass = 'fa-exclamation-circle';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-triangle';
            break;
    }
    
    // HTML del toast
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    // Agregar a documento
    document.body.appendChild(toast);
    
    // Mostrar con animación
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Botón para cerrar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
};

// Actualizar la función de notificación específica para reportes
window.notifyReportStatusChanged = function(reportId, newStatus, clientId) {
    console.log('Notificando cambio de estado de reporte:', reportId, newStatus, 'para cliente:', clientId);
    
    // Verificar parámetros
    if (!reportId || !newStatus || !clientId) {
        console.error('Parámetros incompletos para notificación');
        return Promise.reject('Parámetros incompletos');
    }
    
    // Mapeo de estados a nombres amigables
    const statusNames = {
        'pending': 'Pendiente',
        'in-progress': 'En Proceso',
        'completed': 'Resuelto'
    };
    
    const statusName = statusNames[newStatus] || newStatus;
    
    // Obtener datos del reporte para crear notificación con contexto
    return db.collection('reportes')
        .doc(reportId)
        .get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('Reporte no encontrado');
            }
            
            const reportData = doc.data();
            const reportTitle = reportData.title || 'Reporte sin título';
            
            // Crear notificación para el cliente
            const notification = {
                type: 'report',
                title: 'Actualización de Reporte',
                message: `Tu reporte "${reportTitle}" ha cambiado a estado: ${statusName}`,
                link: `reportes:view:${reportId}`,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Crear notificación
            return window.createUserNotification(clientId, notification);
        })
        .then(() => {
            console.log('Notificación de cambio de estado creada con éxito');
            return Promise.resolve();
        })
        .catch(error => {
            console.error('Error al crear notificación de cambio de estado:', error);
            return Promise.reject(error);
        });
};
// fix-notification-modal.js - Solución para el problema del modal de notificaciones

(function() {
    console.log('Aplicando corrección al modal de notificaciones');
    
    // Función para inicializar la corrección
    function fixNotificationModal() {
        console.log('Buscando elementos de notificaciones...');
        
        // Obtener elementos del DOM
        const notificationBtn = document.querySelector('.notification-btn');
        const notificationPanel = document.querySelector('.notification-panel');
        
        // Verificar si existen los elementos necesarios
        if (!notificationBtn || !notificationPanel) {
            console.log('No se encontraron los elementos necesarios, reintentando en 500ms...');
            setTimeout(fixNotificationModal, 500);
            return;
        }
        
        console.log('Elementos encontrados, aplicando corrección...');
        
        // 1. Corregir el CSS del panel para asegurar que aparece correctamente
        notificationPanel.style.position = 'absolute';
        notificationPanel.style.top = '60px';  // Ajustar según sea necesario
        notificationPanel.style.right = '10px';
        notificationPanel.style.zIndex = '9999'; // Valor alto para estar por encima de todo
        notificationPanel.style.width = '350px';
        notificationPanel.style.maxHeight = '80vh';
        notificationPanel.style.overflowY = 'auto';
        notificationPanel.style.backgroundColor = '#fff';
        notificationPanel.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
        notificationPanel.style.borderRadius = '8px';
        notificationPanel.style.display = 'none'; // Inicialmente oculto
        
        // 2. Reemplazar la lógica de alternancia de clase con display
        const togglePanel = function() {
            console.log('Alternando panel de notificaciones');
            
            if (notificationPanel.style.display === 'none') {
                notificationPanel.style.display = 'block';
                console.log('Panel abierto');
                
                // Cargar notificaciones
                if (typeof loadNotifications === 'function') {
                    loadNotifications();
                }
            } else {
                notificationPanel.style.display = 'none';
                console.log('Panel cerrado');
            }
        };
        
        // 3. Asignar el evento de clic de forma directa (sin clonar)
        notificationBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            togglePanel();
        };
        
        // 4. Cerrar al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (notificationPanel.style.display !== 'none' && 
                !notificationPanel.contains(e.target) && 
                !notificationBtn.contains(e.target)) {
                notificationPanel.style.display = 'none';
                console.log('Panel cerrado (clic fuera)');
            }
        });
        
        console.log('Corrección aplicada correctamente');
    }
    
    // También podemos arreglar los estilos de los elementos internos del panel
    function fixPanelInternalStyles() {
        const panel = document.querySelector('.notification-panel');
        if (!panel) return;
        
        // Arreglar los headers y footers
        const header = panel.querySelector('.notification-panel-header');
        if (header) {
            header.style.padding = '15px';
            header.style.borderBottom = '1px solid #eee';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
        }
        
        const body = panel.querySelector('.notification-panel-body');
        if (body) {
            body.style.maxHeight = '60vh';
            body.style.overflowY = 'auto';
        }
        
        const footer = panel.querySelector('.notification-panel-footer');
        if (footer) {
            footer.style.padding = '10px 15px';
            footer.style.borderTop = '1px solid #eee';
            footer.style.textAlign = 'center';
        }
        
        // Arreglar botón de marcar como leídas
        const markAllReadBtn = panel.querySelector('.mark-all-read-btn');
        if (markAllReadBtn) {
            markAllReadBtn.style.backgroundColor = '#f0f0f0';
            markAllReadBtn.style.border = 'none';
            markAllReadBtn.style.padding = '5px 10px';
            markAllReadBtn.style.borderRadius = '4px';
            markAllReadBtn.style.cursor = 'pointer';
        }
    }
    
    // Ejecutar cuando el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            fixNotificationModal();
            setTimeout(fixPanelInternalStyles, 500);
        });
    } else {
        // Si el DOM ya está cargado, ejecutar de inmediato
        fixNotificationModal();
        setTimeout(fixPanelInternalStyles, 500);
    }
})();
// notification-styles-fix.js - Mejoras visuales para el panel de notificaciones

(function() {
    console.log('Aplicando mejoras visuales al panel de notificaciones');
    
    // Función para aplicar estilos mejorados al panel de notificaciones
    function enhanceNotificationStyles() {
        // Estilos para el panel principal
        const panel = document.querySelector('.notification-panel');
        if (!panel) {
            console.log('Panel de notificaciones no encontrado, reintentando...');
            setTimeout(enhanceNotificationStyles, 500);
            return;
        }
        
        console.log('Aplicando estilos al panel de notificaciones');
        
        // Estilos para el panel principal
        Object.assign(panel.style, {
            position: 'absolute',
            top: '60px',
            right: '10px',
            zIndex: '9999',
            width: '350px',
            maxHeight: '80vh',
            backgroundColor: '#fff',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            fontFamily: "'Poppins', sans-serif",
            border: '1px solid #eaeaea',
            overflow: 'hidden'
        });
        
        // Estilos para el encabezado del panel
        const header = panel.querySelector('.notification-panel-header');
        if (header) {
            Object.assign(header.style, {
                padding: '15px',
                borderBottom: '1px solid #eaeaea',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8f9fa'
            });
            
            // Estilo para el título del panel
            const title = header.querySelector('h3');
            if (title) {
                Object.assign(title.style, {
                    margin: '0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#333'
                });
            }
            
            // Estilo para el botón "Marcar todas como leídas"
            const markAllBtn = header.querySelector('.mark-all-read-btn');
            if (markAllBtn) {
                Object.assign(markAllBtn.style, {
                    backgroundColor: '#e9ecef',
                    color: '#495057',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                });
                
                // Efecto hover
                markAllBtn.addEventListener('mouseover', function() {
                    this.style.backgroundColor = '#dee2e6';
                });
                
                markAllBtn.addEventListener('mouseout', function() {
                    this.style.backgroundColor = '#e9ecef';
                });
            }
        }
        
        // Estilos para el cuerpo del panel
        const body = panel.querySelector('.notification-panel-body');
        if (body) {
            Object.assign(body.style, {
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '0'
            });
            
            // Mensaje de carga o sin notificaciones
            const loadingMsg = body.querySelector('.loading');
            const emptyMsg = body.querySelector('.no-notifications');
            const errorMsg = body.querySelector('.error');
            
            [loadingMsg, emptyMsg, errorMsg].forEach(el => {
                if (el) {
                    Object.assign(el.style, {
                        padding: '20px',
                        textAlign: 'center',
                        color: '#6c757d',
                        fontSize: '14px'
                    });
                }
            });
            
            // Mejorar estilo de los elementos de notificación
            styleNotificationItems(body);
        }
        
        // Estilos para el pie del panel
        const footer = panel.querySelector('.notification-panel-footer');
        if (footer) {
            Object.assign(footer.style, {
                padding: '12px 15px',
                borderTop: '1px solid #eaeaea',
                textAlign: 'center',
                backgroundColor: '#f8f9fa'
            });
            
            // Estilo para el enlace "Ver todas"
            const viewAllLink = footer.querySelector('.view-all-notifications');
            if (viewAllLink) {
                Object.assign(viewAllLink.style, {
                    color: '#3B82F6',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                });
                
                // Efecto hover
                viewAllLink.addEventListener('mouseover', function() {
                    this.style.textDecoration = 'underline';
                });
                
                viewAllLink.addEventListener('mouseout', function() {
                    this.style.textDecoration = 'none';
                });
            }
        }
        
        console.log('Mejoras visuales aplicadas al panel de notificaciones');
    }
    
    // Función para estilizar los elementos de notificación individuales
    function styleNotificationItems(container) {
        // Observar cambios en el contenedor para estilizar nuevos elementos
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    // Buscar los nuevos elementos de notificación
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Nodo de elemento
                            const items = node.classList && node.classList.contains('notification-item') ? 
                                         [node] : node.querySelectorAll('.notification-item');
                            
                            items.forEach(applyNotificationItemStyles);
                        }
                    });
                }
            });
        });
        
        // Iniciar observación
        observer.observe(container, { childList: true, subtree: true });
        
        // Estilizar elementos existentes
        const existingItems = container.querySelectorAll('.notification-item');
        existingItems.forEach(applyNotificationItemStyles);
    }
    
    // Aplicar estilos a un elemento de notificación individual
    function applyNotificationItemStyles(item) {
        Object.assign(item.style, {
            display: 'flex',
            padding: '12px 15px',
            borderBottom: '1px solid #eaeaea',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
        });
        
        // Efecto hover
        item.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        item.addEventListener('mouseout', function() {
            this.style.backgroundColor = '';
        });
        
        // Estilo para notificaciones leídas
        if (item.classList.contains('read')) {
            item.style.opacity = '0.7';
        }
        
        // Estilo para el icono de notificación
        const icon = item.querySelector('.notification-icon');
        if (icon) {
            Object.assign(icon.style, {
                minWidth: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                color: '#fff',
                fontSize: '16px'
            });
            
            // Colores para diferentes tipos de notificación
            if (icon.classList.contains('success')) {
                icon.style.backgroundColor = '#22C55E';
            } else if (icon.classList.contains('error') || icon.classList.contains('alert')) {
                icon.style.backgroundColor = '#EF4444';
            } else if (icon.classList.contains('warning')) {
                icon.style.backgroundColor = '#FACC15';
            } else if (icon.classList.contains('payment')) {
                icon.style.backgroundColor = '#3B82F6';
            } else if (icon.classList.contains('report')) {
                icon.style.backgroundColor = '#8B5CF6';
            } else if (icon.classList.contains('user')) {
                icon.style.backgroundColor = '#EC4899';
            } else {
                icon.style.backgroundColor = '#6B7280'; // info o tipo por defecto
            }
        }
        
        // Estilo para el contenido de la notificación
        const content = item.querySelector('.notification-content');
        if (content) {
            Object.assign(content.style, {
                flex: '1',
                overflow: 'hidden'
            });
            
            // Título de la notificación
            const title = content.querySelector('.notification-title');
            if (title) {
                Object.assign(title.style, {
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    lineHeight: '1.3',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                });
            }
            
            // Texto de la notificación
            const text = content.querySelector('.notification-text');
            if (text) {
                Object.assign(text.style, {
                    margin: '0 0 6px 0',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    color: '#4B5563',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                });
            }
            
            // Tiempo de la notificación
            const time = content.querySelector('.notification-time');
            if (time) {
                Object.assign(time.style, {
                    fontSize: '12px',
                    color: '#9CA3AF',
                    marginTop: '2px'
                });
            }
        }
    }
    
    // Ejecutar la función cuando el DOM esté cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Esperar un poco para asegurar que el panel esté en el DOM
            setTimeout(enhanceNotificationStyles, 500);
        });
    } else {
        // Si el DOM ya está cargado, ejecutar después de un breve retraso
        setTimeout(enhanceNotificationStyles, 500);
    }
})();