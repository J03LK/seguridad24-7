// Ejemplo básico para devices.js
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const deviceTable = document.getElementById('devices-table-body');
    const addDeviceBtn = document.getElementById('add-device-btn');
    const deviceModal = document.getElementById('device-modal');
    const deviceForm = document.getElementById('device-form');
    const clientSelect = document.getElementById('device-client');
    
    // Cargar clientes en el selector
    function loadClients() {
        // Usar Firebase para cargar clientes
        firebase.firestore().collection('users')
            .where('role', '==', 'user')
            .get()
            .then((snapshot) => {
                clientSelect.innerHTML = '<option value="">Seleccionar cliente</option>';
                snapshot.forEach((doc) => {
                    const client = doc.data();
                    clientSelect.innerHTML += `<option value="${doc.id}">${client.name}</option>`;
                });
            });
    }
    
    // Cargar dispositivos
    function loadDevices() {
        // Usar Firebase para cargar dispositivos
        firebase.firestore().collection('devices')
            .get()
            .then((snapshot) => {
                deviceTable.innerHTML = '';
                snapshot.forEach((doc) => {
                    const device = doc.data();
                    // Aquí agregas la lógica para mostrar los dispositivos en la tabla
                    deviceTable.innerHTML += `
                        <tr>
                            <td>${doc.id}</td>
                            <td>${device.name}</td>
                            <td>${device.type}</td>
                            <td>${device.clientName}</td>
                            <td>${device.location || 'N/A'}</td>
                            <td><span class="status-badge ${device.status}">${device.status}</span></td>
                            <td>${device.lastActivity || 'N/A'}</td>
                            <td>
                                <button class="btn-icon edit-device" data-id="${doc.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon delete-device" data-id="${doc.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                // Añadir event listeners a los botones de editar y eliminar
                setupDeviceButtons();
            });
    }
    
    // Guardar dispositivo
    deviceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const deviceData = {
            name: document.getElementById('device-name').value,
            type: document.getElementById('device-type').value,
            clientId: document.getElementById('device-client').value,
            location: document.getElementById('device-location').value,
            model: document.getElementById('device-model').value,
            serial: document.getElementById('device-serial').value,
            notes: document.getElementById('device-notes').value,
            status: 'active',
            lastActivity: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        // También necesitas obtener el nombre del cliente para mostrarlo en la tabla
        const clientName = document.getElementById('device-client').options[
            document.getElementById('device-client').selectedIndex
        ].text;
        deviceData.clientName = clientName;
        
        // Guardar en Firebase
        firebase.firestore().collection('devices').add(deviceData)
            .then(() => {
                deviceModal.classList.remove('active');
                loadDevices();
                deviceForm.reset();
            })
            .catch((error) => {
                console.error("Error al guardar dispositivo:", error);
                alert("Error al guardar el dispositivo. Por favor, intenta de nuevo.");
            });
    });
    
    // Inicializar
    addDeviceBtn.addEventListener('click', function() {
        deviceModal.classList.add('active');
        document.getElementById('device-modal-title').textContent = 'Nuevo Dispositivo';
        deviceForm.reset();
        loadClients();
    });
    
    // Cargar dispositivos al iniciar
    loadDevices();
});