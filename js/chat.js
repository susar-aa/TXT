// chat.js
// Main Chat Controller

document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('messagesArea')) return;

    // Globals
    window.currentUserProfile = null;
    window.friendProfile = null;
    window.activeConversationId = null;
    window.cachedMessages = {}; // id -> msg object
    window.messageReadsMap = {}; // id -> true

    let replyToMessageId = null;
    let editMessageId = null;
    let earliestMessageTime = null;
    let isLoadingHistory = false;
    let hasMoreHistory = true;

    const messagesArea = document.getElementById('messagesArea');
    const messagesList = document.getElementById('messagesList');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const loadingHistoryEl = document.getElementById('loadingHistory');
    
    // UI Elements
    const friendNameSidebar = document.getElementById('friendNameSidebar');
    const friendNameHeader = document.getElementById('friendNameHeader');
    const friendStatusText = document.getElementById('friendStatusText');
    const friendStatusIndicator = document.getElementById('friendStatusIndicator');
    const lastMessageSidebar = document.getElementById('lastMessageSidebar');
    const unreadBadgeSidebar = document.getElementById('unreadBadgeSidebar');
    const currentUserAvatar = document.getElementById('currentUserAvatar');
    const friendAvatarSidebar = document.getElementById('friendAvatarSidebar');
    const friendAvatarHeader = document.getElementById('friendAvatarHeader');

    const composerPreview = document.getElementById('composerPreview');
    const previewTitle = document.getElementById('previewTitle');
    const previewText = document.getElementById('previewText');
    const closePreviewBtn = document.getElementById('closePreviewBtn');

    // 1. Initialize
    await init();

    async function init() {
        // Check local storage for identity
        const userId = localStorage.getItem('chatUserId');
        if (!userId) {
            window.location.href = 'login.html';
            return;
        }

        // Fetch Current Profile
        const { data: profile, error: profileErr } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (profileErr || !profile) {
            console.error("Failed to load profile:", profileErr);
            alert("Failed to load user profile. Please ensure you have set up Supabase and added your API keys to js/config.js.");
            return;
        }

        window.currentUserProfile = profile;
        currentUserAvatar.textContent = profile.display_name.charAt(0).toUpperCase();

        // Fetch Conversations
        const { data: convMembers, error: convErr } = await window.supabase
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', profile.id);

        if (convMembers && convMembers.length > 0) {
            window.activeConversationId = convMembers[0].conversation_id;
            await loadConversationDetails(window.activeConversationId);
            await loadInitialMessages();
            window.RealtimeManager.init(window.activeConversationId);
            window.SearchManager.init();
        } else {
            console.error("No conversations found for user.");
        }

        setupEventListeners();
    }

    async function loadConversationDetails(convId) {
        // Find the other member in the conversation
        const { data: members } = await window.supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', convId)
            .neq('user_id', window.currentUserProfile.id);

        if (members && members.length > 0) {
            const friendId = members[0].user_id;
            const { data: fProfile } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', friendId)
                .single();
            
            window.friendProfile = fProfile;
            updateFriendStatusUI(fProfile);
        }
    }

    window.updateFriendStatusUI = function(profile) {
        const name = profile.display_name;
        friendNameSidebar.textContent = name;
        friendNameHeader.textContent = name;
        
        const initial = name.charAt(0).toUpperCase();
        friendAvatarSidebar.textContent = initial;
        friendAvatarHeader.textContent = initial;

        if (profile.online_status === 'online') {
            friendStatusText.innerHTML = '<i class="bi bi-circle-fill text-success" style="font-size: 0.5rem;"></i> Online';
            friendStatusIndicator.classList.remove('bg-secondary');
            friendStatusIndicator.classList.add('bg-success');
        } else {
            let lastSeenStr = 'Offline';
            if (profile.last_seen) {
                const diffMs = Date.now() - new Date(profile.last_seen).getTime();
                const diffMins = Math.floor(diffMs / 60000);
                if (diffMins < 1) lastSeenStr = 'Last seen just now';
                else if (diffMins < 60) lastSeenStr = `Last seen ${diffMins} minutes ago`;
                else if (diffMins < 1440) lastSeenStr = `Last seen ${Math.floor(diffMins/60)} hours ago`;
                else lastSeenStr = 'Last seen yesterday or older';
            }
            friendStatusText.textContent = lastSeenStr;
            friendStatusIndicator.classList.remove('bg-success');
            friendStatusIndicator.classList.add('bg-secondary');
        }
    };

    async function loadInitialMessages() {
        isLoadingHistory = true;
        
        // Fetch message reads to know what is read
        await fetchMessageReads();

        const { data: messages, error } = await window.supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', window.activeConversationId)
            .order('created_at', { ascending: false })
            .limit(30);

        if (messages && messages.length > 0) {
            earliestMessageTime = messages[messages.length - 1].created_at;
            
            // Render in reverse because we fetched descending
            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i];
                window.cachedMessages[msg.id] = msg;
                window.MessageRenderer.renderMessage(msg, messagesList, false, window.currentUserProfile.id);
            }
            window.scrollToBottom();
            updateLastMessageSidebar(messages[0]);
            
            // Mark unread messages as read
            markUnreadAsRead(messages);
        } else {
            hasMoreHistory = false;
        }
        isLoadingHistory = false;
    }

    async function loadOlderMessages() {
        if (isLoadingHistory || !hasMoreHistory || !earliestMessageTime) return;
        isLoadingHistory = true;
        loadingHistoryEl.classList.remove('d-none');

        const { data: messages } = await window.supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', window.activeConversationId)
            .lt('created_at', earliestMessageTime)
            .order('created_at', { ascending: false })
            .limit(30);

        if (messages && messages.length > 0) {
            earliestMessageTime = messages[messages.length - 1].created_at;
            
            // Save scroll pos
            const oldHeight = messagesArea.scrollHeight;
            
            for (let i = 0; i < messages.length; i++) {
                const msg = messages[i];
                window.cachedMessages[msg.id] = msg;
                window.MessageRenderer.renderMessage(msg, messagesList, true, window.currentUserProfile.id);
            }
            
            // Rebuild date separators
            rebuildDateSeparators();

            // Restore scroll pos
            messagesArea.scrollTop = messagesArea.scrollHeight - oldHeight;
        } else {
            hasMoreHistory = false;
        }
        
        loadingHistoryEl.classList.add('d-none');
        isLoadingHistory = false;
    }

    async function fetchMessageReads() {
        const { data: reads } = await window.supabase
            .from('message_reads')
            .select('message_id')
            .neq('user_id', window.currentUserProfile.id); // reads by the other person
        
        if (reads) {
            reads.forEach(r => {
                window.messageReadsMap[r.message_id] = true;
            });
        }
    }

    async function markUnreadAsRead(messages) {
        if (!document.hasFocus()) return;

        const unreadIds = messages
            .filter(m => m.sender_id !== window.currentUserProfile.id)
            .map(m => m.id);

        if (unreadIds.length === 0) return;

        // Find which ones I haven't read yet
        const { data: myReads } = await window.supabase
            .from('message_reads')
            .select('message_id')
            .eq('user_id', window.currentUserProfile.id)
            .in('message_id', unreadIds);
        
        const readSet = new Set(myReads ? myReads.map(r => r.message_id) : []);
        const toMark = unreadIds.filter(id => !readSet.has(id));

        if (toMark.length > 0) {
            const inserts = toMark.map(id => ({ message_id: id, user_id: window.currentUserProfile.id }));
            await window.supabase.from('message_reads').insert(inserts);
            // This will trigger realtime events for the sender
        }
    }

    // Scroll event for infinite history
    messagesArea.addEventListener('scroll', () => {
        if (messagesArea.scrollTop === 0) {
            loadOlderMessages();
        }
    });

    // Realtime Handlers
    window.handleNewRealtimeMessage = function(msg) {
        window.cachedMessages[msg.id] = msg;
        
        // Render
        const isAtBottom = Math.abs((messagesArea.scrollHeight - messagesArea.scrollTop) - messagesArea.clientHeight) < 50;
        window.MessageRenderer.renderMessage(msg, messagesList, false, window.currentUserProfile.id);
        
        if (isAtBottom || msg.sender_id === window.currentUserProfile.id) {
            window.scrollToBottom(true);
        }

        updateLastMessageSidebar(msg);

        // Notify if incoming and hidden
        if (msg.sender_id !== window.currentUserProfile.id) {
            window.notifyNewMessage(window.friendProfile ? window.friendProfile.display_name : 'User', msg.message_text);
            if (document.hasFocus()) {
                markUnreadAsRead([msg]);
            }
        }
    };

    window.handleUpdatedRealtimeMessage = function(msg) {
        window.cachedMessages[msg.id] = msg;
        window.MessageRenderer.updateMessage(msg, window.currentUserProfile.id);
        
        // Update sidebar if it's the last message
        if (lastMessageSidebar.dataset.msgId === msg.id) {
            updateLastMessageSidebar(msg);
        }
    };

    window.handleRealtimeReadReceipt = function(readRecord) {
        // If the other user read my message
        if (readRecord.user_id !== window.currentUserProfile.id) {
            window.messageReadsMap[readRecord.message_id] = true;
            window.MessageRenderer.updateReadReceipt(readRecord.message_id);
        }
    };

    window.handlePresenceSync = function(state) {
        let isTyping = false;
        for (const id in state) {
            const presences = state[id];
            for (const p of presences) {
                if (p.user_id !== window.currentUserProfile.id && p.typing) {
                    isTyping = true;
                }
            }
        }
        
        if (isTyping) {
            friendStatusText.innerHTML = `<span class="typing-dots text-primary fw-bold">Typing<span></span><span></span><span></span></span>`;
        } else {
            // Revert to normal status
            if (window.friendProfile) updateFriendStatusUI(window.friendProfile);
        }
    };

    window.addEventListener('app:focused', () => {
        // Mark all loaded incoming messages as read
        const incoming = Object.values(window.cachedMessages).filter(m => m.sender_id !== window.currentUserProfile.id);
        markUnreadAsRead(incoming);
    });

    function updateLastMessageSidebar(msg) {
        lastMessageSidebar.dataset.msgId = msg.id;
        if (msg.deleted_at) {
            lastMessageSidebar.innerHTML = '<i>Message deleted</i>';
            return;
        }
        const prefix = msg.sender_id === window.currentUserProfile.id ? 'You: ' : '';
        lastMessageSidebar.textContent = prefix + msg.message_text;
    }

    function rebuildDateSeparators() {
        // Remove existing
        const seps = messagesList.querySelectorAll('.date-separator');
        seps.forEach(s => s.remove());

        const wrappers = Array.from(messagesList.querySelectorAll('.message-wrapper'));
        let lastDateString = null;

        wrappers.forEach(w => {
            const dStr = new Date(w.dataset.timestamp).toDateString();
            if (dStr !== lastDateString) {
                const sep = window.MessageRenderer.createDateSeparator(new Date(w.dataset.timestamp));
                w.parentNode.insertBefore(sep, w);
                lastDateString = dStr;
            }
            w.dataset.date = dStr;
        });
    }

    // Input Handling
    let typingTimeout;
    messageInput.addEventListener('input', () => {
        // Typing indicator logic
        window.RealtimeManager.setTyping(true);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            window.RealtimeManager.setTyping(false);
        }, 2000);
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', () => {
        sendMessage();
    });

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        messageInput.value = '';
        messageInput.style.height = 'auto'; // Reset size
        window.RealtimeManager.setTyping(false);
        clearTimeout(typingTimeout);

        if (editMessageId) {
            // Edit existing
            const mId = editMessageId;
            closePreview();
            await window.supabase
                .from('messages')
                .update({ message_text: text, is_edited: true, edited_at: new Date().toISOString() })
                .eq('id', mId);
        } else {
            // Send new
            const insertObj = {
                conversation_id: window.activeConversationId,
                sender_id: window.currentUserProfile.id,
                message_text: text
            };

            if (replyToMessageId) {
                insertObj.reply_to_message_id = replyToMessageId;
            } else if (window.forwardMessageId) {
                insertObj.forwarded_from_message_id = window.forwardMessageId;
                window.forwardMessageId = null; // Clear after sending
            }
            
            closePreview();

            await window.supabase
                .from('messages')
                .insert([insertObj]);
        }
    }

    // Context Menu Actions Event Delegation
    document.addEventListener('click', async (e) => {
        const target = e.target.closest('a');
        if (!target) return;

        if (target.classList.contains('delete-action')) {
            e.preventDefault();
            const msgId = target.dataset.id;
            if (confirm("Delete message for everyone?")) {
                await window.supabase
                    .from('messages')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', msgId);
            }
        }
        else if (target.classList.contains('edit-action')) {
            e.preventDefault();
            const msgId = target.dataset.id;
            const msg = window.cachedMessages[msgId];
            if (msg && !msg.deleted_at) {
                messageInput.value = msg.message_text;
                editMessageId = msgId;
                replyToMessageId = null;
                window.forwardMessageId = null;
                showPreview('Edit Message', msg.message_text);
                messageInput.focus();
            }
        }
        else if (target.classList.contains('reply-action')) {
            e.preventDefault();
            const msgId = target.dataset.id;
            const msg = window.cachedMessages[msgId];
            if (msg && !msg.deleted_at) {
                replyToMessageId = msgId;
                editMessageId = null;
                window.forwardMessageId = null;
                const sender = msg.sender_id === window.currentUserProfile.id ? 'You' : (window.friendProfile ? window.friendProfile.display_name : 'User');
                showPreview(`Replying to ${sender}`, msg.message_text);
                messageInput.focus();
            }
        }
        else if (target.classList.contains('forward-action')) {
            e.preventDefault();
            const msgId = target.dataset.id;
            const msg = window.cachedMessages[msgId];
            if (msg && !msg.deleted_at) {
                window.forwardMessageId = msgId;
                editMessageId = null;
                replyToMessageId = null;
                messageInput.value = msg.message_text;
                showPreview('Forward Message', msg.message_text);
                messageInput.focus();
            }
        }
    });

    closePreviewBtn.addEventListener('click', closePreview);

    function showPreview(title, text) {
        previewTitle.textContent = title;
        previewText.textContent = text;
        composerPreview.classList.remove('d-none');
    }

    function closePreview() {
        composerPreview.classList.add('d-none');
        replyToMessageId = null;
        editMessageId = null;
        window.forwardMessageId = null;
        messageInput.value = '';
    }

    // Utility exposed for clicking replied message
    window.scrollToMessage = function(id) {
        const el = document.getElementById(`msg-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
            setTimeout(() => {
                el.style.backgroundColor = '';
                el.style.transition = 'background-color 1s';
            }, 2000);
        } else {
            alert("Message is in older history.");
        }
    }
});
