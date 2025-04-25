// Variables globales para la gestión de ubicaciones
let locationsList = [];
let map = null;
let markers = {};
let selectedLocationId = null;
let editingLocationId = null;

// Inicializar el mapa principal
function initMap() {
  // Si el mapa ya está inicializado, no hacerlo de nuevo
  if (map) return;
  
  // Crear mapa centrado en Ecuador (coordenadas aprox: -1.8312, -78.1834)
  map = L.map('map').setView([-1.8312, -78.1834], 7);
  
  // Agregar capa de mapa base (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);
  
  // Agregar escala
  L.control.scale().addTo(map);
}

// Inicializar la vista previa del mapa en el dashboard
function initMapPreview() {
  // Crear mapa pequeño para el dashboard
  const previewMap = L.map('map-preview-container').setView([-1.8312, -78.1834], 6);
  
  // Agregar capa de mapa base (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(previewMap);
  
  // Cargar ubicaciones para la vista previa
  firebase.firestore().collection('locations')
    .limit(15) // Limitar a 15 ubicaciones para la vista previa
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const locationData = doc.data();
        
        // Verificar que tenga coordenadas válidas
        if (locationData.lat && locationData.lng) {
          // Crear marcador según el estado
          const markerColor = getMarkerColorByStatus(locationData.status);
          const marker = L.circleMarker([locationData.lat, locationData.lng], {
            radius: 8,
            fillColor: markerColor,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(previewMap);
          
          // Agregar popup con información básica
          marker.bindPopup(`<strong>${locationData.clientName || 'Cliente'}</strong><br>${locationData.address || 'Sin dirección'}`);
        }
      });
    })
    .catch(error => {
      console.error("Error al cargar ubicaciones para vista previa:", error);
    });
}

// Obtener color del marcador según el estado
function getMarkerColorByStatus(status) {
  switch(status) {
    case 'activo':
      return '#4CAF50'; // Verde
    case 'pendiente':
      return '#FFC107'; // Amarillo
    case 'error':
      return '#F44336'; // Rojo
    default:
      return '#2196F3'; // Azul (por defecto)
  }
}

// Cargar ubicaciones desde Firestore
function loadLocations() {
  // Mostrar indicador de carga
  document.getElementById('ubicaciones-list').innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
  
  // Obtener filtro
  const statusFilter = document.getElementById('filtro-estado-ubicacion').value;
  const searchText = document.getElementById('buscar-ubicacion').value.toLowerCase();
  
  // Referencia a la colección de ubicaciones
  let locationsRef = firebase.firestore().collection('locations');
  
  // Aplicar filtro de estado si no es "todos"
  if (statusFilter !== 'todos') {
    locationsRef = locationsRef.where('status', '==', statusFilter);
  }
  
  // Obtener ubicaciones
  locationsRef.get()
    .then(snapshot => {
      locationsList = [];
      
      // Limpiar marcadores anteriores
      for (const id in markers) {
        map.removeLayer(markers[id]);
      }
      markers = {};
      
      snapshot.forEach(doc => {
        const locationData = doc.data();
        
        // Filtrar por texto de búsqueda si existe
        if (searchText) {
          const matchesSearch = 
            (locationData.clientName && locationData.clientName.toLowerCase().includes(searchText)) ||
            (locationData.address && locationData.address.toLowerCase().includes(searchText));
          
          if (!matchesSearch) return;
        }
        
        locationsList.push({
          id: doc.id,
          ...locationData
        });
        
        // Crear marcador en el mapa
        addMarkerToMap(doc.id, locationData);
      });
      
      // Mostrar ubicaciones en la lista
      displayLocationsList();
      
      // Si no hay ubicaciones seleccionadas y hay ubicaciones disponibles, seleccionar la primera
      if (!selectedLocationId && locationsList.length > 0) {
        selectLocation(locationsList[0].id);
      }
    })
    .catch(error => {
      console.error("Error al cargar ubicaciones:", error);
      document.getElementById('ubicaciones-list').innerHTML = 
        '<div class="error-message"><i class="fas fa-exclamation-circle"></i> Error al cargar ubicaciones.</div>';
    });
}

