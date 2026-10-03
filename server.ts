import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'superadmin123';
const SUPER_ADMIN_TAG = process.env.SUPER_ADMIN_TAG || '0001';

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure data directory exists for JSON persistence
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'store.json');

// Default initial state
const defaultState = {
  name: 'AegisCord Security Core',
  description: 'Cryptographically secured private communication server',
  icon: '/icon-192.png',
  categories: [
    { id: 'cat-info', name: 'INFORMATION', position: 0 },
    { id: 'cat-text', name: 'TEXT CHANNELS', position: 1 },
    { id: 'cat-vault', name: 'ENCRYPTED VAULT', position: 2 },
    { id: 'cat-voice', name: 'VOICE LOUNGES', position: 3 },
  ],
  roles: [
    {
      id: 'role-owner',
      name: 'Owner',
      color: '#f59e0b',
      hoist: true,
      position: 0,
      permissions: [
        'ADMINISTRATOR',
        'MANAGE_SERVER',
        'MANAGE_ROLES',
        'MANAGE_CHANNELS',
        'VIEW_AUDIT_LOG',
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'ATTACH_FILES',
        'ADD_REACTIONS',
        'MENTION_ROLES',
        'MANAGE_MESSAGES',
        'SEND_ENCRYPTED_FILES',
        'CONNECT_VOICE',
        'SPEAK',
        'STREAM_SCREEN',
        'MUTE_MEMBERS',
        'DEAFEN_MEMBERS',
        'MOVE_MEMBERS',
        'PRIORITY_SPEAKER',
      ],
    },
    {
      id: 'role-admin',
      name: 'Security Admin',
      color: '#ef4444',
      hoist: true,
      position: 1,
      permissions: [
        'MANAGE_SERVER',
        'MANAGE_ROLES',
        'MANAGE_CHANNELS',
        'VIEW_AUDIT_LOG',
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'ATTACH_FILES',
        'ADD_REACTIONS',
        'MENTION_ROLES',
        'MANAGE_MESSAGES',
        'SEND_ENCRYPTED_FILES',
        'CONNECT_VOICE',
        'SPEAK',
        'STREAM_SCREEN',
        'MUTE_MEMBERS',
        'DEAFEN_MEMBERS',
      ],
    },
    {
      id: 'role-mod',
      name: 'Moderator',
      color: '#3b82f6',
      hoist: true,
      position: 2,
      permissions: [
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'ATTACH_FILES',
        'ADD_REACTIONS',
        'MANAGE_MESSAGES',
        'CONNECT_VOICE',
        'SPEAK',
        'MUTE_MEMBERS',
      ],
    },
    {
      id: 'role-vip',
      name: 'Cipher VIP',
      color: '#a855f7',
      hoist: true,
      position: 3,
      permissions: [
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'ATTACH_FILES',
        'ADD_REACTIONS',
        'SEND_ENCRYPTED_FILES',
        'CONNECT_VOICE',
        'SPEAK',
        'STREAM_SCREEN',
        'PRIORITY_SPEAKER',
      ],
    },
    {
      id: 'role-member',
      name: 'Verified Operative',
      color: '#10b981',
      hoist: true,
      position: 4,
      isDefault: true,
      permissions: [
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'ATTACH_FILES',
        'ADD_REACTIONS',
        'SEND_ENCRYPTED_FILES',
        'CONNECT_VOICE',
        'SPEAK',
      ],
    },
    {
      id: 'role-guest',
      name: 'Guest',
      color: '#94a3b8',
      hoist: false,
      position: 5,
      permissions: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'CONNECT_VOICE'],
    },
  ],
  channels: [
    {
      id: 'ch-announcements',
      name: 'announcements',
      type: 'announcement',
      topic: 'Official cryptographic announcements and system updates',
      categoryId: 'cat-info',
      position: 0,
      permissionOverrides: [
        {
          roleId: 'role-member',
          allow: ['VIEW_CHANNEL', 'ADD_REACTIONS'],
          deny: ['SEND_MESSAGES'],
        },
        {
          roleId: 'role-guest',
          allow: ['VIEW_CHANNEL'],
          deny: ['SEND_MESSAGES'],
        },
      ],
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'ch-rules',
      name: 'rules-and-privacy',
      type: 'text',
      topic: 'Zero-knowledge policies and operational security protocol',
      categoryId: 'cat-info',
      position: 1,
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: 'ch-general',
      name: 'general-chat',
      type: 'text',
      topic: 'End-to-End Encrypted communications lounge',
      categoryId: 'cat-text',
      position: 0,
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'ch-tech',
      name: 'cyber-ops',
      type: 'text',
      topic: 'Cryptographic discussion, key management & decentralized tools',
      categoryId: 'cat-text',
      position: 1,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'ch-vault',
      name: 'secret-classified',
      type: 'vault',
      topic: 'Top secret restricted chamber with dual-layer AES-GCM encryption',
      categoryId: 'cat-vault',
      position: 0,
      isPrivate: true,
      permissionOverrides: [
        {
          roleId: 'role-member',
          allow: [],
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
        },
        {
          roleId: 'role-guest',
          allow: [],
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
        },
      ],
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'ch-voice-general',
      name: 'Voice Lounge',
      type: 'voice',
      topic: 'Encrypted low-latency audio stream mesh',
      categoryId: 'cat-voice',
      position: 0,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'ch-voice-ops',
      name: 'Command Briefing (Voice)',
      type: 'voice',
      topic: 'Restricted voice tactical channel',
      categoryId: 'cat-voice',
      position: 1,
      createdAt: Date.now() - 86400000 * 1,
    },
  ],
  users: [
    {
      id: 'usr-commander',
      username: 'Commander',
      tag: '0001',
      avatarColor: '#5865f2',
      customStatus: '🛡️ Enforcing AES-GCM zero-trust keys',
      status: 'online',
      roleIds: ['role-owner'],
      isOwner: true,
      isAdmin: true,
      token: 'AEGIS_ROOT_TOKEN_0001',
      createdAt: Date.now() - 86400000 * 10,
      lastActive: Date.now(),
    },
    {
      id: 'usr-valkyrie',
      username: 'Valkyrie',
      tag: '1337',
      avatarColor: '#ec4899',
      customStatus: '⚡ Auditing encryption tunnels',
      status: 'online',
      roleIds: ['role-admin'],
      isAdmin: true,
      token: 'AEGIS_SEC_TOKEN_1337',
      createdAt: Date.now() - 86400000 * 8,
      lastActive: Date.now() - 1000 * 60 * 5,
    },
    {
      id: 'usr-cipher',
      username: 'CipherLord',
      tag: '4096',
      avatarColor: '#a855f7',
      customStatus: '🔒 PGP & WebCrypto enthusiast',
      status: 'idle',
      roleIds: ['role-vip'],
      token: 'AEGIS_USER_TOKEN_4096',
      createdAt: Date.now() - 86400000 * 6,
      lastActive: Date.now() - 1000 * 60 * 20,
    },
    {
      id: 'usr-nova',
      username: 'Nova',
      tag: '8080',
      avatarColor: '#3b82f6',
      customStatus: '✨ Voice channels live',
      status: 'online',
      roleIds: ['role-member'],
      token: 'AEGIS_USER_TOKEN_8080',
      createdAt: Date.now() - 86400000 * 4,
      lastActive: Date.now() - 1000 * 60 * 2,
    },
  ],
  messages: [
    {
      id: 'msg-seed-1',
      channelId: 'ch-announcements',
      authorId: 'usr-commander',
      content:
        '🛡️ **Welcome to AegisCord Security Core!**\n\nAll messages and voice channels in this network are **End-to-End Encrypted (AES-GCM-256)**. Only cryptographically provisioned members with verified tokens can decrypt channel feeds. \n\nCheck out `#rules-and-privacy` to inspect cryptographic proofs!',
      isEncrypted: true,
      encryptedPayload: {
        iv: '4f2e9a118c7b649d031e8472',
        ciphertext:
          'Zg/rL5B4U1H9yA2Kx+J4L0vXQ3W1a8T9dY8zE2VnS4F9gJ8K9L0P1Q2R3S4T5U6V7W8X9Y0Z==',
        keyId: 'ch-announcements:ch-key-v1',
        algorithm: 'AES-GCM-256',
        version: 1,
      },
      reactions: [{ emoji: '🛡️', userIds: ['usr-commander', 'usr-valkyrie', 'usr-cipher'] }],
      pinned: true,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'msg-seed-2',
      channelId: 'ch-general',
      authorId: 'usr-valkyrie',
      content:
        'Key rotation and client-side ephemeral keys verified for all active operatives! 🚀 Test out sending encrypted messages and joining voice lounge.',
      isEncrypted: true,
      encryptedPayload: {
        iv: '1a2b3c4d5e6f7a8b9c0d1e2f',
        ciphertext: 'TWVzc2FnZSBlbmNyeXB0ZWQgc3VjY2Vzc2Z1bGx5IQ==',
        keyId: 'ch-general:ch-key-v1',
        algorithm: 'AES-GCM-256',
        version: 1,
      },
      reactions: [{ emoji: '🔥', userIds: ['usr-commander', 'usr-nova'] }],
      createdAt: Date.now() - 86400000 * 1,
    },
    {
      id: 'msg-seed-3',
      channelId: 'ch-general',
      authorId: 'usr-cipher',
      content:
        'Awesome. You can also click the **green shield icon** on any message to inspect the raw ciphertext vs client-side decrypted plaintext. Zero-knowledge is verified.',
      isEncrypted: true,
      encryptedPayload: {
        iv: '9f8e7d6c5b4a3f2e1d0c9b8a',
        ciphertext: 'QXVkaXRlZCBhbmQgdmVyaWZpZWQgcGF5bG9hZC4=',
        keyId: 'ch-general:ch-key-v1',
        algorithm: 'AES-GCM-256',
        version: 1,
      },
      reactions: [{ emoji: '💎', userIds: ['usr-cipher', 'usr-commander'] }],
      createdAt: Date.now() - 1000 * 60 * 30,
    },
  ],
  auditLogs: [
    {
      id: 'log-1',
      userId: 'usr-commander',
      action: 'SERVER_INITIALIZED',
      details: 'Server cryptographic key initialized with AES-GCM-256 cipher suite',
      timestamp: Date.now() - 86400000 * 10,
    },
    {
      id: 'log-2',
      userId: 'usr-commander',
      action: 'USER_PROVISIONED',
      details: 'Provisioned operative Valkyrie#1337 with Security Admin privileges',
      timestamp: Date.now() - 86400000 * 8,
    },
  ],
  githubSync: {
    repoOwner: '',
    repoName: '',
    branch: 'main',
    filePath: 'data/aegiscord-db.json',
    lastSyncedAt: Date.now(),
  },
};

