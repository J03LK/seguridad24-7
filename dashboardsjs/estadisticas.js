// Variables globales para la navegación
let sidebarCollapsed = false;
let currentTab = 'dashboard-tab';

// Inicializar navegación
function initNavigation() {
  // Establecer pestaña activa por defecto
  activateTab('dashboard-tab');
  
  // Event listeners para navegación
  setupEventListeners();
  
  // Cargar datos iniciales
  loadTabData('dashboard-tab');
}

// Configurar event listeners
function setupEventListeners() {
  // Navegación del sidebar
  document.querySelectorAll('.components li a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab') + '-tab';
      activateTab(tabId);
    });
  });
  
  // Toggle del sidebar
  document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);
  
  // Navegación en pestañas de configuración
  document.querySelectorAll('.config-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const configTab = btn.getAttribute('data-tab');
      activateConfigTab(configTab);
    });
  });
  
  // Cerrar sesión
  document.getElementById('logout-btn').addEventListener('click', logout);
}

// Activar una pestaña
function activateTab(tabId) {
  // Si es la misma pestaña, no hacer nada
  if (currentTab === tabId) return;
  
  // Actualizar variables
  const previousTab = currentTab;
  currentTab = tabId;
  
  // Desactivar todas las pestañas
  document.querySelectorAll('.content-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Activar la pestaña seleccionada
  document.getElementById(tabId).classList.add('active');
  
  // Actualizar navegación en el sidebar
  document.querySelectorAll('.components li').forEach(item => {
    item.classList.remove('active');
  });
  
  const linkSelector = `a[data-tab="${tabId.replace('-tab', '')}"]`;
  const activeLink = document.querySelector(linkSelector);
  if (activeLink) {
    activeLink.parentElement.classList.add('active');
  }
  
  // Cargar datos de la nueva pestaña
  loadTabData(tabId, previousTab);
}

// Activar una pestaña de configuración
function activateConfigTab(configTabId) {
  // Desactivar todas las pestañas
  document.querySelectorAll('.config-tab-pane').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Activar la pestaña seleccionada
  document.getElementById(configTabId + '-tab').classList.add('active');
  
  // Actualizar botones
  document.querySelectorAll('.config-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.querySelector(`.config-tab-btn[data-tab="${configTabId}"]`).classList.add('active');
}

// Alternar la visibilidad del sidebar
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('content');
  
  if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
    content.classList.add('expanded');
  } else {
    sidebar.classList.remove('collapsed');
    content.classList.remove('expanded');
  }
}

// Cargar datos específicos según la pestaña activa
function loadTabData(tabId, previousTabId = null) {
  // Si estamos cambiando de pestaña, mostrar indicador de carga
  if (previousTabId) {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-overlay';
    loadingIndicator.innerHTML = '<div class="spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    document.getElementById(tabId).appendChild(loadingIndicator);
    
    // Eliminar el indicador después de un tiempo
    setTimeout(() => {
      if (document.querySelector('.loading-overlay')) {
        document.querySelector('.loading-overlay').remove();
      }
    }, 1000);
  }
  
  // Cargar datos según la pestaña
  switch(tabId) {
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
      break;
  }
}

// Cargar estadísticas para el dashboard
function loadDashboardStats() {
  // Cargar contadores principales
  loadStats();
  
  // Cargar datos para gráfico de clientes
  firebase.firestore().collection('users')
    .where('role', '==', 'usuario')
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get()
    .then(snapshot => {
      // Obtener datos de los últimos 6 meses
      const now = new Date();
      const monthsData = Array(6).fill(0);
      const monthLabels = [];
      
      // Crear labels para los últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthLabels.unshift(month.toLocaleDateString('es-ES', { month: 'short' }));
      }
      
      // Contar clientes por mes
      snapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.createdAt) {
          const createdAt = userData.createdAt.toDate();
          const monthDiff = (now.getMonth() - createdAt.getMonth()) + 
                           (now.getFullYear() - createdAt.getFullYear()) * 12;
          
          if (monthDiff >= 0 && monthDiff < 6) {
            monthsData[5 - monthDiff]++;
          }
        }
      });
      
      // Actualizar gráfico
      if (charts['dashboard-clientes']) {
        charts['dashboard-clientes'].data.labels = monthLabels;
        charts['dashboard-clientes'].data.datasets[0].data = monthsData;
        charts['dashboard-clientes'].update();
      }
    })
    .catch(error => {
      console.error("Error al cargar estadísticas para el dashboard:", error);
    });
}

