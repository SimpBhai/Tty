import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Volume2,
  Lock,
  Radio,
  Shield,
  Phone,
  Video,
  Pin,
  Users,
  Search,
  PlusCircle,
  Smile,
  Send,
  Trash2,
  Reply,
  CornerDownRight,
  Sparkles,
  Paperclip,
  Check,
  Eye,
  File,
  Image as ImageIcon,
  Key,
  Flame,
  X,
  Menu,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Message, User, Channel } from '../../types';
import { VoiceChannelView } from '../Voice/VoiceChannelView';
import { UserAvatar } from '../Common/UserAvatar';

interface ChatAreaProps {
  isDirectMessages: boolean;
  onOpenCipherInspector: (msg?: Message) => void;
  onToggleMemberList: () => void;
  isMemberListOpen: boolean;
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  isDirectMessages,
  onOpenCipherInspector,
  onToggleMemberList,
  isMemberListOpen,
  onToggleMobileNav,
  isMobileNavOpen,
}) => {
  const {
    activeChannel,
    activeDmUser,
    messages,
    decryptedContentMap,
    sendMessage,
    toggleReaction,
    deleteMessage,
    typingUsers,
    sendTyping,
    initiatePrivateCall,
    activeVoiceChannelId,
  } = useSocket();

  const { currentUser, users, roles, hasPermission } = useAuth();

  const [inputContent, setInputContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // messageId or 'input'
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number; base64: string } | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [selectedMobileMsgId, setSelectedMobileMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentChannelId = isDirectMessages
    ? currentUser && activeDmUser
      ? [currentUser.id, activeDmUser.id].sort().join('-')
      : ''
    : activeChannel?.id || '';

  const canSendMessages = hasPermission('SEND_MESSAGES', activeChannel?.id);
  const canAttachFiles = hasPermission('ATTACH_FILES', activeChannel?.id);
  const canManageMessages = hasPermission('MANAGE_MESSAGES', activeChannel?.id);

  // Filter messages for active channel/DM
  const channelMessages = messages.filter((m) => m.channelId === currentChannelId);
  const displayedMessages = showPinnedOnly ? channelMessages.filter((m) => m.pinned) : channelMessages;

  // Auto scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() && !selectedFile) return;
    if (!canSendMessages && !isDirectMessages) return;

    const attachments = selectedFile
      ? [
          {
            id: `att-${Date.now()}`,
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.name.endsWith('.png') || selectedFile.name.endsWith('.jpg') ? 'image' : 'file',
            url: selectedFile.base64,
          },
        ]
      : undefined;

    await sendMessage(inputContent, attachments, replyingTo?.id);
    setInputContent('');
    setSelectedFile(null);
    setReplyingTo(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputContent(e.target.value);
    if (currentChannelId) {
      sendTyping(currentChannelId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        size: file.size,
        base64: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const commonEmojis = ['👍', '❤️', '🔥', '🛡️', '🔒', '🎉', '😂', '🚀', '💎', '👀'];

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Simple safe markdown renderer with bold, italic, code, blockquote and spoilers
  const renderFormattedText = (text: string) => {
    if (!text) return null;

    // Check for spoiler tags ||text||
    const parts = text.split(/(\|\|.*?\|\|)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('||') && part.endsWith('||')) {
        const secret = part.slice(2, -2);
        return <SpoilerTag key={idx} text={secret} />;
      }

      // Check code blocks
      const lines = part.split('\n');
      return (
        <span key={idx} className="whitespace-pre-wrap break-words">
          {lines.map((line, lIdx) => {
            // Bold **text**
            let formattedLine: React.ReactNode = line;
            if (line.includes('**')) {
              const boldSegments = line.split(/(\*\*.*?\*\*)/g);
              formattedLine = boldSegments.map((seg, sIdx) => {
                if (seg.startsWith('**') && seg.endsWith('**')) {
                  return (
                    <strong key={sIdx} className="font-bold text-white">
                      {seg.slice(2, -2)}
                    </strong>
                  );
                }
                return seg;
              });
            }
            return (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {formattedLine}
              </React.Fragment>
            );
          })}
        </span>
      );
    });
  };

  // If we are currently inside an active voice channel in voice lounge mode
  const isViewingVoiceLounge = !isDirectMessages && activeChannel?.type === 'voice';

  return (
    <div id="chat-area" className="flex-1 flex flex-col h-full bg-[#161b26] relative overflow-hidden">
      {/* Top Channel / DM Header */}
      <div
        id="chat-header-bar"
        className="h-12 px-3 sm:px-4 bg-[#12161f]/90 backdrop-blur border-b border-slate-800/80 flex items-center justify-between z-10 shrink-0 select-none gap-2"
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {/* Mobile Navigation Toggle Button */}
          {onToggleMobileNav && (
            <button
              id="btn-mobile-nav-toggle"
              type="button"
              onClick={onToggleMobileNav}
              className="md:hidden p-1.5 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors flex items-center justify-center shrink-0"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {isDirectMessages ? (
            <div className="flex items-center gap-2 truncate">
              {activeDmUser && <UserAvatar user={activeDmUser} size="xs" showStatus />}
              <span className="font-bold text-slate-100 truncate text-sm sm:text-base">
                {activeDmUser?.username || 'Direct Message'}
              </span>
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                #{activeDmUser?.tag || '0000'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 truncate min-w-0">
              {activeChannel?.type === 'voice' ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
              ) : activeChannel?.type === 'announcement' ? (
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0" />
              ) : activeChannel?.isPrivate ? (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
              ) : (
                <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
              )}
              <span className="font-bold text-slate-100 truncate text-sm sm:text-base">
                {activeChannel?.name || 'general-chat'}
              </span>
              {activeChannel?.topic && (
                <>
                  <span className="text-slate-700 hidden sm:inline">|</span>
                  <span className="text-xs text-slate-400 truncate max-w-xs md:max-w-md hidden sm:inline">
                    {activeChannel.topic}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-slate-300 shrink-0">
          {/* E2EE Verified Security Badge */}
          <button
            id="btn-verify-e2ee-header"
            onClick={() => onOpenCipherInspector()}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-400 text-xs font-semibold transition-all shadow-sm group"
            title="Channel End-to-End Encrypted (AES-GCM-256) - Click to Inspect"
          >
            <Shield className="w-3.5 h-3.5 group-hover:scale-110 transition-transform shrink-0" />
            <span className="hidden md:inline">E2EE Verified</span>
          </button>

          {/* Direct Private Call button (for 1-on-1 DMs) */}
          {isDirectMessages && activeDmUser && (
            <button
              id="btn-initiate-dm-call"
              onClick={() => initiatePrivateCall(activeDmUser.id)}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-emerald-400 transition-colors"
              title="Start Encrypted Voice Call"
            >
              <Phone className="w-4 h-4" />
            </button>
          )}

          {/* Toggle Pinned Messages */}
          <button
            id="btn-toggle-pinned-messages"
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            className={`p-1.5 rounded transition-colors ${
              showPinnedOnly ? 'bg-indigo-600/30 text-indigo-400' : 'hover:bg-slate-800 hover:text-slate-100'
            }`}
            title={showPinnedOnly ? 'Show all messages' : 'View Pinned Messages'}
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Toggle Member List */}
          <button
            id="btn-toggle-member-list"
            onClick={onToggleMemberList}
            className={`p-1.5 rounded transition-colors ${
              isMemberListOpen ? 'text-indigo-400 bg-slate-800/80' : 'hover:bg-slate-800 hover:text-slate-100'
            }`}
            title="Toggle Member List"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content View (Voice Lounge or Chat Feed) */}
      {isViewingVoiceLounge ? (
        <VoiceChannelView channel={activeChannel!} />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Pinned Messages Banner */}
          {showPinnedOnly && (
            <div className="bg-indigo-950/60 border-b border-indigo-800/50 px-4 py-1.5 flex items-center justify-between text-xs text-indigo-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Pin className="w-3.5 h-3.5 text-indigo-400" />
                Showing pinned messages only ({displayedMessages.length})
              </span>
              <button
                onClick={() => setShowPinnedOnly(false)}
                className="hover:text-white underline text-[11px]"
              >
                Show All
              </button>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar">
            {/* Channel Welcome Hero */}
            {displayedMessages.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shadow-xl">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">
                  Welcome to {isDirectMessages ? `@${activeDmUser?.username}` : `#${activeChannel?.name}`}!
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  This channel is protected with zero-knowledge AES-GCM-256 encryption. Send your first encrypted transmission below.
                </p>
              </div>
            ) : (
              displayedMessages.map((msg, index) => {
                const author = users.find((u) => u.id === msg.authorId);
                const role = author?.roleIds ? roles.find((r) => r.id === author.roleIds[0]) : null;
                const decryptedText = decryptedContentMap[msg.id] || msg.content;
                const isOwn = msg.authorId === currentUser?.id;
                const canDelete =
                  isOwn ||
                  canManageMessages ||
                  currentUser?.isAdmin ||
                  currentUser?.isSuperAdmin ||
                  currentUser?.isOwner;

                return (
                  <div
                    key={msg.id}
                    id={`message-item-${msg.id}`}
                    onClick={() => setSelectedMobileMsgId(selectedMobileMsgId === msg.id ? null : msg.id)}
                    className="group relative flex gap-2.5 sm:gap-3 px-2 py-1.5 rounded-lg hover:bg-[#121622]/80 transition-colors"
                  >
                    {/* Author Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <UserAvatar user={author} size="md" />
                    </div>

                    {/* Message Body */}
                    <div className="flex-1 min-w-0">
                      {/* Reply Reference if exists */}
                      {msg.replyToMessage && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 pl-2 border-l-2 border-indigo-500/60 truncate">
                          <CornerDownRight className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="font-semibold text-slate-300 shrink-0">
                            @{msg.replyToMessage.authorName}:
                          </span>
                          <span className="truncate italic">
                            {msg.replyToMessage.contentPreview}
                          </span>
                        </div>
                      )}

                      {/* Header (Author, Role Badge, Tag, Timestamp) */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span
                          className="font-bold text-sm hover:underline cursor-pointer"
                          style={{ color: role?.color || '#cbd5e1' }}
                        >
                          {author?.username || 'Unknown Operative'}
                        </span>

                        {author?.isOwner && (
                          <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/50 px-1.5 py-0.2 rounded font-bold">
                            OWNER
                          </span>
                        )}

                        {role && !author?.isOwner && (
                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded font-semibold border"
                            style={{
                              backgroundColor: `${role.color}15`,
                              borderColor: `${role.color}40`,
                              color: role.color,
                            }}
                          >
                            {role.name}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500 font-mono hidden xs:inline">
                          #{author?.tag || '0000'}
                        </span>

                        <span className="text-[10px] text-slate-500">
                          {formatTimestamp(msg.createdAt)}
                        </span>

                        {msg.pinned && (
                          <Pin className="w-3 h-3 text-indigo-400 shrink-0" title="Pinned" />
                        )}
                      </div>

                      {/* Decrypted Plaintext Content */}
                      <div className="text-sm text-slate-200 mt-1 leading-relaxed break-words">
                        {renderFormattedText(decryptedText)}
                      </div>

                      {/* Attachments (if any) */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((att) => (
                            <div key={att.id} className="max-w-md rounded-lg overflow-hidden border border-slate-800 bg-[#0d1017] p-2">
                              {att.type === 'image' && att.url ? (
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="max-h-72 w-auto rounded object-contain"
                                />
                              ) : (
                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                  <File className="w-5 h-5 text-indigo-400" />
                                  <div className="truncate">
                                    <div className="font-semibold truncate">{att.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      {(att.size / 1024).toFixed(1)} KB (AES Encrypted)
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reactions Bar */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {msg.reactions.map((r, rIdx) => {
                            const hasReacted = currentUser && r.userIds.includes(currentUser.id);
                            return (
                              <button
                                key={rIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleReaction(msg.id, r.emoji);
                                }}
                                className={`px-2 py-0.5 rounded-md text-xs flex items-center gap-1 border transition-all ${
                                  hasReacted
                                    ? 'bg-indigo-900/40 border-indigo-500/60 text-indigo-200'
                                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span className="font-bold text-[11px]">{r.userIds.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Floating Action Bar (Visible on Hover and on Mobile Tap) */}
                    <div
                      className={`absolute right-2 -top-3 transition-opacity bg-[#0d1017] border border-slate-800 rounded-lg shadow-lg flex items-center p-0.5 text-slate-400 z-10 ${
                        selectedMobileMsgId === msg.id ? 'opacity-100 ring-1 ring-indigo-500/50' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Emoji React Button */}
                      <div className="relative">
                        <button
                          id={`btn-react-msg-${msg.id}`}
                          onClick={() =>
                            setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)
                          }
                          className="p-1.5 hover:bg-slate-800 hover:text-amber-400 rounded transition-colors"
                          title="Add Reaction"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>

                        {/* Mini Emoji Picker */}
                        {showEmojiPicker === msg.id && (
                          <div className="absolute right-0 bottom-8 bg-[#090b0e] border border-slate-700 rounded-lg shadow-2xl p-1.5 flex gap-1 z-30 animate-in fade-in zoom-in-95 max-w-[85vw] overflow-x-auto">
                            {commonEmojis.map((em) => (
                              <button
                                key={em}
                                onClick={() => {
                                  toggleReaction(msg.id, em);
                                  setShowEmojiPicker(null);
                                }}
                                className="p-1 hover:bg-slate-800 rounded text-sm transition-transform hover:scale-125"
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reply Button */}
                      <button
                        id={`btn-reply-msg-${msg.id}`}
                        onClick={() => setReplyingTo(msg)}
                        className="p-1.5 hover:bg-slate-800 hover:text-slate-100 rounded transition-colors"
                        title="Reply"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>

                      {/* Inspect Ciphertext Button */}
                      <button
                        id={`btn-inspect-cipher-msg-${msg.id}`}
                        onClick={() => onOpenCipherInspector(msg)}
                        className="p-1.5 hover:bg-slate-800 hover:text-emerald-400 rounded transition-colors"
                        title="Inspect Raw E2EE Encrypted Payload"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Message Button */}
                      {canDelete && (
                        <button
                          id={`btn-delete-msg-${msg.id}`}
                          onClick={() => deleteMessage(msg.id)}
                          className="p-1.5 hover:bg-rose-950/60 hover:text-rose-400 rounded transition-colors"
                          title="Delete Message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          {currentChannelId && typingUsers[currentChannelId]?.length > 0 && (
            <div className="px-4 py-1 text-xs text-slate-400 italic flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{typingUsers[currentChannelId].join(', ')} is typing...</span>
            </div>
          )}

          {/* Message Input Box Container */}
          <div className="p-3 bg-[#12161f]/90 border-t border-slate-800/80">
            {/* Replying banner */}
            {replyingTo && (
              <div className="flex items-center justify-between bg-slate-800/80 px-3 py-1.5 rounded-t-lg text-xs text-slate-300 border-x border-t border-slate-700/60">
                <span className="flex items-center gap-1.5 truncate">
                  <Reply className="w-3.5 h-3.5 text-indigo-400" />
                  Replying to{' '}
                  <strong className="text-white">
                    @{users.find((u) => u.id === replyingTo.authorId)?.username || 'Operative'}
                  </strong>
                </span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-0.5 hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Selected File Banner */}
            {selectedFile && (
              <div className="flex items-center justify-between bg-slate-800/80 px-3 py-1.5 text-xs text-emerald-400 border-x border-slate-700/60">
                <span className="flex items-center gap-1.5 truncate font-mono">
                  <Paperclip className="w-3.5 h-3.5" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB) - Will be encrypted
                </span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-0.5 hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className={`bg-[#0a0c10] border border-slate-800/90 focus-within:border-indigo-500/80 rounded-lg p-1.5 sm:p-2 transition-all shadow-inner ${
                replyingTo || selectedFile ? 'rounded-t-none' : ''
              }`}
            >
              <div className="flex items-start gap-1.5 sm:gap-2">
                {/* File Attachment Trigger */}
                {canAttachFiles && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      id="btn-chat-attach-file"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 sm:p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 rounded-lg transition-colors shrink-0"
                      title="Attach Encrypted File / Image"
                    >
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Textarea */}
                <textarea
                  id="input-chat-message"
                  value={inputContent}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    canSendMessages || isDirectMessages
                      ? `Message ${isDirectMessages ? `@${activeDmUser?.username}` : `#${activeChannel?.name}`} (AES-GCM-256)`
                      : 'No permission to send'
                  }
                  disabled={!canSendMessages && !isDirectMessages}
                  rows={1}
                  className="flex-1 bg-transparent text-base sm:text-sm text-slate-100 placeholder-slate-500 resize-none outline-none max-h-32 custom-scrollbar pt-1.5"
                />

                {/* Quick Emoji Picker & Send */}
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <div className="relative">
                    <button
                      type="button"
                      id="btn-chat-emoji-picker"
                      onClick={() =>
                        setShowEmojiPicker(showEmojiPicker === 'input' ? null : 'input')
                      }
                      className="p-2 sm:p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 rounded-lg transition-colors"
                      title="Insert Emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    {showEmojiPicker === 'input' && (
                      <div className="absolute right-0 bottom-11 bg-[#090b0e] border border-slate-700 rounded-lg shadow-2xl p-2 grid grid-cols-5 gap-1.5 z-30 animate-in fade-in zoom-in-95 max-w-[85vw]">
                        {commonEmojis.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => {
                              setInputContent((prev) => prev + em);
                              setShowEmojiPicker(null);
                            }}
                            className="p-1.5 hover:bg-slate-800 rounded text-base transition-transform hover:scale-125"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    id="btn-chat-send"
                    disabled={(!inputContent.trim() && !selectedFile) || (!canSendMessages && !isDirectMessages)}
                    className="p-2 sm:p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors shadow-sm shrink-0"
                    title="Send Encrypted Transmission"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Spoiler component
const SpoilerTag: React.FC<{ text: string }> = ({ text }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
        revealed
          ? 'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
          : 'bg-slate-800 text-transparent hover:bg-slate-700 select-none'
      }`}
      title={revealed ? 'Click to conceal' : 'Click to reveal confidential spoiler'}
    >
      {text}
    </span>
  );
};
