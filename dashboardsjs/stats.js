// dashboard-stats.js - Actualizar estadísticas del dashboard con datos reales
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined') {
        console.error('Firebase no está definido');
        return;
    }

    // Referencias a Firebase
    const db = firebase.firestore();
    
    // Actualizar todas las estadísticas del dashboard
    updateDashboardStats();
    updateRecentReports();
    updateRecentPayments();

    // ===== FUNCIONES PARA ACTUALIZAR ESTADÍSTICAS =====
    
    // Actualizar estadísticas principales del dashboard
    async function updateDashboardStats() {
        try {
            // 1. Contar clientes activos
            const activeClientsSnapshot = await db.collection('usuarios')
                .where('role', '==', 'user')
                .where('status', '==', 'active')
                .get();
                
            const activeClientsCount = activeClientsSnapshot.size;
            updateClientStats(activeClientsCount);

            // 2. Contar reportes pendientes
            const pendingReportsSnapshot = await db.collection('reportes')
                .where('status', '==', 'pending')
                .get();
                
            const pendingReportsCount = pendingReportsSnapshot.size;
            updateReportStats(pendingReportsCount);

            // 3. Contar servicios activos
            const activeServicesSnapshot = await db.collection('productos')
                .where('active', '==', true)
                .get();
                
            const activeServicesCount = activeServicesSnapshot.size;
            updateServiceStats(activeServicesCount);

            // 4. Calcular ingresos mensuales
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);

            const monthlyPaymentsSnapshot = await db.collection('pagos')
                .where('status', '==', 'completed')
                .where('date', '>=', firstDayOfMonth)
                .get();
                
            let monthlyIncome = 0;
            monthlyPaymentsSnapshot.forEach(doc => {
                const payment = doc.data();
                monthlyIncome += payment.amount || 0;
            });
            
            updateIncomeStats(monthlyIncome);

            // Calcular tendencias
            await calculateTrends();

        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
        }
    }

    // Actualizar estadísticas de clientes
    function updateClientStats(count) {
        const clientCard = document.querySelector('.dashboard-stats .stat-card:nth-child(1)');
        if (clientCard) {
            const numberElement = clientCard.querySelector('.stat-number');
            const growthElement = clientCard.querySelector('.stat-growth');
            
            if (numberElement) {
                numberElement.textContent = count.toString();
            }
            
            // Calcular crecimiento mensual
            calculateMonthlyGrowth('usuarios', count).then(growth => {
                if (growthElement && growth !== null) {
                    growthElement.textContent = `${growth >= 0 ? '+' : ''}${growth}% este mes`;
                    growthElement.className = `stat-growth ${growth >= 0 ? 'positive' : 'negative'}`;
                }
            });
        }
    }

    // Actualizar estadísticas de reportes
    function updateReportStats(count) {
        const reportCard = document.querySelector('.dashboard-stats .stat-card:nth-child(2)');
        if (reportCard) {
            const numberElement = reportCard.querySelector('.stat-number');
            const growthElement = reportCard.querySelector('.stat-growth');
            
            if (numberElement) {
                numberElement.textContent = count.toString();
            }
            
            // Calcular cambio desde ayer
            calculateDailyChange('reportes', count).then(change => {
                if (growthElement && change !== null) {
                    const text = change === 0 ? 'Sin cambios desde ayer' : 
                                 `${change > 0 ? '+' : ''}${change} desde ayer`;
                    growthElement.textContent = text;
                    growthElement.className = `stat-growth ${change > 0 ? 'negative' : 'positive'}`;
                }
            });
        }
    }

    // Actualizar estadísticas de servicios
    function updateServiceStats(count) {
        const serviceCard = document.querySelector('.dashboard-stats .stat-card:nth-child(3)');
        if (serviceCard) {
            const numberElement = serviceCard.querySelector('.stat-number');
            const growthElement = serviceCard.querySelector('.stat-growth');
            
            if (numberElement) {
                numberElement.textContent = count.toString();
            }
            
            // Calcular crecimiento mensual
            calculateMonthlyGrowth('productos', count).then(growth => {
                if (growthElement && growth !== null) {
                    growthElement.textContent = `${growth >= 0 ? '+' : ''}${growth}% este mes`;
                    growthElement.className = `stat-growth ${growth >= 0 ? 'positive' : 'negative'}`;
                }
            });
        }
    }

    // Actualizar estadísticas de ingresos
    function updateIncomeStats(amount) {
        const incomeCard = document.querySelector('.dashboard-stats .stat-card:nth-child(4)');
        if (incomeCard) {
            const numberElement = incomeCard.querySelector('.stat-number');
            const growthElement = incomeCard.querySelector('.stat-growth');
            
            if (numberElement) {
                numberElement.textContent = `$${amount.toLocaleString('es-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            
            // Calcular crecimiento vs mes anterior
            calculateMonthlyIncomeGrowth(amount).then(growth => {
                if (growthElement && growth !== null) {
                    growthElement.textContent = `${growth >= 0 ? '+' : ''}${growth}% vs mes anterior`;
                    growthElement.className = `stat-growth ${growth >= 0 ? 'positive' : 'negative'}`;
                }
            });
        }
    }

    // ===== FUNCIONES PARA REPORTES Y PAGOS RECIENTES =====
    
    // Actualizar reportes recientes
    async function updateRecentReports() {
        try {
            const reportsContainer = document.querySelector('.dashboard-recent .recent-container:first-child .recent-body');
            if (!reportsContainer) return;

            // Limpiar contenedor
            reportsContainer.innerHTML = '';

            // Obtener reportes recientes
            const reportsSnapshot = await db.collection('reportes')
                .orderBy('createdAt', 'desc')
                .limit(3)
                .get();

            if (reportsSnapshot.empty) {
                reportsContainer.innerHTML = '<div class="empty-message">No hay reportes recientes</div>';
                return;
            }

            // Mostrar cada reporte
            reportsSnapshot.forEach(doc => {
                const report = doc.data();
                const reportElement = createReportElement(doc.id, report);
                reportsContainer.appendChild(reportElement);
            });

        } catch (error) {
            console.error('Error cargando reportes recientes:', error);
        }
    }

    // Actualizar pagos recientes
    async function updateRecentPayments() {
        try {
            const paymentsContainer = document.querySelector('.dashboard-recent .recent-container:last-child .recent-body');
            if (!paymentsContainer) return;

            // Limpiar contenedor
            paymentsContainer.innerHTML = '';

            // Obtener pagos recientes
            const paymentsSnapshot = await db.collection('pagos')
                .where('status', '==', 'completed')
                .orderBy('date', 'desc')
                .limit(3)
                .get();

            if (paymentsSnapshot.empty) {
                paymentsContainer.innerHTML = '<div class="empty-message">No hay pagos recientes</div>';
                return;
            }

            // Mostrar cada pago
            paymentsSnapshot.forEach(doc => {
                const payment = doc.data();
                const paymentElement = createPaymentElement(doc.id, payment);
                paymentsContainer.appendChild(paymentElement);
            });

        } catch (error) {
            console.error('Error cargando pagos recientes:', error);
        }
    }

    // ===== FUNCIONES AUXILIARES =====
    
    // Crear elemento de reporte
    function createReportElement(id, report) {
        const div = document.createElement('div');
        div.className = 'recent-item';
        
        // Determinar tipo de icono y clase
        const typeInfo = getReportTypeInfo(report.type);
        
        // Calcular tiempo transcurrido
        const timeAgo = getTimeAgo(report.createdAt);
        
        // Determinar estado
        const statusInfo = getReportStatusInfo(report.status);
        
        div.innerHTML = `
            <div class="recent-icon ${typeInfo.class}">
                <i class="${typeInfo.icon}"></i>
            </div>
            <div class="recent-details">
                <h4>${report.title || 'Sin título'}</h4>
                <p>${report.description || 'Sin descripción'}</p>
                <span class="recent-time">${timeAgo}</span>
            </div>
            <div class="recent-status ${statusInfo.class}">
                <span>${statusInfo.text}</span>
            </div>
        `;
        
        return div;
    }

    // Crear elemento de pago
    function createPaymentElement(id, payment) {
        const div = document.createElement('div');
        div.className = 'recent-item';
        
        // Formatear fecha
        const paymentDate = payment.date ? 
            new Date(payment.date.seconds * 1000).toLocaleDateString() : 
            'Fecha no disponible';
        
        div.innerHTML = `
            <div class="recent-icon payment">
                <i class="fas fa-credit-card"></i>
            </div>
            <div class="recent-details">
                <h4>${payment.serviceName || 'Servicio'}</h4>
                <p>${payment.clientName || 'Cliente'}</p>
                <span class="recent-time">${paymentDate}</span>
            </div>
            <div class="recent-amount">
                <span>$${payment.amount ? payment.amount.toFixed(2) : '0.00'}</span>
            </div>
        `;
        
        return div;
    }

    // Obtener información del tipo de reporte
    function getReportTypeInfo(type) {
        const types = {
            'alert': { class: 'error', icon: 'fas fa-exclamation-circle' },
            'error': { class: 'error', icon: 'fas fa-exclamation-triangle' },
            'maintenance': { class: 'warning', icon: 'fas fa-tools' },
            'info': { class: 'info', icon: 'fas fa-info-circle' }
        };
        return types[type] || types.info;
    }

    // Obtener información del estado del reporte
    function getReportStatusInfo(status) {
        const statuses = {
            'pending': { class: 'pending', text: 'Pendiente' },
            'in-progress': { class: 'in-progress', text: 'En Proceso' },
            'completed': { class: 'completed', text: 'Resuelto' }
        };
        return statuses[status] || statuses.pending;
    }

    // Calcular tiempo transcurrido
    function getTimeAgo(timestamp) {
        if (!timestamp) return 'Fecha desconocida';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `Hace ${days} día${days !== 1 ? 's' : ''}`;
        if (hours > 0) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
        if (minutes > 0) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        return 'Hace un momento';
    }

    // ===== FUNCIONES DE CÁLCULO DE TENDENCIAS =====
    
    // Calcular crecimiento mensual
    async function calculateMonthlyGrowth(collection, currentCount) {
        try {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            const lastMonthSnapshot = await db.collection(collection)
                .where('createdAt', '<=', lastMonth)
                .get();
                
            const lastMonthCount = lastMonthSnapshot.size;
            
            if (lastMonthCount === 0) return 100; // 100% si no había registros el mes pasado
            
            const growth = ((currentCount - lastMonthCount) / lastMonthCount) * 100;
            return Math.round(growth);
        } catch (error) {
            console.error('Error calculando crecimiento mensual:', error);
            return null;
        }
    }

    // Calcular cambio diario
    async function calculateDailyChange(collection, currentCount) {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const yesterdaySnapshot = await db.collection(collection)
                .where('createdAt', '>=', yesterday)
                .where('createdAt', '<', today)
                .get();
                
            const yesterdayCount = yesterdaySnapshot.size;
            
            return currentCount - yesterdayCount;
        } catch (error) {
            console.error('Error calculando cambio diario:', error);
            return null;
        }
    }

    // Calcular crecimiento de ingresos mensuales
    async function calculateMonthlyIncomeGrowth(currentIncome) {
        try {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
            const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
            
            const lastMonthPayments = await db.collection('pagos')
                .where('status', '==', 'completed')
                .where('date', '>=', lastMonthStart)
                .where('date', '<=', lastMonthEnd)
                .get();
                
            let lastMonthIncome = 0;
            lastMonthPayments.forEach(doc => {
                const payment = doc.data();
                lastMonthIncome += payment.amount || 0;
            });
            
            if (lastMonthIncome === 0) return 100;
            
            const growth = ((currentIncome - lastMonthIncome) / lastMonthIncome) * 100;
            return Math.round(growth);
        } catch (error) {
            console.error('Error calculando crecimiento de ingresos:', error);
            return null;
        }
    }
});
// dashboard-stats.js - Actualizar estadísticas del dashboard con datos reales
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined') {
        console.error('Firebase no está definido');
        return;
    }

    // Referencias a Firebase
    const db = firebase.firestore();
    
    // Actualizar todas las estadísticas del dashboard
    updateDashboardStats();
    updateRecentReports();
    updateRecentPayments();

    // ===== FUNCIONES PARA ACTUALIZAR ESTADÍSTICAS =====
    
    // Actualizar estadísticas principales del dashboard
    async function updateDashboardStats() {
        try {
            // 1. Contar clientes activos
            const activeClientsSnapshot = await db.collection('usuarios')
                .where('role', '==', 'user')
                .where('status', '==', 'active')
                .get();
                
            const activeClientsCount = activeClientsSnapshot.size;
            updateClientStats(activeClientsCount);

            // 2. Contar reportes pendientes
            const pendingReportsSnapshot = await db.collection('reportes')
                .where('status', '==', 'pending')
                .get();
                
            const pendingReportsCount = pendingReportsSnapshot.size;
            updateReportStats(pendingReportsCount);

            // 3. Contar servicios activos
            const activeServicesSnapshot = await db.collection('productos')
                .where('active', '==', true)
                .get();
                
            const activeServicesCount = activeServicesSnapshot.size;
            updateServiceStats(activeServicesCount);

            // 4. Calcular ingresos mensuales
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);

            const monthlyPaymentsSnapshot = await db.collection('pagos')
                .where('status', '==', 'completed')
                .get();
                
            let monthlyIncome = 0;
            monthlyPaymentsSnapshot.forEach(doc => {
                const payment = doc.data();
                if (payment.date && payment.date.toDate() >= firstDayOfMonth) {
                    monthlyIncome += payment.amount || 0;
                }
            });
            
            updateIncomeStats(monthlyIncome);

        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
        }
    }

    // Actualizar estadísticas de clientes
    function updateClientStats(count) {
        const clientCard = document.querySelector('.dashboard-stats .stat-card:nth-child(1)');
        if (clientCard) {
            const numberElement = clientCard.querySelector('.stat-number');
            const growthElement = clientCard.querySelector('.stat-growth');
            
            if (numberElement) {
                numberElement.textContent = count.toString();
            }
            
            // Calcular crecimiento mensual
            calculateMonthlyGrowth('usuarios', count).then(growth => {
                if (growthElement && growth !== null) {
                    growthElement.textContent = `${growth >= 0 ? '+' : ''}${growth}% este mes`;
                    growthElement.className = `stat-growth ${growth >= 0 ? 'positive' : 'negative'}`;
                }
            });
        }
    }

    // Actualizar estadísticas de reportes
    function updateReportStats(count) {
        const reportCard = document.querySelector('.dashboard-stats .stat-card:nth-child(2)');
        if (reportCard) {
            const numberElement = reportCard.querySelector('.stat-number');
            const growthElement = reportCard.querySelector('.stat-growth');
            
            if (numberElement) {
                numberElement.textContent = count.toString();
            }
            
            // Calcular cambio desde ayer
            calculateDailyChange('reportes', count).then(change => {
                if (growthElement && change !== null) {
                    const text = change === 0 ? 'Sin cambios desde ayer' : 
                                 `${change > 0 ? '+' : ''}${change} desde ayer`;
                    growthElement.textContent = text;
                    growthElement.className = `stat-growth ${change > 0 ? 'negative' : 'positive'}`;
                }
            });
        }
    }

    // Actualizar estadísticas de servicios
    function updateServiceStats(count) {
        const serviceCard = document.querySelector('.dashboard-stats .stat-card:nth-child(3)');
        if (serviceCard) {
            const numberElement = serviceCard.querySelector('.stat-number');
            const growthElement = serviceCard.querySelector('.stat-growth');
            
            if (numberElement) {
                numberElement.textContent = count.toString();
            }
            
            // Calcular crecimiento mensual
            calculateMonthlyGrowth('productos', count).then(growth => {
                if (growthElement && growth !== null) {
                    growthElement.textContent = `${growth >= 0 ? '+' : ''}${growth}% este mes`;
                    growthElement.className = `stat-growth ${growth >= 0 ? 'positive' : 'negative'}`;
                }
            });
        }
    }

    // Actualizar estadísticas de ingresos
    function updateIncomeStats(amount) {
        const incomeCard = document.querySelector('.dashboard-stats .stat-card:nth-child(4)');
        if (incomeCard) {
            const numberElement = incomeCard.querySelector('.stat-number');
            const growthElement = incomeCard.querySelector('.stat-growth');
            
            if (numberElement) {
                numberElement.textContent = `$${amount.toLocaleString('es-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            
            // Calcular crecimiento vs mes anterior
            calculateMonthlyIncomeGrowth(amount).then(growth => {
                if (growthElement && growth !== null) {
                    growthElement.textContent = `${growth >= 0 ? '+' : ''}${growth}% vs mes anterior`;
                    growthElement.className = `stat-growth ${growth >= 0 ? 'positive' : 'negative'}`;
                }
            });
        }
    }

    // ===== FUNCIONES PARA REPORTES Y PAGOS RECIENTES =====
    
    // Actualizar reportes recientes
    async function updateRecentReports() {
        try {
            const reportsContainer = document.querySelector('.dashboard-recent .recent-container:first-child .recent-body');
            if (!reportsContainer) return;

            // Limpiar contenedor
            reportsContainer.innerHTML = '';

            // Obtener reportes recientes
            const reportsSnapshot = await db.collection('reportes')
                .orderBy('createdAt', 'desc')
                .limit(3)
                .get();

            if (reportsSnapshot.empty) {
                reportsContainer.innerHTML = '<div class="empty-message">No hay reportes recientes</div>';
                return;
            }

            // Mostrar cada reporte
            reportsSnapshot.forEach(doc => {
                const report = doc.data();
                const reportElement = createReportElement(doc.id, report);
                reportsContainer.appendChild(reportElement);
            });

        } catch (error) {
            console.error('Error cargando reportes recientes:', error);
        }
    }

    // Actualizar pagos recientes
    async function updateRecentPayments() {
        try {
            const paymentsContainer = document.querySelector('.dashboard-recent .recent-container:last-child .recent-body');
            if (!paymentsContainer) return;

            // Limpiar contenedor
            paymentsContainer.innerHTML = '';

            // Obtener pagos recientes
            const paymentsSnapshot = await db.collection('pagos')
                .where('status', '==', 'completed')
                .orderBy('date', 'desc')
                .limit(3)
                .get();

            if (paymentsSnapshot.empty) {
                paymentsContainer.innerHTML = '<div class="empty-message">No hay pagos recientes</div>';
                return;
            }

            // Mostrar cada pago
            paymentsSnapshot.forEach(doc => {
                const payment = doc.data();
                const paymentElement = createPaymentElement(doc.id, payment);
                paymentsContainer.appendChild(paymentElement);
            });

        } catch (error) {
            console.error('Error cargando pagos recientes:', error);
        }
    }

    // ===== FUNCIONES AUXILIARES =====
    
    // Crear elemento de reporte
    function createReportElement(id, report) {
        const div = document.createElement('div');
        div.className = 'recent-item';
        
        // Determinar tipo de icono y clase
        const typeInfo = getReportTypeInfo(report.type);
        
        // Calcular tiempo transcurrido
        const timeAgo = getTimeAgo(report.createdAt);
        
        // Determinar estado
        const statusInfo = getReportStatusInfo(report.status);
        
        div.innerHTML = `
            <div class="recent-icon ${typeInfo.class}">
                <i class="${typeInfo.icon}"></i>
            </div>
            <div class="recent-details">
                <h4>${report.title || 'Sin título'}</h4>
                <p>${report.description || 'Sin descripción'}</p>
                <span class="recent-time">${timeAgo}</span>
            </div>
            <div class="recent-status ${statusInfo.class}">
                <span>${statusInfo.text}</span>
            </div>
        `;
        
        return div;
    }

    // Crear elemento de pago
    function createPaymentElement(id, payment) {
        const div = document.createElement('div');
        div.className = 'recent-item';
        
        // Formatear fecha
        const paymentDate = payment.date ? 
            new Date(payment.date.seconds * 1000).toLocaleDateString() : 
            'Fecha no disponible';
        
        div.innerHTML = `
            <div class="recent-icon payment">
                <i class="fas fa-credit-card"></i>
            </div>
            <div class="recent-details">
                <h4>${payment.serviceName || 'Servicio'}</h4>
                <p>${payment.clientName || 'Cliente'}</p>
                <span class="recent-time">${paymentDate}</span>
            </div>
            <div class="recent-amount">
                <span>$${payment.amount ? payment.amount.toFixed(2) : '0.00'}</span>
            </div>
        `;
        
        return div;
    }

    // ===== FUNCIONES DE CÁLCULO DE TENDENCIAS =====
    
    // Calcular crecimiento mensual
    async function calculateMonthlyGrowth(collection, currentCount) {
        try {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            const lastMonthSnapshot = await db.collection(collection)
                .where('createdAt', '<=', lastMonth)
                .get();
                
            const lastMonthCount = lastMonthSnapshot.size;
            
            if (lastMonthCount === 0) return 100; // 100% si no había registros el mes pasado
            
            const growth = ((currentCount - lastMonthCount) / lastMonthCount) * 100;
            return Math.round(growth);
        } catch (error) {
            console.error('Error calculando crecimiento mensual:', error);
            return null;
        }
    }

    // Calcular cambio diario
    async function calculateDailyChange(collection, currentCount) {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const yesterdaySnapshot = await db.collection(collection)
                .where('createdAt', '>=', yesterday)
                .where('createdAt', '<', today)
                .get();
                
            const yesterdayCount = yesterdaySnapshot.size;
            
            return currentCount - yesterdayCount;
        } catch (error) {
            console.error('Error calculando cambio diario:', error);
            return null;
        }
    }

    // Calcular crecimiento de ingresos mensuales
    async function calculateMonthlyIncomeGrowth(currentIncome) {
        try {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
            const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
            
            const lastMonthPayments = await db.collection('pagos')
                .where('status', '==', 'completed')
                .get();
                
            let lastMonthIncome = 0;
            lastMonthPayments.forEach(doc => {
                const payment = doc.data();
                if (payment.date) {
                    const paymentDate = payment.date.toDate();
                    if (paymentDate >= lastMonthStart && paymentDate <= lastMonthEnd) {
                        lastMonthIncome += payment.amount || 0;
                    }
                }
            });
            
            if (lastMonthIncome === 0) return 100;
            
            const growth = ((currentIncome - lastMonthIncome) / lastMonthIncome) * 100;
            return Math.round(growth);
        } catch (error) {
            console.error('Error calculando crecimiento de ingresos:', error);
            return null;
        }
    }

    // Obtener información del tipo de reporte
    function getReportTypeInfo(type) {
        const types = {
            'alert': { class: 'error', icon: 'fas fa-exclamation-circle' },
            'error': { class: 'error', icon: 'fas fa-exclamation-triangle' },
            'maintenance': { class: 'warning', icon: 'fas fa-tools' },
            'info': { class: 'info', icon: 'fas fa-info-circle' }
        };
        return types[type] || types.info;
    }

    // Obtener información del estado del reporte
    function getReportStatusInfo(status) {
        const statuses = {
            'pending': { class: 'pending', text: 'Pendiente' },
            'in-progress': { class: 'in-progress', text: 'En Proceso' },
            'completed': { class: 'completed', text: 'Resuelto' }
        };
        return statuses[status] || statuses.pending;
    }

    // Calcular tiempo transcurrido
    function getTimeAgo(timestamp) {
        if (!timestamp) return 'Fecha desconocida';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `Hace ${days} día${days !== 1 ? 's' : ''}`;
        if (hours > 0) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
        if (minutes > 0) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        return 'Hace un momento';
    }
});