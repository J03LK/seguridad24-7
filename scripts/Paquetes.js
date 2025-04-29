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
<<<<<<< HEAD


=======
// Base de datos de productos para la página de paquetes
const productosPaquetes = [
    {
        id: 1,
        nombre: 'Cámaras de Seguridad HD',
        descripcion: 'Cámaras de vigilancia HD con visión nocturna, detección de movimiento y almacenamiento en la nube. Ideales para monitorear tu hogar o negocio las 24 horas del día con la mejor calidad de imagen.',
        imagen: 'assets/IMAGEN-PAQUETE/IMAGENPAQUTE16.jpg',
        categoria: 'cameras'
    },
    {
        id: 2,
        nombre: 'Cercos Eléctricos Perimetrales',
        descripcion: 'Sistemas de cercos eléctricos de alta tecnología para la protección perimetral de tu propiedad. Incluyen alarma, señalización y control remoto desde tu smartphone. Instalación profesional y garantizada.',
        imagen: 'assets/IMAGEN-PAQUETE/IMAGENPAQUETE17.jpg',
        categoria: 'fences'
    },
    {
        id: 3,
        nombre: 'Control de Acceso Biométrico',
        descripcion: 'Sistemas avanzados de control de acceso con tecnología biométrica, tarjetas RFID y código PIN. Perfectos para empresas que necesitan gestionar el acceso de personal a áreas específicas con máxima seguridad.',
        imagen: 'assets/IMAGEN-PAQUETE/IMAGENPAQUETE18.jpg',
        categoria: 'access'
    },
    {
        id: 4,
        nombre: 'Sistemas de Voceo IP',
        descripcion: 'Soluciones de comunicación por altavoces IP con audio bidireccional. Ideal para anuncios, comunicados de emergencia y atención al público en comercios, escuelas e instituciones.',
        imagen: 'assets/IMAGEN-PAQUETE/IMAGENPAQUETE19.jpg',
        categoria: 'audio'
    },
    {
        id: 5,
        nombre: 'Sistemas de Alarma Inteligentes',
        descripcion: 'Alarmas de última generación con conexión WiFi, sensores de movimiento, sensores para puertas/ventanas y notificaciones al smartphone. Protección completa para tu hogar o negocio con monitoreo 24/7.',
        imagen: 'assets/IMAGEN-PAQUETE/IMAGENPAQUETE22.webp',
        categoria: 'alarms'
    },
    {
        id: 6,
        nombre: 'Botones de Pánico Inalámbricos',
        descripcion: 'Botones de pánico inalámbricos con tecnología de respuesta inmediata. Al activarse, alertan automáticamente a nuestro centro de monitoreo para una respuesta rápida ante emergencias.',
        imagen: 'assets/IMAGEN-PAQUETE/IMAGENPAQUETE20.jpeg',
        categoria: 'panic'
    }
];

// Función para inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    // Configurar listeners para todas las imágenes de productos
    configurarImagenesProductos();
    
    // Configurar los botones "Seleccionar" de los paquetes
    configurarBotonesPaquetes();
    
    // Configurar el cierre del modal
    configurarCierreModal();
    
    // Configurar botones de agregar al carrito en categorías
    configurarBotonesCarrito();
});

// Configurar modal para las imágenes de productos
function configurarImagenesProductos() {
    // Seleccionar todas las imágenes dentro de category-item
    const imagenesProductos = document.querySelectorAll('.category-item img');
    
    imagenesProductos.forEach(img => {
        img.addEventListener('click', function(e) {
            // Prevenir la navegación a otra página
            e.preventDefault();
            
            // Obtener el alt de la imagen (que contiene el nombre del producto)
            const nombreProducto = this.alt;
            
            // Buscar el producto por nombre
            const producto = productosPaquetes.find(p => 
                p.nombre.toLowerCase() === nombreProducto.toLowerCase() || 
                normalizar(p.nombre).includes(normalizar(nombreProducto))
            );
            
            if (producto) {
                // Mostrar el producto en el modal
                mostrarModalProducto(producto);
            } else {
                console.warn('Producto no encontrado:', nombreProducto);
                // Buscar por coincidencia de imagen
                const srcImg = this.getAttribute('src');
                const productoImg = productosPaquetes.find(p => p.imagen === srcImg);
                
                if (productoImg) {
                    mostrarModalProducto(productoImg);
                }
            }
        });
    });
}

// Normalizar texto para comparaciones (quitar acentos, minúsculas)
function normalizar(texto) {
    return texto.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// Mostrar modal con la información del producto
function mostrarModalProducto(producto) {
    // Obtener elementos del modal
    const modal = document.getElementById('modalProducto');
    const modalImg = document.getElementById('modalImgProducto');
    const modalNombre = document.getElementById('modalNombreProducto');
    const modalDescripcion = document.getElementById('modalDescripcionProducto');
    
    // Configurar contenido del modal
    modalImg.src = producto.imagen;
    modalImg.alt = producto.nombre;
    modalNombre.textContent = producto.nombre;
    modalDescripcion.textContent = producto.descripcion;
    
    // Mostrar modal con animación
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Prevenir scroll en el body
    document.body.style.overflow = 'hidden';
}

// Configurar cierre del modal
function configurarCierreModal() {
    const closeBtn = document.querySelector('.close-modal-producto');
    const modal = document.getElementById('modalProducto');
    
    if (closeBtn && modal) {
        // Cierre al hacer clic en la X
        closeBtn.addEventListener('click', cerrarModal);
        
        // Cierre al hacer clic fuera del contenido
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModal();
            }
        });
        
        // Cierre con la tecla ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                cerrarModal();
            }
        });
    }
}

