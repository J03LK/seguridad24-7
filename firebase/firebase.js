// Variables globales para el manejo de sesión y usuarios
let currentUser = null;
let isAdmin = false;

// Observador de estado de autenticación
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    // Usuario logueado
    currentUser = user;
    
    // Verificar si el usuario es administrador
    firebase.firestore().collection('users')
      .doc(user.uid)
      .get()
      .then(doc => {
        if (doc.exists) {
          const userData = doc.data();
          isAdmin = userData.role === 'admin';
          
          // Actualizar UI según el rol
          document.getElementById('user-name').textContent = userData.nombre || user.email;
          document.getElementById('user-role').textContent = isAdmin ? 'Admin' : 'Usuario';
          
          // Mostrar u ocultar elementos según el rol
          const adminElements = document.querySelectorAll('.admin-only');
          adminElements.forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
          });
          
          // Cargar los datos iniciales
          loadDashboardData();
        }
      })
      .catch(error => {
        console.error("Error al obtener datos del usuario:", error);
      });
  } else {
    // Usuario no logueado, redirigir al login
    window.location.href = 'login.html';
  }
});

// Función para cargar datos iniciales del dashboard
function loadDashboardData() {
  // Cargar estadísticas generales
  loadStats();
  
  // Cargar los datos de la pestaña activa
  const activeTab = document.querySelector('.content-tab.active');
  if (activeTab) {
    loadTabData(activeTab.id);
  }
}

// Función para cargar los datos específicos de cada pestaña
function loadTabData(tabId) {
  switch (tabId) {
    case 'dashboard-tab':
      loadDashboardStats();
      loadRecentActivity();
      initMapPreview();
      loadPendingTasks();
      break;
    case 'usuarios-tab':
      loadUsers();
      break;
    case 'productos-tab':
      loadProducts();
      break;
    case 'ubicaciones-tab':
      initMap();
      loadLocations();
      break;
    case 'reportes-tab':
      loadReports();
      break;
    case 'pagos-tab':
      loadPayments();
      break;
    case 'estadisticas-tab':
      loadStatistics();
      break;
    case 'configuracion-tab':
      loadUserProfile();
      loadCompanySettings();
      break;
  }
}

// Función para cargar estadísticas generales
function loadStats() {
  // Contar clientes
  firebase.firestore().collection('users')
    .where('role', '==', 'usuario')
    .get()
    .then(snapshot => {
      document.getElementById('clientes-count').textContent = snapshot.size;
    });
  
  // Contar reportes
  firebase.firestore().collection('reportes')
    .get()
    .then(snapshot => {
      document.getElementById('reportes-count').textContent = snapshot.size;
    });
  
  // Sumar ingresos
  firebase.firestore().collection('pagos')
    .where('estado', '==', 'completado')
    .get()
    .then(snapshot => {
      let total = 0;
      snapshot.forEach(doc => {
        total += doc.data().monto;
      });
      document.getElementById('ingresos-count').textContent = '$' + total.toFixed(2);
    });
  
  // Contar alertas
  firebase.firestore().collection('reportes')
    .where('prioridad', '==', 'alta')
    .where('estado', '!=', 'resuelto')
    .get()
    .then(snapshot => {
      document.getElementById('alertas-count').textContent = snapshot.size;
    });
}

// Función para cerrar sesión
function logout() {
  firebase.auth().signOut()
    .then(() => {
      window.location.href = 'login.html';
    })
    .catch(error => {
      console.error("Error al cerrar sesión:", error);
    });
}

// Event listeners
document.getElementById('logout-btn').addEventListener('click', logout);