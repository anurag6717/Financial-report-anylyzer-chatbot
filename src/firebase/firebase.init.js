// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAa8wnMovHmvsA6mu2vVauP_HFt5cfeXL8",
    authDomain: "weatherapp-fb4e9.firebaseapp.com",
    projectId: "weatherapp-fb4e9",
    storageBucket: "weatherapp-fb4e9.appspot.com",
    messagingSenderId: "1075607251142",
    appId: "1:1075607251142:web:b71cc60b6bab962a78cfc7",
    measurementId: "G-S1MFCNVGQ5"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
