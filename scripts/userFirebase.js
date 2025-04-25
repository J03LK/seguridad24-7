// Variables y referencias globales
let db;
let auth;
let currentUsuariosPage = 1;
const usuariosPerPage = 10;
let filteredUsuarios = [];

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado completamente');
    
    // Comprobar si estamos en la página de usuarios
    const usuariosTab = document.getElementById('usuarios-tab');
    if (!usuariosTab) {
        console.log('No estamos en la página de usuarios');
        return;
    }
    
    console.log('Página de usuarios detectada');
    
    // Verificar Firebase (intentarlo varias veces)
    let attempts = 0;
    const maxAttempts = 20;
    
    function checkFirebase() {
        console.log(`Intentando inicializar Firebase (intento ${attempts + 1}/${maxAttempts})`);
        
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            console.log('Firebase detectado y inicializado');
            initializeUsersModule();
        } else {
            attempts++;
            
            if (attempts < maxAttempts) {
                console.log('Firebase no detectado, reintentando en 300ms...');
                setTimeout(checkFirebase, 300);
            } else {
                console.error('No se pudo inicializar Firebase después de varios intentos');
                const errorMsg = 'No se pudo conectar con la base de datos. Por favor, recarga la página.';
                showAlert(errorMsg, 'error');
                
                // Mostrar mensaje en la tabla si existe
                const usuariosTableBody = document.getElementById('usuarios-table-body');
                if (usuariosTableBody) {
                    usuariosTableBody.innerHTML = `<tr><td colspan="7" class="text-center">${errorMsg}</td></tr>`;
                }
            }
        }
    }
    
    // Iniciar verificación de Firebase
    checkFirebase();
});

// Inicializar el módulo de usuarios
function initializeUsersModule() {
    console.log('Inicializando módulo de usuarios');
    
    // Obtener las referencias de Firebase
    try {
        db = firebase.firestore();
        auth = firebase.auth();
        console.log('Referencias de Firebase obtenidas correctamente');
    } catch (error) {
        console.error('Error al obtener referencias de Firebase:', error);
        showAlert('Error al conectar con la base de datos', 'error');
        return;
    }
    
    // Agregar event listeners a las pestañas
    document.querySelectorAll('[data-tab="usuarios"]').forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('Pestaña de usuarios activada');
            initUsersContent();
        });
    });
    
    // Si hay un hash en la URL o estamos en la pestaña de usuarios por defecto
    if (window.location.hash === '#usuarios' || document.querySelector('.tab-content[data-tab-content="usuarios"]').classList.contains('active')) {
        console.log('Inicializando contenido de usuarios automáticamente');
        initUsersContent();
    }
}

// Inicializar el contenido de usuarios
function initUsersContent() {
    console.log('Inicializando contenido de usuarios');
    
    // Configurar el botón de crear usuario
    const crearUsuarioBtn = document.getElementById('crear-usuario-btn');
    if (crearUsuarioBtn) {
        console.log('Configurando botón de crear usuario');
        crearUsuarioBtn.addEventListener('click', openUserModal);
    } else {
        console.warn('Botón de crear usuario no encontrado');
    }
    
    // Inicializar filtros
    initUsuariosFiltros();
    
    // Inicializar modal
    initUsuarioModal();
    
    // Cargar la lista de usuarios
    loadUsuarios();
}

// Cargar usuarios
async function loadUsuarios() {
    console.log('Cargando lista de usuarios');
    
    const usuariosTableBody = document.getElementById('usuarios-table-body');
    if (!usuariosTableBody) {
        console.error('No se encontró la tabla de usuarios');
        return;
    }
    
    // Mostrar mensaje de carga
    usuariosTableBody.innerHTML = '<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando usuarios...</td></tr>';
    
    try {
        // Obtener usuarios de Firestore
        console.log('Consultando colección "users" en Firestore');
        const usuariosSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
        
        // Verificar si hay usuarios
        if (usuariosSnapshot.empty) {
            console.log('No se encontraron usuarios');
            usuariosTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios registrados</td></tr>';
            return;
        }
        
        // Procesar datos
        console.log(`Se encontraron ${usuariosSnapshot.size} usuarios`);
        const usuarios = [];
        
        usuariosSnapshot.forEach(doc => {
            const usuario = doc.data();
            usuario.id = doc.id;
            usuarios.push(usuario);
        });
        
        // Guardar usuarios para la paginación y filtros
        filteredUsuarios = [...usuarios];
        
        // Mostrar usuarios con paginación
        renderUsuariosPagination();
        
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        usuariosTableBody.innerHTML = `<tr><td colspan="7" class="text-center">Error al cargar usuarios: ${error.message}</td></tr>`;
        showAlert('Error al cargar la lista de usuarios', 'error');
    }
}

