// messages.js
// Message Rendering and HTML Generation

window.MessageRenderer = {
    // Renders a single message and appends/prepends it to the container
    renderMessage: function(msg, container, isPrepend = false, currentUserId) {
        // Prevent duplicate rendering
        if (document.getElementById(`msg-${msg.id}`)) return null;

        const isOutgoing = msg.sender_id === currentUserId;
        const msgDate = new Date(msg.created_at);
        const timeString = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`;
        wrapper.id = `msg-${msg.id}`;
        wrapper.dataset.timestamp = msg.created_at;

        let contentHtml = '';
        let metaHtml = '';

        if (msg.deleted_at) {
            contentHtml = `<div class="message-bubble deleted">This message was deleted</div>`;
            metaHtml = `<div class="message-meta">${timeString}</div>`;
        } else {
            // Check for reply
            let replyHtml = '';
            if (msg.reply_to_message_id && window.cachedMessages && window.cachedMessages[msg.reply_to_message_id]) {
                const refMsg = window.cachedMessages[msg.reply_to_message_id];
                const refSender = refMsg.sender_id === currentUserId ? 'You' : (window.friendProfile ? window.friendProfile.display_name : 'User');
                const refText = refMsg.deleted_at ? 'Deleted message' : refMsg.message_text;
                replyHtml = `
                    <div class="message-reply-ref" onclick="window.scrollToMessage('${msg.reply_to_message_id}')">
                        <div class="fw-bold small">${refSender}</div>
                        <div class="text-truncate">${this.escapeHTML(refText)}</div>
                    </div>
                `;
            }

            // Check for forwarded
            let forwardedHtml = '';
            if (msg.forwarded_from_message_id) {
                forwardedHtml = `<div class="forwarded-indicator"><i class="bi bi-forward"></i> Forwarded</div>`;
            }

            // Text
            let textHtml = this.escapeHTML(msg.message_text).replace(/\n/g, '<br>');
            
            contentHtml = `
                <div class="message-bubble">
                    ${forwardedHtml}
                    ${replyHtml}
                    <div>${textHtml}</div>
                </div>
            `;

            // Meta
            let editedHtml = msg.is_edited ? 'Edited · ' : '';
            
            // Read receipt
            let receiptHtml = '';
            if (isOutgoing) {
                // If there's a read record for this message ID by the other user, it's read
                const isRead = window.messageReadsMap && window.messageReadsMap[msg.id];
                if (isRead) {
                    receiptHtml = `<span class="read-receipts ms-1"><i class="bi bi-check2 read"></i><i class="bi bi-check2 read" style="margin-left:-4px;"></i></span>`;
                } else {
                    receiptHtml = `<span class="read-receipts ms-1"><i class="bi bi-check2"></i></span>`;
                }
            }

            metaHtml = `<div class="message-meta">${editedHtml}${timeString}${receiptHtml}</div>`;

            // Actions menu
            const actionsHtml = `
                <div class="message-actions dropdown">
                    <button class="btn btn-sm btn-link text-muted p-0 border-0" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu shadow-sm">
                        <li><a class="dropdown-item reply-action" href="#" data-id="${msg.id}"><i class="bi bi-reply me-2"></i> Reply</a></li>
                        <li><a class="dropdown-item forward-action" href="#" data-id="${msg.id}"><i class="bi bi-forward me-2"></i> Forward</a></li>
                        ${isOutgoing ? `
                        <li><a class="dropdown-item edit-action" href="#" data-id="${msg.id}"><i class="bi bi-pencil me-2"></i> Edit</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger delete-action" href="#" data-id="${msg.id}"><i class="bi bi-trash me-2"></i> Delete</a></li>
                        ` : ''}
                    </ul>
                </div>
            `;
            wrapper.innerHTML = `${contentHtml}${metaHtml}${actionsHtml}`;
        }

        if (msg.deleted_at) {
            wrapper.innerHTML = `${contentHtml}${metaHtml}`; // No actions for deleted messages
        }

        // Handle Date Separator
        const msgDateString = msgDate.toDateString();
        
        if (isPrepend) {
            container.prepend(wrapper);
            // Will need a separate function to rebuild date separators if prepending multiple
        } else {
            // Check if we need a date separator
            const lastWrapper = container.lastElementChild;
            if (!lastWrapper || lastWrapper.classList.contains('date-separator') || lastWrapper.dataset.date !== msgDateString) {
                if (lastWrapper && lastWrapper.dataset.date !== msgDateString && !lastWrapper.classList.contains('date-separator')) {
                    const sep = this.createDateSeparator(msgDate);
                    container.appendChild(sep);
                } else if (!lastWrapper) {
                    const sep = this.createDateSeparator(msgDate);
                    container.appendChild(sep);
                }
            }
            wrapper.dataset.date = msgDateString;
            container.appendChild(wrapper);
        }

        return wrapper;
    },

    createDateSeparator: function(date) {
        const sep = document.createElement('div');
        sep.className = 'date-separator';
        
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let label = date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
        if (date.toDateString() === today.toDateString()) label = 'Today';
        else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';

        sep.innerHTML = `<span>${label}</span>`;
        return sep;
    },

    createUnreadSeparator: function(count) {
        const sep = document.createElement('div');
        sep.className = 'unread-separator';
        sep.id = 'unreadSeparator';
        sep.innerHTML = `<span>${count} Unread Messages</span>`;
        return sep;
    },

    escapeHTML: function(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    updateMessage: function(msg, currentUserId) {
        const wrapper = document.getElementById(`msg-${msg.id}`);
        if (!wrapper) return;
        
        // Remove old element and re-render in place
        const newWrapper = this.renderMessage(msg, document.createElement('div'), false, currentUserId); // render to dummy container
        if (newWrapper) {
            wrapper.replaceWith(newWrapper);
        }
    },

    updateReadReceipt: function(messageId) {
        const wrapper = document.getElementById(`msg-${messageId}`);
        if (!wrapper) return;
        
        const receiptSpan = wrapper.querySelector('.read-receipts');
        if (receiptSpan) {
            receiptSpan.innerHTML = `<i class="bi bi-check2 read"></i><i class="bi bi-check2 read" style="margin-left:-4px;"></i>`;
        }
    }
};
