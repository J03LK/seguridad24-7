// Módulo de usuarios - Solución sin Cloud Functions
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
    const modalClose = document.querySelector('.modal-close');
    const cancelBtn = document.querySelector('.cancel-btn');
    
    // Variables de estado
    let editingUserId = null;
    let originalEmail = null;
    
    // Inicializar Firebase
    const db = firebase.firestore();
    const usersRef = db.collection('usuarios');
    const auth = firebase.auth();
    
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
    
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            userModal.classList.remove('active');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            userModal.classList.remove('active');
        });
    }
    
    // Función para cargar usuarios desde Firestore
    function loadUsers() {
        if (!userTableBody) return;
        
        // Mostrar mensaje de carga
        userTableBody.innerHTML = '<tr><td colspan="7" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Cargando usuarios...</td></tr>';
        
        // Obtener usuarios de Firestore
        usersRef.get()
            .then(snapshot => {
                if (snapshot.empty) {
                    userTableBody.innerHTML = '<tr><td colspan="7" class="empty-row">No hay usuarios registrados</td></tr>';
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
                            if (confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
                                deleteUser(userId);
                            }
                        });
                    }
                    
                    userTableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error al cargar usuarios:', error);
                userTableBody.innerHTML = `<tr><td colspan="7" class="error-row">Error al cargar usuarios: ${error.message}</td></tr>`;
            });
    }
    
    // Función para abrir modal de usuario
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
        originalEmail = userData.email || '';
        
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
        
        // Cargar el plan si existe
        const planField = document.getElementById('user-plan');
        if (planField && userData.planId) {
            planField.value = userData.planId;
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
        originalEmail = null;
        
        // Para nuevos usuarios, mostrar y requerir contraseña
        const passwordField = document.getElementById('user-password');
        if (passwordField) {
            passwordField.required = true;
            passwordField.parentElement.style.display = 'block';
        }
    }
    
    // Verificar visibilidad del campo de plan según el rol seleccionado
    togglePlanField();
    
    // Mostrar modal
    userModal.classList.add('active');
}
    // Función para guardar usuario
   // Función para guardar usuario
