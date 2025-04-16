// Elementos del DOM
const signInBtn = document.querySelector("#sign-in-btn");
const signInBtnPanel = document.querySelector("#sign-in-btn-panel");
const signUpBtn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".login-container");
const loginForm = document.querySelector("#loginForm");
const registroForm = document.querySelector("#registroForm");
const passwordToggles = document.querySelectorAll(".password-toggle");
const inputFields = document.querySelectorAll(".input-field input");
const loginButton = document.querySelector("#login-button");
const registroButton = document.querySelector("#registro-button");

// Inicializar Firebase
document.addEventListener('DOMContentLoaded', function() {
    // Cargar Firebase desde CDN si no está ya disponible
    if (typeof firebase === 'undefined') {
        loadFirebaseScripts();
    } else {
        initializeFirebase();
    }
});

// Cargar scripts de Firebase dinámicamente
function loadFirebaseScripts() {
    const firebaseScript = document.createElement('script');
    firebaseScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    document.head.appendChild(firebaseScript);

    firebaseScript.onload = function() {
        const authScript = document.createElement('script');
        authScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js';
        document.head.appendChild(authScript);

        const firestoreScript = document.createElement('script');
        firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js';
        document.head.appendChild(firestoreScript);

        firestoreScript.onload = initializeFirebase;
    };
}

// Inicializar Firebase
function initializeFirebase() {
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
    firebase.initializeApp(firebaseConfig);

    // Verificar si hay un usuario ya autenticado
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("Usuario autenticado:", user.email);
            // No redirigir automáticamente aquí
        } else {
            console.log("No hay usuario autenticado");
        }
    });

    // Configurar los manejadores de formularios para Firebase
    setupFormHandlers();
}

// Configurar manejadores de formularios con Firebase
function setupFormHandlers() {
    // Validación del formulario de inicio de sesión con Firebase
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        let isValid = true;
        
        // Validación del email/usuario
        const emailLogin = document.getElementById("email-login");
        const emailLoginError = document.getElementById("email-login-error");
        
        if (emailLogin.value.trim() === "") {
            showError(emailLogin, emailLoginError, "Por favor, introduce tu usuario o correo electrónico");
            isValid = false;
        } else {
            hideError(emailLogin, emailLoginError);
        }
        
        // Validación de la contraseña
        const passwordLogin = document.getElementById("password-login");
        const passwordLoginError = document.getElementById("password-login-error");
        
        if (passwordLogin.value.trim() === "") {
            showError(passwordLogin, passwordLoginError, "Por favor, introduce tu contraseña");
            isValid = false;
        } else {
            hideError(passwordLogin, passwordLoginError);
        }
        
        // Si el formulario es válido, hacemos login con Firebase
        if (isValid) {
            loginWithFirebase(emailLogin.value, passwordLogin.value);
        }
    });

    // Validación del formulario de registro con Firebase
    registroForm.addEventListener("submit", (e) => {
        e.preventDefault();
        let isValid = true;
        
        // Validación del nombre
        const nombre = document.getElementById("nombre");
        const nombreError = document.getElementById("nombre-error");
        
        if (nombre.value.trim() === "") {
            showError(nombre, nombreError, "Por favor, introduce tu nombre");
            isValid = false;
        } else {
            hideError(nombre, nombreError);
        }
        
        // Validación del apellido
        const apellido = document.getElementById("apellido");
        const apellidoError = document.getElementById("apellido-error");
        
        if (apellido.value.trim() === "") {
            showError(apellido, apellidoError, "Por favor, introduce tu apellido");
            isValid = false;
        } else {
            hideError(apellido, apellidoError);
        }
        
        // Validación del nombre de usuario
        const username = document.getElementById("username");
        const usernameError = document.getElementById("username-error");
        
        if (username.value.trim() === "") {
            showError(username, usernameError, "Por favor, introduce un nombre de usuario");
            isValid = false;
        } else if (username.value.trim().length < 5) {
            showError(username, usernameError, "El nombre de usuario debe tener al menos 5 caracteres");
            isValid = false;
        } else {
            hideError(username, usernameError);
        }
        
        // Validación del email
        const email = document.getElementById("email-registro");
        const emailError = document.getElementById("email-error");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email.value.trim() === "") {
            showError(email, emailError, "Por favor, introduce tu correo electrónico");
            isValid = false;
        } else if (!emailRegex.test(email.value.trim())) {
            showError(email, emailError, "Por favor, introduce un correo electrónico válido");
            isValid = false;
        } else {
            hideError(email, emailError);
        }
        
        // Validación de la contraseña
        const password = document.getElementById("password-registro");
        const passwordError = document.getElementById("password-error");
        
        if (password.value.trim() === "") {
            showError(password, passwordError, "Por favor, introduce una contraseña");
            isValid = false;
        } else if (password.value.trim().length < 8) {
            showError(password, passwordError, "La contraseña debe tener al menos 8 caracteres");
            isValid = false;
        } else {
            hideError(password, passwordError);
        }
        
        // Si el formulario es válido, registramos con Firebase
        if (isValid) {
            registerWithFirebase(nombre.value, apellido.value, username.value, email.value, password.value);
        }
    });
}

