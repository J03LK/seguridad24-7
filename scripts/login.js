// Elementos del DOM
document.addEventListener('DOMContentLoaded', function() {
    // Selectores principales
    const signInBtn = document.getElementById('sign-in-btn');
    const signInBtnPanel = document.getElementById('sign-in-btn-panel');
    const signUpBtn = document.getElementById('sign-up-btn');
    const container = document.getElementById('container');
    const loginForm = document.getElementById('loginForm');
    
    // Selectores para inputs y botones
    const inputFields = document.querySelectorAll('.input-field input');
    const passwordToggles = document.querySelectorAll('.password-toggle');
    const loginButton = document.getElementById('login-button');
    
    // Cargar Firebase
    loadFirebase();

    // Cambio entre formularios con animación suave
    if (signUpBtn) {
        signUpBtn.addEventListener("click", () => {
            // Desactiva temporalmente los clics
            signUpBtn.style.pointerEvents = 'none';
            signInBtn.style.pointerEvents = 'none';

            // Añadimos clase animating para mejorar la transición
            container.classList.add("animating");
            container.classList.add("sign-up-mode");
            
            // Añadimos una transición más suave para la burbuja
            const waveBubble = document.querySelector(".wave-bubble");
            if (waveBubble) {
                waveBubble.style.transition = "all 1.8s cubic-bezier(0.645, 0.045, 0.355, 1.000)";
                
                // Animación más suave y controlada
                waveBubble.style.transform = 'translate(100%, -10%) scale(1.2)';
                waveBubble.style.opacity = '0.9';
                
                // Efecto extra durante la transición
                setTimeout(() => {
                    waveBubble.style.filter = "brightness(1.03)";
                    setTimeout(() => {
                        waveBubble.style.filter = "none";
                    }, 600);
                }, 300);
            }
            
            // Reseteamos la transición después de un tiempo
            setTimeout(() => {
                // Restaura los clics
                signUpBtn.style.pointerEvents = 'auto';
                signInBtn.style.pointerEvents = 'auto';
                
                if (waveBubble) {
                    // Reset de la transformación
                    waveBubble.style.transform = 'translate(0, 0) scale(1)';
                    waveBubble.style.opacity = '1';
                    
                    waveBubble.style.transition = "1.8s cubic-bezier(0.65, 0.05, 0.36, 1)";
                }
                // Quitamos la clase animating después de la transición
                container.classList.remove("animating");
            }, 2000);
        });
    }

    if (signInBtn) {
        signInBtn.addEventListener("click", () => {
            // Desactiva temporalmente los clics
            if (signUpBtn) signUpBtn.style.pointerEvents = 'none';
            signInBtn.style.pointerEvents = 'none';

            // Añadimos clase animating para mejorar la transición
            container.classList.add("animating");
            container.classList.remove("sign-up-mode");
            
            // Añadimos una transición más suave para la burbuja
            const waveBubble = document.querySelector(".wave-bubble");
            if (waveBubble) {
                waveBubble.style.transition = "all 1.8s cubic-bezier(0.645, 0.045, 0.355, 1.000)";
                
                // Animación más suave y controlada
                waveBubble.style.transform = 'translate(-100%, -10%) scale(1.2)';
                waveBubble.style.opacity = '0.9';
                
                // Efecto extra durante la transición
                setTimeout(() => {
                    waveBubble.style.filter = "brightness(1.03)";
                    setTimeout(() => {
                        waveBubble.style.filter = "none";
                    }, 600);
                }, 300);
            }
            
            // Reseteamos la transición después de un tiempo
            setTimeout(() => {
                // Restaura los clics
                if (signUpBtn) signUpBtn.style.pointerEvents = 'auto';
                signInBtn.style.pointerEvents = 'auto';
                
                if (waveBubble) {
                    // Reset de la transformación
                    waveBubble.style.transform = 'translate(0, 0) scale(1)';
                    waveBubble.style.opacity = '1';
                    
                    waveBubble.style.transition = "1.8s cubic-bezier(0.65, 0.05, 0.36, 1)";
                }
                // Quitamos la clase animating después de la transición
                container.classList.remove("animating");
            }, 2000);
        });
    }

    if (signInBtnPanel) {
        signInBtnPanel.addEventListener("click", () => {
            // Desactiva temporalmente los clics
            if (signUpBtn) signUpBtn.style.pointerEvents = 'none';
            if (signInBtn) signInBtn.style.pointerEvents = 'none';
            signInBtnPanel.style.pointerEvents = 'none';

            // Añadimos clase animating para mejorar la transición
            container.classList.add("animating");
            container.classList.remove("sign-up-mode");
            
            // Añadimos una transición más suave para la burbuja
            const waveBubble = document.querySelector(".wave-bubble");
            if (waveBubble) {
                waveBubble.style.transition = "all 1.8s cubic-bezier(0.645, 0.045, 0.355, 1.000)";
                
                // Animación más suave y controlada
                waveBubble.style.transform = 'translate(-100%, -10%) scale(1.2)';
                waveBubble.style.opacity = '0.9';
                
                // Efecto extra durante la transición
                setTimeout(() => {
                    waveBubble.style.filter = "brightness(1.03)";
                    setTimeout(() => {
                        waveBubble.style.filter = "none";
                    }, 600);
                }, 300);
            }
            
            // Reseteamos la transición después de un tiempo
            setTimeout(() => {
                // Restaura los clics
                if (signUpBtn) signUpBtn.style.pointerEvents = 'auto';
                if (signInBtn) signInBtn.style.pointerEvents = 'auto';
                signInBtnPanel.style.pointerEvents = 'auto';
                
                if (waveBubble) {
                    // Reset de la transformación
                    waveBubble.style.transform = 'translate(0, 0) scale(1)';
                    waveBubble.style.opacity = '1';
                    
                    waveBubble.style.transition = "1.8s cubic-bezier(0.65, 0.05, 0.36, 1)";
                }
                // Quitamos la clase animating después de la transición
                container.classList.remove("animating");
            }, 2000);
        });
    }

    // Animación al enfocar los campos
    inputFields.forEach(input => {
        input.addEventListener("focus", () => {
            const parent = input.parentElement;
            parent.classList.add("animate-focus");
            
            // Eliminar la animación después de que termine
            setTimeout(() => {
                parent.classList.remove("animate-focus");
            }, 400);
        });
    });

    // Mostrar/ocultar contraseña
    passwordToggles.forEach(toggle => {
        if (toggle.id.includes("password")) {
            toggle.addEventListener("click", () => {
                let inputId;
                
                if (toggle.id === 'toggle-login-password') {
                    inputId = 'password-login';
                } else if (toggle.id === 'toggle-password-login') {
                    inputId = 'password-login';
                } else {
                    // Extraer el id del input del id del toggle
                    inputId = toggle.id.replace("toggle-", "");
                }
                
                const input = document.getElementById(inputId);
                const icon = toggle.querySelector("i");
                
                if (input && input.type === "password") {
                    input.type = "text";
                    icon.classList.remove("fa-eye");
                    icon.classList.add("fa-eye-slash");
                } else if (input) {
                    input.type = "password";
                    icon.classList.remove("fa-eye-slash");
                    icon.classList.add("fa-eye");
                }
            });
        } else {
            // Para campos que no son contraseña, el icono es para limpiar el campo
            toggle.addEventListener("click", () => {
                let inputId;
                
                if (toggle.id === 'toggle-login-username') {
                    inputId = 'email-login';
                } else {
                    // Extraer el id del input del id del toggle
                    inputId = toggle.id.replace("toggle-", "").replace("-username", "");
                }
                
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = "";
                    input.focus();
                }
            });
        }
    });

    // Configurar validación del formulario
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            let isValid = true;
            
            // Validación del email/usuario
            const emailLogin = document.getElementById("email-login");
            const emailLoginError = document.getElementById("email-login-error");
            
            if (emailLogin && emailLogin.value.trim() === "") {
                showError(emailLogin, emailLoginError, "Por favor, introduce tu usuario o correo electrónico");
                isValid = false;
            } else if (emailLogin && emailLoginError) {
                hideError(emailLogin, emailLoginError);
            }
            
            // Validación de la contraseña
            const passwordLogin = document.getElementById("password-login");
            const passwordLoginError = document.getElementById("password-login-error");
            
            if (passwordLogin && passwordLogin.value.trim() === "") {
                showError(passwordLogin, passwordLoginError, "Por favor, introduce tu contraseña");
                isValid = false;
            } else if (passwordLogin && passwordLoginError) {
                hideError(passwordLogin, passwordLoginError);
            }
            
            // Si el formulario es válido, hacemos login con Firebase
            if (isValid && emailLogin && passwordLogin) {
                loginWithFirebase(emailLogin.value, passwordLogin.value);
            }
        });
    }

    // Validación en tiempo real
    inputFields.forEach(input => {
        input.addEventListener("input", () => {
            validateInput(input);
        });
        
        input.addEventListener("blur", () => {
            validateInput(input);
        });
    });

    // Efecto de onda al hacer clic en los botones
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach(button => {
        button.addEventListener("click", function(e) {
            // Solo aplicamos el efecto a los botones transparentes o de tipo submit
            if (this.type !== "submit" && !this.classList.contains("transparent")) return;
            
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            const ripple = document.createElement("span");
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            ripple.classList.add("ripple");
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Opcional: Mantener el estado del formulario en localStorage
    const savedState = localStorage.getItem("formState");
    if (savedState === "signup") {
        container.classList.add("sign-up-mode");
    }
    
    // Verificar si viene con un hash en la URL
    if (window.location.hash === '#registro') {
        container.classList.add("sign-up-mode");
    }

    // Guardar el estado del formulario al cambiar
    if (signUpBtn) {
        signUpBtn.addEventListener("click", () => {
            localStorage.setItem("formState", "signup");
        });
    }

    if (signInBtn) {
        signInBtn.addEventListener("click", () => {
            localStorage.setItem("formState", "signin");
        });
    }

    // Cargar y configurar el carrusel
    initCarousel();
});

// Cargar Firebase con manejo de errores
function loadFirebase() {
    // Si Firebase ya está definido, inicializar directamente
    if (typeof firebase !== 'undefined') {
        initializeFirebase();
        return;
    }

    // Cargar scripts de Firebase
    const scripts = [
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js'
    ];

    let scriptsLoaded = 0;
    
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        script.onload = () => {
            scriptsLoaded++;
            if (scriptsLoaded === scripts.length) {
                initializeFirebase();
            }
        };
        
        script.onerror = (error) => {
            console.error(`Error al cargar el script ${src}:`, error);
            alert('Error al cargar Firebase. Por favor, recarga la página o verifica tu conexión a internet.');
        };
        
        document.head.appendChild(script);
    });
}