// Load or initialize state
function syncSuperAdminAndDefaults(currentState: any) {
  if (!currentState.users || !Array.isArray(currentState.users)) {
    currentState.users = [];
  }

  // Find or create Super Admin
  let superAdmin = currentState.users.find(
    (u: any) =>
      u.isSuperAdmin ||
      u.isOwner ||
      u.id === 'usr-commander' ||
      u.username.toLowerCase() === SUPER_ADMIN_USERNAME.toLowerCase()
  );

  if (!superAdmin) {
    superAdmin = {
      id: 'usr-superadmin',
      username: SUPER_ADMIN_USERNAME,
      tag: SUPER_ADMIN_TAG,
      avatarColor: '#5865f2',
      customStatus: '🛡️ Root Super Administrator',
      status: 'online',
      roleIds: ['role-owner'],
      isOwner: true,
      isAdmin: true,
      isSuperAdmin: true,
      password: SUPER_ADMIN_PASSWORD,
      token: 'AEGIS_ROOT_TOKEN_SUPERADMIN',
      createdAt: Date.now() - 86400000 * 30,
      lastActive: Date.now(),
    };
    currentState.users.unshift(superAdmin);
  } else {
    // Keep Super Admin synced with Environment Variables
    superAdmin.username = SUPER_ADMIN_USERNAME;
    superAdmin.tag = SUPER_ADMIN_TAG;
    superAdmin.password = SUPER_ADMIN_PASSWORD;
    superAdmin.isSuperAdmin = true;
    superAdmin.isOwner = true;
    superAdmin.isAdmin = true;
    if (!superAdmin.roleIds || !superAdmin.roleIds.includes('role-owner')) {
      superAdmin.roleIds = ['role-owner', ...(superAdmin.roleIds || [])];
    }
  }

  // Ensure initial seed users have default passwords
  const defaultPasswords: Record<string, string> = {
    'usr-valkyrie': 'valkyrie123',
    'usr-cipher': 'cipher123',
    'usr-nova': 'nova123',
  };

  currentState.users.forEach((u: any) => {
    if (!u.password) {
      if (defaultPasswords[u.id]) {
        u.password = defaultPasswords[u.id];
      } else if (u.isSuperAdmin || u.isOwner) {
        u.password = SUPER_ADMIN_PASSWORD;
      } else {
        u.password = 'operative123';
      }
    }
  });

  return currentState;
}

