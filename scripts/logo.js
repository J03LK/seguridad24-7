document.addEventListener('mousemove', function(e) {
    const logo = document.querySelector('.floating-logo');
    
    // Calcular posición relativa del ratón en la ventana
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    // Mover el logo ligeramente en dirección opuesta al movimiento del ratón
    // para crear un efecto de flotación natural
    const moveX = (mouseX - 0.5) * -20; // -10px a 10px
    const moveY = (mouseY - 0.5) * -20; // -10px a 10px
    
    // Aplicar transformación con animación suave
    logo.style.transition = 'transform 2s ease-out';
    logo.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
});

// Efecto parallax suave al hacer scroll
window.addEventListener('scroll', function() {
    const scrollY = window.scrollY;
    
    // Calcular escala basada en el scroll (efecto de zoom sutil)
    const scale = 1 + scrollY * 0.0002; // incremento muy sutil
    
    // Efectos de brillo
    document.querySelectorAll('.bg-glow').forEach((glow, index) => {
        const speed = 0.05 + (index * 0.02);
        const yPos = -scrollY * speed;
        glow.style.transform = `translateY(${yPos}px)`;
    });
});