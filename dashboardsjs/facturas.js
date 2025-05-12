document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const invoicesTableBody = document.getElementById('invoices-table-body');
    const invoiceStatusFilter = document.getElementById('invoice-status-filter');
    const invoiceSearch = document.getElementById('invoice-search');
    const prevInvoicePageBtn = document.getElementById('prev-invoice-page-btn');
    const nextInvoicePageBtn = document.getElementById('next-invoice-page-btn');
    const invoiceModal = document.getElementById('invoice-modal');
    const invoiceForm = document.getElementById('invoice-form');
    const invoiceClientIdInput = document.getElementById('invoice-client-id');
    const invoiceSubscriptionIdInput = document.getElementById('invoice-subscription-id');
    const invoiceClientNameSpan = document.getElementById('invoice-client-name');
    const invoiceClientEmailSpan = document.getElementById('invoice-client-email');
    const invoiceClientPlanSpan = document.getElementById('invoice-client-plan');
    const invoiceConceptInput = document.getElementById('invoice-concept');
    const invoiceAmountInput = document.getElementById('invoice-amount');
    const invoiceDueDateInput = document.getElementById('invoice-due-date');
    const invoiceDetailsInput = document.getElementById('invoice-details');
    const saveInvoiceBtn = document.getElementById('save-invoice-btn');
    const closeInvoiceModalBtn = document.querySelector('#invoice-modal .modal-close');
    const cancelInvoiceBtn = document.querySelector('.cancel-invoice-btn');
    
    // Variables de estado
    let currentInvoicesPage = 1;
    const invoicesPerPage = 10;
    let totalInvoicesPages = 1;
    let lastVisibleInvoice = null;
    let firstVisibleInvoice = null;
    
    // Inicializar Firebase
    const db = firebase.firestore();
    const invoicesRef = db.collection('invoices');
    
    // Cargar facturas iniciales
    loadInvoices();
    
    // Event listeners para filtros y paginación
    if (invoiceStatusFilter) {
        invoiceStatusFilter.addEventListener('change', function() {
            currentInvoicesPage = 1;
            lastVisibleInvoice = null;
            firstVisibleInvoice = null;
            loadInvoices();
        });
    }
    
    if (invoiceSearch) {
        invoiceSearch.addEventListener('input', function() {
            if (this.value.length >= 3 || this.value.length === 0) {
                currentInvoicesPage = 1;
                lastVisibleInvoice = null;
                firstVisibleInvoice = null;
                loadInvoices();
            }
        });
    }
    
    if (prevInvoicePageBtn) {
        prevInvoicePageBtn.addEventListener('click', function() {
            if (currentInvoicesPage > 1) {
                currentInvoicesPage--;
                loadInvoicesPrevPage();
            }
        });
    }
    
    if (nextInvoicePageBtn) {
        nextInvoicePageBtn.addEventListener('click', function() {
            if (currentInvoicesPage < totalInvoicesPages) {
                currentInvoicesPage++;
                loadInvoicesNextPage();
            }
        });
    }
    
    // Event listeners para el modal de factura
    if (closeInvoiceModalBtn) {
        closeInvoiceModalBtn.addEventListener('click', function() {
            invoiceModal.classList.remove('active');
        });
    }
    
    if (cancelInvoiceBtn) {
        cancelInvoiceBtn.addEventListener('click', function() {
            invoiceModal.classList.remove('active');
        });
    }
    
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            generateInvoice();
        });
    }
    
    // Función para cargar facturas
    function loadInvoices() {
        if (!invoicesTableBody) return;
        
        // Mostrar loader
        invoicesTableBody.innerHTML = '<tr><td colspan="8" class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando facturas...</td></tr>';
        
        // Construir la consulta base
        let query = invoicesRef.orderBy('createdAt', 'desc');
        
        // Aplicar filtro por estado
        const statusFilter = invoiceStatusFilter ? invoiceStatusFilter.value : 'all';
        if (statusFilter && statusFilter !== 'all') {
            query = query.where('status', '==', statusFilter);
        }
        
        // Aplicar filtro de búsqueda por cliente
        const searchText = invoiceSearch ? invoiceSearch.value.trim().toLowerCase() : '';
        
        // Limitar resultados para paginación
        query = query.limit(invoicesPerPage);
        
        // Ejecutar consulta
        query.get()
            .then(async (snapshot) => {
                if (snapshot.empty) {
                    invoicesTableBody.innerHTML = '<tr><td colspan="8" class="empty-message">No se encontraron facturas</td></tr>';
                    updateInvoicesPagination(0);
                    return;
                }
                
                // Guardar referencia al primer y último documento para paginación
                firstVisibleInvoice = snapshot.docs[0];
                lastVisibleInvoice = snapshot.docs[snapshot.docs.length - 1];
                
                // Limpiar tabla
                invoicesTableBody.innerHTML = '';
                
                // Procesar cada factura
                for (const doc of snapshot.docs) {
                    const invoiceData = doc.data();
                    const invoiceId = doc.id;
                    
                    // Obtener datos del cliente
                    let clientName = 'Cliente desconocido';
                    try {
                        const clientDoc = await db.collection('usuarios').doc(invoiceData.clientId).get();
                        if (clientDoc.exists) {
                            const clientData = clientDoc.data();
                            clientName = clientData.name || clientData.email || 'Cliente desconocido';
                            
                            // Si hay filtro de búsqueda y el cliente no coincide, omitir esta factura
                            if (searchText && !(clientData.name.toLowerCase().includes(searchText) || 
                                              clientData.email.toLowerCase().includes(searchText))) {
                                continue;
                            }
                        }
                    } catch (error) {
                        console.error('Error al obtener cliente:', error);
                    }
                    
                    // Formatear fechas
                    let createdDate = 'N/A';
                    if (invoiceData.createdAt) {
                        const date = invoiceData.createdAt.toDate ? 
                                    invoiceData.createdAt.toDate() : 
                                    new Date(invoiceData.createdAt);
                        createdDate = date.toLocaleDateString();
                    }
                    
                    let dueDate = 'N/A';
                    if (invoiceData.dueDate) {
                        dueDate = new Date(invoiceData.dueDate).toLocaleDateString();
                    }
                    
                    // Crear fila de tabla
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${invoiceId.substring(0, 8)}...</td>
                        <td>${clientName}</td>
                        <td>${invoiceData.concept || 'Sin concepto'}</td>
                        <td>$${invoiceData.amount ? invoiceData.amount.toFixed(2) : '0.00'}</td>
                        <td>${createdDate}</td>
                        <td>${dueDate}</td>
                        <td><span class="status-badge ${invoiceData.status}">${getInvoiceStatusName(invoiceData.status)}</span></td>
                        <td>
                            <div class="table-actions">
                                <button class="btn-icon view-invoice" title="Ver" data-id="${invoiceId}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon edit-invoice" title="Editar" data-id="${invoiceId}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon delete-invoice" title="Eliminar" data-id="${invoiceId}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    
                    // Agregar event listeners para botones
                    const viewBtn = row.querySelector('.view-invoice');
                    const editBtn = row.querySelector('.edit-invoice');
                    const deleteBtn = row.querySelector('.delete-invoice');
                    
                    if (viewBtn) {
                        viewBtn.addEventListener('click', function() {
                            viewInvoice(invoiceId);
                        });
                    }
                    
                    if (editBtn) {
                        editBtn.addEventListener('click', function() {
                            editInvoice(invoiceId);
                        });
                    }
                    
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function() {
                            if (confirm('¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.')) {
                                deleteInvoice(invoiceId);
                            }
                        });
                    }
                    
                    invoicesTableBody.appendChild(row);
                }
                
                // Actualizar paginación
                updateInvoicesPagination(snapshot.docs.length);
            })
            .catch(error => {
                console.error('Error al cargar facturas:', error);
                invoicesTableBody.innerHTML = `<tr><td colspan="8" class="error-message">Error al cargar facturas: ${error.message}</td></tr>`;
            });
    }
    
    // Función para cargar la página siguiente de facturas
    function loadInvoicesNextPage() {
        if (!lastVisibleInvoice) return;
        
        // Mostrar loader
        invoicesTableBody.innerHTML = '<tr><td colspan="8" class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando facturas...</td></tr>';
        
        // Construir la consulta
        let query = invoicesRef.orderBy('createdAt', 'desc');
        
        // Aplicar filtro por estado
        const statusFilter = invoiceStatusFilter ? invoiceStatusFilter.value : 'all';
        if (statusFilter && statusFilter !== 'all') {
            query = query.where('status', '==', statusFilter);
        }
        
        // Iniciar después del último documento visible
        query = query.startAfter(lastVisibleInvoice).limit(invoicesPerPage);
        
        // Ejecutar consulta
        query.get().then(snapshot => {
            // Mismo procesamiento que loadInvoices
            // ...
            // (Omitido por brevedad, sería similar al código de loadInvoices)
        });
    }
    
    // Función para cargar la página anterior de facturas
    function loadInvoicesPrevPage() {
        if (!firstVisibleInvoice) return;
        
        // Mostrar loader
        invoicesTableBody.innerHTML = '<tr><td colspan="8" class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando facturas...</td></tr>';
        
        // Construir la consulta
        let query = invoicesRef.orderBy('createdAt', 'desc');
        
        // Aplicar filtro por estado
        const statusFilter = invoiceStatusFilter ? invoiceStatusFilter.value : 'all';
        if (statusFilter && statusFilter !== 'all') {
            query = query.where('status', '==', statusFilter);
        }
        
        // Obtener documentos antes del primer documento visible (en orden invertido)
        query = query.endBefore(firstVisibleInvoice).limitToLast(invoicesPerPage);
        
        // Ejecutar consulta
        query.get().then(snapshot => {
            // Mismo procesamiento que loadInvoices
            // ...
            // (Omitido por brevedad, sería similar al código de loadInvoices)
        });
    }
    
    // Función para actualizar la paginación
    function updateInvoicesPagination(count) {
        const currentPageEl = document.querySelector('.pagination-pages .current-page');
        const totalPagesEl = document.querySelector('.pagination-pages .total-pages');
        
        if (currentPageEl) {
            currentPageEl.textContent = currentInvoicesPage;
        }
        
        // Calcular total de páginas (aproximado)
        if (count < invoicesPerPage) {
            totalInvoicesPages = currentInvoicesPage;
        } else {
            totalInvoicesPages = currentInvoicesPage + 1;
        }
        
        if (totalPagesEl) {
            totalPagesEl.textContent = totalInvoicesPages;
        }
        
        // Actualizar estado de los botones
        if (prevInvoicePageBtn) {
            prevInvoicePageBtn.disabled = currentInvoicesPage <= 1;
        }
        
        if (nextInvoicePageBtn) {
            nextInvoicePageBtn.disabled = currentInvoicesPage >= totalInvoicesPages;
        }
    }
    
    // Función para ver detalles de una factura
    function viewInvoice(invoiceId) {
        alert(`Ver factura ${invoiceId} (Funcionalidad en desarrollo)`);
        // Aquí iría la implementación para ver los detalles de la factura
    }
    
    // Función para editar una factura
    function editInvoice(invoiceId) {
        alert(`Editar factura ${invoiceId} (Funcionalidad en desarrollo)`);
        // Aquí iría la implementación para editar una factura
    }
    
    // Función para eliminar una factura
    function deleteInvoice(invoiceId) {
        // Mostrar loader o deshabilitar botones
        
        // Eliminar factura
        invoicesRef.doc(invoiceId).delete()
            .then(() => {
                alert('Factura eliminada correctamente');
                loadInvoices(); // Recargar lista
            })
            .catch(error => {
                console.error('Error al eliminar factura:', error);
                alert(`Error al eliminar factura: ${error.message}`);
            });
    }
    
    // Función para abrir el modal de factura
    async function openInvoiceModal(clientId, subscriptionId) {
        try {
            // Cargar datos del cliente
            const clientDoc = await db.collection('usuarios').doc(clientId).get();
            
            if (!clientDoc.exists) {
                alert('No se encontró el cliente. Por favor, intenta de nuevo.');
                return;
            }
            
            const clientData = clientDoc.data();
            
            // Cargar datos de la suscripción
            const subscriptionDoc = await db.collection('subscriptions').doc(subscriptionId).get();
            
            if (!subscriptionDoc.exists) {
                alert('No se encontró la suscripción. Por favor, intenta de nuevo.');
                return;
            }
            
            const subscriptionData = subscriptionDoc.data();
            
            // Cargar datos del plan
            const planDoc = await db.collection('plans').doc(subscriptionData.planId).get();
            let planName = subscriptionData.planId;
            let planPrice = 0;
            
            if (planDoc.exists) {
                const planData = planDoc.data();
                planName = planData.name;
                planPrice = planData.price;
            }
            
            // Llenar formulario
            invoiceClientIdInput.value = clientId;
            invoiceSubscriptionIdInput.value = subscriptionId;
            invoiceClientNameSpan.textContent = clientData.name || 'Sin nombre';
            invoiceClientEmailSpan.textContent = clientData.email || 'Sin email';
            invoiceClientPlanSpan.textContent = planName;
            
            // Sugerir concepto y monto
            invoiceConceptInput.value = `Servicio de seguridad - Plan ${planName}`;
            invoiceAmountInput.value = planPrice;
            
            // Sugerir fecha límite de pago (7 días desde hoy)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            invoiceDueDateInput.value = dueDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            
            // Limpiar detalles adicionales
            invoiceDetailsInput.value = '';
            
            // Mostrar modal
            invoiceModal.classList.add('active');
            
        } catch (error) {
            console.error('Error al cargar datos para la factura:', error);
            alert('Error al preparar la factura. Por favor, intenta de nuevo.');
        }
    }
    
    // Función para generar la factura
    async function generateInvoice() {
        // Obtener datos del formulario
        const clientId = invoiceClientIdInput.value;
        const subscriptionId = invoiceSubscriptionIdInput.value;
        const concept = invoiceConceptInput.value;
        const amount = parseFloat(invoiceAmountInput.value);
        const dueDate = invoiceDueDateInput.value;
        const details = invoiceDetailsInput.value;
        
        // Validar datos
        if (!clientId || !concept || isNaN(amount) || !dueDate) {
            alert('Por favor, completa todos los campos requeridos');
            return;
        }
        
        // Mostrar estado de carga
        saveInvoiceBtn.disabled = true;
        saveInvoiceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        
        try {
            // Crear factura en Firestore
            const invoiceData = {
                clientId,
                subscriptionId,
                concept,
                amount,
                dueDate,
                details,
                status: 'pending', // Estados posibles: pending, paid, cancelled, overdue
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'system'
            };
            
            // Guardar factura
            const invoiceRef = await db.collection('invoices').add(invoiceData);
            
            // También actualizar la suscripción con referencia a la factura más reciente
            await db.collection('subscriptions').doc(subscriptionId).update({
                lastInvoiceId: invoiceRef.id,
                lastInvoiceDate: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Cerrar modal y mostrar mensaje de éxito
            invoiceModal.classList.remove('active');
            alert('Factura generada correctamente. El cliente podrá verla en su dashboard.');
            
            // Recargar facturas
            loadInvoices();
            
        } catch (error) {
            console.error('Error al generar factura:', error);
            alert('Error al generar la factura: ' + error.message);
        } finally {
            // Restaurar botón
            saveInvoiceBtn.disabled = false;
            saveInvoiceBtn.textContent = 'Generar Factura';
        }
    }
    
    // Función para obtener nombre legible del estado de la factura
    function getInvoiceStatusName(status) {
        const statuses = {
            'pending': 'Pendiente',
            'paid': 'Pagada',
            'cancelled': 'Cancelada',
            'overdue': 'Vencida',
            'payment_pending': 'Pago en Proceso'
        };
        
        return statuses[status] || status;
    }
    
    // Exportar funciones para uso externo
    window.invoiceModule = {
        openInvoiceModal,
        loadInvoices
    };
});