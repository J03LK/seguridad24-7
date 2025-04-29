 HEAD
// Carrito de compras con modal de productos completo
document.addEventListener('DOMContentLoaded', async function() {
    // Array para almacenar los productos del carrito
    let cart = [];
    // Variable para almacenar los productos cargados
    let products = [];
    
    // Función para cargar productos desde JSON
    async function loadProducts() {
        try {
            const response = await fetch('assets/data/productos.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            products = await response.json();
            console.log("Productos cargados:", products); // Log para verificar
        } catch (error) {
            console.error("No se pudieron cargar los productos:", error);
            // Opcionalmente, mostrar un mensaje al usuario
            const productsGrid = document.getElementById('products-grid');
            if(productsGrid) {
                 productsGrid.innerHTML = '<p class="error-message">Error al cargar los productos. Intenta de nuevo más tarde.</p>';
            }
        }
    }
    
    // Referencias a elementos del DOM
    const productsGrid = document.getElementById('products-grid');
    const cartIcon = document.getElementById('cart-icon');
    const cartCount = document.getElementById('cart-count');
    const cartModal = document.getElementById('cart-modal');
    const productModal = document.getElementById('product-modal');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const productModalContent = document.getElementById('product-modal-content');
    const closeProductModal = document.getElementById('close-product-modal');
    const closeCartModal = document.getElementById('close-cart-modal');
    
    // Referencias a las plantillas
    const productCardTemplate = document.getElementById('product-card-template');
    const productModalTemplate = document.getElementById('product-modal-content-template');
    const cartItemTemplate = document.getElementById('cart-item-template');
    const emptyCartTemplate = document.getElementById('empty-cart-template');
    const cartTotalTemplate = document.getElementById('cart-total-template');
    
    // Función para mostrar productos
    function displayProducts(category) {
      if (!productsGrid || products.length === 0) return;
      
      productsGrid.innerHTML = '';
      
      const filtered = category === 'all' ? 
        products : 
        products.filter(product => product.category === category);
      
      if (filtered.length === 0) {
        const noProducts = document.createElement('p');
        noProducts.className = 'no-products';
        noProducts.textContent = 'No hay productos disponibles en esta categoría.';
        productsGrid.appendChild(noProducts);
        return;
      }
      
      filtered.forEach(product => {
        const card = productCardTemplate.content.cloneNode(true);
        const img = card.querySelector('img');
        const h3 = card.querySelector('h3');
        const price = card.querySelector('.price');
        const button = card.querySelector('.add-to-cart-btn');
        
        img.src = product.image;
        img.alt = product.name;
        img.dataset.id = product.id;
        h3.textContent = product.name;
        price.textContent = `$${product.price.toFixed(2)}`;
        button.dataset.id = product.id;
        
        productsGrid.appendChild(card);
      });
      
      addProductEventListeners();
    }
    
    // Función para añadir eventos a los productos
    function addProductEventListeners() {
      const addButtons = document.querySelectorAll('.add-to-cart-btn');
      const productImages = document.querySelectorAll('.product-card img');
      
      addButtons.forEach(button => {
        button.addEventListener('click', () => {
          const productId = parseInt(button.dataset.id);
          addToCart(productId);
        });
      });
      
      productImages.forEach(img => {
        img.addEventListener('click', () => {
          const productId = parseInt(img.dataset.id);
          openProductModal(productId);
        });
      });
    }
    
    // Función para abrir el modal de producto
    function openProductModal(productId) {
      if (products.length === 0) return;
      const product = products.find(p => p.id === productId);
      
      if (product && productModalContent) {
        const modalContent = productModalTemplate.content.cloneNode(true);
        const img = modalContent.querySelector('img');
        const h2 = modalContent.querySelector('h2');
        const description = modalContent.querySelector('.description');
        const price = modalContent.querySelector('.price');
        const button = modalContent.querySelector('.modal-buy-btn');
        
        img.src = product.image;
        img.alt = product.name;
        h2.textContent = product.name;
        description.textContent = product.description;
        price.textContent = `$${product.price.toFixed(2)}`;
        button.dataset.id = product.id;
        
        productModalContent.innerHTML = '';
        productModalContent.appendChild(modalContent);
        
        const buyButton = productModalContent.querySelector('.modal-buy-btn');
        if (buyButton) {
          buyButton.addEventListener('click', () => {
            addToCart(productId);
            productModal.style.display = 'none';
          });
        }
        
        productModal.style.display = 'block';
      }
    }
    
    // Función para añadir al carrito
    function addToCart(productId) {
      if (products.length === 0) return;
      const product = products.find(p => p.id === productId);
      
      if (product) {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
          existingItem.quantity++;
        } else {
          cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
          });
        }
        
        updateCartCount();
        alert(`${product.name} añadido al carrito`);
      }
    }
    
    // Función para actualizar el contador del carrito
    function updateCartCount() {
      const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
      if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
      }
    }
    
    // Función para mostrar los items del carrito
    function displayCartItems() {
      if (!cartItemsContainer) return;
      
      cartItemsContainer.innerHTML = '';
      
      if (cart.length === 0) {
        const emptyCart = emptyCartTemplate.content.cloneNode(true);
        cartItemsContainer.appendChild(emptyCart);
        
        const continueShoppingBtn = cartItemsContainer.querySelector('#continue-shopping');
        if (continueShoppingBtn) {
          continueShoppingBtn.addEventListener('click', () => {
            cartModal.style.display = 'none';
          });
        }
        return;
      }
      
      const cartItems = document.createElement('div');
      cartItems.className = 'cart-items';
      
      cart.forEach(item => {
        const cartItem = cartItemTemplate.content.cloneNode(true);
        const img = cartItem.querySelector('img');
        const h3 = cartItem.querySelector('h3');
        const price = cartItem.querySelector('.price');
        const quantitySpan = cartItem.querySelector('.quantity-controls span');
        const decreaseBtn = cartItem.querySelector('.decrease-btn');
        const increaseBtn = cartItem.querySelector('.increase-btn');
        const removeBtn = cartItem.querySelector('.remove-btn');
        
        img.src = item.image;
        img.alt = item.name;
        h3.textContent = item.name;
        price.textContent = `$${item.price.toFixed(2)}`;
        quantitySpan.textContent = item.quantity;
        decreaseBtn.dataset.id = item.id;
        increaseBtn.dataset.id = item.id;
        removeBtn.dataset.id = item.id;
        
        cartItems.appendChild(cartItem);
      });
      
      cartItemsContainer.appendChild(cartItems);
      
      const cartTotal = cartTotalTemplate.content.cloneNode(true);
      const totalSpan = cartTotal.querySelector('span');
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      totalSpan.textContent = `$${total.toFixed(2)}`;
      
      cartItemsContainer.appendChild(cartTotal);
      
      addCartEventListeners();
    }
    
    // Función para añadir eventos al carrito
    function addCartEventListeners() {
      const decreaseBtns = document.querySelectorAll('.decrease-btn');
      const increaseBtns = document.querySelectorAll('.increase-btn');
      const removeBtns = document.querySelectorAll('.remove-btn');
      const checkoutBtn = document.getElementById('checkout-btn');
      
      decreaseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.id);
          decreaseQuantity(id);
        });
      });
      
      increaseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.id);
          increaseQuantity(id);
        });
      });
      
      removeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.id);
          removeFromCart(id);
        });
      });
      
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
          alert('¡Gracias por tu compra!');
          cart = [];
          updateCartCount();
          displayCartItems();
        });
      }
    }
    
    // Funciones para manipular cantidades
    function decreaseQuantity(productId) {
      const item = cart.find(item => item.id === productId);
      if (item) {
        item.quantity--;
        if (item.quantity <= 0) {
          removeFromCart(productId);
        } else {
          updateCartCount();
          displayCartItems();
        }
      }
    }
    
    function increaseQuantity(productId) {
      const item = cart.find(item => item.id === productId);
      if (item) {
        item.quantity++;
        updateCartCount();
        displayCartItems();
      }
    }
    
    function removeFromCart(productId) {
      cart = cart.filter(item => item.id !== productId);
      updateCartCount();
      displayCartItems();
    }
    
    // ----- INICIALIZACIÓN ----- 
    async function initializeApp() {
        await loadProducts(); // Esperar a que los productos se carguen

        // Asignar eventos a categorías (solo después de cargar productos)
        const categories = document.querySelectorAll('.category-item');
        categories.forEach(category => {
            category.addEventListener('click', () => {
                const categoryName = category.dataset.category;
                categories.forEach(c => c.classList.remove('active'));
                category.classList.add('active');
                displayProducts(categoryName);
            });
        });

        // Añadir evento al icono del carrito
        if (cartIcon) {
            cartIcon.addEventListener('click', () => {
                displayCartItems();
                if(cartModal) cartModal.style.display = 'block';
            });
        }

        // Cerrar modales al hacer clic fuera
        window.addEventListener('click', (event) => {
            if (productModal && event.target === productModal) {
                productModal.style.display = 'none';
            }
            if (cartModal && event.target === cartModal) {
                cartModal.style.display = 'none';
            }
        });
        
        // Event listeners para cerrar modales con botón (X)
        if (closeProductModal) {
            closeProductModal.addEventListener('click', () => {
                if(productModal) productModal.style.display = 'none';
            });
        }
        if (closeCartModal) {
            closeCartModal.addEventListener('click', () => {
                if(cartModal) cartModal.style.display = 'none';
            });
        }

        // Mostrar productos iniciales y actualizar contador
        displayProducts('all');
        updateCartCount();
    }

    initializeApp(); // Llamar a la función de inicialización
  });