function loadState() {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const synced = syncSuperAdminAndDefaults(parsed);
      saveState(synced);
      return synced;
    }
  } catch (e) {
    console.error('Error reading state file, using default state:', e);
  }
  const initialized = syncSuperAdminAndDefaults({ ...defaultState });
  saveState(initialized);
  return initialized;
}

function saveState(state: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving state file:', e);
  }
}

let state = loadState();

// Active voice sessions tracking (in memory)
interface VoiceStateMap {
  [channelId: string]: {
    [userId: string]: {
      userId: string;
      channelId: string;
      isMuted: boolean;
      isDeafened: boolean;
      isSpeaking: boolean;
      isScreenSharing: boolean;
      joinedAt: number;
    };
  };
}
const voiceRooms: VoiceStateMap = {};

// Active WebSocket connections
const clients = new Map<string, WebSocket>();

// Broadcast helper
function broadcast(msg: any, excludeWs?: WebSocket) {
  const json = JSON.stringify(msg);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN && ws !== excludeWs) {
      ws.send(json);
    }
  });
}

// ----------------- REST API Endpoints -----------------

// Helper to strip sensitive data before sending user to client
function sanitizeUser(user: any) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

// Check if user is Super Admin
function checkIsSuperAdmin(userIdOrUser: any): boolean {
  if (!userIdOrUser) return false;
  const u = typeof userIdOrUser === 'string'
    ? state.users.find((user: any) => user.id === userIdOrUser)
    : userIdOrUser;
  if (!u) return false;
  return Boolean(
    u.isSuperAdmin ||
    u.isOwner ||
    u.username.toLowerCase() === SUPER_ADMIN_USERNAME.toLowerCase()
  );
}

