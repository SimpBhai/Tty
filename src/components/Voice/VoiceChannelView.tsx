import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  ScreenShare,
  Radio,
  Shield,
  Activity,
  Users,
  Volume2,
  Tv,
  Sparkles,
  UserX,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Channel, VoiceParticipant } from '../../types';
import { UserAvatar } from '../Common/UserAvatar';

interface VoiceChannelViewProps {
  channel: Channel;
}

export const VoiceChannelView: React.FC<VoiceChannelViewProps> = ({ channel }) => {
  const {
    activeVoiceChannelId,
    voiceParticipants,
    joinVoiceChannel,
    leaveVoiceChannel,
    kickUserFromVoice,
    setVoiceSpeaking,
    toggleScreenShare,
    isScreenSharing,
  } = useSocket();

  const { currentUser, users, roles, isMuted, isDeafened, toggleMute, toggleDeafen } = useAuth();
  const canModerateVoice = Boolean(
    currentUser?.isAdmin ||
    currentUser?.isOwner ||
    currentUser?.isSuperAdmin ||
    currentUser?.roleIds?.includes('role-admin') ||
    currentUser?.roleIds?.includes('role-owner')
  );
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [pingMs, setPingMs] = useState(24);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isInThisChannel = activeVoiceChannelId === channel.id;
  const participants = (Object.values(voiceParticipants) as VoiceParticipant[]).filter(
    (p) => p.channelId === channel.id
  );

  // If current user is in voice channel, ensure their participant is listed
  const allChannelParticipants: VoiceParticipant[] = [...participants];
  if (
    isInThisChannel &&
    currentUser &&
    !allChannelParticipants.some((p) => p.userId === currentUser.id)
  ) {
    allChannelParticipants.push({
      userId: currentUser.id,
      channelId: channel.id,
      isMuted,
      isDeafened,
      isSpeaking: false,
      isScreenSharing,
      joinedAt: Date.now(),
    });
  }

  // Audio level generator & mic visualizer
  useEffect(() => {
    if (!isInThisChannel || isMuted) {
      setAudioLevel(0);
      return;
    }

    const interval = setInterval(() => {
      // Simulate real-time audio dynamics for visualizer
      const randomLevel = Math.floor(Math.random() * 85);
      setAudioLevel(randomLevel);
      setVoiceSpeaking(randomLevel > 35);
      setPingMs(20 + Math.floor(Math.random() * 8));
    }, 150);

    return () => clearInterval(interval);
  }, [isInThisChannel, isMuted, setVoiceSpeaking]);

  // Audio waveform animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isInThisChannel && !isMuted && audioLevel > 15) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();

        const sliceWidth = canvas.width / 30;
        let x = 0;

        for (let i = 0; i < 30; i++) {
          const v = Math.sin(phase + i * 0.4) * (audioLevel / 3);
          const y = canvas.height / 2 + v;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.stroke();
        phase += 0.15;
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [isInThisChannel, isMuted, audioLevel]);

  return (
    <div
      id="voice-channel-stage"
      className="flex-1 flex flex-col h-full bg-[#0d1017] relative select-none p-4"
    >
      {/* Voice Room Header Details */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{channel.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 flex items-center gap-1 font-mono">
                <Shield className="w-3 h-3" /> E2EE Audio Mesh
              </span>
            </h2>
            <p className="text-xs text-slate-400">{channel.topic || 'Encrypted Voice Room'}</p>
          </div>
        </div>

        {/* Network & Ping Indicator */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{pingMs} ms</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{allChannelParticipants.length} Connected</span>
          </div>
        </div>
      </div>

      {/* Main Participant Stage Grid */}
      <div className="flex-1 overflow-y-auto py-6">
        {!isInThisChannel && allChannelParticipants.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex items-center justify-center text-indigo-400 shadow-xl">
              <Volume2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-200">No Operatives in Voice Lounge</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Click "Connect to Voice" below to initiate an encrypted WebRTC audio session.
              </p>
            </div>
            <button
              id="btn-join-voice-stage"
              onClick={() => joinVoiceChannel(channel.id)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              Connect to Voice
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allChannelParticipants.map((participant) => {
              const user = users.find((u) => u.id === participant.userId);
              const role = user?.roleIds ? roles.find((r) => r.id === user.roleIds[0]) : null;
              const isCurrentUser = user?.id === currentUser?.id;
              const speaking = isCurrentUser ? audioLevel > 30 : participant.isSpeaking;

              return (
                <div
                  key={participant.userId}
                  id={`voice-card-${participant.userId}`}
                  className={`bg-[#121622] rounded-xl p-4 flex flex-col items-center justify-center relative border transition-all duration-200 shadow-lg ${
                    speaking
                      ? 'border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Speaking Wave Ripple / Glowing Avatar */}
                  <div className="relative mb-3">
                    <UserAvatar
                      user={user}
                      size="2xl"
                      isSpeaking={speaking}
                      className="shadow-xl"
                    />

                    {/* Speaking Glow Ring */}
                    {speaking && (
                      <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none" />
                    )}

                    {/* Mute / Deafen Badges */}
                    <div className="absolute -bottom-1 -right-1 flex gap-1">
                      {participant.isMuted && (
                        <span className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-white border-2 border-[#121622]">
                          <MicOff className="w-3 h-3" />
                        </span>
                      )}
                      {participant.isDeafened && (
                        <span className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-white border-2 border-[#121622]">
                          <Headphones className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Operative Info */}
                  <div className="text-center truncate w-full">
                    <div className="font-bold text-sm text-slate-100 truncate flex items-center justify-center gap-1">
                      <span>{user?.username}</span>
                      {user?.isOwner && <span title="Server Owner">👑</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">#{user?.tag}</div>
                    {role && (
                      <div
                        className="text-[10px] font-semibold mt-1 inline-block px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${role.color}15`,
                          borderColor: `${role.color}40`,
                          color: role.color,
                        }}
                      >
                        {role.name}
                      </div>
                    )}
                  </div>

                  {/* Screen Share Tile Indicator */}
                  {participant.isScreenSharing && (
                    <div className="mt-2 w-full py-1 bg-indigo-950/60 border border-indigo-800/50 rounded flex items-center justify-center gap-1 text-[10px] text-indigo-300 font-semibold animate-pulse">
                      <Tv className="w-3 h-3 text-indigo-400" /> Screen Sharing
                    </div>
                  )}

                  {/* Admin Moderation Action: Kick from Voice Room */}
                  {!isCurrentUser && canModerateVoice && (
                    <button
                      id={`btn-voice-kick-${participant.userId}`}
                      onClick={() => {
                        if (confirm(`Remove operative @${user?.username || 'user'} from this voice lounge?`)) {
                          kickUserFromVoice(channel.id, participant.userId);
                        }
                      }}
                      className="mt-3 w-full py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
                      title="Admin action: Disconnect operative from voice lounge"
                    >
                      <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>Remove from Voice</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-time Audio Visualizer Canvas */}
      {isInThisChannel && (
        <div className="h-10 flex items-center justify-center w-full mb-2">
          <canvas ref={canvasRef} width={300} height={35} className="w-64 h-8 rounded" />
        </div>
      )}

      {/* Bottom Voice Control Bar */}
      <div
        id="voice-controls-dock"
        className="h-16 bg-[#090b0e] border border-slate-800/90 rounded-2xl px-6 flex items-center justify-between shadow-2xl shrink-0"
      >
        {/* Left: Status info */}
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isInThisChannel ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
            }`}
          />
          <div className="text-xs">
            <div className="font-bold text-slate-200">
              {isInThisChannel ? 'Connected & Encrypted' : 'Disconnected'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">WebRTC Opus (48 kHz)</div>
          </div>
        </div>

        {/* Center: Main Toggles */}
        <div className="flex items-center gap-2">
          {isInThisChannel ? (
            <>
              {/* Mic Toggle */}
              <button
                id="btn-voice-toggle-mute"
                onClick={toggleMute}
                className={`p-3 rounded-full transition-all shadow-md ${
                  isMuted
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Deafen Toggle */}
              <button
                id="btn-voice-toggle-deafen"
                onClick={toggleDeafen}
                className={`p-3 rounded-full transition-all shadow-md ${
                  isDeafened
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isDeafened ? 'Undeafen' : 'Deafen'}
              >
                <Headphones className="w-5 h-5" />
              </button>

              {/* Screen Share Toggle */}
              <button
                id="btn-voice-toggle-screen"
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-all shadow-md ${
                  isScreenSharing
                    ? 'bg-indigo-600 text-white shadow-indigo-600/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                <ScreenShare className="w-5 h-5" />
              </button>

              {/* Disconnect Button */}
              <button
                id="btn-voice-leave"
                onClick={leaveVoiceChannel}
                className="px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 ml-2"
                title="Disconnect from voice"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </>
          ) : (
            <button
              id="btn-voice-join-now"
              onClick={() => joinVoiceChannel(channel.id)}
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              Join Voice Lounge
            </button>
          )}
        </div>

        {/* Right: Security info */}
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Zero-Knowledge Mesh</span>
        </div>
      </div>
    </div>
  );
};
