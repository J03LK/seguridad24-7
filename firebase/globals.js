// Este archivo define variables y funciones globales para toda la aplicación
// Importa el módulo de Firebase y define todas las funciones necesarias como globales

// Imports de Firebase
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, query, where, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Mapeo de nombres de colección
const collectionMap = {
  'usuarios': 'users',
  'productos': 'products',
  'ubicaciones': 'locations'
};

// Función para traducir el nombre de la colección
function translateCollection(collectionName) {
  return collectionMap[collectionName] || collectionName;
}

// =====================================================
// FUNCIONES GLOBALES
// =====================================================

// Función para mostrar alertas
function showAlert(message, type = 'info', duration = 3000) {
  // Verificar si ya existe un contenedor de alertas
  let alertContainer = document.getElementById('alert-container');
  
  if (!alertContainer) {
    // Crear el contenedor de alertas si no existe
    alertContainer = document.createElement('div');
    alertContainer.id = 'alert-container';
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '20px';
    alertContainer.style.right = '20px';
    alertContainer.style.zIndex = '9999';
    document.body.appendChild(alertContainer);
  }
  
  // Crear la alerta
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  
  // Determinar color e icono según el tipo
  let color, icon;
  switch (type) {
    case 'success':
      color = '#36b37e';
      icon = 'fa-check-circle';
      break;
    case 'error':
      color = '#f44336';
      icon = 'fa-exclamation-circle';
      break;
    case 'warning':
      color = '#ffab00';
      icon = 'fa-exclamation-triangle';
      break;
    case 'info':
    default:
      color = '#4a6cf7';
      icon = 'fa-info-circle';
      break;
  }
  
  // Contenido y estilos
  alert.innerHTML = `
    <div class="alert-content">
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    </div>
    <button class="close-alert">&times;</button>
  `;
  
  alert.style.backgroundColor = color;
  alert.style.color = '#fff';
  alert.style.padding = '12px 16px';
  alert.style.borderRadius = '8px';
  alert.style.marginBottom = '10px';
  alert.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
  alert.style.display = 'flex';
  alert.style.justifyContent = 'space-between';
  alert.style.alignItems = 'center';
  
  // Agregar la alerta al contenedor
  alertContainer.appendChild(alert);
  
  // Manejar el cierre de la alerta
  const closeBtn = alert.querySelector('.close-alert');
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#fff';
  closeBtn.style.fontSize = '20px';
  closeBtn.style.cursor = 'pointer';
  
  closeBtn.addEventListener('click', () => {
    alertContainer.removeChild(alert);
  });
  
  // Eliminar la alerta después del tiempo especificado
  setTimeout(() => {
    if (alertContainer.contains(alert)) {
      alertContainer.removeChild(alert);
    }
  }, duration);
}

// Función para verificar si un usuario está autenticado
function checkAuth() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, user => {
      if (user) {
        // Usuario autenticado
        resolve(user);
      } else {
        // Usuario no autenticado, redirigir al login
        window.location.href = 'login.html';
        reject('No autenticado');
      }
    });
  });
}

// Función para cerrar sesión
function logout() {
  signOut(auth)
    .then(() => {
      window.location.href = 'login.html';
    })
    .catch(error => {
      console.error('Error al cerrar sesión:', error);
      showAlert('Error al cerrar sesión', 'error');
    });
}

// Función para verificar si el usuario tiene rol de administrador
async function checkAdminRole(userId) {
  try {
    const userDocRef = doc(db, translateCollection('usuarios'), userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.rol === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Error al verificar rol de administrador:', error);
    return false;
  }
}

// Función para formatear fechas
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Función para formatear moneda
function formatCurrency(amount, short = false) {
  if (short && amount >= 1000) {
    return '$' + (amount / 1000).toFixed(1) + 'k';
  }
  
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Función para generar un ID único
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// =====================================================
// ASIGNAR VARIABLES Y FUNCIONES AL ÁMBITO GLOBAL
// =====================================================

// Guardar objetos de Firebase en window
window.app = app;
window.auth = auth;
window.db = db;
window.storage = storage;

// Guardar funciones de Firebase en window
window.getDoc = getDoc;
window.getDocs = getDocs;
window.collection = collection;
window.doc = doc;
window.addDoc = addDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.setDoc = setDoc;
window.query = query;
window.where = where;
window.orderBy = orderBy;
window.limit = limit;
window.serverTimestamp = serverTimestamp;
window.ref = ref;
window.uploadBytes = uploadBytes;
window.getDownloadURL = getDownloadURL;
window.deleteObject = deleteObject;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;

// Guardar funciones utilitarias en window
window.showAlert = showAlert;
window.checkAuth = checkAuth;
window.logout = logout;
window.checkAdminRole = checkAdminRole;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.generateUniqueId = generateUniqueId;
window.translateCollection = translateCollection;