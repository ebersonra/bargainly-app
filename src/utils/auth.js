// Supabase Authentication utilities
async function getUserId() {
    // Check if Supabase client is available
    if (!window.supabase?.auth) {
        // Wait a bit for Supabase to initialize if we're early in the page load
        if (document.readyState === 'loading') {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!window.supabase?.auth) {
            console.warn('Supabase client not available for getUserId');
            return null;
        }
    }
    
    try {
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            // Clear any cached data if there's an error
            clearUserId();
            return null;
        }
        
        if (session && session.user) {
            const userId = session.user.id;
            // Cache the user ID for this session
            sessionStorage.setItem('user_id', userId);
            return userId;
        }
        
        // No valid session, clear any cached data
        clearUserId();
        return null;
    } catch (error) {
        console.error('Error in getUserId:', error);
        // Clear any cached data if there's an error
        clearUserId();
        return null;
    }
}

function setUserId(userId) {
    // Cache the user ID in sessionStorage
    sessionStorage.setItem('user_id', userId);
    
    // Also set a cookie for backward compatibility
    document.cookie = `user_id=${userId}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

function clearUserId() {
    // Clear cached user ID
    sessionStorage.removeItem('user_id');
    
    // Clear cookie
    document.cookie = 'user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Also clear any other auth-related storage
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-' + window.location.hostname + '-auth-token');
}

async function isAuthenticated() {
    const userId = await getUserId();
    return !!userId;
}

async function checkAuth() {
    // Check if we're in the process of logging out
    if (sessionStorage.getItem('logging_out') === 'true') {
        return false; // Don't redirect, let the logout process complete
    }
    
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = '/login.html';
        }
        return false;
    }
    return true;
}

async function signOut() {
    // Set a flag to indicate we're logging out
    sessionStorage.setItem('logging_out', 'true');
    
    if (window.supabase?.auth) {
        try {
            const { error } = await window.supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error);
            }
        } catch (error) {
            console.error('Error in signOut:', error);
        }
    }
    
    // Clear local storage
    clearUserId();
    
    // Clear the logout flag after a short delay
    setTimeout(() => {
        sessionStorage.removeItem('logging_out');
    }, 1000);
    
    // Redirect to login
    window.location.href = '/login.html';
}

// Listen for auth state changes
function initAuthListener() {
    if (window.supabase?.auth) {
        window.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN' && session) {
                setUserId(session.user.id);
                // Clear any logout flags
                sessionStorage.removeItem('logging_out');
            } else if (event === 'SIGNED_OUT') {
                clearUserId();
                // Only redirect if we're not already on login page and not in logout process
                if (!window.location.pathname.includes('login.html') && 
                    sessionStorage.getItem('logging_out') !== 'true') {
                    window.location.href = '/login.html';
                }
            }
        });
    }
}

// Browser compatibility check
if (typeof window === 'undefined') {
    // Node.js environment - export as module
    module.exports = {
        getUserId,
        setUserId,
        clearUserId,
        isAuthenticated,
        checkAuth,
        signOut,
        initAuthListener
    };
} else {
    // Browser environment - make auth functions globally available
    window.getUserId = getUserId;
    window.setUserId = setUserId;
    window.clearUserId = clearUserId;
    window.isAuthenticated = isAuthenticated;
    window.checkAuth = checkAuth;
    window.signOut = signOut;
    window.initAuthListener = initAuthListener;
    
    // Initialize auth listener when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for Supabase to be initialized
        setTimeout(initAuthListener, 1000);
    });
}