// Agregar marcador al mapa
function addMarkerToMap(id, locationData) {
  if (!locationData.lat || !locationData.lng) return;
  
  // Crear marcador según el estado
  const markerColor = getMarkerColorByStatus(locationData.status);
  const marker = L.circleMarker([locationData.lat, locationData.lng], {
    radius: 8,
    fillColor: markerColor,
    color: '#fff',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  }).addTo(map);
  
  // Guardar referencia al marcador
  markers[id] = marker;
  
  // Agregar event listener al hacer clic en el marcador
  marker.on('click', () => {
    selectLocation(id);
  });
}

// Mostrar lista de ubicaciones
function displayLocationsList() {
  const locationsListElement = document.getElementById('ubicaciones-list');
  locationsListElement.innerHTML = '';
  
  if (locationsList.length === 0) {
    locationsListElement.innerHTML = '<div class="empty-message">No se encontraron ubicaciones.</div>';
    return;
  }
  
  locationsList.forEach(location => {
    const item = document.createElement('div');
    item.className = 'location-item';
    if (selectedLocationId === location.id) {
      item.classList.add('selected');
    }
    
    // Determinar clase de estado
    const statusClass = `status-${location.status || 'default'}`;
    
    item.innerHTML = `
      <div class="location-status ${statusClass}"></div>
      <div class="location-info">
        <h4>${location.clientName || 'Cliente sin nombre'}</h4>
        <p>${location.address || 'Sin dirección'}</p>
        <span class="location-date">${formatDate(location.updatedAt)}</span>
      </div>
    `;
    
    // Agregar event listener
    item.addEventListener('click', () => {
      selectLocation(location.id);
    });
    
    locationsListElement.appendChild(item);
  });
}

