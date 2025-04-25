// Variables globales para la gestión de productos
let productsList = [];
let currentPage = 1;
let itemsPerPage = 12; // Mostrar 12 productos por página en grid
let totalPages = 0;
let editingProductId = null;

// Cargar productos desde Firestore
function loadProducts(page = 1) {
  currentPage = page;
  
  // Mostrar indicador de carga
  document.getElementById('productos-grid').innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Cargando productos...</div>';
  
  // Obtener filtros
  const categoriaFilter = document.getElementById('filtro-categoria').value;
  const disponibilidadFilter = document.getElementById('filtro-disponibilidad').value;
  const searchText = document.getElementById('buscar-producto').value.toLowerCase();
  
  // Referencia a la colección de productos
  let productsRef = firebase.firestore().collection('products');
  
  // Aplicar filtros de categoría si no es "todos"
  if (categoriaFilter !== 'todos') {
    productsRef = productsRef.where('categoria', '==', categoriaFilter);
  }
}

// Confirmar eliminación de producto
function confirmDeleteProduct(productId) {
  if (confirm('¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer.')) {
    deleteProduct(productId);
  }
}

// Eliminar producto
function deleteProduct(productId) {
  // Obtener la URL de la imagen primero
  firebase.firestore().collection('products').doc(productId).get()
    .then(doc => {
      if (doc.exists) {
        const productData = doc.data();
        
        // Eliminar de Firestore primero
        return firebase.firestore().collection('products').doc(productId).delete()
          .then(() => {
            // Si el producto tenía una imagen, eliminarla del storage
            if (productData.imageUrl) {
              // Extraer el path del storage de la URL
              const imageRef = firebase.storage().refFromURL(productData.imageUrl);
              return imageRef.delete();
            }
          });
      }
    })
    .then(() => {
      loadProducts(currentPage);
    })
    .catch(error => {
      console.error("Error al eliminar producto:", error);
      alert('Error al eliminar producto: ' + error.message);
    });
}

// Cerrar modal de producto
function closeProductModal() {
  document.getElementById('producto-modal').classList.remove('active');
  document.getElementById('producto-form').reset();
  document.getElementById('producto-preview').src = '';
  document.getElementById('producto-preview-container').style.display = 'none';
  editingProductId = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Botón para crear producto
  document.getElementById('crear-producto-btn').addEventListener('click', openCreateProductModal);
  
  // Botones del modal
  document.getElementById('producto-save-btn').addEventListener('click', saveProduct);
  document.getElementById('producto-cancel-btn').addEventListener('click', closeProductModal);
  document.querySelector('#producto-modal .close-modal').addEventListener('click', closeProductModal);
  
  // Manejar vista previa de imagen
  document.getElementById('producto-imagen').addEventListener('change', handleImagePreview);
  
  // Filtros
  document.getElementById('filtro-categoria').addEventListener('change', () => loadProducts(1));
  document.getElementById('filtro-disponibilidad').addEventListener('change', () => loadProducts(1));
  
  // Búsqueda
  let searchTimeout;
  document.getElementById('buscar-producto').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadProducts(1);
    }, 300);
  });
});
  
  // Aplicar filtros de disponibilidad si no es "todos"
  if (disponibilidadFilter === 'disponible') {
    productsRef = productsRef.where('stock', '>', 0);
  } else if (disponibilidadFilter === 'agotado') {
    productsRef = productsRef.where('stock', '==', 0);
  }
  
  // Obtener productos
  productsRef.get()
    .then(snapshot => {
      productsList = [];
      
      snapshot.forEach(doc => {
        const productData = doc.data();
        
        // Filtrar por texto de búsqueda si existe
        if (searchText) {
          const matchesSearch = 
            (productData.nombre && productData.nombre.toLowerCase().includes(searchText)) ||
            (productData.descripcion && productData.descripcion.toLowerCase().includes(searchText));
          
          if (!matchesSearch) return;
        }
        
        productsList.push({
          id: doc.id,
          ...productData
        });
      });
      
      // Calcular paginación
      totalPages = Math.ceil(productsList.length / itemsPerPage);
      
      // Mostrar productos en la grid
      displayProducts();
      
      // Actualizar paginación
      updatePagination();
    })
    .catch(error => {
      console.error("Error al cargar productos:", error);
      document.getElementById('productos-grid').innerHTML = 
        '<div class="error-message"><i class="fas fa-exclamation-circle"></i> Error al cargar productos. Intente nuevamente.</div>';
    });


