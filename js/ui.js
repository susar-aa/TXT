// ui.js
// UI Interactions, Theme Management, Mobile Adjustments

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the chat page
    if (!document.getElementById('messagesArea')) return;

    const htmlElement = document.documentElement;
    const toggleThemeBtn = document.getElementById('toggleThemeBtn');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const messageInput = document.getElementById('messageInput');
    const messagesArea = document.getElementById('messagesArea');

    // Theme Management
    const THEME_KEY = 'chat_app_theme';
    
    function applyTheme(theme) {
        htmlElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        
        // Update icon in dropdown
        if (toggleThemeBtn) {
            const icon = toggleThemeBtn.querySelector('i');
            if (theme === 'dark') {
                icon.classList.remove('bi-moon');
                icon.classList.add('bi-sun');
            } else {
                icon.classList.remove('bi-sun');
                icon.classList.add('bi-moon');
            }
        }
    }

    // Load saved theme or prefer-color-scheme
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
    }

    // Toggle theme button
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // Mobile Sidebar Toggle
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('show');
            // Create backdrop
            let backdrop = document.getElementById('sidebarBackdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'sidebarBackdrop';
                backdrop.style.position = 'absolute';
                backdrop.style.top = '0';
                backdrop.style.left = '0';
                backdrop.style.width = '100vw';
                backdrop.style.height = '100vh';
                backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
                backdrop.style.zIndex = '999';
                document.body.appendChild(backdrop);

                backdrop.addEventListener('click', () => {
                    sidebar.classList.remove('show');
                    backdrop.remove();
                });
            }
        });
    }

    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            
            // Adjust messages area height dynamically if needed
            // The flex layout mostly handles it, but we can scroll to bottom if at bottom
        });
    }

    // Global utility to scroll to bottom
    window.scrollToBottom = function(smooth = false) {
        if (!messagesArea) return;
        messagesArea.scrollTo({
            top: messagesArea.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    };
});
