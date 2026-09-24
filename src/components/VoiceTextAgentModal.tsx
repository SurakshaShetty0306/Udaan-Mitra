import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Send,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertCircle,
  Globe,
  User,
  Bot,
  RotateCcw,
  PlusCircle
} from 'lucide-react';
import { Customer, ParsedAgentIntent, Transaction, PromiseRecord, Approval } from '../types';
import { processConversationalQuery, ConversationalAgentReply } from '../utils/engine';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from '../utils/i18n';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  time: string;
  intent?: ParsedAgentIntent;
}

interface VoiceTextAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  transactions: Transaction[];
  promises: PromiseRecord[];
  approvals: Approval[];
  onConfirmIntent: (intent: ParsedAgentIntent) => void;
  initialMode?: 'VOICE' | 'TEXT';
  prefilledPrompt?: string;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
}

export const VoiceTextAgentModal: React.FC<VoiceTextAgentModalProps> = ({
  isOpen,
  onClose,
  customers,
  transactions,
  promises,
  approvals,
  onConfirmIntent,
  initialMode = 'VOICE',
  prefilledPrompt = '',
  selectedLanguage,
  onSelectLanguage,
}) => {
  const t = TRANSLATIONS[selectedLanguage];
  const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const [mode, setMode] = useState<'VOICE' | 'TEXT'>(initialMode);
  const [inputText, setInputText] = useState(prefilledPrompt);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechFeedbackAudio, setSpeechFeedbackAudio] = useState(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [liveInterim, setLiveInterim] = useState<string>('');
  
  // Multi-turn chat message history
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingProposal, setPendingProposal] = useState<ParsedAgentIntent | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopAudioMonitoring();
      stopVoiceListening();
    };
  }, []);

  // Initialize initial greeting when opened
  useEffect(() => {
    if (isOpen) {
      setMicError(null);
      if (messages.length === 0) {
        const greeting = selectedLanguage === 'kn'
          ? 'ನಮಸ್ಕಾರ ಸುರಕ್ಷಾ ಅವರೇ! ನಾನು ನಿಮ್ಮ ಉಧಾರ್ ಮಿತ್ರ. ಯಾವುದೇ ಗ್ರಾಹಕರ ಸಾಲ, ಪಾವತಿ ಅಥವಾ ಬಾಕಿ ಬಗ್ಗೆ ಕೇಳಿ.'
          : selectedLanguage === 'hi'
          ? 'नमस्ते सुरक्षा जी! मैं आपका उधार मित्र हूँ। किसी भी ग्राहक की उधारी, जमा या बकाया के बारे में पूछें।'
          : 'Hello Suraksha! I am your Udhaar Mitra assistant. Ask me about any customer balance or record a new transaction.';
        
        setMessages([
          {
            id: 'init_msg',
            role: 'agent',
            text: greeting,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }

      if (prefilledPrompt) {
        setInputText(prefilledPrompt);
        handleSendMessage(prefilledPrompt);
      } else if (initialMode === 'VOICE') {
        startVoiceListening();
      }
    } else {
      stopAudioMonitoring();
      stopVoiceListening();
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, liveInterim, isProcessing]);

  const speakOralResponse = (textToSpeak: string) => {
    if (!speechFeedbackAudio || !synthRef.current) return;
    try {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = synthRef.current.getVoices();
      const targetLang = langMeta.speechLang;
      const matchedVoice = voices.find(
        (v) => v.lang.startsWith(targetLang) || v.lang.includes(targetLang.split('-')[0])
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      synthRef.current.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  const startAudioMonitoring = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkLevel = () => {
            if (!mediaStreamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(checkLevel);
          };
          checkLevel();
        }
      }
    } catch (err: any) {
      console.warn('Audio stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission was blocked. Please click the lock icon in your browser URL bar to allow microphone.');
      }
    }
  };

  const stopAudioMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const startVoiceListening = async () => {
    setMicError(null);
    setLiveInterim('');
    setIsListening(true);

    await startAudioMonitoring();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('Web Speech API is not supported in this browser. Please type or click the test phrases.');
      setIsListening(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = langMeta.speechLang;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setLiveInterim(transcript);
          setInputText(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Microphone permission denied. Allow microphone access in your browser bar.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioMonitoring();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Could not start recognition:', err);
      setIsListening(false);
      stopAudioMonitoring();
    }
  };

  const stopVoiceListeningAndSend = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    stopAudioMonitoring();
    setIsListening(false);

    const textToSend = (liveInterim || inputText).trim();
    if (textToSend) {
      handleSendMessage(textToSend);
      setLiveInterim('');
      setInputText('');
    }
  };

  const stopVoiceListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    stopAudioMonitoring();
    setIsListening(false);
  };

  // Main interactive message processor
  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;
    stopVoiceListening();

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLiveInterim('');
    setIsProcessing(true);

    setTimeout(() => {
      // Process conversational query with real shopkeeper database context
      const reply: ConversationalAgentReply = processConversationalQuery(
        textToSend,
        selectedLanguage,
        customers,
        transactions,
        promises,
        approvals,
        pendingProposal
      );

      // Check if user confirmed a proposal
      const clean = textToSend.trim().toLowerCase();
      const isAffirmative = clean === 'yes' || clean === 'save' || clean === 'save it' || clean === 'confirm' ||
        clean === 'ಹೌದು' || clean === 'ಸೇವ್ ಮಾಡಿ' || clean === 'ಸರಿ' || clean === 'ಉಳಿಸಿ' || clean === 'ಹಾ' ||
        clean === 'हाँ' || clean === 'सेव करो' || clean === 'haan' || clean === 'theek hai';

      if (isAffirmative && pendingProposal) {
        onConfirmIntent(pendingProposal);
        setPendingProposal(null);
      } else if (reply.hasActionProposal && reply.proposedIntent) {
        setPendingProposal(reply.proposedIntent);
      } else if (clean === 'no' || clean === 'cancel' || clean === 'ಬೇಡ' || clean === 'ರದ್ದು ಮಾಡಿ') {
        setPendingProposal(null);
      }

      const agentMsg: ChatMessage = {
        id: `msg_agent_${Date.now()}`,
        role: 'agent',
        text: reply.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: reply.hasActionProposal ? reply.proposedIntent : undefined,
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsProcessing(false);

      if (reply.speechText) {
        speakOralResponse(reply.speechText);
      }
    }, 450);
  };

  const handleProposalAction = (intent: ParsedAgentIntent, action: 'CONFIRM' | 'CANCEL') => {
    if (action === 'CONFIRM') {
      onConfirmIntent(intent);
      setPendingProposal(null);
      const confirmText = selectedLanguage === 'kn'
        ? `✅ ಖಾತೆಗೆ ಸೇವ್ ಮಾಡಲಾಗಿದೆ! ${intent.customer_name} ಅವರ ಹೊಸ ಪ್ರವೇಶ ದಾಖಲಾಗಿದೆ.`
        : `✅ Saved to database for ${intent.customer_name}!`;
      
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_agent_${Date.now()}`,
          role: 'agent',
          text: confirmText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      speakOralResponse(confirmText);
    } else {
      setPendingProposal(null);
      const cancelText = selectedLanguage === 'kn'
        ? 'ಸರಿ, ಈ ಪ್ರವೇಶವನ್ನು ರದ್ದು ಮಾಡಲಾಗಿದೆ.'
        : 'Understood, cancelled.';
      
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_agent_${Date.now()}`,
          role: 'agent',
          text: cancelText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      speakOralResponse(cancelText);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[85vh] max-h-[700px]">
        {/* Modal Top Header */}
        <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {t.appName}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {t.appSubtitle} · {langMeta.nativeLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-700">
              <Globe size={13} className="text-amber-400 shrink-0" />
              <select
                value={selectedLanguage}
                onChange={(e) => onSelectLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.nativeLabel} ({lang.label})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setSpeechFeedbackAudio(!speechFeedbackAudio)}
              title={speechFeedbackAudio ? 'Speech output on' : 'Speech output off'}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              {speechFeedbackAudio ? <Volume2 size={16} className="text-amber-400" /> : <VolumeX size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mode Selector & Status */}
        <div className="bg-slate-100/90 px-5 py-2 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMode('VOICE');
                startVoiceListening();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                mode === 'VOICE'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic size={14} className={isListening ? 'text-amber-600 animate-pulse' : ''} />
              {t.talkToMitra}
            </button>
            <button
              onClick={() => {
                setMode('TEXT');
                stopVoiceListening();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                mode === 'TEXT'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send size={14} />
              {t.typeToMitra}
            </button>
          </div>

          <span className="text-[11px] text-slate-600 font-medium">
            {selectedLanguage === 'kn' ? 'ಸಂಪೂರ್ಣ ಸಂವಾದಾತ್ಮಕ ಸಹಾಯಕಿ' : 'Interactive Dialogue Agent'}
          </span>
        </div>

        {/* Scrollable Chat Message History */}
        <div ref={chatScrollRef} className="p-4 md:p-6 space-y-4 flex-1 overflow-y-auto bg-slate-50/50">
          {/* Mic Error Banner if needed */}
          {micError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-snug">{micError}</p>
            </div>
          )}

          {/* Render all past messages in conversational thread */}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  m.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-amber-500 text-slate-950 shadow-2xs'
                }`}
              >
                {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-4 text-xs md:text-sm space-y-2 shadow-2xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-xs'
                    : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-100/20">
                  <span className="font-bold uppercase tracking-wider">
                    {m.role === 'user' ? (selectedLanguage === 'kn' ? 'ನೀವು (ದೊಕಾನ್ದಾರ)' : 'Shopkeeper') : 'Udhaar Mitra AI'}
                  </span>
                  <span className="font-mono">{m.time}</span>
                </div>

                <p className="whitespace-pre-line">{m.text}</p>

                {/* If message includes a proposed Action Card */}
                {m.intent && pendingProposal && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-2 mt-2">
                    <div className="flex justify-between items-center text-amber-900 font-bold">
                      <span>{t.iUnderstood}:</span>
                      <span className="font-mono text-slate-900">₹{m.intent.amount?.toLocaleString('en-IN')}</span>
                    </div>

                    <p className="text-slate-700">
                      <strong>{t.customer}:</strong> {m.intent.customer_name} · <strong>{t.promiseDate}:</strong> {m.intent.promise_date || 'Friday'}
                    </p>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleProposalAction(m.intent!, 'CONFIRM')}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={14} className="text-emerald-400" />
                        {t.confirmAndSave}
                      </button>
                      <button
                        onClick={() => handleProposalAction(m.intent!, 'CANCEL')}
                        className="px-3 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Live speech transcription display while user speaks */}
          {isListening && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 max-w-md mx-auto text-center animate-in fade-in">
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-900 font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{t.listening} ({langMeta.nativeLabel})</span>
              </div>

              {/* Dynamic waveform based on real mic volume */}
              <div className="flex items-center justify-center gap-1 py-1">
                {[30, 60, 90, 50, 80, 100, 70, 45, 60, 85].map((h, i) => {
                  const barH = Math.max(6, (h * audioLevel) / 100);
                  return (
                    <span
                      key={i}
                      style={{ height: `${barH}px` }}
                      className="w-1.5 bg-amber-600 rounded-full transition-all duration-75"
                    />
                  );
                })}
              </div>

              {liveInterim ? (
                <p className="text-xs md:text-sm text-slate-900 font-medium italic">
                  “{liveInterim}”
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  {selectedLanguage === 'kn' ? 'ಮಾತನಾಡಿ... ಧ್ವನಿ ಸ್ವೀಕರಿಸಲಾಗುತ್ತಿದೆ' : 'Speak now... capturing your voice'}
                </p>
              )}

              <button
                onClick={stopVoiceListeningAndSend}
                disabled={!liveInterim.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-xs transition-all"
              >
                {selectedLanguage === 'kn' ? 'ಮುಗಿದಿದೆ → ಕಳುಹಿಸಿ' : 'Done Speaking → Send'}
              </button>
            </div>
          )}

          {/* Processing message */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
              <Sparkles size={14} className="text-amber-500 animate-spin" />
              <span>{t.understanding}</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips in Chosen Language */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
            {selectedLanguage === 'kn' ? 'ಉದಾಹರಣೆಗಳು:' : 'Quick:'}
          </span>
          {t.samplePhrases.slice(0, 3).map((phrase, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(phrase)}
              className="bg-white hover:bg-amber-50 hover:text-amber-950 border border-slate-200 hover:border-amber-300 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap text-[11px] transition-colors"
            >
              “{phrase}”
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim()) {
                handleSendMessage(inputText);
              }
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={isListening ? stopVoiceListeningAndSend : startVoiceListening}
              className={`p-2.5 rounded-xl transition-all shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-300'
                  : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900'
              }`}
              title="Tap to speak"
            >
              <Mic size={18} />
            </button>

            <input
              type="text"
              placeholder={
                selectedLanguage === 'kn'
                  ? 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ... (ಉದಾ: ರಾಜು ₹500 ಸಾಲ ತಗೊಂಡಿದ್ದಾರೆ)'
                  : `Type in ${langMeta.nativeLabel}... (e.g. Raju took ₹500 or Who owes money?)`
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs md:text-sm border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-40 transition-colors shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
