// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDkYmCw8aXm4vdlFUSPtsbaj0dLr14vUiw",
    authDomain: "trading-ce7a5.firebaseapp.com",
    projectId: "trading-ce7a5",
    storageBucket: "trading-ce7a5.firebasestorage.app",
    messagingSenderId: "558394601592",
    appId: "1:558394601592:web:d9d3417ee8960033407d8d"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Make auth and db globally available
window.auth = firebase.auth();
window.db = firebase.firestore();

// Simple alert function
window.showAlert = function(message, type = 'info') {
    // Remove old alerts
    const oldAlert = document.querySelector('.custom-alert');
    if (oldAlert) oldAlert.remove();
    
    // Create alert
    const alert = document.createElement('div');
    alert.className = 'custom-alert';
    alert.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; padding: 15px 20px; 
                    background: ${type === 'success' ? '#02c076' : type === 'error' ? '#f6465d' : '#f0b90b'}; 
                    color: white; border-radius: 8px; z-index: 9999; font-weight: bold;">
            ${message}
        </div>
    `;
    
    document.body.appendChild(alert);
    
    // Remove after 3 seconds
    setTimeout(() => alert.remove(), 3000);
};