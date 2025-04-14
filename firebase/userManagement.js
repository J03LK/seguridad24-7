// Archivo: firebase/userManagement.js

// Asegurarse de que Firebase esté disponible
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que Firebase esté inicializado
    if (typeof firebase !== 'undefined' && firebase.app) {
      initUserManagement();
    } else {
      console.error('Firebase no está inicializado. Verifica la configuración.');
    }
  });
  
  function initUserManagement() {
    const db = firebase.firestore();
    const usersTable = document.getElementById('users-table');
    const addUserForm = document.getElementById('add-user-form');
    const addUserModal = document.getElementById('add-user-modal');
    const addUserBtn = document.getElementById('add-user-btn');
    const closeButtons = document.querySelectorAll('#add-user-modal .close, #add-user-modal .modal-close');
    
    // Cargar usuarios existentes
    loadUsers();
    
    // Función para cargar y mostrar los usuarios
    function loadUsers() {
      if (!usersTable) return;
      
      // Limpiar tabla
      usersTable.innerHTML = '';
      
      // Obtener datos de Firestore
      db.collection('users').get()
        .then(snapshot => {
          if (snapshot.empty) {
            usersTable.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios registrados</td></tr>';
            return;
          }
          
          // Recorrer documentos y crear filas
          snapshot.forEach(doc => {
            const userData = doc.data();
            const userId = doc.id;
            
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${userId.substring(0, 8)}...</td>
              <td>${userData.name || 'N/A'}</td>
              <td>${userData.email || 'N/A'}</td>
              <td>${userData.phone || 'N/A'}</td>
              <td>${userData.address || 'N/A'}</td>
              <td>
                <span class="status-badge ${userData.status === 'active' ? 'active' : 'inactive'}">
                  ${userData.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn edit" data-id="${userId}">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-btn delete" data-id="${userId}">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            `;
            
            usersTable.appendChild(row);
          });
          
          // Añadir event listeners a los botones de acción
          addActionListeners();
        })
        .catch(error => {
          console.error('Error al cargar usuarios:', error);
          showNotification('Error al cargar usuarios: ' + error.message, 'error');
        });
    }
    
    // Añadir event listeners a los botones de editar y eliminar
    function addActionListeners() {
      // Botones de editar
      document.querySelectorAll('#users-table .action-btn.edit').forEach(button => {
        button.addEventListener('click', function() {
          const userId = this.getAttribute('data-id');
          editUser(userId);
        });
      });
      
      // Botones de eliminar
      document.querySelectorAll('#users-table .action-btn.delete').forEach(button => {
        button.addEventListener('click', function() {
          const userId = this.getAttribute('data-id');
          deleteUser(userId);
        });
      });
    }
    
    // Función para editar usuario (a implementar)
    function editUser(userId) {
      // Por ahora, solo mostramos en consola
      console.log('Editar usuario:', userId);
      // Aquí implementarías la lógica para abrir modal con datos y actualizar
    }
    
    // Función para eliminar usuario
    function deleteUser(userId) {
      if (confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
        db.collection('users').doc(userId).delete()
          .then(() => {
            showNotification('Usuario eliminado correctamente', 'success');
            loadUsers(); // Recargar lista
          })
          .catch(error => {
            console.error('Error al eliminar usuario:', error);
            showNotification('Error al eliminar usuario: ' + error.message, 'error');
          });
      }
    }
    
    // Añadir evento para mostrar el modal
    if (addUserBtn) {
      addUserBtn.addEventListener('click', function() {
        if (addUserModal) addUserModal.style.display = 'block';
      });
    }
    
    // Añadir eventos para cerrar el modal
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        addUserModal.style.display = 'none';
      });
    });
    
    // Cuando se envía el formulario, recargar usuarios
    if (addUserForm) {
      addUserForm.addEventListener('submit', function() {
        // El evento submit ya está manejado en el script principal
        // Solo necesitamos recargar usuarios después de un tiempo
        setTimeout(loadUsers, 1000);
      });
    }
    
    // También puedes añadir cierre al hacer clic fuera del modal
    window.addEventListener('click', function(event) {
      if (event.target === addUserModal) {
        addUserModal.style.display = 'none';
      }
    });
  }
  
  // Función para mostrar notificaciones
  function showNotification(message, type = 'info') {
    // Si tienes un sistema de notificaciones, úsalo aquí
    console.log(`Notificación (${type}):`, message);
    
    // Implementación básica si no existe
    if (typeof window.showToast === 'undefined') {
      const toast = document.createElement('div');
      toast.className = `notification ${type}`;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      // Mostrar
      setTimeout(() => {
        toast.classList.add('show');
      }, 100);
      
      // Ocultar después de 3 segundos
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    } else {
      window.showToast(message, type);
    }
  }
  
  // Exportar funciones para uso en otros módulos
  export { initUserManagement, loadUsers };