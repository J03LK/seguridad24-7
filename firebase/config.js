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
  
  // Exportar servicios de Firebase para uso en otros archivos
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  
  // Configuraciones de Firestore
  db.settings({
    timestampsInSnapshots: true
  });