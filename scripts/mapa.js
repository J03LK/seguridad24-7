// Inicializar mapa 3D
function initialize3DMap() {
    const mapContainer = document.getElementById('map');
    const mapLocationContainer = document.getElementById('map-location');
    
    // Configuración común para ambos mapas
    const mapConfig = {
        center: [19.4326, -99.1332], // CDMX como ejemplo
        initialZoom: 2
    };
    
    // Función para crear un mapa 3D
    function create3DMap(container, config) {
        if (!container) return null;
        
        // Dimensiones del contenedor
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Crear la escena Three.js
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111122); // Fondo oscuro
        
        // Crear cámara
        const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
        camera.position.z = 400;
        
        // Crear renderizador
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);
        
        // Crear luces
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Crear la tierra (esfera)
        const radius = 200;
        const earthGeometry = new THREE.SphereGeometry(radius, 64, 64);
        
        // Textura de la tierra (mapa oscuro)
        const textureLoader = new THREE.TextureLoader();
        const earthTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
        const earthMaterial = new THREE.MeshPhongMaterial({ 
            map: earthTexture,
            color: 0x333333, // Tono oscuro para simular el estilo oscuro
            specular: 0x333333,
            shininess: 15
        });
        
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);
        
        // Controles para rotar y hacer zoom
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = radius * 1.2;
        controls.maxDistance = radius * 4;
        
        // Crear marcadores para las ubicaciones
        const markers = [];
        const popupElement = document.createElement('div');
        popupElement.className = 'map-popup';
        popupElement.style.position = 'absolute';
        popupElement.style.display = 'none';
        popupElement.style.background = 'rgba(0, 0, 0, 0.8)';
        popupElement.style.color = '#fff';
        popupElement.style.padding = '10px';
        popupElement.style.borderRadius = '5px';
        popupElement.style.maxWidth = '250px';
        popupElement.style.zIndex = '1000';
        container.appendChild(popupElement);
        
        // Función para convertir coordenadas a posición en la esfera 3D
        function latLngToVector3(lat, lng, radius) {
            const phi = (90 - lat) * Math.PI / 180;
            const theta = (lng + 180) * Math.PI / 180;
            
            return new THREE.Vector3(
                -radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.sin(theta)
            );
        }
        
        // Crear marcadores desde los datos de ubicaciones
        DEMO_DATA.locations.forEach(location => {
            // Determinar color según estado
            let color = 0x00FFC2; // Default: activo
            let pulseSpeed = 0; // Sin pulso por defecto
            
            if (location.status === 'warning') {
                color = 0xFFD700; // Amarillo para advertencia
                pulseSpeed = 2.0;
            } else if (location.status === 'inactive') {
                color = 0xe74c3c; // Rojo para inactivo
                pulseSpeed = 0.5;
            } else {
                pulseSpeed = 1.0; // Pulso normal para activos
            }
            
            // Crear geometría para el marcador
            const markerGeometry = new THREE.SphereGeometry(2, 16, 16);
            const markerMaterial = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            });
            
            // Crear marcador y posicionarlo
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            const position = latLngToVector3(location.lat, location.lng, radius + 1);
            marker.position.copy(position);
            
            // Crear efecto de halo para el marcador
            const glowGeometry = new THREE.SphereGeometry(3, 16, 16);
            const glowMaterial = new THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: 0.3
            });
            
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            marker.add(glow);
            
            // Guardar datos para interacción
            marker.userData = {
                location: location,
                baseScale: 1,
                pulseSpeed: pulseSpeed,
                phase: Math.random() * Math.PI * 2 // Fase aleatoria para que no pulsen todos al mismo tiempo
            };
            
            // Añadir a la escena y al array de marcadores
            scene.add(marker);
            markers.push(marker);
        });
        
        // Raycaster para detectar clics en marcadores
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let selectedMarker = null;
        
        // Event listener para detectar clics
        container.addEventListener('click', function(event) {
            // Calcular posición del mouse en coordenadas normalizadas (-1 a +1)
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            // Actualizar el raycaster
            raycaster.setFromCamera(mouse, camera);
            
            // Comprobar intersecciones con marcadores
            const intersects = raycaster.intersectObjects(markers);
            
            if (intersects.length > 0) {
                selectedMarker = intersects[0].object;
                const location = selectedMarker.userData.location;
                
                // Mostrar popup
                const popupContent = `
                    <strong>Cliente:</strong> ${location.client}<br>
                    <strong>Dirección:</strong> ${location.address}<br>
                    <strong>Tipo:</strong> ${location.type}<br>
                    <strong>Estado:</strong> ${getStatusText(location.status)}<br>
                    <strong>Última revisión:</strong> ${location.lastCheck}
                `;
                
                popupElement.innerHTML = popupContent;
                popupElement.style.display = 'block';
                
                // Posicionar el popup cerca del cursor
                popupElement.style.left = (event.clientX - rect.left) + 'px';
                popupElement.style.top = (event.clientY - rect.top) + 'px';
            } else {
                // Ocultar popup si se hace clic en cualquier otro lugar
                popupElement.style.display = 'none';
                selectedMarker = null;
            }
        });
        
        // Función para animar los marcadores
        function animateMarkers(time) {
            markers.forEach(marker => {
                const userData = marker.userData;
                
                if (userData.pulseSpeed > 0) {
                    // Calcular escala basada en el tiempo
                    const pulse = 0.5 + Math.sin(time * 0.001 * userData.pulseSpeed + userData.phase) * 0.5;
                    const scale = userData.baseScale * (1 + pulse * 0.5);
                    
                    // Aplicar escala
                    marker.scale.set(scale, scale, scale);
                    
                    // Intensidad emisiva basada en el pulso
                    marker.material.emissiveIntensity = 0.5 + pulse * 0.5;
                    
                    // Opacidad del halo
                    if (marker.children[0]) {
                        marker.children[0].material.opacity = 0.3 * pulse;
                        marker.children[0].scale.set(1 + pulse * 0.5, 1 + pulse * 0.5, 1 + pulse * 0.5);
                    }
                }
            });
        }
        
        // Filtros de mapa
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (filterButtons) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const filter = this.getAttribute('data-filter');
                    
                    // Actualizar botones
                    filterButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Aplicar filtro a los marcadores
                    markers.forEach(marker => {
                        const status = marker.userData.location.status;
                        
                        if (filter === 'all' || status === filter) {
                            marker.visible = true;
                        } else {
                            marker.visible = false;
                        }
                    });
                });
            });
        }
        
        // Función de animación
        function animate(time) {
            requestAnimationFrame(animate);
            
            // Animar marcadores
            animateMarkers(time);
            
            // Rotación lenta automática cuando no hay interacción
            if (!controls.enableDamping) {
                earth.rotation.y += 0.0005;
            }
            
            controls.update();
            renderer.render(scene, camera);
        }
        
        // Iniciar animación
        animate(0);
        
        // Manejar cambio de tamaño de ventana
        window.addEventListener('resize', function() {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            
            renderer.setSize(newWidth, newHeight);
        });
        
        return { scene, camera, renderer, earth, markers };
    }
    
    // Crear mapas 3D en los contenedores
    const map3D = create3DMap(mapContainer, mapConfig);
    const mapLocation3D = create3DMap(mapLocationContainer, mapConfig);
}

