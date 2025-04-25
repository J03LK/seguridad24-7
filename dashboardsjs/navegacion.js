// Archivo navigation.js - Independiente para la navegación del dashboard

// Inicializar navegación del dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando navegación del dashboard');
    initSidebar();
    initTabNavigation();
});

// Función para manejar la navegación entre pestañas
function initTabNavigation() {
    const navLinks = document.querySelectorAll('[data-tab]');
    const contentTabs = document.querySelectorAll('.content-tab');
    
    console.log('Links de navegación encontrados:', navLinks.length);
    console.log('Pestañas de contenido encontradas:', contentTabs.length);
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Click en enlace de navegación');
            
            // Obtener el ID de la pestaña
            const tabId = link.getAttribute('data-tab');
            console.log('Pestaña seleccionada:', tabId);
            
            // Quitar la clase activa de todos los enlaces
            navLinks.forEach(navLink => {
                navLink.parentElement.classList.remove('active');
            });
            
            // Añadir la clase activa al enlace clickeado
            link.parentElement.classList.add('active');
            
            // Ocultar todas las pestañas de contenido
            contentTabs.forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Mostrar la pestaña de contenido correspondiente
            const targetTab = document.getElementById(`${tabId}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
                console.log('Pestaña activada:', tabId);
            } else {
                console.error('No se encontró la pestaña:', `${tabId}-tab`);
            }
            
            // Si el sidebar está colapsado en móvil, cerrarlo automáticamente
            if (window.innerWidth < 768) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.add('collapsed');
                
                const content = document.getElementById('content');
                if (content) content.classList.add('expanded');
            }
            
            // Actualizar URL sin recargar la página
            history.pushState(null, null, `#${tabId}`);
        });
    });
    
    // Manejar navegación por hash en la URL
    function handleHashChange() {
        const hash = window.location.hash.substring(1);
        
        if (hash) {
            console.log('Hash detectado en URL:', hash);
            const tabLink = document.querySelector(`[data-tab="${hash}"]`);
            if (tabLink) {
                console.log('Activando pestaña desde hash:', hash);
                tabLink.click();
            } else {
                console.log('No se encontró enlace para hash:', hash);
            }
        } else {
            // Si no hay hash, activar la primera pestaña por defecto
            const defaultTab = navLinks[0];
            if (defaultTab) {
                console.log('Activando pestaña por defecto');
                defaultTab.click();
            }
        }
    }
    
    // Verificar hash al cargar
    setTimeout(handleHashChange, 100); // Pequeño retraso para asegurar que los elementos estén listos
    
    // Escuchar cambios en el hash
    window.addEventListener('hashchange', handleHashChange);
}

// Inicializar la barra lateral y su funcionalidad
function initSidebar() {
    console.log('Inicializando sidebar');
    
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    
    if (!sidebarCollapse || !sidebar || !content) {
        console.error('No se encontraron elementos del sidebar');
        return;
    }
    
    // Manejar clic en el botón de colapsar sidebar
    sidebarCollapse.addEventListener('click', () => {
        console.log('Toggle sidebar');
        sidebar.classList.toggle('collapsed');
        content.classList.toggle('expanded');
    });
    
    // Manejar clic en el botón de cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Logout iniciado');
            // Si existe la función logout definida, usarla
            if (typeof logout === 'function') {
                logout();
            } else {
                console.error('Función logout no encontrada');
                // Fallback por si la función logout no está disponible
                window.location.href = 'login.html';
            }
        });
    }
    
    // Manejar eventos de pantalla pequeña
    function checkScreenSize() {
        if (window.innerWidth < 768) {
            sidebar.classList.add('collapsed');
            content.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            content.classList.remove('expanded');
        }
    }
    
    // Verificar tamaño de pantalla al cargar
    checkScreenSize();
    
    // Verificar tamaño de pantalla al redimensionar
    window.addEventListener('resize', checkScreenSize);
}

// Exponer funciones al ámbito global para que sean accesibles desde otros scripts
window.initTabNavigation = initTabNavigation;
window.initSidebar = initSidebar;