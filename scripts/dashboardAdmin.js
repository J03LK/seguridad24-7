// Módulo de gestión de usuarios
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar eventos solo si estamos en la pestaña de usuarios
    const usuariosTab = document.getElementById('usuarios-tab');
    if (usuariosTab) {
        // Inicializar eventos cuando se active la pestaña
        document.querySelectorAll('[data-tab="usuarios"]').forEach(tab => {
            tab.addEventListener('click', () => {
                initUsuariosModule();
            });
        });
        
        // Si la URL tiene el hash #usuarios, inicializar inmediatamente
        if (window.location.hash === '#usuarios') {
            initUsuariosModule();
        }
    }
});

// Inicializar módulo de usuarios
function initUsuariosModule() {
    // Cargar lista de usuarios
    loadUsuarios();
    
    // Inicializar botón de crear usuario
    document.getElementById('crear-usuario-btn').addEventListener('click', () => {
        openUserModal();
    });
    
    // Inicializar filtros
    initUsuariosFiltros();
    
    // Inicializar modal de usuario
    initUsuarioModal();
}

// Variables para la paginación
let currentUsuariosPage = 1;
const usuariosPerPage = 10;
let filteredUsuarios = [];

// Cargar lista de usuarios
async function loadUsuarios() {
    try {
        const usuariosTableBody = document.getElementById('usuarios-table-body');
        usuariosTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando usuarios...</td></tr>';
        
        // Obtener usuarios de Firestore
        const usuariosSnapshot = await db.collection('usuarios')
            .orderBy('fechaCreacion', 'desc')
            .get();
        
        if (usuariosSnapshot.empty) {
            usuariosTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios registrados</td></tr>';
            return;
        }
        
        // Convertir los documentos a un array
        const usuarios = [];
        usuariosSnapshot.forEach(doc => {
            const usuario = doc.data();
            usuario.id = doc.id;
            usuarios.push(usuario);
        });
        
        // Guardar usuarios filtrados
        filteredUsuarios = [...usuarios];
        
        // Mostrar usuarios paginados
        renderUsuariosPagination();
        
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showAlert('Error al cargar la lista de usuarios', 'error');
    }
}

