// Función para animar el contador de estadísticas
document.addEventListener('DOMContentLoaded', function () {
    // Opciones para el observador de intersección
    const options = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1 // 10% visible
    };

    // Callback para cuando la sección es visible
    const callback = function (entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Iniciar la animación de conteo para cada número
                const statNumbers = document.querySelectorAll('.stat-number');
                statNumbers.forEach(statNumber => {
                    // Obtener el valor final del atributo data-target
                    const target = parseInt(statNumber.getAttribute('data-target'));
                    // Iniciar el contador
                    animateCounter(statNumber, target);
                });
                // Desconectar el observador después de animar
                observer.unobserve(entry.target);
            }
        });
    };

    // Crear el observador de intersección
    const observer = new IntersectionObserver(callback, options);

    // Observar la sección de estadísticas
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
    }
});

// Función para animar un contador
function animateCounter(element, target) {
    // Iniciar desde 0
    let count = 0;
    // Calcular la duración según el tamaño del número
    const duration = 2000; // 2 segundos
    // Calcular el incremento por paso
    const increment = target / (duration / 16); // 16ms es aproximadamente 60fps

    // Función de actualización
    const updateCount = () => {
        count += increment;
        // Redondear hacia abajo mientras contamos
        const currentCount = Math.floor(count);

        // Actualizar el texto del elemento
        element.textContent = currentCount;

        // Continuar la animación hasta alcanzar el objetivo
        if (currentCount < target) {
            requestAnimationFrame(updateCount);
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
        
        // Bloquear/desbloquear scroll del body
        document.body.style.overflow = isOpen ? 'hidden' : '';
        
        // Animar elementos del menú
        const menuItems = menu.querySelectorAll('li');
        menuItems.forEach((item, index) => {
            if (isOpen) {
                item.style.transitionDelay = `${index * 0.1}s`;
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            } else {
                item.style.transitionDelay = '0s';
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
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
    
    // Elementos a animar
    const elements = document.querySelectorAll('.paquete, .tech-image, .tech-icons, .step, .category-item');
    
    // Función para verificar si un elemento es visible
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Función para manejar la visibilidad
    function handleVisibility() {
        elements.forEach(element => {
            if (isElementInViewport(element)) {
                element.classList.add('visible');
            }
        });
    }
    
    // Ejecutar al cargar y al hacer scroll
    handleVisibility();
    window.addEventListener('scroll', handleVisibility);
    
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
    });

    // Cerrar menú al hacer clic en un enlace o en el overlay
    const menuLinks = document.querySelectorAll('.menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function () {
            menu.classList.remove('active');
            menuToggle.classList.remove('active');
            overlay.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });

    overlay.addEventListener('click', function () {
        menu.classList.remove('active');
        menuToggle.classList.remove('active');
        this.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    });
});