// Mostrar productos en la grid
function displayProducts() {
  const productsGrid = document.getElementById('productos-grid');
  productsGrid.innerHTML = '';
  
  // Calcular índices para la paginación
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, productsList.length);
  
  if (productsList.length === 0) {
    productsGrid.innerHTML = '<div class="empty-message"><i class="fas fa-box-open"></i> No se encontraron productos.</div>';
    return;
  }
  
  // Mostrar productos para la página actual
  for (let i = startIdx; i < endIdx; i++) {
    const product = productsList[i];
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Determinar estado de disponibilidad
    const disponibilidad = product.stock > 0 ? 'Disponible' : 'Agotado';
    const disponibilidadClass = product.stock > 0 ? 'status-active' : 'status-inactive';
    
    card.innerHTML = `
      <div class="product-img">
        <img src="${product.imageUrl || 'assets/img/product-placeholder.png'}" alt="${product.nombre}">
        <span class="status-badge ${disponibilidadClass}">${disponibilidad}</span>
      </div>
      <div class="product-info">
        <h3>${product.nombre}</h3>
        <p class="product-category">${product.categoria}</p>
        <p class="product-price">$${parseFloat(product.precio).toFixed(2)}</p>
        <p class="product-stock">Stock: ${product.stock} unidades</p>
      </div>
      <div class="product-actions">
        <button class="btn-icon view-product" data-id="${product.id}"><i class="fas fa-eye"></i></button>
        <button class="btn-icon edit-product" data-id="${product.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete-product" data-id="${product.id}"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    productsGrid.appendChild(card);
  }
  
  // Agregar event listeners a los botones de acción
  document.querySelectorAll('.view-product').forEach(btn => {
    btn.addEventListener('click', () => viewProduct(btn.dataset.id));
  });
  
  document.querySelectorAll('.edit-product').forEach(btn => {
    btn.addEventListener('click', () => openEditProductModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-product').forEach(btn => {
    btn.addEventListener('click', () => confirmDeleteProduct(btn.dataset.id));
  });
}

// Actualizar paginación
function updatePagination() {
  const paginationElement = document.getElementById('productos-pagination');
  
  if (totalPages <= 1) {
    paginationElement.innerHTML = '';
    return;
  }
  
  let html = `
    <button class="pagination-btn" onclick="loadProducts(1)" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-angle-double-left"></i>
    </button>
    <button class="pagination-btn" onclick="loadProducts(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-angle-left"></i>
    </button>
  `;
  
  // Mostrar números de página (hasta 5 páginas)
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(startPage + 4, totalPages);
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="loadProducts(${i})">
        ${i}
      </button>
    `;
  }
  
  html += `
    <button class="pagination-btn" onclick="loadProducts(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-angle-right"></i>
    </button>
    <button class="pagination-btn" onclick="loadProducts(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-angle-double-right"></i>
    </button>
  `;
  
  paginationElement.innerHTML = html;
}

// Ver detalles de producto
function viewProduct(productId) {
  const product = productsList.find(p => p.id === productId);
  
  if (!product) {
    console.error("Producto no encontrado:", productId);
    return;
  }
  
  // Aquí puedes crear un modal para mostrar más detalles del producto
  alert(`
    Nombre: ${product.nombre}
    Categoría: ${product.categoria}
    Precio: $${parseFloat(product.precio).toFixed(2)}
    Stock: ${product.stock}
    Descripción: ${product.descripcion}
  `);
}

