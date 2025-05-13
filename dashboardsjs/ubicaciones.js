// Módulo de ubicaciones usando Leaflet con OpenStreetMap (gratuito)
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si Firebase está disponible
  if (typeof firebase === 'undefined') {
      console.error('Firebase no está definido. Asegúrate de cargar los scripts de Firebase.');
      return;
  }

  // Elementos del DOM
  const mapContainer = document.getElementById('client-map');
  const addLocationBtn = document.getElementById('add-location-btn');
  const locationModal = document.getElementById('location-modal');
  const locationForm = document.getElementById('location-form');
  const locationModalTitle = document.getElementById('location-modal-title');
  const saveLocationBtn = document.getElementById('save-location-btn');
  const clientFilter = document.getElementById('client-filter');
  const statusFilter = document.getElementById('location-status-filter');
  const locationPreviewMap = document.getElementById('location-preview-map');
  
  // Variables de estado
  let map = null;
  let previewMap = null;
  let markers = [];
  let circles = [];
  let editingLocationId = null;
  let previewMarker = null;
  let previewCircle = null;

  // Referencias a Firebase
  const db = firebase.firestore();
  const locationsRef = db.collection('ubicaciones');
  const clientsRef = db.collection('usuarios').where('role', '==', 'user');
  
  // ===== Inicialización =====
  
  // Verificar si Leaflet está disponible
  if (typeof L === 'undefined') {
      // Cargar Leaflet dinámicamente si no está cargado
      loadLeaflet();
  } else {
      // Agregar CSS de Leaflet si no está incluido
      if (!document.querySelector('link[href*="leaflet.css"]')) {
          const leafletCSS = document.createElement('link');
          leafletCSS.rel = 'stylesheet';
          leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(leafletCSS);
      }
      
      // Inicializar cuando el tab de ubicaciones está activo
      initMapsWhenVisible();
  }
  
  // Cargar Leaflet dinámicamente
  function loadLeaflet() {
      // Cargar CSS de Leaflet
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);
      
      // Cargar JS de Leaflet
      const leafletScript = document.createElement('script');
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletScript.onload = function() {
          initMapsWhenVisible();
      };
      document.body.appendChild(leafletScript);
  }
  
  // Inicializar mapas cuando el contenedor esté visible
  function initMapsWhenVisible() {
      // Verificar si el contenedor del mapa está visible
      if (mapContainer && isElementVisible(mapContainer)) {
          initMaps();
      } else {
          // Si no está visible, agregar listeners para cuando sea visible
          
          // Listener para clic en el enlace de navegación de ubicaciones
          const locationLink = document.querySelector('a[data-section="locations"]');
          if (locationLink) {
              locationLink.addEventListener('click', function() {
                  // Esperar a que el DOM se actualice
                  setTimeout(initMaps, 100);
              });
          }
          
          // También verificar periódicamente
          checkVisibility();
      }
  }
  
  // Verificar periódicamente la visibilidad
  function checkVisibility() {
      if (mapContainer && isElementVisible(mapContainer) && !map) {
          initMaps();
      } else {
          setTimeout(checkVisibility, 500);
      }
  }
  
  // Verificar si un elemento es visible
  function isElementVisible(element) {
      return element.offsetParent !== null && 
             element.offsetWidth > 0 && 
             element.offsetHeight > 0 &&
             getComputedStyle(element).display !== 'none' &&
             getComputedStyle(element).visibility !== 'hidden';
  }
  
  // Inicializar mapas después de cargar Leaflet y cuando el contenedor esté visible
  function initMaps() {
      if (!mapContainer || typeof L === 'undefined') return;
      
      console.log('Inicializando mapa principal');
      console.log('Dimensiones del contenedor:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
      
      // Aplicar estilo explícito para asegurar que el contenedor tenga altura
      mapContainer.style.width = '100%';
      mapContainer.style.height = '100%';
      mapContainer.style.minHeight = '400px';
      
      // Inicializar mapa principal solo si no existe
      if (!map) {
          map = L.map(mapContainer, {
              zoomControl: true,
              attributionControl: true
          }).setView([-0.1807, -78.4678], 12); // Quito, Ecuador
          
          // Añadir capa de OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);
          
          // Actualizar tamaño del mapa
          map.invalidateSize();
          
          // Cargar ubicaciones
          loadLocations();
          
          // Cargar clientes
          loadClients();
          
          // Inicializar event listeners
          initEventListeners();
      } else {
          // Si el mapa ya existe, solo actualizar su tamaño
          map.invalidateSize();
      }
  }
  
  // Inicializar mapa de vista previa
  function initPreviewMap() {
      if (!locationPreviewMap || typeof L === 'undefined') return;
      
      console.log('Inicializando mapa de vista previa');
      console.log('Dimensiones del contenedor:', locationPreviewMap.offsetWidth, 'x', locationPreviewMap.offsetHeight);
      
      // Aplicar estilo explícito
      locationPreviewMap.style.width = '100%';
      locationPreviewMap.style.height = '200px';
      
      // Inicializar solo si no existe
      if (!previewMap) {
          previewMap = L.map(locationPreviewMap).setView([-0.1807, -78.4678], 14);
          
          // Añadir capa de OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(previewMap);
          
          // Permitir seleccionar ubicación haciendo clic en el mapa
          previewMap.on('click', function(e) {
              const lat = e.latlng.lat;
              const lng = e.latlng.lng;
              
              // Actualizar campos de latitud y longitud
              document.getElementById('location-lat').value = lat.toFixed(6);
              document.getElementById('location-lng').value = lng.toFixed(6);
              
              // Actualizar marcador de vista previa
              updatePreviewMarker(lat, lng);
          });
          
          // Actualizar tamaño del mapa
          previewMap.invalidateSize();
      } else {
          // Si el mapa ya existe, solo actualizar su tamaño
          previewMap.invalidateSize();
      }
  }
  
  // Inicializar event listeners
  function initEventListeners() {
      // Botón para añadir ubicación
      if (addLocationBtn) {
          addLocationBtn.addEventListener('click', function() {
              openLocationModal();
          });
      }
      
      // Formulario de ubicación
      if (locationForm) {
          locationForm.addEventListener('submit', function(e) {
              e.preventDefault();
              saveLocation();
          });
      }
      
      // Campo de dirección (búsqueda de dirección usando Nominatim)
      const addressInput = document.getElementById('location-address');
      if (addressInput) {
          addressInput.addEventListener('blur', function() {
              const address = this.value.trim();
              if (address) {
                  // Usar Nominatim (servicio gratuito de geocodificación de OpenStreetMap)
                  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
                  
                  fetch(nominatimUrl)
                      .then(response => response.json())
                      .then(data => {
                          if (data && data.length > 0) {
                              const lat = parseFloat(data[0].lat);
                              const lng = parseFloat(data[0].lon);
                              
                              // Actualizar campos de latitud y longitud
                              document.getElementById('location-lat').value = lat.toFixed(6);
                              document.getElementById('location-lng').value = lng.toFixed(6);
                              
                              // Actualizar marcador y centrar mapa
                              updatePreviewMarker(lat, lng);
                              previewMap.setView([lat, lng], 15);
                          }
                      })
                      .catch(error => {
                          console.error('Error al buscar dirección:', error);
                      });
              }
          });
      }
      
      // Campos de latitud y longitud
      const latInput = document.getElementById('location-lat');
      const lngInput = document.getElementById('location-lng');
      const radiusInput = document.getElementById('location-radius');
      
      if (latInput && lngInput) {
          const updateFromCoords = function() {
              const lat = parseFloat(latInput.value);
              const lng = parseFloat(lngInput.value);
              
              if (!isNaN(lat) && !isNaN(lng)) {
                  updatePreviewMarker(lat, lng);
                  previewMap.setView([lat, lng], 15);
              }
          };
          
          latInput.addEventListener('change', updateFromCoords);
          lngInput.addEventListener('change', updateFromCoords);
      }
      
      // Actualizar círculo al cambiar el radio
      if (radiusInput) {
          radiusInput.addEventListener('input', function() {
              const radius = parseInt(this.value);
              if (!isNaN(radius) && previewCircle) {
                  previewCircle.setRadius(radius);
              }
          });
      }
      
      // Filtros
      if (clientFilter) {
          clientFilter.addEventListener('change', loadLocations);
      }
      
      if (statusFilter) {
          statusFilter.addEventListener('change', loadLocations);
      }
      
      // Agregar listener para cambios de tamaño de ventana
      window.addEventListener('resize', function() {
          if (map) map.invalidateSize();
          if (previewMap) previewMap.invalidateSize();
      });
  }
  
  // ===== Funciones de carga de datos =====
  
  // Cargar ubicaciones desde Firestore
  function loadLocations() {
      if (!map) return;
      
      // Limpiar marcadores y círculos existentes
      clearMarkers();
      
      // Obtener valores de filtros
      const clientId = clientFilter ? clientFilter.value : 'all';
      const status = statusFilter ? statusFilter.value : 'all';
      
      // Consulta base
      let query = locationsRef;
      
      // Aplicar filtros
      if (clientId !== 'all') {
          query = query.where('clientId', '==', clientId);
      }
      
      if (status !== 'all') {
          query = query.where('status', '==', status);
      }
      
      // Ejecutar consulta
      query.get()
          .then(snapshot => {
              if (snapshot.empty) {
                  console.log('No se encontraron ubicaciones');
                  return;
              }
              
              // Procesar cada ubicación
              snapshot.forEach(doc => {
                  const locationData = doc.data();
                  const locationId = doc.id;
                  
                  // Crear marcador y círculo para esta ubicación
                  createMarkerAndCircle(locationId, locationData);
              });
              
              // Ajustar vista del mapa para mostrar todos los marcadores
              if (markers.length > 0) {
                  const group = new L.featureGroup(markers);
                  map.fitBounds(group.getBounds(), { padding: [50, 50] });
              }
          })
          .catch(error => {
              console.error('Error al cargar ubicaciones:', error);
          });
  }
  
  // Cargar clientes desde Firestore
  function loadClients() {
      // Obtener clientes para los filtros
      clientsRef.get()
          .then(snapshot => {
              const clients = [];
              
              snapshot.forEach(doc => {
                  const clientData = doc.data();
                  const clientId = doc.id;
                  
                  clients.push({
                      id: clientId,
                      name: clientData.name || 'Cliente sin nombre',
                      email: clientData.email
                  });
              });
              
              // Actualizar filtro de clientes
              updateClientFilter(clients);
              
              // Actualizar selector de clientes en el modal
              updateClientSelector(clients);
          })
          .catch(error => {
              console.error('Error al cargar clientes:', error);
          });
  }
  
  // Actualizar filtro de clientes
  function updateClientFilter(clients) {
      if (!clientFilter) return;
      
      // Mantener opción de "Todos"
      const currentValue = clientFilter.value;
      clientFilter.innerHTML = '<option value="all">Todos los clientes</option>';
      
      // Agregar opciones de clientes
      clients.forEach(client => {
          const option = document.createElement('option');
          option.value = client.id;
          option.textContent = client.name;
          clientFilter.appendChild(option);
      });
      
      // Restaurar valor seleccionado si es posible
      if (currentValue && currentValue !== 'all') {
          clientFilter.value = currentValue;
      }
  }
  
  // Actualizar selector de clientes en el modal
  function updateClientSelector(clients) {
      const locationClient = document.getElementById('location-client');
      if (!locationClient) return;
      
      // Opción vacía
      locationClient.innerHTML = '<option value="">Seleccionar cliente</option>';
      
      // Agregar opciones de clientes
      clients.forEach(client => {
          const option = document.createElement('option');
          option.value = client.id;
          option.textContent = client.name;
          locationClient.appendChild(option);
      });
  }
  
  // ===== Funciones para manejar marcadores y círculos =====
  
  // Crear marcador y círculo para una ubicación
  function createMarkerAndCircle(locationId, locationData) {
      if (!map) return;
      
      const lat = parseFloat(locationData.lat);
      const lng = parseFloat(locationData.lng);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      // Obtener color según estado
      const statusColors = {
          'active': '#22C55E', // Verde
          'pending': '#FACC15', // Amarillo
          'error': '#EF4444'    // Rojo
      };
      
      const statusColor = statusColors[locationData.status] || statusColors.active;
      
      // Crear marcador con ícono personalizado
      const marker = L.circleMarker([lat, lng], {
          radius: 8,
          fillColor: statusColor,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
      }).addTo(map);
      
      // Crear círculo de cobertura
      const circle = L.circle([lat, lng], {
          color: statusColor,
          fillColor: statusColor,
          fillOpacity: 0.1,
          radius: locationData.radius || 100
      }).addTo(map);
      
      // Crear contenido del popup
      const popupContent = createPopupContent(locationId, locationData);
      
      // Añadir popup al marcador
      marker.bindPopup(popupContent);
      
      // Aplicar animación de parpadeo si es activo o tiene error
      if (locationData.status === 'active' || locationData.status === 'error') {
          animateMarker(marker, statusColor);
      }
      
      // Guardar referencias
      markers.push(marker);
      circles.push(circle);
  }
  
  // Crear contenido del popup
  function createPopupContent(locationId, locationData) {
      const statusLabels = {
          'active': 'Activo',
          'pending': 'Pendiente',
          'error': 'Error'
      };
      
      const statusLabel = statusLabels[locationData.status] || 'Desconocido';
      
      // Crear elemento div para el popup
      const container = document.createElement('div');
      container.className = 'location-popup';
      
      // Contenido HTML del popup
      container.innerHTML = `
          <div class="location-popup-header">
              <h3>${locationData.name || 'Sin nombre'}</h3>
              <span class="status-badge ${locationData.status}">${statusLabel}</span>
          </div>
          ${locationData.imageUrl ? `
              <div class="location-popup-image">
                  <img src="${locationData.imageUrl}" alt="${locationData.name}">
              </div>
          ` : ''}
          <div class="location-popup-details">
              <p><strong>Cliente:</strong> ${locationData.clientName || 'N/A'}</p>
              <p><strong>Dirección:</strong> ${locationData.address || 'N/A'}</p>
              <p><strong>Teléfono:</strong> ${locationData.phone || 'N/A'}</p>
              <p><strong>Radio:</strong> ${locationData.radius || 100} metros</p>
          </div>
          <div class="location-popup-actions">
              <button class="edit-location-btn" data-id="${locationId}">Editar</button>
          </div>
      `;
      
      // Agregar event listener para el botón de editar
      setTimeout(() => {
          const editBtn = container.querySelector('.edit-location-btn');
          if (editBtn) {
              editBtn.addEventListener('click', function() {
                  const locId = this.getAttribute('data-id');
                  openLocationModal(locId, locationData);
              });
          }
      }, 100);
      
      return container;
  }
  
  // Animar marcador (parpadeo)
  function animateMarker(marker, color) {
      let opacity = 1.0;
      let increasing = false;
      
      // Intervalo para cambiar opacidad
      const intervalId = setInterval(function() {
          if (increasing) {
              opacity += 0.1;
              if (opacity >= 1.0) {
                  opacity = 1.0;
                  increasing = false;
              }
          } else {
              opacity -= 0.1;
              if (opacity <= 0.4) {
                  opacity = 0.4;
                  increasing = true;
              }
          }
          
          // Actualizar opacidad del marcador
          marker.setStyle({ fillOpacity: opacity });
      }, 500);
      
      // Guardar ID del intervalo en el marcador para poder limpiarlo después
      marker.intervalId = intervalId;
  }
  
  // Limpiar marcadores y círculos
  function clearMarkers() {
      markers.forEach(marker => {
          // Detener animación si existe
          if (marker.intervalId) {
              clearInterval(marker.intervalId);
          }
          // Eliminar marcador del mapa
          map.removeLayer(marker);
      });
      
      circles.forEach(circle => {
          map.removeLayer(circle);
      });
      
      markers = [];
      circles = [];
  }
  
  // Actualizar marcador de vista previa
  function updatePreviewMarker(lat, lng) {
      if (!previewMap) return;
      
      // Eliminar marcador y círculo previos si existen
      if (previewMarker) {
          previewMap.removeLayer(previewMarker);
      }
      if (previewCircle) {
          previewMap.removeLayer(previewCircle);
      }
      
      // Crear nuevo marcador
      previewMarker = L.circleMarker([lat, lng], {
          radius: 8,
          fillColor: '#3B82F6',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
      }).addTo(previewMap);
      
      // Obtener radio del campo de entrada
      const radius = parseInt(document.getElementById('location-radius').value) || 100;
      
      // Crear nuevo círculo
      previewCircle = L.circle([lat, lng], {
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.1,
          radius: radius
      }).addTo(previewMap);
  }
  
  // ===== Funciones CRUD =====
  
  // Abrir modal de ubicación
  function openLocationModal(locationId = null, locationData = null) {
      if (!locationModal || !locationForm) return;
      
      // Limpiar formulario
      locationForm.reset();
      
      // Título del modal
      if (locationModalTitle) {
          locationModalTitle.textContent = locationId ? 'Editar Ubicación' : 'Nueva Ubicación';
      }
      
      // Establecer valores por defecto
      document.getElementById('location-radius').value = '100';
      
      // Si es edición, rellenar con datos existentes
      if (locationId && locationData) {
          editingLocationId = locationId;
          
          // Rellenar campos
          document.getElementById('location-client').value = locationData.clientId || '';
          document.getElementById('location-name').value = locationData.name || '';
          document.getElementById('location-address').value = locationData.address || '';
          document.getElementById('location-lat').value = locationData.lat || '';
          document.getElementById('location-lng').value = locationData.lng || '';
          document.getElementById('location-status').value = locationData.status || 'active';
          document.getElementById('location-radius').value = locationData.radius || 100;
      } else {
          editingLocationId = null;
      }
      
      // Mostrar modal
      locationModal.classList.add('active');
      
      // Inicializar mapa de vista previa después de que el modal se muestre
      setTimeout(() => {
          // Inicializar mapa de vista previa
          initPreviewMap();
          
          // Si hay coordenadas, actualizar preview
          if (locationData && locationData.lat && locationData.lng) {
              const lat = parseFloat(locationData.lat);
              const lng = parseFloat(locationData.lng);
              
              if (!isNaN(lat) && !isNaN(lng)) {
                  updatePreviewMarker(lat, lng);
                  previewMap.setView([lat, lng], 15);
              }
          }
          
          // Forzar actualización del tamaño del mapa
          if (previewMap) {
              previewMap.invalidateSize();
          }
      }, 300);
  }
  
  // Guardar ubicación
  function saveLocation() {
      if (!locationForm) return;
      
      // Obtener datos del formulario
      const clientId = document.getElementById('location-client').value.trim();
      const name = document.getElementById('location-name').value.trim();
      const address = document.getElementById('location-address').value.trim();
      const lat = parseFloat(document.getElementById('location-lat').value);
      const lng = parseFloat(document.getElementById('location-lng').value);
      const status = document.getElementById('location-status').value;
      const radius = parseInt(document.getElementById('location-radius').value) || 100;
      
      // Validaciones
      if (!clientId) {
          alert('Debe seleccionar un cliente');
          return;
      }
      
      if (!name) {
          alert('El nombre de la ubicación es obligatorio');
          return;
      }
      
      if (isNaN(lat) || isNaN(lng)) {
          alert('Las coordenadas son inválidas');
          return;
      }
      
      // Mostrar estado de carga
      if (saveLocationBtn) {
          saveLocationBtn.disabled = true;
          saveLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      }
      
      // Obtener nombre del cliente
      db.collection('usuarios').doc(clientId).get()
          .then(doc => {
              let clientName = 'Cliente';
              let phone = '';
              
              if (doc.exists) {
                  const clientData = doc.data();
                  clientName = clientData.name || clientData.email || 'Cliente';
                  phone = clientData.phone || '';
              }
              
              // Datos a guardar
              const locationData = {
                  clientId,
                  clientName,
                  name,
                  address,
                  lat,
                  lng,
                  status,
                  radius,
                  phone,
                  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              };
              
              // Procesar imagen si existe
              const imageInput = document.getElementById('location-image');
              let savePromise;
              
              if (imageInput && imageInput.files.length > 0) {
                  const file = imageInput.files[0];
                  
                  // Leer imagen como Data URL
                  const reader = new FileReader();
                  savePromise = new Promise((resolve, reject) => {
                      reader.onload = function(e) {
                          // Guardar URL de la imagen
                          locationData.imageUrl = e.target.result;
                          resolve();
                      };
                      reader.onerror = reject;
                      reader.readAsDataURL(file);
                  });
              } else {
                  savePromise = Promise.resolve();
              }
              
              // Guardar datos en Firestore
              return savePromise.then(() => {
                  if (editingLocationId) {
                      // Actualizar ubicación existente
                      return locationsRef.doc(editingLocationId).update(locationData);
                  } else {
                      // Crear nueva ubicación
                      locationData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                      return locationsRef.add(locationData);
                  }
              });
          })
          .then(() => {
              alert(editingLocationId ? 'Ubicación actualizada correctamente' : 'Ubicación creada correctamente');
              locationModal.classList.remove('active');
              loadLocations();
          })
          .catch(error => {
              console.error('Error al guardar ubicación:', error);
              alert('Error al guardar ubicación: ' + error.message);
          })
          .finally(() => {
              // Restaurar botón
              if (saveLocationBtn) {
                  saveLocationBtn.disabled = false;
                  saveLocationBtn.textContent = 'Guardar';
              }
          });
  }
});
// Función mejorada para cargar clientes
// Reemplaza esta función en tu archivo ubicaciones.js

