// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDkYmCw8aXm4vdlFUSPtsbaj0dLr14vUiw",
  authDomain: "trading-ce7a5.firebaseapp.com",
  databaseURL: "https://trading-ce7a5-default-rtdb.firebaseio.com",
  projectId: "trading-ce7a5",
  storageBucket: "trading-ce7a5.firebasestorage.app",
  messagingSenderId: "558394601592",
  appId: "1:558394601592:web:d9d3417ee8960033407d8d",
  measurementId: "G-WBX5G98H8M"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const analytics = firebase.analytics();
  
  // Formspree configuration
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";