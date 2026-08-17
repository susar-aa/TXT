# Build a Private Two-Person Realtime Chat Web Application

Build a modern, lightweight, realtime web chat application for exactly two initial users:

* **Sus**
* **Nethuki**

The application will initially be a private 1-to-1 chat application.

However, the architecture must be designed so that it can later be expanded into a **full multi-user chat platform** without rebuilding the entire system.

---

# 1. Technology Stack

Use:

### Frontend

* HTML5
* CSS3
* JavaScript
* Bootstrap 5
* Vanilla JavaScript where possible

### Backend / Database

* Supabase
* PostgreSQL
* Supabase Realtime
* Supabase Authentication

### Hosting

* Plesk hosting

The application should be deployable to normal PHP-compatible Plesk hosting.

Do NOT introduce React, Angular, Vue, Node.js, Express.js, or other unnecessary frontend frameworks.

Keep the application lightweight and easy to maintain.

---

# 2. Initial User System

There are only two users in Version 1.

### User 1

Display name:

`Sus`

### User 2

Display name:

`Nethuki`

Both users should have:

* Username
* Password

No phone number.

No email login.

No Google login.

No public registration.

No phone verification.

No OTP.

The application should start with the two predefined accounts.

Example:

`Username: sus`

`Username: nethuki`

The actual passwords must NOT be hardcoded into frontend JavaScript.

Store authentication credentials securely through the backend/Supabase authentication system.

---

# 3. Authentication

Create a simple login screen.

The login screen should contain:

* Application logo/name
* Username field
* Password field
* Login button
* Login error message

After successful authentication:

`/login` → `/chat`

Unauthenticated users must not be able to access the chat page.

Implement:

* Login
* Logout
* Session persistence
* Session expiration handling

Do not expose database credentials or Supabase service-role keys in frontend code.

---

# 4. Main Chat Concept

Version 1 contains exactly one private conversation between:

**Sus ↔ Nethuki**

There is no need for:

* Groups
* Channels
* Communities
* Friend requests
* User discovery
* Public profiles
* Multiple conversations

However, the database structure must use a proper `conversations` model so that multiple conversations can be added in a future version.

Do NOT hardcode the entire application around a single conversation.

---

# 5. Database Architecture

Use PostgreSQL through Supabase.

Design the schema so it can later support a full chat platform.

Suggested structure:

## profiles

Fields:

* id
* username
* display_name
* avatar_url
* online_status
* last_seen
* created_at
* updated_at

## conversations

Fields:

* id
* conversation_type
* created_at
* updated_at

For Version 1:

`conversation_type = private`

## conversation_members

Fields:

* conversation_id
* user_id
* joined_at

The initial conversation should contain exactly:

* Sus
* Nethuki

## messages

Fields:

* id
* conversation_id
* sender_id
* message_text
* reply_to_message_id
* forwarded_from_message_id
* is_edited
* edited_at
* deleted_at
* created_at
* updated_at

Only text messages are required.

Do NOT create unnecessary media/file tables in Version 1.

## message_reads

Fields:

* message_id
* user_id
* read_at

Use this for read receipts.

---

# 6. Message Features

Implement the following features.

## Text Messages

Users can:

* Type text
* Send text
* Receive text realtime

Pressing:

`Enter`

should send the message.

Pressing:

`Shift + Enter`

should create a new line.

Do not allow completely empty messages.

---

# 7. Realtime Messaging

Use Supabase Realtime.

When Sus sends a message:

1. Insert the message into PostgreSQL.
2. Supabase Realtime detects the new message.
3. Nethuki receives the message instantly.
4. The message appears without refreshing.

The same must work in reverse.

Do not use continuous polling.

Use realtime subscriptions efficiently.

Clean up realtime subscriptions when leaving the page.

---

# 8. Message Layout

Create a modern messaging UI.

Messages sent by the current user:

* Align right
* Use outgoing message bubble

Messages received:

* Align left
* Use incoming message bubble

Each message should display:

* Message text
* Time
* Read status where applicable

Example:

`Hey, are you free tonight?`

`8:42 PM ✓✓`

---

# 9. Read Receipts

Implement read receipts.

States:

### Sent

`✓`

### Read

`✓✓`

When the recipient opens/views the conversation, unread messages should automatically become read.

The sender should then see:

`✓✓`

Use the `message_reads` table.

Avoid unnecessary database writes.

Only mark messages as read when appropriate.

---

# 10. Typing Indicator

Implement realtime typing indicators.

Example:

`Nethuki is typing...`

or:

`Sus is typing...`

The typing indicator should:

* Appear quickly
* Disappear when typing stops
* Automatically timeout if connection is lost

Do NOT continuously write typing events into PostgreSQL.

