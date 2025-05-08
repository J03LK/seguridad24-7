// sidebar.js - Manejo de la barra lateral y navegación del dashboard

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const dashboardContainer = document.querySelector('.dashboard-container');
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    const sections = document.querySelectorAll('.content-section');
    const themeToggle = document.getElementById('theme-toggle');
    
    // Inicializar el tema guardado
    initTheme();
    
    // Agregar tooltips a los enlaces del menú
    function addMenuTooltips() {
        menuLinks.forEach(link => {
            const tooltipText = link.querySelector('span').textContent;
            link.setAttribute('data-title', tooltipText);
        });
    }
    
    // Evento para alternar la barra lateral
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            dashboardContainer.classList.toggle('sidebar-collapsed');
            
            // Guardar preferencia en localStorage
            const isCollapsed = dashboardContainer.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebar-collapsed', isCollapsed ? 'true' : 'false');
        });
        
        // Restaurar estado de la barra lateral
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState === 'true') {
            dashboardContainer.classList.add('sidebar-collapsed');
        }
    }
    
    // Eventos para los enlaces del menú
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Obtener sección a mostrar
            const targetSection = this.getAttribute('data-section');
            
            // Actualizar enlaces activos
            menuLinks.forEach(menuLink => {
                menuLink.parentElement.classList.remove('active');
            });
            this.parentElement.classList.add('active');
            
            // Mostrar sección correspondiente
            sections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${targetSection}-section`).classList.add('active');
            
            // En móviles, colapsar la barra lateral después de seleccionar
            if (window.innerWidth <= 768) {
                const sidebarMenu = document.querySelector('.sidebar-menu');
                if (sidebarMenu.classList.contains('active')) {
                    sidebarMenu.classList.remove('active');
                }
            }
            
            // Almacenar sección activa en localStorage
            localStorage.setItem('active-section', targetSection);
        });
    });
    
    // Restaurar sección activa
    const savedSection = localStorage.getItem('active-section');
    if (savedSection) {
        const savedLink = document.querySelector(`.sidebar-menu a[data-section="${savedSection}"]`);
        if (savedLink) {
            // Simular clic en el enlace guardado
            savedLink.click();
        }
    }
    
    // Evento para alternar el tema
    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Alternar clase de tema oscuro
            const isDarkTheme = document.body.classList.toggle('dark-theme');
            
            // Actualizar UI del botón
            updateThemeToggleUI(isDarkTheme);
            
            // Guardar preferencia en localStorage
            localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
        });
    }
    
    // Adaptaciones para móviles
    window.addEventListener('resize', handleResize);
    
    function handleResize() {
        if (window.innerWidth <= 768) {
            // Móvil - Agregar eventos para colapsar/expandir menú
            const sidebarMenu = document.querySelector('.sidebar-menu');
            const sidebarFooter = document.querySelector('.sidebar-footer');
            
            sidebarToggle.addEventListener('click', function() {
                sidebarMenu.classList.toggle('active');
                if (sidebarFooter) {
                    sidebarFooter.classList.toggle('active');
                }
            });
        }
    }
    
    // Ejecutar una vez al cargar
    handleResize();
});
    addMenuTooltips();
    
    // Detectar si el usuario tiene preferencia por el modo oscuro
    function detectPreferredColorScheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // Inicializar tema
    function initTheme() {
        // Verificar preferencia guardada
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'dark' || (!savedTheme && detectPreferredColorScheme())) {
            document.body.classList.add('dark-theme');
            updateThemeToggleUI(true);
        } else {
            document.body.classList.remove('dark-theme');
            updateThemeToggleUI(false);
        }
    }
    
    // Actualizar UI del botón de tema
    function updateThemeToggleUI(isDark) {
        if (!themeToggle) return;
        
        const themeIcon = themeToggle.querySelector('i');
        const themeText = themeToggle.querySelector('span');
        
        if (isDark) {
            themeIcon.className = 'fas fa-sun';
            themeText.textContent = 'Modo Claro';
        } else {
            themeIcon.className = 'fas fa-moon';
            themeText.textContent = 'Modo Oscuro';
        }
    }
    
    // Agregar tooltips a los enlaces del menú