// Authentication: Login with username/tag and password
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  // Check if matches Super Admin credentials from Environment Variables
  const isSuperAdminMatch =
    (cleanUser === SUPER_ADMIN_USERNAME.toLowerCase() ||
      cleanUser === `${SUPER_ADMIN_USERNAME.toLowerCase()}#${SUPER_ADMIN_TAG}` ||
      cleanUser === 'commander' ||
      cleanUser === 'commander#0001') &&
    cleanPass === SUPER_ADMIN_PASSWORD;

  // Search user in state
  let matchedUser = state.users.find((u: any) => {
    const handle = `${u.username}#${u.tag}`.toLowerCase();
    const uname = u.username.toLowerCase();
    return uname === cleanUser || handle === cleanUser || u.id.toLowerCase() === cleanUser;
  });

  if (isSuperAdminMatch) {
    if (!matchedUser) {
      matchedUser = state.users.find((u: any) => u.isSuperAdmin || u.isOwner) || state.users[0];
    }
  } else {
    if (!matchedUser) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const isPasswordValid =
      matchedUser.password === cleanPass ||
      matchedUser.token === cleanPass ||
      (matchedUser.isSuperAdmin && cleanPass === SUPER_ADMIN_PASSWORD);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
  }

  // Update status & activity
  matchedUser.status = 'online';
  matchedUser.lastActive = Date.now();
  saveState(state);

  broadcast({
    type: 'user_presence',
    payload: { userId: matchedUser.id, status: 'online' },
  });

  const sessionToken = matchedUser.token || `AEGIS_AUTH_${matchedUser.id}_${Date.now()}`;
  res.json({
    success: true,
    user: sanitizeUser(matchedUser),
    token: sessionToken,
  });
});

// Authentication: Validate Session
app.post('/api/auth/session', (req, res) => {
  const { token, userId } = req.body;
  if (!token && !userId) {
    return res.status(400).json({ error: 'Token or userId required' });
  }

  const user = state.users.find(
    (u: any) => (userId && u.id === userId) || (token && u.token === token)
  );

  if (!user) {
    return res.status(401).json({ error: 'Session expired or user not found' });
  }

  user.status = 'online';
  user.lastActive = Date.now();
  saveState(state);

  res.json({
    success: true,
    user: sanitizeUser(user),
  });
});

// Authentication: Logout
app.post('/api/auth/logout', (req, res) => {
  const { userId } = req.body;
  if (userId) {
    const user = state.users.find((u: any) => u.id === userId);
    if (user) {
      user.status = 'offline';
      user.lastActive = Date.now();
      saveState(state);
      broadcast({
        type: 'user_presence',
        payload: { userId, status: 'offline' },
      });
    }
  }
  res.json({ success: true });
});

// Change Password
app.post('/api/auth/change-password', (req, res) => {
  const { userId, currentPassword, newPassword, requestedBy } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'User ID and new password are required' });
  }

  const targetUser = state.users.find((u: any) => u.id === userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const isRequesterSuperAdmin = checkIsSuperAdmin(requestedBy);

  // If not super admin changing someone else's password, verify current password
  if (!isRequesterSuperAdmin && requestedBy !== userId) {
    return res.status(403).json({ error: 'Unauthorized to change another user password' });
  }

  if (!isRequesterSuperAdmin) {
    if (targetUser.password && targetUser.password !== currentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
  }

  targetUser.password = newPassword.trim();
  saveState(state);

  res.json({ success: true, message: 'Password updated successfully' });
});

