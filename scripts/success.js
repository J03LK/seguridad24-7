  // Mostrar la fecha actual
  document.addEventListener("DOMContentLoaded", function() {
    const dateElement = document.getElementById("order-date");
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('es-ES', options);
    
    // Generar número de orden aleatorio
    const orderNumber = document.getElementById("order-number");
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    orderNumber.textContent = `247-${randomNum}`;
    
    // Animación de marca de verificación
    const checkmarkContainer = document.getElementById('checkmark-animation');
    if (checkmarkContainer && typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: checkmarkContainer,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: 'assets/checkmark-animation.json' // Asegúrate de tener este archivo
        });
    }
});
