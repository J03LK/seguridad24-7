// admin-notifications-fix.js - Solución para notificaciones en dashboard de administrador

(function() {
    console.log('Inicializando corrección de notificaciones para administrador');
    
    // Verificar si estamos en el dashboard admin
    const isAdminDashboard = document.getElementById('reports-section') !== null || 
                              document.querySelector('a[data-section="reports"]') !== null;
    
    if (!isAdminDashboard) {
        console.log('No estamos en el dashboard de administrador, omitiendo corrección');
        return;
    }
    
    console.log('Dashboard de administrador detectado, aplicando correcciones');
    
    // Esperar a que Firebase esté disponible
    function waitForFirebase(callback) {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            callback();
        } else {
            console.log('Esperando a que Firebase esté disponible...');
            setTimeout(() => waitForFirebase(callback), 500);
        }
    }
    
    // Mejorar la función updateReportStatus
    waitForFirebase(() => {
        console.log('Firebase disponible, aplicando correcciones a updateReportStatus');
        
        // Verificar si la función existe en el ámbito global
        if (typeof updateReportStatus === 'function') {
            console.log('Función updateReportStatus encontrada, mejorando...');
            
            // Guardar referencia a la función original
            const originalUpdateReportStatus = updateReportStatus;
            
            // Reemplazar con versión mejorada
            window.updateReportStatus = function(reportId, newStatus, note) {
                console.log('Llamada a updateReportStatus mejorada:', reportId, newStatus, note);
                
                // Obtener Firestore
                const db = firebase.firestore();
                
                // Obtener reporte actual
                return db.collection('reportes').doc(reportId).get()
                    .then(doc => {
                        if (!doc.exists) {
                            throw new Error('El reporte no existe');
                        }
                        
                        const reportData = doc.data();
                        const clientId = reportData.clientId;
                        
                        // Si el estado ya es el mismo, no hacer nada
                        if (reportData.status === newStatus) {
                            console.log('El reporte ya tiene el estado:', newStatus);
                            return Promise.resolve();
                        }
                        
                        console.log('Actualizando estado de reporte para cliente:', clientId);
                        
                        // Crear entrada para historial
                        const statusEntry = {
                            status: newStatus,
                            date: new Date(),
                            note: note || ''
                        };
                        
                        // Actualizar historial
                        let statusHistory = reportData.statusHistory || [];
                        statusHistory.push(statusEntry);
                        
                        // Actualizar reporte
                        return db.collection('reportes').doc(reportId).update({
                            status: newStatus,
                            statusHistory: statusHistory,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }).then(() => {
                            console.log('Estado de reporte actualizado correctamente');
                            
                            // Crear notificación para el cliente
                            return createNotificationForClient(reportId, newStatus, clientId, reportData.title);
                        });
                    })
                    .catch(error => {
                        console.error('Error al actualizar reporte:', error);
                        showToast('Error', 'No se pudo actualizar el reporte: ' + error.message, 'error');
                        throw error;
                    });
            };
            
            console.log('Función updateReportStatus mejorada correctamente');
        } else {
            console.log('Función updateReportStatus no encontrada, no se puede mejorar');
        }
    });
    
    // Función para crear notificación para el cliente
    function createNotificationForClient(reportId, newStatus, clientId, reportTitle) {
        if (!clientId) {
            console.error('No se proporcionó ID de cliente para notificación');
            return Promise.resolve();
        }
        
        console.log('Creando notificación para cliente:', clientId);
        
        // Mapear estados a nombres amigables
        const statusNames = {
            'pending': 'Pendiente',
            'in-progress': 'En Proceso',
            'completed': 'Resuelto'
        };
        
        const statusName = statusNames[newStatus] || newStatus;
        
        // Datos de la notificación
        const notification = {
            userId: clientId,
            type: 'report',
            title: 'Actualización de Reporte',
            message: `Tu reporte "${reportTitle || 'sin título'}" ha cambiado a estado: ${statusName}`,
            link: `reportes:view:${reportId}`,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Usar la función global si existe
        if (typeof window.createNotification === 'function') {
            console.log('Usando función global createNotification');
            return window.createNotification(clientId, notification)
                .then(() => {
                    console.log('Notificación enviada correctamente');
                    showToast('Notificación enviada', 'Se ha notificado al cliente', 'success');
                })
                .catch(error => {
                    console.error('Error al enviar notificación:', error);
                });
        }
        
        // Alternativa si no existe la función global
        console.log('Usando método alternativo para crear notificación');
        return firebase.firestore().collection('notifications').add(notification)
            .then(() => {
                console.log('Notificación enviada correctamente (método alternativo)');
                showToast('Notificación enviada', 'Se ha notificado al cliente', 'success');
            })
            .catch(error => {
                console.error('Error al enviar notificación:', error);
            });
    }
    
    // Función para mostrar toast
    function showToast(title, message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(title, message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
            alert(`${title}: ${message}`);
        }
    }
    
    console.log('Inicialización de corrección de notificaciones completada');
})();