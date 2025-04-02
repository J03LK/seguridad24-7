// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');
    const overlay = document.getElementById('overlay');
    const menuLinks = document.querySelectorAll('.menu a');
    const header = document.querySelector('header');
    const contactForm = document.getElementById('formulario-contacto');
    const newsletterForm = document.getElementById('newsletter-form');
    
    // Aplicar clase scrolled al header en dispositivos móviles por defecto
    if (window.innerWidth <= 991) {
        header.classList.add('scrolled');
    }
    
    // Función para manejar el menú móvil
    function toggleMenu(isOpen) {
        menu.classList.toggle('active', isOpen);
        menuToggle.classList.toggle('active', isOpen);
        overlay.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    
    // Abrir/cerrar menú móvil
    menuToggle.addEventListener('click', function() {
        const isMenuOpen = !menu.classList.contains('active');
        toggleMenu(isMenuOpen);
    });
    
    // Cerrar menú al hacer clic en overlay
    overlay.addEventListener('click', function() {
        toggleMenu(false);
    });
    
    // Manejar enlaces del menú
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Prevenir comportamiento por defecto para manejar el scroll suave
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    // Scroll suave a la sección
                    window.scrollTo({
                        top: targetSection.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    // Actualizar URL sin recargar la página
                    history.pushState(null, null, targetId);
                }
                
                // Actualizar enlace activo
                menuLinks.forEach(item => item.classList.remove('active'));
                this.classList.add('active');
                
                // Cerrar menú móvil si está abierto
                if (window.innerWidth <= 991) {
                    toggleMenu(false);
                }
            }
        });
    });
    
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        // Cambiar enlace activo basado en la sección visible al hacer scroll (con debounce)
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
    
        scrollTimeout = setTimeout(function() {
            const scrollPosition = window.scrollY;
            
            // Agregar o quitar la clase 'scrolled' en el header
            if (scrollPosition > 0) {
                header.classList.add('scrolled');
            } else {
                // Solo quitar scrolled en móvil si se ha regresado al inicio
                if (window.innerWidth > 991) {
                    header.classList.remove('scrolled');
                }
            }
    
            // Actualizar los enlaces activos según la posición del scroll
            document.querySelectorAll('section').forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    menuLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, 50); // Debounce de 50ms
    });
    
    
    // Header con efecto de scroll
    function handleHeaderScroll() {
        if (window.scrollY > 50 || window.innerWidth <= 991) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    window.addEventListener('scroll', handleHeaderScroll);
    window.addEventListener('resize', handleHeaderScroll);
    
    // Inicializar el estado del header
    handleHeaderScroll();
    
    // Animaciones al hacer scroll - Revelar elementos cuando están en el viewport
    const revealElements = document.querySelectorAll('.servicio-card, .caso-card, .nosotros-content, .contacto-content');
    
    const revealOnScroll = function() {
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.classList.add('visible');
            }
        });
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Ejecutar una vez al cargar para elementos ya visibles
    
    // Validación del formulario de contacto
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validación básica
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const mensaje = document.getElementById('mensaje').value;
            
            if (!nombre || !email || !mensaje) {
                showNotification('Por favor, complete todos los campos obligatorios.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Por favor, ingrese un correo electrónico válido.', 'error');
                return;
            }
            
            // Simular envío exitoso (aquí normalmente iría una llamada AJAX)
            showNotification('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.', 'success');
            contactForm.reset();
        });
    }
    
    // Validación del formulario de newsletter
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            
            if (!email || !isValidEmail(email)) {
                showNotification('Por favor, ingrese un correo electrónico válido.', 'error');
                return;
            }
            
            // Simular suscripción exitosa
            showNotification('¡Gracias por suscribirte a nuestro newsletter!', 'success');
            newsletterForm.reset();
        });
    }
    
    // Función para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Sistema de notificaciones
    function showNotification(message, type = 'info') {
        // Eliminar notificaciones existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
        
        // Crear nueva notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Añadir botón de cerrar
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.className = 'notification-close';
        closeButton.addEventListener('click', function() {
            notification.remove();
        });
        
        notification.appendChild(closeButton);
        document.body.appendChild(notification);
        
        // Auto ocultar después de 5 segundos
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
    }
    
    // Precargar video de fondo para mejor rendimiento
    const heroVideo = document.querySelector('.hero-video video');
    if (heroVideo) {
        heroVideo.addEventListener('loadeddata', function() {
            heroVideo.classList.add('loaded');
        });
        
        // Fallback si el video no se puede reproducir
        heroVideo.addEventListener('error', function() {
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                heroSection.classList.add('video-fallback');
            }
        });
    }
    
    // Acordeón para móviles (usable en secciones de servicios o FAQs)
    const setupMobileAccordions = function() {
        if (window.innerWidth <= 768) {
            const accordionTitles = document.querySelectorAll('.servicio-card h3, .caso-content h3');
            
            accordionTitles.forEach(title => {
                if (!title.classList.contains('accordion-ready')) {
                    title.classList.add('accordion-ready');
                    
                    title.addEventListener('click', function() {
                        const content = this.nextElementSibling;
                        const isActive = this.classList.contains('active');
                        
                        // Cerrar otros acordeones abiertos
                        accordionTitles.forEach(otherTitle => {
                            if (otherTitle !== this && otherTitle.classList.contains('active')) {
                                otherTitle.classList.remove('active');
                                otherTitle.nextElementSibling.style.maxHeight = '0px';
                            }
                        });
                        
                        // Abrir/cerrar el actual
                        this.classList.toggle('active', !isActive);
                        if (!isActive) {
                            content.style.maxHeight = content.scrollHeight + 'px';
                        } else {
                            content.style.maxHeight = '0px';
                        }
                    });
                    
                    // Inicializar cerrado
                    title.nextElementSibling.style.maxHeight = '0px';
                    title.nextElementSibling.classList.add('accordion-content');
                }
            });
        }
    };
    
    // Inicializar acordeones en móvil y actualizar en resize
    setupMobileAccordions();
    window.addEventListener('resize', setupMobileAccordions);
    
    // Detección de cuando termina la animación para mejorar rendimiento
    document.querySelectorAll('.servicio-card, .caso-card, .valor').forEach(item => {
        item.addEventListener('animationend', function() {
            this.classList.add('animation-completed');
        });
    });
    
    // Añadir efectos a las secciones al hacer scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target); // Dejar de observar una vez que está en vista
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
});