async function saveUser() {
    if (!userForm) return;
    
    // Obtener datos del formulario
    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const password = document.getElementById('user-password')?.value;
    const role = document.getElementById('user-role').value;
    const phone = document.getElementById('user-phone').value.trim();
    const address = document.getElementById('user-address').value.trim();
    
    // Obtener el plan seleccionado (solo relevante para clientes)
    const planId = document.getElementById('user-plan').value;
    
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
    
    try {
        if (editingUserId) {
            // Actualizar usuario existente
            const emailChanged = email !== originalEmail;
            
            // Siempre actualizamos Firestore
            await usersRef.doc(editingUserId).update({
                name,
                email,  // Actualizar el email en Firestore aunque no se pueda en Auth
                role,
                phone,
                address,
                planId, // Guardar el plan seleccionado
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Si es cliente y tiene plan, actualizar su suscripción
            if (role === 'user' && planId) {
                // Verificar si ya tiene una suscripción
                const subscriptionsRef = db.collection('subscriptions');
                const existingSubscription = await subscriptionsRef
                    .where('clientId', '==', editingUserId)
                    .where('status', '==', 'active')
                    .get();
                
                // Calcular próxima facturación (1 mes desde hoy)
                const today = new Date();
                const nextBillingDate = new Date(today);
                nextBillingDate.setMonth(today.getMonth() + 1);
                
                if (existingSubscription.empty) {
                    // Crear nueva suscripción
                    await subscriptionsRef.add({
                        clientId: editingUserId,
                        planId: planId,
                        status: 'active',
                        startDate: today.toISOString(),
                        nextBillingDate: nextBillingDate.toISOString(),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    // Actualizar suscripción existente
                    const subscriptionDoc = existingSubscription.docs[0];
                    await subscriptionDoc.ref.update({
                        planId: planId,
                        nextBillingDate: nextBillingDate.toISOString(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
            
            if (emailChanged) {
                // Si el email cambió, mostrar instrucciones al usuario
                confirmEmailChanged(originalEmail, email);
            } else {
                alert('Usuario actualizado correctamente');
            }
            
            userModal.classList.remove('active');
            loadUsers();
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
            
            // Solución temporal: usaremos una segunda instancia de Firebase
            let secondaryApp;
            try {
                secondaryApp = firebase.initializeApp(firebase.app().options, 'secondaryApp');
            } catch (e) {
                secondaryApp = firebase.app('secondaryApp');
            }
            
            // Usar la app secundaria para crear el usuario
            const userCredential = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;
            
            // Cerrar sesión inmediatamente en la app secundaria
            await secondaryApp.auth().signOut();
            
            // Guardar datos en Firestore
            await db.collection('usuarios').doc(uid).set({
                name,
                email,
                role,
                phone,
                address,
                planId, // Guardar el plan seleccionado
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Si es cliente y tiene plan, crear una suscripción
            if (role === 'user' && planId) {
                // Calcular próxima facturación (1 mes desde hoy)
                const today = new Date();
                const nextBillingDate = new Date(today);
                nextBillingDate.setMonth(today.getMonth() + 1);
                
                // Crear suscripción
                await db.collection('subscriptions').add({
                    clientId: uid,
                    planId: planId,
                    status: 'active',
                    startDate: today.toISOString(),
                    nextBillingDate: nextBillingDate.toISOString(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            // Limpiar
            try {
                secondaryApp.delete();
            } catch (e) {
                console.error('Error al eliminar app secundaria:', e);
            }
            
            alert('Usuario creado correctament');
            userModal.classList.remove('active');
            loadUsers();
        }
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        alert('Error al guardar usuario: ' + error.message);
    } finally {
        if (saveUserBtn) {
            saveUserBtn.disabled = false;
            saveUserBtn.textContent = 'Guardar';
        }
    }
}
    
    // Función para eliminar usuario
    async function deleteUser(userId) {
        try {
            // Eliminar documento de usuario de Firestore
            await usersRef.doc(userId).delete();
            
            // Mostrar mensaje informativo sobre la limitación
            alert(`El usuario ha sido eliminado de la base de datos, pero NO del sistema de autenticación.

Para eliminar completamente al usuario:
1. Ve a la consola de Firebase (https://console.firebase.google.com)
2. Selecciona "Authentication" en el menú lateral
3. Busca y elimina el usuario manualmente

Alternativamente, el usuario puede seguir existiendo en Authentication sin afectar el funcionamiento.`);
            
            loadUsers();
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert('Error al eliminar usuario: ' + error.message);
        }
    }
    
    // Función para mostrar un modal con instrucciones sobre el cambio de email
    function confirmEmailChanged(oldEmail, newEmail) {
        // Creamos un modal de información
        const infoModal = document.createElement('div');
        infoModal.className = 'modal active';
        infoModal.style.zIndex = '1000';
        
        infoModal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Información importante - Cambio de Email</h3>
                    <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="info-message" style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #4285f4; border-radius: 4px;">
                        <h4 style="margin-top: 0; color: #4285f4;">El email del usuario ha sido actualizado</h4>
                        <p>El email se ha actualizado en la base de datos de <strong>${oldEmail}</strong> a <strong>${newEmail}</strong>.</p>
                        <p><strong>Importante:</strong> Este cambio solo afecta a la base de datos y NO al sistema de autenticación.</p>
                    </div>
                    
                    <h4>Para que el usuario pueda iniciar sesión con su nuevo email:</h4>
                    <ol style="padding-left: 20px;">
                        <li>El usuario debe iniciar sesión con su email <strong>anterior</strong> (${oldEmail})</li>
                        <li>Ir a su perfil de usuario o configuración de cuenta</li>
                        <li>Actualizar su email desde allí</li>
                    </ol>
                    
                    <p>También puedes gestionar los emails de los usuarios desde la consola de Firebase:</p>
                    <ol style="padding-left: 20px;">
                        <li>Ve a <a href="https://console.firebase.google.com" target="_blank">https://console.firebase.google.com</a></li>
                        <li>Selecciona tu proyecto</li>
                        <li>Ve a "Authentication" en el menú lateral</li>
                        <li>Busca el usuario y edita su email manualmente</li>
                    </ol>
                </div>
                <div class="modal-footer" style="text-align: right; padding-top: 15px; border-top: 1px solid #eee;">
                    <button class="btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">Entendido</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(infoModal);
    }
    
    // Exportar funciones para uso externo si es necesario
    window.userModule = {
        loadUsers,
        openUserModal,
        deleteUser
    };

});
// Función para abrir el modal de cambio de contraseña
function openPasswordChangeModal(userId, userData) {
    // Crear modal
    const passwordModal = document.createElement('div');
    passwordModal.className = 'modal active';
    passwordModal.style.zIndex = '1000';
    
    passwordModal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="modal-header">
                <h3>Cambiar Contraseña</h3>
                <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="info-message" style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #4285f4; border-radius: 4px;">
                    <p><strong>Usuario:</strong> ${userData.name || 'Sin nombre'}</p>
                    <p><strong>Email:</strong> ${userData.email || 'Sin email'}</p>
                </div>
                
                <div class="form-group">
                    <label for="new-password">Nueva Contraseña:</label>
                    <input type="password" id="new-password" placeholder="Ingresa la nueva contraseña" required>
                </div>
                
                <div class="form-group">
                    <label for="confirm-password">Confirmar Contraseña:</label>
                    <input type="password" id="confirm-password" placeholder="Confirma la nueva contraseña" required>
                    <div id="password-match-error" class="error-message" style="display: none; color: red; margin-top: 5px;"></div>
                </div>
                
                <div class="form-actions" style="margin-top: 20px;">
                    <button type="button" class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">Cancelar</button>
                    <button type="button" class="btn-primary" id="save-password-btn">Guardar Contraseña</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(passwordModal);
    
    // Manejar botón de guardar
    const savePasswordBtn = document.getElementById('save-password-btn');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordMatchError = document.getElementById('password-match-error');
    
    // Validar coincidencia de contraseñas en tiempo real
    confirmPasswordInput.addEventListener('input', function() {
        if (newPasswordInput.value !== confirmPasswordInput.value) {
            passwordMatchError.textContent = 'Las contraseñas no coinciden';
            passwordMatchError.style.display = 'block';
        } else {
            passwordMatchError.style.display = 'none';
        }
    });
    
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', async function() {
            // Validar contraseñas
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (!newPassword) {
                alert('Debes ingresar una contraseña');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                passwordMatchError.textContent = 'Las contraseñas no coinciden';
                passwordMatchError.style.display = 'block';
                return;
            }
            
            // Validar longitud mínima (Firebase requiere al menos 6 caracteres)
            if (newPassword.length < 6) {
                passwordMatchError.textContent = 'La contraseña debe tener al menos 6 caracteres';
                passwordMatchError.style.display = 'block';
                return;
            }
            
            try {
                // Mostrar spinner
                savePasswordBtn.disabled = true;
                savePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
                
                // Método 1: Enviar email de restablecimiento
                await firebase.auth().sendPasswordResetEmail(userData.email);
                
                // Actualizar registro en Firestore para indicar cambio
                await db.collection('usuarios').doc(userId).update({
                    passwordResetSent: true,
                    passwordResetTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Cerrar modal
                passwordModal.remove();
                
                // Mostrar mensaje de éxito con instrucciones
                showSuccessMessage(userData.email);
                
            } catch (error) {
                console.error('Error al cambiar contraseña:', error);
                alert('Error al cambiar contraseña: ' + error.message);
                
                // Restablecer botón
                savePasswordBtn.disabled = false;
                savePasswordBtn.textContent = 'Guardar Contraseña';
            }
        });
    }
}

// Función para mostrar mensaje de éxito después de enviar email
function showSuccessMessage(email) {
    const successModal = document.createElement('div');
    successModal.className = 'modal active';
    successModal.style.zIndex = '1000';
    
    successModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Enlace de Restablecimiento Enviado</h3>
                <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="success-message" style="margin-bottom: 20px; padding: 15px; background-color: #e6f7e8; border-left: 4px solid #4CAF50; border-radius: 4px;">
                    <h4 style="margin-top: 0; color: #4CAF50;">Enlace enviado correctamente</h4>
                    <p>Se ha enviado un enlace de restablecimiento de contraseña a <strong>${email}</strong>.</p>
                </div>
                
                <p>Instrucciones para completar el proceso:</p>
                <ol style="padding-left: 20px;">
                    <li>El usuario debe revisar su correo electrónico</li>
                    <li>Hacer clic en el enlace de restablecimiento</li>
                    <li>Establecer su nueva contraseña</li>
                </ol>
                
                <p><strong>Nota:</strong> El enlace expira en 1 hora. Si el usuario no lo encuentra, revisa la carpeta de spam o solicita un nuevo enlace.</p>
                
                <div style="text-align: right; margin-top: 20px;">
                    <button class="btn-primary" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">Entendido</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(successModal);
}

// Para implementar esta funcionalidad, necesitas agregar un botón en la tabla de usuarios
// Puedes modificar la función loadUsers así:

function loadUsers() {
    if (!userTableBody) return;
    
    // Mostrar mensaje de carga
    userTableBody.innerHTML = '<tr><td colspan="7" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Cargando usuarios...</td></tr>';
    
    // Obtener usuarios de Firestore
    usersRef.get()
        .then(snapshot => {
            if (snapshot.empty) {
                userTableBody.innerHTML = '<tr><td colspan="7" class="empty-row">No hay usuarios registrados</td></tr>';
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
                            <button class="btn-icon password" title="Cambiar Contraseña">
                                <i class="fas fa-key"></i>
                            </button>
                            <button class="btn-icon danger" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                // Agregar event listeners para los botones
                const editBtn = row.querySelector('.edit');
                const passwordBtn = row.querySelector('.password');
                const deleteBtn = row.querySelector('.danger');
                
                if (editBtn) {
                    editBtn.addEventListener('click', function() {
                        openUserModal(userId, userData);
                    });
                }
                
                if (passwordBtn) {
                    passwordBtn.addEventListener('click', function() {
                        openPasswordChangeModal(userId, userData);
                    });
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        if (confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
                            deleteUser(userId);
                        }
                    });
                }
                
                userTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error al cargar usuarios:', error);
            userTableBody.innerHTML = `<tr><td colspan="7" class="error-row">Error al cargar usuarios: ${error.message}</td></tr>`;
        });
}
// Agregar esto después de los event listeners existentes en tu archivo usuarios.js

// Controlar visibilidad del campo de plan según el rol seleccionado
const roleSelect = document.getElementById('user-role');
const planGroup = document.getElementById('plan-group');

// Función para mostrar/ocultar el campo de plan según el rol
function togglePlanField() {
    if (roleSelect.value === 'user') {
        // Si es cliente, mostrar el campo de plan
        planGroup.style.display = 'block';
    } else {
        // Si es administrador, ocultar el campo de plan
        planGroup.style.display = 'none';
        // Además, resetear la selección a "Sin plan"
        document.getElementById('user-plan').value = '';
    }
}

// Verificar estado inicial al abrir el modal
togglePlanField();

// Agregar listener para cuando cambie el rol
roleSelect.addEventListener('change', togglePlanField);

// También actualizar la función openUserModal para que tenga en cuenta esto
// Busca la función openUserModal existente y añade esta línea justo antes de mostrar el modal:
// togglePlanField();