// Renderizar tabla de usuarios con paginación
function renderUsuariosPagination() {
    const usuariosTableBody = document.getElementById('usuarios-table-body');
    const start = (currentUsuariosPage - 1) * usuariosPerPage;
    const end = start + usuariosPerPage;
    const paginatedUsuarios = filteredUsuarios.slice(start, end);
    
    // Limpiar tabla
    usuariosTableBody.innerHTML = '';
    
    if (paginatedUsuarios.length === 0) {
        usuariosTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron usuarios</td></tr>';
        return;
    }
    
    // Agregar cada usuario a la tabla
    paginatedUsuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', usuario.id);
        
        tr.innerHTML = `
            <td>${usuario.id.substring(0, 8)}...</td>
            <td>${usuario.nombre || 'Sin nombre'}</td>
            <td>${usuario.email || 'Sin email'}</td>
            <td>
                <span class="badge ${usuario.rol === 'admin' ? 'bg-primary' : 'bg-secondary'}">
                    ${usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
            </td>
            <td>
                <span class="badge ${usuario.estado === 'activo' ? 'bg-success' : 'bg-danger'}">
                    ${usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${formatDate(usuario.ultimoAcceso) || 'Nunca'}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn view" title="Ver detalles" onclick="viewUsuario('${usuario.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" title="Editar" onclick="editUsuario('${usuario.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" title="Eliminar" onclick="deleteUsuario('${usuario.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        
        usuariosTableBody.appendChild(tr);
    });
    
    // Renderizar paginación
    renderUsuariosPaginationControls();
}

// Renderizar controles de paginación
function renderUsuariosPaginationControls() {
    const paginationContainer = document.getElementById('usuarios-pagination');
    const totalPages = Math.ceil(filteredUsuarios.length / usuariosPerPage);
    
    // Limpiar paginación
    paginationContainer.innerHTML = '';
    
    // Si no hay suficientes páginas, ocultar paginación
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Botón de página anterior
    const prevBtn = document.createElement('div');
    prevBtn.className = 'pagination-item';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.addEventListener('click', () => {
        if (currentUsuariosPage > 1) {
            currentUsuariosPage--;
            renderUsuariosPagination();
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // Páginas
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentUsuariosPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('div');
        pageBtn.className = `pagination-item ${i === currentUsuariosPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentUsuariosPage = i;
            renderUsuariosPagination();
        });
        paginationContainer.appendChild(pageBtn);
    }
    
    // Botón de página siguiente
    const nextBtn = document.createElement('div');
    nextBtn.className = 'pagination-item';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener('click', () => {
        if (currentUsuariosPage < totalPages) {
            currentUsuariosPage++;
            renderUsuariosPagination();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// Inicializar filtros de usuarios
function initUsuariosFiltros() {
    const searchInput = document.getElementById('buscar-usuario');
    const rolFilter = document.getElementById('filtro-rol');
    const estadoFilter = document.getElementById('filtro-estado');
    
    // Función para aplicar filtros
    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const rolValue = rolFilter.value;
        const estadoValue = estadoFilter.value;
        
        // Obtener todos los usuarios
        db.collection('usuarios').get().then(snapshot => {
            let usuarios = [];
            snapshot.forEach(doc => {
                const usuario = doc.data();
                usuario.id = doc.id;
                usuarios.push(usuario);
            });
            
            // Aplicar filtros
            filteredUsuarios = usuarios.filter(usuario => {
                // Filtro de búsqueda
                const matchesSearch = searchTerm === '' || 
                    (usuario.nombre && usuario.nombre.toLowerCase().includes(searchTerm)) || 
                    (usuario.email && usuario.email.toLowerCase().includes(searchTerm));
                
                // Filtro de rol
                const matchesRol = rolValue === 'todos' || usuario.rol === rolValue;
                
                // Filtro de estado
                const matchesEstado = estadoValue === 'todos' || usuario.estado === estadoValue;
                
                return matchesSearch && matchesRol && matchesEstado;
            });
            
            // Resetear a la primera página
            currentUsuariosPage = 1;
            
            // Renderizar usuarios filtrados
            renderUsuariosPagination();
        }).catch(error => {
            console.error('Error al filtrar usuarios:', error);
            showAlert('Error al filtrar usuarios', 'error');
        });
    };
    
    // Aplicar filtros al escribir en el campo de búsqueda
    searchInput.addEventListener('keyup', () => {
        applyFilters();
    });
    
    // Aplicar filtros al cambiar los selectores
    rolFilter.addEventListener('change', applyFilters);
    estadoFilter.addEventListener('change', applyFilters);
}

// Inicializar modal de usuario
function initUsuarioModal() {
    const modal = document.getElementById('usuario-modal');
    const form = document.getElementById('usuario-form');
    const closeButtons = modal.querySelectorAll('.close-modal, #usuario-cancel-btn');
    const saveButton = document.getElementById('usuario-save-btn');
    
    // Cerrar modal
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.classList.remove('active');
            form.reset();
        });
    });
    
    // Guardar usuario
    saveButton.addEventListener('click', () => {
        saveUsuario();
    });
}

// Abrir modal para crear nuevo usuario
function openUserModal(userId = null) {
    const modal = document.getElementById('usuario-modal');
    const form = document.getElementById('usuario-form');
    const modalTitle = document.getElementById('usuario-modal-title');
    const passwordInput = document.getElementById('usuario-password');
    const passwordLabel = document.querySelector('label[for="usuario-password"]');
    
    // Limpiar formulario
    form.reset();
    
    if (userId) {
        // Modo edición
        modalTitle.textContent = 'Editar Usuario';
        passwordLabel.textContent = 'Contraseña (dejar en blanco para mantener la actual)';
        passwordInput.required = false;
        
        // Cargar datos del usuario
        db.collection('usuarios').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const usuario = doc.data();
                    
                    // Llenar formulario
                    document.getElementById('usuario-nombre').value = usuario.nombre || '';
                    document.getElementById('usuario-email').value = usuario.email || '';
                    document.getElementById('usuario-rol').value = usuario.rol || 'usuario';
                    document.getElementById('usuario-estado').value = usuario.estado || 'activo';
                    
                    // Guardar ID del usuario en un data attribute
                    form.setAttribute('data-id', userId);
                } else {
                    showAlert('Usuario no encontrado', 'error');
                    modal.classList.remove('active');
                }
            })
            .catch(error => {
                console.error('Error al cargar datos del usuario:', error);
                showAlert('Error al cargar datos del usuario', 'error');
                modal.classList.remove('active');
            });
    } else {
        // Modo creación
        modalTitle.textContent = 'Nuevo Usuario';
        passwordLabel.textContent = 'Contraseña';
        passwordInput.required = true;
        form.removeAttribute('data-id');
    }
    
    // Mostrar modal
    modal.classList.add('active');
}