// Función auxiliar para mostrar el texto del estado
function getStatusText(status) {
    switch(status) {
        case 'active': return 'Activo';
        case 'warning': return 'Advertencia';
        case 'inactive': return 'Inactivo';
        default: return status;
    }
}

// Datos de demostración
const DEMO_DATA = {
    locations: [
        {
            client: "Empresa A",
            address: "Av. Reforma 123, CDMX",
            type: "Oficina Central",
            status: "active",
            lastCheck: "2023-10-15",
            lat: 19.4326,
            lng: -99.1332
        },
        {
            client: "Empresa B",
            address: "Calle Juárez 456, Guadalajara",
            type: "Sucursal",
            status: "warning",
            lastCheck: "2023-10-12",
            lat: 20.6597,
            lng: -103.3496
        },
        {
            client: "Empresa C",
            address: "Blvd. Kukulcán 789, Cancún",
            type: "Oficina Regional",
            status: "inactive",
            lastCheck: "2023-10-08",
            lat: 21.1619,
            lng: -86.8515
        },
        {
            client: "Empresa D",
            address: "Paseo de Montejo 567, Mérida",
            type: "Sucursal",
            status: "active",
            lastCheck: "2023-10-14",
            lat: 20.9798,
            lng: -89.6245
        },
        {
            client: "Empresa E",
            address: "Av. Universidad 890, Monterrey",
            type: "Centro Operativo",
            status: "warning",
            lastCheck: "2023-10-10",
            lat: 25.6866,
            lng: -100.3161
        }
    ]
};

// Inicializar el mapa cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que Three.js esté disponible
    if (typeof THREE === 'undefined') {
        console.error('Three.js no está cargado. Asegúrate de incluir la biblioteca.');
        return;
    }
    
    // Verificar que OrbitControls esté disponible
    if (typeof THREE.OrbitControls === 'undefined') {
        console.error('OrbitControls no está cargado. Se requiere para la interacción con el mapa 3D.');
        return;
    }
    
    // Inicializar el mapa 3D
    initialize3DMap();
});

// CSS adicional para los elementos del mapa
const style = document.createElement('style');
style.textContent = `
.map-popup {
    background: rgba(0, 10, 20, 0.8);
    border: 1px solid #00FFC2;
    box-shadow: 0 0 10px rgba(0, 255, 194, 0.5);
    border-radius: 5px;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    transition: all 0.3s ease;
}

.filter-btn {
    background: rgba(0, 10, 20, 0.8);
    border: 1px solid #666;
    color: white;
    padding: 5px 10px;
    margin: 5px;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.filter-btn.active {
    background: #00FFC2;
    color: #000;
    border-color: #00FFC2;
    box-shadow: 0 0 10px rgba(0, 255, 194, 0.5);
}
`;
document.head.appendChild(style);