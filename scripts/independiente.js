// Archivo firebase-independiente.js para el frontend

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

// Inicializar Firebase si no está ya inicializado
if (typeof firebase !== 'undefined' && (!firebase.apps || !firebase.apps.length)) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase inicializado correctamente');
} else {
    console.log('Firebase ya está inicializado o no está disponible');
}

// Exportar referencias a servicios de Firebase para usar en otros scripts
try {
    if (typeof firebase !== 'undefined') {
        // Obtener referencias a los servicios
        const db = firebase.firestore();
        const storage = firebase.storage();
        
        // Configuraciones adicionales
        db.settings({
            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
        });
        
        // Habilitar persistencia para funcionamiento offline
        db.enablePersistence({ synchronizeTabs: true })
            .then(() => {
                console.log('Persistencia de Firestore habilitada');
            })
            .catch(err => {
                if (err.code === 'failed-precondition') {
                    console.warn('La persistencia de Firestore falló: múltiples pestañas abiertas');
                } else if (err.code === 'unimplemented') {
                    console.warn('El navegador no soporta persistencia de Firestore');
                }
            });
            
        console.log('Servicios de Firebase configurados correctamente');
    }
} catch (error) {
    console.error('Error al configurar servicios de Firebase:', error);
}