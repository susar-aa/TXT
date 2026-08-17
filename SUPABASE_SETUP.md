# Supabase Setup Guide (No Logins)

This guide explains how to set up the backend for the Private Two-Person Realtime Chat Web Application using Supabase, optimized for a no-login public deployment.

## 1. Create Supabase Project
1. Go to [Supabase](https://supabase.com/) and sign in.
2. Click **New Project** and select an organization.
3. Enter a Project Name (e.g., `Private Chat App`) and a strong Database Password.
4. Select a region close to your deployment location and click **Create New Project**.

## 2. Apply Database Schema & Initial Data
1. Once your project is ready, go to the **SQL Editor** from the left sidebar.
2. Click **New query**.
3. Open the `database/schema.sql` file provided in this project.
4. Copy all its contents and paste them into the SQL Editor.
5. Click **Run** to execute the query. 
6. **That's it!** The SQL script already creates the tables, disables strict RLS (since there are no logins), enables Realtime, and automatically inserts the profiles for Sus and Nethuki.

## 3. Get Configuration Keys
1. Go to **Project Settings** (the gear icon) -> **API**.
2. Copy the **Project URL**.
3. Copy the **anon / public** key.
4. Open the `js/config.js` file in the web application.
5. Paste the URL and Anon Key into the respective variables.

## 4. Plesk Deployment
1. Log in to your Plesk hosting control panel.
2. Go to **Files** / **File Manager** for your domain or subdomain.
3. Upload all the files from this directory (`index.html`, `login.html`, `chat.html`, `css/`, `js/`) to the root document folder (e.g., `httpdocs`).
4. Ensure your domain has an SSL Certificate installed (via Let's Encrypt in Plesk). **HTTPS is mandatory** for the Browser Notification API and secure WebSockets used by Supabase Realtime to work correctly.

## 5. Testing Realtime
1. Open the deployed application (or `localhost`) in two different browsers (e.g., Chrome and Firefox) or one normal window and one Incognito window.
2. On one browser, click "I am Sus". On the other, click "I am Nethuki".
3. Send a message. It should appear instantly in the other browser without refreshing.
