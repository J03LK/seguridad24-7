document.addEventListener('DOMContentLoaded', function() {
    // Animación de contador para estadísticas
    const counters = document.querySelectorAll('.stat-number');
    const speed = 200;
    
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        let count = 0;
        
        const updateCount = () => {
            const increment = target / speed;
            
            if (count < target) {
                count += increment;
                counter.textContent = Math.ceil(count);
                setTimeout(updateCount, 20);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCount();
    });
    
    // Acordeón para preguntas frecuentes
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = item.querySelector('.faq-icon');
        
        question.addEventListener('click', () => {
            // Cerrar todas las respuestas
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').classList.add('hidden');
                    otherItem.querySelector('.faq-icon').textContent = '+';
                }
            });
            
            // Alternar el estado actual
            item.classList.toggle('active');
            answer.classList.toggle('hidden');
            
            if (item.classList.contains('active')) {
                icon.textContent = '—';
            } else {
                icon.textContent = '+';
            }
        });
    });
});
/* JavaScript para animaciones de scroll */
/* Agregar este código también al archivo script.js */
document.addEventListener('DOMContentLoaded', function() {
    const scrollElements = document.querySelectorAll('.section-title, .servicio-card, .caracteristicas-title, .caracteristica-card, .cta-container, .stat-card, .trabajo-card, .why-us-images, .why-us-content, .faq-header, .faq-item, .faq-right');
    
    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };
    
    const displayScrollElement = (element) => {
        element.classList.add('visible');
    };
    
    const hideScrollElement = (element) => {
        element.classList.remove('visible');
    };
    
    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.25)) {
                displayScrollElement(el);
            } else {
                hideScrollElement(el);
            }
        });
    };
    
    // Initialize on load
    handleScrollAnimation();
    
    // Add scroll event listener
    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });
});
// Añadir al script.js existente
document.addEventListener('DOMContentLoaded', function() {
    const scrollElements = document.querySelectorAll('.section-title, .servicio-card, .caracteristicas-title, .caracteristica-card, .cta-container, .stat-card, .trabajo-card, .why-us-images, .why-us-content, .faq-header, .faq-item, .faq-right');
    
    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };
    
    const displayScrollElement = (element) => {
        element.classList.add('visible');
    };
    
    const hideScrollElement = (element) => {
        element.classList.remove('visible');
    };
    
    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.25)) {
                displayScrollElement(el);
            } else {
                hideScrollElement(el);
            }
        });
    };
    
    // Initialize on load
    handleScrollAnimation();
    
    // Add scroll event listener
    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });
});
