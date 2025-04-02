function showDetails(paquete) {
    const popup = document.getElementById('popup');
    const title = document.getElementById('popup-title');
    const details = document.getElementById('popup-details');

    if (paquete === 'Paquete 1') {
        title.textContent = 'Paquete Básico';
        details.textContent = 'Este paquete incluye los servicios básicos de seguridad privada. Es ideal para quienes buscan una opción económica.';
    } else if (paquete === 'Paquete 2') {
        title.textContent = 'Paquete Avanzado';
        details.textContent = 'Este paquete incluye monitoreo 24/7, respuesta rápida ante emergencias y más beneficios adicionales.';
    } else if (paquete === 'Paquete 3') {
        title.textContent = 'Paquete Premium';
        details.textContent = 'El Paquete Premium ofrece todo lo del paquete avanzado más protección adicional y servicios exclusivos.';
    }

    popup.style.display = 'flex';
}

function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}


