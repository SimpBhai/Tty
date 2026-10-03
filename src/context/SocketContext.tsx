import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Channel,
  Category,
  Role,
  User,
  Message,
  VoiceParticipant,
  PrivateCall,
  ServerData,
  WSMessage,
} from '../types';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { encryptMessage, decryptMessage } from '../crypto/e2ee';
import { soundEngine } from '../audio/soundEffects';

interface SocketContextType {
  connected: boolean;
  serverData: ServerData | null;
  categories: Category[];
  channels: Channel[];
  activeChannel: Channel | null;
  setActiveChannelId: (id: string) => void;
  isDirectMessages: boolean;
  setIsDirectMessages: (val: boolean) => void;
  activeDmUser: User | null;
  setActiveDmUserId: (id: string | null) => void;
  messages: Message[];
  decryptedContentMap: Record<string, string>;
  activeVoiceChannelId: string | null;
  voiceParticipants: Record<string, VoiceParticipant>;
  activePrivateCall: PrivateCall | null;
  typingUsers: Record<string, string[]>; // channelId -> userIds
  auditLogs: ServerData['auditLogs'];
  sendMessage: (content: string, attachments?: any[], replyToId?: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  createChannel: (channelData: Partial<Channel>) => Promise<Channel | null>;
  updateChannel: (channelData: Partial<Channel> & { id: string }) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
  createRole: (roleData: Partial<Role>) => Promise<Role | null>;
  updateRole: (roleData: Partial<Role> & { id: string }) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  updateServerSettings: (settings: Partial<ServerData>) => Promise<void>;
  joinVoiceChannel: (channelId: string) => void;
  leaveVoiceChannel: () => void;
  kickUserFromVoice: (channelId: string, targetUserId: string) => Promise<void>;
  setVoiceSpeaking: (isSpeaking: boolean) => void;
  toggleScreenShare: () => void;
  initiatePrivateCall: (receiverId: string) => void;
  acceptPrivateCall: () => void;
  declinePrivateCall: () => void;
  endPrivateCall: () => void;
  sendTyping: (channelId: string) => void;
  refreshServerState: () => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (backupJson: any) => Promise<void>;
  isScreenSharing: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setUsers, setRoles, setChannels, isMuted, isDeafened } = useAuth();
  const { addNotification } = useNotification();

