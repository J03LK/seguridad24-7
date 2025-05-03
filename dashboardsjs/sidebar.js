// Script para navegación entre secciones
document.addEventListener('DOMContentLoaded', function() {
  // Seleccionar elementos del menú
  const menuItems = document.querySelectorAll('.sidebar-menu a');
  
  // Seleccionar todas las secciones de contenido
  const sections = document.querySelectorAll('.content-section');
  
  // Añadir event listener a cada ítem del menú
  menuItems.forEach(function(item) {
      item.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Obtener la sección a mostrar
          const targetSection = this.getAttribute('data-section');
          
          // Remover clase active de todos los ítems del menú
          menuItems.forEach(function(menuItem) {
              menuItem.parentElement.classList.remove('active');
          });
          
          // Añadir clase active al ítem seleccionado
          this.parentElement.classList.add('active');
          
          // Ocultar todas las secciones
          sections.forEach(function(section) {
              section.classList.remove('active');
          });
          
          // Mostrar la sección seleccionada
          document.getElementById(targetSection + '-section').classList.add('active');
      });
  });
  
  // También manejar enlaces de "Ver todos" dentro del dashboard
  const viewAllLinks = document.querySelectorAll('.view-all');
  
  viewAllLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Obtener la sección a mostrar
          const targetSection = this.getAttribute('data-section');
          
          // Remover clase active de todos los ítems del menú
          menuItems.forEach(function(menuItem) {
              menuItem.parentElement.classList.remove('active');
          });
          
          // Añadir clase active al ítem correspondiente en el menú
          menuItems.forEach(function(menuItem) {
              if (menuItem.getAttribute('data-section') === targetSection) {
                  menuItem.parentElement.classList.add('active');
              }
          });
          
          // Ocultar todas las secciones
          sections.forEach(function(section) {
              section.classList.remove('active');
          });
          
          // Mostrar la sección seleccionada
          document.getElementById(targetSection + '-section').classList.add('active');
      });
  });

  // Toggle del sidebar
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', function() {
          sidebar.classList.toggle('collapsed');
      });
  }
  
  // Toggle del tema oscuro/claro
  const themeToggle = document.getElementById('theme-toggle');
  
  if (themeToggle) {
      themeToggle.addEventListener('click', function(e) {
          e.preventDefault();
          document.body.classList.toggle('dark-mode');
          
          const themeIcon = themeToggle.querySelector('i');
          const themeText = themeToggle.querySelector('span');
          
          if (themeIcon && themeText) {
              if (document.body.classList.contains('dark-mode')) {
                  themeIcon.className = 'fas fa-sun';
                  themeText.textContent = 'Modo Claro';
              } else {
                  themeIcon.className = 'fas fa-moon';
                  themeText.textContent = 'Modo Oscuro';
              }
          }
      });
  }
});