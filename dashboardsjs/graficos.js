// graficos.js - Módulo de gráficos y estadísticas completo
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si Firebase está disponible
  if (typeof firebase === 'undefined') {
      console.error('Firebase no está definido. Asegúrate de cargar los scripts de Firebase.');
      return;
  }
  
  // Verificar si Chart.js está disponible
  if (typeof Chart === 'undefined') {
      console.error('Chart.js no está definido. Asegúrate de cargar la biblioteca Chart.js.');
      
      // Intentar cargar Chart.js dinámicamente
      const chartScript = document.createElement('script');
      chartScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
      chartScript.onload = initializeCharts;
      document.body.appendChild(chartScript);
      
      return;
  }
  
  // Inicializar gráficos si Chart.js ya está cargado
  initializeCharts();
  
  // Función principal para inicializar todos los gráficos
  function initializeCharts() {
      // Configurar Chart.js globalmente para todos los gráficos
      Chart.defaults.font.family = "'Poppins', sans-serif";
      Chart.defaults.color = '#94A3B8';
      Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.05)';
      
      // Referencias a Firebase
      const db = firebase.firestore();
      
      // Verificar si estamos en la sección Dashboard
      if (document.getElementById('clientesChart')) {
          // Cargar datos para gráficos del dashboard
          loadDashboardCharts();
      }
      
      // Verificar si estamos en la sección de Estadísticas
      if (document.getElementById('clientesTendenciaChart')) {
          // Inicializar selectores de fecha para filtrado
          initDateRangeSelectors();
          
          // Cargar datos para gráficos de estadísticas
          loadAnalyticsCharts();
      }
      
      // Inicializar selectores de rango de fecha
      function initDateRangeSelectors() {
          const dateRangeButtons = document.querySelectorAll('.date-btn');
          if (dateRangeButtons.length === 0) return;
          
          dateRangeButtons.forEach(button => {
              button.addEventListener('click', function() {
                  // Actualizar botón activo
                  dateRangeButtons.forEach(btn => btn.classList.remove('active'));
                  this.classList.add('active');
                  
                  // Obtener rango de fecha seleccionado
                  const range = this.getAttribute('data-range');
                  
                  // Recargar gráficos con el nuevo rango
                  loadAnalyticsCharts(range);
              });
          });
          
          // Selector de fecha personalizada
          const customDateBtn = document.querySelector('.date-btn[data-range="custom"]');
          if (customDateBtn) {
              customDateBtn.addEventListener('click', function() {
                  openCustomDateModal();
              });
          }
      }
      
      // Abrir modal para seleccionar rango de fecha personalizado
      function openCustomDateModal() {
          // Crear modal dinámicamente
          const modal = document.createElement('div');
          modal.className = 'modal';
          modal.id = 'custom-date-modal';
          
          // Crear contenido del modal
          modal.innerHTML = `
              <div class="modal-content">
                  <div class="modal-header">
                      <h3>Seleccionar Rango de Fechas</h3>
                      <button class="modal-close">&times;</button>
                  </div>
                  <div class="modal-body">
                      <div class="form-group">
                          <label for="start-date">Fecha de Inicio:</label>
                          <input type="date" id="start-date" required>
                      </div>
                      <div class="form-group">
                          <label for="end-date">Fecha de Fin:</label>
                          <input type="date" id="end-date" required>
                      </div>
                      <div class="form-actions">
                          <button type="button" class="btn-secondary cancel-btn">Cancelar</button>
                          <button type="button" class="btn-primary" id="apply-date-range">Aplicar</button>
                      </div>
                  </div>
              </div>
          `;
          
          // Agregar modal al body
          document.body.appendChild(modal);
          
          // Mostrar modal
          setTimeout(() => {
              modal.classList.add('active');
              
              // Establecer fechas por defecto (últimos 30 días)
              const today = new Date();
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(today.getDate() - 30);
              
              document.getElementById('end-date').valueAsDate = today;
              document.getElementById('start-date').valueAsDate = thirtyDaysAgo;
          }, 10);
          
          // Event listeners
          const closeBtn = modal.querySelector('.modal-close');
          const cancelBtn = modal.querySelector('.cancel-btn');
          const applyBtn = document.getElementById('apply-date-range');
          
          // Cerrar modal
          function closeModal() {
              modal.classList.remove('active');
              setTimeout(() => {
                  document.body.removeChild(modal);
              }, 300);
          }
          
          // Event listeners para cerrar
          closeBtn.addEventListener('click', closeModal);
          cancelBtn.addEventListener('click', closeModal);
          
          // Click fuera del modal
          modal.addEventListener('click', function(e) {
              if (e.target === this) {
                  closeModal();
              }
          });
          
          // Aplicar rango de fechas
          applyBtn.addEventListener('click', function() {
              const startDate = document.getElementById('start-date').value;
              const endDate = document.getElementById('end-date').value;
              
              if (!startDate || !endDate) {
                  alert('Por favor seleccione ambas fechas');
                  return;
              }
              
              // Validar rango
              if (new Date(startDate) > new Date(endDate)) {
                  alert('La fecha de inicio debe ser anterior a la fecha de fin');
                  return;
              }
              
              // Aplicar rango
              loadAnalyticsCharts('custom', {
                  startDate: new Date(startDate),
                  endDate: new Date(endDate)
              });
              
              closeModal();
          });
      }
      
      // Cargar gráficos del dashboard
      function loadDashboardCharts() {
          // Obtener contextos de los canvas
          const clientesChartCtx = document.getElementById('clientesChart');
          const reportesChartCtx = document.getElementById('reportesChart');
          const pagosChartCtx = document.getElementById('pagosChart');
          
          // Solo continuar si los elementos existen
          if (!clientesChartCtx || !reportesChartCtx || !pagosChartCtx) return;
          
          // Crear gráficos
          createClientsChart(clientesChartCtx);
          createReportsChart(reportesChartCtx);
          createPaymentsChart(pagosChartCtx);
      }
      
      // Cargar gráficos de la sección de Estadísticas
      function loadAnalyticsCharts(dateRange = 'month', customRange = null) {
          // Obtener contextos de los canvas
          const clientesTendenciaChartCtx = document.getElementById('clientesTendenciaChart');
          const reportesMensualesChartCtx = document.getElementById('reportesMensualesChart');
          const pagosTipoChartCtx = document.getElementById('pagosTipoChart');
          const serviciosDistribucionChartCtx = document.getElementById('serviciosDistribucionChart');
          const ingresosCrecimientoChartCtx = document.getElementById('ingresosCrecimientoChart');
          
          // Solo continuar si los elementos existen
          if (!clientesTendenciaChartCtx) return;
          
          // Si todos los gráficos ya existen, destruirlos para evitar duplicados
          Chart.getChart(clientesTendenciaChartCtx)?.destroy();
          Chart.getChart(reportesMensualesChartCtx)?.destroy();
          Chart.getChart(pagosTipoChartCtx)?.destroy();
          Chart.getChart(serviciosDistribucionChartCtx)?.destroy();
          Chart.getChart(ingresosCrecimientoChartCtx)?.destroy();
          
          // Crear gráficos
          createClientsTrendChart(clientesTendenciaChartCtx, dateRange, customRange);
          
          if (reportesMensualesChartCtx) {
              createMonthlyReportsChart(reportesMensualesChartCtx, dateRange, customRange);
          }
          
          if (pagosTipoChartCtx) {
              createPaymentTypesChart(pagosTipoChartCtx, dateRange, customRange);
          }
          
          if (serviciosDistribucionChartCtx) {
              createServicesDistributionChart(serviciosDistribucionChartCtx, dateRange, customRange);
          }
          
          if (ingresosCrecimientoChartCtx) {
              createIncomeGrowthChart(ingresosCrecimientoChartCtx, dateRange, customRange);
          }
      }
      
      // Función para obtener datos de fechas según el rango
      function getDateRangeData(dateRange, customRange = null) {
          const today = new Date();
          let startDate, endDate, labels, interval;
          
          switch (dateRange) {
              case 'month':
                  // Último mes
                  startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                  endDate = today;
                  labels = getLast30DaysLabels();
                  interval = { days: 1 };
                  break;
                  
              case 'quarter':
                  // Último trimestre
                  startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                  endDate = today;
                  labels = getLast3MonthsLabels();
                  interval = { weeks: 1 };
                  break;
                  
              case 'year':
                  // Último año
                  startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
                  endDate = today;
                  labels = getLast12MonthsLabels();
                  interval = { months: 1 };
                  break;
                  
              case 'custom':
                  // Rango personalizado
                  if (customRange && customRange.startDate && customRange.endDate) {
                      startDate = customRange.startDate;
                      endDate = customRange.endDate;
                      
                      // Calcular intervalo basado en la diferencia de días
                      const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                      
                      if (diffDays <= 31) {
                          // Para rangos hasta 31 días, mostrar por día
                          labels = getCustomRangeLabels(startDate, endDate, 'day');
                          interval = { days: 1 };
                      } else if (diffDays <= 90) {
                          // Para rangos hasta 90 días, mostrar por semana
                          labels = getCustomRangeLabels(startDate, endDate, 'week');
                          interval = { weeks: 1 };
                      } else {
                          // Para rangos mayores, mostrar por mes
                          labels = getCustomRangeLabels(startDate, endDate, 'month');
                          interval = { months: 1 };
                      }
                  } else {
                      // Default a último mes si no hay rango personalizado
                      startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                      endDate = today;
                      labels = getLast30DaysLabels();
                      interval = { days: 1 };
                  }
                  break;
                  
              default:
                  // Por defecto, último mes
                  startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                  endDate = today;
                  labels = getLast30DaysLabels();
                  interval = { days: 1 };
          }
          
          return { startDate, endDate, labels, interval };
      }
      
      // Obtener etiquetas para rango personalizado
      function getCustomRangeLabels(startDate, endDate, interval) {
          const labels = [];
          const currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
              switch (interval) {
                  case 'day':
                      labels.push(currentDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
                      currentDate.setDate(currentDate.getDate() + 1);
                      break;
                      
                  case 'week':
                      labels.push(currentDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
                      currentDate.setDate(currentDate.getDate() + 7);
                      break;
                      
                  case 'month':
                      labels.push(currentDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }));
                      currentDate.setMonth(currentDate.getMonth() + 1);
                      break;
              }
          }
          
          return labels;
      }
      
      // Obtener etiquetas para los últimos 30 días
      function getLast30DaysLabels() {
          const labels = [];
          const today = new Date();
          
          for (let i = 29; i >= 0; i--) {
              const date = new Date(today);
              date.setDate(date.getDate() - i);
              labels.push(date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
          }
          
          return labels;
      }
      
      // Obtener etiquetas para los últimos 3 meses (por semana)
      function getLast3MonthsLabels() {
          const labels = [];
          const today = new Date();
          
          for (let i = 12; i >= 0; i--) {
              const date = new Date(today);
              date.setDate(date.getDate() - (i * 7));
              labels.push(date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
          }
          
          return labels;
      }
      
      // Obtener etiquetas para los últimos 12 meses
      function getLast12MonthsLabels() {
          const labels = [];
          const today = new Date();
          
          for (let i = 11; i >= 0; i--) {
              const date = new Date(today);
              date.setMonth(date.getMonth() - i);
              labels.push(date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }));
          }
          
          return labels;
      }
      
      // ========== Gráficos del Dashboard ==========
      
      // Crear gráfico de clientes (últimos 6 meses)
      function createClientsChart(ctx) {
          // Obtener datos
          fetchClientsData().then(data => {
              // Crear gráfico
              const clientesChart = new Chart(ctx, {
                  type: 'line',
                  data: {
                      labels: data.labels,
                      datasets: [{
                          label: 'Clientes Activos',
                          data: data.values,
                          fill: true,
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          borderColor: '#4CAF50',
                          tension: 0.4,
                          pointBackgroundColor: '#4CAF50',
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2
                      }]
                  },
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: {
                              display: true,
                              position: 'top'
                          },
                          tooltip: {
                              mode: 'index',
                              intersect: false
                          }
                      },
                      scales: {
                          y: {
                              beginAtZero: true,
                              ticks: {
                                  precision: 0
                              }
                          }
                      },
                      animation: {
                          duration: 1000
                      }
                  }
              });
          });
      }
      
      // Crear gráfico de reportes por tipo
      function createReportsChart(ctx) {
          // Obtener datos
          fetchReportsData().then(data => {
              // Crear gráfico
              const reportesChart = new Chart(ctx, {
                  type: 'doughnut',
                  data: {
                      labels: data.labels,
                      datasets: [{
                          data: data.values,
                          backgroundColor: [
                              '#EF4444', // Rojo para alertas
                              '#FACC15', // Amarillo para warnings
                              '#22C55E', // Verde para resueltos
                              '#3B82F6'  // Azul para info
                          ],
                          borderWidth: 1
                      }]
                  },
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: {
                              position: 'bottom'
                          },
                          tooltip: {
                              callbacks: {
                                  label: function(context) {
                                      const label = context.label || '';
                                      const value = context.raw || 0;
                                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                      const percentage = Math.round((value * 100) / total) + '%';
                                      return `${label}: ${value} (${percentage})`;
                                  }
                              }
                          }
                      },
                      animation: {
                          animateRotate: true,
                          animateScale: true
                      }
                  }
              });
          });
      }
      
      // Crear gráfico de pagos (último trimestre)
      function createPaymentsChart(ctx) {
          // Obtener datos
          fetchPaymentsData().then(data => {
              // Crear gráfico
              const pagosChart = new Chart(ctx, {
                  type: 'bar',
                  data: {
                      labels: data.labels,
                      datasets: [{
                          label: 'Pagos Realizados',
                          data: data.values,
                          backgroundColor: '#3B82F6',
                          borderRadius: 6
                      }, {
                          label: 'Pagos Pendientes',
                          data: data.pendingValues,
                          backgroundColor: '#FACC15',
                          borderRadius: 6
                      }]
                  },
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: {
                              position: 'top'
                          },
                          tooltip: {
                              mode: 'index',
                              intersect: false,
                              callbacks: {
                                  label: function(context) {
                                      const label = context.dataset.label || '';
                                      const value = context.raw || 0;
                                      return `${label}: $${value.toFixed(2)}`;
                                  }
                              }
                          }
                      },
                      scales: {
                          y: {
                              beginAtZero: true,
                              ticks: {
                                  callback: function(value) {
                                      return '$' + value;
                                  }
                              }
                          }
                      },
                      animation: {
                          duration: 1000
                      }
                  }
              });
          });
      }
      
      // ========== Gráficos de Estadísticas ==========
      
      // Crear gráfico de tendencia de clientes
      function createClientsTrendChart(ctx, dateRange, customRange) {
          // Obtener rango de fechas
          const { labels } = getDateRangeData(dateRange, customRange);
          
          // Obtener datos
          fetchClientsTrendData(dateRange, customRange).then(data => {
              // Crear gráfico
              const clientesTrendChart = new Chart(ctx, {
                  type: 'line',
                  data: {
                      labels: labels,
                      datasets: [{
                          label: 'Clientes Activos',
                          data: data.activos,
                          borderColor: '#4CAF50',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          fill: true,
                          tension: 0.4
                      }, {
                          label: 'Clientes Nuevos',
                          data: data.nuevos,
                          borderColor: '#3B82F6',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          fill: true,
                          tension: 0.4
                      }]
                  },
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: {
                              position: 'top'
                          },
                          tooltip: {
                              mode: 'index',
                              intersect: false
                          }
                      },
                      scales: {
                          y: {
                              beginAtZero: true,
                              ticks: {
                                  precision: 0
                              }
                          }
                      },
                      animation: {
                          duration: 1000
                      }
                  }
              });
          });
      }
      
      // Crear gráfico de reportes mensuales
      function createMonthlyReportsChart(ctx, dateRange, customRange) {
          // Obtener rango de fechas
          const { labels } = getDateRangeData(dateRange, customRange);
          
          // Obtener datos
          fetchMonthlyReportsData(dateRange, customRange).then(data => {
              // Crear gráfico
              const reportesChart = new Chart(ctx, {
                  type: 'bar',
                  data: {
                      labels: labels,
                      datasets: [{
                          label: 'Alertas',
                          data: data.alerts,
                          backgroundColor: '#EF4444',
                          borderRadius: 6
                      }, {
                          label: 'Errores',
                          data: data.errors,
                          backgroundColor: '#FACC15',
                          borderRadius: 6
                      }, {
                          label: 'Mantenimiento',
                          data: data.maintenance,
                          backgroundColor: '#3B82F6',
                          borderRadius: 6
                      }]
                  },
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: {
                              position: 'top'
                          },
                          tooltip: {
                              mode: 'index',
                              intersect: false
                          }
                      },
                      scales: {
                          y: {
                              beginAtZero: true,
                              stacked: true,
                              ticks: {
                                  precision: 0
                              }
                          },
                          x: {
                              stacked: true
                          }
                      },
                      animation: {
                          duration: 1000
                      }
                  }
              });
          });
      }
      
      // Crear gráfico de tipos de pagos
      function createPaymentTypesChart(ctx, dateRange, customRange) {
          // Obtener rango de fechas
          const { labels } = getDateRangeData(dateRange, customRange);
          
          // Obtener datos
          fetchPaymentTypesData(dateRange, customRange).then(data => {
              // Crear gráfico
              const pagosTipoChart = new Chart(ctx, {
                  type: 'line',
                  data: {
                      labels: labels,
                      datasets: [{
                          label: 'Completados',
                          data: data.completed,
                          borderColor: '#22C55E',
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          fill: true,
                          tension: 0.4
                      }, {
                          label: 'Pendientes',
                          data: data.pending,
                          borderColor: '#FACC15',
                          backgroundColor: 'rgba(250, 204, 21, 0.1)',
                          fill: true,
                          tension: 0.4
                      }]
                  },
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: {
                              position: 'top'
                          },
                          tooltip: {
                              mode: 'index',
                              intersect: false
                          }
                      },
                      scales: {
                          y: {
                              beginAtZero: true,
                              ticks: {
                                  precision: 0
                              }
                          }
                      },
                      animation: {
                          duration: 1000
                      }
                  }
              });
          });
      }
      
      // Crear gráfico de distribución de servicios
      function createServicesDistributionChart(ctx, dateRange, customRange) {
          // Obtener datos
          fetchServicesDistributionData(dateRange, customRange).then(data => {
              // Crear gráfico
              const serviciosChart = new Chart(ctx, {
                  type: 'pie',
                  data: {
                      labels: data.labels,
                      datasets: [{
                          data: data.values,
                          backgroundColor: [
                              '#4CAF50',
                              '#3B82F6',
                              '#EF4444',
                              '#FACC15',
                              '#EC4899',
                              '#8B5CF6'
                          ],
                          borderWidth: 1
                      }]
                  },
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: {
                              position: 'right'
                          },
                          tooltip: {
                              callbacks: {
                                  label: function(context) {
                                      const label = context.label || '';
                                      const value = context.raw || 0;
                                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                      const percentage = Math.round((value * 100) / total) + '%';
                                      return `${label}: ${percentage}`;
                                  }
                              }
                          }
                      },
                      animation: {
                          animateRotate: true,
                          animateScale: true
                      }
                  }
              });
          });
      }
      
      // Crear gráfico de crecimiento de ingresos
      function createIncomeGrowthChart(ctx, dateRange, customRange) {
          // Obtener rango de fechas
          const { labels } = getDateRangeData(dateRange, customRange);
          
          // Obtener datos
          fetchIncomeGrowthData(dateRange, customRange).then(data => {
              // Crear gráfico
              const ingresosChart = new Chart(ctx, {
                  type: 'bar',
                  data: {
                      labels: labels,
                      datasets: [{
                          label: 'Ingresos',
                          data: data.values,
                          backgroundColor: '#4CAF50',
                          borderRadius: 6
                      }, {
                          label: 'Tendencia',
                          data: data.trend,
                          type: 'line',
                          borderColor: '#3B82F6',
                          borderWidth: 2,
                          pointBackgroundColor: '#3B82F6',
                          fill: false,
                          tension: 0.4
                      }]
                  },
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: {
                              position: 'top'
                          },
                          tooltip: {
                              mode: 'index',
                              intersect: false,
                              callbacks: {
                                  label: function(context) {
                                      const label = context.dataset.label || '';
                                      const value = context.raw || 0;
                                      return `${label}: $${value.toFixed(2)}`;
                                  }
                              }
                          }
                      },
                      scales: {
                          y: {
                              beginAtZero: true,
                              ticks: {
                                  callback: function(value) {
                                      return '$' + value;
                                  }
                              }
                          }
                      },
                      animation: {
                          duration: 1000
                      }
                  }
              });
          });
      }
      
      // ========== Funciones para obtener datos ==========
      
      // Obtener datos de clientes (últimos 6 meses) - ACTUALIZADO
      async function fetchClientsData() {
          const labels = [];
          const values = [];
          
          // Generar últimos 6 meses
          const today = new Date();
          for (let i = 5; i >= 0; i--) {
              const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
              labels.push(month.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }));
          }
          
          try {
              // Obtener TODOS los clientes para contar mes por mes
              const snapshot = await db.collection('usuarios')
                  .where('role', '==', 'user')
                  .get();
              
              // Contar clientes ACTIVOS acumulados hasta cada mes
              for (let i = 0; i < labels.length; i++) {
                  const monthDate = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
                  const monthEndDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                  
                  let activeCount = 0;
                  
                  snapshot.forEach(doc => {
                      const data = doc.data();
                      if (data.createdAt) {
                          const createdDate = data.createdAt.toDate();
                          
                          // Si el cliente fue creado antes o durante este mes y está activo
                          if (createdDate <= monthEndDate && (!data.status || data.status === 'active')) {
                              activeCount++;
                          }
                      }
                  });
                  
                  values.push(activeCount);
              }
              
              return { labels, values };
          } catch (error) {
              console.error('Error al obtener datos de clientes:', error);
              // Retornar datos vacíos en caso de error
              return { labels, values: new Array(6).fill(0) };
          }
      }
      
      // Obtener datos de reportes por tipo - ACTUALIZADO
      async function fetchReportsData() {
          try {
              const snapshot = await db.collection('reportes').get();
              
              const reportsByType = {
                  'alert': 0,
                  'error': 0,
                  'maintenance': 0,
                  'info': 0
              };
              
              snapshot.forEach(doc => {
                  const data = doc.data();
                  if (data.type && reportsByType.hasOwnProperty(data.type)) {
                      reportsByType[data.type]++;
                  }
              });
              
              return {
                  labels: ['Alertas', 'Errores', 'Mantenimiento', 'Info'],
                  values: [
                      reportsByType.alert,
                      reportsByType.error,
                      reportsByType.maintenance,
                      reportsByType.info
                  ]
              };
          } catch (error) {
              console.error('Error al obtener datos de reportes:', error);
              // Retornar datos vacíos en caso de error
              return {
                  labels: ['Alertas', 'Errores', 'Mantenimiento', 'Info'],
                  values: [0, 0, 0, 0]
              };
          }
      }
      
      // Obtener datos de pagos (último trimestre) - ACTUALIZADO
      async function fetchPaymentsData() {
          try {
              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
              
              const snapshot = await db.collection('pagos')
                  .where('date', '>=', threeMonthsAgo)
                  .get();
              
              // Organizar pagos por mes
              const paymentsByMonth = {};
              const pendingByMonth = {};
              
              snapshot.forEach(doc => {
                  const data = doc.data();
                  if (data.date) {
                      const date = data.date.toDate();
                      const monthKey = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                      
                      if (!paymentsByMonth[monthKey]) {
                          paymentsByMonth[monthKey] = 0;
                          pendingByMonth[monthKey] = 0;
                      }
                      
                      if (data.status === 'completed') {
                          paymentsByMonth[monthKey] += data.amount || 0;
                      } else if (data.status === 'pending') {
                          pendingByMonth[monthKey] += data.amount || 0;
                      }
                  }
              });
              
              const labels = [];
              const values = [];
              const pendingValues = [];
              
              // Generar últimos 3 meses
              const today = new Date();
              for (let i = 2; i >= 0; i--) {
                  const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
                  const monthKey = month.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                  
                  labels.push(monthKey);
                  values.push(paymentsByMonth[monthKey] || 0);
                  pendingValues.push(pendingByMonth[monthKey] || 0);
              }
              
              return { labels, values, pendingValues };
          } catch (error) {
              console.error('Error al obtener datos de pagos:', error);
              // Retornar datos vacíos en caso de error
              return { 
                  labels: ['Mes 1', 'Mes 2', 'Mes 3'], 
                  values: [0, 0, 0], 
                  pendingValues: [0, 0, 0] 
              };
          }
      }
      
      // Obtener datos de tendencia de clientes - ACTUALIZADO
      async function fetchClientsTrendData(dateRange, customRange) {
          const { labels, startDate, endDate } = getDateRangeData(dateRange, customRange);
          
          try {
              // Obtener todos los clientes
              const snapshot = await db.collection('usuarios')
                  .where('role', '==', 'user')
                  .get();
              
              // Arrays para almacenar datos
              const activos = new Array(labels.length).fill(0);
              const nuevos = new Array(labels.length).fill(0);
              
              // Procesar cada cliente
              snapshot.forEach(doc => {
                  const data = doc.data();
                  if (data.createdAt) {
                      const createdDate = data.createdAt.toDate();
                      
                      // Para cada punto en el tiempo, contar clientes activos hasta ese momento
                      for (let i = 0; i < labels.length; i++) {
                          let checkDate;
                          
                          if (dateRange === 'month' || (dateRange === 'custom' && labels.length <= 31)) {
                              // Por día
                              checkDate = new Date(startDate);
                              checkDate.setDate(checkDate.getDate() + i);
                          } else if (dateRange === 'quarter' || (dateRange === 'custom' && labels.length <= 90)) {
                              // Por semana
                              checkDate = new Date(startDate);
                              checkDate.setDate(checkDate.getDate() + (i * 7));
                          } else {
                              // Por mes
                              checkDate = new Date(startDate);
                              checkDate.setMonth(checkDate.getMonth() + i);
                          }
                          
                          // Si el cliente fue creado antes o en esta fecha y está activo
                          if (createdDate <= checkDate && (!data.status || data.status === 'active')) {
                              activos[i]++;
                          }
                          
                          // Si el cliente fue creado en este período específico
                          let prevCheckDate;
                          if (i === 0) {
                              prevCheckDate = new Date(startDate);
                              prevCheckDate.setDate(prevCheckDate.getDate() - 1);
                          } else {
                              if (dateRange === 'month' || (dateRange === 'custom' && labels.length <= 31)) {
                                  prevCheckDate = new Date(startDate);
                                  prevCheckDate.setDate(prevCheckDate.getDate() + i - 1);
                              } else if (dateRange === 'quarter' || (dateRange === 'custom' && labels.length <= 90)) {
                                  prevCheckDate = new Date(startDate);
                                  prevCheckDate.setDate(prevCheckDate.getDate() + ((i - 1) * 7));
                              } else {
                                  prevCheckDate = new Date(startDate);
                                  prevCheckDate.setMonth(prevCheckDate.getMonth() + i - 1);
                              }
                          }
                          
                          if (createdDate > prevCheckDate && createdDate <= checkDate) {
                              nuevos[i]++;
                          }
                      }
                  }
              });
              
              return { activos, nuevos };
          } catch (error) {
              console.error('Error al obtener tendencia de clientes:', error);
              // Retornar datos vacíos en caso de error
              return { 
                  activos: new Array(labels.length).fill(0), 
                  nuevos: new Array(labels.length).fill(0) 
              };
          }
      }
      
      // Obtener datos de reportes mensuales - ACTUALIZADO
      async function fetchMonthlyReportsData(dateRange, customRange) {
          const { labels, startDate, endDate } = getDateRangeData(dateRange, customRange);
          
          try {
              const snapshot = await db.collection('reportes')
                  .where('createdAt', '>=', startDate)
                  .where('createdAt', '<=', endDate)
                  .get();
              
              const alerts = new Array(labels.length).fill(0);
              const errors = new Array(labels.length).fill(0);
              const maintenance = new Array(labels.length).fill(0);
              
              snapshot.forEach(doc => {
                  const data = doc.data();
                  if (data.createdAt && data.type) {
                      const reportDate = data.createdAt.toDate();
                      
                      // Determinar el índice correspondiente
                      let index = -1;
                      
                      if (dateRange === 'month' || (dateRange === 'custom' && labels.length <= 31)) {
                          const daysDiff = Math.floor((reportDate - startDate) / (1000 * 60 * 60 * 24));
                          index = daysDiff;
                      } else if (dateRange === 'quarter' || (dateRange === 'custom' && labels.length <= 90)) {
                          const weeksDiff = Math.floor((reportDate - startDate) / (1000 * 60 * 60 * 24 * 7));
                          index = weeksDiff;
                      } else {
                          const monthsDiff = (reportDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                             (reportDate.getMonth() - startDate.getMonth());
                          index = monthsDiff;
                      }
                      
                      if (index >= 0 && index < labels.length) {
                          switch (data.type) {
                              case 'alert':
                                  alerts[index]++;
                                  break;
                              case 'error':
                                  errors[index]++;
                                  break;
                              case 'maintenance':
                                  maintenance[index]++;
                                  break;
                          }
                      }
                  }
              });
              
              return { alerts, errors, maintenance };
          } catch (error) {
              console.error('Error al obtener reportes mensuales:', error);
              // Retornar datos vacíos en caso de error
              return { 
                  alerts: new Array(labels.length).fill(0), 
                  errors: new Array(labels.length).fill(0), 
                  maintenance: new Array(labels.length).fill(0) 
              };
          }
      }
      
      // Obtener datos de tipos de pagos - ACTUALIZADO
      async function fetchPaymentTypesData(dateRange, customRange) {
          const { labels, startDate, endDate } = getDateRangeData(dateRange, customRange);
          
          try {
              const snapshot = await db.collection('pagos')
                  .where('date', '>=', startDate)
                  .where('date', '<=', endDate)
                  .get();
              
              const completed = new Array(labels.length).fill(0);
              const pending = new Array(labels.length).fill(0);
              
              snapshot.forEach(doc => {
                  const data = doc.data();
                  if (data.date && data.status) {
                      const paymentDate = data.date.toDate();
                      
                      // Determinar el índice correspondiente
                      let index = -1;
                      
                      if (dateRange === 'month' || (dateRange === 'custom' && labels.length <= 31)) {
                          const daysDiff = Math.floor((paymentDate - startDate) / (1000 * 60 * 60 * 24));
                          index = daysDiff;
                      } else if (dateRange === 'quarter' || (dateRange === 'custom' && labels.length <= 90)) {
                          const weeksDiff = Math.floor((paymentDate - startDate) / (1000 * 60 * 60 * 24 * 7));
                          index = weeksDiff;
                      } else {
                          const monthsDiff = (paymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                             (paymentDate.getMonth() - startDate.getMonth());
                          index = monthsDiff;
                      }
                      
                      if (index >= 0 && index < labels.length) {
                          if (data.status === 'completed') {
                              completed[index]++;
                          } else if (data.status === 'pending') {
                              pending[index]++;
                          }
                      }
                  }
              });
              
              return { completed, pending };
          } catch (error) {
              console.error('Error al obtener tipos de pagos:', error);
              // Retornar datos vacíos en caso de error
              return { 
                  completed: new Array(labels.length).fill(0), 
                  pending: new Array(labels.length).fill(0) 
              };
          }
      }
      
      // Obtener datos de distribución de servicios - ACTUALIZADO
      async function fetchServicesDistributionData(dateRange, customRange) {
          try {
              const { startDate, endDate } = getDateRangeData(dateRange, customRange);
              
              // Obtener pagos en el rango de fechas
              const paymentsSnapshot = await db.collection('pagos')
                  .where('date', '>=', startDate)
                  .where('date', '<=', endDate)
                  .where('status', '==', 'completed')
                  .get();
              
              const serviceDistribution = {};
              
              // Contar servicios de los pagos
              paymentsSnapshot.forEach(doc => {
                  const data = doc.data();
                  if (data.serviceName) {
                      if (!serviceDistribution[data.serviceName]) {
                          serviceDistribution[data.serviceName] = 0;
                      }
                      serviceDistribution[data.serviceName]++;
                  }
              });
              
              // Convertir a formato para el gráfico
              const labels = Object.keys(serviceDistribution);
              const values = Object.values(serviceDistribution);
              
              // Si no hay datos, intentar obtener servicios disponibles
              if (labels.length === 0) {
                  const servicesSnapshot = await db.collection('productos')
                      .where('active', '==', true)
                      .get();
                  
                  servicesSnapshot.forEach(doc => {
                      const data = doc.data();
                      if (data.name) {
                          labels.push(data.name);
                          values.push(0); // No hay ventas de este servicio en el período
                      }
                  });
              }
              
              // Si aún no hay datos, retornar estructura vacía
              if (labels.length === 0) {
                  return {
                      labels: ['Sin servicios'],
                      values: [0]
                  };
              }
              
              return { labels, values };
          } catch (error) {
              console.error('Error al obtener distribución de servicios:', error);
              // Retornar datos vacíos en caso de error
              return {
                  labels: ['Error al cargar'],
                  values: [0]
              };
          }
      }
      
      // Obtener datos de crecimiento de ingresos - ACTUALIZADO
      async function fetchIncomeGrowthData(dateRange, customRange) {
          const { labels, startDate, endDate } = getDateRangeData(dateRange, customRange);
          
          try {
              const snapshot = await db.collection('pagos')
                  .where('date', '>=', startDate)
                  .where('date', '<=', endDate)
                  .where('status', '==', 'completed')
                  .get();
              
              const values = new Array(labels.length).fill(0);
              
              snapshot.forEach(doc => {
                  const data = doc.data();
                  if (data.date && data.amount) {
                      const paymentDate = data.date.toDate();
                      
                      // Determinar el índice correspondiente
                      let index = -1;
                      
                      if (dateRange === 'month' || (dateRange === 'custom' && labels.length <= 31)) {
                          const daysDiff = Math.floor((paymentDate - startDate) / (1000 * 60 * 60 * 24));
                          index = daysDiff;
                      } else if (dateRange === 'quarter' || (dateRange === 'custom' && labels.length <= 90)) {
                          const weeksDiff = Math.floor((paymentDate - startDate) / (1000 * 60 * 60 * 24 * 7));
                          index = weeksDiff;
                      } else {
                          const monthsDiff = (paymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                             (paymentDate.getMonth() - startDate.getMonth());
                          index = monthsDiff;
                      }
                      
                      if (index >= 0 && index < values.length) {
                          values[index] += data.amount;
                      }
                  }
              });
              
              // Calcular línea de tendencia (promedio móvil simple)
              const trend = [];
              const windowSize = Math.min(3, labels.length);
              
              for (let i = 0; i < values.length; i++) {
                  if (i < windowSize - 1) {
                      trend.push(null);
                  } else {
                      let sum = 0;
                      for (let j = 0; j < windowSize; j++) {
                          sum += values[i - j];
                      }
                      trend.push(sum / windowSize);
                  }
              }
              
              return { values, trend };
          } catch (error) {
              console.error('Error al obtener crecimiento de ingresos:', error);
              // Retornar datos vacíos en caso de error
              return { 
                  values: new Array(labels.length).fill(0), 
                  trend: new Array(labels.length).fill(null) 
              };
          }
      }
      
      // ========== Funciones de utilidad para exportar datos ==========
      
      // Exportar datos de gráfico a CSV
      function exportChartData(chartId) {
          const chart = Chart.getChart(chartId);
          if (!chart) return;
          
          const labels = chart.data.labels;
          const datasets = chart.data.datasets;
          
          // Crear CSV
          let csv = 'Fecha';
          datasets.forEach(dataset => {
              csv += ',' + dataset.label;
          });
          csv += '\n';
          
          // Agregar datos
          for (let i = 0; i < labels.length; i++) {
              csv += labels[i];
              datasets.forEach(dataset => {
                  csv += ',' + (dataset.data[i] || 0);
              });
              csv += '\n';
          }
          
          // Descargar archivo
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${chartId}_datos.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
      }
      
      // Agregar botones de exportación a los gráficos
      function addExportButtons() {
          const charts = document.querySelectorAll('.chart-container');
          charts.forEach(container => {
              const canvas = container.querySelector('canvas');
              if (!canvas) return;
              
              const chartActions = container.querySelector('.chart-actions');
              if (!chartActions) return;
              
              // Verificar si ya existe un botón de exportar
              if (chartActions.querySelector('.export-btn')) return;
              
              // Agregar botón de exportar
              const exportBtn = document.createElement('button');
              exportBtn.className = 'chart-action export-btn';
              exportBtn.title = 'Exportar datos';
              exportBtn.innerHTML = '<i class="fas fa-file-export"></i>';
              
              exportBtn.addEventListener('click', function() {
                  exportChartData(canvas.id);
              });
              
              chartActions.appendChild(exportBtn);
          });
      }
      
      // Inicializar botones de exportación cuando los gráficos estén listos
      setTimeout(addExportButtons, 2000);
  }
});