// Cargar clientes desde Firestore
function loadClients() {
  console.log('Cargando clientes...');
  
  // Referencias a Firebase
  const db = firebase.firestore();
  
  // Consulta para obtener todos los usuarios con rol 'user' (clientes)
  db.collection('usuarios')
      .where('role', '==', 'user')
      .get()
      .then(snapshot => {
          console.log('Resultado de la consulta:', snapshot.size, 'clientes encontrados');
          
          const clients = [];
          
          // Si no hay clientes
          if (snapshot.empty) {
              console.log('No se encontraron clientes');
              
              // Mostrar mensaje en opciones
              updateClientFilter([]);
              updateClientSelector([]);
              return;
          }
          
          // Procesar cada cliente
          snapshot.forEach(doc => {
              const clientData = doc.data();
              const clientId = doc.id;
              
              console.log('Cliente encontrado:', clientId, clientData);
              
              clients.push({
                  id: clientId,
                  name: clientData.name || clientData.email || 'Cliente sin nombre',
                  email: clientData.email || 'Sin email'
              });
          });
          
          console.log('Clientes procesados:', clients.length);
          
          // Actualizar filtro de clientes
          updateClientFilter(clients);
          
          // Actualizar selector de clientes en el modal
          updateClientSelector(clients);
      })
      .catch(error => {
          console.error('Error al cargar clientes:', error);
      });
}

