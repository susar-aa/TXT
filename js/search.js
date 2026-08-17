// search.js
// Search Functionality

window.SearchManager = {
    init: function() {
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.searchResultsPanel = document.getElementById('searchResultsPanel');
        this.searchResultsList = document.getElementById('searchResultsList');
        this.closeSearchBtn = document.getElementById('closeSearchBtn');
        this.mobileSearchBtn = document.getElementById('mobileSearchBtn');
        this.searchContainer = document.getElementById('searchContainer');

        if (!this.searchInput) return;

        let debounceTimeout;

        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                this.clearSearchBtn.classList.remove('d-none');
            } else {
                this.clearSearchBtn.classList.add('d-none');
                this.closeSearch();
                return;
            }

            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });

        this.clearSearchBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.clearSearchBtn.classList.add('d-none');
            this.closeSearch();
        });

        this.closeSearchBtn.addEventListener('click', () => {
            this.closeSearch();
        });

        if (this.mobileSearchBtn) {
            this.mobileSearchBtn.addEventListener('click', () => {
                this.searchContainer.classList.toggle('d-none');
                this.searchContainer.classList.toggle('d-block');
                if (this.searchContainer.classList.contains('d-block')) {
                    this.searchInput.focus();
                }
            });
        }
    },

    performSearch: async function(query) {
        if (!window.activeConversationId) return;

        try {
            const { data, error } = await window.supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', window.activeConversationId)
                .ilike('message_text', `%${query}%`)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            this.renderResults(data, query);
        } catch (err) {
            console.error("Search error", err);
        }
    },

    renderResults: function(results, query) {
        this.searchResultsList.innerHTML = '';
        
        if (results.length === 0) {
            this.searchResultsList.innerHTML = '<div class="text-muted small p-2 text-center">No results found</div>';
        } else {
            results.forEach(msg => {
                const isMine = msg.sender_id === window.currentUserProfile.id;
                const senderName = isMine ? 'You' : (window.friendProfile ? window.friendProfile.display_name : 'User');
                const date = new Date(msg.created_at).toLocaleDateString();
                
                // Highlight query
                const regex = new RegExp(`(${query})`, 'gi');
                const highlightedText = window.MessageRenderer.escapeHTML(msg.message_text).replace(regex, '<mark>$1</mark>');

                const div = document.createElement('div');
                div.className = 'search-result-item mb-1';
                div.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <span class="small fw-bold">${senderName}</span>
                        <span class="small text-muted" style="font-size:0.65rem">${date}</span>
                    </div>
                    <div class="small text-truncate">${highlightedText}</div>
                `;
                
                div.addEventListener('click', () => {
                    this.scrollToMessage(msg.id, msg.created_at);
                });
                
                this.searchResultsList.appendChild(div);
            });
        }
        
        this.searchResultsPanel.classList.remove('d-none');
    },

    closeSearch: function() {
        this.searchResultsPanel.classList.add('d-none');
    },

    scrollToMessage: async function(messageId, timestamp) {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
            setTimeout(() => {
                el.style.backgroundColor = '';
                el.style.transition = 'background-color 1s';
            }, 2000);
            
            // On mobile, maybe hide search input
            if (window.innerWidth < 768) {
                this.searchContainer.classList.add('d-none');
                this.searchContainer.classList.remove('d-block');
            }
        } else {
            // Need to load history to find it
            alert("This message is in older history. Scrolling to specific older messages will be supported in future updates.");
        }
    }
};
