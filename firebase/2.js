// Script para manejar el mapa y ubicaciones
document.addEventListener('DOMContentLoaded', function() {
  
    // Función para formatear fechas
    function formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('es-ES');
    }
    
    // Función para obtener texto de estado
    function getStatusText(status) {
      switch(status) {
        case 'active':
          return 'Activo';
        case 'inactive':
          return 'Inactivo';
        case 'warning':
          return 'Advertencia';
        case 'pending':
          return 'Pendiente';
        case 'completed':
          return 'Completado';
        default:
          return 'Desconocido';
      }
    }
    
    // Función para obtener texto de tipo de ubicación
    function getLocationType(type) {
      switch(type) {
        case 'residential':
          return 'Residencial';
        case 'commercial':
          return 'Comercial';
        case 'industrial':
          return 'Industrial';
        default:
          return 'Desconocido';
      }
    }
    
    // Verificar si Leaflet está disponible
    if (typeof L !== 'undefined' && typeof firebase !== 'undefined') {
      // Variables para los mapas
      let dashboardMap = null;
      let locationMap = null;
      let markers = {};
      
      // Inicializar mapas cuando se muestren las secciones
      const dashboardLink = document.querySelector('a[data-section="dashboard-section"]');
      if (dashboardLink) {
        dashboardLink.addEventListener('click', function() {
          setTimeout(initDashboardMap, 300); // Retraso para asegurar que el DOM esté listo
        });
      }
      
      const ubicacionesLink = document.querySelector('a[data-section="ubicaciones-section"]');
      if (ubicacionesLink) {
        ubicacionesLink.addEventListener('click', function() {
          setTimeout(initLocationMap, 300); // Retraso para asegurar que el DOM esté listo
        });
      }
      
      // Inicializar mapa del dashboard
      function initDashboardMap() {
        const mapElement = document.getElementById('map');
        if (!mapElement) return;
        
        console.log("Inicializando mapa del dashboard");
        
        // Si ya existe un mapa, lo eliminamos
        if (dashboardMap) {
          dashboardMap.remove();
          dashboardMap = null;
        }
        
        // Crear mapa centrado en México
        dashboardMap = L.map('map').setView([19.432608, -99.133209], 5);
        
        // Añadir capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(dashboardMap);
        
        // Cargar ubicaciones
        loadLocations(dashboardMap);
        
        // Configurar filtros
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (filterButtons) {
          filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
              const filterValue = this.getAttribute('data-filter');
              filterMapMarkers(filterValue);
              
              // Actualizar clase activa
              filterButtons.forEach(b => b.classList.remove('active'));
              this.classList.add('active');
            });
          });
        }
      }
      
      // Inicializar mapa de ubicaciones
      function initLocationMap() {
        const mapElement = document.getElementById('map-location');
        if (!mapElement) return;
        
        console.log("Inicializando mapa de ubicaciones");
        
        // Si ya existe un mapa, lo eliminamos
        if (locationMap) {
          locationMap.remove();
          locationMap = null;
        }
        
        // Crear mapa centrado en México
        locationMap = L.map('map-location').setView([19.432608, -99.133209], 5);
        
        // Añadir capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(locationMap);
        
        // Cargar ubicaciones
        loadLocations(locationMap);
        
        // Cargar lista de ubicaciones
        loadLocationsList();
      }
      
      // Función para cargar ubicaciones desde Firestore
      function loadLocations(map) {
        // Primero intentamos cargar ubicaciones existentes
        firebase.firestore().collection('locations').get()
          .then(function(querySnapshot) {
            markers = {};
            
            if (!querySnapshot.empty) {
              querySnapshot.forEach(function(doc) {
                const locationData = doc.data();
                const locationId = doc.id;
                
                // Verificar que tenga coordenadas válidas
                if (locationData.lat && locationData.lng) {
                  const lat = parseFloat(locationData.lat);
                  const lng = parseFloat(locationData.lng);
                  
                  if (!isNaN(lat) && !isNaN(lng)) {
                    // Crear marcador
                    const marker = L.marker([lat, lng])
                      .addTo(map)
                      .bindPopup(`
                        <strong>${locationData.clientName || 'Cliente'}</strong><br>
                        ${locationData.address || ''}<br>
                        <span class="status ${locationData.status || 'active'}">${getStatusText(locationData.status || 'active')}</span>
                      `);
                    
                    // Guardar referencia al marcador
                    markers[locationId] = {
                      marker: marker,
                      status: locationData.status || 'active'
                    };
                  }
                }
              });
            } else {
              // Si no hay ubicaciones, intentamos crearlas a partir de usuarios que tienen dirección
              createLocationsFromUsers(map);
            }
          })
          .catch(function(error) {
            console.error("Error al cargar ubicaciones:", error);
            showNotification('Error al cargar ubicaciones: ' + error.message, 'error');
          });
      }
      
      // Función para crear ubicaciones a partir de usuarios registrados
      function createLocationsFromUsers(map) {
        firebase.firestore().collection('users')
          .where('address', '!=', '')
          .get()
          .then(function(querySnapshot) {
            if (querySnapshot.empty) {
              console.log("No hay usuarios con direcciones registradas");
              return;
            }
            
            console.log(`Encontrados ${querySnapshot.size} usuarios con direcciones`);
            
            // Para cada usuario con dirección, intentamos geocodificar y crear una ubicación
            querySnapshot.forEach(function(doc) {
              const userData = doc.data();
              const userId = doc.id;
              
              if (userData.address) {
                // Simular geocodificación (en producción usarías un servicio real)
                // Aquí generamos coordenadas aleatorias cerca de Ciudad de México para demo
                const baseLat = 19.432608;
                const baseLng = -99.133209;
                const offsetLat = (Math.random() - 0.5) * 0.5; // +/- 0.25 grados
                const offsetLng = (Math.random() - 0.5) * 0.5; // +/- 0.25 grados
                
                const lat = baseLat + offsetLat;
                const lng = baseLng + offsetLng;
                
                // Crear ubicación en Firestore
                firebase.firestore().collection('locations').add({
                  clientId: userId,
                  clientName: userData.name || 'Cliente',
                  type: userData.type || 'residential',
                  address: userData.address,
                  lat: lat.toString(),
                  lng: lng.toString(),
                  description: "Ubicación generada automáticamente",
                  status: "active",
                  lastCheck: new Date(),
                  createdAt: new Date()
                })
                .then(function(docRef) {
                  console.log("Ubicación creada para usuario:", userData.name);
                  
                  // Crear marcador
                  const marker = L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup(`
                      <strong>${userData.name || 'Cliente'}</strong><br>
                      ${userData.address || ''}<br>
                      <span class="status active">Activo</span>
                    `);
                  
                  // Guardar referencia al marcador
                  markers[docRef.id] = {
                    marker: marker,
                    status: 'active'
                  };
                })
                .catch(function(error) {
                  console.error("Error al crear ubicación:", error);
                });
              }
            });
          })
          .catch(function(error) {
            console.error("Error al obtener usuarios:", error);
          });
      }
      
      // Función para filtrar marcadores
      function filterMapMarkers(filter) {
        if (!dashboardMap) return;
        
        Object.keys(markers).forEach(id => {
          const marker = markers[id].marker;
          const status = markers[id].status;
          
          if (filter === 'all') {
            marker.addTo(dashboardMap);
          } else if (filter === 'active' && status === 'active') {
            marker.addTo(dashboardMap);
          } else if (filter === 'alert' && status === 'warning') {
            marker.addTo(dashboardMap);
          } else {
            dashboardMap.removeLayer(marker);
          }
        });
      }
      
      // Función para cargar lista de ubicaciones
      function loadLocationsList() {
        const locationsTable = document.getElementById('locations-table');
        if (!locationsTable) return;
        
        // Limpiar tabla
        locationsTable.innerHTML = '<tr><td colspan="7" class="loading-data">Cargando ubicaciones...</td></tr>';
        
        // Obtener ubicaciones desde Firestore
        firebase.firestore().collection('locations').get()
          .then(function(querySnapshot) {
            if (querySnapshot.empty) {
              locationsTable.innerHTML = '<tr><td colspan="7" class="no-data">No hay ubicaciones registradas</td></tr>';
              return;
            }
            
            locationsTable.innerHTML = '';
            
            querySnapshot.forEach(function(doc) {
              const locationData = doc.data();
              const locationId = doc.id;
              
              // Crear fila para la ubicación
              const row = document.createElement('tr');
              row.setAttribute('data-id', locationId);
              row.innerHTML = `
                <td>${locationId.substring(0, 8)}...</td>
                <td>${locationData.clientName || ''}</td>
                <td>${locationData.address || ''}</td>
                <td>${getLocationType(locationData.type || '')}</td>
                <td><span class="status ${locationData.status || 'active'}">${getStatusText(locationData.status || 'active')}</span></td>
                <td>${locationData.lastCheck ? formatDate(locationData.lastCheck.toDate()) : 'N/A'}</td>
                <td>
                  <button class="action-btn edit-location" data-id="${locationId}"><i class="fas fa-edit"></i></button>
                  <button class="action-btn delete-location" data-id="${locationId}"><i class="fas fa-trash"></i></button>
                </td>
              `;
              
              locationsTable.appendChild(row);
            });
            
            // Agregar event listeners para botones de eliminar
            document.querySelectorAll('.delete-location').forEach(button => {
              button.addEventListener('click', function() {
                const locationId = this.getAttribute('data-id');
                deleteLocation(locationId);
              });
            });
          })
          .catch(function(error) {
            console.error("Error al cargar ubicaciones:", error);
            locationsTable.innerHTML = `<tr><td colspan="7" class="error-data">Error al cargar datos: ${error.message}</td></tr>`;
          });
      }
      
      // Función para eliminar ubicación
      function deleteLocation(locationId) {
        if (confirm('¿Está seguro de eliminar esta ubicación? Esta acción no se puede deshacer.')) {
          firebase.firestore().collection('locations').doc(locationId).delete()
            .then(function() {
              showNotification('Ubicación eliminada correctamente', 'success');
              
              // Recargar lista de ubicaciones
              loadLocationsList();
              
              // Recargar mapas
              if (dashboardMap) {
                dashboardMap.remove();
                dashboardMap = null;
                initDashboardMap();
              }
              
              if (locationMap) {
                locationMap.remove();
                locationMap = null;
                initLocationMap();
              }
            })
            .catch(function(error) {
              console.error("Error al eliminar ubicación:", error);
              showNotification('Error al eliminar ubicación: ' + error.message, 'error');
            });
        }
      }
      
      // Manejar formulario de ubicación
      const locationForm = document.getElementById('add-location-form');
      if (locationForm) {
        // Cargar lista de clientes para el select
        const clientSelect = document.getElementById('location-client');
        if (clientSelect) {
          loadClientOptions(clientSelect);
        }
        
        // Manejar envío del formulario
        locationForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          // Obtener datos
          const clientId = document.getElementById('location-client').value;
          const type = document.getElementById('location-type').value;
          const address = document.getElementById('location-address').value;
          const lat = document.getElementById('location-lat').value;
          const lng = document.getElementById('location-lng').value;
          const description = document.getElementById('location-description').value;
          
          // Validación básica
          if (!clientId || !type || !address || !lat || !lng) {
            showNotification("Por favor complete todos los campos obligatorios", "warning");
            return;
          }
          
          // Obtener nombre del cliente para mostrar en el mapa
          firebase.firestore().collection('users').doc(clientId).get()
            .then(function(doc) {
              const clientName = doc.exists ? doc.data().name : 'Cliente';
              
              // Crear ubicación en Firestore
              return firebase.firestore().collection('locations').add({
                clientId: clientId,
                clientName: clientName,
                type: type,
                address: address,
                lat: lat,
                lng: lng,
                description: description || "",
                status: "active",
                lastCheck: new Date(),
                createdAt: new Date()
              });
            })
            .then(function() {
              // Éxito
              const modal = locationForm.closest('.modal');
              if (modal) modal.style.display = 'none';
              locationForm.reset();
              showNotification(`Ubicación agregada correctamente`, "success");
              
              // Recargar mapas y lista si están visibles
              if (!document.getElementById('ubicaciones-section').classList.contains('section-hide')) {
                if (locationMap) {
                  locationMap.remove();
                  locationMap = null;
                  initLocationMap();
                }
                loadLocationsList();
              }
              
              if (!document.getElementById('dashboard-section').classList.contains('section-hide')) {
                if (dashboardMap) {
                  dashboardMap.remove();
                  dashboardMap = null;
                  initDashboardMap();
                }
              }
            })
            .catch(function(error) {
              // Error
              console.error("Error:", error);
              showNotification("Error: " + error.message, "error");
            });
        });
      }
      
      // Función para cargar opciones de clientes en el select
      function loadClientOptions(selectElement) {
        // Limpiar opciones existentes excepto la primera
        while (selectElement.options.length > 1) {
          selectElement.remove(1);
        }
        
        // Cargar usuarios desde Firestore
        firebase.firestore().collection('users').get()
          .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
              const userData = doc.data();
              // Solo añadir si tiene nombre
              if (userData.name) {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = userData.name;
                selectElement.appendChild(option);
              }
            });
          })
          .catch(function(error) {
            console.error("Error al cargar usuarios:", error);
          });
      }
      
      // Función para mostrar notificaciones temporales
      function showNotification(message, type = 'info') {
        let notification = document.querySelector('.notification-popup');
  
        if (!notification) {
          notification = document.createElement('div');
          notification.className = 'notification-popup';
          document.body.appendChild(notification);
        }
  
        notification.className = `notification-popup ${type}`;
        notification.textContent = message;
        notification.style.display = 'block';
  
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            notification.style.display = 'none';
            notification.style.opacity = '1';
          }, 500);
        }, 3000);
      }
      
      // Inicializar mapas si están visibles al cargar la página
      if (!document.getElementById('dashboard-section').classList.contains('section-hide')) {
        setTimeout(initDashboardMap, 500);
      }
      
      if (!document.getElementById('ubicaciones-section').classList.contains('section-hide')) {
        setTimeout(initLocationMap, 500);
      }
    }
  });