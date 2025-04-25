// Variables globales para la gestión de pagos
let paymentsList = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 0;
let editingPaymentId = null;

// Cargar pagos desde Firestore
function loadPayments(page = 1) {
  currentPage = page;
  
  // Mostrar indicador de carga
  document.getElementById('pagos-table-body').innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';
  
  // Obtener filtros
  const estadoFilter = document.getElementById('filtro-estado-pago').value;
  const metodoFilter = document.getElementById('filtro-metodo-pago').value;
  const fechaDesde = document.getElementById('fecha-desde').value;
  const fechaHasta = document.getElementById('fecha-hasta').value;
  const searchText = document.getElementById('buscar-pago').value.toLowerCase();
  
  // Referencia a la colección de pagos
  let paymentsRef = firebase.firestore().collection('pagos');
  
  // Aplicar filtros de estado si no es "todos"
  if (estadoFilter !== 'todos') {
    paymentsRef = paymentsRef.where('estado', '==', estadoFilter);
  }
  
  // Aplicar filtros de método si no es "todos"
  if (metodoFilter !== 'todos') {
    paymentsRef = paymentsRef.where('metodo', '==', metodoFilter);
  }
  
  // Ordenar por fecha (más recientes primero)
  paymentsRef = paymentsRef.orderBy('fecha', 'desc');
  
  // Obtener pagos
  paymentsRef.get()
    .then(snapshot => {
      paymentsList = [];
      
      snapshot.forEach(doc => {
        const paymentData = doc.data();
        
        // Filtrar por rango de fechas si se especificaron
        if (fechaDesde || fechaHasta) {
          let paymentDate = paymentData.fecha;
          if (paymentDate) {
            paymentDate = paymentDate.toDate ? paymentDate.toDate() : new Date(paymentDate);
            
            if (fechaDesde) {
              const fromDate = new Date(fechaDesde);
              if (paymentDate < fromDate) return;
            }
            
            if (fechaHasta) {
              const toDate = new Date(fechaHasta);
              toDate.setHours(23, 59, 59, 999); // Final del día
              if (paymentDate > toDate) return;
            }
          }
        }
        
        // Filtrar por texto de búsqueda si existe
        if (searchText) {
          const matchesSearch = 
            (paymentData.clientName && paymentData.clientName.toLowerCase().includes(searchText)) ||
            (paymentData.concepto && paymentData.concepto.toLowerCase().includes(searchText));
          
          if (!matchesSearch) return;
        }
        
        paymentsList.push({
          id: doc.id,
          ...paymentData
        });
      });
      
      // Calcular paginación
      totalPages = Math.ceil(paymentsList.length / itemsPerPage);
      
      // Mostrar pagos en la tabla
      displayPayments();
      
      // Actualizar paginación
      updatePagination();
    })
    .catch(error => {
      console.error("Error al cargar pagos:", error);
      document.getElementById('pagos-table-body').innerHTML = 
        '<tr><td colspan="7" class="text-center">Error al cargar pagos. Intente nuevamente.</td></tr>';
    });
}