// Iniciar sesión con Firebase
function loginWithFirebase(email, password) {
    // Mostrar el loader y deshabilitar el botón
    loginButton.classList.add("loading");
    loginButton.disabled = true;
    
    // Autenticar con Firebase
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            // Éxito al autenticar, obtener rol
            const user = userCredential.user;
            
            // Agregamos la animación de éxito
            loginForm.classList.add("success-animation");
            
            // Efecto adicional en la burbuja ondulante
            const waveBubble = document.querySelector(".wave-bubble");
            waveBubble.style.filter = "hue-rotate(30deg) brightness(1.05)";
            
            setTimeout(() => {
                waveBubble.style.filter = "none";
            }, 800);
            
            // Verificar rol y redirigir
            firebase.firestore().collection('users').doc(user.uid).get()
                .then(function(doc) {
                    if (doc.exists) {
                        const userData = doc.data();
                        if (userData.role === 'admin') {
                            window.location.href = "dashboardAdmin.html";
                        } else {
                            window.location.href = "usuario.html";
                        }
                    } else {
                        // Si no hay datos adicionales, asumir rol de usuario
                        window.location.href = "usuario.html";
                    }
                })
                .catch(function(error) {
                    // Error al obtener rol
                    console.error("Error al verificar rol:", error);
                    showLoginError("Error al verificar tu rol. Por favor, inténtalo de nuevo.");
                });
        })
        .catch(function(error) {
            // Error de autenticación
            console.error("Error de autenticación:", error);
            
            // Ocultamos el loader y habilitamos el botón
            loginButton.classList.remove("loading");
            loginButton.disabled = false;
            
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

// Registrar usuario con Firebase
function registerWithFirebase(nombre, apellido, username, email, password) {
    // Mostrar el loader y deshabilitar el botón
    registroButton.classList.add("loading");
    registroButton.disabled = true;
    
    // Verificar si el nombre de usuario ya existe
    firebase.firestore().collection('users').where('username', '==', username).get()
        .then(function(querySnapshot) {
            if (!querySnapshot.empty) {
                throw { code: 'username-exists', message: 'Este nombre de usuario ya está en uso' };
            }
            
            // Crear usuario en Firebase Authentication
            return firebase.auth().createUserWithEmailAndPassword(email, password);
        })
        .then(function(userCredential) {
            // Éxito al crear usuario
            const user = userCredential.user;
            
            // Guardar datos adicionales en Firestore
            return firebase.firestore().collection('users').doc(user.uid).set({
                name: nombre + ' ' + apellido,
                username: username,
                email: email,
                role: 'usuario', // Por defecto, asignar rol de usuario
                createdAt: new Date(),
                status: 'active'
            });
        })
        .then(function() {
            // Agregamos la animación de éxito
            registroForm.classList.add("success-animation");
            
            // Efecto adicional en la burbuja ondulante
            const waveBubble = document.querySelector(".wave-bubble");
            waveBubble.style.filter = "hue-rotate(-30deg) brightness(1.05)";
            
            setTimeout(() => {
                waveBubble.style.filter = "none";
            }, 800);
            
            // Redirigir a la vista de usuario
            setTimeout(() => {
                window.location.href = "usuario.html";
            }, 1000);
        })
        .catch(function(error) {
            // Ocultamos el loader y habilitamos el botón
            registroButton.classList.remove("loading");
            registroButton.disabled = false;
            
            console.error("Error en el registro:", error);
            
            // Mostrar mensaje de error según el código
            if (error.code === 'username-exists') {
                showRegistroError(document.getElementById("username-error"), error.message);
            } else {
                switch(error.code) {
                    case 'auth/email-already-in-use':
                        showRegistroError(document.getElementById("email-error"), "Este correo electrónico ya está registrado");
                        break;
                    case 'auth/invalid-email':
                        showRegistroError(document.getElementById("email-error"), "Formato de correo electrónico inválido");
                        break;
                    case 'auth/weak-password':
                        showRegistroError(document.getElementById("password-error"), "La contraseña es demasiado débil");
                        break;
                    default:
                        showRegistroError(document.getElementById("email-error"), "Error al registrar: " + error.message);
                }
            }
        });
}

// Mostrar error en el formulario de login
function showLoginError(message) {
    const emailLoginError = document.getElementById("email-login-error");
    emailLoginError.textContent = message;
    emailLoginError.classList.add("active");
}

// Mostrar error en el formulario de registro
function showRegistroError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add("active");
}

// Cambio entre formularios con animación suave
signUpBtn.addEventListener("click", () => {
    // Desactiva temporalmente los clics
    signUpBtn.style.pointerEvents = 'none';
    signInBtn.style.pointerEvents = 'none';

    // Añadimos clase animating para mejorar la transición
    container.classList.add("animating");
    container.classList.add("sign-up-mode");
    
    // Añadimos una transición más suave para la burbuja
    const waveBubble = document.querySelector(".wave-bubble");
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
    
    // Reseteamos la transición después de un tiempo
    setTimeout(() => {
        // Restaura los clics
        signUpBtn.style.pointerEvents = 'auto';
        signInBtn.style.pointerEvents = 'auto';
        
        // Reset de la transformación
        waveBubble.style.transform = 'translate(0, 0) scale(1)';
        waveBubble.style.opacity = '1';
        
        waveBubble.style.transition = "1.8s cubic-bezier(0.65, 0.05, 0.36, 1)";
        // Quitamos la clase animating después de la transición
        container.classList.remove("animating");
    }, 2000);
});

signInBtn.addEventListener("click", () => {
    // Desactiva temporalmente los clics
    signUpBtn.style.pointerEvents = 'none';
    signInBtn.style.pointerEvents = 'none';

    // Añadimos clase animating para mejorar la transición
    container.classList.add("animating");
    container.classList.remove("sign-up-mode");
    
    // Añadimos una transición más suave para la burbuja
    const waveBubble = document.querySelector(".wave-bubble");
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
    
    // Reseteamos la transición después de un tiempo
    setTimeout(() => {
        // Restaura los clics
        signUpBtn.style.pointerEvents = 'auto';
        signInBtn.style.pointerEvents = 'auto';
        
        // Reset de la transformación
        waveBubble.style.transform = 'translate(0, 0) scale(1)';
        waveBubble.style.opacity = '1';
        
        waveBubble.style.transition = "1.8s cubic-bezier(0.65, 0.05, 0.36, 1)";
        // Quitamos la clase animating después de la transición
        container.classList.remove("animating");
    }, 2000);
});

signInBtnPanel.addEventListener("click", () => {
    // Desactiva temporalmente los clics
    signUpBtn.style.pointerEvents = 'none';
    signInBtn.style.pointerEvents = 'none';
    signInBtnPanel.style.pointerEvents = 'none';

    // Añadimos clase animating para mejorar la transición
    container.classList.add("animating");
    container.classList.remove("sign-up-mode");
    
    // Añadimos una transición más suave para la burbuja
    const waveBubble = document.querySelector(".wave-bubble");
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
    
    // Reseteamos la transición después de un tiempo
    setTimeout(() => {
        // Restaura los clics
        signUpBtn.style.pointerEvents = 'auto';
        signInBtn.style.pointerEvents = 'auto';
        signInBtnPanel.style.pointerEvents = 'auto';
        
        // Reset de la transformación
        waveBubble.style.transform = 'translate(0, 0) scale(1)';
        waveBubble.style.opacity = '1';
        
        waveBubble.style.transition = "1.8s cubic-bezier(0.65, 0.05, 0.36, 1)";
        // Quitamos la clase animating después de la transición
        container.classList.remove("animating");
    }, 2000);
});

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
            const inputId = toggle.id.replace("toggle-", "");
            const input = document.getElementById(inputId);
            const icon = toggle.querySelector("i");
            
            if (input.type === "password") {
                input.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                input.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });
    } else {
        // Para campos que no son contraseña, el icono es para limpiar el campo
        toggle.addEventListener("click", () => {
            const inputId = toggle.id.replace("toggle-", "").replace("-username", "");
            const input = document.getElementById(inputId);
            input.value = "";
            input.focus();
        });
    }
});

