document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const planClientsContainer = document.getElementById('plan-clients-container');
    const planNameSpan = document.getElementById('plan-name');
    const planClientsBody = document.getElementById('plan-clients-body');
    const closePlanClientsBtn = document.getElementById('close-plan-clients');
    const planModal = document.getElementById('plan-modal');
    const planForm = document.getElementById('plan-form');
    const planIdInput = document.getElementById('plan-id');
    const planNameInput = document.getElementById('plan-name');
    const planPriceInput = document.getElementById('plan-price');
    const planFeaturesContainer = document.getElementById('plan-features-container');
    const addFeatureBtn = document.getElementById('add-feature-btn');
    const savePlanBtn = document.getElementById('save-plan-btn');
    const modalCloseBtn = document.querySelector('#plan-modal .modal-close');
    const cancelPlanBtn = document.querySelector('.cancel-plan-btn');
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
    
    // Definir los planes por defecto (para tener algo inicialmente)
    const defaultPlans = {
        premium: {
            id: 'premium',
            name: 'Premium',
            price: 99.99,
            features: [
                'Monitoreo 24/7',
                'Respuesta de emergencia',
                'Hasta 8 dispositivos',
                'Soporte prioritario',
                'Alertas en tiempo real'
            ]
        },
        basic: {
            id: 'basic',
            name: 'Básico',
            price: 49.99,
            features: [
                'Monitoreo en horario laboral',
                'Alertas por email',
                'Hasta 3 dispositivos',
                'Soporte estándar'
            ]
        }
    };
    
    // Verificar o crear planes en Firebase
    function initPlans() {
        const plansRef = firebase.firestore().collection('plans');
        
        // Verificar si existen los planes básicos
        Object.values(defaultPlans).forEach(plan => {
            plansRef.doc(plan.id).get()
                .then(doc => {
                    if (!doc.exists) {
                        // Si no existe, crearlo
                        plansRef.doc(plan.id).set({
                            name: plan.name,
                            price: plan.price,
                            features: plan.features,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                })
                .catch(error => {
                    console.error("Error verificando plan:", error);
                });
        });
    }
    
    // Cargar planes desde Firebase
    function loadPlans() {
        const premiumCardEl = document.querySelector('.plan-card.premium');
        const basicCardEl = document.querySelector('.plan-card.basic');
        
        if (!premiumCardEl || !basicCardEl) return;
        
        const plansRef = firebase.firestore().collection('plans');
        
        // Cargar plan Premium
        plansRef.doc('premium').get()
            .then(doc => {
                if (doc.exists) {
                    const planData = doc.data();
                    updatePlanCard(premiumCardEl, planData);
                }
            })
            .catch(error => {
                console.error("Error cargando plan Premium:", error);
            });
        
        // Cargar plan Básico
        plansRef.doc('basic').get()
            .then(doc => {
                if (doc.exists) {
                    const planData = doc.data();
                    updatePlanCard(basicCardEl, planData);
                }
            })
            .catch(error => {
                console.error("Error cargando plan Básico:", error);
            });
    }
    
    // Actualizar tarjeta de plan con los datos
    function updatePlanCard(cardElement, planData) {
        const priceEl = cardElement.querySelector('.price');
        const featuresListEl = cardElement.querySelector('.plan-features ul');
        
        if (priceEl) {
            priceEl.textContent = `$${planData.price.toFixed(2)}`;
        }
        
        if (featuresListEl && planData.features) {
            featuresListEl.innerHTML = '';
            planData.features.forEach(feature => {
                featuresListEl.innerHTML += `<li><i class="fas fa-check"></i> ${feature}</li>`;
            });
        }
    }
    
    // Configurar botones de ver clientes
    document.querySelectorAll('.view-clients').forEach(button => {
        button.addEventListener('click', function() {
            const planId = this.getAttribute('data-id');
            loadClientsByPlan(planId);
        });
    });
    
    // Configurar botones de editar plan
    document.querySelectorAll('.edit-plan').forEach(button => {
        button.addEventListener('click', function() {
            const planId = this.getAttribute('data-id');
            openPlanModal(planId);
        });
    });
    
    // Cerrar vista de clientes
    if (closePlanClientsBtn) {
        closePlanClientsBtn.addEventListener('click', function() {
            planClientsContainer.style.display = 'none';
        });
    }
    
    // Función para abrir el modal de edición de plan
    function openPlanModal(planId) {
        // Resetear formulario
        planForm.reset();
        planFeaturesContainer.innerHTML = '';
        
        // Establecer ID del plan
        planIdInput.value = planId;
        
        // Cargar datos del plan desde Firebase
        firebase.firestore().collection('plans').doc(planId).get()
            .then(doc => {
                if (doc.exists) {
                    const planData = doc.data();
                    
                    // Llenar formulario
                    planNameInput.value = planData.name || '';
                    planPriceInput.value = planData.price || '';
                    
                    // Llenar características
                    if (planData.features && planData.features.length > 0) {
                        planData.features.forEach(feature => {
                            addFeatureInput(feature);
                        });
                    } else {
                        // Agregar al menos una característica vacía
                        addFeatureInput('');
                    }
                } else {
                    // Plan no encontrado, usar valores por defecto
                    const defaultPlan = defaultPlans[planId];
                    if (defaultPlan) {
                        planNameInput.value = defaultPlan.name;
                        planPriceInput.value = defaultPlan.price;
                        
                        defaultPlan.features.forEach(feature => {
                            addFeatureInput(feature);
                        });
                    } else {
                        // Si no hay default, agregar una característica vacía
                        addFeatureInput('');
                    }
                }
                
                // Mostrar modal
                planModal.classList.add('active');
            })
            .catch(error => {
                console.error("Error cargando datos del plan:", error);
                alert("Error al cargar los datos del plan. Por favor, intenta de nuevo.");
            });
    }
    
    // Función para agregar un campo de característica
    function addFeatureInput(value = '') {
        const featureItem = document.createElement('div');
        featureItem.className = 'feature-item';
        featureItem.innerHTML = `
            <input type="text" class="feature-input" placeholder="Característica del plan" value="${value}" required>
            <button type="button" class="btn-icon remove-feature">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Agregar listener para eliminar característica
        const removeBtn = featureItem.querySelector('.remove-feature');
        removeBtn.addEventListener('click', function() {
            // No eliminar si es la única característica
            if (planFeaturesContainer.querySelectorAll('.feature-item').length > 1) {
                featureItem.remove();
            } else {
                // Si es la última, solo limpiar el valor
                featureItem.querySelector('.feature-input').value = '';
            }
        });
        
        planFeaturesContainer.appendChild(featureItem);
    }
    
    // Listener para botón de agregar característica
    if (addFeatureBtn) {
        addFeatureBtn.addEventListener('click', function() {
            addFeatureInput();
        });
    }
    
    // Listener para formulario de plan
    if (planForm) {
        planForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePlan();
        });
    }
    
    // Cerrar modal de plan
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', function() {
            planModal.classList.remove('active');
        });
    }
    
    if (cancelPlanBtn) {
        cancelPlanBtn.addEventListener('click', function() {
            planModal.classList.remove('active');
        });
    }
    
    // Función para guardar plan
    function savePlan() {
        // Obtener datos del formulario
        const planId = planIdInput.value;
        const name = planNameInput.value.trim();
        const price = parseFloat(planPriceInput.value);
        
        // Obtener características
        const features = [];
        planFeaturesContainer.querySelectorAll('.feature-input').forEach(input => {
            const feature = input.value.trim();
            if (feature) {
                features.push(feature);
            }
        });
        
        // Validar datos
        if (!name || isNaN(price) || features.length === 0) {
            alert('Por favor, completa todos los campos y agrega al menos una característica');
            return;
        }
        
        // Mostrar estado de carga
        savePlanBtn.disabled = true;
        savePlanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Guardar en Firebase
        firebase.firestore().collection('plans').doc(planId).set({
            name,
            price,
            features,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
            .then(() => {
                alert('Plan actualizado correctamente');
                planModal.classList.remove('active');
                
                // Recargar información de planes
                loadPlans();
            })
            .catch(error => {
                console.error("Error guardando plan:", error);
                alert("Error al guardar el plan. Por favor, intenta de nuevo.");
            })
            .finally(() => {
                savePlanBtn.disabled = false;
                savePlanBtn.textContent = 'Guardar Plan';
            });
    }
    
    // Cargar clientes por plan
    function loadClientsByPlan(planId) {
        // Mostrar contenedor de clientes
        planClientsContainer.style.display = 'block';
        planNameSpan.textContent = planId === 'premium' ? 'Premium' : 'Básico';
        
        // Mostrar loader
        planClientsBody.innerHTML = '<tr><td colspan="5" class="loading-message">Cargando clientes...</td></tr>';
        
        // Cargar clientes desde Firebase
        // Primero buscar suscripciones activas para este plan
        firebase.firestore().collection('subscriptions')
            .where('planId', '==', planId)
            .where('status', '==', 'active')
            .get()
            .then(async (snapshot) => {
                if (snapshot.empty) {
                    planClientsBody.innerHTML = '<tr><td colspan="5" class="empty-message">No hay clientes con este plan</td></tr>';
                    return;
                }
                
                planClientsBody.innerHTML = '';
                
                // Para cada suscripción, obtener datos del cliente
                for (const doc of snapshot.docs) {
                    const subscription = doc.data();
                    
                    try {
                        // Obtener datos del cliente
                        const clientDoc = await firebase.firestore().collection('usuarios')
                            .doc(subscription.clientId)
                            .get();
                        
                        if (clientDoc.exists) {
                            const client = clientDoc.data();
                            
                            // Formatear fechas
                            const startDate = new Date(subscription.startDate).toLocaleDateString();
                            const nextBillingDate = new Date(subscription.nextBillingDate).toLocaleDateString();
                            
                            // Crear fila de tabla
                            planClientsBody.innerHTML += `
                                <tr>
                                    <td>${client.name || client.email}</td>
                                    <td>${startDate}</td>
                                    <td>${nextBillingDate}</td>
                                    <td><span class="status-badge ${subscription.status}">${getStatusName(subscription.status)}</span></td>
                                    <td>
                                        <button class="btn-icon edit-subscription" data-id="${doc.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon generate-invoice" data-id="${doc.id}" data-client="${subscription.clientId}">
                                            <i class="fas fa-file-invoice-dollar"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }
                    } catch (error) {
                        console.error("Error obteniendo cliente:", error);
                    }
                }
                
                // Añadir event listeners a botones
                setupClientButtons();
            })
            .catch(error => {
                console.error("Error cargando clientes:", error);
                planClientsBody.innerHTML = '<tr><td colspan="5" class="error-message">Error al cargar los clientes</td></tr>';
            });
    }
    
    // Configurar botones para cada cliente
    function setupClientButtons() {
        // Botones de editar suscripción
          document.querySelectorAll('.edit-subscription').forEach(button => {
        button.addEventListener('click', function() {
            const subscriptionId = this.getAttribute('data-id');
            alert(`La edición de la suscripción ${subscriptionId} está en desarrollo.`);
        });
    });
        
        // Botones de generar factura
        document.querySelectorAll('.generate-invoice').forEach(button => {
        button.addEventListener('click', function() {
            const subscriptionId = this.getAttribute('data-id');
            const clientId = this.getAttribute('data-client');
            
            // Usar la función del módulo de facturas si está disponible
            if (window.invoiceModule && window.invoiceModule.openInvoiceModal) {
                window.invoiceModule.openInvoiceModal(clientId, subscriptionId);
            } else {
                // Fallback por si el módulo no está cargado
                alert(`Generando factura para el cliente ${clientId} (suscripción ${subscriptionId})`);
            }
        });
    });
}
    
    // Obtener nombre legible del estado
    function getStatusName(status) {
        const statuses = {
            'active': 'Activo',
            'paused': 'Pausado',
            'cancelled': 'Cancelado',
            'trial': 'Prueba'
        };
        
        return statuses[status] || status;
    }
    
    // Inicializar planes y cargar datos
    initPlans();
    loadPlans();
});