// Mostrar pagos en la tabla
function displayPayments() {
  const tableBody = document.getElementById('pagos-table-body');
  tableBody.innerHTML = '';
  
  // Calcular índices para la paginación
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, paymentsList.length);
  
  if (paymentsList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron pagos.</td></tr>';
    return;
  }
  
  // Mostrar pagos para la página actual
  for (let i = startIdx; i < endIdx; i++) {
    const payment = paymentsList[i];
    const row = document.createElement('tr');
    
    // Formatear fecha
    let fechaPago = 'Fecha desconocida';
    if (payment.fecha) {
      const date = payment.fecha.toDate ? payment.fecha.toDate() : new Date(payment.fecha);
      fechaPago = date.toLocaleDateString();
    }
    
    // Clases CSS para estado
    const estadoClass = getPaymentStatusClass(payment.estado);
    
    row.innerHTML = `
      <td>${payment.id.substring(0, 8)}...</td>
      <td>${payment.clientName || 'Cliente desconocido'}</td>
      <td>$${parseFloat(payment.monto).toFixed(2)}</td>
      <td>${fechaPago}</td>
      <td>${formatPaymentMethod(payment.metodo)}</td>
      <td><span class="status-badge ${estadoClass}">${payment.estado || 'Pendiente'}</span></td>
      <td class="actions">
        <button class="btn-icon view-payment" data-id="${payment.id}"><i class="fas fa-eye"></i></button>
        <button class="btn-icon edit-payment" data-id="${payment.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete-payment" data-id="${payment.id}"><i class="fas fa-trash"></i></button>
        <button class="btn-icon generate-invoice" data-id="${payment.id}"><i class="fas fa-file-invoice"></i></button>
      </td>
    `;
    
    tableBody.appendChild(row);
  }
  
  // Agregar event listeners a los botones de acción
  document.querySelectorAll('.view-payment').forEach(btn => {
    btn.addEventListener('click', () => openViewPaymentModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.edit-payment').forEach(btn => {
    btn.addEventListener('click', () => openEditPaymentModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-payment').forEach(btn => {
    btn.addEventListener('click', () => confirmDeletePayment(btn.dataset.id));
  });
  
  document.querySelectorAll('.generate-invoice').forEach(btn => {
    btn.addEventListener('click', () => generateInvoice(btn.dataset.id));
  });
}

// Formatear método de pago para mostrar
function formatPaymentMethod(metodo) {
  switch(metodo) {
    case 'efectivo':
      return '<i class="fas fa-money-bill-wave"></i> Efectivo';
    case 'transferencia':
      return '<i class="fas fa-university"></i> Transferencia';
    case 'tarjeta':
      return '<i class="fas fa-credit-card"></i> Tarjeta';
    default:
      return metodo || 'Desconocido';
  }
}

// Obtener clase CSS según el estado del pago
function getPaymentStatusClass(estado) {
  switch(estado) {
    case 'completado':
      return 'status-active';
    case 'pendiente':
      return 'status-pending';
    case 'rechazado':
      return 'status-inactive';
    default:
      return 'status-pending';
  }
}

// Actualizar paginación
function updatePagination() {
  const paginationElement = document.getElementById('pagos-pagination');
  
  if (totalPages <= 1) {
    paginationElement.innerHTML = '';
    return;
  }
  
  let html = `
    <button class="pagination-btn" onclick="loadPayments(1)" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-angle-double-left"></i>
    </button>
    <button class="pagination-btn" onclick="loadPayments(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-angle-left"></i>
    </button>
  `;
  
  // Mostrar números de página (hasta 5 páginas)
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(startPage + 4, totalPages);
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="loadPayments(${i})">
        ${i}
      </button>
    `;
  }
  
  html += `
    <button class="pagination-btn" onclick="loadPayments(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-angle-right"></i>
    </button>
    <button class="pagination-btn" onclick="loadPayments(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-angle-double-right"></i>
    </button>
  `;
  
  paginationElement.innerHTML = html;
}

// Abrir modal para crear pago
function openCreatePaymentModal() {
  editingPaymentId = null;
  document.getElementById('pago-modal-title').textContent = 'Registrar Pago';
  document.getElementById('pago-form').reset();
  document.getElementById('pago-fecha').valueAsDate = new Date(); // Establecer fecha actual
  
  // Mostrar/ocultar botones según sea nuevo o edición
  document.getElementById('pago-factura-btn').style.display = 'none';
  
  // Cargar lista de clientes
  loadClientsForSelect();
  
  // Mostrar modal
  document.getElementById('pago-modal').classList.add('active');
}

// Abrir modal para ver/editar pago
function openViewPaymentModal(paymentId) {
  editingPaymentId = paymentId;
  document.getElementById('pago-modal-title').textContent = 'Detalles del Pago';
  document.getElementById('pago-form').reset();
  
  // Mostrar/ocultar botones según sea nuevo o edición
  document.getElementById('pago-factura-btn').style.display = 'inline-block';
  
  // Cargar lista de clientes
  loadClientsForSelect();
  
  // Obtener datos del pago
  firebase.firestore().collection('pagos').doc(paymentId).get()
    .then(doc => {
      if (doc.exists) {
        const paymentData = doc.data();
        
        // Esperar a que la lista de clientes se cargue
        setTimeout(() => {
          document.getElementById('pago-cliente').value = paymentData.clientId || '';
          document.getElementById('pago-concepto').value = paymentData.concepto || '';
          document.getElementById('pago-monto').value = paymentData.monto || '';
          
          // Formatear fecha para el input date
          if (paymentData.fecha) {
            const date = paymentData.fecha.toDate ? paymentData.fecha.toDate() : new Date(paymentData.fecha);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            document.getElementById('pago-fecha').value = `${year}-${month}-${day}`;
          }
          
          document.getElementById('pago-metodo').value = paymentData.metodo || 'efectivo';
          document.getElementById('pago-notas').value = paymentData.notas || '';
        }, 500);
      }
    })
    .catch(error => {
      console.error("Error al obtener datos del pago:", error);
    });
  
  // Mostrar modal
  document.getElementById('pago-modal').classList.add('active');
}

// Abrir modal para editar pago (mismo que ver pero con título diferente)
function openEditPaymentModal(paymentId) {
  openViewPaymentModal(paymentId);
  document.getElementById('pago-modal-title').textContent = 'Editar Pago';
}

// Cargar lista de clientes para el select
function loadClientsForSelect() {
  const selectElement = document.getElementById('pago-cliente');
  selectElement.innerHTML = '<option value="">Cargando clientes...</option>';
  
  firebase.firestore().collection('users')
    .where('role', '==', 'usuario')
    .get()
    .then(snapshot => {
      selectElement.innerHTML = '<option value="">Seleccione un cliente</option>';
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = userData.nombre || userData.email;
        selectElement.appendChild(option);
      });
    })
    .catch(error => {
      console.error("Error al cargar clientes:", error);
      selectElement.innerHTML = '<option value="">Error al cargar clientes</option>';
    });
}

// Guardar pago (crear o actualizar)
function savePayment() {
  const clientId = document.getElementById('pago-cliente').value;
  const concepto = document.getElementById('pago-concepto').value;
  const monto = parseFloat(document.getElementById('pago-monto').value);
  const fechaStr = document.getElementById('pago-fecha').value;
  const metodo = document.getElementById('pago-metodo').value;
  const notas = document.getElementById('pago-notas').value;
  const comprobanteFile = document.getElementById('pago-comprobante').files[0];
  
  if (!clientId || !concepto || isNaN(monto) || !fechaStr) {
    alert('Por favor complete todos los campos obligatorios correctamente.');
    return;
  }
  
  // Convertir fecha string a objeto Date
  const fecha = new Date(fechaStr);
  
  // Mostrar indicador de carga
  const saveBtn = document.getElementById('pago-save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Guardando...';
  saveBtn.disabled = true;
  
  // Obtener nombre del cliente
  firebase.firestore().collection('users').doc(clientId).get()
    .then(doc => {
      let clientName = '';
      if (doc.exists) {
        const userData = doc.data();
        clientName = userData.nombre || userData.email;
      }
      
      // Función para guardar datos en Firestore
      const savePaymentData = (comprobanteUrl = null) => {
        const paymentData = {
          clientId,
          clientName,
          concepto,
          monto,
          fecha: firebase.firestore.Timestamp.fromDate(fecha),
          metodo,
          notas,
          estado: editingPaymentId ? document.getElementById('pago-estado').value || 'completado' : 'completado',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Agregar URL de comprobante si existe
        if (comprobanteUrl) {
          paymentData.comprobanteUrl = comprobanteUrl;
        }
        
        let savePromise;
        
        if (editingPaymentId) {
          // Actualizar pago existente
          savePromise = firebase.firestore().collection('pagos').doc(editingPaymentId).update(paymentData);
        } else {
          // Crear nuevo pago
          paymentData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          savePromise = firebase.firestore().collection('pagos').doc().set(paymentData);
        }
        
        savePromise
          .then(() => {
            closePaymentModal();
            loadPayments(currentPage);
          })
          .catch(error => {
            console.error("Error al guardar pago:", error);
            alert('Error al guardar pago: ' + error.message);
          })
          .finally(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
          });
      };
      
      // Si hay un comprobante para subir
      if (comprobanteFile) {
        const storageRef = firebase.storage().ref();
        const comprobanteRef = storageRef.child(`comprobantes/${Date.now()}_${comprobanteFile.name}`);
        
        comprobanteRef.put(comprobanteFile)
          .then(snapshot => snapshot.ref.getDownloadURL())
          .then(comprobanteUrl => {
            savePaymentData(comprobanteUrl);
          })
          .catch(error => {
            console.error("Error al subir comprobante:", error);
            alert('Error al subir comprobante. Intente nuevamente.');
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
          });
      } else {
        // Si no hay comprobante nuevo, guardar sin cambiar el comprobante
        savePaymentData();
      }
    })
    .catch(error => {
      console.error("Error al obtener información del cliente:", error);
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    });
}

// Confirmar eliminación de pago
function confirmDeletePayment(paymentId) {
  if (confirm('¿Está seguro de que desea eliminar este pago? Esta acción no se puede deshacer.')) {
    deletePayment(paymentId);
  }
}

// Eliminar pago
function deletePayment(paymentId) {
  // Obtener la URL del comprobante primero
  firebase.firestore().collection('pagos').doc(paymentId).get()
    .then(doc => {
      if (doc.exists) {
        const paymentData = doc.data();
        
        // Eliminar de Firestore primero
        return firebase.firestore().collection('pagos').doc(paymentId).delete()
          .then(() => {
            // Si el pago tenía un comprobante, eliminarlo del storage
            if (paymentData.comprobanteUrl) {
              // Extraer el path del storage de la URL
              const comprobanteRef = firebase.storage().refFromURL(paymentData.comprobanteUrl);
              return comprobanteRef.delete();
            }
          });
      }
    })
    .then(() => {
      loadPayments(currentPage);
    })
    .catch(error => {
      console.error("Error al eliminar pago:", error);
      alert('Error al eliminar pago: ' + error.message);
    });
}

// Generar factura en PDF
function generateInvoice(paymentId) {
  // Obtener datos del pago
  firebase.firestore().collection('pagos').doc(paymentId).get()
    .then(doc => {
      if (!doc.exists) throw new Error('El pago no existe');
      
      const paymentData = doc.data();
      
      // Obtener información de la empresa
      return firebase.firestore().collection('settings').doc('empresa').get()
        .then(empresaDoc => {
          let empresaData = {};
          if (empresaDoc.exists) {
            empresaData = empresaDoc.data();
          } else {
            empresaData = {
              nombre: 'Seguridad 24/7',
              direccion: 'Dirección de la empresa',
              telefono: 'Teléfono de contacto',
              email: 'info@seguridad247.com',
              ruc: 'RUC de la empresa'
            };
          }
          
          return { payment: paymentData, empresa: empresaData };
        });
    })
    .then(data => {
      // Generar PDF con jsPDF
      const { jsPDF } = window.jspdf;
      const { autoTable } = window.jspdf.autoTable;
      
      const doc = new jsPDF();
      
      // Datos de la empresa
      doc.setFontSize(18);
      doc.text(data.empresa.nombre || 'Seguridad 24/7', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text('RUC: ' + (data.empresa.ruc || 'N/A'), 105, 27, { align: 'center' });
      doc.text('Dirección: ' + (data.empresa.direccion || 'N/A'), 105, 32, { align: 'center' });
      doc.text('Teléfono: ' + (data.empresa.telefono || 'N/A'), 105, 37, { align: 'center' });
      doc.text('Email: ' + (data.empresa.email || 'N/A'), 105, 42, { align: 'center' });
      
      // Título de factura
      doc.setFontSize(16);
      doc.text('FACTURA', 105, 55, { align: 'center' });
      
      // Número de factura
      doc.setFontSize(10);
      doc.text('Nº: ' + paymentId.substring(0, 8), 105, 62, { align: 'center' });
      
      // Fecha
      let fechaStr = 'Fecha desconocida';
      if (data.payment.fecha) {
        const date = data.payment.fecha.toDate ? data.payment.fecha.toDate() : new Date(data.payment.fecha);
        fechaStr = date.toLocaleDateString();
      }
      doc.text('Fecha: ' + fechaStr, 105, 67, { align: 'center' });
      
      // Datos del cliente
      doc.setFontSize(11);
      doc.text('Datos del Cliente:', 20, 80);
      doc.setFontSize(10);
      doc.text('Nombre: ' + (data.payment.clientName || 'Cliente desconocido'), 25, 87);
      doc.text('ID Cliente: ' + (data.payment.clientId || 'N/A'), 25, 93);
      
      // Tabla de detalles
      autoTable(doc, {
        startY: 100,
        head: [['Concepto', 'Método de Pago', 'Monto']],
        body: [
          [
            data.payment.concepto || 'Servicio de seguridad',
            data.payment.metodo || 'Efectivo',
            
   + parseFloat(data.payment.monto).toFixed(2)
          ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30, halign: 'right' }
        }
      });
      
      // Total
      const finalY = doc.lastAutoTable.finalY || 120;
      doc.setFontSize(12);
      doc.text('Total:', 150, finalY + 20, { align: 'right' });
      doc.setFont(undefined, 'bold');
      doc.text(
   + parseFloat(data.payment.monto).toFixed(2), 180, finalY + 20, { align: 'right' });
      
      // Notas
      if (data.payment.notas) {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('Notas:', 20, finalY + 35);
        doc.text(data.payment.notas, 20, finalY + 42);
      }
      
      // Pie de página
      doc.setFontSize(8);
      doc.text('Esta factura fue generada automáticamente y es válida sin firma.', 105, 280, { align: 'center' });
      
      // Guardar o abrir PDF
      doc.save('Factura_' + paymentId.substring(0, 8) + '.pdf');
    })
    .catch(error => {
      console.error("Error al generar factura:", error);
      alert('Error al generar factura: ' + error.message);
    });
}

// Cerrar modal de pago
function closePaymentModal() {
  document.getElementById('pago-modal').classList.remove('active');
  document.getElementById('pago-form').reset();
  editingPaymentId = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Botón para registrar pago
  document.getElementById('registrar-pago-btn').addEventListener('click', openCreatePaymentModal);
  
  // Botones del modal
  document.getElementById('pago-save-btn').addEventListener('click', savePayment);
  document.getElementById('pago-cancel-btn').addEventListener('click', closePaymentModal);
  document.getElementById('pago-factura-btn').addEventListener('click', () => {
    if (editingPaymentId) {
      generateInvoice(editingPaymentId);
    }
  });
  document.querySelector('#pago-modal .close-modal').addEventListener('click', closePaymentModal);
  
  // Filtros
  document.getElementById('filtro-estado-pago').addEventListener('change', () => loadPayments(1));
  document.getElementById('filtro-metodo-pago').addEventListener('change', () => loadPayments(1));
  
  // Fechas
  document.getElementById('fecha-desde').addEventListener('change', () => loadPayments(1));
  document.getElementById('fecha-hasta').addEventListener('change', () => loadPayments(1));
  
  // Búsqueda
  let searchTimeout;
  document.getElementById('buscar-pago').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadPayments(1);
    }, 300);
  });
});