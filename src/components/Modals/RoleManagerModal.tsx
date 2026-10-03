import React, { useState } from 'react';
import {
  X,
  Award,
  Plus,
  Trash2,
  Check,
  Shield,
  Lock,
  Volume2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Role, Permission } from '../../types';

interface RoleManagerModalProps {
  onClose: () => void;
}

export const RoleManagerModal: React.FC<RoleManagerModalProps> = ({ onClose }) => {
  const { roles } = useAuth();
  const { createRole, updateRole, deleteRole } = useSocket();

  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || 'role-member');
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const [name, setName] = useState(selectedRole?.name || '');
  const [color, setColor] = useState(selectedRole?.color || '#94a3b8');
  const [hoist, setHoist] = useState(selectedRole?.hoist || false);
  const [permissions, setPermissions] = useState<Permission[]>(selectedRole?.permissions || []);

  const [isCreating, setIsCreating] = useState(false);

  // Synchronize inputs when selected role changes
  const selectRole = (role: Role) => {
    setIsCreating(false);
    setSelectedRoleId(role.id);
    setName(role.name);
    setColor(role.color);
    setHoist(role.hoist);
    setPermissions(role.permissions);
  };

  const startCreateRole = () => {
    setIsCreating(true);
    setName('New Role');
    setColor('#3b82f6');
    setHoist(true);
    setPermissions(['VIEW_CHANNEL', 'SEND_MESSAGES', 'CONNECT_VOICE', 'SPEAK']);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isCreating) {
      const newRole = await createRole({
        name: name.trim(),
        color,
        hoist,
        permissions,
        position: roles.length,
      });
      if (newRole) {
        setIsCreating(false);
        selectRole(newRole);
      }
    } else if (selectedRole) {
      await updateRole({
        id: selectedRole.id,
        name: name.trim(),
        color,
        hoist,
        permissions,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedRole || selectedRole.id === 'role-owner') return;
    if (confirm(`Are you sure you want to delete role @${selectedRole.name}?`)) {
      await deleteRole(selectedRole.id);
      const remaining = roles.filter((r) => r.id !== selectedRole.id);
      if (remaining.length > 0) selectRole(remaining[0]);
    }
  };

  const togglePermission = (perm: Permission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const permissionDefinitions: {
    category: string;
    icon: React.ReactNode;
    items: { key: Permission; label: string; desc: string; dangerous?: boolean }[];
  }[] = [
    {
      category: 'General Server Permissions',
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      items: [
        {
          key: 'ADMINISTRATOR',
          label: 'Administrator',
          desc: 'Grants all permissions and bypasses channel specific overrides.',
          dangerous: true,
        },
        {
          key: 'MANAGE_SERVER',
          label: 'Manage Server',
          desc: 'Allows changing server name, icon, and cloud storage configuration.',
        },
        {
          key: 'MANAGE_ROLES',
          label: 'Manage Roles',
          desc: 'Allows creating, editing, and deleting roles below this role.',
        },
        {
          key: 'MANAGE_CHANNELS',
          label: 'Manage Channels',
          desc: 'Allows creating, organizing, and deleting channels & categories.',
        },
        {
          key: 'VIEW_AUDIT_LOG',
          label: 'View Audit Log',
          desc: 'Allows inspecting security logs and administrative history.',
        },
      ],
    },
    {
      category: 'Text & Content Permissions',
      icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
      items: [
        {
          key: 'VIEW_CHANNEL',
          label: 'View Channel',
          desc: 'Allows reading encrypted channels and viewing message history.',
        },
        {
          key: 'SEND_MESSAGES',
          label: 'Send Messages',
          desc: 'Allows transmitting encrypted messages in text channels.',
        },
        {
          key: 'ATTACH_FILES',
          label: 'Attach Files & Media',
          desc: 'Allows uploading encrypted images and file attachments.',
        },
        {
          key: 'ADD_REACTIONS',
          label: 'Add Reactions',
          desc: 'Allows adding emoji reactions to messages.',
        },
        {
          key: 'MENTION_ROLES',
          label: 'Mention @everyone and Roles',
          desc: 'Allows triggering audio alerts to all members of a role.',
        },
        {
          key: 'MANAGE_MESSAGES',
          label: 'Manage Messages',
          desc: 'Allows deleting and pinning messages sent by other operatives.',
        },
        {
          key: 'SEND_ENCRYPTED_FILES',
          label: 'High-Security Payloads',
          desc: 'Allows sending zero-knowledge binary payloads and cipher vault items.',
        },
      ],
    },
    {
      category: 'Voice & Mesh Permissions',
      icon: <Volume2 className="w-4 h-4 text-emerald-400" />,
      items: [
        {
          key: 'CONNECT_VOICE',
          label: 'Connect to Voice',
          desc: 'Allows joining encrypted voice channels and lounges.',
        },
        {
          key: 'SPEAK',
          label: 'Speak in Voice',
          desc: 'Allows transmitting audio in voice channels.',
        },
        {
          key: 'STREAM_SCREEN',
          label: 'Share Screen / Video',
          desc: 'Allows video transmission and screen sharing.',
        },
        {
          key: 'MUTE_MEMBERS',
          label: 'Mute Members',
          desc: 'Allows muting other operatives in voice channels.',
        },
        {
          key: 'DEAFEN_MEMBERS',
          label: 'Deafen Members',
          desc: 'Allows deafening other operatives in voice channels.',
        },
        {
          key: 'PRIORITY_SPEAKER',
          label: 'Priority Speaker',
          desc: 'Ducks other members volume when this operative speaks.',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        id="modal-role-manager"
        className="w-full max-w-4xl bg-[#0d1017] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 bg-[#121622] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Roles & Granular Permissions Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Configure role hierarchies, color identities, and fine-grained access control.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Left Role List, Right Permissions Form */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Role Selector */}
          <div className="w-64 bg-[#090b0e] border-r border-slate-800 p-3 flex flex-col justify-between shrink-0">
            <div className="space-y-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-400 mb-2">
                <span>ROLES ({roles.length})</span>
                <button
                  id="btn-create-new-role"
                  onClick={startCreateRole}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>

              {roles.map((r) => {
                const isSelected = !isCreating && selectedRole?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => selectRole(r)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="truncate">{r.name}</span>
                    </span>
                    {r.id === 'role-owner' && (
                      <span className="text-[10px] text-amber-400">👑</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Delete button (if not owner role) */}
            {!isCreating && selectedRole && selectedRole.id !== 'role-owner' && (
              <button
                id="btn-delete-current-role"
                onClick={handleDelete}
                className="mt-3 w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-850/60 text-rose-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Role</span>
              </button>
            )}
          </div>

          {/* Right Column: Role Editor Form */}
          <form
            onSubmit={handleSave}
            className="flex-1 flex flex-col bg-[#0d1017] overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              {/* Role General Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  ROLE SETTINGS
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">ROLE NAME</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={selectedRole?.id === 'role-owner' && !isCreating}
                      className="w-full bg-[#090b0e] border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">ROLE COLOR</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-9 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 bg-[#090b0e] border border-slate-700/80 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Hoist Toggle */}
                <div className="flex items-center justify-between p-3 bg-[#090b0e] border border-slate-800 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Display role members separately
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Shows members under a distinct category in the member list.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hoist}
                    onChange={(e) => setHoist(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Permission Categories Checklist */}
              <div className="space-y-6 pt-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  ROLE PERMISSION MATRIX
                </h3>

                {permissionDefinitions.map((cat, cIdx) => (
                  <div key={cIdx} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      {cat.icon}
                      <span>{cat.category}</span>
                    </div>

                    <div className="space-y-2">
                      {cat.items.map((item) => {
                        const isGranted = permissions.includes(item.key);
                        return (
                          <div
                            key={item.key}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                              item.dangerous
                                ? 'bg-amber-950/20 border-amber-800/40'
                                : 'bg-[#090b0e] border-slate-800/80'
                            }`}
                          >
                            <div className="flex-1 pr-4">
                              <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                <span>{item.label}</span>
                                {item.dangerous && (
                                  <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded font-mono">
                                    HIGH PRIVILEGE
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                            </div>

                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => togglePermission(item.key)}
                              disabled={selectedRole?.id === 'role-owner' && !isCreating}
                              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="p-4 bg-[#121622] border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="btn-save-role-matrix"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Role Permissions</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
