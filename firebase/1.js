// Script para funcionalidades adicionales del dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Función para convertir códigos de estado a texto (redefinida aquí)
  function getStatusText(status) {
    switch(status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'warning':
        return 'Advertencia';
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completado';
      default:
        return 'Desconocido';
    }
  }

  // Verificar si Firebase está disponible
  if (typeof firebase !== 'undefined') {
    // Cargar usuarios cuando se muestre la sección de usuarios
    const usuariosLink = document.querySelector('a[data-section="usuarios-section"]');
    if (usuariosLink) {
      usuariosLink.addEventListener('click', loadUsers);
    }
    
    // Cargar productos cuando se muestre la sección de productos
    const productosLink = document.querySelector('a[data-section="productos-section"]');
    if (productosLink) {
      productosLink.addEventListener('click', loadProducts);
    }
    
    // Inicializar tabla de usuarios
    function loadUsers() {
      const usersTable = document.getElementById('users-table');
      if (!usersTable) return;
      
      // Limpiar tabla
      usersTable.innerHTML = '<tr><td colspan="7" class="loading-data">Cargando usuarios...</td></tr>';
      
      // Obtener usuarios desde Firestore
      firebase.firestore().collection('users').get()
        .then(function(querySnapshot) {
          if (querySnapshot.empty) {
            usersTable.innerHTML = '<tr><td colspan="7" class="no-data">No hay usuarios registrados</td></tr>';
            return;
          }
          
          usersTable.innerHTML = '';
          
          querySnapshot.forEach(function(doc) {
            const userData = doc.data();
            const userId = doc.id;
            
            // Crear fila para el usuario
            const row = document.createElement('tr');
            row.setAttribute('data-id', userId);
            row.innerHTML = `
              <td>${userId.substring(0, 8)}...</td>
              <td>${userData.name || ''}</td>
              <td>${userData.email || ''}</td>
              <td>${userData.phone || ''}</td>
              <td>${userData.address || ''}</td>
              <td><span class="status ${userData.status || 'active'}">${getStatusText(userData.status || 'active')}</span></td>
              <td>
                <button class="action-btn edit-user" data-id="${userId}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-user" data-id="${userId}"><i class="fas fa-trash"></i></button>
              </td>
            `;
            
            usersTable.appendChild(row);
          });
          
          // Agregar event listeners para botones de eliminar
          document.querySelectorAll('.delete-user').forEach(button => {
            button.addEventListener('click', function() {
              const userId = this.getAttribute('data-id');
              deleteUser(userId);
            });
          });
        })
        .catch(function(error) {
          console.error("Error al cargar usuarios:", error);
          usersTable.innerHTML = `<tr><td colspan="7" class="error-data">Error al cargar datos: ${error.message}</td></tr>`;
        });
    }
    
    // Función para eliminar usuario
    function deleteUser(userId) {
      if (confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
        // Primero obtenemos el usuario para saber su email y eliminarlo de Authentication
        firebase.firestore().collection('users').doc(userId).get()
          .then(function(doc) {
            if (doc.exists) {
              // Eliminar documento de Firestore
              return firebase.firestore().collection('users').doc(userId).delete()
                .then(function() {
                  showNotification('Usuario eliminado correctamente', 'success');
                  
                  // Recargar lista de usuarios
                  loadUsers();
                })
                .catch(function(error) {
                  console.error("Error al eliminar usuario:", error);
                  showNotification('Error al eliminar usuario: ' + error.message, 'error');
                });
            } else {
              throw new Error('Usuario no encontrado');
            }
          })
          .catch(function(error) {
            console.error("Error al eliminar usuario:", error);
            showNotification('Error al eliminar usuario: ' + error.message, 'error');
          });
      }
    }

    // Función para cargar productos
    function loadProducts() {
      const productsTable = document.getElementById('products-table');
      if (!productsTable) return;
      
      // Limpiar tabla
      productsTable.innerHTML = '<tr><td colspan="7" class="loading-data">Cargando productos...</td></tr>';
      
      // También actualizar stats de productos
      updateProductStats();
      
      // Obtener productos desde Firestore
      firebase.firestore().collection('products').get()
        .then(function(querySnapshot) {
          if (querySnapshot.empty) {
            productsTable.innerHTML = '<tr><td colspan="7" class="no-data">No hay productos registrados</td></tr>';
            return;
          }
          
          productsTable.innerHTML = '';
          
          querySnapshot.forEach(function(doc) {
            const productData = doc.data();
            const productId = doc.id;
            
            // Crear fila para el producto
            const row = document.createElement('tr');
            row.setAttribute('data-id', productId);
            row.innerHTML = `
              <td>${productId.substring(0, 8)}...</td>
              <td>${productData.name || ''}</td>
              <td>${getCategoryText(productData.category || '')}</td>
              <td>${productData.stock || 0}</td>
              <td>${formatCurrency(productData.price || 0)}</td>
              <td><span class="status ${productData.status || 'active'}">${getStatusText(productData.status || 'active')}</span></td>
              <td>
                <button class="action-btn edit-product" data-id="${productId}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-product" data-id="${productId}"><i class="fas fa-trash"></i></button>
              </td>
            `;
            
            productsTable.appendChild(row);
          });
          
          // Agregar event listeners para botones de eliminar
          document.querySelectorAll('.delete-product').forEach(button => {
            button.addEventListener('click', function() {
              const productId = this.getAttribute('data-id');
              deleteProduct(productId);
            });
          });
        })
        .catch(function(error) {
          console.error("Error al cargar productos:", error);
          productsTable.innerHTML = `<tr><td colspan="7" class="error-data">Error al cargar datos: ${error.message}</td></tr>`;
        });
    }
    
    // Función para eliminar producto
    function deleteProduct(productId) {
      if (confirm('¿Está seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
        firebase.firestore().collection('products').doc(productId).delete()
          .then(function() {
            showNotification('Producto eliminado correctamente', 'success');
            
            // Recargar lista de productos
            loadProducts();
          })
          .catch(function(error) {
            console.error("Error al eliminar producto:", error);
            showNotification('Error al eliminar producto: ' + error.message, 'error');
          });
      }
    }
    
    // Función para actualizar estadísticas de productos
    function updateProductStats() {
      firebase.firestore().collection('products').get()
        .then(function(querySnapshot) {
          let camaras = 0;
          let cercos = 0;
          let baterias = 0;
          let otros = 0;
          
          querySnapshot.forEach(function(doc) {
            const productData = doc.data();
            const stock = productData.stock || 0;
            
            switch(productData.category) {
              case 'camera':
                camaras += stock;
                break;
              case 'fence':
                cercos += stock;
                break;
              case 'battery':
                baterias += stock;
                break;
              default:
                otros += stock;
            }
          });
          
          // Actualizar elementos en el DOM
          document.getElementById('camaras-stock').textContent = camaras;
          document.getElementById('cercos-stock').textContent = cercos;
          document.getElementById('baterias-stock').textContent = baterias;
          document.getElementById('otros-stock').textContent = otros;
        })
        .catch(function(error) {
          console.error("Error al actualizar estadísticas:", error);
        });
    }
    
    // Función para obtener texto de categoría
    function getCategoryText(category) {
      switch(category) {
        case 'camera':
          return 'Cámara';
        case 'fence':
          return 'Cerco Eléctrico';
        case 'battery':
          return 'Batería';
        case 'other':
          return 'Otro';
        default:
          return 'Desconocido';
      }
    }

    // Función para formatear moneda (redefinida aquí)
    function formatCurrency(amount) {
      if (!amount) return '$0.00';

      const value = typeof amount === 'string' 
          ? parseFloat(amount.replace('$', '').replace(',', ''))
          : amount;
          
      return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
      }).format(value);
    }

    // Manejar formulario de productos
    const productForm = document.getElementById('add-product-form');
    if (productForm) {
      productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtener datos
        const name = document.getElementById('product-name').value;
        const category = document.getElementById('product-category').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const stock = parseInt(document.getElementById('product-stock').value);
        const description = document.getElementById('product-description').value;
        
        // Validación básica
        if (!name || !category || isNaN(price) || isNaN(stock)) {
          showNotification("Por favor complete todos los campos obligatorios", "warning");
          return;
        }
        
        // Crear producto en Firestore
        firebase.firestore().collection('products').add({
          name: name,
          category: category,
          price: price,
          stock: stock,
          description: description || "",
          status: "active",
          createdAt: new Date()
        })
        .then(function() {
          // Éxito
          const modal = productForm.closest('.modal');
          if (modal) modal.style.display = 'none';
          productForm.reset();
          showNotification(`Producto ${name} agregado correctamente`, "success");
          
          // Recargar lista de productos si está visible
          if (!document.getElementById('productos-section').classList.contains('section-hide')) {
            loadProducts();
          }
        })
        .catch(function(error) {
          // Error
          console.error("Error:", error);
          showNotification("Error: " + error.message, "error");
        });
      });
    }
  }

  // Función para mostrar notificaciones temporales (redefinida aquí)
  function showNotification(message, type = 'info') {
    let notification = document.querySelector('.notification-popup');

    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification-popup';
      document.body.appendChild(notification);
    }

    notification.className = `notification-popup ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.style.display = 'none';
        notification.style.opacity = '1';
      }, 500);
    }, 3000);
  }
});