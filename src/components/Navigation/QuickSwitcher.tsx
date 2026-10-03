import React, { useState, useEffect } from 'react';
import { Search, Hash, Volume2, Radio, Lock, User, Sparkles, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSwitcher: React.FC<QuickSwitcherProps> = ({ isOpen, onClose }) => {
  const { channels, setActiveChannelId, setActiveDmUserId } = useSocket();
  const { users, currentUser } = useAuth();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUser?.id &&
      (u.username.toLowerCase().includes(query.toLowerCase()) || u.tag.includes(query))
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4">
      <div
        id="modal-quick-switcher"
        className="w-full max-w-lg bg-[#0d1017] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Search input bar */}
        <div className="p-3 bg-[#121622] border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            id="input-quick-switcher"
            autoFocus
            type="text"
            placeholder="Where would you like to navigate? (Type channel or operative name)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3 custom-scrollbar text-xs">
          {/* Channels Section */}
          {filteredChannels.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400">CHANNELS</div>
              {filteredChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannelId(ch.id);
                    onClose();
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center justify-between text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {ch.type === 'voice' ? (
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    ) : ch.type === 'announcement' ? (
                      <Radio className="w-4 h-4 text-indigo-400" />
                    ) : ch.isPrivate ? (
                      <Lock className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Hash className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-semibold">{ch.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-xs">{ch.topic}</span>
                </button>
              ))}
            </div>
          )}

          {/* Direct Messages Section */}
          {filteredUsers.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400">DIRECT MESSAGES</div>
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setActiveDmUserId(u.id);
                    onClose();
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center justify-between text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: u.avatarColor || '#5865f2' }}
                    >
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold">{u.username}</span>
                    <span className="text-slate-400 font-mono text-[10px]">#{u.tag}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{u.customStatus}</span>
                </button>
              ))}
            </div>
          )}

          {filteredChannels.length === 0 && filteredUsers.length === 0 && (
            <div className="py-8 text-center text-slate-500">No matching channels or operatives found.</div>
          )}
        </div>
      </div>
    </div>
  );
};