// Función para mostrar errores
function showError(input, errorElement, message) {
    input.parentElement.classList.add("error");
    errorElement.textContent = message;
    errorElement.classList.add("active");
}

// Función para ocultar errores
function hideError(input, errorElement) {
    input.parentElement.classList.remove("error");
    errorElement.textContent = "";
    errorElement.classList.remove("active");
}

// Efecto de onda al hacer clic en los botones con mejora visual
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

// Mejora de accesibilidad: permitir el uso de la tecla Enter para cambiar entre formularios
document.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        const activeElement = document.activeElement;
        
        if (activeElement === signUpBtn) {
            container.classList.add("sign-up-mode");
        } else if (activeElement === signInBtn) {
            container.classList.remove("sign-up-mode");
        }
    }
});

// Opcional: Mantener el estado del formulario en localStorage
// para recordar si el usuario estaba en registro o inicio de sesión
window.addEventListener("load", () => {
    const savedState = localStorage.getItem("formState");
    
    if (savedState === "signup") {
        container.classList.add("sign-up-mode");
    }
    
    // Verificar si viene con un hash en la URL
    if (window.location.hash === '#registro') {
        container.classList.add("sign-up-mode");
    }
});

// Guardar el estado del formulario al cambiar
signUpBtn.addEventListener("click", () => {
    localStorage.setItem("formState", "signup");
});

