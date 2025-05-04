// notifications.js - Real-time notification system
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not defined. Make sure to load Firebase scripts.');
        return;
    }

    // DOM Elements
    const notificationBtn = document.querySelector('.notification-btn');
    const notificationBadge = document.querySelector('.notification-badge');
    
    // References to Firebase
    const db = firebase.firestore();
    const auth = firebase.auth();
    const notificationsRef = db.collection('notifications');
    
    // State variables
    let notificationPanel = null;
    let unsubscribeListener = null;
    let notificationCount = 0;

    // Initialize notifications
    initializeNotifications();

    function initializeNotifications() {
        // Check if user is authenticated
        auth.onAuthStateChanged(user => {
            if (user) {
                setupRealtimeListener(user.uid);
                createNotificationPanel();
                setupEventListeners();
                checkUnreadNotifications();
            } else {
                if (unsubscribeListener) {
                    unsubscribeListener();
                }
            }
        });
    }

    // Setup real-time listener for notifications
    function setupRealtimeListener(userId) {
        // Listen for new notifications for the current user
        unsubscribeListener = notificationsRef
            .where('userId', '==', userId)
            .where('read', '==', false)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                // Count unread notifications
                notificationCount = snapshot.size;
                updateNotificationBadge(notificationCount);

                // Handle new notifications
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const notification = change.doc.data();
                        showToastNotification(notification);
                    }
                });
            });
    }

    // Create notification panel
    function createNotificationPanel() {
        // Check if panel already exists
        if (document.querySelector('.notification-panel')) {
            return;
        }

        notificationPanel = document.createElement('div');
        notificationPanel.className = 'notification-panel';
        notificationPanel.innerHTML = `
            <div class="notification-panel-header">
                <h3>Notificaciones</h3>
                <button class="mark-all-read-btn">Marcar todas como leídas</button>
            </div>
            <div class="notification-panel-body">
                <div class="loading">Cargando notificaciones...</div>
            </div>
            <div class="notification-panel-footer">
                <a href="#" class="view-all-notifications">Ver todas las notificaciones</a>
            </div>
        `;

        document.body.appendChild(notificationPanel);

        // Add event listener for "mark all as read"
        const markAllBtn = notificationPanel.querySelector('.mark-all-read-btn');
        markAllBtn.addEventListener('click', markAllAsRead);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Notification button click
        if (notificationBtn) {
            notificationBtn.addEventListener('click', toggleNotificationPanel);
        }

        // Close panel when clicking outside
        document.addEventListener('click', function(e) {
            if (notificationPanel && notificationPanel.classList.contains('active')) {
                if (!notificationPanel.contains(e.target) && !notificationBtn.contains(e.target)) {
                    notificationPanel.classList.remove('active');
                }
            }
        });
    }

    // Toggle notification panel
    function toggleNotificationPanel() {
        if (!notificationPanel) return;

        if (notificationPanel.classList.contains('active')) {
            notificationPanel.classList.remove('active');
        } else {
            notificationPanel.classList.add('active');
            loadNotifications();
        }
    }

    // Load notifications
    function loadNotifications() {
        const notificationBody = notificationPanel.querySelector('.notification-panel-body');
        
        auth.currentUser.getIdToken().then(token => {
            return notificationsRef
                .where('userId', '==', auth.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
        })
        .then(snapshot => {
            if (snapshot.empty) {
                notificationBody.innerHTML = '<div class="no-notifications">No hay notificaciones</div>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const notification = doc.data();
                html += createNotificationItem(doc.id, notification);
            });

            notificationBody.innerHTML = html;

            // Add click handlers to notification items
            const notificationItems = notificationBody.querySelectorAll('.notification-item');
            notificationItems.forEach(item => {
                item.addEventListener('click', function() {
                    const notificationId = this.getAttribute('data-id');
                    handleNotificationClick(notificationId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading notifications:', error);
            notificationBody.innerHTML = '<div class="error">Error al cargar notificaciones</div>';
        });
    }

    // Create notification item HTML
    function createNotificationItem(id, notification) {
        const time = formatNotificationTime(notification.createdAt);
        const iconClass = getNotificationIcon(notification.type);
        const readClass = notification.read ? 'read' : '';

        return `
            <div class="notification-item ${readClass}" data-id="${id}">
                <div class="notification-icon ${notification.type}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-text">${notification.message}</div>
                    <div class="notification-time">${time}</div>
                </div>
            </div>
        `;
    }

    // Handle notification click
    function handleNotificationClick(notificationId) {
        // Mark as read
        notificationsRef.doc(notificationId).update({
            read: true,
            readAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            // Update UI
            const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.classList.add('read');
            }

            // Update badge count
            checkUnreadNotifications();
            
            // Handle navigation if notification has a link
            return notificationsRef.doc(notificationId).get();
        })
        .then(doc => {
            if (doc.exists) {
                const notification = doc.data();
                if (notification.link) {
                    // Navigate to the linked section
                    navigateToSection(notification.link);
                }
            }
        })
        .catch(error => {
            console.error('Error marking notification as read:', error);
        });
    }

    // Mark all notifications as read
    function markAllAsRead() {
        if (!auth.currentUser) return;

        // Update all unread notifications
        notificationsRef
            .where('userId', '==', auth.currentUser.uid)
            .where('read', '==', false)
            .get()
            .then(snapshot => {
                const batch = db.batch();

                snapshot.forEach(doc => {
                    batch.update(doc.ref, {
                        read: true,
                        readAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

                return batch.commit();
            })
            .then(() => {
                // Reload notifications
                loadNotifications();
                // Update badge
                updateNotificationBadge(0);
            })
            .catch(error => {
                console.error('Error marking all notifications as read:', error);
            });
    }

    // Check unread notifications count
    function checkUnreadNotifications() {
        if (!auth.currentUser) return;

        notificationsRef
            .where('userId', '==', auth.currentUser.uid)
            .where('read', '==', false)
            .get()
            .then(snapshot => {
                notificationCount = snapshot.size;
                updateNotificationBadge(notificationCount);
            })
            .catch(error => {
                console.error('Error checking unread notifications:', error);
            });
    }

    // Update notification badge
    function updateNotificationBadge(count) {
        if (notificationBadge) {
            if (count > 0) {
                notificationBadge.textContent = count > 99 ? '99+' : count;
                notificationBadge.style.display = 'inline-flex';
            } else {
                notificationBadge.style.display = 'none';
            }
        }
    }

    // Show toast notification
    function showToastNotification(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${notification.type}`;
        
        const iconClass = getNotificationIcon(notification.type);
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Add to document
        document.body.appendChild(toast);

        // Show animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            removeToast(toast);
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            removeToast(toast);
        }, 5000);
    }

    // Remove toast notification
    function removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Get notification icon based on type
    function getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return 'fa-check-circle';
            case 'error':
            case 'alert':
                return 'fa-exclamation-circle';
            case 'warning':
                return 'fa-exclamation-triangle';
            case 'payment':
                return 'fa-credit-card';
            case 'report':
                return 'fa-file-alt';
            case 'user':
                return 'fa-user';
            case 'info':
            default:
                return 'fa-info-circle';
        }
    }

    // Format notification time
    function formatNotificationTime(timestamp) {
        if (!timestamp) return 'Fecha desconocida';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 1) return 'Ahora mismo';
        if (minutes < 60) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        if (hours < 24) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
        if (days < 7) return `Hace ${days} día${days !== 1 ? 's' : ''}`;
        
        return date.toLocaleDateString();
    }

    // Navigate to section based on notification link
    function navigateToSection(link) {
        // Close notification panel
        if (notificationPanel) {
            notificationPanel.classList.remove('active');
        }

        // Parse link type and navigate
        const [section, action, id] = link.split(':');
        
        // Find the menu item for the section
        const menuLink = document.querySelector(`a[data-section="${section}"]`);
        if (menuLink) {
            // Simulate click on menu item
            menuLink.click();

            // If there's a specific action, handle it
            if (action && id) {
                setTimeout(() => {
                    handleNotificationAction(section, action, id);
                }, 300);
            }
        }
    }

    // Handle specific notification actions
    function handleNotificationAction(section, action, id) {
        switch (section) {
            case 'reports':
                if (action === 'view') {
                    // Open report details
                    const reportRef = db.collection('reportes').doc(id);
                    reportRef.get().then(doc => {
                        if (doc.exists) {
                            const report = doc.data();
                            // Assuming openReportDetails is defined in reportes.js
                            if (typeof openReportDetails === 'function') {
                                openReportDetails(report);
                            }
                        }
                    });
                }
                break;

            case 'payments':
                if (action === 'view') {
                    // Open payment details
                    const paymentRef = db.collection('pagos').doc(id);
                    paymentRef.get().then(doc => {
                        if (doc.exists) {
                            const payment = doc.data();
                            // Assuming openPaymentDetails is defined in pagos.js
                            if (typeof openPaymentDetails === 'function') {
                                openPaymentDetails(id, payment);
                            }
                        }
                    });
                }
                break;

            // Add more cases as needed
        }
    }

    // Create notification helper functions for other modules to use
    window.createNotification = function(userId, notification) {
        const defaultNotification = {
            userId: userId,
            title: 'Notificación',
            message: '',
            type: 'info',
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Merge default with provided notification
        const finalNotification = { ...defaultNotification, ...notification };

        return notificationsRef.add(finalNotification);
    };

    // Create admin notification (for all admin users)
    window.createAdminNotification = function(notification) {
        // Get all admin users
        return db.collection('usuarios')
            .where('role', '==', 'admin')
            .get()
            .then(snapshot => {
                const batch = db.batch();

                snapshot.forEach(doc => {
                    const adminId = doc.id;
                    const notificationRef = notificationsRef.doc();
                    
                    batch.set(notificationRef, {
                        userId: adminId,
                        ...notification,
                        read: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

                return batch.commit();
            });
    };

    // Clean old notifications (optional - could be run periodically)
    window.cleanOldNotifications = function(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        return notificationsRef
            .where('createdAt', '<', cutoffDate)
            .get()
            .then(snapshot => {
                const batch = db.batch();
                
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });

                return batch.commit();
            })
            .then(() => {
                console.log(`Cleaned ${snapshot.size} old notifications`);
            })
            .catch(error => {
                console.error('Error cleaning old notifications:', error);
            });
    };
});