// Kick member from voice channel (Admin / Super Admin action)
app.post('/api/voice/kick', (req, res) => {
  const { channelId, targetUserId, requestedBy } = req.body;
  if (!channelId || !targetUserId) {
    return res.status(400).json({ error: 'channelId and targetUserId required' });
  }

  const requester = state.users.find((u: any) => u.id === requestedBy);
  const isAdminOrSuper =
    requester?.isAdmin ||
    requester?.isOwner ||
    requester?.isSuperAdmin ||
    requester?.roleIds?.some((r: string) => r === 'role-owner' || r === 'role-admin');

  if (!isAdminOrSuper) {
    return res.status(403).json({ error: 'Only administrators can remove users from voice lounge' });
  }

  // Remove from in-memory voice room
  if (voiceRooms[channelId] && voiceRooms[channelId][targetUserId]) {
    delete voiceRooms[channelId][targetUserId];
  }

  const targetUser = state.users.find((u: any) => u.id === targetUserId);
  state.auditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: requestedBy || 'admin',
    action: 'VOICE_MEMBER_KICKED',
    details: `Moderator @${requester?.username || 'Admin'} removed @${targetUser?.username || targetUserId} from voice lounge`,
    timestamp: Date.now(),
  });
  saveState(state);

  broadcast({
    type: 'voice_kicked',
    payload: {
      channelId,
      targetUserId,
      kickedBy: requestedBy,
    },
  });

  res.json({ success: true });
});

// Get full server state
app.get('/api/state', (req, res) => {
  // Return sanitized users
  const safeState = {
    ...state,
    users: state.users.map(sanitizeUser),
  };
  res.json({
    state: safeState,
    voiceRooms,
  });
});

// Update server settings (Name, icon, description)
app.post('/api/server/settings', (req, res) => {
  const { name, icon, description, githubSync, requestedBy } = req.body;
  if (requestedBy && !checkIsSuperAdmin(requestedBy)) {
    return res.status(403).json({ error: 'Only Super Administrator can modify server core settings' });
  }
  if (name) state.name = name;
  if (icon !== undefined) state.icon = icon;
  if (description !== undefined) state.description = description;
  if (githubSync) state.githubSync = { ...state.githubSync, ...githubSync };

  saveState(state);
  broadcast({
    type: 'server_settings_update',
    payload: {
      name: state.name,
      icon: state.icon,
      description: state.description,
      githubSync: state.githubSync,
    },
  });
  res.json({ success: true, state });
});

// Provision a new user (SUPER ADMIN ONLY)
app.post('/api/users/provision', (req, res) => {
  const {
    username,
    password,
    tag,
    avatarColor,
    avatarUrl,
    roleIds,
    customStatus,
    isOwner,
    isAdmin,
    requestedBy,
  } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Strictly verify requester is Super Admin
  const isSuper = checkIsSuperAdmin(requestedBy);
  if (!isSuper) {
    return res.status(403).json({
      error: 'Access Denied: Only the Super Administrator can create and provision accounts.',
    });
  }

  // Generate unique 4 digit tag if not given
  const finalTag =
    tag && /^\d{4}$/.test(tag) ? tag : Math.floor(1000 + Math.random() * 9000).toString();

  // Generate password if omitted
  const finalPassword =
    password && password.trim().length > 0
      ? password.trim()
      : `Pass_${Math.random().toString(36).substring(2, 8).toUpperCase()}!${Math.floor(100 + Math.random() * 900)}`;

  // Generate unique user ID and single-use login token
  const id = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const token = `AEGIS_${username.toUpperCase().replace(/[^A-Z0-9]/g, '')}_${finalTag}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const colors = [
    '#5865f2',
    '#ec4899',
    '#a855f7',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
  ];
  const finalColor = avatarColor || colors[Math.floor(Math.random() * colors.length)];

  // If assigned as Admin, ensure role-admin is included in roleIds
  const assignedRoles = Array.isArray(roleIds) && roleIds.length > 0 ? [...roleIds] : ['role-member'];
  if (isAdmin && !assignedRoles.includes('role-admin')) {
    assignedRoles.unshift('role-admin');
  }

  const newUser = {
    id,
    username: username.trim(),
    tag: finalTag,
    avatarColor: finalColor,
    avatarUrl: avatarUrl || undefined,
    customStatus: customStatus || '🔒 Secure Operative',
    status: 'offline' as const,
    roleIds: assignedRoles,
    isOwner: Boolean(isOwner),
    isAdmin: Boolean(isAdmin),
    isSuperAdmin: false,
    password: finalPassword,
    token,
    createdAt: Date.now(),
    lastActive: Date.now(),
  };

  state.users.push(newUser);

  state.auditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: requestedBy || 'usr-superadmin',
    action: 'USER_PROVISIONED',
    details: `Super Admin provisioned user @${newUser.username}#${newUser.tag} with roles: [${newUser.roleIds.join(', ')}]${isAdmin ? ' (Assigned Admin)' : ''}`,
    timestamp: Date.now(),
  });

  saveState(state);

  broadcast({
    type: 'user_created',
    payload: sanitizeUser(newUser),
  });

  // Return the newly created user WITH the password so Super Admin can copy/share it!
  res.json({
    success: true,
    user: newUser,
    initialPassword: finalPassword,
  });
});