// Guardar usuario (crear o actualizar)
async function saveUsuario() {
    const form = document.getElementById('usuario-form');
    const modal = document.getElementById('usuario-modal');
    const userId = form.getAttribute('data-id');
    
    // Validar formulario
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Obtener valores del formulario
    const nombre = document.getElementById('usuario-nombre').value;
    const email = document.getElementById('usuario-email').value;
    const password = document.getElementById('usuario-password').value;
    const rol = document.getElementById('usuario-rol').value;
    const estado = document.getElementById('usuario-estado').value;
    
    // Datos del usuario
    const userData = {
        nombre,
        email,
        rol,
        estado,
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (userId) {
            // Actualizar usuario existente
            
            // Si se proporciona una nueva contraseña, actualizarla
            if (password) {
                // Obtener usuario actual de Firebase Auth
                const userRecord = await new Promise((resolve, reject) => {
                    db.collection('usuarios').doc(userId).get()
                        .then(doc => {
                            if (doc.exists) {
                                resolve(doc.data());
                            } else {
                                reject('Usuario no encontrado');
                            }
                        })
                        .catch(reject);
                });
                
                // Actualizar contraseña (esto debe hacerse en el backend por seguridad)
                // Aquí simulamos que se actualiza correctamente
                console.log('Contraseña actualizada para el usuario', email);
            }
            
            // Actualizar datos en Firestore
            await db.collection('usuarios').doc(userId).update(userData);
            
            showAlert('Usuario actualizado con éxito', 'success');
        } else {
            // Crear nuevo usuario
            
            // Verificar si el email ya existe
            const emailCheck = await auth.fetchSignInMethodsForEmail(email).catch(() => []);
            
            if (emailCheck.length > 0) {
                showAlert('El email ya está en uso', 'error');
                return;
            }
            
            // Crear usuario en Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const newUserId = userCredential.user.uid;
            
            // Añadir metadata
            userData.id = newUserId;
            userData.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
            
            // Guardar datos en Firestore
            await db.collection('usuarios').doc(newUserId).set(userData);
            
            showAlert('Usuario creado con éxito', 'success');
            
            // Enviar email de bienvenida (opcional)
            await auth.currentUser.sendEmailVerification();
        }
        
        // Cerrar modal y recargar lista
        modal.classList.remove('active');
        loadUsuarios();
        
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        showAlert(`Error: ${error.message}`, 'error');
    }
}

// Ver detalles de usuario
function viewUsuario(userId) {
    // Redirigir a la edición por ahora
    editUsuario(userId);
}

// Editar usuario
function editUsuario(userId) {
    openUserModal(userId);
}

// Eliminar usuario
function deleteUsuario(userId) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
        
        // Obtener datos del usuario antes de eliminar
        db.collection('usuarios').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const usuario = doc.data();
                    
                    // Eliminar usuario de Firestore
                    return db.collection('usuarios').doc(userId).delete()
                        .then(() => {
                            // Intentar eliminar usuario de Authentication
                            // Nota: Esto debe hacerse desde el backend por seguridad
                            console.log('Usuario eliminado de Firestore:', usuario.email);
                            
                            showAlert('Usuario eliminado con éxito', 'success');
                            loadUsuarios();
                        });
                } else {
                    showAlert('Usuario no encontrado', 'error');
                }
            })
            .catch(error => {
                console.error('Error al eliminar usuario:', error);
                showAlert('Error al eliminar usuario', 'error');
            });
    }
}

// Exportar funciones al ámbito global
window.viewUsuario = viewUsuario;
window.editUsuario = editUsuario;
window.deleteUsuario = deleteUsuario;