  const [connected, setConnected] = useState(false);
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannelsState] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelIdState] = useState<string>('ch-general');
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptedContentMap, setDecryptedContentMap] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<ServerData['auditLogs']>([]);

  // Voice state
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<Record<string, VoiceParticipant>>({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Private 1-on-1 Call state
  const [activePrivateCall, setActivePrivateCall] = useState<PrivateCall | null>(null);

  // Typing indicators: channelId -> username[]
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<Record<string, number>>({});

  // Sync state to local and AuthContext
  const updateLocalState = useCallback(
    async (data: ServerData) => {
      setServerData(data);
      setCategories(data.categories || []);
      setChannelsState(data.channels || []);
      setChannels(data.channels || []);
      setRoles(data.roles || []);
      setUsers(data.users || []);
      setAuditLogs(data.auditLogs || []);

      // Decrypt messages
      const newMap: Record<string, string> = {};
      if (data.messages) {
        setMessages(data.messages);
        for (const msg of data.messages) {
          if (msg.isEncrypted && msg.encryptedPayload) {
            newMap[msg.id] = await decryptMessage(msg.encryptedPayload, msg.channelId, msg.content);
          } else {
            newMap[msg.id] = msg.content;
          }
        }
      }
      setDecryptedContentMap(newMap);
    },
    [setChannels, setRoles, setUsers]
  );

  const fetchInitialState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const json = await res.json();
        if (json.state) {
          await updateLocalState(json.state);
        }
      }
    } catch (err) {
      console.error('Failed to fetch initial state:', err);
    }
  }, [updateLocalState]);

  // Connect WebSocket
  useEffect(() => {
    fetchInitialState();

    const connectWs = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
        if (currentUser) {
          ws.send(
            JSON.stringify({
              type: 'auth',
              payload: { userId: currentUser.id },
            })
          );
        }
      };

      ws.onmessage = async (event) => {
        try {
          const wsMsg: WSMessage = JSON.parse(event.data);
          handleWsMessage(wsMsg);
        } catch (err) {
          console.error('Error handling WS event:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        reconnectTimeoutRef.current = window.setTimeout(connectWs, 2500);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    };

    connectWs();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchInitialState]);

  // Re-authenticate when currentUser changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentUser) {
      wsRef.current.send(
        JSON.stringify({
          type: 'auth',
          payload: { userId: currentUser.id },
        })
      );
    }
  }, [currentUser]);

  // Handle incoming WS events
  const handleWsMessage = async (wsMsg: WSMessage) => {
    switch (wsMsg.type) {
      case 'sync_state': {
        await updateLocalState(wsMsg.payload);
        break;
      }

      case 'message_new': {
        const newMsg: Message = wsMsg.payload;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        let decryptedText = newMsg.content;
        if (newMsg.isEncrypted && newMsg.encryptedPayload) {
          decryptedText = await decryptMessage(newMsg.encryptedPayload, newMsg.channelId, newMsg.content);
        }
        setDecryptedContentMap((prev) => ({
          ...prev,
          [newMsg.id]: decryptedText,
        }));

        // Notification triggers
        if (currentUser && newMsg.authorId !== currentUser.id) {
          const isMentioned = decryptedText.includes(`@${currentUser.username}`);
          const ch = channels.find((c) => c.id === newMsg.channelId);
          const channelName = ch ? `#${ch.name}` : 'Direct Message';

          addNotification({
            title: isMentioned ? `Mention in ${channelName}` : `New message in ${channelName}`,
            body: decryptedText.length > 80 ? decryptedText.slice(0, 80) + '...' : decryptedText,
            channelId: newMsg.channelId,
            authorId: newMsg.authorId,
            type: isMentioned ? 'mention' : 'message',
          });
        }
        break;
      }

      case 'message_reaction': {
        const { messageId, reactions } = wsMsg.payload;
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
        );
        break;
      }

      case 'message_delete': {
        const { id } = wsMsg.payload;
        setMessages((prev) => prev.filter((m) => m.id !== id));
        break;
      }

      case 'user_presence': {
        const { userId, status } = wsMsg.payload;
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status, lastActive: Date.now() } : u))
        );
        break;
      }

      case 'user_typing': {
        const { channelId, userId, username } = wsMsg.payload;
        if (currentUser && userId === currentUser.id) return;

        setTypingUsers((prev) => {
          const currentList = prev[channelId] || [];
          if (!currentList.includes(username)) {
            return { ...prev, [channelId]: [...currentList, username] };
          }
          return prev;
        });

        // Clear typing indicator after 3s
        const key = `${channelId}-${userId}`;
        if (typingTimeoutRef.current[key]) {
          clearTimeout(typingTimeoutRef.current[key]);
        }
        typingTimeoutRef.current[key] = window.setTimeout(() => {
          setTypingUsers((prev) => {
            const list = prev[channelId] || [];
            return { ...prev, [channelId]: list.filter((u) => u !== username) };
          });
        }, 3000);
        break;
      }

      case 'user_created': {
        const newUser: User = wsMsg.payload;
        setUsers((prev) => {
          if (prev.some((u) => u.id === newUser.id)) return prev;
          return [...prev, newUser];
        });
        break;
      }

      case 'user_updated': {
        const updatedUser: User = wsMsg.payload;
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
        break;
      }

      case 'user_deleted': {
        const { id } = wsMsg.payload;
        setUsers((prev) => prev.filter((u) => u.id !== id));
        break;
      }

      case 'channel_created': {
        const newChannel: Channel = wsMsg.payload;
        setChannelsState((prev) => [...prev, newChannel]);
        setChannels((prev) => [...prev, newChannel]);
        break;
      }

      case 'channel_updated': {
        const updatedChannel: Channel = wsMsg.payload;
        setChannelsState((prev) =>
          prev.map((c) => (c.id === updatedChannel.id ? updatedChannel : c))
        );
        setChannels((prev) =>
          prev.map((c) => (c.id === updatedChannel.id ? updatedChannel : c))
        );
        break;
      }

      case 'channel_deleted': {
        const { id } = wsMsg.payload;
        setChannelsState((prev) => prev.filter((c) => c.id !== id));
        setChannels((prev) => prev.filter((c) => c.id !== id));
        if (activeChannelId === id) {
          setActiveChannelIdState('ch-general');
        }
        break;
      }

      case 'role_created': {
        const newRole: Role = wsMsg.payload;
        setRoles((prev) => [...prev, newRole]);
        break;
      }

      case 'role_updated': {
        const updatedRole: Role = wsMsg.payload;
        setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
        break;
      }

      case 'role_deleted': {
        const { id } = wsMsg.payload;
        setRoles((prev) => prev.filter((r) => r.id !== id));
        break;
      }

      case 'voice_join': {
        const { channelId, participant } = wsMsg.payload;
        setVoiceParticipants((prev) => ({
          ...prev,
          [`${channelId}-${participant.userId}`]: participant,
        }));
        if (channelId === activeVoiceChannelId && participant.userId !== currentUser?.id) {
          soundEngine.playJoinVoice();
        }
        break;
      }

      case 'voice_leave': {
        const { channelId, userId } = wsMsg.payload;
        setVoiceParticipants((prev) => {
          const next = { ...prev };
          delete next[`${channelId}-${userId}`];
          return next;
        });
        if (channelId === activeVoiceChannelId && userId !== currentUser?.id) {
          soundEngine.playLeaveVoice();
        }
        break;
      }

      case 'voice_kicked': {
        const { channelId, targetUserId } = wsMsg.payload;
        setVoiceParticipants((prev) => {
          const next = { ...prev };
          delete next[`${channelId}-${targetUserId}`];
          return next;
        });
        if (currentUser && currentUser.id === targetUserId) {
          setActiveVoiceChannelId(null);
          setIsScreenSharing(false);
          soundEngine.playLeaveVoice();
          addNotification({
            title: 'Removed from Voice Lounge',
            body: 'An administrator disconnected you from the voice channel.',
            type: 'system',
          });
        } else if (channelId === activeVoiceChannelId) {
          soundEngine.playLeaveVoice();
        }
        break;
      }

      case 'voice_state_update': {
        const { channelId, participant } = wsMsg.payload;
        setVoiceParticipants((prev) => ({
          ...prev,
          [`${channelId}-${participant.userId}`]: participant,
        }));
        break;
      }

      case 'voice_speaking': {
        const { channelId, userId, isSpeaking } = wsMsg.payload;
        const key = `${channelId}-${userId}`;
        setVoiceParticipants((prev) => {
          if (!prev[key]) return prev;
          return {
            ...prev,
            [key]: { ...prev[key], isSpeaking },
          };
        });
        break;
      }

      case 'call_initiate': {
        const call: PrivateCall = wsMsg.payload;
        if (currentUser && call.receiverId === currentUser.id) {
          setActivePrivateCall(call);
          soundEngine.startRingtone();
          addNotification({
            title: 'Incoming Private Call 📞',
            body: 'Encrypted peer-to-peer voice request incoming',
            type: 'call',
          });
        }
        break;
      }

      case 'call_accept': {
        const call: PrivateCall = wsMsg.payload;
        soundEngine.stopRingtone();
        if (currentUser && (call.callerId === currentUser.id || call.receiverId === currentUser.id)) {
          setActivePrivateCall({ ...call, status: 'connected' });
          soundEngine.playJoinVoice();
        }
        break;
      }

      case 'call_decline':
      case 'call_end': {
        soundEngine.stopRingtone();
        soundEngine.playLeaveVoice();
        setActivePrivateCall(null);
        break;
      }

      case 'server_settings_update': {
        setServerData((prev) => (prev ? { ...prev, ...wsMsg.payload } : null));
        break;
      }

      default:
        break;
    }
  };

  const [isDirectMessages, setIsDirectMessagesState] = useState(false);

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0] || null;
  const activeDmUser = currentUser && activeDmUserId ? (serverData?.users || []).find((u) => u.id === activeDmUserId) || null : null;

  const setActiveChannelId = (id: string) => {
    setActiveChannelIdState(id);
    setActiveDmUserId(null);
    setIsDirectMessagesState(false);
  };

  const handleSetActiveDmUserId = (id: string | null) => {
    setActiveDmUserId(id);
    if (id) {
      setIsDirectMessagesState(true);
    }
  };

  const setIsDirectMessages = (val: boolean) => {
    setIsDirectMessagesState(val);
    if (val) {
      if (!activeDmUserId && serverData?.users) {
        const other = serverData.users.find((u) => u.id !== currentUser?.id);
        if (other) {
          setActiveDmUserId(other.id);
        }
      }
    }
  };

  // Send Encrypted Message
  const sendMessage = async (content: string, attachments?: any[], replyToId?: string) => {
    if (!currentUser || (!content.trim() && (!attachments || attachments.length === 0))) return;

    const channelId = activeDmUserId
      ? [currentUser.id, activeDmUserId].sort().join('-')
      : activeChannelId;

    const replyMsg = replyToId ? messages.find((m) => m.id === replyToId) : undefined;
    const replyPreview = replyMsg
      ? {
          id: replyMsg.id,
          authorName:
            (serverData?.users || []).find((u) => u.id === replyMsg.authorId)?.username || 'Operative',
          contentPreview: decryptedContentMap[replyMsg.id]?.slice(0, 50) || 'Encrypted content',
        }
      : undefined;

    // Perform AES-GCM-256 client-side encryption
    const encryptedPayload = await encryptMessage(content, channelId);

    const messageData = {
      channelId,
      authorId: currentUser.id,
      content: content, // passed for local immediate rendering
      encryptedPayload,
      isEncrypted: true,
      attachments: attachments || [],
      replyToId,
      replyToMessage: replyPreview,
    };

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setDecryptedContentMap((prev) => ({
          ...prev,
          [data.message.id]: content,
        }));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/messages/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          emoji,
          userId: currentUser.id,
        }),
      });
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const createChannel = async (channelData: Partial<Channel>): Promise<Channel | null> => {
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...channelData,
          requestedBy: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.channel) {
        return data.channel;
      }
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
    return null;
  };

  const updateChannel = async (channelData: Partial<Channel> & { id: string }) => {
    try {
      await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...channelData,
          requestedBy: currentUser?.id,
        }),
      });
    } catch (err) {
      console.error('Failed to update channel:', err);
    }
  };

  const deleteChannel = async (channelId: string) => {
    try {
      await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete channel:', err);
    }
  };

  const createRole = async (roleData: Partial<Role>): Promise<Role | null> => {
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roleData,
          requestedBy: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.role) {
        return data.role;
      }
    } catch (err) {
      console.error('Failed to create role:', err);
    }
    return null;
  };

  const updateRole = async (roleData: Partial<Role> & { id: string }) => {
    try {
      await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roleData,
          requestedBy: currentUser?.id,
        }),
      });
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete role:', err);
    }
  };

  const updateServerSettings = async (settings: Partial<ServerData>) => {
    try {
      await fetch('/api/server/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch (err) {
      console.error('Failed to update server settings:', err);
    }
  };

  // Voice channel actions
  const joinVoiceChannel = (channelId: string) => {
    if (!currentUser) return;
    if (activeVoiceChannelId === channelId) return;

    if (activeVoiceChannelId) {
      leaveVoiceChannel();
    }

    setActiveVoiceChannelId(channelId);
    soundEngine.playJoinVoice();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'voice_join',
          payload: {
            channelId,
            userId: currentUser.id,
          },
        })
      );
    }
  };

  const leaveVoiceChannel = () => {
    if (!currentUser || !activeVoiceChannelId) return;
    soundEngine.playLeaveVoice();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'voice_leave',
          payload: {
            channelId: activeVoiceChannelId,
            userId: currentUser.id,
          },
        })
      );
    }
    setActiveVoiceChannelId(null);
    setIsScreenSharing(false);
  };

  const kickUserFromVoice = async (channelId: string, targetUserId: string) => {
    try {
      await fetch('/api/voice/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          targetUserId,
          requestedBy: currentUser?.id,
        }),
      });
    } catch (err) {
      console.error('Failed to kick user from voice:', err);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'voice_kick',
          payload: {
            channelId,
            targetUserId,
            kickedBy: currentUser?.id,
          },
        })
      );
    }
  };

  const setVoiceSpeaking = (isSpeaking: boolean) => {
    if (!currentUser || !activeVoiceChannelId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'voice_speaking',
          payload: {
            channelId: activeVoiceChannelId,
            userId: currentUser.id,
            isSpeaking: !isMuted && isSpeaking,
          },
        })
      );
    }
  };

  const toggleScreenShare = () => {
    setIsScreenSharing((prev) => {
      const next = !prev;
      if (currentUser && activeVoiceChannelId && wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: 'voice_state_update',
            payload: {
              channelId: activeVoiceChannelId,
              userId: currentUser.id,
              isScreenSharing: next,
            },
          })
        );
      }
      return next;
    });
  };

  // Private 1-on-1 calls
  const initiatePrivateCall = (receiverId: string) => {
    if (!currentUser) return;
    const call: PrivateCall = {
      id: `call-${Date.now()}`,
      callerId: currentUser.id,
      receiverId,
      status: 'ringing',
      startedAt: Date.now(),
      channelId: [currentUser.id, receiverId].sort().join('-'),
    };
    setActivePrivateCall(call);
    soundEngine.startRingtone();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call_initiate',
          payload: call,
        })
      );
    }
  };

  const acceptPrivateCall = () => {
    if (!activePrivateCall || !currentUser) return;
    soundEngine.stopRingtone();
    soundEngine.playJoinVoice();
    const updatedCall: PrivateCall = { ...activePrivateCall, status: 'connected' };
    setActivePrivateCall(updatedCall);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call_accept',
          payload: updatedCall,
        })
      );
    }
  };

  const declinePrivateCall = () => {
    if (!activePrivateCall) return;
    soundEngine.stopRingtone();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call_decline',
          payload: activePrivateCall,
        })
      );
    }
    setActivePrivateCall(null);
  };

  const endPrivateCall = () => {
    if (!activePrivateCall) return;
    soundEngine.stopRingtone();
    soundEngine.playLeaveVoice();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call_end',
          payload: activePrivateCall,
        })
      );
    }
    setActivePrivateCall(null);
  };

  const sendTyping = (channelId: string) => {
    if (!currentUser || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'user_typing',
        payload: {
          channelId,
          userId: currentUser.id,
          username: currentUser.username,
        },
      })
    );
  };

  const refreshServerState = async () => {
    await fetchInitialState();
  };

  const exportBackup = async () => {
    window.open('/api/github/export', '_blank');
  };

  const importBackup = async (backupJson: any) => {
    try {
      const res = await fetch('/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importedData: backupJson,
          requestedBy: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchInitialState();
      }
    } catch (err) {
      console.error('Failed to import backup:', err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        connected,
        serverData,
        categories,
        channels,
        activeChannel,
        setActiveChannelId,
        isDirectMessages,
        setIsDirectMessages,
        activeDmUser,
        setActiveDmUserId: handleSetActiveDmUserId,
        messages,
        decryptedContentMap,
        activeVoiceChannelId,
        voiceParticipants,
        activePrivateCall,
        typingUsers,
        auditLogs,
        sendMessage,
        toggleReaction,
        deleteMessage,
        createChannel,
        updateChannel,
        deleteChannel,
        createRole,
        updateRole,
        deleteRole,
        updateServerSettings,
        joinVoiceChannel,
        leaveVoiceChannel,
        kickUserFromVoice,
        setVoiceSpeaking,
        toggleScreenShare,
        initiatePrivateCall,
        acceptPrivateCall,
        declinePrivateCall,
        endPrivateCall,
        sendTyping,
        refreshServerState,
        exportBackup,
        importBackup,
        isScreenSharing,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