// Cerrar modal
function cerrarModal() {
    const modal = document.getElementById('modalProducto');
    
    if (modal) {
        modal.classList.remove('active');
        
        // Ocultar después de la animación
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        // Restaurar scroll
        document.body.style.overflow = '';
    }
}

// Configurar botones de paquetes
function configurarBotonesPaquetes() {
    const botonesPaquetes = document.querySelectorAll('.paquete button');
    
    botonesPaquetes.forEach(boton => {
        boton.addEventListener('click', function() {
            // Obtener el nombre del paquete
            const paquete = this.closest('.paquete');
            const nombrePaquete = paquete.querySelector('h3').textContent;
            
            // Mostrar modal de confirmación
            mostrarModalConfirmacion(nombrePaquete);
        });
    });
}

// Mostrar modal de confirmación para paquetes
function mostrarModalConfirmacion(nombrePaquete) {
    // Crear modal de confirmación
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal-producto';
    modalDiv.id = 'modalConfirmacion';
    
    modalDiv.innerHTML = `
        <div class="modal-content-producto">
            <span class="close-modal-confirmacion">&times;</span>
            <h3>¡Excelente elección!</h3>
            <p>Has seleccionado el <strong>${nombrePaquete}</strong>.</p>
            <p>Uno de nuestros asesores se pondrá en contacto contigo para brindarte más información y concretar la instalación.</p>
            <form id="formContactoPaquete">
                <input type="text" placeholder="Tu nombre" required>
                <input type="email" placeholder="Tu correo electrónico" required>
                <input type="tel" placeholder="Tu teléfono" required>
                <button type="submit">Enviar información</button>
            </form>
        </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(modalDiv);
    
    // Mostrar modal
    setTimeout(() => {
        modalDiv.style.display = 'flex';
        
        setTimeout(() => {
            modalDiv.classList.add('active');
        }, 10);
    }, 10);
    
    // Evitar scroll
    document.body.style.overflow = 'hidden';
    
    // Configurar cierre
    const closeBtn = modalDiv.querySelector('.close-modal-confirmacion');
    closeBtn.addEventListener('click', function() {
        cerrarModalConfirmacion(modalDiv);
    });
    
    // Cierre al hacer clic fuera
    modalDiv.addEventListener('click', function(e) {
        if (e.target === modalDiv) {
            cerrarModalConfirmacion(modalDiv);
        }
    });
    
    // Manejar envío del formulario
    const form = document.getElementById('formContactoPaquete');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Aquí iría la lógica para enviar los datos
        // Por ahora, sólo mostramos un mensaje de éxito
        
        modalDiv.querySelector('.modal-content-producto').innerHTML = `
            <h3>¡Gracias por tu interés!</h3>
            <p>Hemos recibido tu información y nos pondremos en contacto a la brevedad.</p>
            <button id="btnCerrarConfirmacion">Cerrar</button>
        `;
        
        // Configurar botón de cierre
        document.getElementById('btnCerrarConfirmacion').addEventListener('click', function() {
            cerrarModalConfirmacion(modalDiv);
        });
    });
}

// Cerrar modal de confirmación
function cerrarModalConfirmacion(modal) {
    modal.classList.remove('active');
    
    // Ocultar y eliminar después de la animación
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.removeChild(modal);
    }, 300);
    
    // Restaurar scroll
    document.body.style.overflow = '';
}

// Configurar botones de agregar al carrito
function configurarBotonesCarrito() {
    const botonesCarrito = document.querySelectorAll('.btn-agregar-carrito');
    
    botonesCarrito.forEach(boton => {
        boton.addEventListener('click', function(e) {
            // Prevenir navegación automática
            e.preventDefault();
            e.stopPropagation();
            
            // Obtener información del producto
            const categoriaItem = this.closest('.category-item');
            const nombreProducto = categoriaItem.querySelector('span').textContent;
            const imagenProducto = categoriaItem.querySelector('img').getAttribute('src');
            
            // Buscar el producto en la lista
            const producto = productosPaquetes.find(p => 
                p.nombre.toLowerCase() === nombreProducto.toLowerCase() || 
                normalizar(p.nombre).includes(normalizar(nombreProducto)) ||
                p.imagen === imagenProducto
            );
            
            if (producto) {
                // Agregar al carrito (aquí usaremos la función del Carrito.js)
                if (typeof agregarAlCarrito === 'function') {
                    agregarAlCarrito(producto.id);
                    mostrarToastConfirmacion(producto);
                } else {
                    // Si la función no está disponible, redirigimos a la página del carrito
                    window.location.href = 'carrito.html';
                }
            } else {
                // Si no encontramos el producto, redirigimos a la página del carrito
                window.location.href = 'carrito.html';
            }
        });
    });
}

// Mostrar confirmación de producto agregado
function mostrarToastConfirmacion(producto) {
    // Verificar si ya existe un toast
    let toast = document.querySelector('.toast-notificacion');
    
    if (!toast) {
        // Crear el toast
        toast = document.createElement('div');
        toast.className = 'toast-notificacion';
        document.body.appendChild(toast);
    }
    
    // Configurar contenido
    toast.innerHTML = `
        <div class="toast-content">
            <img src="${producto.imagen}" alt="${producto.nombre}">
            <div class="toast-info">
                <p class="toast-title">Producto agregado</p>
                <p class="toast-message">${producto.nombre}</p>
            </div>
            <button class="toast-close">&times;</button>
        </div>
    `;
    
    // Mostrar el toast
    toast.classList.add('show');
    
    // Configurar cierre
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function() {
        toast.classList.remove('show');
    });
    
    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        
        // Eliminar después de la animación
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}
>>>>>>> 52b7fbd (Corrigiendoa)
