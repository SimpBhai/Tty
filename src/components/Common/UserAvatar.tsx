import React, { useState } from 'react';
import { User, UserStatus } from '../../types';

interface UserAvatarProps {
  user?: Partial<User> | null;
  username?: string;
  avatarUrl?: string;
  avatarColor?: string;
  status?: UserStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showStatus?: boolean;
  className?: string;
  isSpeaking?: boolean;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
};

const statusSizeClasses = {
  xs: 'w-1.5 h-1.5 -bottom-0.5 -right-0.5 border',
  sm: 'w-2 h-2 -bottom-0.5 -right-0.5 border',
  md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 border-2',
  lg: 'w-3.5 h-3.5 bottom-0 right-0 border-2',
  xl: 'w-4 h-4 bottom-0.5 right-0.5 border-2',
  '2xl': 'w-5 h-5 bottom-1 right-1 border-2',
};

const statusColors = {
  online: 'bg-emerald-500',
  idle: 'bg-amber-500',
  dnd: 'bg-rose-500',
  offline: 'bg-slate-500',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  username: propUsername,
  avatarUrl: propAvatarUrl,
  avatarColor: propAvatarColor,
  status: propStatus,
  size = 'md',
  showStatus = false,
  className = '',
  isSpeaking = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const username = user?.username || propUsername || '??';
  const avatarUrl = user?.avatarUrl || propAvatarUrl;
  const avatarColor = user?.avatarColor || propAvatarColor || '#5865f2';
  const status = user?.status || propStatus;

  const initials = username
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const hasValidImage = Boolean(avatarUrl && !imageError);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${
        sizeClasses[size]
      } ${
        isSpeaking
          ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0d1017]'
          : ''
      } ${className}`}
      style={{
        backgroundColor: hasValidImage ? 'transparent' : avatarColor,
      }}
    >
      {hasValidImage ? (
        <img
          src={avatarUrl}
          alt={username}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full shadow-inner"
          loading="lazy"
        />
      ) : (
        <span className="font-bold text-white tracking-wider leading-none">
          {initials}
        </span>
      )}

      {showStatus && status && (
        <span
          className={`absolute rounded-full border-[#0d1017] ${
            statusSizeClasses[size]
          } ${statusColors[status] || statusColors.offline}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
