// Código para carrito.js - Maneja todas las operaciones del carrito de compras sin requerir autenticación

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let carritoAbierto = false;
    
    // Define la función actualizarContadorCarrito antes de usarla
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
    
    // Inicializar carrito
    iniciarCarrito();
    
    function iniciarCarrito() {
        console.log('Inicializando carrito...');
        
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
        
        // Abrir modal al hacer clic en el botón de carrito
        btnCarrito.addEventListener('click', function(e) {
            e.preventDefault();
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
        
        // Actualizar el contador del carrito al iniciar
        actualizarContadorCarrito();
        
        // Cerrar con tecla ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && carritoAbierto) {
                cerrarCarritoModal();
            }
        });
    }
    
    // Función para abrir el modal del carrito
    function abrirCarritoModal() {
        console.log('Abriendo modal del carrito');
        
        const modalCarrito = document.getElementById('modal-carrito');
        if (!modalCarrito) {
            console.error('Modal del carrito no encontrado');
            return;
        }
        
        // Actualizar contenido del carrito
        actualizarCarritoModal();
        
        // Mostrar modal
        modalCarrito.classList.add('activo');
        carritoAbierto = true;
        
        // Evitar scroll en el body
        document.body.style.overflow = 'hidden';
    }
    
    // Función para cerrar el modal del carrito
    function cerrarCarritoModal() {
        console.log('Cerrando modal del carrito');
        
        const modalCarrito = document.getElementById('modal-carrito');
        if (!modalCarrito) return;
        
        modalCarrito.classList.remove('activo');
        carritoAbierto = false;
        
        // Restaurar scroll en el body
        document.body.style.overflow = '';
    }
    
    // Función para actualizar el contenido del modal del carrito
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
    
    // Función para inicializar eventos para los items del carrito
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
    
    // Función para actualizar cantidad de un item
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
    
    // Función para eliminar un item del carrito
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
    
    // Función para vaciar el carrito completo
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
    
    // Función para procesar la compra
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
    
    // Mostrar notificaciones
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
    
    // FUNCIONES GLOBALES (expuestas para ser usadas desde otros scripts)
    
    // Función para agregar al carrito (usada desde productos.js)
    window.agregarAlCarrito = function(productoId) {
        try {
            if (typeof firebase === 'undefined') {
                console.error('Firebase no está definido');
                return;
            }
            
            const dbRef = firebase.firestore();
            
            // Obtener datos del producto
            dbRef.collection('productos').doc(productoId).get()
                .then(doc => {
                    if (doc.exists) {
                        const productoData = doc.data();
                        
                        // Verificar que el producto esté activo y publicado
                        if (productoData.active === false || productoData.published === false) {
                            console.error('Producto no disponible para la venta');
                            mostrarNotificacion('Este producto no está disponible', 'error');
                            return;
                        }
                        
                        // Obtener carrito actual
                        let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
                        
                        // Buscar si el producto ya está en el carrito
                        const itemExistente = carrito.find(item => item.id === productoId);
                        
                        if (itemExistente) {
                            // Si ya existe, incrementar cantidad
                            itemExistente.cantidad += 1;
                        } else {
                            // Si no existe, agregar como nuevo item
                            carrito.push({
                                id: productoId,
                                nombre: productoData.name || 'Producto sin nombre',
                                precio: parseFloat(productoData.price || 0),
                                imagen: productoData.imageUrl || 'assets/producto-default.jpg',
                                cantidad: 1
                            });
                        }
                        
                        // Guardar carrito actualizado
                        localStorage.setItem('carrito', JSON.stringify(carrito));
                        
                        // Actualizar contador del carrito
                        actualizarContadorCarrito();
                        
                        // Mostrar notificación
                        mostrarNotificacion(`${productoData.name || 'Producto'} agregado al carrito`, 'exito');
                        
                        // Si el carrito modal está abierto, actualizar su contenido
                        if (carritoAbierto) {
                            actualizarCarritoModal();
                        }
                    } else {
                        console.error('Producto no encontrado');
                        mostrarNotificacion('Producto no encontrado', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error al agregar al carrito:', error);
                    mostrarNotificacion('Error al agregar al carrito', 'error');
                });
        } catch (error) {
            console.error('Error general al agregar al carrito:', error);
            mostrarNotificacion('Error al agregar al carrito', 'error');
        }
    };
    
    // Exponer la función actualizarContadorCarrito globalmente
    window.actualizarContadorCarrito = actualizarContadorCarrito;
});