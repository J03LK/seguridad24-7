// dashboard.js - Funcionalidad para la sección principal del dashboard de cliente

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const reportesActivosEl = document.getElementById('reportes-activos');
    const facturasPendientesEl = document.getElementById('facturas-pendientes');
    const totalDispositivosEl = document.getElementById('total-dispositivos');
    const recentReportsEl = document.getElementById('recent-reports');
    const recentPaymentsEl = document.getElementById('recent-payments');
    
    // Verificar autenticación y cargar datos
    auth.onAuthStateChanged(user => {
        if (user) {
            loadDashboardData(user.uid);
        }
    });
    
    // Función para cargar los datos del dashboard
    async function loadDashboardData(userId) {
        try {
            // Cargar datos de diferentes secciones
            await Promise.all([
                loadUserStats(userId),
                loadRecentReports(userId),
                loadRecentPayments(userId)
            ]);
        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
            showToast('Error', 'No se pudieron cargar todos los datos del dashboard', 'error');
        }
    }
    
    // Cargar estadísticas del usuario
    async function loadUserStats(userId) {
        try {
            // 1. Contar reportes activos (pendientes o en proceso)
            const reportesSnapshot = await db.collection('reportes')
                .where('clientId', '==', userId)
                .where('status', 'in', ['pending', 'in-progress'])
                .get();
            
            const reportesActivos = reportesSnapshot.size;
            
            // 2. Contar facturas pendientes
            const facturasSnapshot = await db.collection('pagos')
                .where('clientId', '==', userId)
                .where('status', '==', 'pending')
                .get();
            
            const facturasPendientes = facturasSnapshot.size;
            
            // 3. Contar dispositivos
            const dispositivosSnapshot = await db.collection('dispositivos')
                .where('clientId', '==', userId)
                .get();
            
            const totalDispositivos = dispositivosSnapshot.size;
            
            // Actualizar la UI con los datos obtenidos
            if (reportesActivosEl) reportesActivosEl.textContent = reportesActivos;
            if (facturasPendientesEl) facturasPendientesEl.textContent = facturasPendientes;
            if (totalDispositivosEl) totalDispositivosEl.textContent = totalDispositivos;
            
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            throw error;
        }
    }
    
    // Cargar reportes recientes
    async function loadRecentReports(userId) {
        if (!recentReportsEl) return;
        
        try {
            // Consultar los 3 reportes más recientes
            const reportesSnapshot = await db.collection('reportes')
                .where('clientId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(3)
                .get();
            
            if (reportesSnapshot.empty) {
                recentReportsEl.innerHTML = '<div class="empty-message">No hay reportes recientes</div>';
                return;
            }
            
            // Limpiar contenedor
            recentReportsEl.innerHTML = '';
            
            // Procesar cada reporte
            reportesSnapshot.forEach(doc => {
                const reportData = doc.data();
                const reportId = doc.id;
                
                createRecentReportItem(reportId, reportData);
            });
            
        } catch (error) {
            console.error('Error al cargar reportes recientes:', error);
            recentReportsEl.innerHTML = '<div class="error-message">Error al cargar reportes</div>';
            throw error;
        }
    }
    
    // Crear elemento para un reporte reciente
    function createRecentReportItem(reportId, reportData) {
        // Convertir timestamp a fecha legible
        const createdDate = reportData.createdAt ? getTimeAgo(reportData.createdAt) : 'N/A';
        
        // Determinar tipo de reporte e icono
        const reportTypes = {
            'alert': { icon: 'fa-exclamation-circle', class: 'error' },
            'error': { icon: 'fa-exclamation-triangle', class: 'error' },
            'maintenance': { icon: 'fa-tools', class: 'warning' },
            'info': { icon: 'fa-info-circle', class: 'info' }
        };
        
        const typeInfo = reportTypes[reportData.type] || reportTypes.info;
        
        // Determinar estado del reporte
        const reportStatuses = {
            'pending': { name: 'Pendiente', class: 'pending' },
            'in-progress': { name: 'En Proceso', class: 'in-progress' },
            'completed': { name: 'Resuelto', class: 'completed' }
        };
        
        const statusInfo = reportStatuses[reportData.status] || reportStatuses.pending;
        
        // Crear elemento
        const reportItem = document.createElement('div');
        reportItem.className = 'recent-item';
        reportItem.innerHTML = `
            <div class="recent-icon ${typeInfo.class}">
                <i class="fas ${typeInfo.icon}"></i>
            </div>
            <div class="recent-details">
                <h4>${reportData.title || 'Sin título'}</h4>
                <p>${reportData.description ? reportData.description.substring(0, 60) + '...' : 'Sin descripción'}</p>
                <span class="recent-time">${createdDate}</span>
            </div>
            <div class="recent-status ${statusInfo.class}">
                <span>${statusInfo.name}</span>
            </div>
        `;
        
        // Agregar evento click para ver detalles
        reportItem.addEventListener('click', function() {
            // Cambiar a la sección de reportes
            document.querySelector('.sidebar-menu a[data-section="reportes"]').click();
            
            // Aquí se puede agregar código para mostrar detalles específicos del reporte
            // Por ejemplo, abrir modal de detalles
        });
        
        // Agregar al contenedor
        recentReportsEl.appendChild(reportItem);
    }
    
    // Cargar pagos recientes
    async function loadRecentPayments(userId) {
        if (!recentPaymentsEl) return;
        
        try {
            // Consultar los 3 pagos más recientes
            const pagosSnapshot = await db.collection('pagos')
                .where('clientId', '==', userId)
                .where('status', '==', 'completed')
                .orderBy('date', 'desc')
                .limit(3)
                .get();
            
            if (pagosSnapshot.empty) {
                recentPaymentsEl.innerHTML = '<div class="empty-message">No hay pagos recientes</div>';
                return;
            }
            
            // Limpiar contenedor
            recentPaymentsEl.innerHTML = '';
            
            // Procesar cada pago
            pagosSnapshot.forEach(doc => {
                const paymentData = doc.data();
                const paymentId = doc.id;
                
                createRecentPaymentItem(paymentId, paymentData);
            });
            
        } catch (error) {
            console.error('Error al cargar pagos recientes:', error);
            recentPaymentsEl.innerHTML = '<div class="error-message">Error al cargar pagos</div>';
            throw error;
        }
    }
    
    // Crear elemento para un pago reciente
    function createRecentPaymentItem(paymentId, paymentData) {
        // Convertir timestamp a fecha legible
        const paymentDate = paymentData.date ? getTimeAgo(paymentData.date) : 'N/A';
        
        // Crear elemento
        const paymentItem = document.createElement('div');
        paymentItem.className = 'recent-item';
        paymentItem.innerHTML = `
            <div class="recent-icon payment">
                <i class="fas fa-credit-card"></i>
            </div>
            <div class="recent-details">
                <h4>${paymentData.serviceName || 'Pago'}</h4>
                <p>Método: ${getPaymentMethodName(paymentData.method)}</p>
                <span class="recent-time">${paymentDate}</span>
            </div>
            <div class="recent-amount">
                <span>${formatCurrency(paymentData.amount || 0)}</span>
            </div>
        `;
        
        // Agregar evento click para ver detalles
        paymentItem.addEventListener('click', function() {
            // Cambiar a la sección de pagos
            document.querySelector('.sidebar-menu a[data-section="pagos"]').click();
            
            // Aquí se puede agregar código para mostrar detalles específicos del pago
        });
        
        // Agregar al contenedor
        recentPaymentsEl.appendChild(paymentItem);
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