// modales.js - Gestión de modales en la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // ----- Gestión de Modales -----
    
    // Botones para abrir modales
    const addUserBtn = document.getElementById('add-user-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    const addLocationBtn = document.getElementById('add-location-btn');
    const addPaymentBtn = document.getElementById('add-payment-btn');
    
    // Modales
    const userModal = document.getElementById('user-modal');
    const productModal = document.getElementById('product-modal');
    const locationModal = document.getElementById('location-modal');
    const paymentModal = document.getElementById('payment-modal');
    
    // Botones para cerrar modales
    const closeButtons = document.querySelectorAll('.modal-close, .cancel-btn');
    
    // Abrir modales
    if (addUserBtn && userModal) {
        addUserBtn.addEventListener('click', function() {
            console.log('Abriendo modal de usuario');
            userModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (addProductBtn && productModal) {
        addProductBtn.addEventListener('click', function() {
            productModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (addLocationBtn && locationModal) {
        addLocationBtn.addEventListener('click', function() {
            locationModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (addPaymentBtn && paymentModal) {
        addPaymentBtn.addEventListener('click', function() {
            paymentModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Cerrar modales con botones
    closeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Cerrar modales haciendo clic fuera
    const modals = document.querySelectorAll('.modal');
    modals.forEach(function(modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Para debugging - verificar que los elementos existen
    console.log('Botón de usuario:', addUserBtn);
    console.log('Modal de usuario:', userModal);
});