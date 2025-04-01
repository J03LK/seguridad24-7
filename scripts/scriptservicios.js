
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
