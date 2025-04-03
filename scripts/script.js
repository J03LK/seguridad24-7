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
    
    // Resto del código JS sin cambios...
    
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
});