// settings.js - Module for system configuration
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not defined. Make sure to load Firebase scripts.');
        return;
    }

    // DOM Elements
    const settingsSidebar = document.querySelector('.settings-sidebar');
    const settingsPanes = document.querySelectorAll('.settings-pane');
    const settingsLinks = document.querySelectorAll('.settings-sidebar li');
    const generalForm = document.getElementById('general-settings-form');
    const notificationsForm = document.getElementById('notifications-settings-form');
    const securityForm = document.getElementById('security-settings-form');
    const appearanceForm = document.getElementById('appearance-settings-form');
    
    // References to Firebase
    const db = firebase.firestore();
    const auth = firebase.auth();
    const storage = firebase.storage();
    const settingsRef = db.collection('settings');

    // Initialize settings module
    initializeSettings();

    // Initialize settings
    function initializeSettings() {
        // Load current settings
        loadSettings();
        
        // Initialize event listeners
        initEventListeners();
        
        // Initialize backup functionality
        initBackupFunctionality();
    }

    // Initialize event listeners
    function initEventListeners() {
        // Settings sidebar navigation
        if (settingsLinks.length > 0) {
            settingsLinks.forEach(link => {
                link.addEventListener('click', function() {
                    const settingsId = this.getAttribute('data-settings');
                    
                    // Update active states
                    settingsLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Show corresponding pane
                    settingsPanes.forEach(pane => {
                        if (pane.id === `${settingsId}-settings`) {
                            pane.classList.add('active');
                        } else {
                            pane.classList.remove('active');
                        }
                    });
                });
            });
        }

        // General settings form
        if (generalForm) {
            generalForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveGeneralSettings();
            });
        }

        // Notifications settings form
        if (notificationsForm) {
            notificationsForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveNotificationSettings();
            });
        }

        // Security settings form
        if (securityForm) {
            securityForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveSecuritySettings();
            });
        }

        // Appearance settings form
        if (appearanceForm) {
            appearanceForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveAppearanceSettings();
            });
        }

        // Theme selector
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', function() {
                themeOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                const theme = this.getAttribute('data-theme');
                applyTheme(theme);
            });
        });
    }

    // Load settings from Firebase
    function loadSettings() {
        settingsRef.doc('general').get()
            .then(doc => {
                if (doc.exists) {
                    const settings = doc.data();
                    
                    // Apply general settings
                    if (document.getElementById('company-name')) {
                        document.getElementById('company-name').value = settings.companyName || 'Seguridad 24/7';
                    }
                    if (document.getElementById('admin-email')) {
                        document.getElementById('admin-email').value = settings.adminEmail || '';
                    }
                    if (document.getElementById('timezone')) {
                        document.getElementById('timezone').value = settings.timezone || 'UTC-5';
                    }
                    if (document.getElementById('language')) {
                        document.getElementById('language').value = settings.language || 'es';
                    }
                    if (document.getElementById('currency')) {
                        document.getElementById('currency').value = settings.currency || 'USD';
                    }
                }
            })
            .catch(error => {
                console.error('Error loading general settings:', error);
            });

        // Load notification settings
        settingsRef.doc('notifications').get()
            .then(doc => {
                if (doc.exists) {
                    const notifications = doc.data();
                    
                    // Apply notification settings
                    if (document.getElementById('email-notifications')) {
                        document.getElementById('email-notifications').checked = notifications.emailEnabled || false;
                    }
                    if (document.getElementById('sms-notifications')) {
                        document.getElementById('sms-notifications').checked = notifications.smsEnabled || false;
                    }
                    if (document.getElementById('alert-notifications')) {
                        document.getElementById('alert-notifications').checked = notifications.alertsEnabled || false;
                    }
                    if (document.getElementById('report-notifications')) {
                        document.getElementById('report-notifications').checked = notifications.reportsEnabled || false;
                    }
                    if (document.getElementById('payment-notifications')) {
                        document.getElementById('payment-notifications').checked = notifications.paymentsEnabled || false;
                    }
                }
            })
            .catch(error => {
                console.error('Error loading notification settings:', error);
            });

        // Load appearance settings
        settingsRef.doc('appearance').get()
            .then(doc => {
                if (doc.exists) {
                    const appearance = doc.data();
                    
                    // Apply appearance settings
                    if (appearance.theme) {
                        applyTheme(appearance.theme);
                        
                        // Update theme selector
                        const themeOptions = document.querySelectorAll('.theme-option');
                        themeOptions.forEach(option => {
                            if (option.getAttribute('data-theme') === appearance.theme) {
                                option.classList.add('active');
                            } else {
                                option.classList.remove('active');
                            }
                        });
                    }
                    
                    if (document.getElementById('sidebar-position')) {
                        document.getElementById('sidebar-position').value = appearance.sidebarPosition || 'left';
                    }
                    if (document.getElementById('font-size')) {
                        document.getElementById('font-size').value = appearance.fontSize || 'medium';
                    }
                }
            })
            .catch(error => {
                console.error('Error loading appearance settings:', error);
            });

        // Load security settings
        settingsRef.doc('security').get()
            .then(doc => {
                if (doc.exists) {
                    const security = doc.data();
                    
                    // Apply security settings
                    if (document.getElementById('two-factor-auth')) {
                        document.getElementById('two-factor-auth').checked = security.twoFactorEnabled || false;
                    }
                    if (document.getElementById('session-timeout')) {
                        document.getElementById('session-timeout').checked = security.sessionTimeoutEnabled || false;
                    }
                }
            })
            .catch(error => {
                console.error('Error loading security settings:', error);
            });
    }

    // Save general settings
    function saveGeneralSettings() {
        const companyName = document.getElementById('company-name').value;
        const adminEmail = document.getElementById('admin-email').value;
        const timezone = document.getElementById('timezone').value;
        const language = document.getElementById('language').value;
        const currency = document.getElementById('currency').value;

        const settings = {
            companyName,
            adminEmail,
            timezone,
            language,
            currency,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        settingsRef.doc('general').set(settings, { merge: true })
            .then(() => {
                showNotification('Configuración general guardada correctamente', 'success');
            })
            .catch(error => {
                console.error('Error saving general settings:', error);
                showNotification('Error al guardar la configuración general', 'error');
            });
    }

    // Save notification settings
    function saveNotificationSettings() {
        const emailEnabled = document.getElementById('email-notifications').checked;
        const smsEnabled = document.getElementById('sms-notifications').checked;
        const alertsEnabled = document.getElementById('alert-notifications').checked;
        const reportsEnabled = document.getElementById('report-notifications').checked;
        const paymentsEnabled = document.getElementById('payment-notifications').checked;

        const settings = {
            emailEnabled,
            smsEnabled,
            alertsEnabled,
            reportsEnabled,
            paymentsEnabled,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        settingsRef.doc('notifications').set(settings, { merge: true })
            .then(() => {
                showNotification('Configuración de notificaciones guardada correctamente', 'success');
            })
            .catch(error => {
                console.error('Error saving notification settings:', error);
                showNotification('Error al guardar la configuración de notificaciones', 'error');
            });
    }

    // Save security settings
    function saveSecuritySettings() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const twoFactorEnabled = document.getElementById('two-factor-auth').checked;
        const sessionTimeoutEnabled = document.getElementById('session-timeout').checked;

        // Validate passwords if changing
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                showNotification('Las contraseñas no coinciden', 'error');
                return;
            }

            if (!currentPassword) {
                showNotification('Por favor ingrese su contraseña actual', 'error');
                return;
            }

            // Change password
            const user = auth.currentUser;
            if (user) {
                // Re-authenticate user
                const credential = firebase.auth.EmailAuthProvider.credential(
                    user.email,
                    currentPassword
                );

                user.reauthenticateWithCredential(credential)
                    .then(() => {
                        // Update password
                        return user.updatePassword(newPassword);
                    })
                    .then(() => {
                        // Save other security settings
                        saveSecuritySettingsOnly(twoFactorEnabled, sessionTimeoutEnabled);
                        
                        // Clear password fields
                        document.getElementById('current-password').value = '';
                        document.getElementById('new-password').value = '';
                        document.getElementById('confirm-password').value = '';
                        
                        showNotification('Contraseña actualizada correctamente', 'success');
                    })
                    .catch(error => {
                        console.error('Error updating password:', error);
                        showNotification('Error al actualizar la contraseña: ' + error.message, 'error');
                    });
            }
        } else {
            // Save only security settings without password change
            saveSecuritySettingsOnly(twoFactorEnabled, sessionTimeoutEnabled);
        }
    }

    // Save security settings only
    function saveSecuritySettingsOnly(twoFactorEnabled, sessionTimeoutEnabled) {
        const settings = {
            twoFactorEnabled,
            sessionTimeoutEnabled,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        settingsRef.doc('security').set(settings, { merge: true })
            .then(() => {
                showNotification('Configuración de seguridad guardada correctamente', 'success');
            })
            .catch(error => {
                console.error('Error saving security settings:', error);
                showNotification('Error al guardar la configuración de seguridad', 'error');
            });
    }

    // Save appearance settings
    function saveAppearanceSettings() {
        const themeOption = document.querySelector('.theme-option.active');
        const theme = themeOption ? themeOption.getAttribute('data-theme') : 'light';
        const sidebarPosition = document.getElementById('sidebar-position').value;
        const fontSize = document.getElementById('font-size').value;

        const settings = {
            theme,
            sidebarPosition,
            fontSize,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        settingsRef.doc('appearance').set(settings, { merge: true })
            .then(() => {
                showNotification('Configuración de apariencia guardada correctamente', 'success');
                
                // Apply the settings immediately
                applyAppearanceSettings(settings);
            })
            .catch(error => {
                console.error('Error saving appearance settings:', error);
                showNotification('Error al guardar la configuración de apariencia', 'error');
            });
    }

    // Apply theme
    function applyTheme(theme) {
        const body = document.body;
        
        switch (theme) {
            case 'dark':
                body.classList.add('dark-mode');
                break;
            case 'light':
                body.classList.remove('dark-mode');
                break;
            case 'auto':
                // Check system preference
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    body.classList.add('dark-mode');
                } else {
                    body.classList.remove('dark-mode');
                }
                break;
        }
    }

    // Apply appearance settings
    function applyAppearanceSettings(settings) {
        // Apply theme
        if (settings.theme) {
            applyTheme(settings.theme);
        }

        // Apply sidebar position
        if (settings.sidebarPosition) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.remove('left', 'right');
                sidebar.classList.add(settings.sidebarPosition);
            }
        }

        // Apply font size
        if (settings.fontSize) {
            document.documentElement.style.fontSize = 
                settings.fontSize === 'small' ? '14px' :
                settings.fontSize === 'large' ? '18px' : '16px';
        }
    }

    // Initialize backup functionality
    function initBackupFunctionality() {
        const createBackupBtn = document.getElementById('create-backup');
        const restoreBackupBtn = document.getElementById('restore-backup');
        const restoreFileInput = document.getElementById('restore-backup-file');

        if (createBackupBtn) {
            createBackupBtn.addEventListener('click', createBackup);
        }

        if (restoreBackupBtn) {
            restoreBackupBtn.addEventListener('click', function() {
                if (restoreFileInput.files.length > 0) {
                    restoreBackup(restoreFileInput.files[0]);
                } else {
                    showNotification('Por favor seleccione un archivo de respaldo', 'error');
                }
            });
        }

        // Load backup history
        loadBackupHistory();
    }

    // Create backup
    async function createBackup() {
        try {
            showNotification('Creando respaldo...', 'info');

            // Get all collections data
            const collections = ['usuarios', 'productos', 'ubicaciones', 'reportes', 'pagos', 'facturas', 'settings'];
            const backupData = {};

            for (const collectionName of collections) {
                const snapshot = await db.collection(collectionName).get();
                backupData[collectionName] = [];
                
                snapshot.forEach(doc => {
                    backupData[collectionName].push({
                        id: doc.id,
                        data: doc.data()
                    });
                });
            }

            // Create backup file
            const backupJson = JSON.stringify(backupData, null, 2);
            const blob = new Blob([backupJson], { type: 'application/json' });
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup_${timestamp}.json`;

            // Save backup metadata to Firestore
            const backupMetadata = {
                filename,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                size: blob.size,
                collections: collections
            };

            await db.collection('backups').add(backupMetadata);

            // Download the file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            showNotification('Respaldo creado correctamente', 'success');
            loadBackupHistory();

        } catch (error) {
            console.error('Error creating backup:', error);
            showNotification('Error al crear el respaldo: ' + error.message, 'error');
        }
    }

    // Restore backup
    async function restoreBackup(file) {
        try {
            if (!confirm('¿Está seguro que desea restaurar este respaldo? Esto sobrescribirá todos los datos actuales.')) {
                return;
            }

            showNotification('Restaurando respaldo...', 'info');

            // Read file
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const backupData = JSON.parse(e.target.result);

                    // Restore each collection
                    for (const [collectionName, documents] of Object.entries(backupData)) {
                        const batch = db.batch();
                        
                        // Delete existing documents
                        const snapshot = await db.collection(collectionName).get();
                        snapshot.forEach(doc => {
                            batch.delete(doc.ref);
                        });

                        // Add backup documents
                        documents.forEach(doc => {
                            const docRef = db.collection(collectionName).doc(doc.id);
                            batch.set(docRef, doc.data);
                        });

                        await batch.commit();
                    }

                    showNotification('Respaldo restaurado correctamente', 'success');
                    
                    // Reload the page to reflect changes
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);

                } catch (error) {
                    console.error('Error parsing backup file:', error);
                    showNotification('Error al procesar el archivo de respaldo', 'error');
                }
            };

            reader.readAsText(file);

        } catch (error) {
            console.error('Error restoring backup:', error);
            showNotification('Error al restaurar el respaldo: ' + error.message, 'error');
        }
    }

    // Load backup history
    function loadBackupHistory() {
        const backupList = document.querySelector('.backup-list');
        if (!backupList) return;

        db.collection('backups')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get()
            .then(snapshot => {
                backupList.innerHTML = '';

                if (snapshot.empty) {
                    backupList.innerHTML = '<p class="no-backups">No hay respaldos disponibles</p>';
                    return;
                }

                snapshot.forEach(doc => {
                    const backup = doc.data();
                    const backupItem = createBackupItem(doc.id, backup);
                    backupList.appendChild(backupItem);
                });
            })
            .catch(error => {
                console.error('Error loading backup history:', error);
                backupList.innerHTML = '<p class="error">Error al cargar el historial de respaldos</p>';
            });
    }

    // Create backup item element
    function createBackupItem(id, backup) {
        const item = document.createElement('div');
        item.className = 'backup-item';
        
        const date = backup.timestamp ? new Date(backup.timestamp.seconds * 1000) : new Date();
        const formattedDate = date.toLocaleString();
        const formattedSize = formatFileSize(backup.size);

        item.innerHTML = `
            <div class="backup-info">
                <span class="backup-date">${formattedDate}</span>
                <span class="backup-size">${formattedSize}</span>
            </div>
            <div class="backup-actions">
                <button class="btn-icon" title="Descargar" data-action="download">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn-icon danger" title="Eliminar" data-action="delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        const downloadBtn = item.querySelector('[data-action="download"]');
        const deleteBtn = item.querySelector('[data-action="delete"]');

        downloadBtn.addEventListener('click', () => {
            // In a real implementation, you would download the actual backup file
            showNotification('Función de descarga no implementada en esta demo', 'info');
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm('¿Está seguro que desea eliminar este respaldo?')) {
                deleteBackup(id);
            }
        });

        return item;
    }

    // Delete backup
    function deleteBackup(id) {
        db.collection('backups').doc(id).delete()
            .then(() => {
                showNotification('Respaldo eliminado correctamente', 'success');
                loadBackupHistory();
            })
            .catch(error => {
                console.error('Error deleting backup:', error);
                showNotification('Error al eliminar el respaldo', 'error');
            });
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Get notification icon based on type
    function getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return 'fa-check-circle';
            case 'error':
                return 'fa-exclamation-circle';
            case 'warning':
                return 'fa-exclamation-triangle';
            case 'info':
            default:
                return 'fa-info-circle';
        }
    }

    // Listen for system theme changes
    if (window.matchMedia) {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeMediaQuery.addEventListener('change', e => {
            // Check if theme is set to 'auto'
            settingsRef.doc('appearance').get()
                .then(doc => {
                    if (doc.exists && doc.data().theme === 'auto') {
                        applyTheme('auto');
                    }
                });
        });
    }
});