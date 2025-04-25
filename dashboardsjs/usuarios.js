// Variables globales para la gestión de usuarios
let usersList = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 0;
let editingUserId = null;

// Cargar usuarios desde Firestore
function loadUsers(page = 1) {
  currentPage = page;
  
  // Mostrar indicador de carga
  document.getElementById('usuarios-table-body').innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';
  
  // Obtener filtros
  const rolFilter = document.getElementById('filtro-rol').value;
  const estadoFilter = document.getElementById('filtro-estado').value;
  const searchText = document.getElementById('buscar-usuario').value.toLowerCase();
  
  // Referencia a la colección de usuarios
  let usersRef = firebase.firestore().collection('users');
  
  // Aplicar filtros de rol si no es "todos"
  if (rolFilter !== 'todos') {
    usersRef = usersRef.where('role', '==', rolFilter);
  }
  
  // Aplicar filtros de estado si no es "todos"
  if (estadoFilter !== 'todos') {
    usersRef = usersRef.where('estado', '==', estadoFilter);
  }
  
  // Obtener usuarios
  usersRef.get()
    .then(snapshot => {
      usersList = [];
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        
        // Filtrar por texto de búsqueda si existe
        if (searchText) {
          const matchesSearch = 
            (userData.nombre && userData.nombre.toLowerCase().includes(searchText)) ||
            (userData.email && userData.email.toLowerCase().includes(searchText));
          
          if (!matchesSearch) return;
        }
        
        usersList.push({
          id: doc.id,
          ...userData
        });
      });
      
      // Calcular paginación
      totalPages = Math.ceil(usersList.length / itemsPerPage);
      
      // Mostrar usuarios en la tabla
      displayUsers();
      
      // Actualizar paginación
      updatePagination();
    })
    .catch(error => {
      console.error("Error al cargar usuarios:", error);
      document.getElementById('usuarios-table-body').innerHTML = 
        '<tr><td colspan="7" class="text-center">Error al cargar usuarios. Intente nuevamente.</td></tr>';
    });
}

// Mostrar usuarios en la tabla
function displayUsers() {
  const tableBody = document.getElementById('usuarios-table-body');
  tableBody.innerHTML = '';
  
  // Calcular índices para la paginación
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, usersList.length);
  
  if (usersList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron usuarios.</td></tr>';
    return;
  }
  
  // Mostrar usuarios para la página actual
  for (let i = startIdx; i < endIdx; i++) {
    const user = usersList[i];
    const row = document.createElement('tr');
    
    // Formatear fecha
    let lastAccess = 'Nunca';
    if (user.lastLogin) {
      const date = user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin);
      lastAccess = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    
    // Estado con clase CSS
    const estadoClass = user.estado === 'activo' ? 'status-active' : 'status-inactive';
    
    row.innerHTML = `
      <td>${user.id.substring(0, 8)}...</td>
      <td>${user.nombre || 'Sin nombre'}</td>
      <td>${user.email}</td>
      <td>${user.role === 'admin' ? 'Administrador' : 'Usuario'}</td>
      <td><span class="status-badge ${estadoClass}">${user.estado || 'activo'}</span></td>
      <td>${lastAccess}</td>
      <td class="actions">
        <button class="btn-icon edit-user" data-id="${user.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete-user" data-id="${user.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    
    tableBody.appendChild(row);
  }
  
  // Agregar event listeners a los botones de acción
  document.querySelectorAll('.edit-user').forEach(btn => {
    btn.addEventListener('click', () => openEditUserModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-user').forEach(btn => {
    btn.addEventListener('click', () => confirmDeleteUser(btn.dataset.id));
  });
}

// Actualizar paginación
function updatePagination() {
  const paginationElement = document.getElementById('usuarios-pagination');
  
  if (totalPages <= 1) {
    paginationElement.innerHTML = '';
    return;
  }
  
  let html = `
    <button class="pagination-btn" onclick="loadUsers(1)" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-angle-double-left"></i>
    </button>
    <button class="pagination-btn" onclick="loadUsers(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-angle-left"></i>
    </button>
  `;
  
  // Mostrar números de página (hasta 5 páginas)
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(startPage + 4, totalPages);
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="loadUsers(${i})">
        ${i}
      </button>
    `;
  }
  
  html += `
    <button class="pagination-btn" onclick="loadUsers(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-angle-right"></i>
    </button>
    <button class="pagination-btn" onclick="loadUsers(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-angle-double-right"></i>
    </button>
  `;
  
  paginationElement.innerHTML = html;
}

// Abrir modal para crear usuario
function openCreateUserModal() {
  editingUserId = null;
  document.getElementById('usuario-modal-title').textContent = 'Nuevo Usuario';
  document.getElementById('usuario-form').reset();
  document.getElementById('usuario-password').required = true;
  document.getElementById('usuario-password').nextElementSibling.style.display = 'none';
  
  // Mostrar modal
  document.getElementById('usuario-modal').classList.add('active');
}

