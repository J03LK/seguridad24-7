
window.addEventListener('scroll', function() {
    let scrollPosition = window.scrollY;
    let section = document.querySelector('.protection-products');
    let title = document.querySelector('.protection-products h1');
    
    // Si el scroll es mayor a 50px, agregar el desenfoque y ocultar el título
    if (scrollPosition > 50) {
        section.classList.add('blur-background');
        section.classList.add('hide-title');
    } else {
        // Si el scroll está arriba, restaurar el fondo y mostrar el título
        section.classList.remove('blur-background');
        section.classList.remove('hide-title');
    }
});
// Agregar este código a tu archivo JavaScript o en una etiqueta <script> al final de tu HTML

// Inicializa las animaciones solo cuando los elementos son visibles en pantalla
document.addEventListener('DOMContentLoaded', function() {
    // Crear observer para detectar elementos visibles
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    // Observar elementos que necesitan animaciones
    document.querySelectorAll('.section-title, .feature-card, .benefit-card, .service-box').forEach(el => {
        observer.observe(el);
    });

    // Desactivar animaciones en dispositivos móviles o con preferencia de movimiento reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    
    if (prefersReducedMotion || isMobile) {
        document.body.classList.add('reduced-motion');
    }

    // Optimización de imágenes - carga diferida
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        });
        
        img.src = img.dataset.src;
    });

    // Optimizar videos
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        // Reproducir videos solo cuando son visibles
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (video.paused) video.play();
                } else {
                    if (!video.paused) video.pause();
                }
            });
        }, { threshold: 0.3 });
        
        videoObserver.observe(video);
        
        // Reducir calidad en móviles
        if (isMobile) {
            video.setAttribute('playsinline', '');
            
            if (video.dataset.mobileSrc) {
                video.src = video.dataset.mobileSrc;
            }
        }
    });
    
    // Añadir debounce para eventos de scroll y resize
    function debounce(func, wait = 20, immediate = true) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
    
    // Optimizar eventos de scroll
    const scrollHandler = debounce(() => {
        // Tu código de manejo de scroll aquí
    });
    
    window.addEventListener('scroll', scrollHandler);
    
    // Optimizar eventos de resize
    const resizeHandler = debounce(() => {
        // Tu código de manejo de resize aquí
    }, 100);
    
    window.addEventListener('resize', resizeHandler);
});
// JavaScript adicional para la optimización de la sección de Guardia Virtual y Protection Products

document.addEventListener('DOMContentLoaded', function() {
    // Función para optimizar las imágenes de fondo
    function optimizeBackgroundImages() {
        const bgElements = document.querySelectorAll('.protection-products');
        
        bgElements.forEach(el => {
            // Verificar si estamos en móvil para cargar una imagen de menor resolución
            if (window.innerWidth < 768) {
                const mobileBg = el.dataset.mobileBg;
                if (mobileBg) {
                    el.style.backgroundImage = `url(${mobileBg})`;
                }
            }
        });
    }
    
    // Optimización del scroll para el efecto de título
    function handleScroll() {
        const protectionSection = document.querySelector('.protection-products');
        if (!protectionSection) return;
        
        const scrollPosition = window.scrollY;
        
        // Añadir clase solo cuando sea necesario (al bajar un poco)
        if (scrollPosition > 50) {
            protectionSection.classList.add('hide-title');
            
            // Añadir blur solo después de que el título se haya desvanecido
            if (scrollPosition > 150) {
                protectionSection.classList.add('blur-background');
            } else {
                protectionSection.classList.remove('blur-background');
            }
        } else {
            protectionSection.classList.remove('hide-title', 'blur-background');
        }
    }
    
    // Observer para elementos que necesitan animación cuando son visibles
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });
    
    // Aplicar a elementos que necesitan animación al ser visibles
    document.querySelectorAll('.section-title, .video-frame, .icon').forEach(el => {
        animationObserver.observe(el);
    });
    
    // Optimización de videos e iframes
    function optimizeVideos() {
        const videoFrames = document.querySelectorAll('.video-frame iframe');
        
        videoFrames.forEach(frame => {
            // Lazy loading para iframes
            frame.loading = 'lazy';
            
            // Si es un video de YouTube, optimizar parámetros
            if (frame.src.includes('youtube.com')) {
                // Asegurarse de que la URL tenga los parámetros correctos
                const url = new URL(frame.src);
                
                // Añadir parámetros de rendimiento a YouTube
                url.searchParams.set('rel', '0'); // No mostrar videos relacionados
                url.searchParams.set('autoplay', '0'); 
                url.searchParams.set('modestbranding', '1');
                
                // En móviles, reducir la calidad
                if (window.innerWidth < 768) {
                    url.searchParams.set('vq', 'medium');
                }
                
                frame.src = url.toString();
            }
        });
    }
    
    // Detectar preferencias de movimiento reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Si se prefiere movimiento reducido, desactivar todas las animaciones
    if (prefersReducedMotion) {
        document.documentElement.classList.add('reduced-motion');
        
        // Agregar estilos personalizados para deshabilitar animaciones
        const style = document.createElement('style');
        style.textContent = `
            .reduced-motion * {
                transition: none !important;
                animation: none !important;
            }
        `;
        document.head.appendChild(style);
    } else {
        // Solo aplicar efectos de scroll si no hay preferencia de movimiento reducido
        window.addEventListener('scroll', debounce(handleScroll, 10));
    }
    
    // Función debounce para mejorar rendimiento
    function debounce(func, wait = 20, immediate = true) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
    
    // Aplicar optimizaciones solo después de que la página esté completamente cargada
    window.addEventListener('load', function() {
        optimizeBackgroundImages();
        optimizeVideos();
        
        // Iniciar con elementos visibles en el viewport
        handleScroll();
    });
    
    // Manejar cambios de tamaño de ventana (con debounce para rendimiento)
    window.addEventListener('resize', debounce(function() {
        optimizeBackgroundImages();
    }, 100));
});