// Inicializar Firebase
function initializeFirebase() {
    try {
        // Configuración de Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyD_C3sJCghWpV1DHn4Qyxsa-exdcEJGst0",
            authDomain: "seguridad-24-7.firebaseapp.com",
            projectId: "seguridad-24-7",
            storageBucket: "seguridad-24-7.firebasestorage.app",
            messagingSenderId: "979899411271",
            appId: "1:979899411271:web:4d8db498a9388054a7fa62",
            measurementId: "G-XQG0KDMMX4"
        };

        // Inicializar Firebase (evitar inicialización múltiple)
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Verificar si hay un usuario ya autenticado
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log("Usuario autenticado:", user.email);
                // No redirigir automáticamente aquí, lo haremos en el login
            } else {
                console.log("No hay usuario autenticado");
            }
        });

        console.log("Firebase inicializado correctamente");
    } catch (error) {
        console.error("Error al inicializar Firebase:", error);
    }
}

// Iniciar sesión con Firebase
function loginWithFirebase(email, password) {
    // Verificar que Firebase esté disponible
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert('Error: Firebase no está disponible. Por favor, recarga la página.');
        return;
    }

    // Mostrar el loader y deshabilitar el botón
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.classList.add("loading");
        loginButton.disabled = true;
    }
    
    // Autenticar con Firebase
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            // Éxito al autenticar, obtener rol
            const user = userCredential.user;
            
            // Animación de éxito
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.classList.add("success-animation");
            }
            
            // Efecto adicional en la burbuja ondulante
            const waveBubble = document.querySelector(".wave-bubble");
            if (waveBubble) {
                waveBubble.style.filter = "hue-rotate(30deg) brightness(1.05)";
                
                setTimeout(() => {
                    waveBubble.style.filter = "none";
                }, 800);
            }
            
            // Verificar rol y redirigir
           // Verificar rol y redirigir
