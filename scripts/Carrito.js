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