// Abrir modal para editar usuario
function openEditUserModal(userId) {
  editingUserId = userId;
  document.getElementById('usuario-modal-title').textContent = 'Editar Usuario';
  document.getElementById('usuario-form').reset();
  document.getElementById('usuario-password').required = false;
  document.getElementById('usuario-password').nextElementSibling.style.display = 'block';
  
  // Obtener datos del usuario
  firebase.firestore().collection('users').doc(userId).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        document.getElementById('usuario-nombre').value = userData.nombre || '';
        document.getElementById('usuario-email').value = userData.email || '';
        document.getElementById('usuario-rol').value = userData.role || 'usuario';
        document.getElementById('usuario-estado').value = userData.estado || 'activo';
      }
    })
    .catch(error => {
      console.error("Error al obtener datos del usuario:", error);
    });
  
  // Mostrar modal
  document.getElementById('usuario-modal').classList.add('active');
}

// Guardar usuario (crear o actualizar)
function saveUser() {
  const nombre = document.getElementById('usuario-nombre').value;
  const email = document.getElementById('usuario-email').value;
  const password = document.getElementById('usuario-password').value;
  const role = document.getElementById('usuario-rol').value;
  const estado = document.getElementById('usuario-estado').value;
  
  if (!nombre || !email) {
    alert('Por favor complete todos los campos obligatorios.');
    return;
  }
  
  // Mostrar indicador de carga
  const saveBtn = document.getElementById('usuario-save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Guardando...';
  saveBtn.disabled = true;
  
  if (editingUserId) {
    // Actualizar usuario existente
    const userRef = firebase.firestore().collection('users').doc(editingUserId);
    
    // Actualizar datos en Firestore
    userRef.update({
      nombre,
      email,
      role,
      estado,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      // Si se cambió la contraseña, actualizarla en Authentication
      if (password) {
        const user = firebase.auth().currentUser;
        if (user && user.email === email) {
          // Si es el usuario actual, actualizar su contraseña
          return user.updatePassword(password);
        } else {
          // Para otros usuarios, esto requeriría funciones de Firebase Cloud Functions
          console.log("No se puede actualizar contraseña de otros usuarios desde el cliente.");
          return Promise.resolve();
        }
      }
      return Promise.resolve();
    })
    .then(() => {
      closeUserModal();
      loadUsers(currentPage);
    })
    .catch(error => {
      console.error("Error al actualizar usuario:", error);
      alert('Error al actualizar usuario: ' + error.message);
    })
    .finally(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    });
  } else {
    // Crear nuevo usuario
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        // Guardar datos adicionales en Firestore
        return firebase.firestore().collection('users').doc(userCredential.user.uid).set({
          nombre,
          email,
          role,
          estado,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        closeUserModal();
        loadUsers(1); // Volver a la primera página
      })
      .catch(error => {
        console.error("Error al crear usuario:", error);
        alert('Error al crear usuario: ' + error.message);
      })
      .finally(() => {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      });
  }
}

// Confirmar eliminación de usuario
function confirmDeleteUser(userId) {
  if (confirm('¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.')) {
    deleteUser(userId);
  }
}

// Eliminar usuario
function deleteUser(userId) {
  // Eliminar de Firestore primero
  firebase.firestore().collection('users').doc(userId).delete()
    .then(() => {
      // Nota: Eliminar un usuario de Authentication requiere Firebase Admin SDK
      // que se ejecuta en el servidor. Aquí solo eliminamos los datos de Firestore.
      loadUsers(currentPage);
    })
    .catch(error => {
      console.error("Error al eliminar usuario:", error);
      alert('Error al eliminar usuario: ' + error.message);
    });
}

// Cerrar modal de usuario
function closeUserModal() {
  document.getElementById('usuario-modal').classList.remove('active');
  document.getElementById('usuario-form').reset();
  editingUserId = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Botón para crear usuario
  document.getElementById('crear-usuario-btn').addEventListener('click', openCreateUserModal);
  
  // Botones del modal
  document.getElementById('usuario-save-btn').addEventListener('click', saveUser);
  document.getElementById('usuario-cancel-btn').addEventListener('click', closeUserModal);
  document.querySelector('#usuario-modal .close-modal').addEventListener('click', closeUserModal);
  
  // Filtros
  document.getElementById('filtro-rol').addEventListener('change', () => loadUsers(1));
  document.getElementById('filtro-estado').addEventListener('change', () => loadUsers(1));
  
  // Búsqueda
  let searchTimeout;
  document.getElementById('buscar-usuario').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadUsers(1);
    }, 300);
  });
});