// Seleccionar ubicación
function selectLocation(locationId) {
  selectedLocationId = locationId;
  
  // Actualizar clase selected en la lista
  document.querySelectorAll('.location-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  const selectedItem = document.querySelector(`.location-item:nth-child(${locationsList.findIndex(l => l.id === locationId) + 1})`);
  if (selectedItem) {
    selectedItem.classList.add('selected');
    // Hacer scroll a la ubicación seleccionada
    selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  // Centrar mapa en el marcador seleccionado
  const location = locationsList.find(l => l.id === locationId);
  if (location && location.lat && location.lng) {
    map.setView([location.lat, location.lng], 15);
    
    // Resaltar marcador
    for (const id in markers) {
      const marker = markers[id];
      if (id === locationId) {
        marker.setRadius(12);
        marker.setStyle({ weight: 2 });
      } else {
        marker.setRadius(8);
        marker.setStyle({ weight: 1 });
      }
    }
  }
  
  // Mostrar detalles de la ubicación
  displayLocationDetails(location);
}

// Mostrar detalles de la ubicación seleccionada
function displayLocationDetails(location) {
  const detailsElement = document.getElementById('location-details');
  
  if (!location) {
    detailsElement.innerHTML = '<div class="empty-message">Seleccione una ubicación para ver detalles.</div>';
    return;
  }
  
  const statusClass = `status-${location.status || 'default'}`;
  const imageUrl = location.imageUrl || 'assets/img/location-placeholder.png';
  
  detailsElement.innerHTML = `
    <div class="location-header">
      <h3>${location.clientName || 'Cliente sin nombre'}</h3>
      <span class="status-badge ${statusClass}">${location.status || 'Sin estado'}</span>
    </div>
    <div class="location-image">
      <img src="${imageUrl}" alt="${location.clientName || 'Imagen de ubicación'}">
    </div>
    <div class="location-details-info">
      <div class="detail-item">
        <i class="fas fa-map-marker-alt"></i>
        <span>${location.address || 'Sin dirección'}</span>
      </div>
      <div class="detail-item">
        <i class="fas fa-phone"></i>
        <span>${location.phone || 'Sin teléfono'}</span>
      </div>
      <div class="detail-item">
        <i class="fas fa-user"></i>
        <span>${location.contactName || 'Sin contacto'}</span>
      </div>
      <div class="detail-item">
        <i class="fas fa-calendar-check"></i>
        <span>Última revisión: ${formatDate(location.lastCheck)}</span>
      </div>
    </div>
    <div class="location-notes">
      <h4>Notas</h4>
      <p>${location.notes || 'Sin notas adicionales.'}</p>
    </div>
    <div class="location-actions">
      <button class="btn-primary edit-location" data-id="${location.id}">
        <i class="fas fa-edit"></i> Editar
      </button>
      <button class="btn-danger delete-location" data-id="${location.id}">
        <i class="fas fa-trash"></i> Eliminar
      </button>
    </div>
  `;
  
  // Agregar event listeners
  detailsElement.querySelector('.edit-location').addEventListener('click', () => {
    openEditLocationModal(location.id);
  });
  
  detailsElement.querySelector('.delete-location').addEventListener('click', () => {
    confirmDeleteLocation(location.id);
  });
}

// Formatear fecha
function formatDate(timestamp) {
  if (!timestamp) return 'Fecha desconocida';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Abrir modal para crear ubicación
function openCreateLocationModal() {
  editingLocationId = null;
  document.getElementById('ubicacion-modal-title').textContent = 'Nueva Ubicación';
  document.getElementById('ubicacion-form').reset();
  document.getElementById('ubicacion-preview').src = '';
  document.getElementById('ubicacion-preview-container').style.display = 'none';
  
  // Cargar lista de clientes
  loadClientsForSelect();
  
  // Mostrar modal
  document.getElementById('ubicacion-modal').classList.add('active');
}

// Abrir modal para editar ubicación
function openEditLocationModal(locationId) {
  editingLocationId = locationId;
  document.getElementById('ubicacion-modal-title').textContent = 'Editar Ubicación';
  document.getElementById('ubicacion-form').reset();
  
  // Cargar lista de clientes
  loadClientsForSelect();
  
  // Obtener datos de la ubicación
  firebase.firestore().collection('locations').doc(locationId).get()
    .then(doc => {
      if (doc.exists) {
        const locationData = doc.data();
        
        // Esperar a que la lista de clientes se cargue
        setTimeout(() => {
          document.getElementById('ubicacion-cliente').value = locationData.clientId || '';
          document.getElementById('ubicacion-direccion').value = locationData.address || '';
          document.getElementById('ubicacion-latitud').value = locationData.lat || '';
          document.getElementById('ubicacion-longitud').value = locationData.lng || '';
          document.getElementById('ubicacion-estado').value = locationData.status || 'activo';
          document.getElementById('ubicacion-notas').value = locationData.notes || '';
          
          // Mostrar imagen si existe
          if (locationData.imageUrl) {
            document.getElementById('ubicacion-preview').src = locationData.imageUrl;
            document.getElementById('ubicacion-preview-container').style.display = 'block';
          } else {
            document.getElementById('ubicacion-preview-container').style.display = 'none';
          }
        }, 500);
      }
    })
    .catch(error => {
      console.error("Error al obtener datos de la ubicación:", error);
    });
  
  // Mostrar modal
  document.getElementById('ubicacion-modal').classList.add('active');
}

// Cargar lista de clientes para el select
function loadClientsForSelect() {
  const selectElement = document.getElementById('ubicacion-cliente');
  selectElement.innerHTML = '<option value="">Cargando clientes...</option>';
  
  firebase.firestore().collection('users')
    .where('role', '==', 'usuario')
    .get()
    .then(snapshot => {
      selectElement.innerHTML = '<option value="">Seleccione un cliente</option>';
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = userData.nombre || userData.email;
        selectElement.appendChild(option);
      });
    })
    .catch(error => {
      console.error("Error al cargar clientes:", error);
      selectElement.innerHTML = '<option value="">Error al cargar clientes</option>';
    });
}

// Manejar vista previa de imagen
function handleLocationImagePreview(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('ubicacion-preview').src = e.target.result;
      document.getElementById('ubicacion-preview-container').style.display = 'block';
    }
    reader.readAsDataURL(file);
  }
}

