import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ServerList } from './components/Sidebar/ServerList';
import { ChannelSidebar } from './components/Sidebar/ChannelSidebar';
import { ChatArea } from './components/Chat/ChatArea';
import { MemberList } from './components/MemberList/MemberList';
import { IncomingCallModal } from './components/Voice/IncomingCallModal';

// Modals
import { AdminProvisionModal } from './components/Modals/AdminProvisionModal';
import { RoleManagerModal } from './components/Modals/RoleManagerModal';
import { ChannelModal } from './components/Modals/ChannelModal';
import { CipherInspectorModal } from './components/Modals/CipherInspectorModal';
import { GitHubSyncModal } from './components/Modals/GitHubSyncModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { AuditLogModal } from './components/Modals/AuditLogModal';
import { QuickSwitcher } from './components/Navigation/QuickSwitcher';
import { LoginScreen } from './components/Auth/LoginScreen';
import { Message, Channel } from './types';
import { Shield, Key, Sparkles, UserCheck } from 'lucide-react';

const AegisCordMain: React.FC = () => {
  const { currentUser, isInitialized, loginWithToken } = useAuth();
  const { isDirectMessages } = useSocket();

  // Modals state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelToEdit, setChannelToEdit] = useState<Channel | null>(null);
  const [showCipherModal, setShowCipherModal] = useState(false);
  const [inspectMessage, setInspectMessage] = useState<Message | null>(null);
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMemberListOpen, setIsMemberListOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1280 : false;
  });

  // Quick Switcher hotkey handler (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickSwitcher((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openCipherInspector = (msg?: Message) => {
    setInspectMessage(msg || null);
    setShowCipherModal(true);
  };

  const openCreateChannel = () => {
    setChannelToEdit(null);
    setShowChannelModal(true);
  };

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen bg-[#090b0e] flex flex-col items-center justify-center text-slate-300 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400 animate-pulse">
          <Shield className="w-6 h-6" />
        </div>
        <div className="text-sm font-bold tracking-wider text-slate-200">
          INITIALIZING AEGIS-CORD SECURE ENVIRONMENT...
        </div>
        <div className="text-xs text-slate-500 font-mono">Deriving Zero-Knowledge Crypto Keys</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div id="aegiscord-app" className="flex h-screen w-screen bg-[#090b0e] text-slate-100 overflow-hidden font-sans select-none relative">
      {/* Mobile Navigation Drawer Backdrop */}
      {isMobileNavOpen && (
        <div
          id="mobile-nav-backdrop"
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-30 md:hidden transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* 1 & 2. Left Sidebars Container (Static on desktop, slide-over drawer on mobile) */}
      <div
        id="navigation-sidebar-container"
        className={`fixed inset-y-0 left-0 z-40 flex h-full transition-transform duration-300 ease-out md:static md:translate-x-0 ${
          isMobileNavOpen ? 'translate-x-0 shadow-2xl ring-1 ring-slate-800' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Leftmost Server / Icon Navigation */}
        <ServerList
          onOpenAdminProvision={() => {
            setIsMobileNavOpen(false);
            setShowAdminModal(true);
          }}
          onOpenAdminModal={() => {
            setIsMobileNavOpen(false);
            setShowAdminModal(true);
          }}
          onOpenSettings={() => {
            setIsMobileNavOpen(false);
            setShowSettingsModal(true);
          }}
          onOpenGitHubSync={() => {
            setIsMobileNavOpen(false);
            setShowGitHubModal(true);
          }}
          onOpenGitHubModal={() => {
            setIsMobileNavOpen(false);
            setShowGitHubModal(true);
          }}
          onOpenAuditLogs={() => {
            setIsMobileNavOpen(false);
            setShowAuditModal(true);
          }}
          onActionClick={() => setIsMobileNavOpen(false)}
        />

        {/* Channel & Category Navigation Sidebar */}
        <ChannelSidebar
          onOpenCreateChannel={() => {
            setIsMobileNavOpen(false);
            openCreateChannel();
          }}
          onOpenRoleManager={() => {
            setIsMobileNavOpen(false);
            setShowRoleModal(true);
          }}
          onOpenAdminProvision={() => {
            setIsMobileNavOpen(false);
            setShowAdminModal(true);
          }}
          onOpenServerSettings={() => {
            setIsMobileNavOpen(false);
            setShowGitHubModal(true);
          }}
          onOpenAuditLogs={() => {
            setIsMobileNavOpen(false);
            setShowAuditModal(true);
          }}
          onOpenUserSettings={() => {
            setIsMobileNavOpen(false);
            setShowSettingsModal(true);
          }}
          onOpenSettings={() => {
            setIsMobileNavOpen(false);
            setShowSettingsModal(true);
          }}
          onOpenQuickSwitcher={() => {
            setIsMobileNavOpen(false);
            setShowQuickSwitcher(true);
          }}
          onOpenCipherInspector={() => {
            setIsMobileNavOpen(false);
            openCipherInspector();
          }}
          onChannelSelect={() => setIsMobileNavOpen(false)}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />
      </div>

      {/* 3. Main Chat Feed or Voice Lounge Stage */}
      <ChatArea
        isDirectMessages={isDirectMessages}
        onOpenCipherInspector={openCipherInspector}
        onToggleMemberList={() => setIsMemberListOpen(!isMemberListOpen)}
        isMemberListOpen={isMemberListOpen}
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isMobileNavOpen={isMobileNavOpen}
      />

      {/* 4. Right Member List Sidebar (Static on desktop, drawer on mobile) */}
      {isMemberListOpen && (
        <>
          <div
            id="member-list-backdrop"
            className="fixed inset-0 bg-black/65 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setIsMemberListOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-40 lg:static lg:z-auto h-full shadow-2xl lg:shadow-none animate-in slide-in-from-right-5 duration-200">
            <MemberList onClose={() => setIsMemberListOpen(false)} />
          </div>
        </>
      )}

      {/* 5. Floating Incoming/Active Private Call Dialog */}
      <IncomingCallModal />

      {/* 6. Quick Switcher (Ctrl+K Command Palette) */}
      <QuickSwitcher
        isOpen={showQuickSwitcher}
        onClose={() => setShowQuickSwitcher(false)}
      />

      {/* 7. Administration & Role Modals */}
      {showAdminModal && (
        <AdminProvisionModal onClose={() => setShowAdminModal(false)} />
      )}

      {showRoleModal && (
        <RoleManagerModal onClose={() => setShowRoleModal(false)} />
      )}

      {showChannelModal && (
        <ChannelModal
          channelToEdit={channelToEdit}
          onClose={() => {
            setShowChannelModal(false);
            setChannelToEdit(null);
          }}
        />
      )}

      {showCipherModal && (
        <CipherInspectorModal
          message={inspectMessage}
          onClose={() => {
            setShowCipherModal(false);
            setInspectMessage(null);
          }}
        />
      )}

      {showGitHubModal && (
        <GitHubSyncModal onClose={() => setShowGitHubModal(false)} />
      )}

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      {showAuditModal && (
        <AuditLogModal onClose={() => setShowAuditModal(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SocketProvider>
          <AegisCordMain />
        </SocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
