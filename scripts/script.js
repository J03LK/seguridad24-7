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
    
    // Aplicar índices para la animación de los elementos del menú
    menuLinks.forEach((link, index) => {
        link.parentElement.style.setProperty('--item-index', index + 1);
    });
    
    // Aplicar clase scrolled al header en dispositivos móviles por defecto
    if (window.innerWidth <= 991) {
        header.classList.add('scrolled');
    }
    
    // Función para actualizar el enlace activo basado en la sección visible
    function updateActiveLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + header.offsetHeight + 50;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const menuLink = document.querySelector(`.menu a[href="#${sectionId}"]`);

            if (menuLink && scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                menuLinks.forEach(link => link.classList.remove('active'));
                menuLink.classList.add('active');
            }
        });
    }

    // Función para manejar el scroll
    function handleScroll() {
        requestAnimationFrame(() => {
            if (window.scrollY > 0) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Evento scroll con requestAnimationFrame para mejor rendimiento
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Verificar scroll inicial
    handleScroll();
    
    // Asegurarse de que el menú esté cerrado al inicio
    if (menu) {
        menu.classList.remove('active');
    }
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    // Función para manejar el menú móvil
    function toggleMenu(isOpen) {
        menu.classList.toggle('active', isOpen);
        menuToggle.classList.toggle('active', isOpen);
        overlay.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', isOpen);
        
        // Bloquear/desbloquear scroll del body
        document.body.style.overflow = isOpen ? 'hidden' : '';
        
        // Mejorar accesibilidad del menú
        menu.setAttribute('aria-hidden', !isOpen);
        
        // Añadir/quitar clase al body
        document.body.classList.toggle('menu-open', isOpen);
        
        // Animar elementos del menú
        const menuItems = menu.querySelectorAll('li');
        menuItems.forEach((item, index) => {
            if (isOpen) {
                item.style.transitionDelay = `${index * 0.1}s`;
            } else {
                item.style.transitionDelay = '0s';
            }
        });
    }
    
    // Evento para el botón del menú
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const isMenuOpen = !menu.classList.contains('active');
            toggleMenu(isMenuOpen);
        });
    }
    
    // Cerrar menú al hacer clic en overlay
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            toggleMenu(false);
        });
    }
    
    // Cerrar menú al hacer clic en un enlace
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 991) {
                const href = this.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    toggleMenu(false);
                    
                    // Scroll suave a la sección después de cerrar el menú
                    setTimeout(() => {
                        const targetSection = document.querySelector(href);
                        if (targetSection) {
                            const headerHeight = header.offsetHeight;
                            const targetPosition = targetSection.offsetTop - headerHeight;
                            window.scrollTo({
                                top: targetPosition,
                                behavior: 'smooth'
                            });
                        }
                    }, 300);
                }
            }
        });
    });
    
    // Cerrar menú con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menu.classList.contains('active')) {
            toggleMenu(false);
        }
    });
    
    // Manejar cambios de tamaño de ventana
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Si el menú está abierto y la pantalla es mayor a 991px, cerrar el menú
            if (window.innerWidth > 991 && menu.classList.contains('active')) {
                toggleMenu(false);
            }
            
            // Actualizar clase scrolled en el header
            if (window.innerWidth <= 991) {
                header.classList.add('scrolled');
            } else if (window.scrollY <= 50) {
                header.classList.remove('scrolled');
            }
        }, 250);
    });
    
    // Mejora en las animaciones al hacer scroll - Usar Intersection Observer
    const revealElements = document.querySelectorAll('.servicio-card, .caso-card, .nosotros-content, .contacto-content');
    
    // Crear un Intersection Observer para animaciones más eficientes
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Opcional: dejar de observar después de revelar
                    // revealObserver.unobserve(entry.target);
                }
            });
        }, {
            root: null, // viewport
            threshold: 0.1, // el elemento se considera visible cuando el 10% está en el viewport
            rootMargin: '-50px 0px' // trigger un poco antes de que sea visible
        });
        
        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    } else {
        // Fallback para navegadores que no soportan IntersectionObserver
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
    }
    
    // Validación del formulario de contacto con mejoras de accesibilidad
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Quitar mensajes de error previos
            const errorMessages = this.querySelectorAll('.form-error');
            errorMessages.forEach(error => error.remove());
            
            // Resetear estilos de campos con error
            const formInputs = this.querySelectorAll('input, textarea');
            formInputs.forEach(input => {
                input.classList.remove('input-error');
                input.setAttribute('aria-invalid', 'false');
            });
            
            // Validación mejorada con feedback por campo
            let isValid = true;
            
            // Validar nombre
            const nombre = document.getElementById('nombre');
            if (!nombre.value.trim()) {
                showInputError(nombre, 'Por favor, ingrese su nombre');
                isValid = false;
            }
            
            // Validar email
            const email = document.getElementById('email');
            if (!email.value.trim()) {
                showInputError(email, 'Por favor, ingrese su correo electrónico');
                isValid = false;
            } else if (!isValidEmail(email.value)) {
                showInputError(email, 'Por favor, ingrese un correo electrónico válido');
                isValid = false;
            }
            
            // Validar mensaje
            const mensaje = document.getElementById('mensaje');
            if (!mensaje.value.trim()) {
                showInputError(mensaje, 'Por favor, escriba su mensaje');
                isValid = false;
            }
            
            if (!isValid) return;
            
            // Mostrar estado de envío
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;
            
            // Simular envío exitoso (aquí normalmente iría una llamada AJAX)
            setTimeout(() => {
                showNotification('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.', 'success');
                contactForm.reset();
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }, 1000);
        });
    }
    
    // Función para mostrar errores en los campos del formulario
    function showInputError(inputElement, message) {
        // Añadir clase de error al input
        inputElement.classList.add('input-error');
        inputElement.setAttribute('aria-invalid', 'true');
        
        // Crear mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;
        
        // Asignar ID único para el mensaje de error y relacionarlo con el input
        const errorId = `error-for-${inputElement.id}`;
        errorDiv.id = errorId;
        inputElement.setAttribute('aria-describedby', errorId);
        
        // Insertar después del input
        inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
        
        // Enfocar el primer campo con error
        if (!document.querySelector('.input-error:focus')) {
            inputElement.focus();
        }
    }
    
    // Validación del formulario de newsletter con mejoras
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            // Limpiar errores previos
            const errorMessage = this.querySelector('.form-error');
            if (errorMessage) errorMessage.remove();
            emailInput.classList.remove('input-error');
            
            if (!email.trim() || !isValidEmail(email)) {
                showInputError(emailInput, 'Por favor, ingrese un correo electrónico válido');
                return;
            }
            
            // Mostrar estado de envío
            const submitBtn = newsletterForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;
            
            // Simular suscripción exitosa
            setTimeout(() => {
                showNotification('¡Gracias por suscribirte a nuestro newsletter!', 'success');
                newsletterForm.reset();
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }, 800);
        });
    }
    
    // Función para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Sistema de notificaciones mejorado con accesibilidad
    function showNotification(message, type = 'info') {
        // Eliminar notificaciones existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
        
        // Crear nueva notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        
        // Icono según el tipo de notificación
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
                break;
            case 'error':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
                break;
            default:
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }
        
        // Crear contenedor para el contenido
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        // Agregar icono
        const iconSpan = document.createElement('span');
        iconSpan.className = 'notification-icon';
        iconSpan.innerHTML = icon;
        content.appendChild(iconSpan);
        
        // Agregar mensaje
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        content.appendChild(messageSpan);
        
        notification.appendChild(content);
        
        // Añadir botón de cerrar
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.className = 'notification-close';
        closeButton.setAttribute('aria-label', 'Cerrar notificación');
        closeButton.addEventListener('click', function() {
            removeNotification(notification);
        });
        
        notification.appendChild(closeButton);
        document.body.appendChild(notification);
        
        // Añadir clase para animar entrada
        setTimeout(() => {
            notification.classList.add('notification-visible');
        }, 10);
        
        // Auto ocultar después de 5 segundos
        const timeout = setTimeout(() => {
            removeNotification(notification);
        }, 5000);
        
        // Pausar el timeout al hover
        notification.addEventListener('mouseenter', () => {
            clearTimeout(timeout);
        });
        
        // Reanudar al salir
        notification.addEventListener('mouseleave', () => {
            setTimeout(() => {
                removeNotification(notification);
            }, 2000);
        });
        
        function removeNotification(notif) {
            notif.classList.add('fade-out');
            setTimeout(() => {
                notif.remove();
            }, 300);
        }
    }
    
    // Inicializar atributos ARIA para accesibilidad
    if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-controls', menu.id);
        menuToggle.setAttribute('aria-label', 'Menú principal');
    }
    
    if (menu) {
        menu.setAttribute('role', 'navigation');
        menu.setAttribute('aria-label', 'Menú principal');
        menu.setAttribute('aria-hidden', 'true');
    }
    
    // Añadir estilos para las nuevas animaciones
    const style = document.createElement('style');
    style.textContent = `
        .menu-toggle-bounce {
            animation: menuToggleBounce 0.3s ease;
        }
        
        @keyframes menuToggleBounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .link-clicked {
            transform: scale(0.95);
            opacity: 0.8;
            transition: transform 0.2s ease, opacity 0.2s ease;
        }
        
        .menu.active .menu-item {
            animation: slideInRight 0.5s ease forwards;
        }
        
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    
    document.head.appendChild(style);
});