firebase.firestore().collection('users').doc(user.uid).get()
.then(function(doc) {
    if (doc.exists) {
        const userData = doc.data();
        console.log("Datos del usuario:", userData);
        console.log("Rol del usuario:", userData.role);
        
        // Comprobación simplificada pero efectiva
        if (userData.role === "admin") {
            console.log("Rol admin detectado, redirigiendo a administrador");
            // Usar tiempo de espera para asegurar que los logs se muestren
            setTimeout(() => {
                window.location.href = "dashboardAdmin.html";
            }, 100);
        } else {
            console.log("Rol no es admin, redirigiendo a usuario");
            setTimeout(() => {
                window.location.href = "dashboardUsuario.html";
            }, 100);
        }
    } else {
        console.log("Documento no existe, redirigiendo a usuario");
        window.location.href = "dashboardAdmin.html";
    }
})
                .catch(function(error) {
                    // Error al obtener rol
                    console.error("Error al verificar rol:", error);
                    showLoginError("Error al verificar tu rol. Por favor, inténtalo de nuevo.");
                    
                    // Restablecer botón de login
                    if (loginButton) {
                        loginButton.classList.remove("loading");
                        loginButton.disabled = false;
                    }
                });
        })
        .catch(function(error) {
            // Error de autenticación
            console.error("Error de autenticación:", error);
            
            // Ocultamos el loader y habilitamos el botón
            if (loginButton) {
                loginButton.classList.remove("loading");
                loginButton.disabled = false;
            }
            
            // Mostrar mensaje de error según el código
            switch(error.code) {
                case 'auth/user-not-found':
                    showLoginError("No existe una cuenta con este correo electrónico");
                    break;
                case 'auth/wrong-password':
                    showLoginError("Contraseña incorrecta");
                    break;
                case 'auth/invalid-email':
                    showLoginError("Formato de correo electrónico inválido");
                    break;
                default:
                    showLoginError("Error al iniciar sesión: " + error.message);
            }
        });
}

