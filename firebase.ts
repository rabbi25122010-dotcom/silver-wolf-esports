// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyOV6Tz7MiTF6Fz-JhbYKqtAmOUOYW7Gk",
  authDomain: "silver-wolf-organization.firebaseapp.com",
  databaseURL: "https://silver-wolf-organization-default-rtdb.firebaseio.com",
  projectId: "silver-wolf-organization",
  storageBucket: "silver-wolf-organization.firebasestorage.app",
  messagingSenderId: "96125476768",
  appId: "1:96125476768:web:dd045d87faa8ae0130cec5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// database কানেকশন তৈরি করে তা EXPORT করা হলো
export const database = getDatabase(app);
