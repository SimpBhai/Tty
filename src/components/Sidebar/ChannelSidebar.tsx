import React, { useState } from 'react';
import {
  ChevronDown,
  Hash,
  Volume2,
  Lock,
  Plus,
  Settings,
  Shield,
  Radio,
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  UserPlus,
  Users,
  Key,
  Flame,
  Search,
  Sparkles,
  Award,
  Bell,
  Activity,
  FileText,
  X,
  LogOut,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Channel, Category, User, VoiceParticipant } from '../../types';
import { UserAvatar } from '../Common/UserAvatar';

interface ChannelSidebarProps {
  isDirectMessages?: boolean;
  onOpenCreateChannel: () => void;
  onOpenAdminProvision: () => void;
  onOpenRoleManager: () => void;
  onOpenAuditLogs: () => void;
  onOpenUserSettings?: () => void;
  onOpenServerSettings?: () => void;
  onOpenSettings?: () => void;
  onOpenQuickSwitcher: () => void;
  onOpenCipherInspector?: () => void;
  onChannelSelect?: () => void;
  onCloseMobile?: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  isDirectMessages: propIsDm,
  onOpenCreateChannel,
  onOpenAdminProvision,
  onOpenRoleManager,
  onOpenAuditLogs,
  onOpenUserSettings,
  onOpenServerSettings,
  onOpenSettings,
  onOpenQuickSwitcher,
  onOpenCipherInspector,
  onChannelSelect,
  onCloseMobile,
}) => {
  const {
    serverData,
    categories,
    channels,
    activeChannel,
    setActiveChannelId,
    activeDmUser,
    setActiveDmUserId,
    activeVoiceChannelId,
    voiceParticipants,
    joinVoiceChannel,
    leaveVoiceChannel,
    isDirectMessages: socketIsDm,
  } = useSocket();

  const isDirectMessages = propIsDm !== undefined ? propIsDm : socketIsDm;
  const handleOpenSettings = onOpenUserSettings || onOpenSettings || (() => {});

  const {
    currentUser,
    users,
    roles,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    hasPermission,
    isSuperAdmin,
    isAdmin,
    logout,
  } = useAuth();

  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const canManageChannels = hasPermission('MANAGE_CHANNELS');
  const canManageRoles = hasPermission('MANAGE_ROLES');

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Filter channels based on VIEW_CHANNEL permissions
  const accessibleChannels = channels.filter((channel) => {
    return hasPermission('VIEW_CHANNEL', channel.id);
  });

  const getChannelIcon = (type: Channel['type'], isPrivate?: boolean) => {
    if (isPrivate || type === 'vault') {
      return <Lock className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    switch (type) {
      case 'voice':
        return <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />;
      case 'announcement':
        return <Radio className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'text':
      default:
        return <Hash className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  // Get active participants for a voice channel
  const getVoiceParticipantsForChannel = (chId: string): VoiceParticipant[] => {
    return (Object.values(voiceParticipants) as VoiceParticipant[]).filter(
      (p) => p.channelId === chId
    );
  };

  return (
    <div
      id="channels-sidebar"
      className="w-60 max-w-[calc(88vw-4rem)] sm:w-60 bg-[#12161f] flex flex-col h-full border-r border-slate-800/80 select-none z-20 shrink-0"
    >
      {/* Header Dropdown */}
      <div className="relative">
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#12161f]">
          <button
            id="btn-server-header"
            onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
            className="flex-1 h-12 px-4 flex items-center justify-between font-bold text-slate-100 hover:bg-slate-800/60 transition-colors text-sm shadow-sm group min-w-0"
          >
            <span className="truncate flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{serverData?.name || 'AegisCord'}</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
                isServerMenuOpen ? 'rotate-180 text-slate-200' : ''
              }`}
            />
          </button>
          {onCloseMobile && (
            <button
              id="btn-close-channel-sidebar-mobile"
              onClick={onCloseMobile}
              className="md:hidden p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors mr-1 rounded-lg"
              title="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Server Context Dropdown Menu */}
        {isServerMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsServerMenuOpen(false)}
            />
            <div
              id="menu-server-dropdown"
              className="absolute top-13 left-2.5 right-2.5 bg-[#0d1017] border border-slate-800 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              {isSuperAdmin && (
                <button
                  id="menu-item-provision-users"
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    onOpenAdminProvision();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 flex items-center justify-between rounded-md transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-3.5 h-3.5" />
                    Provision Operatives & Tags
                  </span>
                  <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                    SUPER ADMIN
                  </span>
                </button>
              )}

              {canManageChannels && (
                <button
                  id="menu-item-create-channel"
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    onOpenCreateChannel();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-indigo-600/30 hover:text-white flex items-center gap-2 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  Create Channel
                </button>
              )}

              {canManageRoles && (
                <button
                  id="menu-item-role-manager"
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    onOpenRoleManager();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-indigo-600/30 hover:text-white flex items-center gap-2 rounded-md transition-colors"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Role & Permissions Matrix
                </button>
              )}

              <button
                id="menu-item-cipher-inspector"
                onClick={() => {
                  setIsServerMenuOpen(false);
                  onOpenCipherInspector();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-indigo-600/30 hover:text-white flex items-center gap-2 rounded-md transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                E2EE Key & Cipher Audit
              </button>

              <button
                id="menu-item-audit-logs"
                onClick={() => {
                  setIsServerMenuOpen(false);
                  onOpenAuditLogs();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-indigo-600/30 hover:text-white flex items-center gap-2 rounded-md transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Security Audit Logs
              </button>

              <div className="h-[1px] bg-slate-800 my-1 mx-2" />

              <button
                id="menu-item-server-settings"
                onClick={() => {
                  setIsServerMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white flex items-center gap-2 rounded-md transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                Server Settings
              </button>
            </div>
          </>
        )}
      </div>

      {/* Quick Switcher Trigger */}
      <div className="px-2 pt-2 pb-1">
        <button
          id="btn-quick-search"
          onClick={onOpenQuickSwitcher}
          className="w-full px-2.5 py-1.5 bg-[#0a0c10]/70 hover:bg-[#0a0c10] border border-slate-800/80 hover:border-indigo-500/50 rounded-md text-xs text-slate-400 hover:text-slate-200 flex items-center justify-between transition-all"
        >
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search or jump to...</span>
          </span>
          <kbd className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Channel / DM List View */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 custom-scrollbar">
        {isDirectMessages ? (
          /* Direct Messages View */
          <div>
            <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-400 tracking-wider mb-2">
              <span>DIRECT MESSAGES</span>
              {isSuperAdmin && (
                <button
                  id="btn-dm-add-user"
                  onClick={onOpenAdminProvision}
                  title="Provision New Operative"
                  className="hover:text-slate-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              {users
                .filter((u) => u.id !== currentUser?.id)
                .map((user) => {
                  const isSelected = activeDmUser?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      id={`btn-dm-user-${user.id}`}
                      onClick={() => {
                        setActiveDmUserId(user.id);
                        onChannelSelect?.();
                      }}
                      className={`w-full px-2 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all group ${
                        isSelected
                          ? 'bg-indigo-600/30 text-white font-semibold'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <UserAvatar user={user} size="xs" showStatus />
                      <div className="flex flex-col text-left truncate">
                        <span className="truncate leading-tight">{user.username}</span>
                        <span className="text-[10px] text-slate-500 font-mono">#{user.tag}</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        ) : (
          /* Server Categories & Channels View */
          categories.map((category) => {
            const catChannels = accessibleChannels.filter((c) => c.categoryId === category.id);
            if (catChannels.length === 0 && !canManageChannels) return null;

            const isCollapsed = collapsedCategories[category.id];

            return (
              <div key={category.id} className="space-y-0.5">
                {/* Category Header */}
                <div className="flex items-center justify-between px-1 py-1 group">
                  <button
                    id={`btn-toggle-category-${category.id}`}
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 tracking-wider transition-colors"
                  >
                    <ChevronDown
                      className={`w-3 h-3 text-slate-500 transition-transform ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                    <span>{category.name}</span>
                  </button>

                  {canManageChannels && (
                    <button
                      id={`btn-add-channel-to-${category.id}`}
                      onClick={onOpenCreateChannel}
                      title="Create Channel in Category"
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-100 p-0.5 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Channels in Category */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pl-1">
                    {catChannels.map((channel) => {
                      const isSelected = !isDirectMessages && activeChannel?.id === channel.id;
                      const isVoice = channel.type === 'voice';
                      const participants = isVoice
                        ? getVoiceParticipantsForChannel(channel.id)
                        : [];

                      return (
                        <div key={channel.id} className="space-y-0.5">
                          <button
                            id={`btn-channel-${channel.id}`}
                            onClick={() => {
                              if (isVoice) {
                                joinVoiceChannel(channel.id);
                              } else {
                                setActiveChannelId(channel.id);
                              }
                              onChannelSelect?.();
                            }}
                            className={`w-full px-2 py-1.5 rounded-md flex items-center justify-between text-xs font-medium transition-all group ${
                              isSelected
                                ? 'bg-indigo-600/30 text-white font-semibold shadow-sm'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              {getChannelIcon(channel.type, channel.isPrivate)}
                              <span className="truncate">{channel.name}</span>
                            </span>

                            {/* E2EE Shield Pill */}
                            <span
                              title="End-to-End Encrypted Channel"
                              className="opacity-60 group-hover:opacity-100 text-[10px] text-emerald-400 flex items-center"
                            >
                              <Shield className="w-3 h-3" />
                            </span>
                          </button>

                          {/* Voice Channel Active Users List */}
                          {isVoice && participants.length > 0 && (
                            <div className="pl-6 pr-2 py-1 space-y-1">
                              {participants.map((p) => {
                                const user = users.find((u) => u.id === p.userId);
                                if (!user) return null;
                                return (
                                  <div
                                    key={p.userId}
                                    className="flex items-center justify-between text-[11px] text-slate-300 py-0.5"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <div
                                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${
                                          p.isSpeaking
                                            ? 'ring-2 ring-emerald-400 animate-pulse'
                                            : ''
                                        }`}
                                        style={{ backgroundColor: user.avatarColor }}
                                      >
                                        {user.username.slice(0, 1).toUpperCase()}
                                      </div>
                                      <span className="truncate">{user.username}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-500">
                                      {p.isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
                                      {p.isDeafened && (
                                        <Headphones className="w-3 h-3 text-rose-400" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Connected Voice Channel Floating Bar */}
      {activeVoiceChannelId && (
        <div
          id="bar-voice-connected"
          className="p-2.5 bg-[#0a0c10] border-t border-slate-800/80 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <div className="flex flex-col truncate">
              <span className="text-[11px] font-bold text-emerald-400 leading-tight">
                Voice Connected
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {channels.find((c) => c.id === activeVoiceChannelId)?.name || 'Encrypted Voice'}
              </span>
            </div>
          </div>
          <button
            id="btn-voice-disconnect"
            onClick={leaveVoiceChannel}
            title="Disconnect from Voice"
            className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* User Profile Bar (Bottom Left) */}
      <div
        id="user-profile-bar"
        className="p-2 bg-[#090b0e] border-t border-slate-800/80 flex items-center justify-between relative"
      >
        {/* User Identity & Info Trigger */}
        <button
          id="btn-user-profile-popover"
          onClick={() => setIsUserSwitcherOpen(!isUserSwitcherOpen)}
          className="flex items-center gap-2 p-1 rounded hover:bg-slate-800/60 transition-colors truncate text-left max-w-[125px]"
          title="User Profile & Session Details"
        >
          <UserAvatar user={currentUser} size="sm" showStatus />

          <div className="flex flex-col truncate">
            <span className="text-xs font-bold text-slate-100 truncate leading-tight flex items-center gap-1">
              {currentUser?.username || 'Operative'}
              {currentUser?.isOwner && <span title="Server Owner">👑</span>}
            </span>
            <span className="text-[10px] text-slate-400 font-mono leading-none">
              #{currentUser?.tag || '0000'}
            </span>
          </div>
        </button>

        {/* Audio & Settings Quick Actions */}
        <div className="flex items-center gap-0.5 text-slate-400">
          <button
            id="btn-user-toggle-mic"
            onClick={toggleMute}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            className={`p-1.5 rounded hover:bg-slate-800 hover:text-slate-100 transition-colors ${
              isMuted ? 'text-rose-400 hover:text-rose-300' : ''
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            id="btn-user-toggle-deafen"
            onClick={toggleDeafen}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
            className={`p-1.5 rounded hover:bg-slate-800 hover:text-slate-100 transition-colors ${
              isDeafened ? 'text-rose-400 hover:text-rose-300' : ''
            }`}
          >
            <Headphones className="w-4 h-4" />
          </button>

          <button
            id="btn-user-settings"
            onClick={handleOpenSettings}
            title="User & Security Settings"
            className="p-1.5 rounded hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            id="btn-user-logout"
            onClick={logout}
            title="Sign Out of AegisCord"
            className="p-1.5 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Operative Details Popover */}
        {isUserSwitcherOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsUserSwitcherOpen(false)}
            />
            <div
              id="popover-fast-user-switcher"
              className="absolute bottom-14 left-2 right-2 bg-[#0e1117] border border-slate-800 rounded-xl shadow-2xl p-3 z-50 space-y-2.5 animate-in fade-in zoom-in-95"
            >
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                <UserAvatar user={currentUser} size="md" showStatus />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                    <span>{currentUser?.username}</span>
                    <span className="text-slate-500 font-mono">#{currentUser?.tag}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isSuperAdmin ? (
                      <span className="text-amber-400 font-bold">Root Super Administrator</span>
                    ) : isAdmin ? (
                      <span className="text-rose-400 font-bold">Group Administrator</span>
                    ) : (
                      <span>Verified Operative</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsUserSwitcherOpen(false);
                    handleOpenSettings();
                  }}
                  className="w-full p-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2 transition-colors text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Profile Picture & Settings</span>
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setIsUserSwitcherOpen(false);
                      onOpenAdminProvision();
                    }}
                    className="w-full p-1.5 rounded-lg hover:bg-emerald-950/40 text-xs text-emerald-300 flex items-center gap-2 transition-colors text-left"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Provision Operative Accounts</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsUserSwitcherOpen(false);
                    logout();
                  }}
                  className="w-full p-1.5 rounded-lg hover:bg-rose-950/40 text-xs text-rose-300 flex items-center gap-2 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