// Añadir estilos dinámicos para las notificaciones y corregir el menú móvil
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .notification {}
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            background-color: #333;
            color: white;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            transform: translateY(0);
            transition: transform 0.3s ease, opacity 0.3s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .notification-success {
            background-color: #4CAF50;
        }
        
        .notification-error {
            background-color: #F44336;
        }
        
        .notification-info {
            background-color: #2196F3;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            margin-left: 10px;
            padding: 0 5px;
        }
        
        .notification.fade-out {
            transform: translateY(20px);
            opacity: 0;
        }
        
        /* Estilos para el acordeón móvil */
        @media (max-width: 768px) {
            .accordion-content {
                overflow: hidden;
                transition: max-height 0.3s ease;
            }
            
            .servicio-card h3, .caso-content h3 {
                cursor: pointer;
                position: relative;
            }
            
            .servicio-card h3::after, .caso-content h3::after {
                content: '+';
                position: absolute;
                right: 0;
                transition: transform 0.3s ease;
            }
            
            .servicio-card h3.active::after, .caso-content h3.active::after {
                transform: rotate(45deg);
            }
        }
        
        /* Estilos para el header con scroll */
        header.scrolled {
            padding: 5px 0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            background-color: rgba(255, 255, 255, 0.98);
        }
        
        /* Corrección para el menú móvil */
        @media (max-width: 991px) {
            .menu {
                background-color: white;
            }
            
            .menu a {
                color: #011730 !important; /* Forzar color oscuro para textos en el menú móvil */
                font-weight: 500;
            }
            
            .menu a:hover {
                color: var(--primary-color) !important;
            }
            
            .menu a.active {
                color: var(--primary-color) !important;
            }
            
            /* Asegurar que el botón de contacto mantenga su estilo */
            .menu a.btn-contacto {
                color: white !important;
                background-color: var(--primary-color);
            }
            
            .menu a.btn-contacto:hover {
                background-color: var(--secondary-color);
            }
        }
        
        /* Estilo para video cargado */
        .hero-video video.loaded {
            opacity: 1;
        }
        
        /* Fallback para video */
        .hero.video-fallback {
            background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/api/placeholder/1200/800');
            background-size: cover;
            background-position: center;
        }
        
        /* Animación para elementos al entrar en viewport */
        section.in-view {
            animation: sectionFadeIn 0.8s ease forwards;
        }
        
        @keyframes sectionFadeIn {
            from { opacity: 0.8; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Estilo para elementos visibles en scroll */
        .servicio-card.visible, .caso-card.visible, .nosotros-content.visible, .contacto-content.visible {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
})();