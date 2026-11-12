import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { pbxAudio } from '../../utils/audioEngine';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
  Radio,
  ShoppingBag,
  Wrench,
  Palette
} from 'lucide-react';

interface VoiceCommandOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export const VoiceCommandOverlay: React.FC<VoiceCommandOverlayProps> = ({
  isOpen,
  onClose,
  initialCategory
}) => {
  const { currentUser, openOrdersTracking } = useAuth();
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState<'listening' | 'analyzing' | 'executed' | 'speaking'>('listening');
  const [executedData, setExecutedData] = useState<any | null>(null);
  const [pendingProposal, setPendingProposal] = useState<{
    type: string;
    proposedItem: any;
    commandText: string;
  } | null>(null);
  const [spokenReplyText, setSpokenReplyText] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError
  } = useSpeechRecognition();

  // Speak aloud using Web Audio persona engine
  const speakAloud = (text: string) => {
    if (isMuted) return;
    pbxAudio.speakWithPersona(text, 'sophia', 1.05, {
      onStart: () => setStatus('speaking'),
      onEnd: () => setStatus('listening'),
      onError: () => setStatus('listening')
    });
  };

  // On open, start listening immediately and greet if category provided
  useEffect(() => {
    if (isOpen) {
      pbxAudio.ensureContext();
      resetTranscript();
      setExecutedData(null);
      setTranscription('');

      let greeting = `Hey hi, welcome to Servexa World! Tell me how I can help you today — let's discuss your problem and solve this task!`;
      if (initialCategory) {
        greeting = `Hey hi, welcome to Servexa World! I see you need assistance with ${initialCategory}. Tell me how I can help you — let's discuss your problem and solve this task!`;
      }

      setSpokenReplyText(greeting);
      speakAloud(greeting);

      // Start full-duplex microphone listening
      pbxAudio.startFullDuplexChannel({
        silenceThresholdMs: 1600,
        energyThreshold: 0.015,
        onSpeechEnd: () => {
          if (transcription.trim().length > 3) {
            handleExecuteVoiceCommand(transcription);
          }
        }
      });
      startListening();
      setStatus('listening');

      return () => {
        stopListening();
        pbxAudio.endFullDuplexChannel();
      };
    }
  }, [isOpen, initialCategory]);

  // Update transcription from live speech
  useEffect(() => {
    if (transcript) {
      setTranscription(transcript);
    }
  }, [transcript]);

  // When speech pauses or user finishes, auto-execute command
  const handleExecuteVoiceCommand = async (textToRun?: string, isConfirmed?: boolean) => {
    const q = textToRun || transcription || transcript;
    if (!q.trim()) return;

    stopListening();
    setStatus('analyzing');

    try {
      const res = await fetch('/api/ai/live-talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          confirmed: isConfirmed || false,
          userId: currentUser?.id || 'cust-1',
          userRole: currentUser?.role || 'customer',
          userName: currentUser?.name || 'Customer'
        })
      });

      if (!res.ok) throw new Error('AI processing failed');
      const data = await res.json();

      const reply = data.spokenResponse || data.conversationalReply || 'Command executed successfully!';
      setSpokenReplyText(reply);

      if (data.requiresConfirmation && data.actionExecuted === 'PROPOSAL_READY') {
        setStatus('speaking');
        setPendingProposal({
          type: data.proposalType || 'service',
          proposedItem: data.proposedItem,
          commandText: q
        });
      } else if (data.actionExecuted) {
        setStatus('executed');
        setPendingProposal(null);
        setExecutedData({
          type: data.actionExecuted,
          details: data.actionResult || data.booking || data.product || data.order
        });
      } else {
        setStatus('speaking');
      }

      speakAloud(reply);
    } catch (err) {
      const fallback = `I've noted: "${q}". I am connecting you with the closest specialist right now.`;
      setSpokenReplyText(fallback);
      speakAloud(fallback);
      setStatus('listening');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Servexa AI Live Voice Feedback"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl border border-indigo-500/30 shadow-2xl p-5 sm:p-6 overflow-hidden flex flex-col items-center text-center">
        {/* Ambient background glow orb */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar controls */}
        <div className="w-full flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Two-Way Voice HUD</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (status === 'speaking' && !isMuted) {
                  window.speechSynthesis?.cancel();
                }
                setIsMuted(!isMuted);
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Audio Waveform & Animated Sound Ring */}
        <div className="relative my-4 flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              status === 'listening'
                ? 'bg-teal-500/20 ring-8 ring-teal-400/30 animate-pulse'
                : status === 'analyzing'
                ? 'bg-indigo-500/20 ring-8 ring-indigo-400/30'
                : status === 'executed'
                ? 'bg-emerald-500/20 ring-8 ring-emerald-400/40'
                : 'bg-violet-500/20 ring-8 ring-violet-400/30'
            }`}
          >
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                status === 'executed'
                  ? 'bg-emerald-600'
                  : isListening
                  ? 'bg-rose-600'
                  : 'bg-teal-600'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to speak'}
            >
              {status === 'executed' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : isListening ? (
                <MicOff className="w-7 h-7" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>

          {/* Equalizer Frequency Bars */}
          {isListening && (
            <div className="absolute -bottom-3 flex items-center gap-1">
              <span className="w-1 h-3 bg-teal-400 rounded-full animate-pulse" />
              <span className="w-1 h-5 bg-teal-300 rounded-full animate-pulse delay-75" />
              <span className="w-1 h-7 bg-teal-200 rounded-full animate-pulse delay-150" />
              <span className="w-1 h-4 bg-teal-300 rounded-full animate-pulse delay-100" />
              <span className="w-1 h-2 bg-teal-400 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Status text */}
        <h3 className="text-sm font-bold tracking-tight text-white mb-1">
          {status === 'listening'
            ? isListening
              ? 'Listening to your voice command...'
              : 'Tap microphone to speak demand'
            : status === 'analyzing'
            ? 'Servexa AI analyzing & executing...'
            : status === 'executed'
            ? 'Action Executed in Real-Time!'
            : 'Servexa AI speaking...'}
        </h3>

        {/* Real-Time Live Text Transcription */}
        <div className="w-full my-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left min-h-[72px] flex flex-col justify-center">
          <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Radio className="w-3 h-3 text-teal-400" />
            <span>Live Voice Transcription</span>
          </span>
          <p className="text-xs text-white leading-relaxed font-mono">
            {transcription || interimTranscript || (
              <span className="text-white/40 italic">
                Speak now... e.g. "Book AC repair" or "Upload product Drill Set $35"
              </span>
            )}
          </p>
        </div>

        {/* Spoken AI Reply Box */}
        {spokenReplyText && (
          <div className="w-full p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200 text-left mb-3">
            <span className="text-[10px] font-bold text-teal-400 uppercase block mb-0.5">
              Servexa AI Response:
            </span>
            <p className="leading-relaxed">{spokenReplyText}</p>
          </div>
        )}

        {/* Action Confirmation Outcome Card */}
        {executedData && (
          <div className="w-full p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-left flex items-center justify-between gap-3 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {executedData.type === 'BOOKING_CREATED'
                    ? 'Service Booked & Specialist Dispatched'
                    : executedData.type === 'PRODUCT_UPLOADED'
                    ? 'Store Product Published Live'
                    : executedData.type === 'ORDER_PLACED'
                    ? 'Order Submitted & Confirmed'
                    : 'Command Successfully Executed'}
                </h4>
                <p className="text-[11px] text-emerald-300/80">
                  Real-time FCM push notification alert sent to both parties.
                </p>
              </div>
            </div>

            {executedData.type === 'ORDER_PLACED' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openOrdersTracking();
                }}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shrink-0 cursor-pointer"
              >
                Track
              </button>
            )}
          </div>
        )}

        {/* Confirmation Required Proposal Card */}
        {pendingProposal && (
          <div className="w-full p-3.5 bg-amber-950/50 border border-amber-500/40 rounded-2xl text-left my-2 animate-in zoom-in-95 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wider block">
                  Confirmation Required
                </span>
                <h4 className="text-xs font-bold text-white mt-0.5">
                  {pendingProposal.type === 'service'
                    ? pendingProposal.proposedItem?.serviceName
                    : pendingProposal.proposedItem?.productName}
                </h4>
                <p className="text-[10px] text-amber-200/90 mt-0.5">
                  {pendingProposal.type === 'service'
                    ? `Provider: ${pendingProposal.proposedItem?.providerName || 'Verified Specialist'} • Price: $${pendingProposal.proposedItem?.price}`
                    : `Price: $${pendingProposal.proposedItem?.price} • Quantity: ${pendingProposal.proposedItem?.quantity || 1} • Total: $${pendingProposal.proposedItem?.totalAmount}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    handleExecuteVoiceCommand(`${pendingProposal.commandText} confirm order`, true);
                    setPendingProposal(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingProposal(null)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="w-full flex items-center justify-center gap-2 mt-4 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => handleExecuteVoiceCommand()}
            disabled={!transcription.trim()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-40 cursor-pointer"
          >
            Execute Command
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
