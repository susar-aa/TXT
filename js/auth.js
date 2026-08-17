// auth.js
// Authentication Logic (Simplified - No Logins Required)

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Set offline status before logging out
            if (window.currentUserProfile) {
                try {
                    await window.supabase
                        .from('profiles')
                        .update({ online_status: 'offline', last_seen: new Date().toISOString() })
                        .eq('id', window.currentUserProfile.id);
                } catch (err) {
                    console.error("Error setting offline status on logout", err);
                }
            }

            // Remove local storage identity
            localStorage.removeItem('chatUserId');
            window.location.href = 'login.html';
        });
    }
});
