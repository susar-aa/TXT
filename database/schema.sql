-- 1. Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS message_reads CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_members CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Create Tables

-- Profiles Table (No longer references auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    online_status TEXT DEFAULT 'offline', -- 'online' or 'offline'
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations Table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_type TEXT NOT NULL DEFAULT 'private',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Members Table
CREATE TABLE conversation_members (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

-- Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    forwarded_from_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Reads Table
CREATE TABLE message_reads (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

-- 4. Create Indexes for Performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_message_id);
CREATE INDEX idx_messages_forwarded_from ON messages(forwarded_from_message_id);
CREATE INDEX idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX idx_conversation_members_user_id ON conversation_members(user_id);
CREATE INDEX idx_profiles_username ON profiles(username);

-- 5. Row Level Security (RLS) setup
-- Since we removed logins, we must allow anonymous access to all tables.
-- Alternatively, you can disable RLS completely, but explicitly allowing anon is safer if you ever re-add auth.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all anon access to profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon access to conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon access to conversation_members" ON conversation_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon access to messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon access to message_reads" ON message_reads FOR ALL USING (true) WITH CHECK (true);

-- 6. Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Realtime configuration
-- Enable Realtime for messages, profiles, message_reads
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reads;

-- 8. INITIAL DATA SETUP (No logins needed)
-- We use fixed UUIDs for the two users so the frontend can easily switch identities

-- Insert Profiles
INSERT INTO profiles (id, username, display_name) VALUES 
('11111111-1111-1111-1111-111111111111', 'sus', 'Sus'),
('22222222-2222-2222-2222-222222222222', 'nethuki', 'Nethuki');

-- Insert Private Conversation
INSERT INTO conversations (id, conversation_type) VALUES 
('33333333-3333-3333-3333-333333333333', 'private');

-- Add Members to Conversation
INSERT INTO conversation_members (conversation_id, user_id) VALUES 
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222');