// Cargar actividad reciente para el dashboard
function loadRecentActivity() {
  const activityListElement = document.getElementById('activity-list');
  activityListElement.innerHTML = '<li class="loading">Cargando actividad reciente...</li>';
  
  // Combinar datos de reportes y pagos para mostrar actividad reciente
  Promise.all([
    firebase.firestore().collection('reportes')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get(),
    firebase.firestore().collection('pagos')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get()
  ])
  .then(([reportesSnapshot, pagosSnapshot]) => {
    // Crear array de actividades
    const activities = [];
    
    // Añadir reportes
    reportesSnapshot.forEach(doc => {
      const reportData = doc.data();
      activities.push({
        type: 'reporte',
        title: `Nuevo reporte de ${reportData.clientName || 'Cliente'}`,
        description: reportData.tipo || 'Reporte',
        timestamp: reportData.createdAt,
        icon: 'fa-exclamation-triangle',
        iconClass: 'warning'
      });
    });
    
    // Añadir pagos
    pagosSnapshot.forEach(doc => {
      const paymentData = doc.data();
      activities.push({
        type: 'pago',
        title: `Pago registrado de ${paymentData.clientName || 'Cliente'}`,
        description: `$${parseFloat(paymentData.monto).toFixed(2)} - ${paymentData.metodo || 'Efectivo'}`,
        timestamp: paymentData.createdAt,
        icon: 'fa-credit-card',
        iconClass: 'success'
      });
    });
    
    // Ordenar por fecha (más recientes primero)
    activities.sort((a, b) => {
      const dateA = a.timestamp ? a.timestamp.toDate() : new Date(0);
      const dateB = b.timestamp ? b.timestamp.toDate() : new Date(0);
      return dateB - dateA;
    });
    
    // Mostrar solo las 5 actividades más recientes
    activityListElement.innerHTML = '';
    const activitiesToShow = activities.slice(0, 5);
    
    if (activitiesToShow.length === 0) {
      activityListElement.innerHTML = '<li class="empty">No hay actividad reciente.</li>';
      return;
    }
    
    activitiesToShow.forEach(activity => {
      const li = document.createElement('li');
      
      // Formatear fecha
      let timeStr = 'Fecha desconocida';
      if (activity.timestamp) {
        const date = activity.timestamp.toDate();
        timeStr = getTimeAgo(date);
      }
      
      li.innerHTML = `
        <div class="activity-icon ${activity.iconClass}">
          <i class="fas ${activity.icon}"></i>
        </div>
        <div class="activity-content">
          <h4>${activity.title}</h4>
          <p>${activity.description}</p>
          <span class="activity-time">${timeStr}</span>
        </div>
      `;
      
      activityListElement.appendChild(li);
    });
  })
  .catch(error => {
    console.error("Error al cargar actividad reciente:", error);
    activityListElement.innerHTML = '<li class="error">Error al cargar actividad reciente.</li>';
  });
}

