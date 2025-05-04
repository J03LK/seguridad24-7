// search.js - Sistema de búsqueda global para el dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined') {
        console.error('Firebase no está definido. Asegúrate de cargar los scripts de Firebase.');
        return;
    }

    // Inicializar el sistema de búsqueda global
    initializeGlobalSearch();

    // Función principal de inicialización
    function initializeGlobalSearch() {
        const searchInput = document.querySelector('.search-bar input');
        
        if (!searchInput) {
            console.warn('No se encontró el input de búsqueda');
            return;
        }

        searchInput.addEventListener('input', debounce(async (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // Si el término es muy corto, ocultar resultados
            if (searchTerm.length < 3) {
                hideSearchResults();
                return;
            }
            
            // Mostrar indicador de carga
            showSearchLoading();
            
            try {
                // Realizar búsqueda en todas las colecciones
                const results = await searchAllCollections(searchTerm);
                displaySearchResults(results);
            } catch (error) {
                console.error('Error en la búsqueda:', error);
                showSearchError();
            }
        }, 300));

        // Cerrar resultados al hacer clic fuera
        document.addEventListener('click', (e) => {
            const searchModal = document.getElementById('search-results-modal');
            const searchBar = document.querySelector('.search-bar');
            
            if (searchModal && !searchModal.contains(e.target) && !searchBar.contains(e.target)) {
                hideSearchResults();
            }
        });

        // Manejar tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideSearchResults();
            }
        });
    }

    // Función para buscar en todas las colecciones
    async function searchAllCollections(term) {
        const db = firebase.firestore();
        const results = {
            users: [],
            products: [],
            reports: [],
            payments: [],
            locations: []
        };
        
        // Buscar en usuarios
        const usersSnapshot = await db.collection('usuarios').get();
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.name?.toLowerCase().includes(term) || 
                data.email?.toLowerCase().includes(term) ||
                data.phone?.toLowerCase().includes(term)) {
                results.users.push({id: doc.id, ...data});
            }
        });
        
        // Buscar en productos
        const productsSnapshot = await db.collection('productos').get();
        productsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.name?.toLowerCase().includes(term) || 
                data.description?.toLowerCase().includes(term) ||
                data.category?.toLowerCase().includes(term)) {
                results.products.push({id: doc.id, ...data});
            }
        });
        
        // Buscar en reportes
        const reportsSnapshot = await db.collection('reportes').get();
        reportsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.title?.toLowerCase().includes(term) || 
                data.description?.toLowerCase().includes(term) ||
                data.clientName?.toLowerCase().includes(term)) {
                results.reports.push({id: doc.id, ...data});
            }
        });
        
        // Buscar en pagos
        const paymentsSnapshot = await db.collection('pagos').get();
        paymentsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.clientName?.toLowerCase().includes(term) || 
                data.serviceName?.toLowerCase().includes(term) ||
                data.reference?.toLowerCase().includes(term) ||
                (data.amount && data.amount.toString().includes(term))) {
                results.payments.push({id: doc.id, ...data});
            }
        });
        
        // Buscar en ubicaciones
        const locationsSnapshot = await db.collection('ubicaciones').get();
        locationsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.name?.toLowerCase().includes(term) || 
                data.address?.toLowerCase().includes(term) ||
                data.clientName?.toLowerCase().includes(term)) {
                results.locations.push({id: doc.id, ...data});
            }
        });
        
        return results;
    }

    // Función para mostrar los resultados
    function displaySearchResults(results) {
        // Crear o obtener el modal de resultados
        let modal = document.getElementById('search-results-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'search-results-modal';
            modal.className = 'search-modal';
            document.body.appendChild(modal);
        }
        
        // Contar total de resultados
        const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
        
        if (totalResults === 0) {
            modal.innerHTML = `
                <div class="search-modal-content">
                    <div class="search-modal-header">
                        <h3>No se encontraron resultados</h3>
                        <button class="search-modal-close">&times;</button>
                    </div>
                    <div class="search-modal-body">
                        <p class="no-results">No se encontraron coincidencias para tu búsqueda.</p>
                    </div>
                </div>
            `;
        } else {
            modal.innerHTML = `
                <div class="search-modal-content">
                    <div class="search-modal-header">
                        <h3>Resultados de búsqueda (${totalResults})</h3>
                        <button class="search-modal-close">&times;</button>
                    </div>
                    <div class="search-modal-body">
                        ${results.users.length > 0 ? renderSearchSection('Usuarios', results.users, 'users') : ''}
                        ${results.products.length > 0 ? renderSearchSection('Productos', results.products, 'products') : ''}
                        ${results.reports.length > 0 ? renderSearchSection('Reportes', results.reports, 'reports') : ''}
                        ${results.payments.length > 0 ? renderSearchSection('Pagos', results.payments, 'payments') : ''}
                        ${results.locations.length > 0 ? renderSearchSection('Ubicaciones', results.locations, 'locations') : ''}
                    </div>
                </div>
            `;
        }
        
        modal.classList.add('active');
        
        // Agregar event listeners
        const closeBtn = modal.querySelector('.search-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideSearchResults);
        }
        
        // Event listeners para los items de resultados
        modal.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                navigateToItem(type, id);
                hideSearchResults();
            });
        });
    }

    // Función para renderizar una sección de resultados
    function renderSearchSection(title, items, type) {
        return `
            <div class="search-section">
                <h4>${title}</h4>
                <div class="search-results-list">
                    ${items.map(item => `
                        <div class="search-result-item" data-type="${type}" data-id="${item.id}">
                            <div class="search-result-icon ${type}">
                                <i class="fas ${getIconForType(type)}"></i>
                            </div>
                            <div class="search-result-info">
                                <div class="search-result-title">${getItemTitle(item, type)}</div>
                                <div class="search-result-subtitle">${getItemSubtitle(item, type)}</div>
                            </div>
                            <div class="search-result-action">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Función para obtener el icono según el tipo
    function getIconForType(type) {
        const icons = {
            'users': 'fa-user',
            'products': 'fa-box',
            'reports': 'fa-exclamation-triangle',
            'payments': 'fa-dollar-sign',
            'locations': 'fa-map-marker-alt'
        };
        return icons[type] || 'fa-file';
    }

    // Función para obtener el título del item
    function getItemTitle(item, type) {
        switch(type) {
            case 'users': return item.name || item.email;
            case 'products': return item.name;
            case 'reports': return item.title || 'Reporte sin título';
            case 'payments': return `Pago - ${item.clientName}`;
            case 'locations': return item.name || 'Ubicación sin nombre';
            default: return 'Item';
        }
    }

    // Función para obtener el subtítulo del item
    function getItemSubtitle(item, type) {
        switch(type) {
            case 'users': 
                return `${item.email} - ${item.role === 'admin' ? 'Administrador' : 'Cliente'}`;
            case 'products': 
                return `$${item.price || 0} - ${item.category || 'Sin categoría'}`;
            case 'reports': 
                return `${item.status || 'pending'} - ${formatDate(item.createdAt)}`;
            case 'payments': 
                return `$${item.amount || 0} - ${item.status === 'completed' ? 'Completado' : 'Pendiente'}`;
            case 'locations': 
                return item.address || 'Sin dirección';
            default: 
                return '';
        }
    }

    // Función para navegar al item seleccionado
    function navigateToItem(type, id) {
        // Mapear tipos a secciones
        const sectionMap = {
            'users': 'users',
            'products': 'products',
            'reports': 'reports',
            'payments': 'payments',
            'locations': 'locations'
        };
        
        const section = sectionMap[type];
        if (!section) return;
        
        // Activar la sección correcta en el sidebar
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.classList.remove('active');
        });
        
        const menuItem = document.querySelector(`[data-section="${section}"]`);
        if (menuItem) {
            menuItem.parentElement.classList.add('active');
        }
        
        // Mostrar la sección correcta
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Aquí podrías implementar funcionalidad adicional como:
        // - Resaltar el item específico
        // - Abrir el modal de edición
        // - Hacer scroll hasta el elemento
    }

    // Función para ocultar los resultados de búsqueda
    function hideSearchResults() {
        const modal = document.getElementById('search-results-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Función para mostrar indicador de carga
    function showSearchLoading() {
        let modal = document.getElementById('search-results-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'search-results-modal';
            modal.className = 'search-modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="search-modal-content">
                <div class="search-modal-body">
                    <div class="search-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Buscando...</p>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }

    // Función para mostrar error
    function showSearchError() {
        let modal = document.getElementById('search-results-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'search-results-modal';
            modal.className = 'search-modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="search-modal-content">
                <div class="search-modal-header">
                    <h3>Error en la búsqueda</h3>
                    <button class="search-modal-close">&times;</button>
                </div>
                <div class="search-modal-body">
                    <div class="search-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Ocurrió un error al realizar la búsqueda. Por favor, intenta de nuevo.</p>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Agregar event listener para cerrar
        const closeBtn = modal.querySelector('.search-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideSearchResults);
        }
    }

    // Función de utilidad para formatear fechas
    function formatDate(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    }

    // Función de debounce para evitar demasiadas búsquedas
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});