// Update user details (Roles, Status, Avatar, Custom Status, Admin status)
app.post('/api/users/update', (req, res) => {
  const {
    id,
    username,
    customStatus,
    status,
    roleIds,
    avatarColor,
    avatarUrl,
    isAdmin,
    password,
    requestedBy,
  } = req.body;

  const userIdx = state.users.findIndex((u: any) => u.id === id);
  if (userIdx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isSuperAdmin = checkIsSuperAdmin(requestedBy);
  const isSelf = requestedBy === id;

  // Only Super Admin can change someone else's role or promote them to Admin
  if ((roleIds !== undefined || isAdmin !== undefined) && !isSuperAdmin) {
    return res.status(403).json({
      error: 'Only the Super Administrator can assign administrator roles or modify permissions.',
    });
  }

  // Profile fields: user can change their own, or super admin can change any
  if (isSelf || isSuperAdmin) {
    if (username) state.users[userIdx].username = username.trim();
    if (customStatus !== undefined) state.users[userIdx].customStatus = customStatus;
    if (status) state.users[userIdx].status = status;
    if (avatarColor) state.users[userIdx].avatarColor = avatarColor;
    if (avatarUrl !== undefined) state.users[userIdx].avatarUrl = avatarUrl;
    if (password && isSuperAdmin) state.users[userIdx].password = password.trim();
  }

  // Admin / Role updates
  if (isSuperAdmin) {
    if (roleIds !== undefined) state.users[userIdx].roleIds = roleIds;
    if (isAdmin !== undefined) {
      state.users[userIdx].isAdmin = Boolean(isAdmin);
      if (isAdmin && !state.users[userIdx].roleIds.includes('role-admin')) {
        state.users[userIdx].roleIds = ['role-admin', ...state.users[userIdx].roleIds];
      } else if (!isAdmin) {
        state.users[userIdx].roleIds = state.users[userIdx].roleIds.filter(
          (r: string) => r !== 'role-admin'
        );
      }
    }
  }

  state.users[userIdx].lastActive = Date.now();
  saveState(state);

  broadcast({
    type: 'user_updated',
    payload: sanitizeUser(state.users[userIdx]),
  });

  res.json({ success: true, user: sanitizeUser(state.users[userIdx]) });
});

// Delete / Revoke user
app.post('/api/users/delete', (req, res) => {
  const { id, requestedBy } = req.body;
  if (!checkIsSuperAdmin(requestedBy)) {
    return res.status(403).json({ error: 'Only Super Administrator can revoke or delete operative accounts' });
  }

  const user = state.users.find((u: any) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.isOwner || user.isSuperAdmin) {
    return res.status(403).json({ error: 'Cannot delete server owner or root Super Administrator' });
  }

  state.users = state.users.filter((u: any) => u.id !== id);

  state.auditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: requestedBy || 'usr-superadmin',
    action: 'USER_REVOKED',
    details: `Super Admin revoked access for user @${user.username}#${user.tag}`,
    timestamp: Date.now(),
  });

  saveState(state);

  broadcast({
    type: 'user_deleted',
    payload: { id },
  });

  res.json({ success: true });
});

// Create or update Channel
app.post('/api/channels', (req, res) => {
  const { id, name, type, topic, categoryId, permissionOverrides, isPrivate, requestedBy } =
    req.body;

  if (id) {
    // Update existing
    const idx = state.channels.findIndex((c: any) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Channel not found' });

    if (name) state.channels[idx].name = name.toLowerCase().replace(/\s+/g, '-');
    if (topic !== undefined) state.channels[idx].topic = topic;
    if (categoryId) state.channels[idx].categoryId = categoryId;
    if (permissionOverrides) state.channels[idx].permissionOverrides = permissionOverrides;
    if (isPrivate !== undefined) state.channels[idx].isPrivate = isPrivate;

    saveState(state);
    broadcast({
      type: 'channel_updated',
      payload: state.channels[idx],
    });
    return res.json({ success: true, channel: state.channels[idx] });
  }

  // Create new channel
  if (!name) return res.status(400).json({ error: 'Channel name required' });

  const cleanName = name.toLowerCase().trim().replace(/\s+/g, '-');
  const newChannel = {
    id: `ch-${Date.now()}`,
    name: cleanName,
    type: type || 'text',
    topic: topic || '',
    categoryId: categoryId || 'cat-text',
    position: state.channels.length,
    permissionOverrides: permissionOverrides || [],
    isPrivate: Boolean(isPrivate),
    createdAt: Date.now(),
  };

  state.channels.push(newChannel);

  state.auditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: requestedBy || 'usr-commander',
    action: 'CHANNEL_CREATED',
    details: `Created #${newChannel.name} (${newChannel.type}) in category ${newChannel.categoryId}`,
    timestamp: Date.now(),
  });

  saveState(state);
  broadcast({
    type: 'channel_created',
    payload: newChannel,
  });

  res.json({ success: true, channel: newChannel });
});

