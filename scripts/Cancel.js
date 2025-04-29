document.addEventListener("DOMContentLoaded", function() {
    // Animación de error
    const errorContainer = document.getElementById('error-animation');
    if (errorContainer && typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: errorContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'assets/error-animation.json' // Asegúrate de tener este archivo
        });
    }
});