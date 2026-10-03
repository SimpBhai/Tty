# 🛡️ AegisCord — Cryptographically Secured Private Communication Network

A high-performance, privacy-first Discord alternative built with **React 19**, **Express**, **Vite**, **TypeScript**, and **Tailwind CSS**. AegisCord features end-to-end encrypted messaging (AES-GCM-256), real-time WebRTC audio mesh voice lounges, strict Super Admin user provisioning, Group Admin moderation, and a profile image system.

---

## 🚀 Render Deployment Guide

AegisCord is pre-configured for deployment as a **Render Web Service** with zero configuration required.

### Method 1: Automated Blueprint Deployment (Recommended)

1. Push this repository to your GitHub account.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** → **Blueprint**.
3. Select your GitHub repository. Render will automatically detect `render.yaml`.
4. Render will generate a secure `SUPER_ADMIN_PASSWORD` or allow you to define your own.
5. Click **Apply**. Render will install dependencies, compile the production bundle (`dist/`), and start the Web Service.

---

### Method 2: Manual Web Service Setup

If you prefer to set up the Web Service manually on Render:

1. In the [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
2. Select your repository.
3. Configure the following build & start settings:
   - **Name**: `aegiscord` (or your preferred name)
   - **Region**: Choose the region closest to your users (e.g., `Oregon`, `Frankfurt`, `Singapore`)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: `Free` or higher

4. In the **Environment Variables** section, add:

| Variable Name | Recommended Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production bundle serving & optimizations |
| `SUPER_ADMIN_USERNAME` | `superadmin` | Super Administrator username handle |
| `SUPER_ADMIN_PASSWORD` | `YOUR_STRONG_SECRET_PASSWORD` | Secret password for root administrator access |
| `SUPER_ADMIN_TAG` | `0001` | 4-digit identifier tag for the Super Admin |

> **Note**: Render automatically assigns the `PORT` environment variable at runtime. The AegisCord server binds dynamically to `process.env.PORT || 3000`.

---

## 👑 Super Administrator Guide

### Accessing the Super Admin Account
1. Open your deployed website URL.
2. The **Access Gate** will appear.
3. Enter your configured `SUPER_ADMIN_USERNAME` (e.g. `superadmin`) and `SUPER_ADMIN_PASSWORD`.
4. Click **Sign In to AegisCord**.

### Provisioning New Operative Accounts
Because public registration is restricted, only the Super Administrator can mint new accounts:
1. Click the **Plus (+)** button in the left server navigation bar or select **Provision Operatives & Tags** from the server header dropdown.
2. Fill out the **Mint New Operative Account** form:
   - **Username**: Operative name (e.g. `Valkyrie`, `Cipher`, `Phoenix`).
   - **Access Password**: Type a custom password or click **Generate Strong** for a secure random password.
   - **4-Digit Tag**: Choose a custom tag or click **Randomize Tag**.
   - **Profile Picture**: Upload an image file (PNG/JPG) or paste an image URL.
   - **Avatar Color Badge**: Select a fallback identity color.
   - **Assign as Group Administrator**: Toggle this ON if this operative should have moderation privileges (deleting messages, kicking users from voice rooms).
   - **Base Roles**: Assign roles (e.g., `role-admin`, `role-vip`, `role-member`).
3. Click **Provision Operative & Generate E2EE Keys**.
4. The terminal will display the login credentials. Click **Copy Full Login Credentials** to send them to the user.

### Managing Existing Accounts in the Operatives Directory
In the Provisioning modal, switch to the **Operatives Directory & Role Assignment** tab:
- **Assign/Demote Group Admin**: Click **Assign Group Admin** or **Demote from Admin** next to any user to grant or revoke moderation privileges instantly.
- **Reset Password**: Click the **Key Icon** to specify a new password for that operative.
- **Revoke Operative Access**: Click the **Trash Icon** to ban and delete an account.

---

## 🛡️ Group Administrator Moderation Guide

Operatives assigned as **Group Administrators** (or granted the Security Admin role) can moderate communications:

### 1. Moderating Chat Messages
- **Delete Any Message**: Hover over (or tap on mobile) any message in any channel. Click the **Trash Can** icon to remove the message.
- Group Admins can clean up channels and remove disruptive communications. All deletions are recorded in the server's audit logs.

### 2. Moderating Voice Lounges (Kicking Users from Voice Calls)
- When in an encrypted voice lounge, Group Admins can see all active participants.
- Each participant card displays a red **Remove from Voice** button.
- Clicking **Remove from Voice** kicks the user from the audio session in real time via WebSockets, stopping their stream and displaying a system notification on their screen.
- In the **Member List** sidebar, Group Admins can also click on any active voice member's profile card and select **Disconnect from Voice Lounge**.

---

## 🖼️ Profile Image System

Users and administrators can customize their visual identity:

1. Click the **Settings Gear** at the bottom left of the channel sidebar (or choose **Profile Picture & Settings** from the operative popover).
2. Under **My Profile & Avatar**:
   - **Upload Image File**: Select any JPG, PNG, WebP, or GIF from your phone or computer. The image is compressed directly in the browser using HTML5 Canvas to an optimized format (~20KB) for instant loading.
   - **Direct Image URL**: Paste any hosted image link.
   - **Preset Tactical Avatars**: Choose from curated high-resolution cyberpunk/tactical presets.
   - **Fallback Color**: Select your fallback identity color if no image is used.
3. Click **Save Profile**. Your profile image is instantly updated across the chat area, member lists, voice loungers, and navigation docks!

---

## 🔒 Cryptographic Architecture

AegisCord implements zero-knowledge end-to-end encryption:
- **Client-Side Encryption**: Messages are encrypted in the browser using **AES-GCM-256** via the native `crypto.subtle` WebCrypto API before transmission.
- **Cipher Inspector**: Click the **Shield Icon** on any chat message to inspect the raw Base64 ciphertext, initialization vector (IV), and authentication tag side-by-side with client-decrypted plaintext.
- **Opus WebRTC Mesh**: Voice rooms use 48 kHz low-latency audio transmission with real-time waveform visualization.

---

## 📱 Mobile & PWA Support

- **Slide-Over Navigation Drawer**: On mobile screens (< 768px), navigation is accessible via the menu button in the chat header.
- **Member Directory Slide-Out**: Tap the member directory icon in the header to view online members without losing chat context.
- **Installable PWA**: Open the app in Chrome/Safari on iOS or Android, or navigate to **Settings → PWA App Install** to install AegisCord as a standalone home-screen application.

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start development server (Port 3000)
npm run dev

# 4. Production build test
npm run build
npm start
```
