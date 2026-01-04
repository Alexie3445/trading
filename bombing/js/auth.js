// Firebase Configuration
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Simple notification function
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="padding: 10px 15px; border-radius: 5px; background: ${type === 'success' ? '#02c076' : type === 'error' ? '#f6465d' : '#f0b90b'}; 
                    color: white; position: fixed; top: 20px; right: 20px; z-index: 9999;">
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Simple Auth Functions
async function signUpUser(email, password, fullName) {
    try {
        // 1. Create auth account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // 2. Create user document
        await db.collection('users').doc(user.uid).set({
            email: email,
            fullName: fullName,
            registered: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification("Account created! Please complete registration.", "success");
        
        // 3. Redirect to register page IMMEDIATELY
        setTimeout(() => {
            window.location.href = 'register.html';
        }, 1500);
        
        return { success: true };
        
    } catch (error) {
        showNotification(`Error: ${error.message}`, "error");
        return { success: false, error: error.message };
    }
}

async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        showNotification(`Welcome back, ${user.email}!`, "success");
        
        // Check if user is registered
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            if (userData.registered) {
                // Already registered - go to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                // Not registered - go to register page
                setTimeout(() => {
                    window.location.href = 'register.html';
                }, 1000);
            }
        } else {
            // User doc doesn't exist (shouldn't happen) - create it
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                registered: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            setTimeout(() => {
                window.location.href = 'register.html';
            }, 1000);
        }
        
        return { success: true };
        
    } catch (error) {
        showNotification(`Login failed: ${error.message}`, "error");
        return { success: false, error: error.message };
    }
}

async function logoutUser() {
    try {
        await auth.signOut();
        showNotification("Logged out successfully", "success");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showNotification(`Logout error: ${error.message}`, "error");
    }
}

// Check if user is logged in on page load
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("User is logged in:", user.email);
            
            // If on login/signup pages, check registration status
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.includes('signup.html')) {
                
                db.collection('users').doc(user.uid).get().then((doc) => {
                    if (doc.exists && doc.data().registered) {
                        // Already registered - redirect to dashboard
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 500);
                    } else {
                        // Not registered - redirect to register
                        setTimeout(() => {
                            window.location.href = 'register.html';
                        }, 500);
                    }
                });
            }
        } else {
            console.log("No user logged in");
            
            // If on protected pages, redirect to login
            if (window.location.pathname.includes('dashboard.html') || 
                window.location.pathname.includes('register.html') ||
                window.location.pathname.includes('profile.html')) {
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 500);
            }
        }
    });
}

// Run check on page load
checkAuthState();