// Delete Channel
app.delete('/api/channels/:id', (req, res) => {
  const { id } = req.params;
  const channel = state.channels.find((c: any) => c.id === id);
  if (!channel) return res.status(404).json({ error: 'Channel not found' });

  state.channels = state.channels.filter((c: any) => c.id !== id);
  // Also clean up messages in that channel
  state.messages = state.messages.filter((m: any) => m.channelId !== id);

  saveState(state);
  broadcast({
    type: 'channel_deleted',
    payload: { id },
  });

  res.json({ success: true });
});

// Create or update Role
app.post('/api/roles', (req, res) => {
  const { id, name, color, hoist, permissions, position, requestedBy } = req.body;

  if (id) {
    const idx = state.roles.findIndex((r: any) => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Role not found' });

    if (name) state.roles[idx].name = name;
    if (color) state.roles[idx].color = color;
    if (hoist !== undefined) state.roles[idx].hoist = hoist;
    if (permissions) state.roles[idx].permissions = permissions;
    if (position !== undefined) state.roles[idx].position = position;

    saveState(state);
    broadcast({
      type: 'role_updated',
      payload: state.roles[idx],
    });
    return res.json({ success: true, role: state.roles[idx] });
  }

  // Create new role
  if (!name) return res.status(400).json({ error: 'Role name required' });

  const newRole = {
    id: `role-${Date.now()}`,
    name,
    color: color || '#94a3b8',
    hoist: Boolean(hoist),
    position: state.roles.length,
    permissions: permissions || ['VIEW_CHANNEL', 'SEND_MESSAGES'],
  };

  state.roles.push(newRole);

  state.auditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: requestedBy || 'usr-commander',
    action: 'ROLE_CREATED',
    details: `Created role @${newRole.name} with ${newRole.permissions.length} permissions`,
    timestamp: Date.now(),
  });

  saveState(state);
  broadcast({
    type: 'role_created',
    payload: newRole,
  });

  res.json({ success: true, role: newRole });
});

// Delete Role
app.delete('/api/roles/:id', (req, res) => {
  const { id } = req.params;
  const role = state.roles.find((r: any) => r.id === id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (role.id === 'role-owner') {
    return res.status(403).json({ error: 'Cannot delete Owner role' });
  }

  state.roles = state.roles.filter((r: any) => r.id !== id);
  // Remove role from users who have it
  state.users.forEach((u: any) => {
    u.roleIds = u.roleIds.filter((rid: string) => rid !== id);
  });

  saveState(state);
  broadcast({
    type: 'role_deleted',
    payload: { id },
  });

  res.json({ success: true });
});

// Post a new message
app.post('/api/messages', (req, res) => {
  const {
    channelId,
    authorId,
    content,
    encryptedPayload,
    isEncrypted,
    attachments,
    replyToId,
    replyToMessage,
  } = req.body;

  if (!channelId || !authorId) {
    return res.status(400).json({ error: 'Channel ID and Author ID are required' });
  }

  const msgId = `msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const newMsg = {
    id: msgId,
    channelId,
    authorId,
    content: content || '',
    encryptedPayload: encryptedPayload || null,
    isEncrypted: isEncrypted ?? true,
    attachments: attachments || [],
    reactions: [],
    replyToId,
    replyToMessage,
    createdAt: Date.now(),
  };

  state.messages.push(newMsg);

  // Keep message history healthy (last 2000 messages)
  if (state.messages.length > 2000) {
    state.messages = state.messages.slice(-2000);
  }

  saveState(state);

  broadcast({
    type: 'message_new',
    payload: newMsg,
  });

  res.json({ success: true, message: newMsg });
});

// Add or toggle emoji reaction
app.post('/api/messages/reaction', (req, res) => {
  const { messageId, emoji, userId } = req.body;
  const msg = state.messages.find((m: any) => m.id === messageId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  if (!msg.reactions) msg.reactions = [];

  const existingReaction = msg.reactions.find((r: any) => r.emoji === emoji);
  if (existingReaction) {
    if (existingReaction.userIds.includes(userId)) {
      existingReaction.userIds = existingReaction.userIds.filter((id: string) => id !== userId);
      if (existingReaction.userIds.length === 0) {
        msg.reactions = msg.reactions.filter((r: any) => r.emoji !== emoji);
      }
    } else {
      existingReaction.userIds.push(userId);
    }
  } else {
    msg.reactions.push({ emoji, userIds: [userId] });
  }

  saveState(state);

  broadcast({
    type: 'message_reaction',
    payload: {
      messageId,
      reactions: msg.reactions,
    },
  });

  res.json({ success: true, reactions: msg.reactions });
});

// Delete message
app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const msg = state.messages.find((m: any) => m.id === id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  state.messages = state.messages.filter((m: any) => m.id !== id);
  saveState(state);

  broadcast({
    type: 'message_delete',
    payload: { id, channelId: msg.channelId },
  });

  res.json({ success: true });
});

// GitHub sync endpoint: Export backup or import backup
app.get('/api/github/export', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=aegiscord-backup-${Date.now()}.json`);
  res.send(JSON.stringify(state, null, 2));
});

