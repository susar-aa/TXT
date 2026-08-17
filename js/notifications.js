// notifications.js
// Browser Notifications and Title Unread Count

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('messagesArea')) return;

    const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');
    let unreadCount = 0;
    const originalTitle = document.title;

    // Request permissions
    if (enableNotificationsBtn) {
        enableNotificationsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!("Notification" in window)) {
                alert("This browser does not support desktop notification");
                return;
            }

            if (Notification.permission === "granted") {
                alert("Notifications are already enabled.");
            } else if (Notification.permission !== "denied") {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    alert("Notifications enabled successfully!");
                }
            }
        });
    }

    // Function to trigger a notification
    window.notifyNewMessage = function(senderName, messageText) {
        // Only notify if tab is not focused
        if (document.hasFocus()) return;

        unreadCount++;
        updateTitle();

        if (Notification.permission === "granted") {
            // We don't show the full message text for privacy as requested, just a generic alert or truncated
            const notification = new Notification(`New message from ${senderName}`, {
                body: "You have a new message.",
                icon: 'https://via.placeholder.com/128?text=Chat', // Placeholder icon
            });

            notification.onclick = function() {
                window.focus();
                this.close();
            };
        }
    };

    // Update browser title
    function updateTitle() {
        if (unreadCount > 0) {
            document.title = `(${unreadCount}) ${originalTitle}`;
        } else {
            document.title = originalTitle;
        }
    }

    // Reset unread count when window gains focus
    window.addEventListener('focus', () => {
        unreadCount = 0;
        updateTitle();
        
        // Also trigger a global event so chat.js can mark messages as read
        window.dispatchEvent(new CustomEvent('app:focused'));
    });
});