Use Supabase Realtime Broadcast/Presence functionality where appropriate.

---

# 11. Online Status

Show whether the other user is online.

Header example:

`Nethuki`

`● Online`

When offline:

`Last seen 8:42 PM`

Use Supabase Realtime Presence where appropriate.

Avoid constantly writing online status to the database.

Store `last_seen` only when necessary.

---

# 12. Last Seen

Display the user's last activity.

Examples:

`Online`

`Last seen just now`

`Last seen 10 minutes ago`

`Last seen yesterday`

Use friendly formatting.

---

# 13. Edit Messages

Users can edit their own messages.

Message menu:

`Edit`

When selected:

* Put the message text into the composer.
* Allow editing.
* Save the updated message.
* Display an `edited` indicator.

Example:

`Are you coming today?`

`Edited · 8:43 PM`

Users must NOT be able to edit another user's messages.

---

# 14. Reply to Messages

Allow users to reply to a specific message.

Each message should have a menu:

* Reply
* Edit (own messages only)
* Forward
* Delete if appropriate
* Copy

When replying, show a small preview above the composer.

Example:

`Replying to Sus`
`Are you coming tonight?`

The new message should store:

`reply_to_message_id`

Display the referenced message inside the sent message.

Clicking the reply preview should scroll to the original message.

---

# 15. Forward Messages

Implement text-message forwarding.

A user can select:

`Forward`

The forwarded message should be inserted as a new message.

Store:

`forwarded_from_message_id`

Display:

`Forwarded`

Do not create duplicate database records unnecessarily.

The forwarded message should still behave as a normal text message.

---

# 16. Message Search

Implement conversation search.

Add a search icon in the chat header.

When clicked:

* Show search input.
* Search messages.
* Display matching results.
* Show message sender and date/time.
* Clicking a result should scroll to the original message.

Search should only search the current user's authorized conversations.

Optimize database queries.

Do not load the entire conversation into the browser just to perform searches.

---

# 17. Delete Messages

Allow users to delete their own messages.

Implement soft deletion rather than immediately destroying the database record.

After deletion, display:

`This message was deleted`

Keep the database record for consistency and future auditing.

---

# 18. Chat History

Do NOT load every historical message when the chat opens.

Implement pagination/infinite scrolling.

When opening the chat:

Load the newest messages first.

When scrolling upward:

Load older messages.

Use efficient PostgreSQL queries.

Target approximately 30–50 messages per batch.

Prevent duplicate messages when loading older history.

---

# 19. Browser Notifications

Browser notifications are required.

When a new message arrives while the user is:

* On another browser tab
* On another website
* The chat tab is not active

Show a browser notification.

Example:

`New message from Nethuki`

The notification should not contain the complete message by default.

Request notification permission gracefully.

Do not repeatedly ask for permission.

Also update the browser tab title when there are unread messages.

Example:

`(2) Chat`

---

# 20. Unread Messages

Track unread messages.

If the user receives messages while away:

Show:

`2 unread messages`

When returning to the conversation:

* Scroll appropriately.
* Mark messages as read.
* Remove unread indicator.

Add an unread separator where useful:

`--- 2 Unread Messages ---`

---

# 21. Mobile UI

The application MUST be optimized for mobile.

It should work properly on:

* Android phones
* iPhones
* Small screens
* Large phones
* Tablets

Do not simply shrink the desktop UI.

Design a proper mobile chat interface.

Mobile:

* Chat takes the full screen.
* Header stays accessible.
* Composer stays at the bottom.
* Input should remain usable when the mobile keyboard opens.
* Message bubbles should fit narrow screens.
* Avoid horizontal scrolling.

---

# 22. Desktop UI

On desktop:

Create a polished chat application layout.

Suggested structure:

### Left sidebar

* Application logo/name
* Current user's profile
* Conversation
* Friend name
* Online status
* Unread count
* Settings/logout

### Main area

Header:

* Friend avatar
* Friend name
* Online/last seen
* Search
* More options

Body:

* Messages
* Date separators
* Unread separator

Bottom:

* Message input
* Send button

Because there are only two users initially, do not make the sidebar unnecessarily large.

---

# 23. Responsive Design

The same application must provide an excellent experience at:

* 360px mobile width
* 390px
* 414px
* Tablet
* 1366px desktop
* 1920px desktop

Use responsive Bootstrap utilities plus custom CSS where necessary.

Test:

* Portrait
* Landscape
* Mobile keyboard
* Desktop browser
* Browser zoom

---

# 24. UI Design

The application should feel like a modern private messenger.

Design characteristics:

* Minimal
* Clean
* Fast
* Smooth
* Modern
* Premium-looking
* Simple navigation

Avoid making it look like:

* ERP software
* Admin dashboard
* CRM
* Business management software

The primary focus is the conversation.

