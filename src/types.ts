export type Permission =
  | 'ADMINISTRATOR'
  | 'MANAGE_SERVER'
  | 'MANAGE_ROLES'
  | 'MANAGE_CHANNELS'
  | 'VIEW_AUDIT_LOG'
  | 'VIEW_CHANNEL'
  | 'SEND_MESSAGES'
  | 'ATTACH_FILES'
  | 'ADD_REACTIONS'
  | 'MENTION_ROLES'
  | 'MANAGE_MESSAGES'
  | 'SEND_ENCRYPTED_FILES'
  | 'CONNECT_VOICE'
  | 'SPEAK'
  | 'STREAM_SCREEN'
  | 'MUTE_MEMBERS'
  | 'DEAFEN_MEMBERS'
  | 'MOVE_MEMBERS'
  | 'PRIORITY_SPEAKER';

export interface Role {
  id: string;
  name: string;
  color: string;
  hoist: boolean; // Display role members separately
  position: number;
  permissions: Permission[];
  isDefault?: boolean;
}

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface User {
  id: string;
  username: string;
  tag: string; // e.g. "0001", "1337" -> full handle is @username#0001
  avatarColor: string;
  avatarUrl?: string;
  customStatus?: string;
  status: UserStatus;
  roleIds: string[];
  isOwner?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  password?: string;
  publicKeyHex?: string; // E2EE public key
  token?: string; // Provisioned access token
  createdAt: number;
  lastActive: number;
}

export type ChannelType = 'text' | 'voice' | 'announcement' | 'vault';

export interface ChannelPermissionOverride {
  roleId: string;
  allow: Permission[];
  deny: Permission[];
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  topic?: string;
  categoryId: string;
  position: number;
  isPrivate?: boolean;
  permissionOverrides?: ChannelPermissionOverride[];
  e2eeKeyId?: string; // Channel shared symmetric key identifier
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  position: number;
}

export interface EncryptedPayload {
  iv: string; // Hex IV
  ciphertext: string; // Base64 ciphertext
  tag?: string; // Base64 auth tag
  keyId: string;
  algorithm: 'AES-GCM-256';
  version: 1;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  encryptedData?: string; // Encrypted base64 payload
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  channelId: string; // or DM recipient/conversation ID
  authorId: string;
  content: string; // Plaintext on client once decrypted, or raw encrypted container
  encryptedPayload?: EncryptedPayload;
  isEncrypted: boolean;
  attachments?: Attachment[];
  reactions?: Reaction[];
  replyToId?: string;
  replyToMessage?: {
    id: string;
    authorName: string;
    contentPreview: string;
  };
  pinned?: boolean;
  editedAt?: number;
  createdAt: number;
}

export interface VoiceParticipant {
  userId: string;
  channelId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
  audioLevel?: number; // 0 to 100
}

export interface PrivateCall {
  id: string;
  callerId: string;
  receiverId: string;
  status: 'ringing' | 'connected' | 'ended' | 'declined';
  startedAt: number;
  channelId: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  channelId?: string;
  authorId?: string;
  timestamp: number;
  read: boolean;
  type: 'mention' | 'message' | 'call' | 'system';
}

export interface ServerData {
  name: string;
  icon?: string;
  description: string;
  categories: Category[];
  channels: Channel[];
  roles: Role[];
  users: User[];
  messages: Message[];
  auditLogs: {
    id: string;
    userId: string;
    action: string;
    details: string;
    timestamp: number;
  }[];
  githubSync?: {
    repoOwner?: string;
    repoName?: string;
    branch?: string;
    filePath?: string;
    lastSyncedAt?: number;
  };
}

export interface WSMessage {
  type:
    | 'auth'
    | 'sync_state'
    | 'message_send'
    | 'message_new'
    | 'message_delete'
    | 'message_reaction'
    | 'user_presence'
    | 'user_typing'
    | 'user_created'
    | 'user_updated'
    | 'user_deleted'
    | 'channel_created'
    | 'channel_updated'
    | 'channel_deleted'
    | 'role_created'
    | 'role_updated'
    | 'role_deleted'
    | 'voice_join'
    | 'voice_leave'
    | 'voice_state_update'
    | 'voice_speaking'
    | 'voice_kick'
    | 'voice_kicked'
    | 'call_initiate'
    | 'call_accept'
    | 'call_decline'
    | 'call_end'
    | 'server_settings_update';
  payload: any;
  senderId?: string;
  timestamp?: number;
}
