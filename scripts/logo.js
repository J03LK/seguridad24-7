/*
=================================
Archivo: scripts/logo.js
Contiene el script para el efecto de logo neón con cortocircuito
=================================
*/

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si los elementos necesarios existen
    const logoElement = document.getElementById('neonLogo');
    
    if (!logoElement) {
        console.warn('Elemento de logo no encontrado');
        return;
    }
    
    // Crear contenedores necesarios si no existen
    let neonWrap = document.querySelector('.neon-logo-wrap');
    if (!neonWrap) {
        // Si no existe el contenedor, lo creamos y movemos el logo dentro
        neonWrap = document.createElement('div');
        neonWrap.className = 'neon-logo-wrap';
        
        // Obtener el contenedor del logo actual
        const existingContainer = logoElement.parentElement;
        
        // Insertar el nuevo contenedor antes del logo
        existingContainer.insertBefore(neonWrap, logoElement);
        
        // Mover el logo dentro del nuevo contenedor
        neonWrap.appendChild(logoElement);
    }
    
    // Crear el elemento para el efecto de luz ambiental si no existe
    let ambientLight = document.querySelector('.background-neon-light');
    if (!ambientLight) {
        ambientLight = document.createElement('div');
        ambientLight.className = 'background-neon-light';
        ambientLight.id = 'backgroundNeonLight';
        document.body.appendChild(ambientLight);
    }
    
    // Iniciar los efectos
    setupAmbientEffect();
    setTimeout(createSparks, 100);
    
    // Reiniciar la animación del logo
    replayNeonEffect();
});

// Función para repetir el efecto neón
function replayNeonEffect() {
    const logo = document.getElementById('neonLogo');
    if (!logo) return;
    
    // Reiniciar la animación
    logo.style.animation = 'none';
    void logo.offsetWidth; // Truco para forzar un reflow
    logo.style.animation = 'neonElectricalFailure 8s forwards';
    
    // Limpiar chispas existentes
    const sparks = document.querySelectorAll('.neon-spark');
    sparks.forEach(spark => spark.remove());
    
    // Reiniciar efecto ambiental
    setupAmbientEffect();
    
    // Añadir nuevas chispas
    setTimeout(createSparks, 100);
}

// Función para configurar el efecto ambiental
function setupAmbientEffect() {
    const ambientLight = document.getElementById('backgroundNeonLight');
    if (ambientLight) {
        ambientLight.style.opacity = '0';
    }
}

// Función para crear el efecto de chispas eléctricas
function createSparks() {
    const logoContainer = document.querySelector('.neon-logo-wrap');
    const logo = document.getElementById('neonLogo');
    
    if (!logoContainer || !logo) return;
    
    const logoRect = logo.getBoundingClientRect();
    
    // Momentos clave para las chispas (porcentajes de la animación)
    const sparkMoments = [5, 12, 20, 26, 40, 50];
    
    // Crear chispas para cada momento clave
    sparkMoments.forEach(moment => {
        setTimeout(() => {
            // Solo crear chispas si el efecto sigue en reproducción
            if (logo.style.animation.includes('neonElectricalFailure')) {
                // Número aleatorio de chispas por momento
                const sparkCount = Math.floor(Math.random() * 5) + 3;
                
                for (let i = 0; i < sparkCount; i++) {
                    createSpark(logoContainer, logoRect);
                }
                
                // Iluminar brevemente el ambiente
                flashAmbientNeonLight();
            }
        }, (moment / 100) * 8000); // 8000ms es la duración de la animación
    });
}

// Función para crear una chispa individual
function createSpark(container, logoRect) {
    const spark = document.createElement('div');
    spark.classList.add('neon-spark');
    
    // Posición aleatoria alrededor del logo
    const edgePosition = Math.random();
    let posX, posY;
    
    // Decidir si la chispa aparece en los bordes horizontales o verticales
    if (Math.random() > 0.5) {
        // Bordes horizontales (arriba/abajo)
        posX = Math.random() * logoRect.width;
        posY = edgePosition < 0.5 ? -5 : logoRect.height + 5;
    } else {
        // Bordes verticales (izquierda/derecha)
        posX = edgePosition < 0.5 ? -5 : logoRect.width + 5;
        posY = Math.random() * logoRect.height;
    }
    
    spark.style.left = posX + 'px';
    spark.style.top = posY + 'px';
    
    // Variaciones de tamaño
    const size = Math.random() * 4 + 2;
    spark.style.width = size + 'px';
    spark.style.height = size + 'px';
    
    // Añadir al contenedor
    container.appendChild(spark);
    
    // Animación de la chispa
    setTimeout(() => {
        spark.style.opacity = '1';
        
        // Movimiento aleatorio
        const moveX = (Math.random() - 0.5) * 30;
        const moveY = (Math.random() - 0.5) * 30;
        spark.style.transform = `translate(${moveX}px, ${moveY}px)`;
        
        // Desvanecer y eliminar
        setTimeout(() => {
            spark.style.opacity = '0';
            setTimeout(() => spark.remove(), 300);
        }, Math.random() * 200 + 100);
    }, 0);
}

// Función para iluminar brevemente el ambiente
function flashAmbientNeonLight() {
    const ambientLight = document.getElementById('backgroundNeonLight');
    if (!ambientLight) return;
    
    ambientLight.style.opacity = '0.7';
    setTimeout(() => {
        ambientLight.style.opacity = '0';
    }, 100);
}

// Exponemos la función para reiniciar el efecto al objeto window
// para que pueda ser llamada desde otros scripts si es necesario
window.replayNeonEffect = replayNeonEffect;