// Supabase Authentication utilities
async function getUserId() {
    // First check if we have a cached user ID in sessionStorage
    const cachedUserId = sessionStorage.getItem('user_id');
    if (cachedUserId) {
        return cachedUserId;
    }
    
    // Check if Supabase client is available
    if (!window.supabase?.auth) {
        console.error('Supabase client not available');
        return null;
    }
    
    try {
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            return null;
        }
        
        if (session && session.user) {
            const userId = session.user.id;
            // Cache the user ID for this session
            sessionStorage.setItem('user_id', userId);
            return userId;
        }
        
        return null;
    } catch (error) {
        console.error('Error in getUserId:', error);
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
}

async function isAuthenticated() {
    const userId = await getUserId();
    return !!userId;
}

async function checkAuth() {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        // Redirect to login if not authenticated
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

async function signOut() {
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
            } else if (event === 'SIGNED_OUT') {
                clearUserId();
                if (!window.location.pathname.includes('login.html')) {
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
