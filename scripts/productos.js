document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Verificando Firebase');
    
    try {
        // Verificar si Firebase está definido
        if (typeof firebase === 'undefined') {
            console.error('ERROR: Firebase no está definido');
            document.getElementById('productos-container').innerHTML = 
                '<div class="error">Firebase no está inicializado</div>';
            return;
        }
        
        console.log('Firebase está disponible');
        
        // Verificar si Firebase está inicializado
        if (!firebase.apps || !firebase.apps.length) {
            console.error('ERROR: Firebase no está inicializado - No hay apps');
            return;
        }
        
        console.log('Firebase está inicializado correctamente');
        
        // Acceder a Firestore
        const dbRef = firebase.firestore();
        console.log('Firestore accesible correctamente');
        
        // Intentar obtener productos
        console.log('Obteniendo productos...');
        dbRef.collection('productos').get()
            .then(snapshot => {
                console.log(`Consulta completada - Encontrados: ${snapshot.size} productos`);
                
                // Mostrar productos
                let html = '<div class="productos-grid">';
                
                if (snapshot.empty) {
                    html = '<div class="sin-productos">No hay productos disponibles</div>';
                } else {
                    snapshot.forEach(doc => {
                        const producto = doc.data();
                        console.log(`Producto encontrado - ID: ${doc.id}, Nombre: ${producto.name || 'Sin nombre'}`);
                        
                        html += `
                            <div class="producto-card">
                                <div class="producto-imagen">
                                    <img src="${producto.imageUrl || 'assets/producto-default.jpg'}" alt="${producto.name || 'Producto'}">
                                </div>
                                <div class="producto-info">
                                    <h3>${producto.name || 'Producto sin nombre'}</h3>
                                    <p class="producto-precio">$${parseFloat(producto.price || 0).toFixed(2)}</p>
                                </div>
                            </div>
                        `;
                    });
                    
                    html += '</div>';
                }
                
                document.getElementById('productos-container').innerHTML = html;
            })
            .catch(error => {
                console.error('Error al obtener productos:', error);
                document.getElementById('productos-container').innerHTML = 
                    `<div class="error">Error: ${error.message}</div>`;
            });
            
    } catch (error) {
        console.error('Error general:', error);
        document.getElementById('productos-container').innerHTML = 
            `<div class="error">Error general: ${error.message}</div>`;
    }
    
    // Inicializar el carrito modal (IMPORTANTE: ahora está fuera del try-catch y sin un segundo DOMContentLoaded)
    iniciarCarritoModal();
});

// Variables globales
let carritoAbierto = false;

// Inicializar el carrito modal
function iniciarCarritoModal() {
    console.log('Inicializando carrito modal');
    
    // Referencias a elementos del DOM
    const btnCarrito = document.getElementById('carrito-btn');
    const modalCarrito = document.getElementById('modal-carrito');
    const cerrarCarrito = document.getElementById('cerrar-carrito');
    const vaciarCarrito = document.getElementById('vaciar-carrito');
    const finalizarCompra = document.getElementById('finalizar-compra');
    
    // Verificar que los elementos existen
    if (!btnCarrito || !modalCarrito || !cerrarCarrito) {
        console.error('Elementos del carrito no encontrados en el DOM');
        return;
    }
    
    console.log('Elementos del carrito encontrados, agregando eventos');
    
    // Abrir modal al hacer clic en el botón de carrito
    btnCarrito.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Botón de carrito clickeado');
        abrirCarritoModal();
    });
    
    // Cerrar modal al hacer clic en el botón de cerrar
    cerrarCarrito.addEventListener('click', cerrarCarritoModal);
    
    // Cerrar modal al hacer clic fuera del contenido
    modalCarrito.addEventListener('click', function(e) {
        if (e.target === modalCarrito) {
            cerrarCarritoModal();
        }
    });
    
    // Vaciar carrito
    if (vaciarCarrito) {
        vaciarCarrito.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
                vaciarCarritoCompleto();
            }
        });
    }
    
    // Finalizar compra
    if (finalizarCompra) {
        finalizarCompra.addEventListener('click', function() {
            procesarCompra();
        });
    }
    
    // Cargar el contenido inicial del carrito
    actualizarCarritoModal();
}

// Abrir el modal del carrito
function abrirCarritoModal() {
    console.log('Abriendo modal del carrito');
    
    const modalCarrito = document.getElementById('modal-carrito');
    if (!modalCarrito) {
        console.error('Modal del carrito no encontrado');
        return;
    }
    
    console.log('Modal del carrito encontrado, añadiendo clase activo');
    
    // Actualizar contenido del carrito
    actualizarCarritoModal();
    
    // Mostrar modal
    modalCarrito.classList.add('activo');
    carritoAbierto = true;
    
    // Evitar scroll en el body
    document.body.style.overflow = 'hidden';
    
    console.log('Modal debería estar visible ahora');
}

// Cerrar el modal del carrito
function cerrarCarritoModal() {
    console.log('Cerrando modal del carrito');
    
    const modalCarrito = document.getElementById('modal-carrito');
    if (!modalCarrito) return;
    
    modalCarrito.classList.remove('activo');
    carritoAbierto = false;
    
    // Restaurar scroll en el body
    document.body.style.overflow = '';
}