Use subtle animations for:

* New messages
* Message actions
* Typing indicator
* Opening search
* Notifications

Do not overuse animations.

---

# 25. Theme

Implement:

### Light Mode

Clean, bright interface.

### Dark Mode

Comfortable dark interface.

Add a theme toggle in settings.

Remember the selected theme using local storage.

---

# 26. User Profile

Display:

### Sus

* Username
* Display name
* Online/last seen

### Nethuki

* Username
* Display name
* Online/last seen

Version 1 does not need complicated profile editing.

Keep it simple.

---

# 27. Settings

Create a simple settings panel.

Include:

* Theme
* Browser notifications
* Logout

Do not create unnecessary settings.

---

# 28. No Media

Version 1 must NOT implement:

* Image upload
* Video upload
* Audio
* Voice messages
* File sharing
* Documents
* GIF uploads
* Stickers

Only text messages.

However, design the database and architecture so media can be added later without rebuilding the messaging system.

---

# 29. Future Full Chat Platform Architecture

This is extremely important.

Although Version 1 only has:

`Sus ↔ Nethuki`

the architecture must support future expansion.

Future features may include:

* Multiple users
* User registration
* User search
* Friend system
* Multiple private conversations
* Group chats
* Group admins
* Channels
* Media sharing
* Voice messages
* Video calls
* File sharing

Therefore:

DO NOT hardcode:

`user1 = Sus`

`user2 = Nethuki`

throughout the application.

Instead, use:

* Users
* Profiles
* Conversations
* Conversation members
* Messages

with proper foreign keys.

The initial application simply creates one conversation containing the two initial users.

---

# 30. Database Indexing

Create appropriate indexes.

At minimum consider indexes for:

* messages.conversation_id
* messages.created_at
* messages.sender_id
* messages.reply_to_message_id
* messages.forwarded_from_message_id
* message_reads.message_id
* conversation_members.user_id

Optimize queries for large future message histories.

---

# 31. Security

This is a private application, but still implement basic production security.

Do NOT expose:

* Database passwords
* Supabase service-role key
* Private API keys

Use Supabase RLS appropriately.

Users should only be able to access conversations they are members of.

A user must not be able to manipulate another user's messages.

The application should not depend entirely on frontend JavaScript security.

Database permissions must enforce access.

Do not add unnecessary complicated encryption or enterprise security systems.

Keep it practical.

---

# 32. Error Handling

Handle:

* Invalid login
* Expired session
* Internet disconnected
* Supabase connection failure
* Realtime connection failure
* Message send failure
* Message edit failure
* Message deletion failure
* Search failure

Display friendly messages.

Example:

`Message failed to send. Tap to retry.`

Do not expose raw database errors to users.

---

# 33. Realtime Reconnection

If the internet temporarily disconnects:

Show:

`Connecting...`

When connection returns:

`Connected`

Automatically restore the realtime subscription.

Make sure messages are not duplicated after reconnection.

---

# 34. Duplicate Message Prevention

This is important.

Prevent duplicate messages caused by:

* Realtime events
* Retry attempts
* Network reconnection
* Browser refresh

Use appropriate unique IDs/idempotency mechanisms.

The same message must never appear twice because of a realtime reconnection.

---

# 35. Performance

Optimize the application for fast loading.

Avoid:

* Large JavaScript libraries
* Unnecessary API calls
* Polling
* Loading all messages
* Excessive database writes
* Excessive realtime subscriptions

The chat interface should feel instant.

---

# 36. Project Structure

Create a clean maintainable structure.

Example:

```text
/chat-app
│
├── index.html
├── login.html
├── chat.html
│
├── css/
│   ├── app.css
│   ├── login.css
│   └── chat.css
│
├── js/
│   ├── config.js
│   ├── auth.js
│   ├── supabase.js
│   ├── chat.js
│   ├── messages.js
│   ├── realtime.js
│   ├── notifications.js
│   ├── search.js
│   └── ui.js
│
└── assets/
    └── ...
```

Adjust the structure if a better architecture is identified during development.

Keep responsibilities separated.

---

# 37. Plesk Deployment

The finished application must be deployable to Plesk hosting.

Prepare the project so that:

1. Files can be uploaded to the domain/subdomain.
2. Supabase configuration can be added through a safe configuration mechanism.
3. HTTPS works correctly.
4. Browser notifications work under HTTPS.
5. Supabase realtime works from the hosted domain.

Do not require Node.js on the production Plesk server.

If a build step is required during development, make sure the final production files are deployable as static HTML/CSS/JS.

---

# 38. Supabase Setup Documentation

Create a clear setup document explaining:

1. How to create the Supabase project.
2. How to create the database tables.
3. How to create indexes.
4. How to configure RLS.
5. How to create the two initial users.
6. How to configure the initial conversation.
7. How to obtain the public Supabase project URL.
8. Where to place the public Supabase key.
9. How to deploy to Plesk.
10. How to test realtime messaging.

Never instruct the developer to put the Supabase service-role key into frontend JavaScript.

---

# 39. Database Migration

Create a complete SQL migration file.

Example:

```text
database/
└── schema.sql
```

The SQL should create:

* profiles
* conversations
* conversation_members
* messages
* message_reads
* indexes
* necessary constraints
* RLS policies

It should also create the initial:

`Sus ↔ Nethuki`

conversation structure.

Make the SQL safe to run on a fresh Supabase project.

---

# 40. Initial Application Flow

### Step 1

User opens the website.

If not logged in:

Show Login.

### Step 2

User enters username/password.

### Step 3

Authenticate.

### Step 4

Open the private conversation.

### Step 5

Load recent messages.

### Step 6

Subscribe to realtime events.

### Step 7

Show:

* Friend name
* Online/last seen
* Messages
* Composer

### Step 8

User sends message.

### Step 9

Other user receives it instantly.

### Step 10

Recipient opens/reads it.

### Step 11

Sender sees:

`✓✓`

---

# 41. UX Details

Add date separators.

For example:

`Today`

`Yesterday`

`August 15, 2026`

Group consecutive messages from the same user visually where appropriate.

Keep timestamps subtle.

Show message actions when hovering on desktop.

On mobile, use a long press or message menu button.

Make interactions easy with touch.

---

# 42. Accessibility

Implement basic accessibility:

* Proper buttons
* Keyboard navigation
* Focus states
* Accessible labels
* Sufficient text contrast
* Screen-reader-friendly controls

The message input should always be easy to access.

---

# 43. Browser Compatibility

Test the application in:

* Google Chrome
* Microsoft Edge
* Firefox
* Safari where possible
* Android Chrome
* iOS Safari

Pay particular attention to:

* Notifications
* Realtime connection
* Mobile keyboard behavior
* Viewport height
* Scrolling

---

# 44. Development Rules

Before implementing anything:

1. Inspect the existing project directory.
2. Do not overwrite unrelated files.
3. Create a clear architecture.
4. Build the database schema first.
5. Implement authentication.
6. Implement the chat UI.
7. Implement realtime messaging.
8. Implement read receipts.
9. Implement typing indicator.
10. Implement online/last-seen status.
11. Implement edit/reply/forward/search.
12. Implement notifications.
13. Implement responsive UI.
14. Test all realtime behavior.
15. Test mobile and desktop.
16. Perform a final code review.
17. Fix all discovered issues.

Do not mark a feature as completed without testing it.

---

# 45. Final Testing Checklist

Test at minimum:

### Authentication

* [ ] Sus can log in
* [ ] Nethuki can log in
* [ ] Invalid credentials are rejected
* [ ] Logout works
* [ ] Session persists correctly

### Messaging

* [ ] Sus can send messages
* [ ] Nethuki can send messages
* [ ] Messages appear realtime
* [ ] Enter sends
* [ ] Shift + Enter creates newline
* [ ] Empty messages cannot be sent

### Read Receipts

* [ ] Sent status works
* [ ] Read status works
* [ ] Unread count works

### Presence

* [ ] Online status works
* [ ] Last seen works
* [ ] Typing indicator works

### Message Actions

* [ ] Edit works
* [ ] Reply works
* [ ] Forward works
* [ ] Delete works
* [ ] Search works

### Notifications

* [ ] Browser permission works
* [ ] New message notification works
* [ ] Unread count works
* [ ] Notification does not repeatedly trigger incorrectly

### Responsive UI

* [ ] Mobile works
* [ ] Tablet works
* [ ] Desktop works
* [ ] Keyboard does not break composer
* [ ] Messages scroll correctly

### Realtime

* [ ] Reconnection works
* [ ] No duplicate messages
* [ ] No duplicate subscriptions
* [ ] Connection status is displayed correctly

---

# 46. Important Final Requirement

Do not over-engineer Version 1.

The goal is a **beautiful, extremely fast, private two-person text chat application**.

The application should feel like a real modern messenger, not a prototype.

At the same time, the underlying architecture must be future-ready so that the application can eventually become a full chat platform.

Prioritize:

1. Excellent mobile experience
2. Excellent desktop experience
3. Instant realtime messaging
4. Reliable message delivery
5. Clean UI
6. Simple architecture
7. Proper database structure
8. Easy Plesk deployment
9. Easy future expansion

After implementation, provide a final report containing:

* Completed features
* Database structure
* Supabase configuration
* Plesk deployment instructions
* Known limitations
* Future expansion recommendations
* Any bugs found and fixed
