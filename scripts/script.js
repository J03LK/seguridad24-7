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
    // Script para enviar datos del formulario a WhatsApp
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obtener los valores del formulario
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const mensaje = document.getElementById('mensaje').value;
    
    // Crear el mensaje para WhatsApp
    let mensajeWhatsApp = `¡Hola! Me interesa solicitar asesoría de seguridad.%0A%0A`;
    mensajeWhatsApp += `👤 *Nombre:* ${nombre}%0A`;
    mensajeWhatsApp += `📧 *Email:* ${email}%0A`;
    
    if (whatsapp) {
        mensajeWhatsApp += `📱 *WhatsApp:* ${whatsapp}%0A`;
    }
    
    mensajeWhatsApp += `%0A💬 *Mensaje:*%0A${mensaje}`;
    
    // Número de WhatsApp (formato internacional)
    const numeroWhatsApp = '593984107006'; // Ecuador + tu número
    
    // Crear la URL de WhatsApp
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeWhatsApp}`;
    
    // Abrir WhatsApp
    window.open(urlWhatsApp, '_blank');
    
    // Opcional: limpiar el formulario después del envío
    this.reset();
});
 
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
            // Asegurarse de que el valor final sea exactamente el objetivo
            element.textContent = target;
 
            // Añadir el signo + si la clase correspondiente está presente
            if (element.classList.contains('with-plus')) {
                element.textContent = target + '+';
            }
        }
    };
 
    // Iniciar la animación
    requestAnimationFrame(updateCount);
}
 
// Función para reiniciar los contadores cuando la sección vuelve a ser visible
// (útil al hacer scroll hacia arriba y abajo en la página)
window.addEventListener('scroll', function () {
    const statsSection = document.querySelector('.stats-section');
    if (!statsSection) return;
 
    const rect = statsSection.getBoundingClientRect();
    const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
 
    if (isVisible) {
        // Verificar si necesitamos reiniciar (si los contadores ya han terminado)
        const statNumbers = document.querySelectorAll('.stat-number');
        const needsReset = Array.from(statNumbers).some(el => {
            const target = parseInt(el.getAttribute('data-target'));
            const current = parseInt(el.textContent);
            return current === target; // Ya ha terminado de contar
        });
 
        if (needsReset) {
            // Reiniciar para cada número
            statNumbers.forEach(statNumber => {
                const target = parseInt(statNumber.getAttribute('data-target'));
                // Reiniciar a 0 y animar de nuevo
                statNumber.textContent = '0';
                animateCounter(statNumber, target);
            });
        }
    }
}, { passive: true });
// JavaScript para la funcionalidad del menú móvil
document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');
    const overlay = document.getElementById('overlay');
    const header = document.querySelector('header');
    const authButtons = document.querySelector('.auth-buttons');
 
    menuToggle.addEventListener('click', function () {
        this.classList.toggle('active');
        menu.classList.toggle('active');
        overlay.classList.toggle('active');
 
        const expanded = this.getAttribute('aria-expanded') === 'true' || false;
        this.setAttribute('aria-expanded', !expanded);
    });
 
    // Mantener visible el header y los botones al hacer scroll
    window.addEventListener('scroll', function () {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
 
        // Asegurarse de que los botones permanezcan visibles
        if (window.innerWidth > 768) {
            authButtons.style.visibility = 'visible';
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
// Script completo para integrar WhatsApp con todos los botones CTA
document.addEventListener('DOMContentLoaded', function() {
    
    // Número de WhatsApp (formato internacional)
    const numeroWhatsApp = '593984107006';
    
    // Función para abrir WhatsApp con mensaje personalizado
    function abrirWhatsApp(mensaje) {
        const mensajeEncoded = encodeURIComponent(mensaje);
        const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeEncoded}`;
        window.open(urlWhatsApp, '_blank');
    }
    
    // 1. Botón "Solicitar Demostración" del hero
    const btnDemostracion = document.querySelector('a[href="#contacto"]');
    if (btnDemostracion && btnDemostracion.textContent.includes('Solicitar Demostración')) {
        btnDemostracion.addEventListener('click', function(e) {
            e.preventDefault();
            const mensaje = `🏢 ¡Hola! Me interesa solicitar una demostración de sus servicios de seguridad virtual.

📋 Me gustaría conocer más sobre:
• Guardia Virtual 24/7
• Reconocimiento facial
• Sistemas de monitoreo remoto
• Análisis de vulnerabilidades

¿Podrían agendar una demostración personalizada?`;
            abrirWhatsApp(mensaje);
        });
    }
    
    // 2. Botones "Solicitar Asesoría Personalizada" (domótica)
    const btnAsesoria = document.querySelectorAll('a[href="#contacto"]');
    btnAsesoria.forEach(btn => {
        if (btn.textContent.includes('Asesoría Personalizada')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const mensaje = `🏠 ¡Hola! Estoy interesado en una asesoría personalizada sobre domótica y automatización del hogar.

🔧 Me interesa conocer sobre:
• Automatización de iluminación
• Control de electrodomésticos
• Simulación de presencia
• Sistema de riego automatizado
• Integración con seguridad

¿Podrían brindarme una consulta personalizada?`;
                abrirWhatsApp(mensaje);
            });
        }
    });
    
    // 3. Botón "Solicitar Análisis Gratis"
    const btnAnalisis = document.querySelectorAll('a[href="#contacto"]');
    btnAnalisis.forEach(btn => {
        if (btn.textContent.includes('Análisis Gratis')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const mensaje = `🔍 ¡Hola! Me interesa el análisis gratuito de vulnerabilidades de seguridad. ¿Podrían agendar una evaluación?`;
                abrirWhatsApp(mensaje);
            });
        }
    });
    
    // 4. Formulario de contacto (si lo agregas después)
    const formularioContacto = document.getElementById('contact-form');
    if (formularioContacto) {
        formularioContacto.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtener los valores del formulario
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const whatsapp = document.getElementById('whatsapp').value;
            const mensaje = document.getElementById('mensaje').value;
            
            // Crear el mensaje para WhatsApp
            let mensajeWhatsApp = `📝 ¡Hola! Me interesa solicitar asesoría de seguridad.

👤 *Datos de contacto:*
• Nombre: ${nombre}
• Email: ${email}`;
            
            if (whatsapp) {
                mensajeWhatsApp += `
• WhatsApp: ${whatsapp}`;
            }
            
            mensajeWhatsApp += `

💬 *Mensaje/Requerimiento:*
${mensaje}

¿Podrían contactarme para brindarme más información?`;
            
            // Abrir WhatsApp
            abrirWhatsApp(mensajeWhatsApp);
            
            // Opcional: limpiar el formulario después del envío
            this.reset();
        });
    }
    
    // 5. Newsletter - convertir a WhatsApp también
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            const mensaje = `📧 ¡Hola! Me gustaría suscribirme para recibir novedades y ofertas.

📬 Email para suscripción: ${email}

Por favor, manténganme informado sobre:
• Nuevos servicios de seguridad
• Promociones especiales  
• Tips de seguridad
• Actualizaciones tecnológicas`;
            
            abrirWhatsApp(mensaje);
            this.reset();
        });
    }
    
    // 6. Links del menú de servicios específicos
    const linkGuardiaVirtual = document.querySelector('a[href="servicios.html#guardia-virtual"]');
    if (linkGuardiaVirtual) {
        linkGuardiaVirtual.addEventListener('click', function(e) {
            e.preventDefault();
            const mensaje = `🛡️ ¡Hola! Me interesa específicamente el servicio de Guardia Virtual.

🔹 Quiero información sobre:
• Monitoreo 24/7
• Reconocimiento facial
• Sistema de perifoneo
• Botón de pánico
• Costos y planes disponibles

¿Podrían brindarme más detalles?`;
            abrirWhatsApp(mensaje);
        });
    }
    
    // 7. Función genérica para otros botones CTA
    function agregarEventoWhatsApp(selector, mensajePersonalizado) {
        const elementos = document.querySelectorAll(selector);
        elementos.forEach(elemento => {
            elemento.addEventListener('click', function(e) {
                e.preventDefault();
                abrirWhatsApp(mensajePersonalizado);
            });
        });
    }
    
    // Agregar más botones según necesites:
    // agregarEventoWhatsApp('.mi-clase-boton', 'Mi mensaje personalizado');
    
});

// Función adicional para crear botones dinámicos de WhatsApp
function crearBotonWhatsApp(texto, mensaje, clases = 'cta-button') {
    const boton = document.createElement('a');
    boton.href = '#';
    boton.className = clases;
    boton.textContent = texto;
    boton.addEventListener('click', function(e) {
        e.preventDefault();
        const mensajeEncoded = encodeURIComponent(mensaje);
        const urlWhatsApp = `https://wa.me/593984107006?text=${mensajeEncoded}`;
        window.open(urlWhatsApp, '_blank');
    });
    return boton;
}
