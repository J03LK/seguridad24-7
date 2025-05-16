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
