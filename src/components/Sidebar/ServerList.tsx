import React from 'react';
import { Shield, MessageSquare, Plus, Settings, Github, Download, Bell, BellOff, Volume2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface ServerListProps {
  onOpenAdminProvision?: () => void;
  onOpenAdminModal?: () => void;
  onOpenSettings?: () => void;
  onOpenGitHubSync?: () => void;
  onOpenGitHubModal?: () => void;
  onOpenAuditLogs?: () => void;
  isDirectMessages?: boolean;
  setIsDirectMessages?: (val: boolean) => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
  onActionClick?: () => void;
}

export const ServerList: React.FC<ServerListProps> = ({
  onOpenAdminProvision,
  onOpenAdminModal,
  onOpenSettings,
  onOpenGitHubSync,
  onOpenGitHubModal,
  onOpenAuditLogs,
  isDirectMessages: propIsDm,
  setIsDirectMessages: propSetIsDm,
  onInstallPwa,
  canInstallPwa,
  onActionClick,
}) => {
  const {
    serverData,
    activeVoiceChannelId,
    isDirectMessages: socketIsDm,
    setIsDirectMessages: socketSetIsDm,
  } = useSocket();
  const { currentUser, hasPermission, isSuperAdmin } = useAuth();
  const { unreadCount, soundEnabled, setSoundEnabled } = useNotification();

  const isDirectMessages = propIsDm !== undefined ? propIsDm : socketIsDm;
  const setIsDirectMessages = propSetIsDm || socketSetIsDm || (() => {});
  const handleOpenAdmin = () => {
    onActionClick?.();
    (onOpenAdminProvision || onOpenAdminModal || (() => {}))();
  };
  const handleOpenGitHub = () => {
    onActionClick?.();
    (onOpenGitHubSync || onOpenGitHubModal || (() => {}))();
  };
  const handleOpenSettings = () => {
    onActionClick?.();
    (onOpenSettings || (() => {}))();
  };

  const isOwnerOrAdmin = currentUser?.isOwner || currentUser?.isAdmin || hasPermission('ADMINISTRATOR');

  return (
    <div
      id="server-navigation-rail"
      className="w-16 sm:w-18 bg-[#0a0c10] flex flex-col items-center py-3 gap-2 border-r border-slate-800/60 select-none z-30 shrink-0 h-full overflow-y-auto custom-scrollbar"
    >
      {/* AegisCord Home / DMs Button */}
      <div className="relative group flex items-center justify-center w-full">
        <div
          className={`absolute left-0 w-1 bg-white rounded-r transition-all duration-200 ${
            isDirectMessages ? 'h-10' : 'h-2 scale-0 group-hover:scale-100 group-hover:h-5'
          }`}
        />
        <button
          id="btn-nav-home-dms"
          onClick={() => {
            setIsDirectMessages(true);
            onActionClick?.();
          }}
          className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center relative ${
            isDirectMessages
              ? 'bg-indigo-600 rounded-[16px] text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white'
          }`}
          title="Direct Messages & Encrypted Channels"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              id="badge-unread-dms"
              className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#0a0c10]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="w-8 h-[2px] bg-slate-800 rounded-full my-1" />

      {/* Main Server Icon */}
      <div className="relative group flex items-center justify-center w-full">
        <div
          className={`absolute left-0 w-1 bg-white rounded-r transition-all duration-200 ${
            !isDirectMessages ? 'h-10' : 'h-2 scale-0 group-hover:scale-100 group-hover:h-5'
          }`}
        />
        <button
          id="btn-nav-main-server"
          onClick={() => {
            setIsDirectMessages(false);
            onActionClick?.();
          }}
          className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center relative overflow-hidden group ${
            !isDirectMessages
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[16px] text-white shadow-lg shadow-indigo-600/40 ring-2 ring-indigo-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
          }`}
          title={serverData?.name || 'AegisCord Security Core'}
        >
          {serverData?.icon ? (
            <img
              src={serverData.icon}
              alt="Server Icon"
              className="w-full h-full object-cover rounded-inherit"
            />
          ) : (
            <Shield className="w-6 h-6 text-indigo-400 group-hover:text-white transition-colors" />
          )}

          {activeVoiceChannelId && (
            <span
              id="badge-voice-active-server"
              className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0c10] animate-pulse"
              title="Connected to Voice Channel"
            />
          )}
        </button>
      </div>

      {/* Super Admin Provisioning Action */}
      {isSuperAdmin && (
        <div className="relative group flex items-center justify-center w-full">
          <button
            id="btn-nav-provision-users"
            onClick={handleOpenAdmin}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-slate-800/70 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all duration-200 flex items-center justify-center group"
            title="Provision Operatives & Tags (Super Admin Only)"
          >
            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* GitHub Sync & Cloud Storage Vault */}
      <div className="relative group flex items-center justify-center w-full">
        <button
          id="btn-nav-github-sync"
          onClick={handleOpenGitHub}
          className="w-10 h-10 rounded-[20px] hover:rounded-[14px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-all duration-200 flex items-center justify-center"
          title="GitHub Cloud Storage Vault & CI/CD Pipelines"
        >
          <Github className="w-5 h-5" />
        </button>
      </div>

      {/* Notification Mute / Unmute Toggle */}
      <div className="relative group flex items-center justify-center w-full">
        <button
          id="btn-nav-sound-toggle"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`w-10 h-10 rounded-[20px] hover:rounded-[14px] transition-all duration-200 flex items-center justify-center ${
            soundEnabled
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400'
              : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
          }`}
          title={soundEnabled ? 'Sound alerts active' : 'Sound alerts muted'}
        >
          {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>
      </div>

      {/* PWA Install Button (If installable) */}
      {canInstallPwa && (
        <div className="relative group flex items-center justify-center w-full">
          <button
            id="btn-nav-install-pwa"
            onClick={onInstallPwa}
            className="w-10 h-10 rounded-[20px] hover:rounded-[14px] bg-emerald-950/40 hover:bg-emerald-800 text-emerald-400 hover:text-white transition-all duration-200 flex items-center justify-center border border-emerald-700/50 animate-pulse"
            title="Install AegisCord App (PWA)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Settings Modal */}
      <div className="relative group flex items-center justify-center w-full">
        <button
          id="btn-nav-settings"
          onClick={handleOpenSettings}
          className="w-10 h-10 rounded-[20px] hover:rounded-[14px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-all duration-200 flex items-center justify-center"
          title="Server & Cryptographic Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