// Guardar ubicación (crear o actualizar)
function saveLocation() {
  const clientId = document.getElementById('ubicacion-cliente').value;
  const address = document.getElementById('ubicacion-direccion').value;
  const lat = parseFloat(document.getElementById('ubicacion-latitud').value);
  const lng = parseFloat(document.getElementById('ubicacion-longitud').value);
  const status = document.getElementById('ubicacion-estado').value;
  const notes = document.getElementById('ubicacion-notas').value;
  const imagenFile = document.getElementById('ubicacion-imagen').files[0];
  
  if (!clientId || !address || isNaN(lat) || isNaN(lng)) {
    alert('Por favor complete todos los campos obligatorios correctamente.');
    return;
  }
  
  // Mostrar indicador de carga
  const saveBtn = document.getElementById('ubicacion-save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Guardando...';
  saveBtn.disabled = true;
  
  // Obtener nombre del cliente
  firebase.firestore().collection('users').doc(clientId).get()
    .then(doc => {
      let clientName = '';
      if (doc.exists) {
        const userData = doc.data();
        clientName = userData.nombre || userData.email;
      }
      
      // Función para guardar datos en Firestore
      const saveLocationData = (imageUrl = null) => {
        const locationData = {
          clientId,
          clientName,
          address,
          lat,
          lng,
          status,
          notes,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Agregar URL de imagen si existe
        if (imageUrl) {
          locationData.imageUrl = imageUrl;
        }
        
        let savePromise;
        
        if (editingLocationId) {
          // Actualizar ubicación existente
          savePromise = firebase.firestore().collection('locations').doc(editingLocationId).update(locationData);
        } else {
          // Crear nueva ubicación
          locationData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          savePromise = firebase.firestore().collection('locations').doc().set(locationData);
        }
        
        savePromise
          .then(() => {
            closeLocationModal();
            loadLocations();
          })
          .catch(error => {
            console.error("Error al guardar ubicación:", error);
            alert('Error al guardar ubicación: ' + error.message);
          })
          .finally(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
          });
      };
      
      // Si hay una imagen para subir
      if (imagenFile) {
        const storageRef = firebase.storage().ref();
        const imageRef = storageRef.child(`ubicaciones/${Date.now()}_${imagenFile.name}`);
        
        imageRef.put(imagenFile)
          .then(snapshot => snapshot.ref.getDownloadURL())
          .then(imageUrl => {
            saveLocationData(imageUrl);
          })
          .catch(error => {
            console.error("Error al subir imagen:", error);
            alert('Error al subir imagen. Intente nuevamente.');
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
          });
      } else {
        // Si no hay imagen nueva, guardar los datos sin cambiar la imagen
        saveLocationData(document.getElementById('ubicacion-preview').src || null);
      }
    })
    .catch(error => {
      console.error("Error al obtener información del cliente:", error);
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    });
}

// Confirmar eliminación de ubicación
function confirmDeleteLocation(locationId) {
  if (confirm('¿Está seguro de que desea eliminar esta ubicación? Esta acción no se puede deshacer.')) {
    deleteLocation(locationId);
  }
}

// Eliminar ubicación
function deleteLocation(locationId) {
  // Obtener la URL de la imagen primero
  firebase.firestore().collection('locations').doc(locationId).get()
    .then(doc => {
      if (doc.exists) {
        const locationData = doc.data();
        
        // Eliminar de Firestore primero
        return firebase.firestore().collection('locations').doc(locationId).delete()
          .then(() => {
            // Si la ubicación tenía una imagen, eliminarla del storage
            if (locationData.imageUrl) {
              // Extraer el path del storage de la URL
              const imageRef = firebase.storage().refFromURL(locationData.imageUrl);
              return imageRef.delete();
            }
          });
      }
    })
    .then(() => {
      // Si era la ubicación seleccionada, limpiar selección
      if (selectedLocationId === locationId) {
        selectedLocationId = null;
        document.getElementById('location-details').innerHTML = 
          '<div class="empty-message">Seleccione una ubicación para ver detalles.</div>';
      }
      
      loadLocations();
    })
    .catch(error => {
      console.error("Error al eliminar ubicación:", error);
      alert('Error al eliminar ubicación: ' + error.message);
    });
}

// Cerrar modal de ubicación
function closeLocationModal() {
  document.getElementById('ubicacion-modal').classList.remove('active');
  document.getElementById('ubicacion-form').reset();
  document.getElementById('ubicacion-preview').src = '';
  document.getElementById('ubicacion-preview-container').style.display = 'none';
  editingLocationId = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Botón para crear ubicación
  document.getElementById('crear-ubicacion-btn').addEventListener('click', openCreateLocationModal);
  
  // Botones del modal
  document.getElementById('ubicacion-save-btn').addEventListener('click', saveLocation);
  document.getElementById('ubicacion-cancel-btn').addEventListener('click', closeLocationModal);
  document.querySelector('#ubicacion-modal .close-modal').addEventListener('click', closeLocationModal);
  
  // Manejar vista previa de imagen
  document.getElementById('ubicacion-imagen').addEventListener('change', handleLocationImagePreview);
  
  // Filtro
  document.getElementById('filtro-estado-ubicacion').addEventListener('change', () => loadLocations());
  
  // Búsqueda
  let searchTimeout;
  document.getElementById('buscar-ubicacion').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadLocations();
    }, 300);
  });
});