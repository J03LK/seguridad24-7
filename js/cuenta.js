// cuenta.js - Gestión de la cuenta del usuario

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const accountSidebar = document.querySelector('.account-sidebar');
    const accountPanes = document.querySelectorAll('.account-pane');
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    const notificationsForm = document.getElementById('notifications-form');
    const addressesList = document.getElementById('addresses-list');
    const addAddressBtn = document.getElementById('add-address-btn');
    const activityHistoryList = document.getElementById('activity-history-list');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const removeAvatarBtn = document.getElementById('remove-avatar-btn');
    const profileAvatarImg = document.getElementById('profile-avatar-img');
    
    // Variables de estado
    let editingAddressId = null;
    
    // Verificar autenticación y cargar datos
    auth.onAuthStateChanged(user => {
        if (user) {
            initAccountSystem(user.uid);
        }
    });
    
    // Inicializar sistema de cuenta
    function initAccountSystem(userId) {
        // Cargar datos del perfil
        loadUserProfile(userId);
        
        // Inicializar navegación entre secciones
        initAccountNavigation();
        
        // Inicializar formularios
        initForms(userId);
        
        // Cargar direcciones
        loadAddresses(userId);
        
        // Cargar historial de actividad
        loadActivityHistory(userId);
        
        // Inicializar gestión de avatar
        initAvatarManagement(userId);
    }
    
    // Inicializar navegación entre secciones
    function initAccountNavigation() {
        if (!accountSidebar) return;
        
        // Evento para cambiar entre secciones
        accountSidebar.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', function() {
                // Remover clase activa de todos los elementos
                accountSidebar.querySelectorAll('li').forEach(li => {
                    li.classList.remove('active');
                });
                
                // Agregar clase activa al elemento actual
                this.classList.add('active');
                
                // Mostrar sección correspondiente
                const accountSection = this.getAttribute('data-account');
                accountPanes.forEach(pane => {
                    pane.classList.remove('active');
                });
                document.getElementById(`${accountSection}-pane`).classList.add('active');
            });
        });
    }
    
    // Inicializar formularios
    function initForms(userId) {
        // Formulario de perfil
        if (profileForm) {
            profileForm.addEventListener('submit', function(e) {
                e.preventDefault();
                updateProfile(userId);
            });
        }
        
        // Formulario de contraseña
        if (passwordForm) {
            // Verificar fortaleza de contraseña
            const newPasswordInput = document.getElementById('new-password');
            const strengthBar = document.querySelector('.strength-bar');
            const strengthText = document.querySelector('.strength-text');
            
            if (newPasswordInput && strengthBar && strengthText) {
                newPasswordInput.addEventListener('input', function() {
                    const password = this.value;
                    const strength = getPasswordStrength(password);
                    
                    // Actualizar barra de fortaleza
                    strengthBar.className = 'strength-bar';
                    
                    if (strength >= 80) {
                        strengthBar.classList.add('very-strong');
                        strengthText.textContent = 'Fuerza: Muy Fuerte';
                    } else if (strength >= 60) {
                        strengthBar.classList.add('strong');
                        strengthText.textContent = 'Fuerza: Fuerte';
                    } else if (strength >= 40) {
                        strengthBar.classList.add('medium');
                        strengthText.textContent = 'Fuerza: Media';
                    } else {
                        strengthBar.classList.add('weak');
                        strengthText.textContent = 'Fuerza: Débil';
                    }
                });
            }
            
            // Enviar formulario
            passwordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                updatePassword(userId);
            });
        }
        
        // Formulario de notificaciones
        if (notificationsForm) {
            notificationsForm.addEventListener('submit', function(e) {
                e.preventDefault();
                updateNotificationPreferences(userId);
            });
        }
        
        // Botón para agregar dirección
        if (addAddressBtn) {
            addAddressBtn.addEventListener('click', function() {
                openAddressModal(userId);
            });
        }
    }
    
    // Inicializar gestión de avatar
    function initAvatarManagement(userId) {
        // Botón para cambiar avatar
        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', function() {
                // Crear input de archivo invisible
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                
                // Simular clic en el input
                fileInput.click();
                
                // Manejar cambio de archivo
                fileInput.addEventListener('change', function() {
                    if (this.files && this.files[0]) {
                        uploadAvatar(userId, this.files[0]);
                    }
                    
                    // Eliminar input
                    document.body.removeChild(fileInput);
                });
            });
        }
        
        // Botón para eliminar avatar
        if (removeAvatarBtn) {
            removeAvatarBtn.addEventListener('click', function() {
                removeAvatar(userId);
            });
        }
    }
    
    // Cargar datos del perfil
    async function loadUserProfile(userId) {
        try {
            // Obtener documento del usuario
            const userDoc = await db.collection('usuarios').doc(userId).get();
            
            if (!userDoc.exists) {
                console.error('No se encontró el documento del usuario');
                return;
            }
            
            const userData = userDoc.data();
            
            // Llenar formulario de perfil
            if (profileForm) {
                document.getElementById('profile-name').value = userData.name || '';
                document.getElementById('profile-email').value = userData.email || '';
                document.getElementById('profile-phone').value = userData.phone || '';
            }
            
            // Establecer avatar
            if (profileAvatarImg && userData.photoURL) {
                profileAvatarImg.src = userData.photoURL;
            }
            
            // Cargar preferencias de notificaciones
            if (notificationsForm) {
                document.getElementById('email-reports').checked = userData.notifications?.emailReports !== false;
                document.getElementById('email-payments').checked = userData.notifications?.emailPayments !== false;
                document.getElementById('email-invoices').checked = userData.notifications?.emailInvoices !== false;
                document.getElementById('browser-notifications').checked = userData.notifications?.browserNotifications !== false;
            }
            
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            showToast('Error', 'No se pudo cargar la información del perfil', 'error');
        }
    }
    
    // Actualizar perfil
    async function updateProfile(userId) {
        // Obtener valores del formulario
        const name = document.getElementById('profile-name').value.trim();
        const phone = document.getElementById('profile-phone').value.trim();
        
        // Validar datos
        if (!name) {
            showToast('Error', 'El nombre es obligatorio', 'error');
            return;
        }
        
        // Mostrar estado de carga
        const submitBtn = profileForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        try {
            // Actualizar en Firestore
            await db.collection('usuarios').doc(userId).update({
                name,
                phone,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Actualizar usuario actual en auth si cambia el nombre
            const currentUser = auth.currentUser;
            if (currentUser) {
                await currentUser.updateProfile({
                    displayName: name
                });
            }
            
            // Actualizar datos en localStorage
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            userData.displayName = name;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Actualizar nombre en la UI principal
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = name;
            }
            
            // Registrar actividad
            await logActivityEvent('update', 'Perfil actualizado');
            
            // Mostrar mensaje de éxito
            showToast('Éxito', 'Perfil actualizado correctamente', 'success');
            
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            showToast('Error', 'No se pudo actualizar el perfil: ' + error.message, 'error');
        } finally {
            // Restaurar botón
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Cambios';
            }
        }
    }
    
    // Actualizar contraseña
    async function updatePassword(userId) {
        // Obtener valores del formulario
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validar datos
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Error', 'Todos los campos son obligatorios', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showToast('Error', 'Las contraseñas nuevas no coinciden', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showToast('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        // Mostrar estado de carga
        const submitBtn = passwordForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando...';
        }
        
        try {
            // Obtener credenciales
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('No hay usuario autenticado');
            }
            
            const credential = firebase.auth.EmailAuthProvider.credential(
                currentUser.email,
                currentPassword
            );
            
            // Re-autenticar usuario
            await currentUser.reauthenticateWithCredential(credential);
            
            // Cambiar contraseña
            await currentUser.updatePassword(newPassword);
            
            // Registrar actividad
            await logActivityEvent('password', 'Contraseña actualizada');
            
            // Mostrar mensaje de éxito
            showToast('Éxito', 'Contraseña actualizada correctamente', 'success');
            
            // Limpiar formulario
            passwordForm.reset();
            
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            
            let errorMessage = 'No se pudo actualizar la contraseña';
            
            // Mensajes personalizados según el error
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'La contraseña actual es incorrecta';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'La nueva contraseña es demasiado débil';
            } else if (error.message) {
                errorMessage += ': ' + error.message;
            }
            
            showToast('Error', errorMessage, 'error');
        } finally {
            // Restaurar botón
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Cambiar Contraseña';
            }
        }
    }
    
    // Actualizar preferencias de notificaciones
    async function updateNotificationPreferences(userId) {
        // Obtener valores del formulario
        const emailReports = document.getElementById('email-reports').checked;
        const emailPayments = document.getElementById('email-payments').checked;
        const emailInvoices = document.getElementById('email-invoices').checked;
        const browserNotifications = document.getElementById('browser-notifications').checked;
        
        // Mostrar estado de carga
        const submitBtn = notificationsForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        try {
            // Objeto de preferencias
            const notifications = {
                emailReports,
                emailPayments,
                emailInvoices,
                browserNotifications,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Actualizar en Firestore
            await db.collection('usuarios').doc(userId).update({
                notifications,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Registrar actividad
            await logActivityEvent('update', 'Preferencias de notificaciones actualizadas');
            
            // Mostrar mensaje de éxito
            showToast('Éxito', 'Preferencias actualizadas correctamente', 'success');
            
        } catch (error) {
            console.error('Error al actualizar preferencias:', error);
            showToast('Error', 'No se pudieron actualizar las preferencias: ' + error.message, 'error');
        } finally {
            // Restaurar botón
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Preferencias';
            }
        }
    }
    
    // Cargar direcciones
    async function loadAddresses(userId) {
        if (!addressesList) return;
        
        try {
            // Mostrar estado de carga
            addressesList.innerHTML = '<div class="loading-message">Cargando direcciones...</div>';
            
            // Consultar direcciones del usuario
            const snapshot = await db.collection('direcciones')
                .where('userId', '==', userId)
                .get();
            
            // Manejar caso de no resultados
            if (snapshot.empty) {
                addressesList.innerHTML = '<div class="empty-message">No hay direcciones registradas</div>';
                return;
            }
            
            // Preparar direcciones
            const addresses = [];
            snapshot.forEach(doc => {
                addresses.push({
                    id: doc.id,
                    data: doc.data()
                });
            });
            
            // Ordenar por predeterminada primero
            addresses.sort((a, b) => {
                if (a.data.isDefault && !b.data.isDefault) return -1;
                if (!a.data.isDefault && b.data.isDefault) return 1;
                return 0;
            });
            
            // Limpiar contenedor
            addressesList.innerHTML = '';
            
            // Crear tarjeta para cada dirección
            addresses.forEach(address => {
                createAddressCard(userId, address.id, address.data);
            });
            
        } catch (error) {
            console.error('Error al cargar direcciones:', error);
            addressesList.innerHTML = '<div class="error-message">Error al cargar direcciones: ' + error.message + '</div>';
        }
    }
    
    // Crear tarjeta de dirección
    function createAddressCard(userId, addressId, addressData) {
        const card = document.createElement('div');
        card.className = 'address-card';
        
        if (addressData.isDefault) {
            card.classList.add('default');
        }
        
        // Crear HTML de la tarjeta
        card.innerHTML = `
            ${addressData.isDefault ? '<div class="default-badge">Predeterminada</div>' : ''}
            <h3 class="address-title">${addressData.name || 'Dirección sin nombre'}</h3>
            <div class="address-content">
                ${addressData.address || ''}
                ${addressData.city ? `<br>${addressData.city}` : ''}
                ${addressData.postalCode ? ` ${addressData.postalCode}` : ''}
            </div>
            ${addressData.phone ? `
            <div class="address-phone">
                <i class="fas fa-phone"></i> ${addressData.phone}
            </div>
            ` : ''}
            <div class="address-actions">
                <button class="edit-address" data-id="${addressId}">Editar</button>
                <button class="delete address delete" data-id="${addressId}">Eliminar</button>
            </div>
        `;
        
        // Agregar eventos a los botones
        const editBtn = card.querySelector('.edit-address');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                openAddressModal(userId, addressId, addressData);
            });
        }
        
        const deleteBtn = card.querySelector('.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (confirm('¿Está seguro de que desea eliminar esta dirección?')) {
                    deleteAddress(userId, addressId);
                }
            });
        }
        
        // Agregar tarjeta al contenedor
        addressesList.appendChild(card);
    }
    
    // Abrir modal de dirección
    function openAddressModal(userId, addressId = null, addressData = null) {
        // Crear modal dinámicamente
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'address-modal';
        
        // Crear contenido del modal
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${addressId ? 'Editar Dirección' : 'Nueva Dirección'}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="address-form-modal">
                        <div class="form-group">
                            <label for="address-name-modal">Nombre de la dirección</label>
                            <input type="text" id="address-name-modal" placeholder="Ej: Casa, Oficina, etc." required>
                        </div>
                        
                        <div class="form-group">
                            <label for="address-line-modal">Dirección</label>
                            <input type="text" id="address-line-modal" placeholder="Calle, número, etc." required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group half">
                                <label for="address-city-modal">Ciudad</label>
                                <input type="text" id="address-city-modal" required>
                            </div>
                            <div class="form-group half">
                                <label for="address-postal-modal">Código Postal</label>
                                <input type="text" id="address-postal-modal">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="address-phone-modal">Teléfono de contacto</label>
                            <input type="tel" id="address-phone-modal">
                        </div>
                        
                        <div class="switch-group">
                            <label for="address-default-modal">Dirección predeterminada</label>
                            <label class="switch">
                                <input type="checkbox" id="address-default-modal">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary cancel-modal-btn">Cancelar</button>
                            <button type="submit" class="btn-primary" id="save-address-modal-btn">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Agregar modal al DOM
        document.body.appendChild(modal);
        
        // Si es edición, rellenar con datos existentes
        if (addressId && addressData) {
            editingAddressId = addressId;
            
            document.getElementById('address-name-modal').value = addressData.name || '';
            document.getElementById('address-line-modal').value = addressData.address || '';
            document.getElementById('address-city-modal').value = addressData.city || '';
            document.getElementById('address-postal-modal').value = addressData.postalCode || '';
            document.getElementById('address-phone-modal').value = addressData.phone || '';
            document.getElementById('address-default-modal').checked = addressData.isDefault || false;
        } else {
            editingAddressId = null;
        }
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Eventos de botones
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.cancel-modal-btn');
        const addressForm = modal.querySelector('#address-form-modal');
        
        // Función para cerrar modal
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };
        
        // Asignar eventos
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // Evento de envío de formulario
        addressForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveAddress(userId, closeModal);
        });
        
        // Cerrar al hacer clic fuera del contenido
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    
    // Guardar dirección
    async function saveAddress(userId, closeModalCallback) {
        // Obtener valores del formulario
        const name = document.getElementById('address-name-modal').value.trim();
        const address = document.getElementById('address-line-modal').value.trim();
        const city = document.getElementById('address-city-modal').value.trim();
        const postalCode = document.getElementById('address-postal-modal').value.trim();
        const phone = document.getElementById('address-phone-modal').value.trim();
        const isDefault = document.getElementById('address-default-modal').checked;
        
        // Validar datos
        if (!name || !address || !city) {
            showToast('Error', 'Los campos Nombre, Dirección y Ciudad son obligatorios', 'error');
            return;
        }
        
        // Mostrar estado de carga
        const saveBtn = document.getElementById('save-address-modal-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        try {
            // Si la dirección será predeterminada, actualizar las demás
            if (isDefault) {
                // Buscar todas las direcciones predeterminadas del usuario
                const defaultAddressesSnapshot = await db.collection('direcciones')
                    .where('userId', '==', userId)
                    .where('isDefault', '==', true)
                    .get();
                
                // Desmarcar como predeterminadas
                const batch = db.batch();
                defaultAddressesSnapshot.forEach(doc => {
                    batch.update(doc.ref, { isDefault: false });
                });
                
                // Ejecutar batch
                await batch.commit();
            }
            
            // Datos de la dirección
            const addressData = {
                userId,
                name,
                address,
                city,
                postalCode,
                phone,
                isDefault,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Guardar en Firestore
            if (editingAddressId) {
                // Actualizar dirección existente
                await db.collection('direcciones').doc(editingAddressId).update(addressData);
                showToast('Éxito', 'Dirección actualizada correctamente', 'success');
            } else {
                // Crear nueva dirección
                addressData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('direcciones').add(addressData);
                showToast('Éxito', 'Dirección agregada correctamente', 'success');
            }
            
            // Registrar actividad
            await logActivityEvent('update', 'Dirección ' + (editingAddressId ? 'actualizada' : 'agregada'));
            
            // Cerrar modal
            if (closeModalCallback) closeModalCallback();
            
            // Recargar direcciones
            loadAddresses(userId);
            
        } catch (error) {
            console.error('Error al guardar dirección:', error);
            showToast('Error', 'No se pudo guardar la dirección: ' + error.message, 'error');
        } finally {
            // Restaurar botón
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Guardar';
            }
        }
    }
    
    // Eliminar dirección
    async function deleteAddress(userId, addressId) {
        try {
            // Eliminar de Firestore
            await db.collection('direcciones').doc(addressId).delete();
            
            // Registrar actividad
            await logActivityEvent('update', 'Dirección eliminada');
            
            // Mostrar mensaje de éxito
            showToast('Éxito', 'Dirección eliminada correctamente', 'success');
            
            // Recargar direcciones
            loadAddresses(userId);
            
        } catch (error) {
            console.error('Error al eliminar dirección:', error);
            showToast('Error', 'No se pudo eliminar la dirección: ' + error.message, 'error');
        }
    }
    
    // Cargar historial de actividad
    async function loadActivityHistory(userId) {
        if (!activityHistoryList) return;
        
        try {
            // Mostrar estado de carga
            activityHistoryList.innerHTML = '<div class="loading-message">Cargando historial...</div>';
            
            // Consultar historial
            const snapshot = await db.collection('activity_log')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(20)
                .get();
            
            // Manejar caso de no resultados
            if (snapshot.empty) {
                activityHistoryList.innerHTML = '<div class="empty-message">No hay actividad registrada</div>';
                return;
            }
            
            // Limpiar contenedor
            activityHistoryList.innerHTML = '';
            
            // Crear elemento para cada actividad
            snapshot.forEach(doc => {
                createActivityItem(doc.data());
            });
            
        } catch (error) {
            console.error('Error al cargar historial de actividad:', error);
            activityHistoryList.innerHTML = '<div class="error-message">Error al cargar historial: ' + error.message + '</div>';
        }
    }
    
    // Crear elemento de actividad
    function createActivityItem(activityData) {
        const item = document.createElement('div');
        item.className = 'activity-item';
        
        // Determinar icono según tipo
        let iconClass = 'update';
        if (activityData.type === 'login') {
            iconClass = 'login';
        } else if (activityData.type === 'logout') {
            iconClass = 'logout';
        } else if (activityData.type === 'password') {
            iconClass = 'password';
        }
        
        // Formatear fecha
        const activityDate = activityData.timestamp ? 
                           formatFirestoreDate(activityData.timestamp) : 'N/A';
        
        // Crear HTML del elemento
        item.innerHTML = `
            <div class="activity-icon ${iconClass}">
                <i class="fas ${getActivityIcon(activityData.type)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-message">${activityData.description || 'Actividad registrada'}</div>
                <div class="activity-details">
                    <span class="activity-date">${activityDate}</span>
                    ${activityData.ipAddress ? `
                    <span class="activity-ip">
                        <i class="fas fa-globe"></i> ${activityData.ipAddress}
                    </span>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Agregar al contenedor
        activityHistoryList.appendChild(item);
    }
    
    // Subir avatar
    async function uploadAvatar(userId, imageFile) {
        try {
            // Mostrar estado de carga
            if (profileAvatarImg) {
                profileAvatarImg.style.opacity = '0.5';
            }
            
            // Crear referencia en Storage
            const storageRef = storage.ref();
            const avatarRef = storageRef.child(`avatars/${userId}/profile.jpg`);
            
            // Subir imagen
            await avatarRef.put(imageFile);
            
            // Obtener URL
            const photoURL = await avatarRef.getDownloadURL();
            
            // Actualizar en Firestore
            await db.collection('usuarios').doc(userId).update({
                photoURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Actualizar en Auth
            const currentUser = auth.currentUser;
            if (currentUser) {
                await currentUser.updateProfile({
                    photoURL
                });
            }
            
            // Actualizar en localStorage
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            userData.photoURL = photoURL;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Actualizar avatar en la UI principal
            const userAvatarElement = document.getElementById('user-avatar');
            if (userAvatarElement) {
                userAvatarElement.src = photoURL;
            }
            
            // Actualizar avatar en el perfil
            if (profileAvatarImg) {
                profileAvatarImg.src = photoURL;
                profileAvatarImg.style.opacity = '1';
            }
            
            // Registrar actividad
            await logActivityEvent('update', 'Foto de perfil actualizada');
            
            // Mostrar mensaje de éxito
            showToast('Éxito', 'Foto de perfil actualizada correctamente', 'success');
            
        } catch (error) {
            console.error('Error al subir avatar:', error);
            showToast('Error', 'No se pudo actualizar la foto de perfil: ' + error.message, 'error');
            
            // Restaurar opacidad
            if (profileAvatarImg) {
                profileAvatarImg.style.opacity = '1';
            }
        }
    }
    
    // Eliminar avatar
    async function removeAvatar(userId) {
        try {
            // Mostrar estado de carga
            if (profileAvatarImg) {
                profileAvatarImg.style.opacity = '0.5';
            }
            
            // Eliminar de Storage
            try {
                const storageRef = storage.ref();
                const avatarRef = storageRef.child(`avatars/${userId}/profile.jpg`);
                await avatarRef.delete();
            } catch (storageError) {
                // Ignorar error si el archivo no existe
                console.log('Error al eliminar avatar de Storage (puede que no exista):', storageError);
            }
            
            // Actualizar en Firestore
            await db.collection('usuarios').doc(userId).update({
                photoURL: null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Actualizar en Auth
            const currentUser = auth.currentUser;
            if (currentUser) {
                await currentUser.updateProfile({
                    photoURL: null
                });
            }
            
            // Actualizar en localStorage
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            userData.photoURL = null;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Actualizar avatar en la UI principal
            const userAvatarElement = document.getElementById('user-avatar');
            if (userAvatarElement) {
                userAvatarElement.src = 'assets/avatar-placeholder.png';
            }
            
            // Actualizar avatar en el perfil
            if (profileAvatarImg) {
                profileAvatarImg.src = 'assets/avatar-placeholder.png';
                profileAvatarImg.style.opacity = '1';
            }
            
            // Registrar actividad
            await logActivityEvent('update', 'Foto de perfil eliminada');
            
            // Mostrar mensaje de éxito
            showToast('Éxito', 'Foto de perfil eliminada correctamente', 'success');
            
        } catch (error) {
            console.error('Error al eliminar avatar:', error);
            showToast('Error', 'No se pudo eliminar la foto de perfil: ' + error.message, 'error');
            
            // Restaurar opacidad
            if (profileAvatarImg) {
                profileAvatarImg.style.opacity = '1';
            }
        }
    }
    
    // Obtener icono según tipo de actividad
    function getActivityIcon(type) {
        switch (type) {
            case 'login': return 'fa-sign-in-alt';
            case 'logout': return 'fa-sign-out-alt';
            case 'password': return 'fa-key';
            case 'update': return 'fa-edit';
            default: return 'fa-history';
        }
    }
    
    // Calcular fortaleza de contraseña
    function getPasswordStrength(password) {
        // Puntaje base
        let score = 0;
        
        // Sin contraseña = sin puntaje
        if (!password) return score;
        
        // Longitud
        if (password.length >= 8) score += 20;
        if (password.length >= 12) score += 10;
        
        // Complejidad
        if (/[a-z]/.test(password)) score += 10; // Minúsculas
        if (/[A-Z]/.test(password)) score += 10; // Mayúsculas
        if (/[0-9]/.test(password)) score += 10; // Números
        if (/[^a-zA-Z0-9]/.test(password)) score += 20; // Caracteres especiales
        
        // Variedad
        const uniqueChars = new Set(password).size;
        score += Math.min(20, uniqueChars * 2);
        
        // Evitar repeticiones
        for (let i = 0; i < password.length - 2; i++) {
            if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
                score -= 10;
                break;
            }
        }
        
        // Limitar score entre 0 y 100
        return Math.max(0, Math.min(100, score));
    }
});