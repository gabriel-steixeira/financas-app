// =============================================
// FIREBASE CONFIGURATION
// Finanças App - Gabriel & Clara
// =============================================

const firebaseConfig = {
    apiKey: "AIzaSyCGDcK2pmCsrKTfRPBcN4F16KVTQ8nSkME",
    authDomain: "financas-app-3ccc1.firebaseapp.com",
    databaseURL: "https://financas-app-3ccc1-default-rtdb.firebaseio.com",
    projectId: "financas-app-3ccc1",
    storageBucket: "financas-app-3ccc1.firebasestorage.app",
    messagingSenderId: "532186729982",
    appId: "1:532186729982:web:2e54d9565f38bf442c84af"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

console.log('🔥 Firebase inicializado');
