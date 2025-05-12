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
        
        // Referencias a elementos del filtro
        const categoriaFiltro = document.getElementById('categoria-filtro');
        const ordenFiltro = document.getElementById('orden-filtro');
        const busquedaInput = document.getElementById('busqueda-input');
        const busquedaBtn = document.getElementById('busqueda-btn');
        
        // Evento para la búsqueda
        if (busquedaBtn) {
            busquedaBtn.addEventListener('click', function() {
                cargarProductosFiltrados();
            });
        }
        
        // Eventos para los filtros
        if (categoriaFiltro) {
            categoriaFiltro.addEventListener('change', function() {
                cargarProductosFiltrados();
            });
        }
        
        if (ordenFiltro) {
            ordenFiltro.addEventListener('change', function() {
                cargarProductosFiltrados();
            });
        }
        
        // Evento para búsqueda con tecla Enter
        if (busquedaInput) {
            busquedaInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    cargarProductosFiltrados();
                }
            });
        }
        
        // Botón volver arriba
        const backToTopBtn = document.getElementById('back-to-top');
        if (backToTopBtn) {
            // Mostrar u ocultar botón según el scroll
            window.addEventListener('scroll', function() {
                if (window.scrollY > 300) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }
            });
            
            // Evento de click para volver arriba
            backToTopBtn.addEventListener('click', function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
        
        // Cargar productos al inicio
        cargarProductosFiltrados();
        
        // Inicializar contador del carrito
        actualizarContadorCarrito();
        
        // Función para cargar productos con filtros aplicados
        function cargarProductosFiltrados() {
            const productosContainer = document.getElementById('productos-container');
            if (!productosContainer) return;
            
            // Mostrar estado de carga
            productosContainer.innerHTML = `
                <div class="cargando">
                    <div class="loader"></div>
                    <p>Cargando productos...</p>
                </div>
            `;
            
            // Obtener valores de filtros
            const categoria = categoriaFiltro ? categoriaFiltro.value : 'all';
            const orden = ordenFiltro ? ordenFiltro.value : 'featured';
            const busqueda = busquedaInput ? busquedaInput.value.trim().toLowerCase() : '';
            
            // Crear consulta base (solo productos publicados)
            let query = dbRef.collection('productos')
                .where('published', '==', true)   // Solo productos publicados
                .where('active', '==', true);     // Y que estén activos
            
            // Aplicar filtro de categoría si no es "all"
            if (categoria !== 'all') {
                query = dbRef.collection('productos')
                    .where('published', '==', true)
                    .where('active', '==', true)
                    .where('category', '==', categoria);
            }
            
            // Aplicar orden
            query.get()
                .then(snapshot => {
                    console.log(`Consulta completada - Encontrados: ${snapshot.size} productos`);
                    
                    if (snapshot.empty) {
                        productosContainer.innerHTML = `
                            <div class="sin-productos">
                                <i class="fas fa-box-open"></i>
                                <p>No se encontraron productos</p>
                                <p class="sin-productos-subtitulo">Intenta con otros filtros o vuelve más tarde</p>
                            </div>
                        `;
                        return;
                    }
                    
                    // Convertir resultados a array para poder ordenar y filtrar
                    let productos = [];
                    snapshot.forEach(doc => {
                        const producto = doc.data();
                        producto.id = doc.id; // Guardar el ID
                        
                        // Aplicar filtro de búsqueda si existe
                        if (busqueda) {
                            const nombreMatch = producto.name && producto.name.toLowerCase().includes(busqueda);
                            const descMatch = producto.description && producto.description.toLowerCase().includes(busqueda);
                            
                            // Solo incluir si coincide con la búsqueda
                            if (nombreMatch || descMatch) {
                                productos.push(producto);
                            }
                        } else {
                            productos.push(producto);
                        }
                    });
                    
                    // Aplicar ordenamiento
                    switch (orden) {
                        case 'price-asc':
                            productos.sort((a, b) => (a.price || 0) - (b.price || 0));
                            break;
                        case 'price-desc':
                            productos.sort((a, b) => (b.price || 0) - (a.price || 0));
                            break;
                        case 'newest':
                            productos.sort((a, b) => {
                                const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
                                const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
                                return dateB - dateA;
                            });
                            break;
                        case 'featured':
                        default:
                            // Primero los destacados, luego por fecha de creación
                            productos.sort((a, b) => {
                                if (a.featured && !b.featured) return -1;
                                if (!a.featured && b.featured) return 1;
                                
                                const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
                                const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
                                return dateB - dateA;
                            });
                            break;
                    }
                    
                    // Mostrar resultados
                    if (productos.length === 0) {
                        productosContainer.innerHTML = `
                            <div class="sin-productos">
                                <i class="fas fa-search"></i>
                                <p>No se encontraron productos que coincidan con tu búsqueda</p>
                                <p class="sin-productos-subtitulo">Intenta con otros términos o filtros</p>
                            </div>
                        `;
                        return;
                    }
                    
                    // Generar HTML para los productos
                    let html = '';
                    
                    productos.forEach(producto => {
                        html += `
                            <div class="producto-card" data-id="${producto.id}">
                                <div class="producto-imagen">
                                    <img src="${producto.imageUrl || 'assets/producto-default.jpg'}" alt="${producto.name || 'Producto'}">
                                    ${producto.featured ? '<span class="producto-badge">Destacado</span>' : ''}
                                </div>
                                <div class="producto-info">
                                    <h3>${producto.name || 'Producto sin nombre'}</h3>
                                    <p class="producto-descripcion">${producto.description || 'Sin descripción'}</p>
                                    <div class="producto-footer">
                                        <p class="producto-precio">$${parseFloat(producto.price || 0).toFixed(2)}</p>
                                        <button class="btn-agregar-carrito" data-id="${producto.id}">
                                            <i class="fas fa-cart-plus"></i>
                                            Añadir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    // Actualizar el contenedor
                    productosContainer.innerHTML = html;
                    
                    // Inicializar los botones de agregar al carrito
                    inicializarBotonesCarrito();
                })
                .catch(error => {
                    console.error('Error al obtener productos:', error);
                    productosContainer.innerHTML = `
                        <div class="error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Error al cargar productos: ${error.message}</p>
                            <button id="reintentar-btn" class="btn-reintentar">Reintentar</button>
                        </div>
                    `;
                    
                    // Botón para reintentar
                    const reintentarBtn = document.getElementById('reintentar-btn');
                    if (reintentarBtn) {
                        reintentarBtn.addEventListener('click', cargarProductosFiltrados);
                    }
                });
        }
        
        // Función para inicializar botones de agregar al carrito
        function inicializarBotonesCarrito() {
            const botonesAgregar = document.querySelectorAll('.btn-agregar-carrito');
            
            botonesAgregar.forEach(boton => {
                boton.addEventListener('click', function() {
                    const productoId = this.getAttribute('data-id');
                    
                    // Obtener detalles del producto
                    dbRef.collection('productos').doc(productoId).get()
                        .then(doc => {
                            if (doc.exists) {
                                const productoData = doc.data();
                                agregarProductoAlCarrito(productoId, productoData);
                            } else {
                                console.error('Producto no encontrado');
                                mostrarNotificacion('Producto no encontrado', 'error');
                            }
                        })
                        .catch(error => {
                            console.error('Error al obtener el producto:', error);
                            mostrarNotificacion('Error al agregar al carrito', 'error');
                        });
                });
            });
        }
        
        // Función para agregar producto al carrito
        function agregarProductoAlCarrito(productoId, productoData) {
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
        
    } catch (error) {
        console.error('Error general:', error);
        document.getElementById('productos-container').innerHTML = 
            `<div class="error">Error general: ${error.message}</div>`;
    }
});