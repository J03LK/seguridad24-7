// userFirebase.js
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase.js";

// Escuchar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Firebase User Module inicializado');
    
    // Obtener el formulario de usuario
    const userForm = document.getElementById('add-user-form');
    
    if (userForm) {
        // Guardar referencia al event listener original
        const originalSubmitHandler = userForm.onsubmit;
        
        // Establecer nuevo handler
        userForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                console.log("Procesando formulario de usuario con Firebase");
                
                // Obtener datos del formulario
                const email = document.getElementById('user-email').value;
                const password = document.getElementById('user-password').value;
                const name = document.getElementById('user-name').value;
                const phone = document.getElementById('user-phone').value;
                const address = document.getElementById('user-address').value;
                const type = document.getElementById('user-type').value;
                const role = document.getElementById('user-role').value;
                
                if (!email || !password || !name || !role) {
                    alert("Por favor complete todos los campos obligatorios");
                    return;
                }
                
                // Crear usuario en Firebase
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Guardar datos en Firestore
                await setDoc(doc(db, "users", user.uid), {
                    email: email,
                    name: name,
                    role: role,
                    phone: phone || "",
                    address: address || "",
                    type: type || "",
                    status: "active",
                    createdAt: new Date()
                });
                
                alert(`Usuario ${name} creado con éxito como ${role}`);
                
                // Cerrar modal
                const modal = userForm.closest('.modal');
                if (modal) modal.style.display = 'none';
                
                // Limpiar formulario
                userForm.reset();
                
            } catch (error) {
                console.error("Error al crear usuario:", error);
                alert(`Error al crear usuario: ${error.message}`);
            }
        });
    }
});