signInBtn.addEventListener("click", () => {
    localStorage.setItem("formState", "signin");
});

// Validación en tiempo real
inputFields.forEach(input => {
    input.addEventListener("input", () => {
        validateInput(input);
    });
    
    input.addEventListener("blur", () => {
        validateInput(input);
    });
});

function validateInput(input) {
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
            
        case "nombre":
            errorElement = document.getElementById("nombre-error");
            if (input.value.trim() === "") {
                isValid = false;
                errorMessage = "Por favor, introduce tu nombre";
            }
            break;
            
        case "apellido":
            errorElement = document.getElementById("apellido-error");
            if (input.value.trim() === "") {
                isValid = false;
                errorMessage = "Por favor, introduce tu apellido";
            }
            break;
            
        case "username":
            errorElement = document.getElementById("username-error");
            if (input.value.trim() === "") {
                isValid = false;
                errorMessage = "Por favor, introduce un nombre de usuario";
            } else if (input.value.trim().length < 5) {
                isValid = false;
                errorMessage = "El usuario debe tener al menos 5 caracteres";
            }
            break;
            
        case "email-registro":
            errorElement = document.getElementById("email-error");
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (input.value.trim() === "") {
                isValid = false;
                errorMessage = "Por favor, introduce tu correo electrónico";
            } else if (!emailRegex.test(input.value.trim())) {
                isValid = false;
                errorMessage = "Introduce un correo electrónico válido";
            }
            break;
            
        case "password-registro":
            errorElement = document.getElementById("password-error");
            if (input.value.trim() === "") {
                isValid = false;
                errorMessage = "Por favor, introduce una contraseña";
            } else if (input.value.trim().length < 8) {
                isValid = false;
                errorMessage = "La contraseña debe tener al menos 8 caracteres";
            }
            break;
    }
    
    // Mostrar u ocultar el error según corresponda
    if (!isValid) {
        showError(input, errorElement, errorMessage);
    } else {
        hideError(input, errorElement);
    }
}

// Animación adicional para la burbuja ondulante
const waveBubble = document.querySelector(".wave-bubble");
let hueRotation = 0;

// Pequeña variación de color durante la animación
setInterval(() => {
    hueRotation = (hueRotation + 1) % 10;
    waveBubble.style.filter = `hue-rotate(${hueRotation}deg)`;
}, 1000);
// JavaScript para el carrusel
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
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
    carouselContainer.addEventListener('mouseenter', () => {
        clearInterval(slideTimer);
    });
    
    // Reanudar la rotación al quitar el mouse
    carouselContainer.addEventListener('mouseleave', () => {
        slideTimer = setInterval(nextSlide, slideInterval);
    });
    
    // Iniciar con el primer slide
    goToSlide(0);
    
    // Opcional: Agregar swipe para móviles
    let touchStartX = 0;
    let touchEndX = 0;
    
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    
    carouselWrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    carouselWrapper.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
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
});

// Mantener el código de transición en login.js
// Este código es para la transición entre la vista de login e información
// No necesitas modificar esta parte del código existente:

/*
const signUpButton = document.getElementById('sign-up-btn');
const signInButton = document.getElementById('sign-in-btn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
    container.classList.add('sign-up-mode');
});

signInButton.addEventListener('click', () => {
    container.classList.remove('sign-up-mode');
});
*/