// Abrir modal para crear producto
function openCreateProductModal() {
  editingProductId = null;
  document.getElementById('producto-modal-title').textContent = 'Nuevo Producto';
  document.getElementById('producto-form').reset();
  document.getElementById('producto-preview').src = '';
  document.getElementById('producto-preview-container').style.display = 'none';
  
  // Mostrar modal
  document.getElementById('producto-modal').classList.add('active');
}

// Abrir modal para editar producto
function openEditProductModal(productId) {
  editingProductId = productId;
  document.getElementById('producto-modal-title').textContent = 'Editar Producto';
  document.getElementById('producto-form').reset();
  
  // Obtener datos del producto
  firebase.firestore().collection('products').doc(productId).get()
    .then(doc => {
      if (doc.exists) {
        const productData = doc.data();
        document.getElementById('producto-nombre').value = productData.nombre || '';
        document.getElementById('producto-categoria').value = productData.categoria || 'otros';
        document.getElementById('producto-precio').value = productData.precio || '';
        document.getElementById('producto-descripcion').value = productData.descripcion || '';
        document.getElementById('producto-stock').value = productData.stock || 0;
        
        // Mostrar imagen si existe
        if (productData.imageUrl) {
          document.getElementById('producto-preview').src = productData.imageUrl;
          document.getElementById('producto-preview-container').style.display = 'block';
        } else {
          document.getElementById('producto-preview-container').style.display = 'none';
        }
      }
    })
    .catch(error => {
      console.error("Error al obtener datos del producto:", error);
    });
  
  // Mostrar modal
  document.getElementById('producto-modal').classList.add('active');
}

// Manejar vista previa de imagen
function handleImagePreview(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('producto-preview').src = e.target.result;
      document.getElementById('producto-preview-container').style.display = 'block';
    }
    reader.readAsDataURL(file);
  }
}

// Guardar producto (crear o actualizar)
function saveProduct() {
  const nombre = document.getElementById('producto-nombre').value;
  const categoria = document.getElementById('producto-categoria').value;
  const precio = parseFloat(document.getElementById('producto-precio').value);
  const descripcion = document.getElementById('producto-descripcion').value;
  const stock = parseInt(document.getElementById('producto-stock').value);
  const imagenFile = document.getElementById('producto-imagen').files[0];
  
  if (!nombre || isNaN(precio) || !descripcion || isNaN(stock)) {
    alert('Por favor complete todos los campos obligatorios correctamente.');
    return;
  }
  
  // Mostrar indicador de carga
  const saveBtn = document.getElementById('producto-save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Guardando...';
  saveBtn.disabled = true;
  
  // Función para guardar datos en Firestore
  const saveProductData = (imageUrl = null) => {
    const productData = {
      nombre,
      categoria,
      precio,
      descripcion,
      stock,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Agregar URL de imagen si existe
    if (imageUrl) {
      productData.imageUrl = imageUrl;
    }
    
    let savePromise;
    
    if (editingProductId) {
      // Actualizar producto existente
      savePromise = firebase.firestore().collection('products').doc(editingProductId).update(productData);
    } else {
      // Crear nuevo producto
      productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      savePromise = firebase.firestore().collection('products').doc().set(productData);
    }
    
    savePromise
      .then(() => {
        closeProductModal();
        loadProducts(currentPage);
      })
      .catch(error => {
        console.error("Error al guardar producto:", error);
        alert('Error al guardar producto: ' + error.message);
      })
      .finally(() => {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      });
  };
  
  // Si hay una imagen para subir
  if (imagenFile) {
    const storageRef = firebase.storage().ref();
    const imageRef = storageRef.child(`productos/${Date.now()}_${imagenFile.name}`);
    
    imageRef.put(imagenFile)
      .then(snapshot => snapshot.ref.getDownloadURL())
      .then(imageUrl => {
        saveProductData(imageUrl);
      })
      .catch(error => {
        console.error("Error al subir imagen:", error);
        alert('Error al subir imagen. Intente nuevamente.');
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      });
  } else {
    // Si no hay imagen nueva, guardar los datos sin cambiar la imagen
    saveProductData(document.getElementById('producto-preview').src || null);
  }}