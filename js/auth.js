// auth.js - Manejo de autenticación en el dashboard de cliente (versión mejorada)

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const userNameElement = document.getElementById('user-name');
    const userAvatarElement = document.getElementById('user-avatar');
    const welcomeMessageElement = document.getElementById('welcome-message');
    const logoutButton = document.getElementById('logout');
    
    // Verificar el estado de autenticación
    checkAuth();
    
    // Función para verificar la autenticación del usuario
    function checkAuth() {
        // Obtener datos del usuario desde localStorage
        const userData = localStorage.getItem('userData');
        
        if (!userData) {
            // No hay datos de usuario, redirigir a login
            redirectToLogin();
            return;
        }
        
        const userObj = JSON.parse(userData);
        
        // Verificar el estado de autenticación actual
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Usuario autenticado, verificar si es el mismo usuario y si es cliente
                if (user.uid === userObj.uid) {
                    // Verificar rol en Firebase
                    const isClient = await verifyClientRole(user.uid);
                    
                    if (isClient) {
                        // Todo está bien, actualizar UI con datos del cliente
                        updateUserUI(userObj);
                        logActivityEvent('login', 'Inicio de sesión exitoso');
                    } else {
                        // No es cliente, cerrar sesión y redirigir
                        console.log('El usuario no tiene rol de cliente. Redirigiendo al login...');
                        await auth.signOut();
                        localStorage.removeItem('userData');
                        redirectToLogin();
                    }
                } else {
                    // Usuario diferente, actualizar datos
                    const isClient = await verifyClientRole(user.uid);
                    
                    if (isClient) {
                        // Obtener datos actualizados del usuario
                        const userDoc = await db.collection('usuarios').doc(user.uid).get();
                        const userData = userDoc.data();
                        
                        const updatedUserData = {
                            uid: user.uid,
                            email: user.email,
                            displayName: userData.name || user.email.split('@')[0],
                            photoURL: userData.photoURL || null,
                            phone: userData.phone || '',
                            role: userData.role
                        };
                        
                        localStorage.setItem('userData', JSON.stringify(updatedUserData));
                        updateUserUI(updatedUserData);
                        logActivityEvent('login', 'Sesión restaurada');
                    } else {
                        // No es cliente, cerrar sesión y redirigir
                        console.log('El usuario actual no tiene rol de cliente. Redirigiendo al login...');
                        await auth.signOut();
                        localStorage.removeItem('userData');
                        redirectToLogin();
                    }
                }
            } else {
                // No autenticado, limpiar localStorage y redirigir
                console.log('No hay usuario autenticado. Redirigiendo al login...');
                localStorage.removeItem('userData');
                redirectToLogin();
            }
        });
    }
    
    // Verificar si el usuario es cliente
    async function verifyClientRole(userId) {
        try {
            const userDoc = await db.collection('usuarios').doc(userId).get();
            
            if (!userDoc.exists) {
                console.log('No se encontró el documento del usuario');
                return false;
            }
            
            const userData = userDoc.data();
            // El rol "user" representa a los clientes
            const isClient = userData.role === 'user';
            console.log('Rol del usuario:', userData.role, '- Es cliente:', isClient);
            return isClient;
        } catch (error) {
            console.error('Error verificando rol de cliente:', error);
            return false;
        }
    }
    
    // Actualizar la UI con los datos del usuario
    function updateUserUI(userData) {
        // Actualizar nombre del usuario
        if (userNameElement) {
            userNameElement.textContent = userData.displayName || 'Cliente';
        }
        
        // Actualizar avatar
        if (userAvatarElement && userData.photoURL) {
            userAvatarElement.src = userData.photoURL;
        }
        
        // Actualizar mensaje de bienvenida
        if (welcomeMessageElement) {
            const now = new Date();
            let greeting = 'Bienvenido';
            
            if (now.getHours() < 12) {
                greeting = 'Buenos días';
            } else if (now.getHours() < 18) {
                greeting = 'Buenas tardes';
            } else {
                greeting = 'Buenas noches';
            }
            
            welcomeMessageElement.textContent = `${greeting}, ${userData.displayName || 'Cliente'}`;
        }
    }
    
    // Configurar el botón de cerrar sesión
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                // Registrar evento de cierre de sesión
                await logActivityEvent('logout', 'Cierre de sesión');
                
                // Cerrar sesión en Firebase
                await auth.signOut();
                localStorage.removeItem('userData');
                redirectToLogin();
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                alert('Error al cerrar sesión. Intente nuevamente.');
            }
        });
    }
    
    // Registrar evento de actividad
    async function logActivityEvent(type, description) {
        try {
            const user = auth.currentUser;
            if (!user) return;
            
            // Obtener IP del usuario (versión simplificada)
            let ipAddress = 'Desconocida';
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                ipAddress = data.ip;
            } catch (error) {
                console.warn('No se pudo obtener la IP:', error);
            }
            
            // Datos del evento
            const activityData = {
                userId: user.uid,
                type,
                description,
                ipAddress,
                userAgent: navigator.userAgent,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Guardar en Firestore
            return await db.collection('activity_log').add(activityData);
        } catch (error) {
            console.error('Error al registrar actividad:', error);
        }
    }
    
    // Redirigir a la página de login
    function redirectToLogin() {
        window.location.href = 'login.html';
    }
    
    // Exponer funciones para uso en otros archivos
    window.logActivityEvent = logActivityEvent;
});