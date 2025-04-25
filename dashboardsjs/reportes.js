// Variables globales para la gestión de reportes
let reportsList = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 0;
let editingReportId = null;

// Cargar reportes desde Firestore
function loadReports(page = 1) {
  currentPage = page;
  
  // Mostrar indicador de carga
  document.getElementById('reportes-table-body').innerHTML = '<tr><td colspan="8" class="text-center">Cargando...</td></tr>';
  
  // Obtener filtros
  const estadoFilter = document.getElementById('filtro-estado-reporte').value;
  const prioridadFilter = document.getElementById('filtro-prioridad').value;
  const searchText = document.getElementById('buscar-reporte').value.toLowerCase();
  
  // Referencia a la colección de reportes
  let reportsRef = firebase.firestore().collection('reportes');
  
  // Aplicar filtros de estado si no es "todos"
  if (estadoFilter !== 'todos') {
    reportsRef = reportsRef.where('estado', '==', estadoFilter);
  }
  
  // Aplicar filtros de prioridad si no es "todos"
  if (prioridadFilter !== 'todos') {
    reportsRef = reportsRef.where('prioridad', '==', prioridadFilter);
  }
  
  // Ordenar por fecha (más recientes primero)
  reportsRef = reportsRef.orderBy('createdAt', 'desc');
  
  // Obtener reportes
  reportsRef.get()
    .then(snapshot => {
      reportsList = [];
      
      snapshot.forEach(doc => {
        const reportData = doc.data();
        
        // Filtrar por texto de búsqueda si existe
        if (searchText) {
          const matchesSearch = 
            (reportData.clientName && reportData.clientName.toLowerCase().includes(searchText)) ||
            (reportData.descripcion && reportData.descripcion.toLowerCase().includes(searchText)) ||
            (reportData.tipo && reportData.tipo.toLowerCase().includes(searchText));
          
          if (!matchesSearch) return;
        }
        
        reportsList.push({
          id: doc.id,
          ...reportData
        });
      });
      
      // Calcular paginación
      totalPages = Math.ceil(reportsList.length / itemsPerPage);
      
      // Mostrar reportes en la tabla
      displayReports();
      
      // Actualizar paginación
      updatePagination();
    })
    .catch(error => {
      console.error("Error al cargar reportes:", error);
      document.getElementById('reportes-table-body').innerHTML = 
        '<tr><td colspan="8" class="text-center">Error al cargar reportes. Intente nuevamente.</td></tr>';
    });
}

