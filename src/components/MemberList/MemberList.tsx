import React, { useState } from 'react';
import {
  Shield,
  MessageSquare,
  Phone,
  Key,
  Crown,
  MoreVertical,
  UserCheck,
  UserX,
  VolumeX,
  Sparkles,
  Check,
  Award,
  X,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { User, Role, VoiceParticipant } from '../../types';
import { UserAvatar } from '../Common/UserAvatar';

interface MemberListProps {
  onClose?: () => void;
}

export const MemberList: React.FC<MemberListProps> = ({ onClose }) => {
  const {
    users,
    roles,
    currentUser,
    hasPermission,
    deleteUser,
    updateUser,
    assignGroupAdmin,
    isSuperAdmin,
  } = useAuth();
  const {
    setActiveDmUserId,
    initiatePrivateCall,
    voiceParticipants,
    kickUserFromVoice,
  } = useSocket();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);

  const canManageRoles = hasPermission('MANAGE_ROLES');
  const canKickMembers = hasPermission('ADMINISTRATOR') || currentUser?.isOwner;

  // Group users by highest hoisted role, then online / offline
  const getRoleGroups = () => {
    const groups: { role: Role | null; title: string; users: User[] }[] = [];

    // Sort roles by position
    const sortedRoles = [...roles].sort((a, b) => a.position - b.position);

    const assignedUserIds = new Set<string>();

    // Hoisted roles
    for (const role of sortedRoles) {
      if (role.hoist) {
        const matchingUsers = users.filter((u) => {
          if (assignedUserIds.has(u.id)) return false;
          const isMatch = u.roleIds && u.roleIds[0] === role.id && u.status !== 'offline';
          if (isMatch) assignedUserIds.add(u.id);
          return isMatch;
        });

        if (matchingUsers.length > 0) {
          groups.push({
            role,
            title: `${role.name.toUpperCase()} — ${matchingUsers.length}`,
            users: matchingUsers,
          });
        }
      }
    }

    // Remaining online users
    const remainingOnline = users.filter(
      (u) => !assignedUserIds.has(u.id) && u.status !== 'offline'
    );
    if (remainingOnline.length > 0) {
      groups.push({
        role: null,
        title: `ONLINE — ${remainingOnline.length}`,
        users: remainingOnline,
      });
      remainingOnline.forEach((u) => assignedUserIds.add(u.id));
    }

    // Offline users
    const offlineUsers = users.filter((u) => u.status === 'offline' || !assignedUserIds.has(u.id));
    if (offlineUsers.length > 0) {
      groups.push({
        role: null,
        title: `OFFLINE — ${offlineUsers.length}`,
        users: offlineUsers,
      });
    }

    return groups;
  };

  const handleToggleUserRole = async (targetUser: User, roleId: string) => {
    if (!canManageRoles) return;
    const currentRoles = targetUser.roleIds || [];
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter((id) => id !== roleId)
      : [...currentRoles, roleId];

    await updateUser({
      id: targetUser.id,
      roleIds: newRoles.length > 0 ? newRoles : ['role-member'],
    });

    if (selectedUser?.id === targetUser.id) {
      setSelectedUser({
        ...targetUser,
        roleIds: newRoles.length > 0 ? newRoles : ['role-member'],
      });
    }
  };

  const roleGroups = getRoleGroups();

  return (
    <div
      id="member-list-sidebar"
      className="w-60 bg-[#12161f] border-l border-slate-800/80 flex flex-col h-full select-none z-10 shrink-0"
    >
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-slate-800/80 text-xs font-bold text-slate-400">
        <span>MEMBERS ({users.length})</span>
        {onClose && (
          <button
            id="btn-close-member-list"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Close Member List"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Member Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 custom-scrollbar">
        {roleGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-slate-400 tracking-wider">
              {group.title}
            </div>

            <div className="space-y-0.5">
              {group.users.map((user) => {
                const userRole = user.roleIds ? roles.find((r) => r.id === user.roleIds[0]) : null;

                return (
                  <button
                    key={user.id}
                    id={`btn-member-${user.id}`}
                    onClick={() => setSelectedUser(user)}
                    className="w-full px-2 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium text-slate-300 hover:bg-slate-800/60 transition-all text-left group"
                  >
                    {/* Avatar with status indicator */}
                    <UserAvatar user={user} size="sm" showStatus />

                    {/* Name & custom status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          className="font-bold truncate"
                          style={{ color: userRole?.color || '#cbd5e1' }}
                        >
                          {user.username}
                        </span>
                        {user.isOwner && (
                          <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Server Owner" />
                        )}
                        {user.isAdmin && !user.isOwner && (
                          <span className="text-[9px] bg-rose-950/60 text-rose-300 border border-rose-800/50 px-1 rounded font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate leading-tight">
                        {user.customStatus || `#${user.tag}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Member Details Popover Modal */}
      {selectedUser && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSelectedUser(null)}
          />
          <div
            id="modal-member-card"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-[#0d1017] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Banner */}
            <div
              className="h-20 w-full relative"
              style={{
                backgroundColor: selectedUser.avatarColor || '#5865f2',
                opacity: 0.85,
              }}
            />

            {/* Avatar & Info */}
            <div className="px-4 pb-4 -mt-10 relative">
              <div className="relative inline-block">
                <UserAvatar
                  user={selectedUser}
                  size="xl"
                  showStatus
                  className="border-4 border-[#0d1017] shadow-xl"
                />
              </div>

              <div className="mt-2">
                <div className="flex items-center gap-1.5 text-base font-bold text-white">
                  <span>{selectedUser.username}</span>
                  <span className="text-xs text-slate-400 font-mono">#{selectedUser.tag}</span>
                  {selectedUser.isOwner && (
                    <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/50 px-1.5 py-0.5 rounded font-bold">
                      OWNER
                    </span>
                  )}
                  {selectedUser.isAdmin && !selectedUser.isOwner && (
                    <span className="text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800/50 px-1.5 py-0.5 rounded font-bold">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedUser.customStatus || 'Zero-Knowledge Operative'}
                </p>
              </div>

              {/* Roles Badge List */}
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 mb-1.5">ASSIGNED ROLES</div>
                <div className="flex flex-wrap gap-1">
                  {(selectedUser.roleIds || []).map((rid) => {
                    const r = roles.find((role) => role.id === rid);
                    if (!r) return null;
                    return (
                      <span
                        key={rid}
                        className="text-[11px] px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1"
                        style={{
                          backgroundColor: `${r.color}15`,
                          borderColor: `${r.color}40`,
                          color: r.color,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: r.color }}
                        />
                        {r.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* E2EE Cryptographic Identity */}
              <div className="mt-3 pt-2 border-t border-slate-800 text-xs">
                <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Key className="w-3 h-3 text-emerald-400" />
                  <span>CRYPTOGRAPHIC PUBLIC TOKEN</span>
                </div>
                <div className="bg-[#090b0e] p-2 rounded border border-slate-800 text-[10px] font-mono text-emerald-400 break-all select-all">
                  {selectedUser.token || `AEGIS_PUB_${selectedUser.id}_AES256`}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
                <button
                  id="btn-card-dm"
                  onClick={() => {
                    setActiveDmUserId(selectedUser.id);
                    setSelectedUser(null);
                  }}
                  className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Direct Message</span>
                </button>

                <button
                  id="btn-card-call"
                  onClick={() => {
                    initiatePrivateCall(selectedUser.id);
                    setSelectedUser(null);
                  }}
                  className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Encrypted Call</span>
                </button>
              </div>

              {/* Admin Moderation Controls */}
              {selectedUser.id !== currentUser?.id && !selectedUser.isOwner && (
                <div className="mt-3 pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 mb-1">
                    ADMIN & MODERATION CONTROLS
                  </div>

                  {/* Disconnect from voice lounge if currently connected */}
                  {(() => {
                    const voiceEntry = (Object.values(voiceParticipants) as VoiceParticipant[]).find(
                      (p) => p.userId === selectedUser.id
                    );
                    const canModVoice = Boolean(
                      currentUser?.isAdmin ||
                      currentUser?.isOwner ||
                      currentUser?.isSuperAdmin
                    );

                    if (voiceEntry && canModVoice) {
                      return (
                        <button
                          onClick={() => {
                            if (confirm(`Remove @${selectedUser.username} from voice lounge?`)) {
                              kickUserFromVoice(voiceEntry.channelId, selectedUser.id);
                              setSelectedUser(null);
                            }
                          }}
                          className="w-full py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Disconnect from Voice Lounge</span>
                        </button>
                      );
                    }
                    return null;
                  })()}

                  {/* Assign as Group Admin (SUPER ADMIN ONLY) */}
                  {isSuperAdmin && (
                    <button
                      onClick={async () => {
                        const nextAdmin = !selectedUser.isAdmin;
                        await assignGroupAdmin(selectedUser.id, nextAdmin);
                        setSelectedUser((prev) => (prev ? { ...prev, isAdmin: nextAdmin } : null));
                      }}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      <span>{selectedUser.isAdmin ? 'Demote from Group Admin' : 'Assign as Group Admin'}</span>
                    </button>
                  )}

                  {/* Revoke account (SUPER ADMIN ONLY) */}
                  {isSuperAdmin && (
                    <button
                      id="btn-card-revoke-user"
                      onClick={() => {
                        if (confirm(`Revoke and ban operative @${selectedUser.username}#${selectedUser.tag}?`)) {
                          deleteUser(selectedUser.id);
                          setSelectedUser(null);
                        }
                      }}
                      className="w-full py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-400 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Revoke Operative Access
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
