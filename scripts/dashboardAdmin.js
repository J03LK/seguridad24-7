// Variables globales
let currentModal = null;

// Función para convertir códigos de estado a texto
function getStatusText(status) {
    const statusMap = {
        'active': 'Activo',
        'inactive': 'Inactivo',
        'warning': 'Advertencia',
        'pending': 'Pendiente',
        'completed': 'Completado'
    };
    return statusMap[status] || 'Desconocido';
}

// Inicializar gráficos
function initializeCharts() {
    // TODO: Implementar inicialización de gráficos con datos reales
}

// Inicializar mapa
function initializeMap() {
    // TODO: Implementar inicialización del mapa con datos reales
}

// Navegación lateral
function setupNavigation() {
    const menuToggle = document.getElementById('dashboard-menu-toggle');
    const sidebar = document.getElementById('dashboard-sidebar');
    const navLinks = document.querySelectorAll('.dashboard-nav-links a');
    const sections = document.querySelectorAll('.dashboard-main-content section');

    function showSection(sectionId) {
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.style.display = 'block';
                section.classList.remove('section-hide');
            } else {
                section.style.display = 'none';
                section.classList.add('section-hide');
            }
        });
    }

    function activateNavLink(link) {
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        link.classList.add('active');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
        e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                activateNavLink(this);
                showSection(sectionId);
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            }
        });
    });

    if (menuToggle) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            e.target !== menuToggle &&
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });

    if (navLinks.length > 0) {
        const firstLink = navLinks[0];
        const firstSectionId = firstLink.getAttribute('data-section');
        if (firstSectionId) {
            activateNavLink(firstLink);
            showSection(firstSectionId);
        }
    }
}

// Configuración básica del dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y rol
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            firebase.firestore().collection('users').doc(user.uid).get()
                .then(function(doc) {
                    if (doc.exists) {
                        const userData = doc.data();
                        if (userData.role !== 'admin') {
                            window.location.href = "usuario.html";
                        } else {
                            const userNameElement = document.querySelector('.user-profile .name');
                            if (userNameElement) {
                                userNameElement.textContent = userData.name || 'Admin';
                            }
                        }
                    } else {
                        window.location.href = "login.html";
                    }
                })
                .catch(function(error) {
                    console.error("Error al verificar rol:", error);
                    window.location.href = "login.html";
                });
        } else {
            window.location.href = "login.html";
        }
    });

    // Configurar navegación
    setupNavigation();

    // Configurar cierre de sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            firebase.auth().signOut()
                .then(() => window.location.href = "login.html")
                .catch(error => console.error("Error al cerrar sesión:", error));
        });
    }

    // Inicializar componentes
    initializeCharts();
    initializeMap();
});

// Funciones de utilidad
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification-popup ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function generateUniqueId(prefix = 'id') {
return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

function formatDate(date) {
if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES');
}

function formatCurrency(amount) {
if (!amount) return '$0.00';
const value = typeof amount === 'string' 
    ? parseFloat(amount.replace('$', '').replace(',', ''))
    : amount;
return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
}).format(value);
}