import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Shield, User, Volume2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export const IncomingCallModal: React.FC = () => {
  const { activePrivateCall, acceptPrivateCall, declinePrivateCall, endPrivateCall } = useSocket();
  const { currentUser, users, isMuted, toggleMute } = useAuth();
  const [callDuration, setCallDuration] = useState(0);

  const isIncoming = activePrivateCall && currentUser && activePrivateCall.receiverId === currentUser.id;
  const isCaller = activePrivateCall && currentUser && activePrivateCall.callerId === currentUser.id;

  const partnerId = isIncoming
    ? activePrivateCall?.callerId
    : activePrivateCall?.receiverId;
  const partnerUser = users.find((u) => u.id === partnerId);

  useEffect(() => {
    let interval: number;
    if (activePrivateCall && activePrivateCall.status === 'connected') {
      interval = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activePrivateCall?.status]);

  if (!activePrivateCall) return null;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="modal-private-call"
      className="fixed top-5 right-5 z-50 bg-[#0d1017] border border-slate-700/80 rounded-2xl shadow-2xl p-4 w-80 animate-in fade-in slide-in-from-top-4 duration-200"
    >
      <div className="flex items-center gap-3">
        {/* Partner Avatar with animated ring */}
        <div className="relative">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
            style={{ backgroundColor: partnerUser?.avatarColor || '#5865f2' }}
          >
            {partnerUser?.username ? partnerUser.username.slice(0, 2).toUpperCase() : '??'}
          </div>

          {activePrivateCall.status === 'ringing' && (
            <span className="absolute -inset-1 rounded-full border-2 border-indigo-400 animate-ping opacity-80 pointer-events-none" />
          )}
        </div>

        {/* Call Info */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-slate-100 truncate">
            {partnerUser?.username || 'Operative'}
          </div>
          <div className="text-xs text-slate-400 font-mono">#{partnerUser?.tag}</div>

          <div className="text-xs font-semibold mt-0.5 flex items-center gap-1">
            {activePrivateCall.status === 'ringing' ? (
              <span className="text-indigo-400 animate-pulse">
                {isIncoming ? 'Incoming Private Call...' : 'Ringing peer...'}
              </span>
            ) : (
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {formatDuration(callDuration)}
              </span>
            )}
          </div>
        </div>

        {/* E2EE Shield */}
        <div className="text-emerald-400" title="End-to-End Encrypted Voice Stream">
          <Shield className="w-5 h-5" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
        {activePrivateCall.status === 'ringing' && isIncoming ? (
          <>
            <button
              id="btn-call-decline"
              onClick={declinePrivateCall}
              className="flex-1 py-2 px-3 mr-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-rose-800/60"
            >
              <PhoneOff className="w-4 h-4" />
              Decline
            </button>
            <button
              id="btn-call-accept"
              onClick={acceptPrivateCall}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
            >
              <Phone className="w-4 h-4" />
              Accept
            </button>
          </>
        ) : (
          <>
            <button
              id="btn-call-mute-toggle"
              onClick={toggleMute}
              className={`p-2 rounded-lg text-xs font-bold transition-colors ${
                isMuted
                  ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              id="btn-call-end"
              onClick={endPrivateCall}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </button>
          </>
        )}
      </div>
    </div>
  );
};