// Mostrar error en el formulario de login
function showLoginError(message) {
    const emailLoginError = document.getElementById("email-login-error");
    if (emailLoginError) {
        emailLoginError.textContent = message;
        emailLoginError.classList.add("active");
    }
}

// Función para mostrar errores
function showError(input, errorElement, message) {
    if (!input || !errorElement) return;
    
    input.parentElement.classList.add("error");
    errorElement.textContent = message;
    errorElement.classList.add("active");
}

// Función para ocultar errores
function hideError(input, errorElement) {
    if (!input || !errorElement) return;
    
    input.parentElement.classList.remove("error");
    errorElement.textContent = "";
    errorElement.classList.remove("active");
}

// Validación de inputs
function validateInput(input) {
    if (!input) return;
    
    const id = input.id;
    let errorElement;
    let isValid = true;
    let errorMessage = "";
    
    // Encontrar el elemento de error correspondiente
    switch(id) {
        case "email-login":
            errorElement = document.getElementById("email-login-error");
            if (input.value.trim() === "") {
                isValid = false;
                errorMessage = "Por favor, introduce tu usuario o correo";
            }
            break;
            
        case "password-login":
            errorElement = document.getElementById("password-login-error");
            if (input.value.trim() === "") {
                isValid = false;
                errorMessage = "Por favor, introduce tu contraseña";
            }
            break;
    }
    
    // Mostrar u ocultar el error según corresponda
    if (!isValid && errorElement) {
        showError(input, errorElement, errorMessage);
    } else if (errorElement) {
        hideError(input, errorElement);
    }
}

// Inicializar carrusel
function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    
    if (!slides.length || !indicators.length) return;
    
    let currentSlide = 0;
    const slideInterval = 5000; // Tiempo entre slides: 5 segundos
    
    // Función para cambiar al slide específico
    function goToSlide(slideIndex) {
        // Quitar la clase active de todos los slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Quitar la clase active de todos los indicadores
        indicators.forEach(indicator => {
            indicator.classList.remove('active');
        });
        
        // Activar el slide e indicador actual
        slides[slideIndex].classList.add('active');
        indicators[slideIndex].classList.add('active');
        
        // Actualizar el índice del slide actual
        currentSlide = slideIndex;
    }
    
    // Función para avanzar al siguiente slide
    function nextSlide() {
        let nextIndex = currentSlide + 1;
        if (nextIndex >= slides.length) {
            nextIndex = 0;
        }
        goToSlide(nextIndex);
    }
    
    // Configurar click en los indicadores
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToSlide(index);
            resetInterval(); // Reiniciar el intervalo al hacer clic
        });
    });
    
    // Iniciar carrusel automático
    let slideTimer = setInterval(nextSlide, slideInterval);
    
    // Reiniciar el intervalo para evitar cambios bruscos
    function resetInterval() {
        clearInterval(slideTimer);
        slideTimer = setInterval(nextSlide, slideInterval);
    }
    
    // Detener la rotación al pasar el mouse por encima
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            clearInterval(slideTimer);
        });
        
        // Reanudar la rotación al quitar el mouse
        carouselContainer.addEventListener('mouseleave', () => {
            slideTimer = setInterval(nextSlide, slideInterval);
        });
    }
    
    // Iniciar con el primer slide
    goToSlide(0);
    
    // Opcional: Agregar swipe para móviles
    let touchStartX = 0;
    let touchEndX = 0;
    
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    
    if (carouselWrapper) {
        carouselWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        carouselWrapper.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }
    
    function handleSwipe() {
        const swipeThreshold = 50; // Mínima distancia para considerar un swipe
        
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe a la izquierda - próximo slide
            nextSlide();
            resetInterval();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe a la derecha - slide anterior
            let prevIndex = currentSlide - 1;
            if (prevIndex < 0) {
                prevIndex = slides.length - 1;
            }
            goToSlide(prevIndex);
            resetInterval();
        }
    }
}