// Actualizar el contenido del modal del carrito
function actualizarCarritoModal() {
    console.log('Actualizando contenido del carrito');
    
    const carritoItems = document.getElementById('carrito-items');
    const carritoTotal = document.getElementById('carrito-total');
    
    if (!carritoItems || !carritoTotal) {
        console.error('Elementos del carrito no encontrados');
        return;
    }
    
    // Obtener carrito del localStorage
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    
    // Verificar si el carrito está vacío
    if (carrito.length === 0) {
        carritoItems.innerHTML = `
            <div class="carrito-vacio">
                <i class="fas fa-shopping-basket"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        carritoTotal.textContent = '$0.00';
        return;
    }
    
    // Generar HTML para cada item
    let itemsHTML = '';
    let total = 0;
    
    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        
        itemsHTML += `
            <div class="carrito-item" data-id="${item.id}">
                <div class="carrito-item-imagen">
                    <img src="${item.imagen || 'assets/producto-default.jpg'}" alt="${item.nombre}">
                </div>
                <div class="carrito-item-info">
                    <div class="carrito-item-nombre">${item.nombre}</div>
                    <div class="carrito-item-precio">$${parseFloat(item.precio).toFixed(2)}</div>
                    <div class="carrito-item-cantidad">
                        <button class="cantidad-btn disminuir-cantidad" data-id="${item.id}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.cantidad}</span>
                        <button class="cantidad-btn aumentar-cantidad" data-id="${item.id}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <button class="eliminar-item" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    
    // Actualizar HTML y total
    carritoItems.innerHTML = itemsHTML;
    carritoTotal.textContent = `$${total.toFixed(2)}`;
    
    // Inicializar eventos para los botones de cantidad
    iniciarEventosCarritoItems();
}

// Inicializar eventos para los items del carrito
function iniciarEventosCarritoItems() {
    // Botones para disminuir cantidad
    document.querySelectorAll('.disminuir-cantidad').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            actualizarCantidadItem(id, -1);
        });
    });
    
    // Botones para aumentar cantidad
    document.querySelectorAll('.aumentar-cantidad').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            actualizarCantidadItem(id, 1);
        });
    });
    
    // Botones para eliminar item
    document.querySelectorAll('.eliminar-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            eliminarItemCarrito(id);
        });
    });
}

// Actualizar cantidad de un item
function actualizarCantidadItem(id, cambio) {
    console.log(`Actualizando cantidad del item ${id} en ${cambio}`);
    
    // Obtener carrito del localStorage
    let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    
    // Buscar el item
    const itemIndex = carrito.findIndex(item => item.id === id);
    
    if (itemIndex >= 0) {
        // Actualizar cantidad
        carrito[itemIndex].cantidad += cambio;
        
        // Si la cantidad llega a 0 o menos, eliminar el item
        if (carrito[itemIndex].cantidad <= 0) {
            carrito.splice(itemIndex, 1);
        }
        
        // Guardar carrito actualizado
        localStorage.setItem('carrito', JSON.stringify(carrito));
        
        // Actualizar contador del carrito
        actualizarContadorCarrito();
        
        // Actualizar contenido del modal
        actualizarCarritoModal();
    }
}

// Eliminar un item del carrito
function eliminarItemCarrito(id) {
    console.log(`Eliminando item ${id} del carrito`);
    
    // Obtener carrito del localStorage
    let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    
    // Filtrar el item a eliminar
    carrito = carrito.filter(item => item.id !== id);
    
    // Guardar carrito actualizado
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    // Actualizar contador del carrito
    actualizarContadorCarrito();
    
    // Actualizar contenido del modal
    actualizarCarritoModal();
    
    // Mostrar notificación
    mostrarNotificacion('Producto eliminado del carrito', 'exito');
}

// Vaciar el carrito completo
function vaciarCarritoCompleto() {
    console.log('Vaciando carrito completo');
    
    // Vaciar carrito en localStorage
    localStorage.setItem('carrito', '[]');
    
    // Actualizar contador del carrito
    actualizarContadorCarrito();
    
    // Actualizar contenido del modal
    actualizarCarritoModal();
    
    // Mostrar notificación
    mostrarNotificacion('Carrito vaciado correctamente', 'exito');
}

// Procesar la compra
function procesarCompra() {
    console.log('Procesando compra');
    
    // Obtener carrito
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    
    if (carrito.length === 0) {
        mostrarNotificacion('El carrito está vacío', 'error');
        return;
    }
    
    // Aquí puedes implementar la lógica para procesar la compra
    // Por ejemplo, redirigir a una página de checkout o mostrar un formulario
    
    alert('¡Gracias por tu compra! Procesando pedido...');
    
    // Vaciar el carrito después de la compra
    vaciarCarritoCompleto();
    
    // Cerrar el modal
    cerrarCarritoModal();
}

// Función para añadir al carrito
function agregarAlCarrito(productoId) {
    console.log(`Añadiendo al carrito el producto: ${productoId}`);
    
    // Resto del código existente...
    
    // Mostrar notificación
    mostrarNotificacion(`${producto.nombre || 'Producto'} agregado al carrito`, 'exito');
    
    // Si el carrito modal está abierto, actualizar su contenido
    if (carritoAbierto) {
        actualizarCarritoModal();
    }
}

// Función para actualizar el contador del carrito
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    const contadorElement = document.getElementById('cart-count');
    
    if (contadorElement) {
        // Calcular la suma total de cantidades
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        contadorElement.textContent = totalItems;
        
        // Mostrar u ocultar el contador según si hay items
        if (totalItems > 0) {
            contadorElement.style.display = 'block';
        } else {
            contadorElement.style.display = 'none';
        }
    }
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo) {
    // Crear elemento de notificación si no existe
    let notificacion = document.getElementById('notificacion');
    
    if (!notificacion) {
        notificacion = document.createElement('div');
        notificacion.id = 'notificacion';
        document.body.appendChild(notificacion);
    }
    
    // Establecer clase según el tipo
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    
    // Mostrar notificación
    notificacion.classList.add('visible');
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove('visible');
    }, 3000);
}