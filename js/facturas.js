// facturas.js - Gestión de facturas del cliente

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const facturasGrid = document.getElementById('facturas-grid');
    const facturasStatusFilter = document.getElementById('facturas-status-filter');
    const facturasDateFilter = document.getElementById('facturas-date-filter');
    
    // Verificar autenticación y cargar datos
    auth.onAuthStateChanged(user => {
        if (user) {
            initFacturasSystem(user.uid);
        }
    });
    
    // Inicializar sistema de facturas
    function initFacturasSystem(userId) {
        // Cargar facturas iniciales
        loadFacturas(userId);
        
        // Inicializar filtros
        initFilters(userId);
        
        // Establecer fecha por defecto (inicio del año)
        if (facturasDateFilter) {
            const today = new Date();
            const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
            const formattedDate = firstDayOfYear.toISOString().split('T')[0];
            facturasDateFilter.value = formattedDate;
        }
    }
    
    // Inicializar filtros
    function initFilters(userId) {
        // Filtro de estado
        if (facturasStatusFilter) {
            facturasStatusFilter.addEventListener('change', function() {
                loadFacturas(userId);
            });
        }
        
        // Filtro de fecha
        if (facturasDateFilter) {
            facturasDateFilter.addEventListener('change', function() {
                loadFacturas(userId);
            });
        }
    }
    
    // Cargar facturas
    async function loadFacturas(userId) {
        if (!facturasGrid) return;
        
        // Mostrar mensaje de carga
        facturasGrid.innerHTML = '<div class="loading-message">Cargando facturas...</div>';
        
        try {
            // Obtener valores de filtros
            const statusFilter = facturasStatusFilter ? facturasStatusFilter.value : 'all';
            const dateFilter = facturasDateFilter ? facturasDateFilter.value : '';
            
            // Construir consulta base
            let query = db.collection('facturas')
                .where('clientId', '==', userId);
            
            // Aplicar filtro de estado
            if (statusFilter !== 'all') {
                query = query.where('status', '==', statusFilter);
            }
            
            // Ordenar por fecha
            query = query.orderBy('date', 'desc');
            
            // Ejecutar consulta
            const snapshot = await query.get();
            
            // Filtrar por fecha si es necesario
            let facturas = [];
            snapshot.forEach(doc => {
                const facturaData = doc.data();
                
                // Si hay filtro de fecha, verificar que la fecha sea posterior
                if (dateFilter) {
                    const startDate = new Date(dateFilter);
                    
                    if (facturaData.date) {
                        const facturaDate = facturaData.date.toDate ? 
                                        facturaData.date.toDate() : 
                                        new Date(facturaData.date);
                        
                        // Si la fecha es anterior, omitir
                        if (facturaDate < startDate) {
                            return;
                        }
                    }
                }
                
                // Agregar factura a la lista
                facturas.push({
                    id: doc.id,
                    data: facturaData
                });
            });
            
            // Manejar caso de no resultados
            if (facturas.length === 0) {
                facturasGrid.innerHTML = '<div class="empty-message">No se encontraron facturas</div>';
                return;
            }
            
            // Limpiar contenedor
            facturasGrid.innerHTML = '';
            
            // Crear tarjeta para cada factura
            facturas.forEach(factura => {
                createFacturaCard(factura.id, factura.data);
            });
            
        } catch (error) {
            console.error('Error al cargar facturas:', error);
            facturasGrid.innerHTML = '<div class="error-message">Error al cargar facturas: ' + error.message + '</div>';
        }
    }
    
    // Crear tarjeta de factura
    function createFacturaCard(facturaId, facturaData) {
        const card = document.createElement('div');
        card.className = 'factura-card';
        
        // Formatear fecha
        const facturaDate = facturaData.date ? 
                          formatFirestoreDate(facturaData.date) : 'N/A';
        
        // Crear HTML de la tarjeta
        card.innerHTML = `
            <div class="factura-header">
                <h3 class="factura-number">Factura #${facturaId.substring(0, 8).toUpperCase()}</h3>
                <span class="factura-status ${facturaData.status === 'paid' ? 'paid' : 'pending'}">
                    ${facturaData.status === 'paid' ? 'Pagada' : 'Pendiente'}
                </span>
            </div>
            <div class="factura-body">
                <div class="factura-item">
                    <div class="factura-item-label">Servicio</div>
                    <div class="factura-item-value">${facturaData.serviceName || 'Servicio'}</div>
                </div>
                <div class="factura-item">
                    <div class="factura-item-label">Fecha</div>
                    <div class="factura-item-value">${facturaDate}</div>
                </div>
                <div class="factura-amount">${formatCurrency(facturaData.amount || 0)}</div>
            </div>
            <div class="factura-footer">
                <div class="factura-date">
                    <i class="far fa-calendar-alt"></i> ${facturaDate}
                </div>
                <div class="factura-actions">
                    ${facturaData.invoiceUrl ? `
                    <a href="${facturaData.invoiceUrl}" class="factura-btn" target="_blank">
                        <i class="fas fa-download"></i> Descargar
                    </a>
                    ` : `
                    <button class="factura-btn view-factura" data-id="${facturaId}">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    `}
                </div>
            </div>
        `;
        
        // Agregar evento para ver factura
        const viewBtn = card.querySelector('.view-factura');
        if (viewBtn) {
            viewBtn.addEventListener('click', function() {
                viewFacturaDetails(facturaId, facturaData);
            });
        }
        
        // Agregar tarjeta al contenedor
        facturasGrid.appendChild(card);
    }
    
    // Ver detalles de factura
    function viewFacturaDetails(facturaId, facturaData) {
        // Crear modal dinámicamente
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'factura-details-modal';
        
        // Formatear fecha
        const facturaDate = facturaData.date ? 
                          formatFirestoreDate(facturaData.date) : 'N/A';
        
        // Crear contenido del modal (simulando una factura)
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Factura #${facturaId.substring(0, 8).toUpperCase()}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="factura-details">
                        <div class="factura-company">
                            <img src="assets/Logo2.png" alt="Logo" style="height: 50px;">
                            <h2>Seguridad 24/7</h2>
                            <p>Av. Principal 123, Quito, Ecuador</p>
                            <p>RUC: 1234567890001</p>
                            <p>Tel: (02) 123-4567</p>
                        </div>
                        
                        <div class="factura-info">
                            <div class="factura-info-section">
                                <h4>Factura</h4>
                                <p><strong>Número:</strong> ${facturaId.substring(0, 8).toUpperCase()}</p>
                                <p><strong>Fecha:</strong> ${facturaDate}</p>
                                <p><strong>Estado:</strong> ${facturaData.status === 'paid' ? 'Pagada' : 'Pendiente'}</p>
                            </div>
                            
                            <div class="factura-info-section">
                                <h4>Cliente</h4>
                                <p><strong>Nombre:</strong> ${facturaData.clientName || 'Cliente'}</p>
                                <p><strong>Email:</strong> ${facturaData.clientEmail || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <table class="factura-table">
                            <thead>
                                <tr>
                                    <th>Descripción</th>
                                    <th>Cantidad</th>
                                    <th>Precio</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${facturaData.serviceName || 'Servicio'}</td>
                                    <td>1</td>
                                    <td>${formatCurrency(facturaData.amount || 0)}</td>
                                    <td>${formatCurrency(facturaData.amount || 0)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3">Subtotal</td>
                                    <td>${formatCurrency((facturaData.amount || 0) * 0.88)}</td>
                                </tr>
                                <tr>
                                    <td colspan="3">IVA (12%)</td>
                                    <td>${formatCurrency((facturaData.amount || 0) * 0.12)}</td>
                                </tr>
                                <tr>
                                    <td colspan="3"><strong>Total</strong></td>
                                    <td><strong>${formatCurrency(facturaData.amount || 0)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        <div class="factura-notes">
                            <p><strong>Método de Pago:</strong> ${facturaData.paymentMethod || 'N/A'}</p>
                            <p><strong>Notas:</strong> Gracias por confiar en nuestros servicios.</p>
                        </div>
                        
                        <div class="factura-footer-info">
                            <p>Esta es una representación digital de su factura.</p>
                            <p>Para cualquier consulta, contáctenos al correo: soporte@seguridad247.com</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary close-details-btn">Cerrar</button>
                    <button class="btn-primary" id="download-factura-btn">Descargar PDF</button>
                </div>
            </div>
        `;
        
        // Estilos adicionales para la factura
        const style = document.createElement('style');
        style.textContent = `
            .factura-details {
                font-family: 'Poppins', sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .factura-company {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .factura-company h2 {
                margin: 10px 0 5px;
            }
            
            .factura-company p {
                margin: 2px 0;
                font-size: 0.9rem;
            }
            
            .factura-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            
            .factura-info-section {
                flex: 1;
            }
            
            .factura-info-section h4 {
                margin-bottom: 10px;
                border-bottom: 1px solid #E5E7EB;
                padding-bottom: 5px;
            }
            
            .factura-info-section p {
                margin: 5px 0;
                font-size: 0.9rem;
            }
            
            .factura-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            
            .factura-table th, .factura-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #E5E7EB;
            }
            
            .factura-table th {
                background-color: #F3F4F6;
                font-weight: 600;
            }
            
            .factura-table tfoot tr {
                font-weight: 500;
            }
            
            .factura-table tfoot tr:last-child {
                font-weight: 700;
                border-top: 2px solid #E5E7EB;
            }
            
            .factura-notes {
                margin-bottom: 30px;
                padding: 15px;
                background-color: #F9FAFB;
                border-radius: 8px;
            }
            
            .factura-notes p {
                margin: 5px 0;
                font-size: 0.9rem;
            }
            
            .factura-footer-info {
                text-align: center;
                font-size: 0.8rem;
                color: #6B7280;
                border-top: 1px solid #E5E7EB;
                padding-top: 20px;
                margin-top: 20px;
            }
        `;
        
        // Agregar estilos a la modal
        modal.appendChild(style);
        
        // Agregar modal al DOM
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Evento para botón de cerrar
        const closeBtn = modal.querySelector('.modal-close');
        const closeDetailsBtn = modal.querySelector('.close-details-btn');
        const downloadBtn = modal.querySelector('#download-factura-btn');
        
        // Función para cerrar modal
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };
        
        // Asignar eventos
        closeBtn.addEventListener('click', closeModal);
        closeDetailsBtn.addEventListener('click', closeModal);
        
        // Evento para descargar factura
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                // Aquí se implementaría la generación de PDF
                // En esta versión, simplemente mostramos un mensaje
                showToast('Información', 'La funcionalidad de descarga de facturas en PDF será implementada en una fase posterior', 'info');
            });
        }
        
        // Cerrar al hacer clic fuera del contenido
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
});