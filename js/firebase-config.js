// Configuración de Firebase (la misma que se usa en el panel de administración)
const firebaseConfig = {
    apiKey: "AIzaSyD_C3sJCghWpV1DHn4Qyxsa-exdcEJGst0",
    authDomain: "seguridad-24-7.firebaseapp.com",
    projectId: "seguridad-24-7",
    storageBucket: "seguridad-24-7.firebasestorage.app",
    messagingSenderId: "979899411271",
    appId: "1:979899411271:web:4d8db498a9388054a7fa62",
    measurementId: "G-XQG0KDMMX4"
};

// Inicializar Firebase si no está inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Exportar referencias comunes para su uso en otros archivos
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configurar persistencia local para mantener la sesión del usuario
firebase.firestore().enablePersistence()
    .catch(err => {
        if (err.code === 'failed-precondition') {
            // Múltiples pestañas abiertas, no se puede habilitar persistencia
            console.warn('Persistencia no pudo ser habilitada: Múltiples pestañas abiertas');
        } else if (err.code === 'unimplemented') {
            // El navegador actual no soporta todas las funciones necesarias
            console.warn('Persistencia no está disponible en este navegador');
        }
    });

// Función para formatear fechas de Firestore
function formatFirestoreDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Función para formatear montos
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Función para obtener el tiempo transcurrido
function getTimeAgo(timestamp) {
    if (!timestamp) return 'Fecha desconocida';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Utilidad para mostrar notificaciones Toast
function showToast(title, message, type = 'info') {
    // Verificar si ya existe un toast
    const existingToast = document.querySelector('.notification-toast');
    if (existingToast) {
        // Mover los toasts existentes hacia arriba
        document.querySelectorAll('.notification-toast').forEach(toast => {
            const currentBottom = parseInt(getComputedStyle(toast).bottom);
            toast.style.bottom = (currentBottom + 70) + 'px';
        });
    }
    
    // Crear nuevo toast
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    
    // Determinar icono según tipo
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    if (type === 'payment') iconClass = 'fa-credit-card';
    if (type === 'report') iconClass = 'fa-file-alt';
    
    // Plantilla HTML del toast
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
    
    // Agregar al DOM
    document.body.appendChild(toast);
    
    // Mostrar con animación
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Configurar cierre
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        removeToast(toast);
    }, 5000);
}

// Función para eliminar toast
function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 300);
}

// Función para crear un objeto de notificación interna para el usuario
async function createUserNotification(type, title, message, link = null) {
    try {
        // Obtener ID del usuario actual
        const user = auth.currentUser;
        if (!user) return Promise.reject('No hay usuario autenticado');
        
        // Datos para la notificación
        const notificationData = {
            userId: user.uid,
            type,
            title,
            message,
            link,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Guardar en Firestore
        return await db.collection('notifications').add(notificationData);
    } catch (error) {
        console.error('Error al crear notificación:', error);
        return Promise.reject(error);
    }
}

// Exportar funciones para el uso global
window.showToast = showToast;
window.formatFirestoreDate = formatFirestoreDate;
window.formatCurrency = formatCurrency;
window.getTimeAgo = getTimeAgo;
window.createUserNotification = createUserNotification;