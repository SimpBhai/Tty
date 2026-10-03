import React from 'react';
import { X, ShieldAlert, Clock, User, FileText, CheckCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface AuditLogModalProps {
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ onClose }) => {
  const { auditLogs } = useSocket();
  const { users } = useAuth();

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        id="modal-audit-logs"
        className="w-full max-w-3xl bg-[#0d1017] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 bg-[#121622] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Server Audit Logs & Telemetry</h2>
              <p className="text-xs text-slate-400">
                Immutable record of administrative, provisioning, and channel mutation events.
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

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar text-xs">
          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No audit log entries recorded yet.</div>
          ) : (
            auditLogs.map((log) => {
              const actor = users.find((u) => u.id === log.userId);

              return (
                <div
                  key={log.id}
                  className="p-3 bg-[#090b0e] border border-slate-800/90 rounded-xl flex items-start gap-3 transition-colors hover:border-slate-700"
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-indigo-400 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(log.timestamp)}
                      </span>
                    </div>

                    <div className="text-slate-400">
                      Operative:{' '}
                      <strong className="text-slate-300">
                        @{actor?.username || log.userName || 'System'}
                      </strong>
                    </div>

                    {log.details && (
                      <div className="bg-[#121622] p-2 rounded border border-slate-800/80 font-mono text-[11px] text-slate-300">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121622] border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