// Renderizar la tabla de usuarios con paginación
function renderUsuariosPagination() {
    console.log('Renderizando tabla de usuarios paginada');
    
    const usuariosTableBody = document.getElementById('usuarios-table-body');
    if (!usuariosTableBody) {
        console.error('No se encontró la tabla de usuarios');
        return;
    }
    
    // Calcular el rango de usuarios a mostrar
    const start = (currentUsuariosPage - 1) * usuariosPerPage;
    const end = start + usuariosPerPage;
    const paginatedUsuarios = filteredUsuarios.slice(start, end);
    
    // Limpiar tabla
    usuariosTableBody.innerHTML = '';
    
    // Verificar si hay usuarios para mostrar
    if (paginatedUsuarios.length === 0) {
        usuariosTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron usuarios</td></tr>';
        return;
    }
    
    // Agregar cada usuario a la tabla
    paginatedUsuarios.forEach(usuario => {
        console.log(`Renderizando usuario: ${usuario.id} - ${usuario.name || 'Sin nombre'}`);
        
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', usuario.id);
        
        tr.innerHTML = `
            <td>${usuario.id.substring(0, 8)}...</td>
            <td>${usuario.name || 'Sin nombre'}</td>
            <td>${usuario.email || 'Sin email'}</td>
            <td>
                <span class="badge ${usuario.role === 'admin' ? 'bg-primary' : 'bg-secondary'}">
                    ${usuario.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
            </td>
            <td>
                <span class="badge ${usuario.status === 'active' ? 'bg-success' : 'bg-danger'}">
                    ${usuario.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${formatDate(usuario.lastLogin) || 'Nunca'}</td>
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
    
    // Renderizar controles de paginación
    renderUsuariosPaginationControls();
}

// Renderizar controles de paginación
function renderUsuariosPaginationControls() {
    console.log('Renderizando controles de paginación');
    
    const paginationContainer = document.getElementById('usuarios-pagination');
    if (!paginationContainer) {
        console.warn('Contenedor de paginación no encontrado');
        return;
    }
    
    const totalPages = Math.ceil(filteredUsuarios.length / usuariosPerPage);
    
    // Limpiar paginación
    paginationContainer.innerHTML = '';
    
    // Si no hay suficientes páginas, ocultar paginación
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    console.log(`Total de páginas: ${totalPages}, Página actual: ${currentUsuariosPage}`);
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

// Inicializar filtros
function initUsuariosFiltros() {
    console.log('Inicializando filtros de usuarios');
    
    const searchInput = document.getElementById('buscar-usuario');
    const rolFilter = document.getElementById('filtro-rol');
    const estadoFilter = document.getElementById('filtro-estado');
    
    if (!searchInput || !rolFilter || !estadoFilter) {
        console.warn('No se encontraron algunos elementos de filtro');
        return;
    }
    
    // Función para aplicar filtros
    const applyFilters = () => {
        console.log('Aplicando filtros');
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        const rolValue = rolFilter.value;
        const estadoValue = estadoFilter.value;
        
        console.log(`Filtros: búsqueda="${searchTerm}", rol="${rolValue}", estado="${estadoValue}"`);
        
        // Obtener todos los usuarios
        db.collection('users').get().then(snapshot => {
            let usuarios = [];
            snapshot.forEach(doc => {
                const usuario = doc.data();
                usuario.id = doc.id;
                usuarios.push(usuario);
            });
            
            console.log(`Filtrando ${usuarios.length} usuarios`);
            
            // Aplicar filtros
            filteredUsuarios = usuarios.filter(usuario => {
                // Filtro de búsqueda
                const matchesSearch = searchTerm === '' || 
                    (usuario.name && usuario.name.toLowerCase().includes(searchTerm)) || 
                    (usuario.email && usuario.email.toLowerCase().includes(searchTerm));
                
                // Filtro de rol
                const matchesRol = rolValue === 'todos' || usuario.role === rolValue;
                
                // Filtro de estado
                const matchesEstado = estadoValue === 'todos' || usuario.status === estadoValue;
                
                return matchesSearch && matchesRol && matchesEstado;
            });
            
            console.log(`${filteredUsuarios.length} usuarios coinciden con los filtros`);
            
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
    
    console.log('Filtros de usuarios inicializados correctamente');
}

// Inicializar modal de usuario
function initUsuarioModal() {
    console.log('Inicializando modal de usuario');
    
    const modal = document.getElementById('usuario-modal');
    const form = document.getElementById('usuario-form');
    
    if (!modal || !form) {
        console.warn('No se encontraron los elementos del modal');
        return;
    }
    
    // Seleccionar botones
    const closeButtons = modal.querySelectorAll('.close-modal, #usuario-cancel-btn');
    const saveButton = document.getElementById('usuario-save-btn');
    
    // Cerrar modal
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Cerrando modal de usuario');
            modal.classList.remove('active');
            form.reset();
        });
    });
    
    // Guardar usuario
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            console.log('Botón de guardar usuario presionado');
            saveUsuario();
        });
    } else {
        console.warn('No se encontró el botón de guardar');
    }
    
    console.log('Modal de usuario inicializado correctamente');
}

// Abrir modal para crear o editar usuario
function openUserModal(userId = null) {
    console.log(`Abriendo modal de usuario${userId ? ' para editar' : ' para crear nuevo'}`);
    
    const modal = document.getElementById('usuario-modal');
    const form = document.getElementById('usuario-form');
    const modalTitle = document.getElementById('usuario-modal-title');
    const passwordInput = document.getElementById('usuario-password');
    const passwordLabel = document.querySelector('label[for="usuario-password"]');
    
    if (!modal || !form || !modalTitle || !passwordInput || !passwordLabel) {
        console.error('Faltan elementos del modal');
        return;
    }
    
    // Limpiar formulario
    form.reset();
    
    if (userId) {
        // Modo edición
        console.log(`Cargando datos del usuario con ID: ${userId}`);
        modalTitle.textContent = 'Editar Usuario';
        passwordLabel.textContent = 'Contraseña (dejar en blanco para mantener la actual)';
        passwordInput.required = false;
        
        // Cargar datos del usuario
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const usuario = doc.data();
                    console.log('Datos del usuario cargados correctamente', usuario);
                    
                    // Llenar formulario
                    document.getElementById('usuario-nombre').value = usuario.name || '';
                    document.getElementById('usuario-email').value = usuario.email || '';
                    document.getElementById('usuario-rol').value = usuario.role || 'usuario';
                    document.getElementById('usuario-estado').value = usuario.status || 'active';
                    
                    // Guardar ID del usuario en un data attribute
                    form.setAttribute('data-id', userId);
                } else {
                    console.error('Usuario no encontrado');
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
        console.log('Preparando formulario para nuevo usuario');
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
    console.log('Guardando usuario');
    
    const form = document.getElementById('usuario-form');
    const modal = document.getElementById('usuario-modal');
    
    if (!form || !modal) return;
    
    const userId = form.getAttribute('data-id');
    console.log(`Modo: ${userId ? 'Actualización' : 'Creación'}, ID: ${userId || 'Nuevo'}`);
    
    // Validar formulario
    if (!form.checkValidity()) {
        console.log('Formulario no válido, mostrando errores');
        form.reportValidity();
        return;
    }
    
    // Obtener valores del formulario
    const nombre = document.getElementById('usuario-nombre').value;
    const email = document.getElementById('usuario-email').value;
    const password = document.getElementById('usuario-password').value;
    const rol = document.getElementById('usuario-rol').value;
    const estado = document.getElementById('usuario-estado').value;
    
    console.log(`Datos: nombre="${nombre}", email="${email}", rol="${rol}", estado="${estado}"`);
    
    // Datos del usuario
    const userData = {
        name: nombre,
        email: email,
        role: rol,
        status: estado,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (userId) {
            // Actualizar usuario existente
            console.log(`Actualizando usuario existente: ${userId}`);
            
            // Si se proporciona una nueva contraseña, actualizarla
            if (password) {
                console.log('Se proporcionó nueva contraseña');
                // Implementar aquí la lógica para actualizar contraseña si es necesario
            }
            
            // Actualizar datos en Firestore
            await db.collection('users').doc(userId).update(userData);
            console.log('Usuario actualizado correctamente en Firestore');
            
            showAlert('Usuario actualizado con éxito', 'success');
        } else {
            // Crear nuevo usuario
            console.log('Creando nuevo usuario');
            
            try {
                // Verificar si el email ya existe
                const emailCheck = await auth.fetchSignInMethodsForEmail(email);
                
                if (emailCheck && emailCheck.length > 0) {
                    console.log('El email ya está en uso');
                    showAlert('El email ya está en uso', 'error');
                    return;
                }
            } catch (error) {
                console.error('Error al verificar email:', error);
            }
            
            // Crear usuario en Firebase Auth
            console.log('Creando usuario en Firebase Auth');
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const newUserId = userCredential.user.uid;
            console.log(`Usuario creado en Auth con ID: ${newUserId}`);
            
            // Añadir metadata
            userData.id = newUserId;
            userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            
            // Guardar datos en Firestore
            console.log('Guardando datos en Firestore');
            await db.collection('users').doc(newUserId).set(userData);
            console.log('Usuario guardado correctamente en Firestore');
            
            showAlert('Usuario creado con éxito', 'success');
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
    console.log(`Ver detalles del usuario: ${userId}`);
    // Redirigir a la edición por ahora
    editUsuario(userId);
}

// Editar usuario
function editUsuario(userId) {
    console.log(`Editar usuario: ${userId}`);
    openUserModal(userId);
}

// Eliminar usuario
function deleteUsuario(userId) {
    console.log(`Intentando eliminar usuario: ${userId}`);
    
    if (confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
        console.log('Confirmación aceptada, procediendo a eliminar');
        
        // Obtener datos del usuario antes de eliminar
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const usuario = doc.data();
                    console.log(`Eliminando usuario: ${usuario.email}`);
                    
                    // Eliminar usuario de Firestore
                    return db.collection('users').doc(userId).delete()
                        .then(() => {
                            console.log('Usuario eliminado de Firestore');
                            
                            showAlert('Usuario eliminado con éxito', 'success');
                            loadUsuarios();
                        });
                } else {
                    console.error('Usuario no encontrado para eliminar');
                    showAlert('Usuario no encontrado', 'error');
                }
            })
            .catch(error => {
                console.error('Error al eliminar usuario:', error);
                showAlert('Error al eliminar usuario', 'error');
            });
    } else {
        console.log('Eliminación cancelada por el usuario');
    }
}

// Función para formatear fechas
function formatDate(timestamp) {
    if (!timestamp) return null;
    
    try {
        // Si es un timestamp de Firestore
        if (timestamp.toDate) {
            timestamp = timestamp.toDate();
        }
        
        // Si es un objeto Date válido
        if (timestamp instanceof Date && !isNaN(timestamp)) {
            return timestamp.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } catch (error) {
        console.error('Error al formatear fecha:', error);
    }
    
    return null;
}

// Función para mostrar alertas
function showAlert(message, type = 'info') {
    console.log(`Mostrando alerta: "${message}" (${type})`);
    
    // Si existe una función global de alerta, usarla
    if (typeof showNotification === 'function') {
        showNotification(message, type);
        return;
    }
    
    // Si no, hacer una alerta básica
    alert(message);
}

// Exportar funciones al ámbito global
window.viewUsuario = viewUsuario;
window.editUsuario = editUsuario;
window.deleteUsuario = deleteUsuario;
window.openUserModal = openUserModal;