import React, { useState } from 'react';
import { X, Hash, Volume2, Radio, Lock, Shield, Check } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Channel, ChannelType } from '../../types';

interface ChannelModalProps {
  channelToEdit?: Channel | null;
  onClose: () => void;
}

export const ChannelModal: React.FC<ChannelModalProps> = ({ channelToEdit, onClose }) => {
  const { categories, createChannel, updateChannel } = useSocket();
  const { roles } = useAuth();

  const [name, setName] = useState(channelToEdit?.name || '');
  const [type, setType] = useState<ChannelType>(channelToEdit?.type || 'text');
  const [topic, setTopic] = useState(channelToEdit?.topic || '');
  const [categoryId, setCategoryId] = useState(
    channelToEdit?.categoryId || categories[0]?.id || 'cat-text'
  );
  const [isPrivate, setIsPrivate] = useState(channelToEdit?.isPrivate || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (channelToEdit) {
      await updateChannel({
        id: channelToEdit.id,
        name: name.trim(),
        type,
        topic,
        categoryId,
        isPrivate,
      });
    } else {
      await createChannel({
        name: name.trim(),
        type,
        topic,
        categoryId,
        isPrivate,
      });
    }
    onClose();
  };

  const channelTypes: { type: ChannelType; label: string; desc: string; icon: React.ReactNode }[] =
    [
      {
        type: 'text',
        label: 'Text Channel',
        desc: 'Send encrypted messages, images, files, and reactions.',
        icon: <Hash className="w-5 h-5 text-slate-400" />,
      },
      {
        type: 'voice',
        label: 'Voice Lounge',
        desc: 'Encrypted WebRTC voice mesh with low latency audio.',
        icon: <Volume2 className="w-5 h-5 text-emerald-400" />,
      },
      {
        type: 'announcement',
        label: 'Announcement Feed',
        desc: 'Read-only updates channel for system notifications.',
        icon: <Radio className="w-5 h-5 text-indigo-400" />,
      },
      {
        type: 'vault',
        label: 'Encrypted Vault',
        desc: 'Top secret dual-layer zero-knowledge encrypted chamber.',
        icon: <Lock className="w-5 h-5 text-amber-400" />,
      },
    ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        id="modal-create-channel"
        className="w-full max-w-lg bg-[#0d1017] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-4 bg-[#121622] border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>{channelToEdit ? 'Edit Channel' : 'Create Channel'}</span>
            <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded font-mono">
              AES-GCM-256
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Channel Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">CHANNEL TYPE</label>
            <div className="space-y-1.5">
              {channelTypes.map((ct) => (
                <button
                  key={ct.type}
                  type="button"
                  onClick={() => setType(ct.type)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    type === ct.type
                      ? 'bg-slate-800 border-indigo-500 text-white'
                      : 'bg-[#090b0e] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-900 shrink-0">{ct.icon}</div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-200">{ct.label}</div>
                    <div className="text-[11px] text-slate-400">{ct.desc}</div>
                  </div>
                  {type === ct.type && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">CHANNEL NAME</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">#</span>
              <input
                id="input-channel-name"
                type="text"
                required
                placeholder="new-channel"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-_]/g, '')
                  )
                }
                className="w-full bg-[#090b0e] border border-slate-700/80 focus:border-indigo-500 rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono outline-none"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">CATEGORY</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[#090b0e] border border-slate-700/80 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">TOPIC / DESCRIPTION</label>
            <input
              type="text"
              placeholder="What is this channel for?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#090b0e] border border-slate-700/80 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          {/* Private Channel Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#090b0e] border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">Restricted / Private Channel</div>
                <div className="text-[11px] text-slate-400">
                  Only specified roles and operatives can view this channel.
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPrivate || type === 'vault'}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={type === 'vault'}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-channel-form"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow-lg shadow-indigo-600/30"
            >
              {channelToEdit ? 'Save Changes' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
