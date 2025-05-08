// pagos.js - Gestión de pagos del cliente

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const pendingPaymentsList = document.getElementById('pending-payments-list');
    const paymentsHistoryList = document.getElementById('payments-history-list');
    const pagosPendientesEl = document.getElementById('pagos-facturas-pendientes');
    const totalPendienteEl = document.getElementById('total-pendiente');
    const pagosCompletadosEl = document.getElementById('pagos-completados');
    const ultimoPagoEl = document.getElementById('ultimo-pago');
    const tabButtons = document.querySelectorAll('.payment-tabs .tab-btn');
    
    // Variables de estado
    let currentPaymentId = null;
    
    // Verificar autenticación y cargar datos
    auth.onAuthStateChanged(user => {
        if (user) {
            initPaymentSystem(user.uid);
        }
    });
    
    // Inicializar sistema de pagos
    function initPaymentSystem(userId) {
        // Cargar datos de pagos
        loadPaymentsData(userId);
        
        // Inicializar tabs
        initTabs();
        
        // Inicializar eventos del modal de pago
        initPaymentModal(userId);
    }
    
    // Cargar datos de pagos
    async function loadPaymentsData(userId) {
        try {
            // Cargar múltiples secciones en paralelo
            await Promise.all([
                loadPaymentStats(userId),
                loadPendingPayments(userId),
                loadPaymentHistory(userId)
            ]);
        } catch (error) {
            console.error('Error al cargar datos de pagos:', error);
            showToast('Error', 'No se pudieron cargar todos los datos de pagos', 'error');
        }
    }
    
    // Inicializar tabs
    function initTabs() {
        // Eventos para los botones de tab
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Desactivar todos los tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Activar tab actual
                this.classList.add('active');
                
                // Obtener ID del panel
                const tabId = this.getAttribute('data-tab');
                
                // Activar panel correspondiente
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
    
    // Inicializar modal de pago
    function initPaymentModal(userId) {
        const paymentModal = document.getElementById('payment-modal');
        const paymentForm = document.getElementById('payment-form');
        const paymentMethodSelect = document.getElementById('payment-method');
        const cardFields = document.getElementById('card-payment-fields');
        const bankFields = document.getElementById('bank-transfer-fields');
        const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
        
        if (!paymentModal || !paymentForm) return;
        
        // Cambiar campos según método de pago
        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', function() {
                const method = this.value;
                
                // Mostrar/ocultar campos según método
                if (method === 'credit_card' || method === 'debit_card') {
                    if (cardFields) cardFields.style.display = 'block';
                    if (bankFields) bankFields.style.display = 'none';
                } else if (method === 'bank_transfer') {
                    if (cardFields) cardFields.style.display = 'none';
                    if (bankFields) bankFields.style.display = 'block';
                } else {
                    if (cardFields) cardFields.style.display = 'none';
                    if (bankFields) bankFields.style.display = 'none';
                }
            });
        }
        
        // Enviar formulario de pago
        if (paymentForm) {
            paymentForm.addEventListener('submit', function(e) {
                e.preventDefault();
                processPayment(userId);
            });
        }
        
        // Cerrar modal
        document.querySelectorAll('.modal-close, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Cerrar al hacer clic fuera del contenido
        if (paymentModal) {
            paymentModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('active');
                }
            });
        }
    }
    
    // Cargar estadísticas de pagos
    async function loadPaymentStats(userId) {
        try {
            // 1. Obtener pagos pendientes
            const pendingSnapshot = await db.collection('pagos')
                .where('clientId', '==', userId)
                .where('status', '==', 'pending')
                .get();
            
            const pendingCount = pendingSnapshot.size;
            
            // 2. Calcular monto total pendiente
            let totalPendiente = 0;
            pendingSnapshot.forEach(doc => {
                const paymentData = doc.data();
                totalPendiente += parseFloat(paymentData.amount || 0);
            });
            
            // 3. Obtener pagos completados
            const completedSnapshot = await db.collection('pagos')
                .where('clientId', '==', userId)
                .where('status', '==', 'completed')
                .orderBy('date', 'desc')
                .get();
            
            const completedCount = completedSnapshot.size;
            
            // 4. Obtener fecha del último pago
            let ultimoPago = 'N/A';
            if (completedSnapshot.size > 0) {
                const latestPayment = completedSnapshot.docs[0].data();
                if (latestPayment.date) {
                    ultimoPago = formatFirestoreDate(latestPayment.date);
                }
            }
            
            // Actualizar la UI
            if (pagosPendientesEl) pagosPendientesEl.textContent = pendingCount;
            if (totalPendienteEl) totalPendienteEl.textContent = formatCurrency(totalPendiente);
            if (pagosCompletadosEl) pagosCompletadosEl.textContent = completedCount;
            if (ultimoPagoEl) ultimoPagoEl.textContent = ultimoPago;
            
        } catch (error) {
            console.error('Error al cargar estadísticas de pagos:', error);
            throw error;
        }
    }
    
    // Cargar pagos pendientes
    async function loadPendingPayments(userId) {
        if (!pendingPaymentsList) return;
        
        try {
            // Mostrar estado de carga
            pendingPaymentsList.innerHTML = '<div class="loading-message">Cargando pagos pendientes...</div>';
            
            // Consultar pagos pendientes
            const snapshot = await db.collection('pagos')
                .where('clientId', '==', userId)
                .where('status', '==', 'pending')
                .get();
            
            // Si no hay pagos pendientes
            if (snapshot.empty) {
                pendingPaymentsList.innerHTML = '<div class="empty-message">No hay pagos pendientes</div>';
                return;
            }
            
            // Ordenar por fecha de vencimiento (más urgentes primero)
            const pendingPayments = [];
            snapshot.forEach(doc => {
                pendingPayments.push({
                    id: doc.id,
                    data: doc.data()
                });
            });
            
            pendingPayments.sort((a, b) => {
                const dateA = a.data.dueDate ? a.data.dueDate.seconds : 0;
                const dateB = b.data.dueDate ? b.data.dueDate.seconds : 0;
                return dateA - dateB;
            });
            
            // Limpiar contenedor
            pendingPaymentsList.innerHTML = '';
            
            // Crear tarjeta para cada pago pendiente
            pendingPayments.forEach(payment => {
                createPendingPaymentCard(userId, payment.id, payment.data);
            });
            
        } catch (error) {
            console.error('Error al cargar pagos pendientes:', error);
            pendingPaymentsList.innerHTML = '<div class="error-message">Error al cargar pagos pendientes</div>';
        }
    }
    
    // Cargar historial de pagos
    async function loadPaymentHistory(userId) {
        if (!paymentsHistoryList) return;
        
        try {
            // Mostrar estado de carga
            paymentsHistoryList.innerHTML = '<div class="loading-message">Cargando historial de pagos...</div>';
            
            // Consultar pagos completados
            const snapshot = await db.collection('pagos')
                .where('clientId', '==', userId)
                .where('status', '==', 'completed')
                .orderBy('date', 'desc')
                .limit(10)
                .get();
            
            // Si no hay pagos completados
            if (snapshot.empty) {
                paymentsHistoryList.innerHTML = '<div class="empty-message">No hay pagos realizados</div>';
                return;
            }
            
            // Limpiar contenedor
            paymentsHistoryList.innerHTML = '';
            
            // Crear elemento para cada pago completado
            snapshot.forEach(doc => {
                createPaymentHistoryItem(doc.id, doc.data());
            });
            
        } catch (error) {
            console.error('Error al cargar historial de pagos:', error);
            paymentsHistoryList.innerHTML = '<div class="error-message">Error al cargar historial de pagos</div>';
        }
    }
    
    // Crear tarjeta de pago pendiente
    function createPendingPaymentCard(userId, paymentId, paymentData) {
        const card = document.createElement('div');
        card.className = 'payment-card';
        
        // Verificar si el pago está vencido
        const dueDate = paymentData.dueDate ? new Date(paymentData.dueDate.seconds * 1000) : null;
        const isOverdue = dueDate && dueDate < new Date();
        
        // Formatear fecha de vencimiento
        const formattedDueDate = dueDate ? formatFirestoreDate(paymentData.dueDate) : 'N/A';
        
        // Crear HTML de la tarjeta
        card.innerHTML = `
            <div class="payment-header">
                <h3 class="payment-title">${paymentData.serviceName || 'Servicio'}</h3>
                <div class="payment-amount">${formatCurrency(paymentData.amount || 0)}</div>
            </div>
            <div class="payment-details">
                <div class="payment-detail">
                    <span class="detail-label">Factura:</span>
                    <span class="detail-value">${paymentId.substring(0, 8).toUpperCase()}</span>
                </div>
                <div class="payment-detail">
                    <span class="detail-label">Fecha límite:</span>
                    <span class="detail-value payment-due-date">${formattedDueDate}</span>
                </div>
            </div>
            <div class="payment-footer">
                <div class="payment-status">
                    <span class="status-dot ${isOverdue ? 'overdue' : 'pending'}"></span>
                    <span class="status-label ${isOverdue ? 'overdue' : 'pending'}">${isOverdue ? 'Vencido' : 'Pendiente'}</span>
                </div>
                <button class="btn-primary make-payment-btn" data-id="${paymentId}">Realizar Pago</button>
            </div>
        `;
        
        // Agregar evento al botón de pago
        const payButton = card.querySelector('.make-payment-btn');
        if (payButton) {
            payButton.addEventListener('click', function() {
                openPaymentModal(userId, paymentId, paymentData);
            });
        }
        
        // Agregar tarjeta al contenedor
        pendingPaymentsList.appendChild(card);
    }
    
    // Crear elemento de historial de pago
    function createPaymentHistoryItem(paymentId, paymentData) {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        // Formatear fecha de pago
        const paymentDate = paymentData.date ? formatFirestoreDate(paymentData.date) : 'N/A';
        
        // Crear HTML del elemento
        item.innerHTML = `
            <div class="history-icon">
                <i class="fas fa-credit-card"></i>
            </div>
            <div class="history-details">
                <h3 class="history-title">${paymentData.serviceName || 'Servicio'}</h3>
                <p class="history-description">
                    Método: ${getPaymentMethodName(paymentData.method)}
                    ${paymentData.reference ? ` / Ref: ${paymentData.reference}` : ''}
                </p>
            </div>
            <div class="history-meta">
                <div class="history-amount">${formatCurrency(paymentData.amount || 0)}</div>
                <div class="history-date">${paymentDate}</div>
            </div>
        `;
        
        // Agregar evento al hacer clic para ver comprobante/factura
        item.addEventListener('click', function() {
            // Si hay un comprobante PDF disponible, mostrarlo
            if (paymentData.receiptUrl) {
                window.open(paymentData.receiptUrl, '_blank');
            } else {
                showPaymentDetails(paymentId, paymentData);
            }
        });
        
        // Agregar al contenedor
        paymentsHistoryList.appendChild(item);
    }
    
    // Abrir modal de pago
    function openPaymentModal(userId, paymentId, paymentData) {
        const paymentModal = document.getElementById('payment-modal');
        if (!paymentModal) return;
        
        // Guardar ID del pago actual
        currentPaymentId = paymentId;
        
        // Llenar detalles del pago en el modal
        document.getElementById('payment-invoice-id').textContent = paymentId.substring(0, 8).toUpperCase();
        document.getElementById('payment-service').textContent = paymentData.serviceName || 'Servicio';
        document.getElementById('payment-amount').textContent = formatCurrency(paymentData.amount || 0);
        
        // Formatear fecha de vencimiento
        const dueDate = paymentData.dueDate ? formatFirestoreDate(paymentData.dueDate) : 'N/A';
        document.getElementById('payment-due-date').textContent = dueDate;
        
        // Establecer referencia para transferencia
        document.getElementById('payment-reference').textContent = paymentId.substring(0, 8).toUpperCase();
        
        // Mostrar modal
        paymentModal.classList.add('active');
    }
    
    // Mostrar detalles de un pago
    function showPaymentDetails(paymentId, paymentData) {
        // Crear modal dinámicamente
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'payment-details-modal';
        
        // Formatear fecha de pago
        const paymentDate = paymentData.date ? 
                          formatFirestoreDate(paymentData.date) : 'N/A';
        
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
                            <div class="detail-label">Referencia:</div>
                            <div class="detail-value">${paymentId.substring(0, 8).toUpperCase()}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Servicio:</div>
                            <div class="detail-value">${paymentData.serviceName || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Monto:</div>
                            <div class="detail-value">${formatCurrency(paymentData.amount || 0)}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Fecha:</div>
                            <div class="detail-value">${paymentDate}</div>
                        </div>
                    </div>
                    
                    <div class="payment-details-section">
                        <h4>Método de Pago</h4>
                        <div class="detail-row">
                            <div class="detail-label">Método:</div>
                            <div class="detail-value">${getPaymentMethodName(paymentData.method)}</div>
                        </div>
                        ${paymentData.reference ? `
                        <div class="detail-row">
                            <div class="detail-label">Referencia:</div>
                            <div class="detail-value">${paymentData.reference}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${paymentData.receiptUrl ? `
                    <div class="payment-details-section">
                        <h4>Comprobante</h4>
                        <div class="receipt-preview">
                            <img src="${paymentData.receiptUrl}" alt="Comprobante de pago">
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary close-details-btn">Cerrar</button>
                    ${paymentData.invoiceUrl ? `
                    <a href="${paymentData.invoiceUrl}" class="btn-primary" target="_blank">
                        <i class="fas fa-download"></i> Descargar Factura
                    </a>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Agregar modal al DOM
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Evento para botón de cerrar
        const closeBtn = modal.querySelector('.modal-close');
        const closeDetailsBtn = modal.querySelector('.close-details-btn');
        
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
        
        // Cerrar al hacer clic fuera del contenido
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    
    // Procesar pago
    async function processPayment(userId) {
        const paymentForm = document.getElementById('payment-form');
        const paymentModal = document.getElementById('payment-modal');
        const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
        
        if (!paymentForm || !currentPaymentId) return;
        
        // Obtener valores del formulario
        const method = document.getElementById('payment-method').value;
        
        // Validar método de pago
        if (!method) {
            showToast('Error', 'Debe seleccionar un método de pago', 'error');
            return;
        }
        
        // Variables para datos específicos del método
        let cardNumber = '';
        let cardExpiry = '';
        let cardCVC = '';
        let cardName = '';
        let proofImage = null;
        
        // Validar campos según método de pago
        if (method === 'credit_card' || method === 'debit_card') {
            cardNumber = document.getElementById('card-number').value;
            cardExpiry = document.getElementById('card-expiry').value;
            cardCVC = document.getElementById('card-cvc').value;
            cardName = document.getElementById('card-name').value;
            
            if (!cardNumber || !cardExpiry || !cardCVC || !cardName) {
                showToast('Error', 'Debe completar todos los campos de la tarjeta', 'error');
                return;
            }
        } else if (method === 'bank_transfer') {
            const transferProofInput = document.getElementById('transfer-proof');
            
            if (!transferProofInput || !transferProofInput.files || !transferProofInput.files[0]) {
                showToast('Error', 'Debe adjuntar el comprobante de transferencia', 'error');
                return;
            }
            
            proofImage = transferProofInput.files[0];
        }
        
        // Mostrar estado de carga
        if (confirmPaymentBtn) {
            confirmPaymentBtn.disabled = true;
            confirmPaymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        }
        
        try {
            // Obtener datos del pago actual
            const paymentDoc = await db.collection('pagos').doc(currentPaymentId).get();
            
            if (!paymentDoc.exists) {
                throw new Error('No se encontró el pago');
            }
            
            const paymentData = paymentDoc.data();
            
            // Crear referencia única para el pago
            const paymentReference = `${method.substring(0, 3).toUpperCase()}-${Date.now().toString().substring(6)}`;
            
            // URL del comprobante (si se subió uno)
            let receiptUrl = null;
            
            // Si es transferencia, subir comprobante
            if (method === 'bank_transfer' && proofImage) {
                const storageRef = storage.ref();
                const imageRef = storageRef.child(`payments/${userId}/${currentPaymentId}_proof.jpg`);
                
                // Subir imagen
                await imageRef.put(proofImage);
                
                // Obtener URL
                receiptUrl = await imageRef.getDownloadURL();
            }
            
            // Actualizar pago en Firestore
            await db.collection('pagos').doc(currentPaymentId).update({
                status: 'completed',
                method,
                reference: paymentReference,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                receiptUrl
            });
            
            // Generar factura (si no existe)
            let invoiceUrl = null;
            
            // Verificar si ya existe una factura
            const invoicesSnapshot = await db.collection('facturas')
                .where('paymentId', '==', currentPaymentId)
                .limit(1)
                .get();
            
            if (invoicesSnapshot.empty) {
                // Datos para la factura
                const invoiceData = {
                    paymentId: currentPaymentId,
                    clientId: userId,
                    clientName: paymentData.clientName,
                    clientEmail: paymentData.clientEmail,
                    serviceId: paymentData.serviceId,
                    serviceName: paymentData.serviceName,
                    amount: paymentData.amount,
                    date: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'paid',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Guardar en Firestore
                await db.collection('facturas').add(invoiceData);
            }
            
            // Crear notificación para el usuario
            await createUserNotification(
                'payment', 
                'Pago Confirmado', 
                `Su pago de ${formatCurrency(paymentData.amount || 0)} ha sido procesado correctamente.`
            );
            
            // Crear notificación para administradores
            if (typeof window.createAdminNotification === 'function') {
                window.createAdminNotification({
                    type: 'payment',
                    title: 'Nuevo Pago Realizado',
                    message: `${paymentData.clientName || 'Cliente'} ha realizado un pago de ${formatCurrency(paymentData.amount || 0)}`,
                    link: `payments:view:${currentPaymentId}`
                });
            }
            
            // Mostrar mensaje de éxito
            showToast('Éxito', 'Pago procesado correctamente', 'success');
            
            // Cerrar modal y recargar datos
            paymentModal.classList.remove('active');
            
            // Recargar datos
            loadPaymentsData(userId);
            
        } catch (error) {
            console.error('Error al procesar pago:', error);
            showToast('Error', 'No se pudo procesar el pago: ' + error.message, 'error');
        } finally {
            // Restaurar botón
            if (confirmPaymentBtn) {
                confirmPaymentBtn.disabled = false;
                confirmPaymentBtn.textContent = 'Confirmar Pago';
            }
        }
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
});