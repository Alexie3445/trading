// logout.js - Simple logout function
async function logout() {
    try {
        // Sign out from Firebase
        await auth.signOut();
        
        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}