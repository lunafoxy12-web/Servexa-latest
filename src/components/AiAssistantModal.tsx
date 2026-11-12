import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { pbxAudio } from '../utils/audioEngine';
import { ProviderProfile, ServiceItem, AiUploadedMedia } from '../types';
import {
  X,
  Volume2,
  VolumeX,
  Send,
  Bot,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  Wrench,
  AlertTriangle,
  Radio,
  MapPin,
  Clock,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Calendar,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

interface AiAssistantModalProps {
  onSelectCategory: (categoryId: string) => void;
  onBookService?: (provider: ProviderProfile, service: ServiceItem) => void;
}

export interface MatchedSpecialist {
  id: string;
  userId: string;
  businessName: string;
  category: string;
  rating: number;
  completedJobs?: number;
  hourlyRate?: number;
  services?: ServiceItem[];
  distanceKm: number;
  etaMins: number;
  isVerified?: boolean;
  avatar?: string;
  phone?: string;
}

export interface ConversationItem {
  sender: 'user' | 'servexa_ai';
  text: string;
  media?: AiUploadedMedia;
  visualDiagnosis?: string;
  matchedSpecialists?: MatchedSpecialist[];
  estimatedCost?: string;
  urgency?: string;
  suggestedAction?: string;
  action?: any;
  timestamp: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  onSelectCategory,
  onBookService
}) => {
  const {
    isAiModalOpen,
    setIsAiModalOpen,
    aiInitialPrompt,
    setAiInitialPrompt,
    aiInitialMedia,
    setAiInitialMedia,
    setActiveView,
    openChat,
    initiateCall,
    openProviderProfile,
    openOrdersTracking,
    currentUser,
    setIsCartOpen
  } = useAuth();

  const { theme } = useTheme();

  // Settings are configured exclusively in Profile Settings
  const [voicePersona, setVoicePersona] = useState<string>(() => {
    return localStorage.getItem('servexa_ai_persona') || 'sophia';
  });
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('servexa_ai_speed');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [voiceMode, setVoiceMode] = useState<'always_listening' | 'push_to_talk'>(() => {
    return (localStorage.getItem('servexa_ai_voice_mode') as any) || 'always_listening';
  });

  // Re-sync settings when modal opens
  useEffect(() => {
    if (isAiModalOpen) {
      setVoicePersona(localStorage.getItem('servexa_ai_persona') || 'sophia');
      const savedSpeed = localStorage.getItem('servexa_ai_speed');
      if (savedSpeed) setPlaybackSpeed(parseFloat(savedSpeed));
      const savedMode = localStorage.getItem('servexa_ai_voice_mode') as any;
      if (savedMode) setVoiceMode(savedMode);
    }
  }, [isAiModalOpen]);

  // Chat & Problem Diagnosis State
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationItem[]>([]);

  // Attached Media State (Photo / Video of the problem)
  const [attachedMedia, setAttachedMedia] = useState<AiUploadedMedia | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Private per-user AI conversation history
  const aiHistoryStorageKey = currentUser?.id
    ? `servexa_ai_history_${currentUser.id}`
    : 'servexa_ai_history_guest';

  // Load private user-specific AI history on mount or when user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(aiHistoryStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversationHistory(parsed);
          return;
        }
      }
      setConversationHistory([]);
    } catch (e) {
      setConversationHistory([]);
    }
  }, [aiHistoryStorageKey]);

  // Persist private user-specific AI history
  useEffect(() => {
    if (conversationHistory.length > 0) {
      try {
        localStorage.setItem(aiHistoryStorageKey, JSON.stringify(conversationHistory.slice(-40)));
      } catch (e) {}
    }
  }, [conversationHistory, aiHistoryStorageKey]);

  const handleClearMyAiHistory = () => {
    localStorage.removeItem(aiHistoryStorageKey);
    setConversationHistory([]);
  };

  // Finding Specialist State (10km radius radar dispatch)
  const [isFindingSpecialist, setIsFindingSpecialist] = useState(false);
  const [findingSpecialistInfo, setFindingSpecialistInfo] = useState<{
    category: string;
    count: number;
    address: string;
    bookingId?: string;
    problemDesc?: string;
    timerSeconds: number;
  } | null>(null);

  // GPS User Location
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
    language: string;
  }>({
    lat: 37.7749,
    lng: -122.4194,
    label: 'Detecting Location...',
    language: 'en-US'
  });

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Speech Recognition hook
  const { isListening, transcript, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  // Scroll to bottom
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, isFindingSpecialist]);

  // Voice Persona Speech Synthesis
  const speakAloud = useCallback(
    (textToSpeak: string) => {
      if (isMuted) return;
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = playbackSpeed;
      utterance.pitch = voicePersona === 'marcus' ? 0.85 : voicePersona === 'sophia' ? 1.05 : 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        let matchVoice = voices.find(
          (v) =>
            v.lang.startsWith(userLocation.language.slice(0, 2)) &&
            (voicePersona === 'marcus' ? v.name.toLowerCase().includes('male') || v.name.includes('David') : true)
        );
        if (matchVoice) utterance.voice = matchVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isMuted, playbackSpeed, voicePersona, userLocation.language]
  );

  // Navigation Client Actions
  const executeClientAction = useCallback(
    (actionType: string, actionResult: any) => {
      if (actionType === 'NAVIGATE_CATEGORY' && actionResult?.categoryId) {
        onSelectCategory(actionResult.categoryId);
      } else if (actionType === 'VIEW_CART') {
        setIsCartOpen(true);
      } else if (actionType === 'TRACK_ORDERS') {
        openOrdersTracking();
      } else if (actionType === 'CALL_PROVIDER' && actionResult?.providerId) {
        initiateCall(actionResult.providerId, actionResult.providerName || 'Provider', 'provider');
      } else if (actionType === 'NAVIGATE_VIEW' && actionResult?.view) {
        setActiveView(actionResult.view);
      }
    },
    [onSelectCategory, setIsCartOpen, openOrdersTracking, initiateCall, setActiveView]
  );

  // Send request to all available specialists within 10km
  const triggerFindSpecialist10km = async (problemDesc: string, category: string, mediaSnapshot?: AiUploadedMedia | null) => {
    setIsFindingSpecialist(true);
    setFindingSpecialistInfo({
      category: category || 'Emergency Diagnostic',
      count: 3,
      address: userLocation.label || currentUser?.address || '742 Market St, San Francisco, CA',
      problemDesc,
      timerSeconds: 12
    });

    try {
      const res = await fetch('/api/dispatch/problem-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser?.id || 'cust-1',
          problemDescription: problemDesc,
          category: category || 'general',
          customerLocation: {
            lat: userLocation.lat,
            lng: userLocation.lng,
            address: userLocation.label || currentUser?.address || '742 Market St, San Francisco, CA'
          },
          mediaUrl: mediaSnapshot?.dataUrl,
          mediaType: mediaSnapshot?.type || 'image',
          urgency: 'high'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFindingSpecialistInfo((prev) => (prev ? { ...prev, count: data.matchedCount || 3, bookingId: data.booking?.id } : null));

        // When booking is accepted by provider, open chat automatically!
        const bookingId = data.booking?.id;
        if (bookingId) {
          // Poll / listen for acceptance
          const interval = setInterval(async () => {
            try {
              const bRes = await fetch('/api/bookings');
              if (bRes.ok) {
                const bList: any[] = await bRes.json();
                const matched = bList.find((b) => b.id === bookingId);
                if (matched && matched.status === 'accepted') {
                  clearInterval(interval);
                  setIsFindingSpecialist(false);
                  setIsAiModalOpen(false);
                  openChat(bookingId);
                }
              }
            } catch {
              // ignore
            }
          }, 1500);

          setTimeout(() => clearInterval(interval), 30000);
        }
      }
    } catch (e) {
      console.warn('Dispatch error:', e);
    }
  };

  // Process uploaded image or video
  const processSelectedFile = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAttachedMedia({
        file,
        dataUrl,
        type: isVideo ? 'video' : 'image',
        mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        name: file.name,
        sizeBytes: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
    e.target.value = '';
  };

  // Submit query to Servexa AI engine
  const handleLiveTalk = useCallback(
    async (textToAsk?: string, mediaToSubmit?: AiUploadedMedia | null) => {
      const activeMedia = mediaToSubmit !== undefined ? mediaToSubmit : attachedMedia;
      const q = textToAsk !== undefined ? textToAsk : prompt || transcript;
      if (!q.trim() && !activeMedia) return;

      stopListening();
      setLoading(true);

      const mediaSnapshot = activeMedia;
      setAttachedMedia(null);

      const userMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setConversationHistory((prev) => [
        ...prev,
        {
          sender: 'user',
          text:
            q ||
            (mediaSnapshot
              ? `[Uploaded ${mediaSnapshot.type === 'video' ? 'video clip' : 'photo'} of problem for diagnosis]`
              : ''),
          media: mediaSnapshot || undefined,
          timestamp: userMsgTime
        }
      ]);
      setPrompt('');
      resetTranscript();

      try {
        const res = await fetch('/api/ai/live-talk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: q,
            userId: currentUser?.id || 'cust-1',
            userRole: currentUser?.role || 'customer',
            userName: currentUser?.name || 'Customer',
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            language: userLocation.language,
            mediaData: mediaSnapshot ? mediaSnapshot.dataUrl : null,
            mediaMimeType: mediaSnapshot ? mediaSnapshot.mimeType : null,
            mediaType: mediaSnapshot ? mediaSnapshot.type : 'image'
          })
        });

        if (!res.ok) throw new Error('AI Engine service busy');
        const data = await res.json();

        const aiReply =
          data.spokenResponse ||
          data.conversationalReply ||
          'I have analyzed your problem and found available specialists within 10km!';
        const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (data.actionExecuted) {
          executeClientAction(data.actionExecuted, data.actionResult);
        }

        setConversationHistory((prev) => [
          ...prev,
          {
            sender: 'servexa_ai',
            text: aiReply,
            visualDiagnosis: data.visualDiagnosis,
            matchedSpecialists: data.matchedSpecialists,
            estimatedCost: data.estimatedCost,
            urgency: data.urgency,
            suggestedAction: data.suggestedAction,
            action: data.actionExecuted ? { type: data.actionExecuted, result: data.actionResult } : undefined,
            timestamp: aiTime
          }
        ]);

        speakAloud(aiReply);

        // Note: Do not auto-book or auto-dispatch; let user review matched specialists and confirm order explicitly
      } catch (e: any) {
        console.warn('[AI Live Talk Fallback]:', e);
        const fallbackReply = `I've noted your request: "${q}". I found verified specialists in your area. You can review them below and confirm your booking when ready.`;
        setConversationHistory((prev) => [
          ...prev,
          {
            sender: 'servexa_ai',
            text: fallbackReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        speakAloud(fallbackReply);
      } finally {
        setLoading(false);
      }
    },
    [prompt, transcript, attachedMedia, stopListening, resetTranscript, currentUser, userLocation, executeClientAction, speakAloud]
  );

  // Single-Click Full-Duplex Channel Activation
  const activateFullDuplexVoice = useCallback(async () => {
    pbxAudio.ensureContext();

    await pbxAudio.startFullDuplexChannel({
      silenceThresholdMs: 1700,
      energyThreshold: 0.012,
      onSpeechEnd: () => {
        if (voiceMode === 'always_listening' && transcript.trim().length > 3 && !loading) {
          handleLiveTalk(transcript);
        }
      }
    });

    await startListening();
  }, [voiceMode, transcript, loading, handleLiveTalk, startListening]);

  // Sync incoming transcript to prompt
  useEffect(() => {
    if (transcript) {
      setPrompt(transcript);
    }
  }, [transcript]);

  // Equalizer Waveform rendering loop
  useEffect(() => {
    if (!isAiModalOpen) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const buffer = new Uint8Array(64);

    const renderWaveform = () => {
      animationFrameRef.current = requestAnimationFrame(renderWaveform);
      pbxAudio.getFrequencyData(buffer);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 24;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        let val = buffer[i] || 0;
        if (!isListening && !isSpeaking) {
          val = Math.sin(Date.now() / 300 + i * 0.3) * 6 + 10;
        } else if (isSpeaking) {
          val = Math.max(val, Math.sin(Date.now() / 140 + i * 0.35) * 25 + 35);
        }

        const barHeight = Math.max(3, (val / 255) * height * 0.85);
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        if (isSpeaking) {
          grad.addColorStop(0, '#6366f1');
          grad.addColorStop(1, '#8b5cf6');
        } else if (isListening) {
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(1, '#06b6d4');
        } else {
          grad.addColorStop(0, '#94a3b8');
          grad.addColorStop(1, '#cbd5e1');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    renderWaveform();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isAiModalOpen, isListening, isSpeaking]);

  // Initial welcome on opening
  useEffect(() => {
    if (isAiModalOpen) {
      activateFullDuplexVoice();

      if (aiInitialMedia) {
        setAttachedMedia(aiInitialMedia);
        setAiInitialMedia(null);
        setTimeout(() => {
          handleLiveTalk('Please diagnose this uploaded problem and match verified specialists for me.', aiInitialMedia);
        }, 500);
        return;
      }

      let greeting = `Hey hi, welcome to Servexa World! Describe your problem or upload a photo/video, and I will dispatch available specialists in your 10km area.`;
      if (aiInitialPrompt) {
        greeting = `Hey hi! I see you need assistance with ${aiInitialPrompt}. Tell me what's happening or upload a photo/video so I can find verified specialists for you.`;
      }

      if (conversationHistory.length === 0) {
        setConversationHistory([
          {
            sender: 'servexa_ai',
            text: greeting,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        const timer = setTimeout(() => {
          speakAloud(greeting);
        }, 400);
        return () => clearTimeout(timer);
      }
    } else {
      pbxAudio.endFullDuplexChannel();
      stopListening();
    }
  }, [isAiModalOpen, aiInitialPrompt, aiInitialMedia]);

  // GPS coordinates detection
  useEffect(() => {
    if (!isAiModalOpen) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: `GPS: ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`,
            language: navigator.language || 'en-US'
          });
        },
        () => {
          setUserLocation({
            lat: 37.7749,
            lng: -122.4194,
            label: 'San Francisco, CA',
            language: 'en-US'
          });
        }
      );
    }
  }, [isAiModalOpen]);

  // Book matched specialist handler
  const handleBookMatchedSpecialist = (sp: MatchedSpecialist) => {
    if (onBookService) {
      const mockProvider: ProviderProfile = {
        userId: sp.userId || sp.id || 'prov-1',
        businessName: sp.businessName,
        handle: sp.businessName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        bio: 'Verified professional specialist matched by Servexa AI.',
        category: sp.category as any,
        subcategories: ['Rapid Dispatch', 'Diagnostic Inspection'],
        rating: sp.rating,
        reviewCount: 48,
        completedJobs: sp.completedJobs || 52,
        activeStatus: 'online',
        isVerified: true,
        hourlyRate: sp.hourlyRate || 75,
        serviceArea: 'Local Metro Area',
        workingHours: '8:00 AM - 9:00 PM',
        currentLocation: {
          lat: userLocation.lat + 0.01,
          lng: userLocation.lng + 0.01,
          address: 'Specialist Dispatch Center'
        },
        posts: [],
        services: sp.services || [
          {
            id: `srv-${sp.id}-1`,
            name: 'Emergency Problem Resolution & Repair',
            description: 'Direct dispatch for diagnosed problem.',
            price: sp.hourlyRate || 85,
            priceType: 'fixed',
            durationMinutes: 60,
            categoryId: sp.category
          }
        ]
      };

      const primaryService = mockProvider.services[0];
      onBookService(mockProvider, primaryService);
    } else {
      openProviderProfile(sp.id);
    }
  };

  if (!isAiModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Servexa AI Voice & Multimodal Problem Concierge"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 font-normal text-slate-800"
    >
      {/* Clean White Chat Box Container: Well-managed, pure white background, minimal clean options */}
      <div className="relative w-full max-w-full sm:max-w-xl lg:max-w-2xl h-[100dvh] sm:h-[84vh] bg-white text-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col transition-all">
        {/* Mobile Pull Indicator */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Minimal Clean White Header Bar: Just essential options */}
        <div className="p-3 sm:px-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white relative z-10 shrink-0">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="truncate text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium text-xs sm:text-sm text-slate-900 tracking-tight">
                  Servexa AI Concierge
                </h3>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-normal bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Live</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-light truncate">
                Voice & Visual Problem Diagnosis • Managed in Profile Settings
              </p>
            </div>
          </div>

          {/* Action buttons: Clear History, Mute & Close */}
          <div className="flex items-center gap-1 shrink-0">
            {conversationHistory.length > 0 && (
              <button
                type="button"
                onClick={handleClearMyAiHistory}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Clear my private conversation history"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isSpeaking && !isMuted) window.speechSynthesis?.cancel();
                setIsMuted(!isMuted);
              }}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute AI' : 'Mute AI'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAiModalOpen(false);
                setAiInitialPrompt('');
                setAttachedMedia(null);
                setIsFindingSpecialist(false);
                pbxAudio.endFullDuplexChannel();
              }}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors cursor-pointer"
              title="Close AI Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Waveform Equalizer Bar */}
        <div className="px-4 py-1.5 bg-slate-50/70 flex items-center justify-between gap-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isSpeaking
                  ? 'bg-indigo-600 animate-pulse'
                  : isListening
                  ? 'bg-emerald-500 animate-ping'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-[11px] font-normal text-slate-500 truncate">
              {isSpeaking ? 'AI Speaking aloud...' : isListening ? 'Listening (Speak your problem)...' : 'Microphone ready'}
            </span>
          </div>

          <div className="w-24 sm:w-32 h-5 rounded-md overflow-hidden bg-white border border-slate-200/80 shrink-0">
            <canvas ref={canvasRef} width={130} height={20} className="w-full h-full" />
          </div>
        </div>

        {/* Radar "Finding Your Specialist" Banner when customer described problem */}
        {isFindingSpecialist && (
          <div className="p-3 sm:px-4 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-200 text-left shrink-0">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Radio className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-900">
                    We are finding the specialist...
                  </span>
                  <span className="text-[10px] text-indigo-600 font-light bg-white px-1.5 py-0.2 rounded-md border border-indigo-200">
                    10km Area
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-light truncate">
                  Request dispatched to {findingSpecialistInfo?.count || 3} nearby specialists • Chat opens upon acceptance
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFindingSpecialist(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer font-light shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Live Conversation Area (Pure Clean White Background) */}
        <div ref={chatScrollRef} className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-white scrollbar-thin">
          {conversationHistory.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={index}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} text-left space-y-1.5`}
              >
                <div className="flex items-center gap-1 text-[9px] text-slate-400 px-1 font-light">
                  <span>{isUser ? currentUser?.name || 'You' : 'Servexa AI'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs font-light ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/70 rounded-tl-xs'
                  }`}
                >
                  {/* Customer Uploaded Photo / Video Thumbnail in Chat */}
                  {msg.media && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white mb-2">
                      {msg.media.type === 'video' ? (
                        <video
                          src={msg.media.dataUrl}
                          controls
                          playsInline
                          className="max-h-48 sm:max-h-56 w-full object-contain rounded-lg"
                        />
                      ) : (
                        <img
                          src={msg.media.dataUrl}
                          alt="Problem inspection photo"
                          className="max-h-48 sm:max-h-56 w-full object-cover rounded-lg"
                        />
                      )}
                      <div className="p-1 px-2 bg-slate-50 text-[10px] font-mono text-slate-500 flex items-center justify-between border-t border-slate-200">
                        <span className="flex items-center gap-1 truncate">
                          {msg.media.type === 'video' ? (
                            <VideoIcon className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ImageIcon className="w-3 h-3 text-emerald-600" />
                          )}
                          <span className="truncate">{msg.media.name}</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* AI Visual Diagnosis Card */}
                {msg.visualDiagnosis && (
                  <div className="w-full sm:max-w-[88%] p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-left animate-in zoom-in-95 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 border-b border-indigo-100 pb-1.5">
                      <div className="flex items-center gap-1.5 text-indigo-900 font-medium text-xs">
                        <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                        <span>AI Problem Diagnosis</span>
                      </div>
                      {msg.urgency && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-normal uppercase flex items-center gap-1 ${
                            msg.urgency === 'emergency'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {msg.urgency}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-light">
                      {msg.visualDiagnosis}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-indigo-100 text-[11px] text-slate-500 font-light">
                      {msg.estimatedCost && (
                        <div>
                          <span>Estimated repair: </span>
                          <span className="text-emerald-700 font-mono font-medium">{msg.estimatedCost}</span>
                        </div>
                      )}
                      {msg.suggestedAction && (
                        <div className="flex items-center gap-1 text-indigo-700">
                          <CheckCircle2 className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span>{msg.suggestedAction}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Matched Verified Specialists Cards */}
                {msg.matchedSpecialists && msg.matchedSpecialists.length > 0 && (
                  <div className="w-full sm:max-w-[90%] space-y-2 pt-1 animate-in fade-in-50">
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-800">
                      <Radio className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Available Specialists within 10km Area:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.matchedSpecialists.map((sp) => (
                        <div
                          key={sp.id}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 shadow-2xs flex flex-col justify-between gap-2 transition-all text-left"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 truncate">
                                <img
                                  src={sp.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                                  alt={sp.businessName}
                                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                                />
                                <div className="truncate">
                                  <h5 className="text-xs font-medium text-slate-900 truncate">
                                    {sp.businessName}
                                  </h5>
                                  <p className="text-[10px] text-slate-400 font-light">
                                    {sp.hourlyRate ? `$${sp.hourlyRate}/hr` : 'Verified'} • {sp.completedJobs || 42}+ jobs
                                  </p>
                                </div>
                              </div>
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-200 text-[10px] font-normal shrink-0">
                                ★ {sp.rating}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-light">
                              <span className="flex items-center gap-0.5 text-slate-600">
                                <MapPin className="w-3 h-3 text-indigo-600" />
                                {sp.distanceKm} km away
                              </span>
                              <span>•</span>
                              <span className="text-emerald-700 font-normal">
                                ~{sp.etaMins}m ETA
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleBookMatchedSpecialist(sp)}
                              className="flex-1 py-1 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-normal text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Calendar className="w-3 h-3" />
                              <span>Book Specialist</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => initiateCall(sp.userId || sp.id, sp.businessName, 'voice')}
                              className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer border border-emerald-200"
                              title="PBX Voice Call"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openChat(sp.id)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border border-slate-200"
                              title="Chat with Specialist"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-indigo-600 p-2 text-xs font-light">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
              <span>Diagnosing problem and finding specialists within 10km...</span>
            </div>
          )}
        </div>

        {/* Selected media preview banner before sending */}
        {attachedMedia && (
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-left shrink-0">
            <div className="flex items-center gap-2 truncate">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                {attachedMedia.type === 'video' ? (
                  <video src={attachedMedia.dataUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={attachedMedia.dataUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="truncate">
                <p className="text-[11px] font-medium text-slate-900 truncate">{attachedMedia.name}</p>
                <span className="text-[9px] text-slate-500 font-light">Ready to send for 10km specialist matching</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachedMedia(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Clean White Bottom Input Bar */}
        <div className="p-2.5 sm:px-4 bg-white border-t border-slate-100 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLiveTalk();
            }}
            className="flex items-center gap-1.5"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleMediaUpload}
            />

            {/* Paperclip Media Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Upload photo or video of problem"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Input field */}
            <input
              type="text"
              value={prompt || ''}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your problem or issue..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 min-h-[38px] font-light"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={loading || (!prompt.trim() && !attachedMedia)}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all cursor-pointer shadow-2xs shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Send problem description"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
