const firebaseConfig = {
    apiKey: "AIzaSyB3dfxyVUvNX7i0ezb4jFe9I_pwiTr4r3U",
    authDomain: "futbol-sorteo.firebaseapp.com",
    projectId: "futbol-sorteo",
    storageBucket: "futbol-sorteo.firebasestorage.app",
    messagingSenderId: "159939332442",
    appId: "1:159939332442:web:05782893decb79d0038b63",
    measurementId: "G-BZ7Q282GWN"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
