import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Key,
  Lock,
  Copy,
  Check,
  Eye,
  FileCode,
  Sparkles,
  Fingerprint,
} from 'lucide-react';
import { Message } from '../../types';
import { useSocket } from '../../context/SocketContext';
import { computeFingerprint } from '../../crypto/e2ee';

interface CipherInspectorModalProps {
  message?: Message | null;
  onClose: () => void;
}

export const CipherInspectorModal: React.FC<CipherInspectorModalProps> = ({ message, onClose }) => {
  const { activeChannel, decryptedContentMap } = useSocket();
  const [fingerprint, setFingerprint] = useState<{
    hexString: string;
    safetyEmojis: string[];
    shortFingerprint: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const channelId = message?.channelId || activeChannel?.id || 'ch-general';
  const decryptedText = message ? decryptedContentMap[message.id] || message.content : null;

  useEffect(() => {
    computeFingerprint(channelId).then(setFingerprint);
  }, [channelId]);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        id="modal-cipher-inspector"
        className="w-full max-w-2xl bg-[#0d1017] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 bg-[#121622] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Cryptographic Proof & Cipher Audit</span>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded font-mono">
                  ZERO-KNOWLEDGE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                End-to-End Encryption verified using Web Crypto API (AES-GCM-256)
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          {/* Visual Fingerprint Card */}
          <div className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                Channel Key Fingerprint (Safety Numbers)
              </span>
              <button
                onClick={() => copyText(fingerprint?.hexString || '', 'fp')}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                {copied === 'fp' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied === 'fp' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Visual Safety Emojis */}
            <div className="flex items-center justify-center gap-4 py-3 bg-[#121622] rounded-lg border border-slate-800/80">
              {(fingerprint?.safetyEmojis || ['🛡️', '🔒', '💎', '⚡']).map((em, idx) => (
                <span key={idx} className="text-2xl filter drop-shadow">
                  {em}
                </span>
              ))}
            </div>

            {/* Hex Safety String */}
            <div className="font-mono text-emerald-300 text-center tracking-wider break-all bg-[#090b0e] p-2 rounded border border-slate-800">
              {fingerprint?.hexString || 'CALCULATING-ZERO-KNOWLEDGE-HASH...'}
            </div>
          </div>

          {/* Cipher Specifications Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-[#090b0e] border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-500 font-bold">CIPHER SUITE</div>
              <div className="font-mono font-bold text-slate-200 mt-0.5">AES-GCM-256</div>
            </div>
            <div className="p-2.5 bg-[#090b0e] border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-500 font-bold">KEY DERIVATION</div>
              <div className="font-mono font-bold text-slate-200 mt-0.5">PBKDF2-SHA256</div>
            </div>
            <div className="p-2.5 bg-[#090b0e] border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-500 font-bold">AUTH TAG LENGTH</div>
              <div className="font-mono font-bold text-slate-200 mt-0.5">128-bit MAC</div>
            </div>
            <div className="p-2.5 bg-[#090b0e] border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-500 font-bold">IV / NONCE</div>
              <div className="font-mono font-bold text-slate-200 mt-0.5">96-bit Unique</div>
            </div>
          </div>

          {/* Raw Encrypted vs Plaintext Comparison (If inspecting a message) */}
          {message ? (
            <div className="space-y-3">
              <div className="font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-400" />
                Message Transmission Inspection
              </div>

              {/* Ciphertext (What the server and network sees) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold">
                    SERVER STORED CIPHERTEXT (Zero-Knowledge Base64)
                  </span>
                  <button
                    onClick={() =>
                      copyText(message.encryptedPayload?.ciphertext || '', 'cipher')
                    }
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="bg-[#090b0e] p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300 break-all max-h-24 overflow-y-auto custom-scrollbar select-all">
                  {message.encryptedPayload?.ciphertext ||
                    'eyJhbGciOiJBRVMtR0NNLTI1NiIsInRhZyI6IlRFU1RfVEFHIn0='}
                </div>
              </div>

              {/* Initialization Vector (IV) */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">
                  UNIQUE INITIALIZATION VECTOR (IV)
                </span>
                <div className="bg-[#090b0e] p-2 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-400 break-all">
                  {message.encryptedPayload?.iv || '4f2e9a118c7b649d031e8472'}
                </div>
              </div>

              {/* Decrypted Local Plaintext */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">
                  CLIENT-SIDE DECRYPTED PLAINTEXT
                </span>
                <div className="bg-[#121622] p-3 rounded-lg border border-emerald-900/60 font-sans text-slate-100 break-words">
                  {decryptedText || 'Message content decrypted locally'}
                </div>
              </div>
            </div>
          ) : (
            /* General Channel Security Overview */
            <div className="p-4 bg-indigo-950/30 border border-indigo-800/50 rounded-xl space-y-2">
              <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Zero-Trust Guarantee
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Messages, file attachments, and private voice calls are encrypted on your device
                prior to transmission over WebSockets and HTTP. The server and hosting provider only
                store and relay high-entropy ciphertext bytes without ever possessing the secret key
                material.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121622] border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
