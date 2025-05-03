// Módulo de usuarios simplificado
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si Firebase está disponible
  if (typeof firebase === 'undefined') {
      console.error('Firebase no está definido. Asegúrate de cargar los scripts de Firebase.');
      return;
  }

  // Elementos del DOM
  const userTableBody = document.getElementById('users-table-body');
  const addUserBtn = document.getElementById('add-user-btn');
  const userModal = document.getElementById('user-modal');
  const userForm = document.getElementById('user-form');
  const saveUserBtn = document.getElementById('save-user-btn');
  
  // Variables de estado
  let editingUserId = null;
  
  // Inicializar Firebase
  const db = firebase.firestore();
  const usersRef = db.collection('usuarios');
  
  // Cargar usuarios al iniciar
  loadUsers();
  
  // Event listeners
  if (addUserBtn) {
      addUserBtn.addEventListener('click', function() {
          openUserModal();
      });
  }
  
  if (userForm) {
      userForm.addEventListener('submit', function(e) {
          e.preventDefault();
          saveUser();
      });
  }
  
  // Función para cargar usuarios desde Firestore
  function loadUsers() {
      if (!userTableBody) return;
      
      // Mostrar mensaje de carga
      userTableBody.innerHTML = '<tr><td colspan="7">Cargando usuarios...</td></tr>';
      
      // Obtener usuarios de Firestore
      usersRef.get()
          .then(snapshot => {
              if (snapshot.empty) {
                  userTableBody.innerHTML = '<tr><td colspan="7">No hay usuarios registrados</td></tr>';
                  return;
              }
              
              // Limpiar tabla
              userTableBody.innerHTML = '';
              
              // Mostrar cada usuario
              snapshot.forEach(doc => {
                  const userData = doc.data();
                  const userId = doc.id;
                  
                  // Crear fila para el usuario
                  const row = document.createElement('tr');
                  
                  // Formatear fecha si existe
                  let createdDate = 'N/A';
                  if (userData.createdAt) {
                      const date = userData.createdAt.toDate ? 
                                  userData.createdAt.toDate() : 
                                  new Date(userData.createdAt);
                      createdDate = date.toLocaleDateString();
                  }
                  
                  // Crear contenido de la fila
                  row.innerHTML = `
                      <td>${userId.substring(0, 8)}...</td>
                      <td>${userData.name || 'Sin nombre'}</td>
                      <td>${userData.email || 'Sin email'}</td>
                      <td>${userData.role === 'admin' ? 'Administrador' : 'Cliente'}</td>
                      <td>
                          <span class="status-badge ${userData.status === 'active' ? 'active' : 'inactive'}">
                              ${userData.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                      </td>
                      <td>${createdDate}</td>
                      <td>
                          <div class="table-actions">
                              <button class="btn-icon edit" title="Editar">
                                  <i class="fas fa-edit"></i>
                              </button>
                              <button class="btn-icon danger" title="Eliminar">
                                  <i class="fas fa-trash"></i>
                              </button>
                          </div>
                      </td>
                  `;
                  
                  // Agregar event listeners para los botones
                  const editBtn = row.querySelector('.edit');
                  const deleteBtn = row.querySelector('.danger');
                  
                  if (editBtn) {
                      editBtn.addEventListener('click', function() {
                          openUserModal(userId, userData);
                      });
                  }
                  
                  if (deleteBtn) {
                      deleteBtn.addEventListener('click', function() {
                          if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
                              deleteUser(userId);
                          }
                      });
                  }
                  
                  userTableBody.appendChild(row);
              });
          })
          .catch(error => {
              console.error('Error al cargar usuarios:', error);
              userTableBody.innerHTML = `<tr><td colspan="7">Error al cargar usuarios: ${error.message}</td></tr>`;
          });
  }
  
  // Función para abrir modal de usuario
  function openUserModal(userId = null, userData = null) {
      if (!userModal || !userForm) return;
      
      // Limpiar formulario
      userForm.reset();
      
      // Título del modal
      const modalTitle = document.getElementById('user-modal-title');
      if (modalTitle) {
          modalTitle.textContent = userId ? 'Editar Usuario' : 'Nuevo Usuario';
      }
      
      // Si es edición, rellenar con datos existentes
      if (userId && userData) {
          editingUserId = userId;
          
          document.getElementById('user-name').value = userData.name || '';
          document.getElementById('user-email').value = userData.email || '';
          
          // El campo de contraseña solo es requerido para nuevos usuarios
          const passwordField = document.getElementById('user-password');
          if (passwordField) {
              passwordField.required = false;
              passwordField.parentElement.style.display = 'none';
          }
          
          const roleField = document.getElementById('user-role');
          if (roleField) {
              roleField.value = userData.role || 'user';
          }
          
          const phoneField = document.getElementById('user-phone');
          if (phoneField) {
              phoneField.value = userData.phone || '';
          }
          
          const addressField = document.getElementById('user-address');
          if (addressField) {
              addressField.value = userData.address || '';
          }
      } else {
          editingUserId = null;
          
          // Para nuevos usuarios, mostrar y requerir contraseña
          const passwordField = document.getElementById('user-password');
          if (passwordField) {
              passwordField.required = true;
              passwordField.parentElement.style.display = 'block';
          }
      }
      
      // Mostrar modal
      userModal.classList.add('active');
  }
  
  // Función para guardar usuario
  function saveUser() {
      if (!userForm) return;
      
      // Obtener datos del formulario
      const name = document.getElementById('user-name').value.trim();
      const email = document.getElementById('user-email').value.trim();
      const password = document.getElementById('user-password')?.value;
      const role = document.getElementById('user-role').value;
      const phone = document.getElementById('user-phone').value.trim();
      const address = document.getElementById('user-address').value.trim();
      
      // Validar email
      if (!email) {
          alert('El correo electrónico es obligatorio');
          return;
      }
      
      // Mostrar estado de carga
      if (saveUserBtn) {
          saveUserBtn.disabled = true;
          saveUserBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      }
      
      if (editingUserId) {
          // Actualizar usuario existente
          usersRef.doc(editingUserId).update({
              name,
              email,
              role,
              phone,
              address,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          })
          .then(() => {
              alert('Usuario actualizado correctamente');
              userModal.classList.remove('active');
              loadUsers();
          })
          .catch(error => {
              console.error('Error al actualizar usuario:', error);
              alert('Error al actualizar usuario: ' + error.message);
          })
          .finally(() => {
              if (saveUserBtn) {
                  saveUserBtn.disabled = false;
                  saveUserBtn.textContent = 'Guardar';
              }
          });
      } else {
          // Crear nuevo usuario
          if (!password) {
              alert('La contraseña es obligatoria para nuevos usuarios');
              if (saveUserBtn) {
                  saveUserBtn.disabled = false;
                  saveUserBtn.textContent = 'Guardar';
              }
              return;
          }
          
          // Crear usuario en Authentication
          firebase.auth().createUserWithEmailAndPassword(email, password)
              .then(userCredential => {
                  // Obtener UID generado
                  const uid = userCredential.user.uid;
                  
                  // Guardar datos en Firestore
                  return usersRef.doc(uid).set({
                      name,
                      email,
                      role,
                      phone,
                      address,
                      status: 'active',
                      createdAt: firebase.firestore.FieldValue.serverTimestamp()
                  });
              })
              .then(() => {
                  alert('Usuario creado correctamente');
                  userModal.classList.remove('active');
                  loadUsers();
              })
              .catch(error => {
                  console.error('Error al crear usuario:', error);
                  alert('Error al crear usuario: ' + error.message);
              })
              .finally(() => {
                  if (saveUserBtn) {
                      saveUserBtn.disabled = false;
                      saveUserBtn.textContent = 'Guardar';
                  }
              });
      }
  }
  
  // Función para eliminar usuario
  function deleteUser(userId) {
      usersRef.doc(userId).update({
          status: 'inactive',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
          alert('Usuario desactivado correctamente');
          loadUsers();
      })
      .catch(error => {
          console.error('Error al desactivar usuario:', error);
          alert('Error al desactivar usuario: ' + error.message);
      });
  }
});