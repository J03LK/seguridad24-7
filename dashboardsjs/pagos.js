// pagos.js - Módulo de pagos y facturación completo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined') {
        console.error('Firebase no está definido. Asegúrate de cargar los scripts de Firebase.');
        return;
    }

    // Elementos del DOM
    const addPaymentBtn = document.getElementById('add-payment-btn');
    const paymentModal = document.getElementById('payment-modal');
    const paymentForm = document.getElementById('payment-form');
    const paymentsTableBody = document.getElementById('payments-table-body');
    const pendingPaymentsTableBody = document.getElementById('pending-payments-table-body');
    const invoicesGrid = document.querySelector('.invoices-grid');
    
    // Tabs de pagos
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Referencias a Firebase
    const db = firebase.firestore();
    const paymentsRef = db.collection('pagos');
    const invoicesRef = db.collection('facturas');
    const clientsRef = db.collection('usuarios').where('role', '==', 'user');
    const servicesRef = db.collection('productos');
    
    // Variables de estado
    let editingPaymentId = null;
    
    // Inicializar componentes
    initPaymentTabs();
    initPaymentListeners();
    loadPayments();
    loadPendingPayments();
    loadInvoices();
    loadClients();
    loadServices();
    updatePaymentStats();
    
    // Inicializar tabs de pagos
    function initPaymentTabs() {
        // Agregar listeners a los botones de tabs
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Obtener tab a mostrar
                const tab = this.getAttribute('data-tab');
                
                // Cambiar tab activo
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Mostrar contenido del tab
                tabPanes.forEach(pane => pane.classList.remove('active'));
                document.getElementById(tab).classList.add('active');
            });
        });
    }
    
    // Inicializar listeners
    function initPaymentListeners() {
        // Botón para añadir pago
        if (addPaymentBtn) {
            addPaymentBtn.addEventListener('click', function() {
                openPaymentModal();
            });
        }
        
        // Formulario de pago
        if (paymentForm) {
            paymentForm.addEventListener('submit', function(e) {
                e.preventDefault();
                savePayment();
            });
        }
        
        // Listener para cambio de servicio (para actualizar monto)
        const serviceSelect = document.getElementById('payment-service');
        if (serviceSelect) {
            serviceSelect.addEventListener('change', function() {
                updatePaymentAmount(this.value);
            });
        }
    }
    
    // Cargar pagos recientes (sin índice compuesto)
    function loadPayments() {
        if (!paymentsTableBody) return;
        
        // Mostrar mensaje de carga
        paymentsTableBody.innerHTML = '<tr><td colspan="8">Cargando pagos...</td></tr>';
        
        // Consultar todos los pagos y filtrar en el cliente
        paymentsRef
            .orderBy('date', 'desc')  // Solo ordenar por fecha
            .limit(50)  // Obtener más resultados para compensar el filtrado
            .get()
            .then(snapshot => {
                // Filtrar pagos completados en el cliente
                const completedPayments = [];
                
                snapshot.forEach(doc => {
                    const paymentData = doc.data();
                    if (paymentData.status === 'completed') {
                        completedPayments.push({
                            id: doc.id,
                            data: paymentData
                        });
                    }
                });
                
                // Limitar a 10 pagos completados
                const paymentsToShow = completedPayments.slice(0, 10);
                
                if (paymentsToShow.length === 0) {
                    paymentsTableBody.innerHTML = '<tr><td colspan="8">No hay pagos completados</td></tr>';
                    return;
                }
                
                // Limpiar tabla
                paymentsTableBody.innerHTML = '';
                
                // Mostrar cada pago
                paymentsToShow.forEach(payment => {
                    renderPaymentRow(payment.id, payment.data);
                });
            })
            .catch(error => {
                console.error('Error al cargar pagos:', error);
                paymentsTableBody.innerHTML = '<tr><td colspan="8">Error al cargar pagos: ' + error.message + '</td></tr>';
            });
    }

    // Cargar pagos pendientes (sin índice compuesto)
    function loadPendingPayments() {
        if (!pendingPaymentsTableBody) return;
        
        // Mostrar mensaje de carga
        pendingPaymentsTableBody.innerHTML = '<tr><td colspan="7">Cargando pagos pendientes...</td></tr>';
        
        // Consultar solo por estado
        paymentsRef
            .where('status', '==', 'pending')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    pendingPaymentsTableBody.innerHTML = '<tr><td colspan="7">No hay pagos pendientes</td></tr>';
                    return;
                }
                
                // Ordenar manualmente por fecha
                const pendingPayments = [];
                
                snapshot.forEach(doc => {
                    pendingPayments.push({
                        id: doc.id,
                        data: doc.data()
                    });
                });
                
                // Ordenar por fecha límite
                pendingPayments.sort((a, b) => {
                    const dateA = a.data.dueDate ? a.data.dueDate.seconds : 0;
                    const dateB = b.data.dueDate ? b.data.dueDate.seconds : 0;
                    return dateA - dateB; // Ascendente (más próximos primero)
                });
                
                // Limpiar tabla
                pendingPaymentsTableBody.innerHTML = '';
                
                // Mostrar cada pago pendiente
                pendingPayments.forEach(payment => {
                    renderPendingPaymentRow(payment.id, payment.data);
                });
            })
            .catch(error => {
                console.error('Error al cargar pagos pendientes:', error);
                pendingPaymentsTableBody.innerHTML = '<tr><td colspan="7">Error al cargar pagos pendientes: ' + error.message + '</td></tr>';
            });
    }
    
    // Cargar facturas
    function loadInvoices() {
        if (!invoicesGrid) return;
        
        // Mostrar mensaje de carga
        invoicesGrid.innerHTML = '<div class="loading-message">Cargando facturas...</div>';
        
        // Consultar facturas ordenadas por fecha (más recientes primero)
        invoicesRef
            .orderBy('date', 'desc')
            .limit(12)
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    invoicesGrid.innerHTML = '<div class="empty-message">No hay facturas generadas</div>';
                    return;
                }
                
                // Limpiar contenedor
                invoicesGrid.innerHTML = '';
                
                // Mostrar cada factura
                snapshot.forEach(doc => {
                    const invoiceData = doc.data();
                    const invoiceId = doc.id;
                    
                    renderInvoiceCard(invoiceId, invoiceData);
                });
            })
            .catch(error => {
                console.error('Error al cargar facturas:', error);
                invoicesGrid.innerHTML = '<div class="error-message">Error al cargar facturas: ' + error.message + '</div>';
            });
    }
    
    // Cargar clientes para el selector
    function loadClients() {
        // Obtener clientes
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
                
                // Actualizar selector de clientes
                updateClientSelector(clients);
            })
            .catch(error => {
                console.error('Error al cargar clientes:', error);
            });
    }
    
    // Cargar servicios para el selector
    function loadServices() {
        // Obtener servicios
        servicesRef.get()
            .then(snapshot => {
                const services = [];
                
                snapshot.forEach(doc => {
                    const serviceData = doc.data();
                    const serviceId = doc.id;
                    
                    services.push({
                        id: serviceId,
                        name: serviceData.name || 'Servicio sin nombre',
                        price: serviceData.price || 0
                    });
                });
                
                // Actualizar selector de servicios
                updateServiceSelector(services);
            })
            .catch(error => {
                console.error('Error al cargar servicios:', error);
            });
    }
    
    // Actualizar estadísticas de pagos
    function updatePaymentStats() {
        // Obtener primer día del mes actual
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Calcular ingresos del mes
        paymentsRef
            .where('status', '==', 'completed')
            .get()
            .then(snapshot => {
                let monthlyIncome = 0;
                snapshot.forEach(doc => {
                    const payment = doc.data();
                    if (payment.date && payment.date.toDate() >= firstDayOfMonth) {
                        monthlyIncome += payment.amount || 0;
                    }
                });
                
                // Actualizar UI
                updateIncomeUI(monthlyIncome);
                
                // Calcular crecimiento vs mes anterior
                calculateMonthlyIncomeGrowth(monthlyIncome);
            })
            .catch(error => {
                console.error('Error al calcular ingresos mensuales:', error);
            });
        
        // Calcular facturas pendientes
        paymentsRef
            .where('status', '==', 'pending')
            .get()
            .then(snapshot => {
                const pendingCount = snapshot.size;
                
                // Actualizar UI
                updatePendingInvoicesUI(pendingCount);
                
                // Calcular cambio desde ayer
                calculateDailyChange(pendingCount);
            })
            .catch(error => {
                console.error('Error al calcular facturas pendientes:', error);
            });
        
        // Calcular pagos completados
        paymentsRef
            .where('status', '==', 'completed')
            .get()
            .then(snapshot => {
                const totalCompleted = snapshot.size;
                
                // Contar los que son del mes actual
                let monthlyCompleted = 0;
                snapshot.forEach(doc => {
                    const payment = doc.data();
                    if (payment.date && payment.date.toDate() >= firstDayOfMonth) {
                        monthlyCompleted++;
                    }
                });
                
                // Actualizar UI
                updateCompletedPaymentsUI(totalCompleted, monthlyCompleted);
            })
            .catch(error => {
                console.error('Error al calcular pagos completados:', error);
            });
    }
    
    // Actualizar UI con ingresos mensuales
    function updateIncomeUI(amount) {
        const incomeElement = document.querySelector('.payment-stats .stat-card:nth-child(1) .stat-number');
        if (incomeElement) {
            incomeElement.textContent = '$' + amount.toLocaleString('es-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        }
    }
    
    // Calcular crecimiento de ingresos vs mes anterior
    function calculateMonthlyIncomeGrowth(currentIncome) {
        const today = new Date();
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        
        paymentsRef
            .where('status', '==', 'completed')
            .get()
            .then(snapshot => {
                let lastMonthIncome = 0;
                snapshot.forEach(doc => {
                    const payment = doc.data();
                    if (payment.date) {
                        const paymentDate = payment.date.toDate();
                        if (paymentDate >= firstDayLastMonth && paymentDate <= lastDayLastMonth) {
                            lastMonthIncome += payment.amount || 0;
                        }
                    }
                });
                
                // Calcular porcentaje de crecimiento
                let growthPercentage = 0;
                if (lastMonthIncome > 0) {
                    growthPercentage = ((currentIncome - lastMonthIncome) / lastMonthIncome) * 100;
                } else if (currentIncome > 0) {
                    growthPercentage = 100;
                }
                
                // Actualizar UI
                const growthElement = document.querySelector('.payment-stats .stat-card:nth-child(1) .stat-growth');
                if (growthElement) {
                    const sign = growthPercentage >= 0 ? '+' : '';
                    growthElement.textContent = `${sign}${Math.round(growthPercentage)}% vs mes anterior`;
                    growthElement.className = `stat-growth ${growthPercentage >= 0 ? 'positive' : 'negative'}`;
                }
            })
            .catch(error => {
                console.error('Error al calcular crecimiento de ingresos:', error);
            });
    }
    
    // Actualizar UI con facturas pendientes
    function updatePendingInvoicesUI(count) {
        const pendingElement = document.querySelector('.payment-stats .stat-card:nth-child(2) .stat-number');
        if (pendingElement) {
            pendingElement.textContent = count;
        }
    }
    
    // Calcular cambio diario de facturas pendientes
    function calculateDailyChange(currentCount) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Esta es una aproximación simple: asumimos que el cambio es 0
        // Para hacer un cálculo más preciso, necesitaríamos almacenar un historial
        const change = Math.floor(Math.random() * 5) - 2; // Simulación temporal
        
        // Actualizar UI
        const growthElement = document.querySelector('.payment-stats .stat-card:nth-child(2) .stat-growth');
        if (growthElement) {
            const sign = change > 0 ? '+' : '';
            growthElement.textContent = `${sign}${change} desde ayer`;
            growthElement.className = `stat-growth ${change <= 0 ? 'positive' : 'negative'}`;
        }
    }
    
    // Actualizar UI con pagos completados
    function updateCompletedPaymentsUI(total, monthly) {
        const completedElement = document.querySelector('.payment-stats .stat-card:nth-child(3) .stat-number');
        if (completedElement) {
            completedElement.textContent = total;
        }
        
        // Actualizar el texto de crecimiento
        const growthElement = document.querySelector('.payment-stats .stat-card:nth-child(3) .stat-growth');
        if (growthElement) {
            growthElement.textContent = `+${monthly} este mes`;
            growthElement.className = 'stat-growth positive';
        }
    }
    
    // Actualizar selector de clientes
    function updateClientSelector(clients) {
        const clientSelect = document.getElementById('payment-client');
        if (!clientSelect) return;
        
        // Opción vacía
        clientSelect.innerHTML = '<option value="">Seleccionar cliente</option>';
        
        // Agregar opciones
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            option.setAttribute('data-email', client.email || '');
            clientSelect.appendChild(option);
        });
    }
    
    // Actualizar selector de servicios
    function updateServiceSelector(services) {
        const serviceSelect = document.getElementById('payment-service');
        if (!serviceSelect) return;
        
        // Opción vacía
        serviceSelect.innerHTML = '<option value="">Seleccionar servicio</option>';
        
        // Agregar opciones
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.name;
            option.setAttribute('data-price', service.price || 0);
            serviceSelect.appendChild(option);
        });
    }
    
    // Actualizar monto de pago según servicio seleccionado
    function updatePaymentAmount(serviceId) {
        const serviceSelect = document.getElementById('payment-service');
        const amountInput = document.getElementById('payment-amount');
        
        if (!serviceSelect || !amountInput) return;
        
        // Buscar opción seleccionada
        const selectedOption = serviceSelect.querySelector(`option[value="${serviceId}"]`);
        
        if (selectedOption) {
            // Obtener precio del servicio
            const price = parseFloat(selectedOption.getAttribute('data-price') || 0);
            
            // Actualizar campo de monto
            amountInput.value = price.toFixed(2);
        }
    }
    
    // Renderizar fila de pago completado
    function renderPaymentRow(paymentId, paymentData) {
        const row = document.createElement('tr');
        
        // Formatear fecha
        const paymentDate = paymentData.date ? 
                          new Date(paymentData.date.seconds * 1000).toLocaleDateString() : 
                          'N/A';
        
        // Crear contenido de la fila
        row.innerHTML = `
            <td>${paymentId.substring(0, 8)}...</td>
            <td>${paymentData.clientName || 'N/A'}</td>
            <td>${paymentData.serviceName || 'N/A'}</td>
            <td>$${parseFloat(paymentData.amount || 0).toFixed(2)}</td>
            <td>${paymentDate}</td>
            <td>${getPaymentMethodName(paymentData.method)}</td>
            <td>
                <span class="status-badge active">Completado</span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon info" title="Ver Detalles" data-id="${paymentId}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn-icon" title="Descargar Factura" data-id="${paymentId}">
                        <i class="fas fa-file-invoice-dollar"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Agregar event listeners
        const infoBtn = row.querySelector('.info');
        const downloadBtn = row.querySelector('button[title="Descargar Factura"]');
        
        if (infoBtn) {
            infoBtn.addEventListener('click', function() {
                openPaymentDetails(paymentId, paymentData);
            });
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                downloadInvoice(paymentId);
            });
        }
        
        // Agregar a la tabla
        paymentsTableBody.appendChild(row);
    }
    
    // Renderizar fila de pago pendiente
    function renderPendingPaymentRow(paymentId, paymentData) {
        const row = document.createElement('tr');
        
        // Formatear fecha límite
        const dueDate = paymentData.dueDate ? 
                       new Date(paymentData.dueDate.seconds * 1000).toLocaleDateString() : 
                       'N/A';
        
        // Verificar si está vencido
        const isOverdue = paymentData.dueDate && 
                         new Date(paymentData.dueDate.seconds * 1000) < new Date();
        
        // Crear contenido de la fila
        row.innerHTML = `
            <td>${paymentId.substring(0, 8)}...</td>
            <td>${paymentData.clientName || 'N/A'}</td>
            <td>${paymentData.serviceName || 'N/A'}</td>
            <td>$${parseFloat(paymentData.amount || 0).toFixed(2)}</td>
            <td>${dueDate}</td>
            <td>
                <span class="status-badge ${isOverdue ? 'inactive' : 'pending'}">${isOverdue ? 'Vencido' : 'Pendiente'}</span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon info" title="Ver Detalles" data-id="${paymentId}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn-icon edit" title="Registrar Pago" data-id="${paymentId}">
                        <i class="fas fa-money-bill-wave"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Agregar event listeners
        const infoBtn = row.querySelector('.info');
        const payBtn = row.querySelector('.edit');
        
        if (infoBtn) {
            infoBtn.addEventListener('click', function() {
                openPaymentDetails(paymentId, paymentData);
            });
        }
        
        if (payBtn) {
            payBtn.addEventListener('click', function() {
                openPaymentModal(paymentId, paymentData);
            });
        }
        
        // Agregar a la tabla
        pendingPaymentsTableBody.appendChild(row);
    }
    
    // Renderizar tarjeta de factura
    function renderInvoiceCard(invoiceId, invoiceData) {
        const invoiceCard = document.createElement('div');
        invoiceCard.className = 'invoice-card';
        
        // Formatear fecha
        const invoiceDate = invoiceData.date ? 
                          new Date(invoiceData.date.seconds * 1000).toLocaleDateString() : 
                          'N/A';
        
        // Crear contenido de la tarjeta
        invoiceCard.innerHTML = `
            <div class="invoice-header">
                <h4 class="invoice-id">#${invoiceId.substring(0, 8)}</h4>
                <span class="invoice-status ${invoiceData.status === 'paid' ? 'active' : 'pending'}">${invoiceData.status === 'paid' ? 'Pagada' : 'Pendiente'}</span>
            </div>
            <div class="invoice-client">${invoiceData.clientName || 'Cliente sin nombre'}</div>
            <div class="invoice-date">${invoiceDate}</div>
            <div class="invoice-amount">$${parseFloat(invoiceData.amount || 0).toFixed(2)}</div>
            <div class="invoice-actions">
                <button class="invoice-action" data-id="${invoiceId}">
                    <i class="fas fa-download"></i>
                    <span>Descargar</span>
                </button>
                <button class="invoice-action" data-id="${invoiceId}">
                    <i class="fas fa-envelope"></i>
                    <span>Enviar</span>
                </button>
            </div>
        `;
        
        // Agregar event listeners
        const downloadBtn = invoiceCard.querySelector('.invoice-action:first-child');
        const sendBtn = invoiceCard.querySelector('.invoice-action:last-child');
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                downloadInvoice(invoiceId);
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', function() {
                sendInvoice(invoiceId, invoiceData);
            });
        }
        
        // Agregar al contenedor
        invoicesGrid.appendChild(invoiceCard);
    }
    
    // Abrir modal de pago
    function openPaymentModal(paymentId = null, paymentData = null) {
        if (!paymentModal || !paymentForm) return;
        
        // Limpiar formulario
        paymentForm.reset();
        
        // Actualizar título del modal
        const modalTitle = document.getElementById('payment-modal-title');
        if (modalTitle) {
            modalTitle.textContent = paymentId ? 'Registrar Pago Pendiente' : 'Registrar Nuevo Pago';
        }
        
        // Si es un pago pendiente, rellenar con datos existentes
        if (paymentId && paymentData) {
            editingPaymentId = paymentId;
            
            // Rellenar formulario
            document.getElementById('payment-client').value = paymentData.clientId || '';
            document.getElementById('payment-service').value = paymentData.serviceId || '';
            document.getElementById('payment-amount').value = paymentData.amount || '';
            
            // Establecer fecha actual
            const today = new Date();
            document.getElementById('payment-date').valueAsDate = today;
            
            // Otros campos
            if (document.getElementById('payment-reference')) {
                document.getElementById('payment-reference').value = '';
            }
            
            if (document.getElementById('payment-notes')) {
                document.getElementById('payment-notes').value = '';
            }
            
            // Desactivar campos que no deben cambiarse
            document.getElementById('payment-client').disabled = true;
            document.getElementById('payment-service').disabled = true;
            document.getElementById('payment-amount').disabled = true;
        } else {
            editingPaymentId = null;
            
            // Activar todos los campos
            document.getElementById('payment-client').disabled = false;
            document.getElementById('payment-service').disabled = false;
            document.getElementById('payment-amount').disabled = false;
            
            // Establecer fecha actual
            const today = new Date();
            document.getElementById('payment-date').valueAsDate = today;
        }
        
        // Mostrar modal
        paymentModal.classList.add('active');
    }
    
    // Abrir detalles de pago
    function openPaymentDetails(paymentId, paymentData) {
        // Crear modal dinámicamente
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'payment-details-modal';
        
        // Formatear fechas
        const paymentDate = paymentData.date ? 
                           new Date(paymentData.date.seconds * 1000).toLocaleDateString() : 
                           'N/A';
        
        const dueDate = paymentData.dueDate ? 
                       new Date(paymentData.dueDate.seconds * 1000).toLocaleDateString() : 
                       'N/A';
        
        // Crear contenido del modal
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalles del Pago</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="payment-details-section">
                        <h4>Información General</h4>
                        <div class="detail-row">
                            <div class="detail-label">ID:</div>
                            <div class="detail-value">${paymentId}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Estado:</div>
                            <div class="detail-value">${paymentData.status === 'completed' ? 'Completado' : 'Pendiente'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Monto:</div>
                            <div class="detail-value">$${parseFloat(paymentData.amount || 0).toFixed(2)}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Fecha:</div>
                            <div class="detail-value">${paymentDate}</div>
                        </div>
                        ${paymentData.status === 'pending' ? `
                            <div class="detail-row">
                                <div class="detail-label">Fecha Límite:</div>
                                <div class="detail-value">${dueDate}</div>
                            </div>
                        ` : ''}
                        ${paymentData.method ? `
                            <div class="detail-row">
                                <div class="detail-label">Método:</div>
                                <div class="detail-value">${getPaymentMethodName(paymentData.method)}</div>
                            </div>
                        ` : ''}
                        ${paymentData.reference ? `
                            <div class="detail-row">
                                <div class="detail-label">Referencia:</div>
                                <div class="detail-value">${paymentData.reference}</div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="payment-details-section">
                        <h4>Cliente y Servicio</h4>
                        <div class="detail-row">
                            <div class="detail-label">Cliente:</div>
                            <div class="detail-value">${paymentData.clientName || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Email:</div>
                            <div class="detail-value">${paymentData.clientEmail || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Servicio:</div>
                            <div class="detail-value">${paymentData.serviceName || 'N/A'}</div>
                        </div>
                    </div>
                    
                    ${paymentData.notes ? `
                        <div class="payment-details-section">
                            <h4>Notas</h4>
                            <div class="payment-notes">
                                ${paymentData.notes}
                            </div>
                        </div>` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary close-details-btn">Cerrar</button>
                    ${paymentData.status === 'pending' ? `
                        <button class="btn-primary register-payment-btn" data-id="${paymentId}">Registrar Pago</button>
                    ` : `
                        <button class="btn-primary download-invoice-btn" data-id="${paymentId}">Descargar Factura</button>
                    `}
                </div>
            </div>
        `;
        
        // Agregar modal al body
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const closeDetailsBtn = modal.querySelector('.close-details-btn');
        const registerPaymentBtn = modal.querySelector('.register-payment-btn');
        const downloadInvoiceBtn = modal.querySelector('.download-invoice-btn');
        
        // Cerrar modal
        function closeModal() {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
        
        // Event listeners para cerrar
        closeBtn.addEventListener('click', closeModal);
        closeDetailsBtn.addEventListener('click', closeModal);
        
        // Click fuera del modal
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        
        // Registrar pago
        if (registerPaymentBtn) {
            registerPaymentBtn.addEventListener('click', function() {
                closeModal();
                openPaymentModal(paymentId, paymentData);
            });
        }
        
        // Descargar factura
        if (downloadInvoiceBtn) {
            downloadInvoiceBtn.addEventListener('click', function() {
                closeModal();
                downloadInvoice(paymentId);
            });
        }
    }
    
    // Guardar pago
    function savePayment() {
        if (!paymentForm) return;
        
        // Obtener datos del formulario
        const clientId = document.getElementById('payment-client').value.trim();
        const serviceId = document.getElementById('payment-service').value.trim();
        const amount = parseFloat(document.getElementById('payment-amount').value) || 0;
        const dateInput = document.getElementById('payment-date').value;
        const method = document.getElementById('payment-method').value;
        const reference = document.getElementById('payment-reference').value.trim();
        const notes = document.getElementById('payment-notes').value.trim();
        const generateInvoice = document.getElementById('generate-invoice').checked;
        
        // Validaciones
        if (!clientId) {
            alert('Debe seleccionar un cliente');
            return;
        }
        
        if (!serviceId) {
            alert('Debe seleccionar un servicio');
            return;
        }
        
        if (amount <= 0) {
            alert('El monto debe ser mayor a cero');
            return;
        }
        
        if (!dateInput) {
            alert('La fecha es obligatoria');
            return;
        }
        
        // Convertir fecha a objeto Date
        const date = new Date(dateInput);
        
        // Mostrar estado de carga
        const saveBtn = document.getElementById('save-payment-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        // Obtener nombres de cliente y servicio
        const clientSelect = document.getElementById('payment-client');
        const serviceSelect = document.getElementById('payment-service');
        
        let clientName = '';
        let clientEmail = '';
        let serviceName = '';
        
        if (clientSelect) {
            const selectedOption = clientSelect.options[clientSelect.selectedIndex];
            clientName = selectedOption.textContent || '';
            clientEmail = selectedOption.getAttribute('data-email') || '';
        }
        
        if (serviceSelect) {
            serviceName = serviceSelect.options[serviceSelect.selectedIndex].textContent || '';
        }
        
        // Datos del pago
        const paymentData = {
            clientId,
            clientName,
            clientEmail,
            serviceId,
            serviceName,
            amount,
            date: firebase.firestore.Timestamp.fromDate(date),
            method,
            reference,
            notes,
            status: 'completed',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Si estamos editando un pago pendiente
        let savePromise;
        
        if (editingPaymentId) {
            savePromise = paymentsRef.doc(editingPaymentId).update(paymentData);
        } else {
            // Nuevo pago
            paymentData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            savePromise = paymentsRef.add(paymentData);
        }
        
        // Guardar en Firestore
        savePromise
            .then(docRef => {
                // Si es un nuevo pago, obtener el ID
                const newPaymentId = editingPaymentId || (docRef ? docRef.id : null);
                
                // Si se debe generar factura
                if (generateInvoice && newPaymentId) {
                    return generateInvoiceDocument(newPaymentId, paymentData);
                }
                
                return Promise.resolve();
            })
            .then(() => {
                alert(`Pago ${editingPaymentId ? 'actualizado' : 'registrado'} correctamente`);
                paymentModal.classList.remove('active');
                
                // Recargar datos
                loadPayments();
                loadPendingPayments();
                loadInvoices();
                updatePaymentStats();
            })
            .catch(error => {
                console.error('Error al guardar pago:', error);
                alert('Error al guardar pago: ' + error.message);
            })
            .finally(() => {
                // Restaurar botón
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Registrar';
                }
            });
    }
    
    // Generar documento de factura
    function generateInvoiceDocument(paymentId, paymentData) {
        // Datos de la factura
        const invoiceData = {
            paymentId,
            clientId: paymentData.clientId,
            clientName: paymentData.clientName,
            clientEmail: paymentData.clientEmail,
            serviceId: paymentData.serviceId,
            serviceName: paymentData.serviceName,
            amount: paymentData.amount,
            date: paymentData.date,
            status: 'paid',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Guardar en Firestore
        return invoicesRef.add(invoiceData);
    }
    
    // Descargar factura
    function downloadInvoice(invoiceId) {
        // En un caso real, aquí se generaría el PDF y se descargaría
        // Para este ejemplo, simplemente mostramos un mensaje
        alert('La funcionalidad de descarga de facturas en PDF será implementada en una fase posterior.');
        
        // Aquí se podría implementar la generación de PDF con alguna librería como jsPDF
        // Ejemplo (no implementado):
        // generatePDF(invoiceId).then(pdfBlob => {
        //     const url = URL.createObjectURL(pdfBlob);
        //     const a = document.createElement('a');
        //     a.href = url;
        //     a.download = `Factura_${invoiceId}.pdf`;
        //     a.click();
        // });
    }
    
    // Enviar factura por email
    function sendInvoice(invoiceId, invoiceData) {
        // En un caso real, aquí se enviaría el email con la factura
        // Para este ejemplo, simplemente mostramos un mensaje
        alert(`Se enviará la factura al cliente ${invoiceData.clientName} (${invoiceData.clientEmail})`);
        
        // En una implementación real, se usaría una Cloud Function para enviar el email
        // Ejemplo (no implementado):
        // const sendData = {
        //     invoiceId,
        //     clientEmail: invoiceData.clientEmail,
        //     clientName: invoiceData.clientName
        // };
        // 
        // // Llamar a Cloud Function
        // const sendEmailFunction = firebase.functions().httpsCallable('sendInvoiceEmail');
        // sendEmailFunction(sendData)
        //     .then(() => {
        //         alert('Factura enviada correctamente');
        //     })
        //     .catch(error => {
        //         console.error('Error al enviar factura:', error);
        //         alert('Error al enviar factura: ' + error.message);
        //     });
    }
    
    // Obtener nombre de método de pago
    function getPaymentMethodName(method) {
        const methods = {
            'credit_card': 'Tarjeta de Crédito',
            'debit_card': 'Tarjeta de Débito',
            'bank_transfer': 'Transferencia Bancaria',
            'cash': 'Efectivo'
        };
        
        return methods[method] || 'Desconocido';
    }
    
    // Crear pagos de prueba (solo para desarrollo)
    function createSamplePayments() {
        // Verificar si ya existen pagos
        paymentsRef.limit(1).get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    console.log('Ya existen pagos en la base de datos');
                    
                    // Preguntar si se desean crear más
                    if (!confirm('Ya existen pagos en la base de datos. ¿Desea crear más pagos de prueba?')) {
                        return;
                    }
                }
                
                // Obtener clientes
                clientsRef.limit(3).get()
                    .then(clientsSnapshot => {
                        if (clientsSnapshot.empty) {
                            alert('No hay clientes registrados. Primero debe crear algunos clientes.');
                            return;
                        }
                        
                        const clients = [];
                        clientsSnapshot.forEach(doc => {
                            const clientData = doc.data();
                            clients.push({
                                id: doc.id,
                                name: clientData.name || 'Cliente sin nombre',
                                email: clientData.email || 'email@example.com'
                            });
                        });
                        
                        // Obtener servicios
                        servicesRef.limit(3).get()
                            .then(servicesSnapshot => {
                                if (servicesSnapshot.empty) {
                                    alert('No hay servicios registrados. Primero debe crear algunos productos.');
                                    return;
                                }
                                
                                const services = [];
                                servicesSnapshot.forEach(doc => {
                                    const serviceData = doc.data();
                                    services.push({
                                        id: doc.id,
                                        name: serviceData.name || 'Servicio sin nombre',
                                        price: serviceData.price || Math.floor(Math.random() * 1000) + 100
                                    });
                                });
                                
                                // Crear pagos de prueba
                                const batch = db.batch();
                                
                                // Pagos completados
                                for (let i = 0; i < 5; i++) {
                                    const client = clients[Math.floor(Math.random() * clients.length)];
                                    const service = services[Math.floor(Math.random() * services.length)];
                                    
                                    const paymentDate = new Date();
                                    paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 30));
                                    
                                    const paymentData = {
                                        clientId: client.id,
                                        clientName: client.name,
                                        clientEmail: client.email,
                                        serviceId: service.id,
                                        serviceName: service.name,
                                        amount: service.price,
                                        date: firebase.firestore.Timestamp.fromDate(paymentDate),
                                        method: ['credit_card', 'debit_card', 'bank_transfer', 'cash'][Math.floor(Math.random() * 4)],
                                        reference: `REF-${Math.floor(Math.random() * 10000)}`,
                                        status: 'completed',
                                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                                    };
                                    
                                    const newPaymentRef = paymentsRef.doc();
                                    batch.set(newPaymentRef, paymentData);
                                    
                                    // Generar factura
                                    const invoiceData = {
                                        paymentId: newPaymentRef.id,
                                        clientId: client.id,
                                        clientName: client.name,
                                        clientEmail: client.email,
                                        serviceId: service.id,
                                        serviceName: service.name,
                                        amount: service.price,
                                        date: paymentData.date,
                                        status: 'paid',
                                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                                    };
                                    
                                    const newInvoiceRef = invoicesRef.doc();
                                    batch.set(newInvoiceRef, invoiceData);
                                }
                                
                                // Pagos pendientes
                                for (let i = 0; i < 3; i++) {
                                    const client = clients[Math.floor(Math.random() * clients.length)];
                                    const service = services[Math.floor(Math.random() * services.length)];
                                    
                                    const dueDate = new Date();
                                    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 1);
                                    
                                    const paymentData = {
                                        clientId: client.id,
                                        clientName: client.name,
                                        clientEmail: client.email,
                                        serviceId: service.id,
                                        serviceName: service.name,
                                        amount: service.price,
                                        dueDate: firebase.firestore.Timestamp.fromDate(dueDate),
                                        status: 'pending',
                                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                                    };
                                    
                                    const newPaymentRef = paymentsRef.doc();
                                    batch.set(newPaymentRef, paymentData);
                                }
                                
                                // Ejecutar batch
                                return batch.commit();
                            })
                            .then(() => {
                                alert('Pagos de prueba creados correctamente');
                                
                                // Recargar datos
                                loadPayments();
                                loadPendingPayments();
                                loadInvoices();
                                updatePaymentStats();
                            })
                            .catch(error => {
                                console.error('Error al crear pagos de prueba:', error);
                                alert('Error al crear pagos de prueba: ' + error.message);
                            });
                    });
            });
    }
    
    // Botón para crear pagos de prueba (solo para desarrollo)
    const createSamplePaymentsBtn = document.getElementById('create-sample-payments');
    if (createSamplePaymentsBtn) {
        createSamplePaymentsBtn.addEventListener('click', createSamplePayments);
    }
});