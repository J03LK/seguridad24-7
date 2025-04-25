// Funciones comunes para la interacción con Firebase 
// Este archivo centraliza operaciones frecuentes con Firebase

// Crear un nuevo usuario con email y password
function createUserWithEmailAndPassword(email, password, userData) {
  return firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      // Agregar datos adicionales en Firestore
      return firebase.firestore().collection('users').doc(userCredential.user.uid).set({
        email: email,
        role: userData.role || 'usuario',
        nombre: userData.nombre || '',
        estado: userData.estado || 'activo',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
}

// Iniciar sesión con email y password
function signInWithEmailAndPassword(email, password) {
  return firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      // Actualizar último acceso
      return firebase.firestore().collection('users').doc(userCredential.user.uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
}

// Cerrar sesión
function signOut() {
  return firebase.auth().signOut();
}

// Obtener usuario actual
function getCurrentUser() {
  return firebase.auth().currentUser;
}

// Verificar si un usuario es administrador
function checkIfUserIsAdmin(userId) {
  return firebase.firestore().collection('users').doc(userId).get()
    .then(doc => {
      if (doc.exists) {
        return doc.data().role === 'admin';
      }
      return false;
    });
}

// Subir archivo a Storage
function uploadFile(file, path) {
  const storageRef = firebase.storage().ref();
  const fileRef = storageRef.child(path);
  
  return fileRef.put(file)
    .then(snapshot => snapshot.ref.getDownloadURL());
}

// Eliminar archivo de Storage
function deleteFile(url) {
  const fileRef = firebase.storage().refFromURL(url);
  return fileRef.delete();
}

// Agregar documento a una colección
function addDocument(collection, data) {
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  
  return firebase.firestore().collection(collection).add(data)
    .then(docRef => {
      return {
        id: docRef.id,
        ...data
      };
    });
}

// Actualizar documento
function updateDocument(collection, docId, data) {
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  
  return firebase.firestore().collection(collection).doc(docId).update(data)
    .then(() => {
      return {
        id: docId,
        ...data
      };
    });
}

// Eliminar documento
function deleteDocument(collection, docId) {
  return firebase.firestore().collection(collection).doc(docId).delete();
}

// Obtener documento por ID
function getDocumentById(collection, docId) {
  return firebase.firestore().collection(collection).doc(docId).get()
    .then(doc => {
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      return null;
    });
}

// Obtener todos los documentos de una colección
function getAllDocuments(collection, orderBy = null, order = 'asc', limit = null) {
  let query = firebase.firestore().collection(collection);
  
  if (orderBy) {
    query = query.orderBy(orderBy, order);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  return query.get()
    .then(snapshot => {
      const documents = [];
      snapshot.forEach(doc => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return documents;
    });
}

// Escuchar cambios en un documento
function listenToDocument(collection, docId, callback) {
  return firebase.firestore().collection(collection).doc(docId)
    .onSnapshot(doc => {
      if (doc.exists) {
        callback({
          id: doc.id,
          ...doc.data()
        });
      } else {
        callback(null);
      }
    });
}

// Escuchar cambios en una colección
function listenToCollection(collection, callback, orderBy = null, order = 'asc', limit = null) {
  let query = firebase.firestore().collection(collection);
  
  if (orderBy) {
    query = query.orderBy(orderBy, order);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  return query.onSnapshot(snapshot => {
    const documents = [];
    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(documents);
  });
}

// Exportar funciones
window.FirebaseService = {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getCurrentUser,
  checkIfUserIsAdmin,
  uploadFile,
  deleteFile,
  addDocument,
  updateDocument,
  deleteDocument,
  getDocumentById,
  getAllDocuments,
  listenToDocument,
  listenToCollection
};