// Actualizar selector de clientes en el modal
function updateClientSelector(clients) {
  const locationClient = document.getElementById('location-client');
  if (!locationClient) {
      console.error('No se encontró el elemento location-client');
      return;
  }
  
  console.log('Actualizando selector de clientes con', clients.length, 'clientes');
  
  // Opción vacía
  locationClient.innerHTML = '<option value="">Seleccionar cliente</option>';
  
  // Si no hay clientes, mostrar mensaje
  if (clients.length === 0) {
      const option = document.createElement('option');
      option.value = "";
      option.textContent = "No hay clientes registrados";
      option.disabled = true;
      locationClient.appendChild(option);
      return;
  }
  
  // Agregar opciones de clientes
  clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = `${client.name} (${client.email})`;
      locationClient.appendChild(option);
  });
  
  console.log('Selector de clientes actualizado');
}

// Actualizar filtro de clientes
function updateClientFilter(clients) {
  const clientFilter = document.getElementById('client-filter');
  if (!clientFilter) {
      console.error('No se encontró el elemento client-filter');
      return;
  }
  
  console.log('Actualizando filtro de clientes con', clients.length, 'clientes');
  
  // Mantener opción de "Todos"
  const currentValue = clientFilter.value;
  clientFilter.innerHTML = '<option value="all">Todos los clientes</option>';
  
  // Si no hay clientes, mostrar mensaje
  if (clients.length === 0) {
      const option = document.createElement('option');
      option.value = "none";
      option.textContent = "No hay clientes registrados";
      option.disabled = true;
      clientFilter.appendChild(option);
      return;
  }
  
  // Agregar opciones de clientes
  clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      clientFilter.appendChild(option);
  });
  
  // Restaurar valor seleccionado si es posible
  if (currentValue && currentValue !== 'all') {
      clientFilter.value = currentValue;
  }
  
  console.log('Filtro de clientes actualizado');
}
// Modificaciones para ubicaciones.js
// Hacer que las funciones clave sean globales para acceso desde otros módulos

