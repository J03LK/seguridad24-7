// auto-refresh.js - Actualización automática de la página cuando hay cambios en la base de datos
// Este script no modifica ninguna estructura existente, solo recarga la página

(function() {
    console.log('Inicializando sistema de actualización automática');
    
    // Almacenar suscripciones
    const subscriptions = {};
    let userId = null;
    
    // Verificar autenticación
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('Usuario autenticado:', user.uid);
                userId = user.uid;
                
                // Iniciar escucha de colecciones
                setupListeners();
            } else {
                console.log('Usuario no autenticado');
                clearSubscriptions();
            }
        });
    } else {
        console.error('Firebase no está disponible');
    }
    
    // Configurar listeners para las colecciones
    function setupListeners() {
        // Determinar si estamos en dashboard de admin o cliente
        const isAdminDashboard = document.getElementById('reports-section') !== null;
        const isClientDashboard = document.getElementById('reportes-section') !== null;
        
        // Limpiar suscripciones existentes
        clearSubscriptions();
        
        // Suscribirse a reportes
        subscribeToReportes(isAdminDashboard, userId);
        
        // Suscribirse a ubicaciones
        subscribeToUbicaciones(isAdminDashboard, userId);
        
        // Suscribirse a notificaciones
        subscribeToNotificaciones(userId);
    }
    
    // Suscribirse a reportes
    function subscribeToReportes(isAdmin, userId) {
        if (subscriptions['reportes']) return;
        
        console.log('Suscribiéndose a cambios en reportes');
        
        // Construir query según el tipo de dashboard
        let query = firebase.firestore().collection('reportes')
            .orderBy('updatedAt', 'desc')
            .limit(1);
            
        // Si es dashboard de cliente, filtrar por ID de usuario
        if (!isAdmin) {
            query = query.where('clientId', '==', userId);
        }
        
        // Tiempo de la última actualización
        let lastUpdate = new Date();
        
        // Suscribirse a cambios
        subscriptions['reportes'] = query.onSnapshot(snapshot => {
            // Verificar si hay cambios relevantes (ignorar cambios locales)
            if (!snapshot.metadata.hasPendingWrites && snapshot.docChanges().length > 0) {
                snapshot.docChanges().forEach(change => {
                    const changeTime = change.doc.data().updatedAt ? 
                                      change.doc.data().updatedAt.toDate() : new Date();
                    
                    // Solo actualizar si el cambio es más reciente que nuestra última actualización
                    if (changeTime > lastUpdate) {
                        console.log('Cambio detectado en reportes, actualizando página...');
                        showToast('Actualización', 'Se han detectado cambios, actualizando...', 'info');
                        
                        // Esperar un momento para que se muestre el toast
                        setTimeout(() => {
                            reloadPage();
                        }, 1500);
                        
                        // Actualizar tiempo de última actualización
                        lastUpdate = new Date();
                    }
                });
            }
        }, error => {
            console.error('Error en suscripción a reportes:', error);
        });
    }
    
    // Suscribirse a ubicaciones
    function subscribeToUbicaciones(isAdmin, userId) {
        if (subscriptions['ubicaciones']) return;
        
        console.log('Suscribiéndose a cambios en ubicaciones');
        
        // Construir query según el tipo de dashboard
        let query = firebase.firestore().collection('ubicaciones')
            .orderBy('updatedAt', 'desc')
            .limit(1);
            
        // Si es dashboard de cliente, filtrar por ID de usuario
        if (!isAdmin) {
            query = query.where('clientId', '==', userId);
        }
        
        // Tiempo de la última actualización
        let lastUpdate = new Date();
        
        // Suscribirse a cambios
        subscriptions['ubicaciones'] = query.onSnapshot(snapshot => {
            // Verificar si hay cambios relevantes (ignorar cambios locales)
            if (!snapshot.metadata.hasPendingWrites && snapshot.docChanges().length > 0) {
                snapshot.docChanges().forEach(change => {
                    const changeTime = change.doc.data().updatedAt ? 
                                      change.doc.data().updatedAt.toDate() : new Date();
                    
                    // Solo actualizar si el cambio es más reciente que nuestra última actualización
                    if (changeTime > lastUpdate) {
                        console.log('Cambio detectado en ubicaciones, actualizando página...');
                        showToast('Actualización', 'Se han detectado cambios, actualizando...', 'info');
                        
                        // Esperar un momento para que se muestre el toast
                        setTimeout(() => {
                            reloadPage();
                        }, 1500);
                        
                        // Actualizar tiempo de última actualización
                        lastUpdate = new Date();
                    }
                });
            }
        }, error => {
            console.error('Error en suscripción a ubicaciones:', error);
        });
    }
    
    // Suscribirse a notificaciones
    function subscribeToNotificaciones(userId) {
        if (subscriptions['notificaciones'] || !userId) return;
        
        console.log('Suscribiéndose a cambios en notificaciones');
        
        // Query para notificaciones del usuario
        const query = firebase.firestore().collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(5);
            
        // Suscribirse a cambios
        subscriptions['notificaciones'] = query.onSnapshot(snapshot => {
            // Verificar si hay notificaciones nuevas
            if (!snapshot.metadata.hasPendingWrites && snapshot.docChanges().length > 0) {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const notif = change.doc.data();
                        
                        // Mostrar toast para cada notificación nueva
                        showToast(notif.title || 'Nueva notificación', notif.message || '', 'info');
                        
                        // Actualizar contador de notificaciones
                        updateNotificationBadge(snapshot.size);
                    }
                });
            } else {
                // Actualizar contador de notificaciones
                updateNotificationBadge(snapshot.size);
            }
        }, error => {
            console.error('Error en suscripción a notificaciones:', error);
        });
    }
    
    // Actualizar contador de notificaciones
    function updateNotificationBadge(count) {
        const badge = document.querySelector('.notification-badge');
        if (!badge) return;
        
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    // Mostrar toast de notificación
    function showToast(title, message, type = 'info') {
        // Verificar si ya existe la función
        if (typeof window.showToast === 'function') {
            window.showToast(title, message, type);
            return;
        }
        
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        
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
        `;
        
        // Agregar al documento
        document.body.appendChild(toast);
        
        // Mostrar con animación
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-cerrar después de 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    // Recargar página
    function reloadPage() {
        // Guardar posición actual de scroll
        const scrollPos = window.scrollY;
        
        // Guardar sección activa actual
        const activeSection = document.querySelector('.content-section.active');
        const activeSectionId = activeSection ? activeSection.id : null;
        
        // Guardar estos valores en sessionStorage
        if (activeSectionId) {
            sessionStorage.setItem('activeSection', activeSectionId);
        }
        sessionStorage.setItem('scrollPosition', scrollPos);
        
        // Recargar página
        window.location.reload();
    }
    
    // Restaurar estado después de recargar
    function restoreState() {
        // Restaurar sección activa
        const activeSection = sessionStorage.getItem('activeSection');
        if (activeSection) {
            const section = activeSection.replace('-section', '');
            const sectionLink = document.querySelector(`a[data-section="${section}"]`);
            
            if (sectionLink) {
                sectionLink.click();
            }
            
            // Eliminar de sessionStorage
            sessionStorage.removeItem('activeSection');
        }
        
        // Restaurar posición de scroll
        const scrollPos = sessionStorage.getItem('scrollPosition');
        if (scrollPos) {
            setTimeout(() => {
                window.scrollTo(0, parseInt(scrollPos));
                
                // Eliminar de sessionStorage
                sessionStorage.removeItem('scrollPosition');
            }, 100);
        }
    }
    
    // Limpiar suscripciones
    function clearSubscriptions() {
        Object.keys(subscriptions).forEach(key => {
            if (typeof subscriptions[key] === 'function') {
                subscriptions[key]();
            }
        });
        
        // Reiniciar objeto
        Object.keys(subscriptions).forEach(key => delete subscriptions[key]);
    }
    
    // Restaurar estado si se recargó la página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', restoreState);
    } else {
        restoreState();
    }
})();