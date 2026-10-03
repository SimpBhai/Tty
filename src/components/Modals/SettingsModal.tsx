import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Volume2,
  Mic,
  Bell,
  Download,
  Shield,
  Check,
  Upload,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  Laptop,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { soundEngine } from '../../audio/soundEffects';
import { UserAvatar } from '../Common/UserAvatar';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { currentUser, updateUser, changePassword, logout } = useAuth();
  const {
    isPwaInstallable,
    installPwa,
    soundVolume,
    setVolume,
    soundsEnabled,
    setSoundsEnabled,
    notificationsEnabled,
    requestNotificationPermission,
  } = useNotification();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'voice' | 'notifications' | 'pwa'>(
    'profile'
  );

  // Profile Form state
  const [username, setUsername] = useState(currentUser?.username || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || '#5865f2');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [saved, setSaved] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mic test simulation level
  const [micTestActive, setMicTestActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  useEffect(() => {
    let interval: number;
    if (micTestActive) {
      interval = window.setInterval(() => {
        setMicLevel(Math.floor(20 + Math.random() * 70));
      }, 100);
    } else {
      setMicLevel(0);
    }
    return () => clearInterval(interval);
  }, [micTestActive]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
        }
      };
      if (readerEvent.target?.result) {
        img.src = readerEvent.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    await updateUser({
      id: currentUser.id,
      username: username.trim(),
      customStatus: customStatus.trim(),
      avatarColor,
      avatarUrl: avatarUrl.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 4 characters' });
      return;
    }

    const res = await changePassword(currentUser.id, newPassword, currentPassword);
    if (res.success) {
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus(null), 3000);
    } else {
      setPasswordStatus({ type: 'error', message: res.error || 'Failed to update password' });
    }
  };

  const colorPalette = [
    '#5865f2',
    '#ec4899',
    '#a855f7',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
  ];

  const presetAvatars = [
    { name: 'Shield Sentinel', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces' },
    { name: 'Cyber Operative', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces' },
    { name: 'Tactical Phoenix', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces' },
    { name: 'Ghost Operative', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&h=256&fit=crop&crop=faces' },
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        id="modal-app-settings"
        className="w-full max-w-2xl bg-[#0d1017] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 bg-[#121622] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100">
              Operative Settings & Hardware Calibration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-[#090b0e] px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Profile & Avatar</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'security'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'voice'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice & Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'notifications'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'pwa'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>PWA App Install</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Card Preview */}
              <div className="flex items-center gap-4 p-4 bg-[#090b0e] border border-slate-800 rounded-xl">
                <UserAvatar
                  user={{
                    username,
                    avatarColor,
                    avatarUrl: avatarUrl || undefined,
                    status: currentUser?.status,
                  }}
                  size="xl"
                  showStatus
                />
                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    <span>{username}</span>
                    {currentUser?.isOwner && <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800 px-1 rounded font-bold">OWNER</span>}
                    {currentUser?.isAdmin && !currentUser?.isOwner && (
                      <span className="text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800 px-1 rounded font-bold">ADMIN</span>
                    )}
                  </div>
                  <div className="text-slate-400 font-mono">#{currentUser?.tag}</div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> E2EE Authenticated Session
                  </div>
                </div>
              </div>

              {/* Profile Image System */}
              <div className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>Profile Picture Management</span>
                  </span>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Custom Picture
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Upload */}
                  <label className="p-3 bg-[#121622] hover:bg-[#161c2c] border border-slate-700/80 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 transition-colors">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Upload Image (JPG/PNG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>

                  {/* Image URL Input */}
                  <input
                    type="url"
                    placeholder="Or enter direct Image URL"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="bg-[#121622] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Preset Avatars */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Or Select Preset Avatar
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {presetAvatars.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-transform shrink-0 ${
                          avatarUrl === preset.url
                            ? 'border-indigo-500 scale-110 ring-2 ring-indigo-500/50'
                            : 'border-slate-700 hover:scale-105'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">OPERATIVE USERNAME</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#090b0e] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Custom Status */}
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">CUSTOM STATUS / MOTTO</label>
                <input
                  type="text"
                  placeholder="What's your current status?"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  className="w-full bg-[#090b0e] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Fallback Color Badge */}
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">FALLBACK COLOR BADGE</label>
                <div className="flex items-center gap-2">
                  {colorPalette.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setAvatarColor(col)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        avatarColor === col
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d1017] scale-110'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {saved && (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-4 h-4" /> Profile Updated
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              {/* Password update */}
              <form onSubmit={handleChangePassword} className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl space-y-3">
                <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span>Update Account Password</span>
                </div>

                {passwordStatus && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-semibold ${
                      passwordStatus.type === 'success'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {passwordStatus.message}
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <label className="text-slate-400 text-[11px] font-bold block mb-1">
                      CURRENT PASSWORD
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#121622] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] font-bold block mb-1">
                      NEW PASSWORD
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#121622] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] font-bold block mb-1">
                      CONFIRM NEW PASSWORD
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#121622] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              </form>

              {/* Log out section */}
              <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-rose-300">Sign Out of AegisCord</div>
                  <div className="text-slate-400 text-[11px]">
                    Terminates your active cryptographic session and returns to login gate.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-5">
              {/* Mic Input Test */}
              <div className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    Microphone Input Test
                  </span>
                  <button
                    onClick={() => setMicTestActive(!micTestActive)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      micTestActive
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {micTestActive ? 'Stop Test' : 'Test Mic'}
                  </button>
                </div>

                <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 rounded-full transition-all duration-100"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500">
                  Speak into your microphone to verify frequency response.
                </div>
              </div>

              {/* Output Sound Volume */}
              <div className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    Audio Effects Volume
                  </span>
                  <button
                    onClick={() => soundEngine.playMessagePing()}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold"
                  >
                    Test Ping
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundVolume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-500"
                  />
                  <span className="font-mono text-slate-300 w-10 text-right">
                    {Math.round(soundVolume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">System Notification Sounds</div>
                  <div className="text-slate-400 text-[11px]">
                    Play audio pings on incoming transmissions, calls, and mentions.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundsEnabled}
                  onChange={(e) => setSoundsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Desktop Push Notifications</div>
                  <div className="text-slate-400 text-[11px]">
                    Display native OS banners when messages arrive in the background.
                  </div>
                </div>
                <button
                  onClick={requestNotificationPermission}
                  className={`px-3 py-1.5 rounded font-bold text-xs ${
                    notificationsEnabled
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {notificationsEnabled ? 'Enabled' : 'Enable Push'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">
                      Install AegisCord Standalone App
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      Install on Windows, macOS, Linux, iOS, or Android for native performance and offline messaging cache.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="btn-trigger-pwa-install"
                    onClick={installPwa}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isPwaInstallable ? 'Install PWA Application' : 'App Configured (PWA Ready)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121622] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