// Modificar la función loadLocations para hacerla accesible globalmente
// Reemplazar la definición actual de loadLocations con esta:

// Cargar ubicaciones desde Firestore
window.loadLocations = function() {
    if (!map) return;
    
    console.log('Cargando ubicaciones en el mapa...');
    
    // Limpiar marcadores y círculos existentes
    window.clearMarkers();
    
    // Obtener valores de filtros
    const clientId = clientFilter ? clientFilter.value : 'all';
    const status = statusFilter ? statusFilter.value : 'all';
    
    // Consulta base
    let query = locationsRef;
    
    // Aplicar filtros
    if (clientId !== 'all') {
        query = query.where('clientId', '==', clientId);
    }
    
    if (status !== 'all') {
        query = query.where('status', '==', status);
    }
    
    // Ejecutar consulta
    query.get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No se encontraron ubicaciones');
                return;
            }
            
            console.log('Ubicaciones encontradas:', snapshot.size);
            
            // Procesar cada ubicación
            snapshot.forEach(doc => {
                const locationData = doc.data();
                const locationId = doc.id;
                
                console.log('Creando marcador para ubicación:', locationId, 'con estado:', locationData.status);
                
                // Crear marcador y círculo para esta ubicación
                createMarkerAndCircle(locationId, locationData);
            });
            
            // Ajustar vista del mapa para mostrar todos los marcadores
            if (markers.length > 0) {
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds(), { padding: [50, 50] });
            }
        })
        .catch(error => {
            console.error('Error al cargar ubicaciones:', error);
        });
};

// Hacer global la función clearMarkers
window.clearMarkers = function() {
    console.log('Limpiando marcadores del mapa...');
    
    markers.forEach(marker => {
        // Detener animación si existe
        if (marker.intervalId) {
            clearInterval(marker.intervalId);
        }
        // Eliminar marcador del mapa
        map.removeLayer(marker);
    });
    
    circles.forEach(circle => {
        map.removeLayer(circle);
    });
    
    markers = [];
    circles = [];
};

// También hacer global la referencia al mapa
document.addEventListener('DOMContentLoaded', function() {
    // Cuando el mapa se inicialice, hacerlo accesible globalmente
    if (typeof initMaps === 'function') {
        const originalInitMaps = initMaps;
        
        initMaps = function() {
            originalInitMaps();
            
            // Hacer que el mapa sea accesible globalmente después de inicializarlo
            if (map) {
                console.log('Haciendo el mapa accesible globalmente');
                window.map = map;
            }
        };
    }
});