// dashboard-auth.js - Manejo de autenticación en el dashboard administrativo (versión mejorada)
document.addEventListener('DOMContentLoaded', function() {
    // Configuración de Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyD_C3sJCghWpV1DHn4Qyxsa-exdcEJGst0",
        authDomain: "seguridad-24-7.firebaseapp.com",
        projectId: "seguridad-24-7",
        storageBucket: "seguridad-24-7.firebasestorage.app",
        messagingSenderId: "979899411271",
        appId: "1:979899411271:web:4d8db498a9388054a7fa62",
        measurementId: "G-XQG0KDMMX4"
    };
  
    // Inicializar Firebase si no está inicializado
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
  
    const auth = firebase.auth();
    const db = firebase.firestore();
  
    // Verificar si el usuario está autenticado
    checkAuth();
  
    function checkAuth() {
        // Obtener datos del administrador desde localStorage
        const adminData = localStorage.getItem('adminUser');
        
        if (!adminData) {
            // No hay datos de administrador, redirigir a login
            console.log('No hay datos de administrador en localStorage. Redirigiendo a login...');
            redirectToLogin();
            return;
        }
  
        const adminUser = JSON.parse(adminData);
        
        // Verificar el estado de autenticación actual
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Usuario autenticado, verificar si es el mismo usuario y si es admin
                if (user.uid === adminUser.uid) {
                    // Verificar nuevamente el rol en Firebase
                    const isAdmin = await verifyAdminRole(user.uid);
                    
                    if (isAdmin) {
                        // Todo está bien, actualizar UI con datos del administrador
                        updateAdminUI(adminUser);
                        setupLogoutButton();
                    } else {
                        // No es admin, podría ser usuario regular, redirigir al dashboard adecuado
                        console.log('El usuario no tiene rol de administrador. Verificando...');
                        const isUser = await verifyUserRole(user.uid);
                        
                        if (isUser) {
                            // Es un usuario regular, redirigir al dashboard de usuario
                            console.log('El usuario tiene rol de cliente. Redirigiendo a dashboard de usuario...');
                            redirectToUserDashboard();
                        } else {
                            // Ni admin ni usuario, cerrar sesión y redirigir
                            console.log('El usuario no tiene un rol válido. Redirigiendo a login...');
                            await auth.signOut();
                            localStorage.removeItem('adminUser');
                            redirectToLogin();
                        }
                    }
                } else {
                    // Usuario diferente, actualizar datos
                    const isAdmin = await verifyAdminRole(user.uid);
                    
                    if (isAdmin) {
                        // Obtener datos actualizados del usuario
                        const userDoc = await db.collection('usuarios').doc(user.uid).get();
                        const userData = userDoc.data();
                        
                        const updatedAdminUser = {
                            uid: user.uid,
                            email: user.email,
                            displayName: userData.name || user.email.split('@')[0],
                            photoURL: userData.photoURL || null,
                            role: userData.role
                        };
                        
                        localStorage.setItem('adminUser', JSON.stringify(updatedAdminUser));
                        updateAdminUI(updatedAdminUser);
                        setupLogoutButton();
                    } else {
                        // No es admin, podría ser usuario regular, redirigir al dashboard adecuado
                        const isUser = await verifyUserRole(user.uid);
                        
                        if (isUser) {
                            // Es un usuario regular, redirigir al dashboard de usuario
                            redirectToUserDashboard();
                        } else {
                            // Ni admin ni usuario, cerrar sesión y redirigir
                            await auth.signOut();
                            localStorage.removeItem('adminUser');
                            redirectToLogin();
                        }
                    }
                }
            } else {
                // No autenticado, limpiar localStorage y redirigir
                localStorage.removeItem('adminUser');
                redirectToLogin();
            }
        });
    }
  
    // Verificar si el usuario es administrador
    async function verifyAdminRole(userId) {
        try {
            const userDoc = await db.collection('usuarios').doc(userId).get();
            
            if (!userDoc.exists) {
                console.log('No se encontró el documento del usuario');
                return false;
            }
            
            const userData = userDoc.data();
            const isAdmin = userData.role === 'admin';
            console.log('Rol del usuario:', userData.role, '- Es admin:', isAdmin);
            return isAdmin;
        } catch (error) {
            console.error('Error verificando rol de admin:', error);
            return false;
        }
    }
    
    // Verificar si el usuario es un cliente/usuario normal
    async function verifyUserRole(userId) {
        try {
            const userDoc = await db.collection('usuarios').doc(userId).get();
            
            if (!userDoc.exists) {
                return false;
            }
            
            const userData = userDoc.data();
            const isUser = userData.role === 'user';
            console.log('Rol del usuario:', userData.role, '- Es usuario normal:', isUser);
            return isUser;
        } catch (error) {
            console.error('Error verificando rol de usuario:', error);
            return false;
        }
    }
  
    // Actualizar la UI con los datos del administrador
    function updateAdminUI(adminUser) {
        // Actualizar nombre del usuario
        const userNameElement = document.querySelector('.user-info h4');
        if (userNameElement) {
            userNameElement.textContent = adminUser.displayName || 'Administrador';
        }
  
        // Actualizar rol
        const userRoleElement = document.querySelector('.user-info p');
        if (userRoleElement) {
            userRoleElement.textContent = 'Administrador';
        }
  
        // Actualizar imagen de perfil si existe
        const userImageElement = document.querySelector('.user-profile img');
        if (userImageElement && adminUser.photoURL) {
            userImageElement.src = adminUser.photoURL;
        }
  
        // Actualizar el encabezado del dashboard
        const dashboardHeader = document.querySelector('#dashboard-section .section-header p');
        if (dashboardHeader) {
            dashboardHeader.textContent = `Bienvenido ${adminUser.displayName || 'Administrador'} al sistema de administración de Seguridad 24/7`;
        }
    }
  
    // Configurar el botón de cerrar sesión
    function setupLogoutButton() {
        const logoutButton = document.getElementById('logout');
        
        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    await auth.signOut();
                    localStorage.removeItem('adminUser');
                    redirectToLogin();
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    alert('Error al cerrar sesión. Por favor, intenta nuevamente.');
                }
            });
        }
    }
  
    // Redirigir a la página de login
    function redirectToLogin() {
        window.location.href = 'login.html';
    }
    
    // Redirigir al dashboard de usuario
    function redirectToUserDashboard() {
        window.location.href = 'dashboardUsuario.html';
    }
  
    // Función para crear un usuario administrador (solo para uso inicial)
    window.createAdminUser = async function(email, password, name) {
        try {
            // Crear usuario en Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Crear documento en Firestore con rol de admin
            await db.collection('usuarios').doc(user.uid).set({
                email: email,
                name: name || 'Administrador',
                role: 'admin',
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Usuario administrador creado exitosamente');
            alert('Usuario administrador creado exitosamente');
            
        } catch (error) {
            console.error('Error creando usuario administrador:', error);
            alert('Error creando usuario administrador: ' + error.message);
        }
    };
  
    // Exponer función para depuración
    window.checkCurrentUser = async function() {
        const user = auth.currentUser;
        if (user) {
            console.log('Usuario actual:', user.email);
            
            try {
                const userDoc = await db.collection('usuarios').doc(user.uid).get();
                if (userDoc.exists) {
                    console.log('Datos del usuario:', userDoc.data());
                } else {
                    console.log('No se encontraron datos del usuario en Firestore');
                }
            } catch (error) {
                console.error('Error obteniendo datos del usuario:', error);
            }
        } else {
            console.log('No hay usuario autenticado');
        }
    };
  });