// Mostrar reportes en la tabla
function displayReports() {
  const tableBody = document.getElementById('reportes-table-body');
  tableBody.innerHTML = '';
  
  // Calcular índices para la paginación
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, reportsList.length);
  
  if (reportsList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron reportes.</td></tr>';
    return;
  }
  
  // Mostrar reportes para la página actual
  for (let i = startIdx; i < endIdx; i++) {
    const report = reportsList[i];
    const row = document.createElement('tr');
    
    // Formatear fecha
    let fechaReporte = 'Fecha desconocida';
    if (report.createdAt) {
      const date = report.createdAt.toDate ? report.createdAt.toDate() : new Date(report.createdAt);
      fechaReporte = date.toLocaleDateString();
    }
    
    // Clases CSS para estado y prioridad
    const estadoClass = getStatusClass(report.estado);
    const prioridadClass = getPriorityClass(report.prioridad);
    
    // Truncar descripción larga
    const descripcionCorta = report.descripcion 
      ? (report.descripcion.length > 50 ? report.descripcion.substring(0, 50) + '...' : report.descripcion)
      : 'Sin descripción';
    
    row.innerHTML = `
      <td>${report.id.substring(0, 8)}...</td>
      <td>${report.clientName || 'Cliente desconocido'}</td>
      <td>${report.tipo || 'Sin categoría'}</td>
      <td title="${report.descripcion || ''}">${descripcionCorta}</td>
      <td>${fechaReporte}</td>
      <td><span class="priority-badge ${prioridadClass}">${report.prioridad || 'Media'}</span></td>
      <td><span class="status-badge ${estadoClass}">${report.estado || 'Pendiente'}</span></td>
      <td class="actions">
        <button class="btn-icon view-report" data-id="${report.id}"><i class="fas fa-eye"></i></button>
        <button class="btn-icon edit-report" data-id="${report.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete-report" data-id="${report.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    
    tableBody.appendChild(row);
  }
  
  // Agregar event listeners a los botones de acción
  document.querySelectorAll('.view-report').forEach(btn => {
    btn.addEventListener('click', () => openViewReportModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.edit-report').forEach(btn => {
    btn.addEventListener('click', () => openEditReportModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-report').forEach(btn => {
    btn.addEventListener('click', () => confirmDeleteReport(btn.dataset.id));
  });
}

// Obtener clase CSS según el estado
function getStatusClass(estado) {
  switch(estado) {
    case 'pendiente':
      return 'status-pending';
    case 'en_proceso':
      return 'status-in-progress';
    case 'resuelto':
      return 'status-resolved';
    default:
      return 'status-pending';
  }
}

// Obtener clase CSS según la prioridad
function getPriorityClass(prioridad) {
  switch(prioridad) {
    case 'alta':
      return 'priority-high';
    case 'media':
      return 'priority-medium';
    case 'baja':
      return 'priority-low';
    default:
      return 'priority-medium';
  }
}

// Actualizar paginación
function updatePagination() {
  const paginationElement = document.getElementById('reportes-pagination');
  
  if (totalPages <= 1) {
    paginationElement.innerHTML = '';
    return;
  }
  
  let html = `
    <button class="pagination-btn" onclick="loadReports(1)" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-angle-double-left"></i>
    </button>
    <button class="pagination-btn" onclick="loadReports(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-angle-left"></i>
    </button>
  `;
  
  // Mostrar números de página (hasta 5 páginas)
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(startPage + 4, totalPages);
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="loadReports(${i})">
        ${i}
      </button>
    `;
  }
  
  html += `
    <button class="pagination-btn" onclick="loadReports(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-angle-right"></i>
    </button>
    <button class="pagination-btn" onclick="loadReports(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-angle-double-right"></i>
    </button>
  `;
  
  paginationElement.innerHTML = html;
}

// Abrir modal para ver el reporte
function openViewReportModal(reportId) {
  editingReportId = reportId;
  
  // Limpiar el modal
  document.getElementById('reporte-timeline').innerHTML = '';
  
  // Obtener datos del reporte
  firebase.firestore().collection('reportes').doc(reportId).get()
    .then(doc => {
      if (doc.exists) {
        const reportData = doc.data();
        
        // Llenar información básica
        document.getElementById('reporte-modal-title').textContent = 'Detalles del Reporte';
        document.getElementById('reporte-id').textContent = reportId;
        document.getElementById('reporte-cliente').textContent = reportData.clientName || 'Cliente desconocido';
        document.getElementById('reporte-tipo').textContent = reportData.tipo || 'Sin categoría';
        
        // Formatear fecha
        let fechaReporte = 'Fecha desconocida';
        if (reportData.createdAt) {
          const date = reportData.createdAt.toDate ? reportData.createdAt.toDate() : new Date(reportData.createdAt);
          fechaReporte = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }
        document.getElementById('reporte-fecha').textContent = fechaReporte;
        
        // Descripción
        document.getElementById('reporte-descripcion').textContent = reportData.descripcion || 'Sin descripción';
        
        // Estado y prioridad actuales
        document.getElementById('reporte-estado').value = reportData.estado || 'pendiente';
        document.getElementById('reporte-prioridad').value = reportData.prioridad || 'media';
        
        // Cargar historial si existe
        if (reportData.historial && reportData.historial.length > 0) {
          const timelineElement = document.getElementById('reporte-timeline');
          
          reportData.historial.forEach(item => {
            const itemElement = document.createElement('li');
            
            // Formatear fecha
            let fechaHistorial = 'Fecha desconocida';
            if (item.fecha) {
              const date = item.fecha.toDate ? item.fecha.toDate() : new Date(item.fecha);
              fechaHistorial = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            }
            
            itemElement.innerHTML = `
              <div class="timeline-time">${fechaHistorial}</div>
              <div class="timeline-content">
                <p><strong>${item.accion}</strong></p>
                <p>${item.comentario || ''}</p>
                <small>${item.usuario || 'Usuario del sistema'}</small>
              </div>
            `;
            
            timelineElement.appendChild(itemElement);
          });
        } else {
          document.getElementById('reporte-timeline').innerHTML = '<li>No hay actividad registrada.</li>';
        }
      }
    })
    .catch(error => {
      console.error("Error al obtener datos del reporte:", error);
    });
  
  // Mostrar modal
  document.getElementById('reporte-modal').classList.add('active');
}

