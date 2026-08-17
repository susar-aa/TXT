// realtime.js
// Supabase Realtime Subscriptions

window.RealtimeManager = {
    channel: null,

    init: function(conversationId) {
        if (!window.supabase) return;

        // Cleanup existing subscription
        if (this.channel) {
            window.supabase.removeChannel(this.channel);
        }

        // We use a single channel for Postgres changes and Presence (typing)
        this.channel = window.supabase.channel(`room:${conversationId}`);

        // Listen for new messages, updates (edits/deletes)
        this.channel
            .on('postgres', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
                console.log("REALTIME: New message", payload);
                const msg = payload.new;
                // Only handle if it belongs to our active conversation (client side filter)
                if (msg.conversation_id === window.activeConversationId) {
                    window.handleNewRealtimeMessage(msg);
                }
            })
            .on('postgres', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
                console.log("REALTIME: Updated message", payload);
                const msg = payload.new;
                if (msg.conversation_id === window.activeConversationId) {
                    window.handleUpdatedRealtimeMessage(msg);
                }
            })
            // Listen for read receipts
            .on('postgres', { event: 'INSERT', schema: 'public', table: 'message_reads' }, payload => {
                console.log("REALTIME: Read receipt", payload);
                const readRecord = payload.new;
                window.handleRealtimeReadReceipt(readRecord);
            })
            // Listen for profile changes (online status / last seen)
            .on('postgres', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
                console.log("REALTIME: Profile update", payload);
                const profile = payload.new;
                if (window.friendProfile && profile.id === window.friendProfile.id) {
                    window.updateFriendStatusUI(profile);
                }
            });

        // Presence for typing indicators
        this.channel
            .on('presence', { event: 'sync' }, () => {
                const state = this.channel.presenceState();
                console.log("REALTIME: Presence sync", state);
                window.handlePresenceSync(state);
            });

        // Subscribe
        this.channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                // Track our own presence (not typing initially)
                await this.channel.track({ typing: false, user_id: window.currentUserProfile.id });
                
                // Update our online status in DB
                await window.supabase
                    .from('profiles')
                    .update({ online_status: 'online' })
                    .eq('id', window.currentUserProfile.id);
            }
        });

        // Handle page visibility for online/offline and typing clear
        document.addEventListener("visibilitychange", async () => {
            if (document.visibilityState === "hidden") {
                await this.channel.track({ typing: false, user_id: window.currentUserProfile.id });
                await window.supabase
                    .from('profiles')
                    .update({ online_status: 'offline', last_seen: new Date().toISOString() })
                    .eq('id', window.currentUserProfile.id);
            } else {
                await window.supabase
                    .from('profiles')
                    .update({ online_status: 'online' })
                    .eq('id', window.currentUserProfile.id);
            }
        });
    },

    setTyping: async function(isTyping) {
        if (this.channel && this.channel.state === 'joined') {
            await this.channel.track({ typing: isTyping, user_id: window.currentUserProfile.id });
        }
    }
};
