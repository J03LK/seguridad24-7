// Elementos del DOM
const signInBtn = document.querySelector("#sign-in-btn");
const signUpBtn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".login-container");
const loginForm = document.querySelector("#loginForm");
const registroForm = document.querySelector("#registroForm");
const passwordToggles = document.querySelectorAll(".password-toggle");
const inputFields = document.querySelectorAll(".input-field input");
const loginButton = document.querySelector("#login-button");
const registroButton = document.querySelector("#registro-button");

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


   
    
    // Efecto extra durante la transición
    setTimeout(() => {
        waveBubble.style.filter = "brightness(1.03)";
        setTimeout(() => {
            waveBubble.style.filter = "none";
        }, 600);
    }, 300);
    
    // Reseteamos la transición después de un tiempo
    setTimeout(() => {
        waveBubble.style.transition = "1.8s cubic-bezier(0.65, 0.05, 0.36, 1)";
        // Quitamos la clase animating después de la transición
        container.classList.remove("animating");
    }, 2000);


signInBtn.addEventListener("click", () => {
    // Añadimos clase animating para mejorar la transición
    container.classList.add("animating");
    container.classList.remove("sign-up-mode");
    
    // Añadimos una transición más suave para la burbuja
    const waveBubble = document.querySelector(".wave-bubble");
    waveBubble.style.transition = "all 1.8s cubic-bezier(0.645, 0.045, 0.355, 1.000)";
    
    // Efecto extra durante la transición
    setTimeout(() => {
        waveBubble.style.filter = "brightness(1.03)";
        setTimeout(() => {
            waveBubble.style.filter = "none";
        }, 600);
    }, 300);
    
    // Reseteamos la transición después de un tiempo
    setTimeout(() => {
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

// Validación del formulario de inicio de sesión
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
    
    // Si el formulario es válido, simulamos el inicio de sesión
    if (isValid) {
        simulateLogin();
    }
});

// Validación del formulario de registro
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
    
    // Si el formulario es válido, simulamos el registro
    if (isValid) {
        simulateRegistro();
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

// Simulación de inicio de sesión con animación mejorada
function simulateLogin() {
    // Mostrar el loader y deshabilitar el botón
    loginButton.classList.add("loading");
    loginButton.disabled = true;
    
    // Simulamos una petición al servidor
    setTimeout(() => {
        // Ocultamos el loader y habilitamos el botón
        loginButton.classList.remove("loading");
        loginButton.disabled = false;
        
        // Agregamos la animación de éxito
        loginForm.classList.add("success-animation");
        
        // Efecto adicional en la burbuja ondulante
        const waveBubble = document.querySelector(".wave-bubble");
        waveBubble.style.filter = "hue-rotate(30deg) brightness(1.05)";
        
        setTimeout(() => {
            waveBubble.style.filter = "none";
        }, 800);
        
        // Mensaje de éxito (aquí podrías redirigir al usuario)
        alert("Inicio de sesión exitoso");
        
        // Eliminar la animación después de que termine
        setTimeout(() => {
            loginForm.classList.remove("success-animation");
        }, 600);
    }, 1500);
}

// Simulación de registro con animación mejorada
function simulateRegistro() {
    // Mostrar el loader y deshabilitar el botón
    registroButton.classList.add("loading");
    registroButton.disabled = true;
    
    // Simulamos una petición al servidor
    setTimeout(() => {
        // Ocultamos el loader y habilitamos el botón
        registroButton.classList.remove("loading");
        registroButton.disabled = false;
        
        // Agregamos la animación de éxito
        registroForm.classList.add("success-animation");
        
        // Efecto adicional en la burbuja ondulante
        const waveBubble = document.querySelector(".wave-bubble");
        waveBubble.style.filter = "hue-rotate(-30deg) brightness(1.05)";
        
        setTimeout(() => {
            waveBubble.style.filter = "none";
        }, 800);
        
        // Mensaje de éxito (aquí podrías redirigir al usuario)
        alert("Registro exitoso");
        
        // Eliminar la animación después de que termine
        setTimeout(() => {
            registroForm.classList.remove("success-animation");
            
            // Opcional: Cambiar al formulario de inicio de sesión después del registro exitoso
            container.classList.remove("sign-up-mode");
        }, 600);
    }, 1500);
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