// Abrir modal para editar reporte (mismo que ver pero con título diferente)
function openEditReportModal(reportId) {
  openViewReportModal(reportId);
  document.getElementById('reporte-modal-title').textContent = 'Editar Reporte';
}

// Guardar cambios en el reporte
function saveReportChanges() {
  if (!editingReportId) return;
  
  const estado = document.getElementById('reporte-estado').value;
  const prioridad = document.getElementById('reporte-prioridad').value;
  const comentario = document.getElementById('reporte-comentario').value;
  
  // Mostrar indicador de carga
  const saveBtn = document.getElementById('reporte-save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Guardando...';
  saveBtn.disabled = true;
  
  // Referencia al reporte
  const reportRef = firebase.firestore().collection('reportes').doc(editingReportId);
  
  // Obtener usuario actual
  const userName = currentUser ? (currentUser.displayName || currentUser.email) : 'Administrador';
  
  // Obtener reporte actual para agregar al historial
  reportRef.get()
    .then(doc => {
      if (!doc.exists) throw new Error('El reporte no existe');
      
      const reportData = doc.data();
      const historial = reportData.historial || [];
      
      // Crear nuevo registro en el historial
      historial.push({
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        accion: `Cambio de estado: ${reportData.estado || 'pendiente'} → ${estado}`,
        comentario: comentario,
        usuario: userName
      });
      
      // Actualizar reporte
      return reportRef.update({
        estado,
        prioridad,
        historial,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      closeReportModal();
      loadReports(currentPage);
    })
    .catch(error => {
      console.error("Error al actualizar reporte:", error);
      alert('Error al actualizar reporte: ' + error.message);
    })
    .finally(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    });
}

// Confirmar eliminación de reporte
function confirmDeleteReport(reportId) {
  if (confirm('¿Está seguro de que desea eliminar este reporte? Esta acción no se puede deshacer.')) {
    deleteReport(reportId);
  }
}

// Eliminar reporte
function deleteReport(reportId) {
  firebase.firestore().collection('reportes').doc(reportId).delete()
    .then(() => {
      loadReports(currentPage);
    })
    .catch(error => {
      console.error("Error al eliminar reporte:", error);
      alert('Error al eliminar reporte: ' + error.message);
    });
}

// Cerrar modal de reporte
function closeReportModal() {
  document.getElementById('reporte-modal').classList.remove('active');
  document.getElementById('reporte-form').reset();
  editingReportId = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Botones del modal
  document.getElementById('reporte-save-btn').addEventListener('click', saveReportChanges);
  document.getElementById('reporte-cancel-btn').addEventListener('click', closeReportModal);
  document.querySelector('#reporte-modal .close-modal').addEventListener('click', closeReportModal);
  
  // Filtros
  document.getElementById('filtro-estado-reporte').addEventListener('change', () => loadReports(1));
  document.getElementById('filtro-prioridad').addEventListener('change', () => loadReports(1));
  
  // Búsqueda
  let searchTimeout;
  document.getElementById('buscar-reporte').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadReports(1);
    }, 300);
  });
});