// Cargar tareas pendientes para el dashboard
function loadPendingTasks() {
  const taskListElement = document.getElementById('task-list');
  taskListElement.innerHTML = '<li class="loading">Cargando tareas pendientes...</li>';
  
  // Obtener reportes pendientes o en proceso
  firebase.firestore().collection('reportes')
    .where('estado', 'in', ['pendiente', 'en_proceso'])
    .orderBy('prioridad', 'desc')
    .limit(5)
    .get()
    .then(snapshot => {
      taskListElement.innerHTML = '';
      
      if (snapshot.empty) {
        taskListElement.innerHTML = '<li class="empty">No hay tareas pendientes.</li>';
        return;
      }
      
      snapshot.forEach(doc => {
        const reportData = doc.data();
        const li = document.createElement('li');
        
        // Determinar clase según prioridad
        let priorityClass = '';
        switch(reportData.prioridad) {
          case 'alta':
            priorityClass = 'high-priority';
            break;
          case 'media':
            priorityClass = 'medium-priority';
            break;
          case 'baja':
            priorityClass = 'low-priority';
            break;
        }
        
        // Formatear fecha
        let fechaStr = 'Fecha desconocida';
        if (reportData.createdAt) {
          const date = reportData.createdAt.toDate();
          fechaStr = getTimeAgo(date);
        }
        
        li.className = `task-item ${priorityClass}`;
        li.innerHTML = `
          <div class="task-check">
            <input type="checkbox" id="task-${doc.id}">
            <label for="task-${doc.id}"></label>
          </div>
          <div class="task-content">
            <h4>${reportData.tipo || 'Reporte'} - ${reportData.clientName || 'Cliente'}</h4>
            <p>${reportData.descripcion || 'Sin descripción'}</p>
            <span class="task-meta">
              <span class="task-priority">${reportData.prioridad || 'Media'}</span>
              <span class="task-time">${fechaStr}</span>
            </span>
          </div>
        `;
        
        // Event listener para marcar tarea como completada
        li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
          if (e.target.checked) {
            // Actualizar estado del reporte a resuelto
            firebase.firestore().collection('reportes').doc(doc.id).update({
              estado: 'resuelto',
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
              // Animar eliminación de la tarea
              li.classList.add('completed');
              setTimeout(() => {
                li.remove();
                
                // Si no quedan tareas, mostrar mensaje
                if (taskListElement.children.length === 0) {
                  taskListElement.innerHTML = '<li class="empty">No hay tareas pendientes.</li>';
                }
              }, 500);
            })
            .catch(error => {
              console.error("Error al actualizar reporte:", error);
              e.target.checked = false;
            });
          }
        });
        
        taskListElement.appendChild(li);
      });
    })
    .catch(error => {
      console.error("Error al cargar tareas pendientes:", error);
      taskListElement.innerHTML = '<li class="error">Error al cargar tareas pendientes.</li>';
    });
}

// Cargar perfil de usuario para la sección de configuración
function loadUserProfile() {
  // Obtener datos del usuario actual
  if (!currentUser) return;
  
  firebase.firestore().collection('users').doc(currentUser.uid).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        
        // Establecer datos del perfil
        document.getElementById('profile-name').textContent = userData.nombre || 'Usuario';
        document.getElementById('profile-role').textContent = userData.role === 'admin' ? 'Administrador' : 'Usuario';
        document.getElementById('profile-email').textContent = userData.email || '';
        
        // Establecer campos del formulario
        const nombreCompleto = userData.nombre || '';
        const nombreParts = nombreCompleto.split(' ');
        
        document.getElementById('profile-nombre').value = nombreParts[0] || '';
        document.getElementById('profile-apellido').value = nombreParts.slice(1).join(' ') || '';
        document.getElementById('profile-telefono').value = userData.telefono || '';
        document.getElementById('profile-email-edit').value = userData.email || '';
        
        // Imagen de perfil
        if (userData.imageUrl) {
          document.getElementById('profile-avatar-img').src = userData.imageUrl;
        }
      }
    })
    .catch(error => {
      console.error("Error al cargar perfil de usuario:", error);
    });
}

// Función auxiliar: Obtener tiempo transcurrido en formato legible
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 30) {
    return date.toLocaleDateString();
  } else if (diffDay >= 1) {
    return `hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
  } else if (diffHour >= 1) {
    return `hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  } else if (diffMin >= 1) {
    return `hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
  } else {
    return 'hace unos segundos';
  }
}

// Inicializar navegación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initNavigation);