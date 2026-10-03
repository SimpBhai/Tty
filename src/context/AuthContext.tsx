import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, Role, Permission, Channel } from '../types';
import { soundEngine } from '../audio/soundEffects';

interface ProvisionResult {
  user: User;
  initialPassword?: string;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  roles: Role[];
  channels: Channel[];
  isInitialized: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  toggleMute: () => void;
  toggleDeafen: () => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (userId: string, newPassword: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  updateUserStatus: (status: User['status'], customStatus?: string) => Promise<void>;
  provisionUser: (userData: {
    username: string;
    password?: string;
    tag?: string;
    avatarColor?: string;
    avatarUrl?: string;
    roleIds?: string[];
    customStatus?: string;
    isAdmin?: boolean;
  }) => Promise<ProvisionResult | null>;
  updateUser: (userData: Partial<User> & { id: string }) => Promise<void>;
  assignGroupAdmin: (userId: string, isAdmin: boolean) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  hasPermission: (permission: Permission, channelId?: string) => boolean;
  getHighestRole: (user: User) => Role | null;
  getUserRoles: (user: User) => Role[];
  setCurrentUserById: (userId: string) => void;
  loginWithToken: (token: string) => boolean;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  setIsInitialized: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('aegiscord_token');
      const storedUserId = localStorage.getItem('aegiscord_active_user_id');

      if (storedToken || storedUserId) {
        try {
          const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: storedToken, userId: storedUserId }),
          });

          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.user) {
              setCurrentUser(data.user);
              localStorage.setItem('aegiscord_active_user_id', data.user.id);
            }
          } else {
            // Invalid session
            localStorage.removeItem('aegiscord_token');
            localStorage.removeItem('aegiscord_active_user_id');
            if (isMounted) setCurrentUser(null);
          }
        } catch (err) {
          console.error('Failed to validate session:', err);
        }
      }
      if (isMounted) setIsInitialized(true);
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const isSuperAdmin = useMemo(() => {
    if (!currentUser) return false;
    return Boolean(
      currentUser.isSuperAdmin ||
      currentUser.isOwner ||
      currentUser.username.toLowerCase() === 'superadmin' ||
      currentUser.username.toLowerCase() === 'commander'
    );
  }, [currentUser]);

  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    if (isSuperAdmin) return true;
    if (currentUser.isAdmin) return true;
    return Boolean(currentUser.roleIds?.includes('role-admin') || currentUser.roleIds?.includes('role-owner'));
  }, [currentUser, isSuperAdmin]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('aegiscord_active_user_id', data.user.id);
        if (data.token) {
          localStorage.setItem('aegiscord_token', data.token);
        }
        soundEngine.playMessagePing();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Authentication failed' };
      }
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: 'Network error communicating with authentication core' };
    }
  };

  const logout = async () => {
    try {
      if (currentUser) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('aegiscord_token');
      localStorage.removeItem('aegiscord_active_user_id');
      setCurrentUser(null);
      soundEngine.playLeaveVoice();
    }
  };

  const changePassword = async (
    userId: string,
    newPassword: string,
    currentPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newPassword,
          currentPassword,
          requestedBy: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update password' };
    } catch (err) {
      return { success: false, error: 'Network error updating password' };
    }
  };

  const setCurrentUserById = (userId: string) => {
    const userMatch = users.find((u) => u.id === userId);
    if (userMatch) {
      setCurrentUser(userMatch);
      localStorage.setItem('aegiscord_active_user_id', userId);
    }
  };

  const loginWithToken = (token: string): boolean => {
    if (!token) return false;
    const clean = token.trim();
    const userMatch = users.find(
      (u) =>
        u.token === clean ||
        u.id === clean ||
        `${u.username}#${u.tag}`.toLowerCase() === clean.toLowerCase()
    );
    if (userMatch) {
      setCurrentUser(userMatch);
      localStorage.setItem('aegiscord_active_user_id', userMatch.id);
      if (userMatch.token) {
        localStorage.setItem('aegiscord_token', userMatch.token);
      }
      soundEngine.playMessagePing();
      return true;
    }
    return false;
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.playMuteToggle(next);
  };

  const toggleDeafen = () => {
    const next = !isDeafened;
    setIsDeafened(next);
    if (next) {
      setIsMuted(true);
    }
    soundEngine.playMuteToggle(next);
  };

  const getUserRoles = (user: User): Role[] => {
    if (!user || !user.roleIds) return [];
    return roles
      .filter((r) => user.roleIds.includes(r.id))
      .sort((a, b) => a.position - b.position);
  };

  const getHighestRole = (user: User): Role | null => {
    const userRoles = getUserRoles(user);
    return userRoles.length > 0 ? userRoles[0] : null;
  };

  const hasPermission = (permission: Permission, channelId?: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.isOwner || currentUser.isSuperAdmin) return true;

    const userRoles = getUserRoles(currentUser);

    // If user has ADMINISTRATOR role, they bypass all checks
    const hasAdmin = userRoles.some((r) => r.permissions.includes('ADMINISTRATOR'));
    if (hasAdmin || currentUser.isAdmin) {
      if (permission === 'MANAGE_MESSAGES' || permission === 'MOVE_MEMBERS' || permission === 'MUTE_MEMBERS') {
        return true;
      }
      if (hasAdmin) return true;
    }

    // Check Channel specific permission overrides
    if (channelId) {
      const channel = channels.find((c) => c.id === channelId);
      if (channel && channel.permissionOverrides) {
        for (const override of channel.permissionOverrides) {
          if (currentUser.roleIds.includes(override.roleId)) {
            if (override.deny && override.deny.includes(permission)) {
              return false;
            }
          }
        }
        for (const override of channel.permissionOverrides) {
          if (currentUser.roleIds.includes(override.roleId)) {
            if (override.allow && override.allow.includes(permission)) {
              return true;
            }
          }
        }
      }
    }

    // Default base role check
    return userRoles.some((r) => r.permissions.includes(permission));
  };

  const updateUserStatus = async (status: User['status'], customStatus?: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          status,
          customStatus: customStatus !== undefined ? customStatus : currentUser.customStatus,
          requestedBy: currentUser.id,
        }),
      });
      if (res.ok) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                status,
                customStatus: customStatus !== undefined ? customStatus : prev.customStatus,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const provisionUser = async (userData: {
    username: string;
    password?: string;
    tag?: string;
    avatarColor?: string;
    avatarUrl?: string;
    roleIds?: string[];
    customStatus?: string;
    isAdmin?: boolean;
  }): Promise<ProvisionResult | null> => {
    try {
      const res = await fetch('/api/users/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          requestedBy: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUsers((prev) => [...prev, data.user]);
        return {
          user: data.user,
          initialPassword: data.initialPassword,
        };
      } else {
        alert(data.error || 'Failed to provision user');
      }
    } catch (err) {
      console.error('Failed to provision user:', err);
    }
    return null;
  };

  const updateUser = async (userData: Partial<User> & { id: string }) => {
    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          requestedBy: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUsers((prev) => prev.map((u) => (u.id === userData.id ? { ...u, ...data.user } : u)));
        if (currentUser && currentUser.id === userData.id) {
          setCurrentUser((prev) => (prev ? { ...prev, ...data.user } : null));
        }
      }
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const assignGroupAdmin = async (userId: string, isGroupAdmin: boolean) => {
    if (!isSuperAdmin) {
      alert('Only Super Administrator can assign administrator roles');
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const currentRoles = target.roleIds || [];
    let newRoles = [...currentRoles];
    if (isGroupAdmin && !newRoles.includes('role-admin')) {
      newRoles = ['role-admin', ...newRoles];
    } else if (!isGroupAdmin) {
      newRoles = newRoles.filter((r) => r !== 'role-admin');
    }

    await updateUser({
      id: userId,
      isAdmin: isGroupAdmin,
      roleIds: newRoles.length > 0 ? newRoles : ['role-member'],
    });
  };

  const deleteUser = async (userId: string) => {
    if (!isSuperAdmin) {
      alert('Only Super Administrator can revoke or delete operative accounts');
      return;
    }
    try {
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          requestedBy: currentUser?.id,
        }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to revoke user');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        roles,
        channels,
        isInitialized,
        isSuperAdmin,
        isAdmin,
        isMuted,
        isDeafened,
        toggleMute,
        toggleDeafen,
        login,
        logout,
        changePassword,
        setCurrentUserById,
        loginWithToken,
        updateUserStatus,
        provisionUser,
        updateUser,
        assignGroupAdmin,
        deleteUser,
        hasPermission,
        getHighestRole,
        getUserRoles,
        setUsers,
        setRoles,
        setChannels,
        setIsInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
