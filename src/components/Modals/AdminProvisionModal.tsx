import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Shield,
  Key,
  Copy,
  Check,
  Trash2,
  Users,
  Award,
  Lock,
  RefreshCw,
  Sparkles,
  Upload,
  Image as ImageIcon,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User, Role } from '../../types';
import { UserAvatar } from '../Common/UserAvatar';

interface AdminProvisionModalProps {
  onClose: () => void;
}

export const AdminProvisionModal: React.FC<AdminProvisionModalProps> = ({ onClose }) => {
  const {
    users,
    roles,
    provisionUser,
    deleteUser,
    updateUser,
    assignGroupAdmin,
    currentUser,
    isSuperAdmin,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tag, setTag] = useState('');
  const [avatarColor, setAvatarColor] = useState('#5865f2');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(['role-member']);
  const [customStatus, setCustomStatus] = useState('🔒 Zero-Knowledge Operative');
  const [isAdmin, setIsAdmin] = useState(false);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [lastProvisioned, setLastProvisioned] = useState<{ user: User; initialPassword?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Password reset modal state inside directory
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

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

  const handleGenerateRandomTag = () => {
    const randomTag = Math.floor(1000 + Math.random() * 9000).toString();
    setTag(randomTag);
  };

  const handleGenerateRandomPassword = () => {
    const generated = `Pass_${Math.random().toString(36).substring(2, 7).toUpperCase()}!${Math.floor(100 + Math.random() * 900)}`;
    setPassword(generated);
  };

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

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    const finalTag = tag && /^\d{4}$/.test(tag) ? tag : Math.floor(1000 + Math.random() * 9000).toString();
    const finalPassword = password.trim() || `Pass_${Math.random().toString(36).substring(2, 7).toUpperCase()}!${Math.floor(100 + Math.random() * 900)}`;

    const res = await provisionUser({
      username: username.trim(),
      password: finalPassword,
      tag: finalTag,
      avatarColor,
      avatarUrl: avatarUrl.trim() || undefined,
      roleIds: selectedRoleIds,
      customStatus,
      isAdmin,
    });

    setLoading(false);
    if (res && res.user) {
      setLastProvisioned({
        user: res.user,
        initialPassword: res.initialPassword || finalPassword,
      });
      setUsername('');
      setPassword('');
      setTag('');
      setAvatarUrl('');
      setIsAdmin(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleExecutePasswordReset = async (userId: string) => {
    if (!newResetPassword.trim()) return;
    await updateUser({
      id: userId,
      password: newResetPassword.trim(),
    });
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      setResettingUserId(null);
      setNewResetPassword('');
    }, 1800);
  };

  // If not super admin, display access denied view
  if (!isSuperAdmin) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0d1017] border border-rose-800/80 rounded-2xl shadow-2xl p-6 text-center space-y-4 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">Access Denied: Super Admin Only</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Only the <strong>Super Administrator</strong> is authorized to provision new operative accounts, mint cryptographic tags, and assign group admin rights.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        id="modal-admin-provision"
        className="w-full max-w-3xl bg-[#0d1017] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-4 bg-[#121622] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Operative Provisioning & Tag Terminal</span>
                <span className="text-[10px] bg-amber-900/60 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded font-mono font-bold">
                  SUPER ADMIN
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Create user accounts, generate passwords, and assign group administrators.
              </p>
            </div>
          </div>
          <button
            id="btn-close-provision-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#090b0e] px-4">
          <button
            id="tab-provision-new"
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Mint New Operative Account</span>
          </button>

          <button
            id="tab-manage-users"
            onClick={() => setActiveTab('manage')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Operatives Directory & Role Assignment ({users.length})</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {activeTab === 'create' ? (
            <div className="space-y-5">
              {/* Last Provisioned Banner */}
              {lastProvisioned && (
                <div
                  id="banner-provisioned-success"
                  className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-xl space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Operative Minted Successfully! Share credentials below:
                    </span>
                    <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      @{lastProvisioned.user.username}#{lastProvisioned.user.tag}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#090b0e] p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="text-[10px] text-slate-400 font-bold">LOGIN USERNAME</div>
                      <div className="font-mono text-emerald-300 font-bold select-all">
                        {lastProvisioned.user.username}#{lastProvisioned.user.tag}
                      </div>
                    </div>

                    <div className="bg-[#090b0e] p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="text-[10px] text-slate-400 font-bold">INITIAL PASSWORD</div>
                      <div className="font-mono text-amber-300 font-bold select-all">
                        {lastProvisioned.initialPassword || 'operative123'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `AegisCord Login Credentials:\nUsername: ${lastProvisioned.user.username}#${lastProvisioned.user.tag}\nPassword: ${lastProvisioned.initialPassword || ''}`,
                          'copy-creds'
                        )
                      }
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                    >
                      {copiedToken === 'copy-creds' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>Copy Full Login Credentials</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Creation Form */}
              <form onSubmit={handleProvision} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      OPERATIVE USERNAME <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="input-provision-username"
                      type="text"
                      required
                      placeholder="e.g. Phoenix, CipherLord, Shadow"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#090b0e] border border-slate-700/80 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        ACCESS PASSWORD <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomPassword}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Generate Strong
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="input-provision-password"
                        type="text"
                        required
                        placeholder="Set strong initial password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#090b0e] border border-slate-700/80 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 4-Digit Tag */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        TAG (4 DIGITS)
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomTag}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Randomize Tag
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500 font-mono text-sm">
                        #
                      </span>
                      <input
                        id="input-provision-tag"
                        type="text"
                        maxLength={4}
                        placeholder="0001"
                        value={tag}
                        onChange={(e) => setTag(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full bg-[#090b0e] border border-slate-700/80 focus:border-emerald-500 rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono outline-none"
                      />
                    </div>
                  </div>

                  {/* Profile Image System */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      PROFILE PICTURE (OPTIONAL)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 px-3 py-2 bg-[#090b0e] border border-slate-700 hover:border-slate-600 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 text-xs text-slate-300 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Upload Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                      {avatarUrl && (
                        <div className="relative">
                          <img
                            src={avatarUrl}
                            alt="Avatar preview"
                            className="w-9 h-9 rounded-full object-cover border border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('')}
                            className="absolute -top-1 -right-1 bg-rose-600 rounded-full w-4 h-4 text-[10px] text-white flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Avatar Color */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">AVATAR COLOR BADGE</label>
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

                {/* Custom Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">CUSTOM STATUS / MOTTO</label>
                  <input
                    id="input-provision-status"
                    type="text"
                    placeholder="🔒 E2EE Operative"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    className="w-full bg-[#090b0e] border border-slate-700/80 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                {/* Group Administrator Toggle (KEY REQUIREMENT) */}
                <div className="p-3 bg-[#121622] border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-rose-400" />
                      <span>Assign as Group Administrator</span>
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Enables message moderation (deleting messages) and voice lounge moderation (kicking users from calls).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => {
                      setIsAdmin(e.target.checked);
                      if (e.target.checked && !selectedRoleIds.includes('role-admin')) {
                        setSelectedRoleIds((prev) => ['role-admin', ...prev]);
                      }
                    }}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                </div>

                {/* Role Assignment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">ASSIGN BASE ROLES</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {roles.map((role) => {
                      const isSelected = selectedRoleIds.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => toggleRoleSelection(role.id)}
                          className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-slate-800 border-emerald-500 text-white'
                              : 'bg-[#090b0e] border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: role.color }}
                            />
                            <span className="truncate">{role.name}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-submit-provision"
                    disabled={loading || !username.trim()}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Provision Operative & Generate E2EE Keys</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Operatives Directory List */
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                All provisioned operative accounts on this node. As Super Administrator, you can assign group admin rights, reset passwords, or revoke accounts.
              </div>

              <div className="space-y-2">
                {users.map((u) => {
                  const role = u.roleIds ? roles.find((r) => r.id === u.roleIds[0]) : null;
                  const isUserSuperAdmin = Boolean(
                    u.isSuperAdmin || u.isOwner || u.username.toLowerCase() === 'superadmin'
                  );
                  const isUserAdmin = Boolean(u.isAdmin || u.roleIds?.includes('role-admin'));

                  return (
                    <div
                      key={u.id}
                      className="p-3 bg-[#090b0e] border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={u} size="md" showStatus />

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-white flex-wrap">
                            <span className="truncate">{u.username}</span>
                            <span className="text-xs text-slate-500 font-mono">#{u.tag}</span>

                            {isUserSuperAdmin && (
                              <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/50 px-1.5 rounded font-bold">
                                SUPER ADMIN
                              </span>
                            )}

                            {!isUserSuperAdmin && isUserAdmin && (
                              <span className="text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800/50 px-1.5 rounded font-bold">
                                GROUP ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            Role:{' '}
                            <span style={{ color: role?.color || '#94a3b8' }}>
                              {role?.name || 'Member'}
                            </span>
                            {u.customStatus && <span className="ml-2 text-slate-500 font-normal">{u.customStatus}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Super Admin Controls for this User */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Toggle Group Admin */}
                        {!isUserSuperAdmin && (
                          <button
                            onClick={() => assignGroupAdmin(u.id, !isUserAdmin)}
                            className={`px-2.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
                              isUserAdmin
                                ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/60 text-rose-300'
                                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                            }`}
                            title={isUserAdmin ? 'Demote to regular member' : 'Promote to Group Admin'}
                          >
                            {isUserAdmin ? 'Demote from Admin' : 'Assign Group Admin'}
                          </button>
                        )}

                        {/* Reset Password Button */}
                        <button
                          onClick={() => {
                            setResettingUserId(resettingUserId === u.id ? null : u.id);
                            setNewResetPassword('');
                          }}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Reset Account Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Delete User */}
                        {!isUserSuperAdmin && u.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              if (confirm(`Revoke and delete operative account @${u.username}#${u.tag}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="p-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 transition-colors"
                            title="Revoke Operative Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Password Reset Popup Bar if selected */}
                      {resettingUserId === u.id && (
                        <div className="w-full mt-2 pt-2 border-t border-slate-800 flex items-center gap-2 animate-in fade-in">
                          <input
                            type="text"
                            placeholder="Enter new password"
                            value={newResetPassword}
                            onChange={(e) => setNewResetPassword(e.target.value)}
                            className="flex-1 bg-[#090b0e] border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono outline-none"
                          />
                          <button
                            onClick={() => handleExecutePasswordReset(u.id)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors"
                          >
                            {resetSuccess ? 'Saved!' : 'Save New Password'}
                          </button>
                          <button
                            onClick={() => setResettingUserId(null)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
