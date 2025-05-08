// notificaciones.js - Sistema de notificaciones para el usuario

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const notificationBtn = document.querySelector('.notification-btn');
    const notificationBadge = document.querySelector('.notification-badge');
    const notificationPanel = document.querySelector('.notification-panel');
    const notificationsList = document.getElementById('notifications-list');
    const markAllReadBtn = document.querySelector('.mark-all-read-btn');
    const clearAllBtn = document.querySelector('.clear-all-btn');
    
    // Variable para almacenar el listener de Firestore
    let unsubscribeListener = null;
    
    // Verificar autenticación e inicializar sistema
    auth.onAuthStateChanged(user => {
        if (user) {
            initNotificationSystem(user.uid);
        } else if (unsubscribeListener) {
            // Desactivar listener al cerrar sesión
            unsubscribeListener();
        }
    });
    
    // Inicializar sistema de notificaciones
    function initNotificationSystem(userId) {
        // Configurar panel de notificaciones
        setupNotificationPanel();
        
        // Cargar notificaciones iniciales
        loadNotifications(userId);
        
        // Configurar listener en tiempo real
        setupRealtimeListener(userId);
        
        // Solicitar permiso para notificaciones del navegador
        requestNotificationPermission();
    }
    
    // Configurar panel de notificaciones
    function setupNotificationPanel() {
        // Botón de notificaciones
        if (notificationBtn) {
            notificationBtn.addEventListener('click', toggleNotificationPanel);
        }
        
        // Botón para marcar todas como leídas
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', function() {
                const user = auth.currentUser;
                if (user) markAllAsRead(user.uid);
            });
        }
        
        // Botón para borrar todas
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', function() {
                const user = auth.currentUser;
                if (user) clearAllNotifications(user.uid);
            });
        }
        
        // Cerrar panel al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (notificationPanel && 
                notificationPanel.classList.contains('active') && 
                !notificationPanel.contains(e.target) && 
                !notificationBtn.contains(e.target)) {
                notificationPanel.classList.remove('active');
            }
        });
    }
    
    // Alternar panel de notificaciones
    function toggleNotificationPanel() {
        if (!notificationPanel) return;
        
        notificationPanel.classList.toggle('active');
        
        // Si se abre el panel, recargar notificaciones
        if (notificationPanel.classList.contains('active')) {
            const user = auth.currentUser;
            if (user) {
                loadNotifications(user.uid);
            }
        }
    }
    
    // Cargar notificaciones
    async function loadNotifications(userId) {
        if (!notificationsList) return;
        
        try {
            // Mostrar estado de carga
            notificationsList.innerHTML = '<div class="loading-message">Cargando notificaciones...</div>';
            
            // Consultar notificaciones del usuario
            const snapshot = await db.collection('notifications')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
            
            // Manejar caso de no resultados
            if (snapshot.empty) {
                notificationsList.innerHTML = `
                    <div class="empty-notifications">
                        <i class="fas fa-bell-slash"></i>
                        <p>No tienes notificaciones</p>
                    </div>
                `;
                updateNotificationBadge(0);
                return;
            }
            
            // Limpiar contenedor
            notificationsList.innerHTML = '';
            
            // Contar notificaciones no leídas
            let unreadCount = 0;
            
            // Crear elemento para cada notificación
            snapshot.forEach(doc => {
                createNotificationItem(doc.id, doc.data());
                
                // Contar si no está leída
                if (!doc.data().read) {
                    unreadCount++;
                }
            });
            
            // Actualizar contador
            updateNotificationBadge(unreadCount);
            
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
            notificationsList.innerHTML = '<div class="error-message">Error al cargar notificaciones</div>';
        }
    }
    
    // Crear elemento de notificación
    function createNotificationItem(notificationId, notificationData) {
        const item = document.createElement('div');
        item.className = 'notification-item';
        item.setAttribute('data-id', notificationId);
        
        if (notificationData.read) {
            item.classList.add('read');
        }
        
        // Formatear tiempo
        const time = notificationData.createdAt ? 
                    getTimeAgo(notificationData.createdAt) : 'N/A';
        
        // Determinar icono según tipo
        const iconClass = getNotificationIconClass(notificationData.type);
        
        // Crear HTML del elemento
        item.innerHTML = `
            <div class="notification-icon ${notificationData.type}">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notificationData.title || 'Notificación'}</div>
                <div class="notification-text">${notificationData.message || ''}</div>
                <div class="notification-time">${time}</div>
            </div>
        `;
        
        // Agregar evento al hacer clic
        item.addEventListener('click', function() {
            handleNotificationClick(notificationId, notificationData);
        });
        
        // Agregar al contenedor
        notificationsList.appendChild(item);
    }
    
    // Manejar clic en notificación
    async function handleNotificationClick(notificationId, notificationData) {
        try {
            const user = auth.currentUser;
            if (!user) return;
            
            // Marcar como leída
            if (!notificationData.read) {
                await db.collection('notifications').doc(notificationId).update({
                    read: true,
                    readAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Actualizar UI
                const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
                if (notificationItem) {
                    notificationItem.classList.add('read');
                }
            }
            
            // Si tiene enlace, navegar
            if (notificationData.link) {
                navigateFromNotification(notificationData.link);
            }
            
        } catch (error) {
            console.error('Error al procesar clic en notificación:', error);
        }
    }
    
    // Configurar listener en tiempo real
    function setupRealtimeListener(userId) {
        // Desactivar listener anterior si existe
        if (unsubscribeListener) {
            unsubscribeListener();
        }
        
        // Crear nuevo listener
        unsubscribeListener = db.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                // Actualizar badge con la cantidad de notificaciones no leídas
                updateNotificationBadge(snapshot.size);
                
                // Mostrar toast para nuevas notificaciones
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const notificationData = change.doc.data();
                        // Solo mostrar toast si la notificación es reciente (menos de 10 segundos)
                        if (notificationData.createdAt) {
                            const createdAt = notificationData.createdAt.toDate ? 
                                            notificationData.createdAt.toDate() : 
                                            new Date(notificationData.createdAt);
                            
                            const now = new Date();
                            const diffTime = Math.abs(now - createdAt) / 1000; // en segundos
                            
                            if (diffTime < 10) {
                                showNotificationToast(notificationData);
                                showBrowserNotification(notificationData);
                            }
                        }
                    }
                });
            });
    }
    
    // Actualizar badge de notificaciones
    function updateNotificationBadge(count) {
        if (!notificationBadge) return;
        
        if (count > 0) {
            notificationBadge.textContent = count > 99 ? '99+' : count;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
    
    // Mostrar notificación toast
    function showNotificationToast(notificationData) {
        // Usar la función global definida en firebase-config.js
        showToast(
            notificationData.title || 'Notificación', 
            notificationData.message || '', 
            notificationData.type || 'info'
        );
    }
    
    // Marcar todas las notificaciones como leídas
    async function markAllAsRead(userId) {
        try {
            // Obtener notificaciones no leídas
            const snapshot = await db.collection('notifications')
                .where('userId', '==', userId)
                .where('read', '==', false)
                .get();
            
            if (snapshot.empty) return;
            
            // Crear batch para actualizar múltiples documentos
            const batch = db.batch();
            
            snapshot.forEach(doc => {
                batch.update(doc.ref, {
                    read: true,
                    readAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            // Ejecutar batch
            await batch.commit();
            
            // Actualizar UI
            document.querySelectorAll('.notification-item').forEach(item => {
                item.classList.add('read');
            });
            
            // Actualizar badge
            updateNotificationBadge(0);
            
            // Mostrar mensaje
            showToast('Éxito', 'Todas las notificaciones han sido marcadas como leídas', 'success');
            
        } catch (error) {
            console.error('Error al marcar notificaciones como leídas:', error);
            showToast('Error', 'No se pudieron marcar las notificaciones como leídas', 'error');
        }
    }
    
    // Borrar todas las notificaciones
    async function clearAllNotifications(userId) {
        try {
            // Confirmar acción
            if (!confirm('¿Está seguro de que desea borrar todas las notificaciones? Esta acción no se puede deshacer.')) {
                return;
            }
            
            // Obtener todas las notificaciones del usuario
            const snapshot = await db.collection('notifications')
                .where('userId', '==', userId)
                .get();
            
            if (snapshot.empty) return;
            
            // Crear batch para eliminar múltiples documentos
            const batch = db.batch();
            
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Ejecutar batch
            await batch.commit();
            
            // Actualizar UI
            notificationsList.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No tienes notificaciones</p>
                </div>
            `;
            
            // Actualizar badge
            updateNotificationBadge(0);
            
            // Cerrar panel
            if (notificationPanel) {
                notificationPanel.classList.remove('active');
            }
            
            // Mostrar mensaje
            showToast('Éxito', 'Todas las notificaciones han sido eliminadas', 'success');
            
        } catch (error) {
            console.error('Error al borrar notificaciones:', error);
            showToast('Error', 'No se pudieron borrar las notificaciones', 'error');
        }
    }
    
    // Navegar desde notificación
    function navigateFromNotification(link) {
        // Formato del enlace: "section:action:id"
        // Por ejemplo: "reportes:view:ABC123"
        if (!link) return;
        
        const parts = link.split(':');
        if (parts.length < 1) return;
        
        const section = parts[0];
        const action = parts.length > 1 ? parts[1] : null;
        const id = parts.length > 2 ? parts[2] : null;
        
        // Cerrar panel de notificaciones
        if (notificationPanel) {
            notificationPanel.classList.remove('active');
        }
        
        // Navegar a la sección
        const sectionLink = document.querySelector(`.sidebar-menu a[data-section="${section}"]`);
        if (sectionLink) {
            sectionLink.click();
            
            // Ejecutar acciones específicas según la sección
            if (action && id) {
                setTimeout(() => {
                    switch (section) {
                        case 'reportes':
                            if (action === 'view') {
                                // Buscar y abrir los detalles del reporte
                                const reportBtn = document.querySelector(`.info[data-id="${id}"]`);
                                if (reportBtn) reportBtn.click();
                            }
                            break;
                            
                        case 'pagos':
                            if (action === 'view') {
                                // Buscar y abrir los detalles del pago
                                const tabBtn = document.querySelector('.tab-btn[data-tab="payment-history"]');
                                if (tabBtn) tabBtn.click();
                            } else if (action === 'pay') {
                                // Abrir modal de pago
                                const payBtn = document.querySelector(`.make-payment-btn[data-id="${id}"]`);
                                if (payBtn) payBtn.click();
                            }
                            break;
                            
                        case 'facturas':
                            if (action === 'view') {
                                // Buscar y abrir los detalles de la factura
                                const viewBtn = document.querySelector(`.view-factura[data-id="${id}"]`);
                                if (viewBtn) viewBtn.click();
                            }
                            break;
                    }
                }, 500);
            }
        }
    }
    
    // Solicitar permiso para notificaciones del navegador
    function requestNotificationPermission() {
        // Verificar si el navegador soporta notificaciones
        if (!('Notification' in window)) {
            console.log('Este navegador no soporta notificaciones de escritorio');
            return;
        }
        
        // Comprobar si ya tenemos permiso
        if (Notification.permission === 'granted') {
            return;
        }
        
        // Solicitar permiso (no automático, esperar interacción del usuario)
        document.addEventListener('click', function askPermissionOnClick() {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Permiso de notificaciones concedido');
                }
            });
            // Quitar el listener después de ejecutarse una vez
            document.removeEventListener('click', askPermissionOnClick);
        }, { once: true });
    }
    
    // Mostrar notificación del navegador
    function showBrowserNotification(notificationData) {
        // Verificar si el navegador soporta notificaciones y tenemos permiso
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        
        // Verificar si el usuario ha habilitado notificaciones en sus preferencias
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const browserNotificationsEnabled = userData.notifications?.browserNotifications !== false;
        
        if (!browserNotificationsEnabled) {
            return;
        }
        
        // Crear notificación
        const notification = new Notification(notificationData.title || 'Notificación', {
            body: notificationData.message || '',
            icon: '/assets/Logo2.png'
        });
        
        // Evento al hacer clic en la notificación
        notification.onclick = function() {
            window.focus();
            if (notificationData.link) {
                navigateFromNotification(notificationData.link);
            }
            notification.close();
        };
        
        // Cerrar automáticamente después de 5 segundos
        setTimeout(() => {
            notification.close();
        }, 5000);
    }
    
    // Obtener clase de icono según tipo de notificación
    function getNotificationIconClass(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'payment': return 'fa-credit-card';
            case 'report': return 'fa-file-alt';
            case 'alert': return 'fa-bell';
            case 'info':
            default: return 'fa-info-circle';
        }
    }
});