// Authentication utilities
function getUserId() {
    const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user_id='));
    
    if (userCookie) {
        return userCookie.split('=')[1];
    }
    
    // Generate a new user ID if none exists
    const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    document.cookie = `user_id=${newUserId}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
    return newUserId;
}

function setUserId(userId) {
    document.cookie = `user_id=${userId}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

function clearUserId() {
    document.cookie = 'user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function isAuthenticated() {
    return !!getUserId();
}

function checkAuth() {
    if (!isAuthenticated()) {
        // Redirect to login if not authenticated
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Browser compatibility check
if (typeof window === 'undefined') {
    // Node.js environment - export as module
    module.exports = {
        getUserId,
        setUserId,
        clearUserId,
        isAuthenticated,
        checkAuth
    };
} else {
    // Browser environment - make auth functions globally available
    window.getUserId = getUserId;
    window.setUserId = setUserId;
    window.clearUserId = clearUserId;
    window.isAuthenticated = isAuthenticated;
    window.checkAuth = checkAuth;
}
