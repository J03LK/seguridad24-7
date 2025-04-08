// Función para convertir códigos de estado a texto
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

// Datos quemados para demostración
const DEMO_DATA = {
    // Datos de usuarios
    users: [
        { id: 1, name: 'Juan Pérez Gómez', email: 'jperez@example.com', phone: '555-1234', address: 'Calle Norte 45, Col. Centro', status: 'active', type: 'residential', lastVisit: '2023-10-15' },
        { id: 2, name: 'María López Sánchez', email: 'mlopez@example.com', phone: '555-2345', address: 'Av. Sur 78, Col. Reforma', status: 'active', type: 'residential', lastVisit: '2023-10-12' },
        { id: 3, name: 'Carlos Gómez Ruiz', email: 'cgomez@example.com', phone: '555-3456', address: 'Calle Este 32, Col. Industrial', status: 'inactive', type: 'commercial', lastVisit: '2023-09-28' },
        { id: 4, name: 'Ana Rodríguez Vidal', email: 'arodriguez@example.com', phone: '555-4567', address: 'Av. Oeste 21, Col. Jardines', status: 'active', type: 'residential', lastVisit: '2023-10-10' },
        { id: 5, name: 'Roberto Díaz Mendoza', email: 'rdiaz@example.com', phone: '555-5678', address: 'Calle Centro 10, Col. Roma', status: 'warning', type: 'industrial', lastVisit: '2023-10-08' },
        { id: 6, name: 'Empresa ABC S.A.', email: 'contacto@abc.com', phone: '555-9876', address: 'Parque Industrial 123, Nave 5', status: 'active', type: 'industrial', lastVisit: '2023-10-14' },
        { id: 7, name: 'Comercial XYZ', email: 'info@comercialxyz.com', phone: '555-8765', address: 'Plaza Comercial, Local 45', status: 'active', type: 'commercial', lastVisit: '2023-10-11' },
        { id: 8, name: 'Laura Martínez Cruz', email: 'lmartinez@example.com', phone: '555-7654', address: 'Calle Girasoles 87, Col. Flores', status: 'inactive', type: 'residential', lastVisit: '2023-09-20' },
        { id: 9, name: 'Miguel Ángel Torres', email: 'mtorres@example.com', phone: '555-6543', address: 'Av. Principal 210, Col. Vista', status: 'warning', type: 'residential', lastVisit: '2023-10-05' },
        { id: 10, name: 'Hotel Sol Naciente', email: 'reservas@solnaciente.com', phone: '555-5432', address: 'Blvd. Turístico 1050', status: 'active', type: 'commercial', lastVisit: '2023-10-09' }
    ],
    
    // Datos de productos
    products: [
        { id: 1, name: 'Cámara HD 1080p Interior', category: 'Cámaras', stock: 25, price: 1200, status: 'active', description: 'Cámara de seguridad interior con visión nocturna y detección de movimiento.' },
        { id: 2, name: 'Cámara 4K Exterior 360°', category: 'Cámaras', stock: 15, price: 2500, status: 'active', description: 'Cámara exterior resistente a la intemperie con rotación 360° y zoom 4x.' },
        { id: 3, name: 'Cerco eléctrico 5m', category: 'Cercos', stock: 8, price: 1800, status: 'warning', description: 'Kit de cerco eléctrico para perímetro de 5 metros con alarma.' },
        { id: 4, name: 'Batería de respaldo 24h', category: 'Baterías', stock: 20, price: 950, status: 'active', description: 'Batería de respaldo para sistemas de seguridad, duración de 24 horas.' },
        { id: 5, name: 'Kit alarma inalámbrica', category: 'Alarmas', stock: 12, price: 1500, status: 'active', description: 'Kit completo de alarma inalámbrica con 3 sensores y sirena.' },
        { id: 6, name: 'DVR 8 canales', category: 'Grabación', stock: 10, price: 3200, status: 'active', description: 'Grabador digital para 8 cámaras con 2TB de almacenamiento.' },
        { id: 7, name: 'Sensor de movimiento exterior', category: 'Sensores', stock: 30, price: 450, status: 'active', description: 'Sensor de movimiento para exterior, resistente al agua.' },
        { id: 8, name: 'Cerradura inteligente', category: 'Accesos', stock: 5, price: 2800, status: 'warning', description: 'Cerradura con reconocimiento facial, huella y código.' },
        { id: 9, name: 'Interruptor inteligente WiFi', category: 'Domótica', stock: 18, price: 680, status: 'active', description: 'Control remoto de iluminación y electrodomésticos vía WiFi.' },
        { id: 10, name: 'Kit videointercom', category: 'Intercom', stock: 7, price: 3500, status: 'active', description: 'Sistema de videoportero con pantalla táctil y app móvil.' },
        { id: 11, name: 'Cerco eléctrico 10m', category: 'Cercos', stock: 4, price: 3200, status: 'warning', description: 'Kit de cerco eléctrico para perímetro de 10 metros con alarma integrada.' },
        { id: 12, name: 'Batería solar 48h', category: 'Baterías', stock: 6, price: 2100, status: 'active', description: 'Batería con panel solar integrado para sistemas de seguridad.' },
        { id: 13, name: 'Cámara IP WiFi 2MP', category: 'Cámaras', stock: 22, price: 890, status: 'active', description: 'Cámara IP con conectividad WiFi, 2MP y audio bidireccional.' },
        { id: 14, name: 'Detector de humo inteligente', category: 'Sensores', stock: 15, price: 750, status: 'active', description: 'Detector de humo conectado con alertas al smartphone.' },
        { id: 15, name: 'Cable CCTV 100m', category: 'Accesorios', stock: 8, price: 580, status: 'active', description: 'Rollo de cable CCTV de 100 metros con alimentación.' }
    ],
    
    // Datos de ubicaciones
    locations: [
        { 
            id: 1, 
            client: 'Juan Pérez Gómez', 
            address: 'Av. Amazonas N36-83 y Naciones Unidas, Sector Iñaquito', 
            type: 'Residencial', 
            status: 'active', 
            lastCheck: '2023-10-15', 
            lat: -0.1807, 
            lng: -78.4830 
        },
        { 
            id: 2, 
            client: 'María López Sánchez', 
            address: 'Av. República de El Salvador y Suecia, Sector La Carolina', 
            type: 'Residencial', 
            status: 'warning', 
            lastCheck: '2023-10-14', 
            lat: -0.1839, 
            lng: -78.4819 
        },
        { 
            id: 3, 
            client: 'Empresa ABC S.A.', 
            address: 'Parque Industrial Turubamba, Av. Maldonado Km. 7.5', 
            type: 'Industrial', 
            status: 'inactive', 
            lastCheck: '2023-10-10', 
            lat: -0.3109, 
            lng: -78.5506 
        },
        { 
            id: 4, 
            client: 'Ana Rodríguez Vidal', 
            address: 'Av. González Suárez y Coruña, Sector González Suárez', 
            type: 'Residencial', 
            status: 'active', 
            lastCheck: '2023-10-13', 
            lat: -0.1935, 
            lng: -78.4771 
        },
        { 
            id: 5, 
            client: 'Comercial XYZ', 
            address: 'Centro Comercial Quicentro Shopping, Av. Naciones Unidas', 
            type: 'Comercial', 
            status: 'active', 
            lastCheck: '2023-10-15', 
            lat: -0.1767, 
            lng: -78.4848 
        },
        { 
            id: 6, 
            client: 'Hotel Plaza Grande', 
            address: 'García Moreno y Chile, Centro Histórico', 
            type: 'Comercial', 
            status: 'active', 
            lastCheck: '2023-10-12', 
            lat: -0.2201, 
            lng: -78.5120 
        },
        { 
            id: 7, 
            client: 'Roberto Díaz Mendoza', 
            address: 'Av. De los Shyris y Av. Eloy Alfaro, Sector El Batán', 
            type: 'Residencial', 
            status: 'warning', 
            lastCheck: '2023-10-11', 
            lat: -0.1734, 
            lng: -78.4795 
        },
        { 
            id: 8, 
            client: 'Miguel Ángel Torres', 
            address: 'Av. Colón y Reina Victoria, Sector La Mariscal', 
            type: 'Residencial', 
            status: 'active', 
            lastCheck: '2023-10-14', 
            lat: -0.2010, 
            lng: -78.4902 
        },
        { 
            id: 9, 
            client: 'Universidad Central', 
            address: 'Av. América y Av. Universitaria, Sector Miraflores', 
            type: 'Comercial', 
            status: 'active', 
            lastCheck: '2023-10-13', 
            lat: -0.1978, 
            lng: -78.5050 
        },
        { 
            id: 10, 
            client: 'Centro Comercial El Jardín', 
            address: 'Av. Amazonas N6-114 y Av. República, Sector La Carolina', 
            type: 'Comercial', 
            status: 'active', 
            lastCheck: '2023-10-17', 
            lat: -0.1912, 
            lng: -78.4848 
        },
        { 
            id: 11, 
            client: 'Parque Industrial Calacalí', 
            address: 'Av. Manuel Córdova Galarza Km. 15, Calacalí', 
            type: 'Industrial', 
            status: 'warning', 
            lastCheck: '2023-10-03', 
            lat: -0.0008, 
            lng: -78.5148 
        },
        { 
            id: 12, 
            client: 'Condominio Los Álamos', 
            address: 'Cumbayá, Av. Interoceánica y Vía Láctea', 
            type: 'Residencial', 
            status: 'active', 
            lastCheck: '2023-10-15', 
            lat: -0.2091, 
            lng: -78.4270 
        }
    ],
    
    // Datos de pagos
    payments: [
        { invoice: 'F-2023-001', client: 'Juan Pérez Gómez', amount: 2500, date: '2023-10-15', method: 'Tarjeta', status: 'active', description: 'Servicio mensual de monitoreo' },
        { invoice: 'F-2023-002', client: 'María López Sánchez', amount: 1800, date: '2023-10-14', method: 'Efectivo', status: 'active', description: 'Instalación de cámaras' },
        { invoice: 'F-2023-003', client: 'Empresa ABC S.A.', amount: 5200, date: '2023-10-12', method: 'Transferencia', status: 'active', description: 'Mantenimiento trimestral' },
        { invoice: 'F-2023-004', client: 'Ana Rodríguez Vidal', amount: 1500, date: '2023-10-10', method: 'Tarjeta', status: 'warning', description: 'Servicio mensual - Pago parcial' },
        { invoice: 'F-2023-005', client: 'Comercial XYZ', amount: 3800, date: '2023-10-08', method: 'Transferencia', status: 'inactive', description: 'Reparación sistema de alarma' },
        { invoice: 'F-2023-006', client: 'Roberto Díaz Mendoza', amount: 1950, date: '2023-10-05', method: 'Efectivo', status: 'active', description: 'Instalación cerco eléctrico' },
        { invoice: 'F-2023-007', client: 'Hotel Sol Naciente', amount: 7500, date: '2023-10-03', method: 'Transferencia', status: 'active', description: 'Sistema completo de seguridad' },
        { invoice: 'F-2023-008', client: 'Laura Martínez Cruz', amount: 1200, date: '2023-09-30', method: 'Tarjeta', status: 'active', description: 'Servicio trimestral de monitoreo' },
        { invoice: 'F-2023-009', client: 'Miguel Ángel Torres', amount: 2300, date: '2023-09-28', method: 'Efectivo', status: 'active', description: 'Actualización de cámaras' },
        { invoice: 'F-2023-010', client: 'Empresa ABC S.A.', amount: 4500, date: '2023-09-25', method: 'Transferencia', status: 'active', description: 'Ampliación de sistema' }
    ],
    
    // Datos de alertas
    alerts: [
        { id: 'A-001', client: 'Juan Pérez Gómez', location: 'Calle Norte 45, Col. Centro', type: 'Movimiento', date: '2023-10-15 15:30', status: 'warning', details: 'Detección de movimiento en zona restringida' },
        { id: 'A-002', client: 'María López Sánchez', location: 'Av. Sur 78, Col. Reforma', type: 'Batería baja', date: '2023-10-14 10:45', status: 'active', details: 'Batería al 15% en sensor principal' },
        { id: 'A-003', client: 'Empresa ABC S.A.', location: 'Parque Industrial 123, Nave 5', type: 'Conexión perdida', date: '2023-10-13 22:15', status: 'inactive', details: 'Pérdida de señal por más de 30 minutos' },
        { id: 'A-004', client: 'Ana Rodríguez Vidal', location: 'Av. Oeste 21, Col. Jardines', type: 'Movimiento', date: '2023-10-12 03:20', status: 'warning', details: 'Movimiento detectado en horario nocturno' },
        { id: 'A-005', client: 'Comercial XYZ', location: 'Plaza Comercial, Local 45', type: 'Alarma activada', date: '2023-10-11 18:05', status: 'active', details: 'Activación manual de botón de pánico' },
        { id: 'A-006', client: 'Hotel Sol Naciente', location: 'Blvd. Turístico 1050', type: 'Humo detectado', date: '2023-10-11 12:35', status: 'warning', details: 'Sensor de humo activado en cocina' },
        { id: 'A-007', client: 'Roberto Díaz Mendoza', location: 'Calle Centro 10, Col. Roma', type: 'Cerco violado', date: '2023-10-10 23:45', status: 'warning', details: 'Interrupción en la continuidad del cerco eléctrico' },
        { id: 'A-008', client: 'Miguel Ángel Torres', location: 'Av. Principal 210, Col. Vista', type: 'Puerta abierta', date: '2023-10-09 07:15', status: 'active', details: 'Puerta principal abierta por más de 10 minutos' },
        { id: 'A-009', client: 'Laura Martínez Cruz', location: 'Calle Girasoles 87, Col. Flores', type: 'Fallo eléctrico', date: '2023-10-08 16:20', status: 'inactive', details: 'Sistema operando con batería de respaldo' },
        { id: 'A-010', client: 'Empresa ABC S.A.', location: 'Parque Industrial 123, Nave 5', type: 'Vidrio roto', date: '2023-10-07 02:10', status: 'active', details: 'Sensor de ruptura de vidrio activado en ventana trasera' }
    ],
    
    // Datos de actividades recientes
    recentActivities: [
        { icon: 'fas fa-bell', class: 'warning', title: 'Alerta en Calle Norte 45', time: 'Hace 10 minutos', details: 'Detección de movimiento anómalo' },
        { icon: 'fas fa-user-plus', class: '', title: 'Nuevo cliente registrado', time: 'Hace 2 horas', details: 'Laura Martínez se ha registrado como nuevo cliente' },
        { icon: 'fas fa-tools', class: 'success', title: 'Instalación completada', time: 'Hace 5 horas', details: 'Sistema instalado en Hotel Sol Naciente' },
        { icon: 'fas fa-video', class: '', title: 'Cámaras actualizadas', time: 'Hace 1 día', details: 'Actualización de firmware en cámaras del sistema' },
        { icon: 'fas fa-wrench', class: 'warning', title: 'Mantenimiento programado', time: 'Hace 2 días', details: 'Mantenimiento para sistema en Comercial XYZ' },
        { icon: 'fas fa-mobile-alt', class: 'success', title: 'Nueva app lanzada', time: 'Hace 3 días', details: 'Versión 2.5 de la app móvil disponible' },
        { icon: 'fas fa-exclamation-triangle', class: 'warning', title: 'Alerta en Plaza Comercial', time: 'Hace 4 días', details: 'Múltiples alertas registradas en horario nocturno' }
    ],
    
    // Datos para estadísticas
    statistics: {
        clientesActivos: 148,
        serviciosInstalados: 237,
        alertasActuales: 12,
        ingresosMensuales: 243500,
        camarasStock: 85,
        cercosStock: 32,
        bateriasStock: 56,
        otrosStock: 42,
        ingresosMes: 243500,
        pagosPendientes: 18,
        facturasMes: 42,
        serviciosActivos: 189,
        totalInstalaciones: 237,
        alertasAtendidas: 53,
        totalMantenimientos: 128,
        nuevosClientes: 27
    },
    
    // Datos para gráficos
    chartData: {
        performance: {
            alertas: [12, 15, 10, 8, 7, 5, 9, 11, 14, 12, 8, 12],
            servicios: [120, 132, 145, 160, 178, 190, 210, 225, 240, 255, 270, 282]
        },
        finances: {
            ingresos: [150000, 180000, 165000, 210000, 240000, 225000, 255000, 270000, 285000, 300000, 315000, 330000],
            gastos: [90000, 105000, 85000, 120000, 145000, 130000, 150000, 165000, 175000, 190000, 200000, 210000]
        },
        services: [45, 25, 20, 10],
        annual: {
            anterior: [120000, 135000, 140000, 155000, 160000, 175000, 180000, 185000, 190000, 205000, 210000, 230000],
            actual: [140000, 160000, 180000, 200000, 220000, 240000, 250000, 265000, 280000, 295000, 310000, 325000]
        }
    }
};