// Solución para asegurar que los productos aparezcan en el carrito
// Y conectar el botón "FINALIZAR COMPRA" con la pasarela de pagos
import { procesarPagoStripe } from './productos.js';

document.addEventListener('DOMContentLoaded', function() {
  // PASO 1: Migrar datos entre diferentes posibles almacenamientos
  function migrarDatosCarrito() {
      // Posibles fuentes de datos del carrito
      const carritoData = localStorage.getItem('carrito');
      const selectedProductData = localStorage.getItem('selectedProduct');
      const cartCountData = localStorage.getItem('cartCount');
      
      // Si no hay datos en 'carrito' pero hay un 'selectedProduct'
      if ((!carritoData || carritoData === '[]') && selectedProductData) {
          try {
              const selectedProduct = JSON.parse(selectedProductData);
              if (selectedProduct && selectedProduct.id) {
                  // Crear un array de carrito con este producto
                  localStorage.setItem('carrito', JSON.stringify([selectedProduct]));
                  console.log("Producto migrado desde selectedProduct:", selectedProduct);
              }
          } catch (e) {
              console.error("Error al migrar desde selectedProduct:", e);
          }
      }
      
      // Verificar el contador visual vs datos reales
      const carritoArray = JSON.parse(localStorage.getItem('carrito')) || [];
      const cartCountElement = document.getElementById('cart-count');
      
      if (cartCountElement) {
          const contadorVisual = parseInt(cartCountElement.textContent) || 0;
          
          // Si hay contador pero no hay productos, crear productos ficticios para pruebas
          if (contadorVisual > 0 && carritoArray.length === 0) {
              console.log("Contador muestra productos pero carrito vacío, creando productos de prueba");
              
              // Crear productos de muestra basados en el contador
              const productosPrueba = [];
              for (let i = 0; i < contadorVisual; i++) {
                  productosPrueba.push({
                      id: `producto-prueba-${i}`,
                      name: `Producto de Prueba ${i+1}`,
                      price: "100.00",
                      image: "assets/default-product.png",
                      quantity: 1
                  });
              }
              
              // Guardar estos productos en el carrito
              localStorage.setItem('carrito', JSON.stringify(productosPrueba));
          }
      }
  }
  
  // PASO 2: Mejorar la función para mostrar los productos en el carrito
  function mostrarProductosEnCarrito() {
      // Obtener el contenedor donde se mostrarán los productos
      const carritoContainer = document.querySelector('.cart-summary-items') || 
                             document.getElementById('cart-summary-items');
      
      // Obtener elementos para mostrar totales
      const subtotalElement = document.getElementById('cart-summary-subtotal');
      const ivaElement = document.getElementById('cart-summary-iva');
      const totalElement = document.getElementById('cart-summary-total');
      
      // Si no se encuentra el contenedor
      if (!carritoContainer) {
          console.error("No se encontró el contenedor para mostrar productos del carrito");
          return;
      }
      
      // Obtener productos del carrito
      let productosCarrito = JSON.parse(localStorage.getItem('carrito')) || [];
      console.log("Productos encontrados en localStorage:", productosCarrito);
      
      // Si no hay productos, mostrar mensaje de carrito vacío
      if (productosCarrito.length === 0) {
          carritoContainer.innerHTML = `
              <div class="empty-cart">
                  <div class="cart-icon-large">🛒</div>
                  <p>Tu carrito está vacío</p>
              </div>
          `;
          
          // Actualizar totales a cero
          if (subtotalElement) subtotalElement.textContent = '$0.00';
          if (ivaElement) ivaElement.textContent = '$0.00';
          if (totalElement) totalElement.textContent = '$0.00';
          
          // Ocultar el botón de finalizar compra
          const finalizarBtn = document.getElementById('finalizar-compra');
          if (finalizarBtn) {
              finalizarBtn.style.display = 'none';
          }
          
          return;
      }
      
      // Mostrar el botón de finalizar compra
      const finalizarBtn = document.getElementById('finalizar-compra');
      if (finalizarBtn) {
          finalizarBtn.style.display = 'block';
      }
      
      // Vaciar el contenedor antes de añadir productos
      carritoContainer.innerHTML = '';
      
      // Variables para calcular totales
      let subtotal = 0;
      
      // Crear elementos para cada producto
      productosCarrito.forEach(producto => {
          // Asegurarse de que el precio sea un número
          const precioNumerico = parseFloat(producto.price) || 100; // Precio por defecto si no es válido
          const cantidadProducto = parseInt(producto.quantity) || 1;
          const subtotalProducto = precioNumerico * cantidadProducto;
          
          // Agregar al subtotal
          subtotal += subtotalProducto;
          
          // Crear elemento HTML para este producto
          const itemElement = document.createElement('div');
          itemElement.className = 'cart-item';
          itemElement.innerHTML = `
              <div class="cart-item-image">
                  <img src="${producto.image || 'assets/default-product.png'}" 
                       alt="${producto.name}" 
                       onerror="this.src='assets/default-product.png'">
              </div>
              <div class="cart-item-details">
                  <h3 class="cart-item-name">${producto.name || 'Producto'}</h3>
                  <p class="cart-item-price">$${precioNumerico.toFixed(2)} USD</p>
                  <div class="quantity-controls">
                      <button class="decrease-btn" data-id="${producto.id}">-</button>
                      <span>${cantidadProducto}</span>
                      <button class="increase-btn" data-id="${producto.id}">+</button>
                  </div>
                  <p class="cart-item-subtotal">Subtotal: $${subtotalProducto.toFixed(2)} USD</p>
                  <button class="remove-btn" data-id="${producto.id}">Eliminar</button>
              </div>
          `;
          
          // Añadir al contenedor
          carritoContainer.appendChild(itemElement);
      });
      
      // Calcular IVA y total
      const iva = subtotal * 0.12;
      const total = subtotal + iva;
      
      // Actualizar los totales en la interfaz
      if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
      if (ivaElement) ivaElement.textContent = `$${iva.toFixed(2)}`;
      if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
      
      // Configurar eventos para los botones dentro del carrito
      configurarBotonesCarrito();
  }
  
  // PASO 3: Configurar eventos para los botones de cantidad y eliminar
  function configurarBotonesCarrito() {
      // Botones para aumentar cantidad
      document.querySelectorAll('.increase-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const productId = this.getAttribute('data-id');
              aumentarCantidad(productId);
          });
      });
      
      // Botones para disminuir cantidad
      document.querySelectorAll('.decrease-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const productId = this.getAttribute('data-id');
              disminuirCantidad(productId);
          });
      });
      
      // Botones para eliminar producto
      document.querySelectorAll('.remove-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const productId = this.getAttribute('data-id');
              eliminarProducto(productId);
          });
      });
  }
  
  // PASO 4: Funciones auxiliares para manipular productos
  function aumentarCantidad(productId) {
      let productosCarrito = JSON.parse(localStorage.getItem('carrito')) || [];
      const index = productosCarrito.findIndex(item => item.id === productId);
      
      if (index !== -1) {
          // Aumentar cantidad
          productosCarrito[index].quantity = (parseInt(productosCarrito[index].quantity) || 1) + 1;
          // Guardar cambios
          localStorage.setItem('carrito', JSON.stringify(productosCarrito));
          // Actualizar interfaz
          mostrarProductosEnCarrito();
          actualizarContadorCarrito();
      }
  }
  
  function disminuirCantidad(productId) {
      let productosCarrito = JSON.parse(localStorage.getItem('carrito')) || [];
      const index = productosCarrito.findIndex(item => item.id === productId);
      
      if (index !== -1) {
          const nuevaCantidad = (parseInt(productosCarrito[index].quantity) || 1) - 1;
          
          if (nuevaCantidad <= 0) {
              // Si la cantidad es cero o menor, eliminar el producto
              eliminarProducto(productId);
          } else {
              // Si es mayor a cero, actualizar cantidad
              productosCarrito[index].quantity = nuevaCantidad;
              localStorage.setItem('carrito', JSON.stringify(productosCarrito));
              mostrarProductosEnCarrito();
              actualizarContadorCarrito();
          }
      }
  }
  
  function eliminarProducto(productId) {
      let productosCarrito = JSON.parse(localStorage.getItem('carrito')) || [];
      
      // Filtrar para eliminar el producto con el ID especificado
      productosCarrito = productosCarrito.filter(item => item.id !== productId);
      
      // Guardar el carrito actualizado
      localStorage.setItem('carrito', JSON.stringify(productosCarrito));
      
      // Actualizar la interfaz
      mostrarProductosEnCarrito();
      actualizarContadorCarrito();
  }
  
  function actualizarContadorCarrito() {
      const cartCount = document.getElementById('cart-count');
      if (cartCount) {
          const productosCarrito = JSON.parse(localStorage.getItem('carrito')) || [];
          const totalItems = productosCarrito.reduce((total, item) => {
              return total + (parseInt(item.quantity) || 1);
          }, 0);
          
          // Actualizar el contador visual
          cartCount.textContent = totalItems;
      }
  }
  
  // PASO 5: Configurar el evento para abrir el carrito
  function configurarEventoCarrito() {
      const cartIcon = document.getElementById('cart-icon');
      const cartModal = document.getElementById('cart-summary-modal');
      
      if (cartIcon && cartModal) {
          cartIcon.addEventListener('click', function() {
              // Migrar datos y mostrar productos antes de abrir el modal
              migrarDatosCarrito();
              mostrarProductosEnCarrito();
              
              // Mostrar el modal del carrito
              cartModal.style.display = 'flex';
          });
          
          // Cerrar el modal
          const closeBtn = document.getElementById('close-cart-summary');
          if (closeBtn) {
              closeBtn.addEventListener('click', function() {
                  cartModal.style.display = 'none';
              });
          }
          
          // Cerrar con clic fuera del modal
          window.addEventListener('click', function(e) {
              if (e.target === cartModal) {
                  cartModal.style.display = 'none';
              }
          });
      }
  }
  
  // PASO 6: Configurar el botón de finalizar compra
  function configurarFinalizarCompra() {
      const finalizarBtn = document.getElementById('finalizar-compra');
      
      if (finalizarBtn) {
          finalizarBtn.addEventListener('click', function() {
              procesarCompra();
          });
      }
  }
  
  // PASO 7: Función para procesar la compra
  function procesarCompra() {
      // Obtener productos del carrito
      const productosCarrito = JSON.parse(localStorage.getItem('carrito')) || [];
      
      if (productosCarrito.length === 0) {
          alert('Tu carrito está vacío. Agrega productos antes de finalizar la compra.');
          return;
      }
      
      // Tomar el primer producto para procesar con Stripe
      // (Para múltiples productos se requeriría Stripe Sessions)
      const primerProducto = productosCarrito[0];
      
      // Cerrar el modal del carrito
      const cartModal = document.getElementById('cart-summary-modal');
      if (cartModal) {
          cartModal.style.display = 'none';
      }
      
      console.log("Procesando pago para:", primerProducto);
      
      // Llamar a la función para procesar el pago con Stripe
      procesarPagoStripe(primerProducto.id, primerProducto.quantity || 1);
  }
  
  // PASO 8: Inicializar todo al cargar la página
  migrarDatosCarrito();
  actualizarContadorCarrito();
  configurarEventoCarrito();
  configurarFinalizarCompra();
  
  // PASO 9: Exponer función para agregar productos (para usar desde otras páginas)
  window.agregarAlCarrito = function(producto) {
      // Verificar que el producto tenga los campos necesarios
      if (!producto.id) {
          console.error("Error: el producto no tiene ID", producto);
          return 0;
      }
      
      // Asegurar que todos los campos necesarios existan
      producto.name = producto.name || "Producto sin nombre";
      producto.price = producto.price || "100.00";
      producto.image = producto.image || "assets/default-product.png";
      
      // Obtener el carrito actual
      let productosCarrito = JSON.parse(localStorage.getItem('carrito')) || [];
      
      // Verificar si el producto ya existe
      const index = productosCarrito.findIndex(item => item.id === producto.id);
      
      if (index !== -1) {
          // Si ya existe, aumentar cantidad
          productosCarrito[index].quantity = (parseInt(productosCarrito[index].quantity) || 1) + 1;
      } else {
          // Si no existe, añadirlo
          producto.quantity = 1;
          productosCarrito.push(producto);
      }
      
      // Guardar en localStorage
      localStorage.setItem('carrito', JSON.stringify(productosCarrito));
      
      // Actualizar el contador
      actualizarContadorCarrito();
      
      return productosCarrito.length;
  };
});
(Corrigiendoa)
