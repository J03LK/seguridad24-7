// Módulo de productos simplificado (sin subir imágenes a Firebase Storage)
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si Firebase está disponible
  if (typeof firebase === 'undefined') {
      console.error('Firebase no está definido. Asegúrate de cargar los scripts de Firebase.');
      return;
  }

  // Elementos del DOM
  const productsGrid = document.querySelector('.products-grid');
  const addProductBtn = document.getElementById('add-product-btn');
  const productModal = document.getElementById('product-modal');
  const productForm = document.getElementById('product-form');
  const productModalTitle = document.getElementById('product-modal-title');
  const saveProductBtn = document.getElementById('save-product-btn');
  const productImagePreview = document.getElementById('product-image-preview');
  const productImageInput = document.getElementById('product-image');
  const removeImageBtn = document.getElementById('remove-image');
  
  // Variables de estado
  let editingProductId = null;
  let imagePreviewUrl = null;
  
  // Inicializar Firebase
  const db = firebase.firestore();
  const productsRef = db.collection('productos');
  
  // Cargar productos al iniciar
  loadProducts();
  
  // Event listeners
  if (addProductBtn) {
      addProductBtn.addEventListener('click', function() {
          openProductModal();
      });
  }
  
  if (productForm) {
      productForm.addEventListener('submit', function(e) {
          e.preventDefault();
          saveProduct();
      });
  }
  
  // Preview de imagen (solo para UI, no se sube a Firebase)
  if (productImageInput) {
      productImageInput.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (file) {
              const reader = new FileReader();
              reader.onload = function(event) {
                  imagePreviewUrl = event.target.result;
                  if (productImagePreview) {
                      productImagePreview.src = imagePreviewUrl;
                  }
              };
              reader.readAsDataURL(file);
          }
      });
  }
  
  // Botón para eliminar imagen de preview
  if (removeImageBtn) {
      removeImageBtn.addEventListener('click', function(e) {
          e.preventDefault();
          imagePreviewUrl = null;
          if (productImagePreview) {
              productImagePreview.src = '/api/placeholder/120/120';
          }
          if (productImageInput) {
              productImageInput.value = '';
          }
      });
  }
  
  // Función para cargar productos desde Firestore
  function loadProducts() {
      if (!productsGrid) return;
      
      // Mostrar mensaje de carga
      productsGrid.innerHTML = '<div class="loading-message">Cargando productos...</div>';
      
      // Obtener productos de Firestore
      productsRef.get()
          .then(snapshot => {
              if (snapshot.empty) {
                  productsGrid.innerHTML = '<div class="empty-message">No hay productos registrados</div>';
                  return;
              }
              
              // Limpiar contenedor
              productsGrid.innerHTML = '';
              
              // Mostrar cada producto
              snapshot.forEach(doc => {
                  const productData = doc.data();
                  const productId = doc.id;
                  
                  // Crear tarjeta para el producto
                  const productCard = document.createElement('div');
                  productCard.className = 'product-card';
                  
                  // Crear contenido de la tarjeta
                  productCard.innerHTML = `
                      <div class="product-image">
                          <img src="${productData.imageUrl || '/api/placeholder/280/160'}" alt="${productData.name}">
                          ${productData.featured ? '<span class="product-badge">Destacado</span>' : ''}
                      </div>
                      <div class="product-content">
                          <h3 class="product-title">${productData.name}</h3>
                          <p class="product-description">${productData.description || 'Sin descripción'}</p>
                          <div class="product-price">$${parseFloat(productData.price || 0).toFixed(2)}</div>
                          <div class="product-footer">
                              <span class="product-stock">Stock: ${productData.stock || 0}</span>
                              <div class="product-actions">
                                  <button class="btn-icon edit" title="Editar">
                                      <i class="fas fa-edit"></i>
                                  </button>
                                  <button class="btn-icon danger" title="Eliminar">
                                      <i class="fas fa-trash"></i>
                                  </button>
                              </div>
                          </div>
                      </div>
                  `;
                  
                  // Agregar event listeners para los botones
                  const editBtn = productCard.querySelector('.edit');
                  const deleteBtn = productCard.querySelector('.danger');
                  
                  if (editBtn) {
                      editBtn.addEventListener('click', function() {
                          openProductModal(productId, productData);
                      });
                  }
                  
                  if (deleteBtn) {
                      deleteBtn.addEventListener('click', function() {
                          if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                              deleteProduct(productId);
                          }
                      });
                  }
                  
                  productsGrid.appendChild(productCard);
              });
          })
          .catch(error => {
              console.error('Error al cargar productos:', error);
              productsGrid.innerHTML = `<div class="error-message">Error al cargar productos: ${error.message}</div>`;
          });
  }
  
  // Función para abrir modal de producto
  function openProductModal(productId = null, productData = null) {
      if (!productModal || !productForm) return;
      
      // Limpiar formulario
      productForm.reset();
      imagePreviewUrl = null;
      
      // Restablecer preview de imagen
      if (productImagePreview) {
          productImagePreview.src = '/api/placeholder/120/120';
      }
      
      // Título del modal
      if (productModalTitle) {
          productModalTitle.textContent = productId ? 'Editar Producto' : 'Nuevo Producto';
      }
      
      // Si es edición, rellenar con datos existentes
      if (productId && productData) {
          editingProductId = productId;
          
          document.getElementById('product-name').value = productData.name || '';
          document.getElementById('product-description').value = productData.description || '';
          document.getElementById('product-price').value = productData.price || '';
          document.getElementById('product-category').value = productData.category || '';
          document.getElementById('product-stock').value = productData.stock || 0;
          
          const featuredCheckbox = document.getElementById('product-featured');
          if (featuredCheckbox) {
              featuredCheckbox.checked = productData.featured || false;
          }
          
          const activeCheckbox = document.getElementById('product-active');
          if (activeCheckbox) {
              activeCheckbox.checked = productData.active !== false; // Por defecto true
          }
          
          // Preview de imagen si existe
          if (productData.imageUrl && productImagePreview) {
              productImagePreview.src = productData.imageUrl;
              imagePreviewUrl = productData.imageUrl;
          }
      } else {
          editingProductId = null;
      }
      
      // Mostrar modal
      productModal.classList.add('active');
  }
  
  // Función para guardar producto
  function saveProduct() {
      if (!productForm) return;
      
      // Obtener datos del formulario
      const name = document.getElementById('product-name').value.trim();
      const description = document.getElementById('product-description').value.trim();
      const price = parseFloat(document.getElementById('product-price').value) || 0;
      const category = document.getElementById('product-category').value;
      const stock = parseInt(document.getElementById('product-stock').value) || 0;
      const featured = document.getElementById('product-featured').checked;
      const active = document.getElementById('product-active').checked;
      
      // Validar nombre
      if (!name) {
          alert('El nombre del producto es obligatorio');
          return;
      }
      
      // Mostrar estado de carga
      if (saveProductBtn) {
          saveProductBtn.disabled = true;
          saveProductBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      }
      
      // Datos del producto a guardar
      const productData = {
          name,
          description,
          price,
          category,
          stock,
          featured,
          active,
          imageUrl: imagePreviewUrl || '/api/placeholder/280/160' // Usar URL de preview o placeholder
      };
      
      if (editingProductId) {
          // Actualizar producto existente
          productsRef.doc(editingProductId).update({
              ...productData,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          })
          .then(() => {
              alert('Producto actualizado correctamente');
              productModal.classList.remove('active');
              loadProducts();
          })
          .catch(error => {
              console.error('Error al actualizar producto:', error);
              alert('Error al actualizar producto: ' + error.message);
          })
          .finally(() => {
              if (saveProductBtn) {
                  saveProductBtn.disabled = false;
                  saveProductBtn.textContent = 'Guardar';
              }
          });
      } else {
          // Crear nuevo producto
          productsRef.add({
              ...productData,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
          })
          .then(() => {
              alert('Producto creado correctamente');
              productModal.classList.remove('active');
              loadProducts();
          })
          .catch(error => {
              console.error('Error al crear producto:', error);
              alert('Error al crear producto: ' + error.message);
          })
          .finally(() => {
              if (saveProductBtn) {
                  saveProductBtn.disabled = false;
                  saveProductBtn.textContent = 'Guardar';
              }
          });
      }
  }
  
  // Función para eliminar producto
  function deleteProduct(productId) {
      productsRef.doc(productId).delete()
          .then(() => {
              alert('Producto eliminado correctamente');
              loadProducts();
          })
          .catch(error => {
              console.error('Error al eliminar producto:', error);
              alert('Error al eliminar producto: ' + error.message);
          });
  }
});