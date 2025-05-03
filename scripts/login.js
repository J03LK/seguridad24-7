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
    const loader = loginButton.querySelector('.loader');
    const emailInput = document.getElementById('email-login');
    const passwordInput = document.getElementById('password-login');
    const emailError = document.getElementById('email-login-error');
    const passwordError = document.getElementById('password-login-error');
    
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

    // Inicializar Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // Verificar si el usuario ya está autenticado
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Usuario autenticado, verificar rol
            checkUserRole(user);
        }
    });

    // ==================== ANIMACIONES ====================
    
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

    // ==================== AUTENTICACIÓN MEJORADA ====================
    
    // Manejar envío del formulario de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Limpiar mensajes de error previos
        clearErrors();
        
        // Obtener valores
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validar campos
        if (!email) {
            showError('email-login-error', 'El correo electrónico es requerido');
            return;
        }
        
        if (!password) {
            showError('password-login-error', 'La contraseña es requerida');
            return;
        }
        
        // Mostrar loader
        showLoader();
        
        try {
            // Intentar iniciar sesión
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Animación de éxito
            loginForm.classList.add("success-animation");
            
            // Efecto adicional en la burbuja ondulante
            const waveBubble = document.querySelector(".wave-bubble");
            if (waveBubble) {
                waveBubble.style.filter = "hue-rotate(30deg) brightness(1.05)";
                
                setTimeout(() => {
                    waveBubble.style.filter = "none";
                }, 800);
            }
            
            // Verificar rol del usuario
            await checkUserRole(user);
            
        } catch (error) {
            hideLoader();
            handleAuthError(error);
        }
    });

    // Verificar el rol del usuario
    async function checkUserRole(user) {
        try {
            // Obtener datos del usuario desde Firestore
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            
            if (!userDoc.exists) {
                throw new Error('No se encontró información del usuario');
            }
            
            const userData = userDoc.data();
            const userRole = userData.role || 'user';
            
            // Solo permitir acceso a administradores
            if (userRole === 'admin') {
                // Guardar información del usuario en localStorage para usar en el dashboard
                localStorage.setItem('adminUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: userData.name || user.email.split('@')[0],
                    photoURL: userData.photoURL || null,
                    role: userRole
                }));
                
                // Redirigir al dashboard administrativo
                window.location.href = 'dashboardAdmin.html';
            } else {
                // Si no es administrador, cerrar sesión y mostrar error
                await auth.signOut();
                hideLoader();
                showError('password-login-error', 'Acceso denegado. Solo los administradores pueden ingresar a este panel.');
            }
            
        } catch (error) {
            console.error('Error verificando rol:', error);
            hideLoader();
            showError('password-login-error', 'Error al verificar permisos de usuario');
            await auth.signOut();
        }
    }

    // Manejar errores de autenticación
    function handleAuthError(error) {
        console.error('Error de autenticación:', error);
        
        switch (error.code) {
            case 'auth/invalid-email':
                showError('email-login-error', 'El correo electrónico no es válido');
                break;
            case 'auth/user-disabled':
                showError('email-login-error', 'Esta cuenta ha sido deshabilitada');
                break;
            case 'auth/user-not-found':
                showError('email-login-error', 'No existe una cuenta con este correo electrónico');
                break;
            case 'auth/wrong-password':
                showError('password-login-error', 'La contraseña es incorrecta');
                break;
            case 'auth/too-many-requests':
                showError('password-login-error', 'Demasiados intentos fallidos. Por favor, intenta más tarde');
                break;
            default:
                showError('password-login-error', 'Error al iniciar sesión. Por favor, intenta nuevamente');
        }
    }

    // Mostrar error en el campo correspondiente
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.classList.add("active");
        }
    }

    // Limpiar mensajes de error
    function clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
            element.classList.remove("active");
        });
    }

    // Mostrar loader
    function showLoader() {
        loginButton.disabled = true;
        loginButton.classList.add("loading");
        if (loader) {
            loader.style.display = 'inline-block';
        }
    }

    // Ocultar loader
    function hideLoader() {
        loginButton.disabled = false;
        loginButton.classList.remove("loading");
        if (loader) {
            loader.style.display = 'none';
        }
    }

    // Manejar el botón de "Olvidaste tu contraseña"
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            
            if (!email) {
                showError('email-login-error', 'Por favor ingresa tu correo electrónico para restablecer la contraseña');
                return;
            }
            
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    alert('Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico');
                })
                .catch((error) => {
                    console.error('Error al enviar correo de restablecimiento:', error);
                    showError('email-login-error', 'Error al enviar el correo de restablecimiento. Verifica que el correo sea correcto.');
                });
        });
    }

    // ==================== OTROS ELEMENTOS UI ====================
    
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

    // Mantener el estado del formulario en localStorage
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