// Inicializar gráficos
function initializeCharts() {
    // Gráfico de rendimiento (línea)
    const perfCtx = document.getElementById('performance-chart');
    if (perfCtx) {
        const perfChart = new Chart(perfCtx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                datasets: [{
                    label: 'Alertas',
                    data: DEMO_DATA.chartData.performance.alertas,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Servicios',
                    data: DEMO_DATA.chartData.performance.servicios,
                    borderColor: '#00FFC2',
                    backgroundColor: 'rgba(0, 255, 194, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a0a8b3'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#a0a8b3'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#a0a8b3'
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico de finanzas (barras)
    const financeCtx = document.getElementById('finance-chart');
    if (financeCtx) {
        const financeChart = new Chart(financeCtx, {
            type: 'bar',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                datasets: [{
                    label: 'Ingresos',
                    data: DEMO_DATA.chartData.finances.ingresos,
                    backgroundColor: '#0094FF',
                }, {
                    label: 'Gastos',
                    data: DEMO_DATA.chartData.finances.gastos,
                    backgroundColor: '#a0a8b3',
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a0a8b3'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#a0a8b3'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#a0a8b3'
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico de servicios (donut)
    const servicesCtx = document.getElementById('services-chart');
    if (servicesCtx) {
        const servicesChart = new Chart(servicesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Cámaras', 'Cercos', 'Alarmas', 'Otros'],
                datasets: [{
                    data: DEMO_DATA.chartData.services,
                    backgroundColor: ['#0094FF', '#00FFC2', '#FFD700', '#a0a8b3'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#a0a8b3'
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
    
    // Gráfico anual (área)
    const annualCtx = document.getElementById('annual-chart');
    if (annualCtx) {
        const annualChart = new Chart(annualCtx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                datasets: [{
                    label: 'Ventas 2022',
                    data: DEMO_DATA.chartData.annual.anterior,
                    borderColor: '#a0a8b3',
                    backgroundColor: 'rgba(160, 168, 179, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Ventas 2023',
                    data: DEMO_DATA.chartData.annual.actual,
                    borderColor: '#0094FF',
                    backgroundColor: 'rgba(0, 148, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a0a8b3'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#a0a8b3'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#a0a8b3'
                        }
                    }
                }
            }
        });
    }
}

// Inicializar mapa
function initializeMap() {
    const mapContainer = document.getElementById('map');
    const mapLocationContainer = document.getElementById('map-location');
    
    // Configuración común para ambos mapas
    const mapConfig = {
        center: [19.4326, -99.1332], // CDMX como ejemplo
        zoom: 12,
        attributionControl: false
    };
    
    // Estilo personalizado para el mapa (oscuro)
    const mapStyle = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    
    // Crear mapas si existen los contenedores
    if (mapContainer) {
        const map = L.map(mapContainer, mapConfig);
        
        // Añadir capa base
        L.tileLayer(mapStyle, {
            maxZoom: 19
        }).addTo(map);
        
        // Crear marcadores desde los datos de ubicaciones
        DEMO_DATA.locations.forEach(location => {
            // Determinar color según estado
            let color = '#00FFC2'; // Default: activo
            let pulse = false;
            
            if (location.status === 'warning') {
                color = '#FFD700'; // Amarillo para advertencia
                pulse = true;
            } else if (location.status === 'inactive') {
                color = '#e74c3c'; // Rojo para inactivo
            }
            
            // Crear el popup con información
            const popupContent = `
                <strong>Cliente:</strong> ${location.client}<br>
                <strong>Dirección:</strong> ${location.address}<br>
                <strong>Tipo:</strong> ${location.type}<br>
                <strong>Estado:</strong> ${getStatusText(location.status)}<br>
                <strong>Última revisión:</strong> ${location.lastCheck}
            `;
            
            // Crear estilo para el marcador
            const markerIcon = L.divIcon({
                className: pulse ? 'custom-marker blink' : 'custom-marker',
                html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            // Crear marcador y añadir al mapa
            L.marker([location.lat, location.lng], { icon: markerIcon })
                .addTo(map)
                .bindPopup(popupContent);
        });
        
        // Filtros de mapa
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (filterButtons) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const filter = this.getAttribute('data-filter');
                    
                    // Actualizar botones
                    filterButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    // En una implementación real, aquí se filtrarían los marcadores
                    // Para la demo, solo mostramos un mensaje
                    console.log(`Filtro aplicado: ${filter}`);
                });
            });
        }
    }
    
    // Duplicar configuración para el mapa de la sección de ubicaciones
    if (mapLocationContainer) {
        const mapLocation = L.map(mapLocationContainer, mapConfig);
        
       // Añadir capa base
       L.tileLayer(mapStyle, {
        maxZoom: 19
    }).addTo(mapLocation);
    
    // Crear marcadores desde los datos de ubicaciones
    DEMO_DATA.locations.forEach(location => {
        // Determinar color según estado
        let color = '#00FFC2'; // Default: activo
        let pulse = false;
        
        if (location.status === 'warning') {
            color = '#FFD700'; // Amarillo para advertencia
            pulse = true;
        } else if (location.status === 'inactive') {
            color = '#e74c3c'; // Rojo para inactivo
        }
        
        // Crear el popup con información
        const popupContent = `
            <strong>Cliente:</strong> ${location.client}<br>
            <strong>Dirección:</strong> ${location.address}<br>
            <strong>Tipo:</strong> ${location.type}<br>
            <strong>Estado:</strong> ${getStatusText(location.status)}<br>
            <strong>Última revisión:</strong> ${location.lastCheck}
        `;
        
        // Crear estilo para el marcador
        const markerIcon = L.divIcon({
            className: pulse ? 'custom-marker blink' : 'custom-marker',
            html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        // Crear marcador y añadir al mapa
        L.marker([location.lat, location.lng], { icon: markerIcon })
            .addTo(mapLocation)
            .bindPopup(popupContent);
    });
}
}

// Inicialización de datos de muestra
function initializeSampleData() {
// Estadísticas del dashboard
document.getElementById('clientes-activos').textContent = DEMO_DATA.statistics.clientesActivos;
document.getElementById('servicios-instalados').textContent = DEMO_DATA.statistics.serviciosInstalados;
document.getElementById('alertas-actuales').textContent = DEMO_DATA.statistics.alertasActuales;
document.getElementById('ingresos-mensuales').textContent = formatCurrency(DEMO_DATA.statistics.ingresosMensuales);

// Estadísticas de productos
document.getElementById('camaras-stock').textContent = DEMO_DATA.statistics.camarasStock;
document.getElementById('cercos-stock').textContent = DEMO_DATA.statistics.cercosStock;
document.getElementById('baterias-stock').textContent = DEMO_DATA.statistics.bateriasStock;
document.getElementById('otros-stock').textContent = DEMO_DATA.statistics.otrosStock;

// Estadísticas de pagos
document.getElementById('ingresos-mes').textContent = formatCurrency(DEMO_DATA.statistics.ingresosMes);
document.getElementById('pagos-pendientes').textContent = DEMO_DATA.statistics.pagosPendientes;
document.getElementById('facturas-mes').textContent = DEMO_DATA.statistics.facturasMes;
document.getElementById('servicios-activos').textContent = DEMO_DATA.statistics.serviciosActivos;

// Estadísticas de reportes
document.getElementById('total-instalaciones').textContent = DEMO_DATA.statistics.totalInstalaciones;
document.getElementById('alertas-atendidas').textContent = DEMO_DATA.statistics.alertasAtendidas;
document.getElementById('total-mantenimientos').textContent = DEMO_DATA.statistics.totalMantenimientos;
document.getElementById('nuevos-clientes').textContent = DEMO_DATA.statistics.nuevosClientes;

// Actividades recientes
const activityList = document.getElementById('activity-list');
if (activityList) {
    activityList.innerHTML = DEMO_DATA.recentActivities.map(activity => `
        <li class="activity-item">
            <div class="activity-icon ${activity.class}">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </li>
    `).join('');
}

// Tablas de muestra
initializeSampleTables();
}

// Inicialización de tablas de muestra
function initializeSampleTables() {
// Tabla de usuarios
const usersTable = document.getElementById('users-table');
if (usersTable) {
    usersTable.innerHTML = DEMO_DATA.users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.address}</td>
            <td><span class="status ${user.status}">${getStatusText(user.status)}</span></td>
            <td>
                <div class="table-actions">
                    <button title="Editar"><i class="fas fa-edit"></i></button>
                    <button title="Ver detalles"><i class="fas fa-eye"></i></button>
                    <button title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Llenar los selects de clientes para los formularios
    fillClientSelects(DEMO_DATA.users);
}

// Tabla de pagos
const paymentsTable = document.getElementById('payments-table');
if (paymentsTable) {
    paymentsTable.innerHTML = DEMO_DATA.payments.map(payment => `
        <tr>
            <td>${payment.invoice}</td>
            <td>${payment.client}</td>
            <td>${formatCurrency(payment.amount)}</td>
            <td>${payment.date}</td>
            <td>${payment.method}</td>
            <td><span class="status ${payment.status}">${getStatusText(payment.status)}</span></td>
            <td>
                <div class="table-actions">
                    <button title="Ver detalles"><i class="fas fa-eye"></i></button>
                    <button title="Descargar factura"><i class="fas fa-file-pdf"></i></button>
                    <button title="Enviar por email"><i class="fas fa-envelope"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Tabla de alertas
const alertsTable = document.getElementById('alerts-table');
if (alertsTable) {
    alertsTable.innerHTML = DEMO_DATA.alerts.map(alert => `
        <tr>
            <td>${alert.id}</td>
            <td>${alert.client}</td>
            <td>${alert.location}</td>
            <td>${alert.type}</td>
            <td>${alert.date}</td>
            <td><span class="status ${alert.status}">${getStatusText(alert.status)}</span></td>
            <td>
                <div class="table-actions">
                    <button title="Ver detalles"><i class="fas fa-eye"></i></button>
                    <button title="Atender"><i class="fas fa-check-circle"></i></button>
                    <button title="Reportar"><i class="fas fa-flag"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Tabla de productos
const productsTable = document.getElementById('products-table');
if (productsTable) {
    productsTable.innerHTML = DEMO_DATA.products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock}</td>
            <td>${formatCurrency(product.price)}</td>
            <td><span class="status ${product.status}">${getStatusText(product.status)}</span></td>
            <td>
                <div class="table-actions">
                    <button title="Editar"><i class="fas fa-edit"></i></button>
                    <button title="Ver detalles"><i class="fas fa-eye"></i></button>
                    <button title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Tabla de ubicaciones
const locationsTable = document.getElementById('locations-table');
if (locationsTable) {
    locationsTable.innerHTML = DEMO_DATA.locations.map(location => `
        <tr>
            <td>${location.id}</td>
            <td>${location.client}</td>
            <td>${location.address}</td>
            <td>${location.type}</td>
            <td><span class="status ${location.status}">${getStatusText(location.status)}</span></td>
            <td>${location.lastCheck}</td>
            <td>
                <div class="table-actions">
                    <button title="Editar"><i class="fas fa-edit"></i></button>
                    <button title="Ver en mapa"><i class="fas fa-map-marker-alt"></i></button>
                    <button title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}
}

// Llenar selectores de clientes en formularios
function fillClientSelects(users) {
const clientSelects = [
    document.getElementById('location-client'),
    document.getElementById('payment-client')
];

const options = users.map(user => 
    `<option value="${user.id}">${user.name}</option>`
).join('');

clientSelects.forEach(select => {
    if (select) {
        select.innerHTML = '<option value="">Seleccionar Cliente</option>' + options;
    }
});
}

// Configuración básica del dashboard
document.addEventListener('DOMContentLoaded', function() {
// Botón de menú para responsive
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');

if (menuToggle) {
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });
}

// Cerrar sidebar al hacer clic en cualquier lugar fuera del sidebar en vista móvil
document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        e.target !== menuToggle &&
        sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
});

// Navegación
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('main section');

navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Activar enlace seleccionado
        navLinks.forEach(link => link.classList.remove('active'));
        this.classList.add('active');
        
        // Mostrar sección correspondiente
        const sectionId = this.getAttribute('data-section');
        if (sectionId) {
            sections.forEach(section => {
                section.classList.add('section-hide');
                if (section.id === sectionId) {
                    section.classList.remove('section-hide');
                }
            });
        }
        
        // Cerrar sidebar en móvil al seleccionar una opción
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    });
});

// Modales
const modals = document.querySelectorAll('.modal');
const modalTriggers = {
    'add-user-btn': 'add-user-modal',
    'add-product-btn': 'add-product-modal',
    'add-location-btn': 'add-location-modal',
    'add-location-btn-2': 'add-location-modal',
    'add-payment-btn': 'add-payment-modal'
};

// Abrir modales
Object.keys(modalTriggers).forEach(triggerId => {
    const trigger = document.getElementById(triggerId);
    if (trigger) {
        trigger.addEventListener('click', () => {
            const modalId = modalTriggers[triggerId];
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'block';
        });
    }
});

// Cerrar modales
document.querySelectorAll('.close, .modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        if (modal) modal.style.display = 'none';
    });
});

// Cerrar modal al hacer clic fuera
window.addEventListener('click', function(e) {
    modals.forEach(modal => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Prevenir envío de formularios (para demo)
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const modal = this.closest('.modal');
        if (modal) modal.style.display = 'none';
        
        // Aquí normalmente se enviarían los datos a la base de datos
        // Para la demo, simulamos una actualización de la interfaz
        showNotification('Datos guardados correctamente', 'success');
    });
});

// Filtros de tiempo para gráficos
const timeFilters = document.querySelectorAll('.time-filter button');
if (timeFilters) {
    timeFilters.forEach(btn => {
        btn.addEventListener('click', function() {
            // Buscar el grupo de filtros (parent)
            const filterGroup = this.closest('.time-filter');
            if (!filterGroup) return;
            
            // Desactivar todos los botones en el mismo grupo
            filterGroup.querySelectorAll('button').forEach(b => {
                b.classList.remove('active');
            });
            
            // Activar el botón actual
            this.classList.add('active');
            
            // En una implementación real, aquí actualizaríamos los datos
            // del gráfico en función del período seleccionado
            const period = this.getAttribute('data-period');
            console.log(`Período seleccionado: ${period}`);
        });
    });
}

// Evento para búsqueda
const searchInput = document.querySelector('.search-container input');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        if (searchTerm.length > 2) {
            // Filtrar tablas visibles
            filterTables(searchTerm);
        } else if (searchTerm.length === 0) {
            // Restaurar datos originales
            resetTables();
        }
    });
}

// Agregar listener para cambio de tema
const themeSelector = document.getElementById('tema');
if (themeSelector) {
    themeSelector.addEventListener('change', function() {
        const theme = this.value;
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
        // Guardar preferencia
        localStorage.setItem('theme', theme);
    });
    
    // Verificar tema guardado
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        themeSelector.value = savedTheme;
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
        }
    }
}

// Inicializar datos de muestra
initializeSampleData();

// Inicializar gráficos y mapas
initializeCharts();
initializeMap();

console.log('Dashboard inicializado correctamente');
});

// Función para filtrar tablas
function filterTables(term) {
// Obtener la sección activa
const activeSection = document.querySelector('section:not(.section-hide)');
if (!activeSection) return;

// Filtrar solo las tablas visibles en la sección activa
const rows = activeSection.querySelectorAll('tbody tr');
let matchCount = 0;

rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const hasMatch = text.includes(term);
    
    if (hasMatch) {
        row.style.display = '';
        row.classList.add('highlight');
        matchCount++;
    } else {
        row.style.display = 'none';
    }
});

// Mostrar feedback sobre la búsqueda
if (matchCount === 0) {
    showNotification(`No se encontraron resultados para "${term}"`, 'warning');
} else {
    showNotification(`Se encontraron ${matchCount} coincidencias para "${term}"`, 'info');
}
}

// Función para restablecer tablas
function resetTables() {
// Restablecer todas las filas
document.querySelectorAll('tbody tr').forEach(row => {
    row.style.display = '';
    row.classList.remove('highlight');
});
}

// Función para mostrar notificaciones temporales
function showNotification(message, type = 'info') {
// Comprobar si ya existe una notificación
let notification = document.querySelector('.notification-popup');

if (!notification) {
    // Crear notificación
    notification = document.createElement('div');
    notification.className = 'notification-popup';
    document.body.appendChild(notification);
}

// Establecer clase según el tipo
notification.className = `notification-popup ${type}`;

// Establecer mensaje
notification.textContent = message;

// Mostrar notificación
notification.style.display = 'block';

// Auto-ocultar después de unos segundos
setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
        notification.style.display = 'none';
        notification.style.opacity = '1';
    }, 500);
}, 3000);
}

// Función para generar ID único
function generateUniqueId(prefix = 'id') {
return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

// Función para formatear fechas
function formatDate(date) {
if (!date) return '';
const d = new Date(date);
return d.toLocaleDateString('es-ES');
}

// Función para formatear moneda
function formatCurrency(amount) {
if (!amount) return '$0.00';

// Eliminar símbolo de $ si existe
const value = typeof amount === 'string' 
    ? parseFloat(amount.replace('$', '').replace(',', ''))
    : amount;
    
return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
}).format(value);
}