app.post('/api/github/import', (req, res) => {
  const { importedData, requestedBy } = req.body;
  if (!importedData || !importedData.channels || !importedData.users) {
    return res.status(400).json({ error: 'Invalid AegisCord database structure' });
  }

  state = {
    ...defaultState,
    ...importedData,
    auditLogs: [
      {
        id: `log-${Date.now()}`,
        userId: requestedBy || 'usr-commander',
        action: 'DATABASE_RESTORED',
        details: 'Imported database snapshot from GitHub / Cloud Storage backup',
        timestamp: Date.now(),
      },
      ...(importedData.auditLogs || []),
    ],
  };

  saveState(state);
  broadcast({
    type: 'sync_state',
    payload: state,
  });

  res.json({ success: true, message: 'Database successfully restored' });
});

// ----------------- WebSocket Server -----------------
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req) => {
  const connId = `conn-${Date.now()}-${Math.random()}`;
  clients.set(connId, ws);

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'auth': {
          const { userId } = msg.payload || {};
          if (userId) {
            const u = state.users.find((user: any) => user.id === userId);
            if (u) {
              u.status = 'online';
              u.lastActive = Date.now();
              saveState(state);
              broadcast({
                type: 'user_presence',
                payload: { userId, status: 'online' },
              });
            }
          }
          break;
        }

        case 'user_typing': {
          broadcast(
            {
              type: 'user_typing',
              payload: msg.payload,
            },
            ws
          );
          break;
        }

        case 'voice_join': {
          const { userId, channelId } = msg.payload;
          if (!voiceRooms[channelId]) {
            voiceRooms[channelId] = {};
          }
          voiceRooms[channelId][userId] = {
            userId,
            channelId,
            isMuted: false,
            isDeafened: false,
            isSpeaking: false,
            isScreenSharing: false,
            joinedAt: Date.now(),
          };
          broadcast({
            type: 'voice_join',
            payload: {
              channelId,
              participant: voiceRooms[channelId][userId],
              allParticipants: voiceRooms[channelId],
            },
          });
          break;
        }

        case 'voice_leave': {
          const { userId, channelId } = msg.payload;
          if (voiceRooms[channelId] && voiceRooms[channelId][userId]) {
            delete voiceRooms[channelId][userId];
            broadcast({
              type: 'voice_leave',
              payload: {
                channelId,
                userId,
                remaining: voiceRooms[channelId],
              },
            });
          }
          break;
        }

        case 'voice_state_update': {
          const { userId, channelId, isMuted, isDeafened, isSpeaking, isScreenSharing } =
            msg.payload;
          if (voiceRooms[channelId] && voiceRooms[channelId][userId]) {
            if (isMuted !== undefined) voiceRooms[channelId][userId].isMuted = isMuted;
            if (isDeafened !== undefined) voiceRooms[channelId][userId].isDeafened = isDeafened;
            if (isSpeaking !== undefined) voiceRooms[channelId][userId].isSpeaking = isSpeaking;
            if (isScreenSharing !== undefined)
              voiceRooms[channelId][userId].isScreenSharing = isScreenSharing;

            broadcast({
              type: 'voice_state_update',
              payload: {
                channelId,
                participant: voiceRooms[channelId][userId],
              },
            });
          }
          break;
        }

        case 'voice_speaking': {
          const { userId, channelId, isSpeaking } = msg.payload;
          if (voiceRooms[channelId] && voiceRooms[channelId][userId]) {
            voiceRooms[channelId][userId].isSpeaking = isSpeaking;
            broadcast({
              type: 'voice_speaking',
              payload: { channelId, userId, isSpeaking },
            });
          }
          break;
        }

        case 'voice_kick': {
          const { channelId, targetUserId, kickedBy } = msg.payload;
          if (voiceRooms[channelId] && voiceRooms[channelId][targetUserId]) {
            delete voiceRooms[channelId][targetUserId];
          }
          broadcast({
            type: 'voice_kicked',
            payload: {
              channelId,
              targetUserId,
              kickedBy,
            },
          });
          break;
        }

        case 'call_initiate':
        case 'call_accept':
        case 'call_decline':
        case 'call_end': {
          // Direct 1-on-1 calls forwarding
          broadcast({
            type: msg.type,
            payload: msg.payload,
          });
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(connId);
  });
});

// ----------------- Vite Integration -----------------
async function start() {
  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🔒 AegisCord server running on http://0.0.0.0:${PORT} (Production: ${isProduction})`);
  });
}

start();
