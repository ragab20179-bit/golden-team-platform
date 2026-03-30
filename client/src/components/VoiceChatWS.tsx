/**
 * VoiceChatWS — Real-Time WebSocket Voice Chat
 *
 * Architecture:
 *   Browser mic → AudioWorklet (PCM16 24kHz mono) → WebSocket (/ws/voice)
 *   → Server relay → OpenAI Realtime API WebSocket
 *   → Server relay → WebSocket → AudioContext playback → Speaker
 *
 * All function calls are executed server-side (no browser round-trip).
 * Transcripts, VAD events, and usage stats are forwarded from the server.
 *
 * Protocol (browser → server):
 *   { type: "audio", audio: "<base64 PCM16>" }
 *   { type: "config", voice, language }
 *   { type: "end" }
 *   { type: "interrupt" }
 *
 * Protocol (server → browser):
 *   { type: "audio", audio: "<base64 PCM16>" }
 *   { type: "transcript_user", text, isFinal }
 *   { type: "transcript_assistant", text, isFinal }
 *   { type: "function_call", name, status, result? }
 *   { type: "session_started", sessionId }
 *   { type: "session_ended", usage }
 *   { type: "vad", event: "speech_started"|"speech_stopped" }
 *   { type: "ai_speaking", speaking }
 *   { type: "usage_update", inputTokens, outputTokens }
 *   { type: "error", message }
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Loader2,
  Radio,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type VoiceId = "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse" | "marin" | "cedar";
type Language = "auto" | "en" | "ar";
type ConnectionState = "idle" | "connecting" | "connected" | "disconnecting" | "error";

interface TranscriptEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

interface FunctionCallEntry {
  id: string;
  name: string;
  status: "executing" | "complete" | "error";
  result?: string;
}

// ─── Voice Selector ───────────────────────────────────────────────────────────

const VOICES: { id: VoiceId; label: string; description: string }[] = [
  { id: "alloy", label: "Alloy", description: "Neutral, balanced — recommended" },
  { id: "ash", label: "Ash", description: "Clear, precise" },
  { id: "ballad", label: "Ballad", description: "Expressive, narrative" },
  { id: "coral", label: "Coral", description: "Friendly, energetic" },
  { id: "echo", label: "Echo", description: "Deep, authoritative" },
  { id: "sage", label: "Sage", description: "Calm, thoughtful" },
  { id: "shimmer", label: "Shimmer", description: "Soft, warm" },
  { id: "verse", label: "Verse", description: "Versatile, professional" },
  { id: "marin", label: "Marin", description: "Smooth, conversational" },
  { id: "cedar", label: "Cedar", description: "Rich, authoritative" },
];

// ─── Audio Worklet Processor (inline) ─────────────────────────────────────────

const WORKLET_CODE = `
class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferSize = 2400; // 100ms at 24kHz
  }
  process(inputs) {
    const input = inputs[0];
    if (input.length === 0) return true;
    const channelData = input[0];
    for (let i = 0; i < channelData.length; i++) {
      // Convert float32 [-1, 1] to int16 [-32768, 32767]
      const s = Math.max(-1, Math.min(1, channelData[i]));
      this._buffer.push(s < 0 ? s * 0x8000 : s * 0x7FFF);
    }
    while (this._buffer.length >= this._bufferSize) {
      const chunk = this._buffer.splice(0, this._bufferSize);
      const int16 = new Int16Array(chunk);
      this.port.postMessage({ pcm16: int16.buffer }, [int16.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm-capture-processor', PCMCaptureProcessor);
`;

// ─── Base64 Helpers ───────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface VoiceChatWSProps {
  onClose?: () => void;
}

export function VoiceChatWS({ onClose }: VoiceChatWSProps) {
  // ── State ──
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>("alloy");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("auto");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [functionCalls, setFunctionCalls] = useState<FunctionCallEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);

  // ── Refs ──
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const sessionStartRef = useRef<Date | null>(null);

  // ── Auto-scroll transcript ──
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, []);

  // ── Audio Playback Queue ──
  const playNextChunk = useCallback(() => {
    if (!playbackContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;
    const float32 = new Float32Array(chunk.length);
    for (let i = 0; i < chunk.length; i++) {
      float32[i] = chunk[i] / 32768;
    }

    const buffer = playbackContextRef.current.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = playbackContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(playbackContextRef.current.destination);
    source.onended = () => {
      playNextChunk();
    };
    source.start();
  }, []);

  const enqueueAudio = useCallback(
    (pcm16: Int16Array) => {
      audioQueueRef.current.push(pcm16);
      if (!isPlayingRef.current) {
        playNextChunk();
      }
    },
    [playNextChunk]
  );

  // ── WebSocket Message Handler ──
  const handleServerMessage = useCallback(
    (event: MessageEvent) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      switch (msg.type) {
        case "audio": {
          const pcm16 = base64ToInt16Array(msg.audio as string);
          enqueueAudio(pcm16);
          break;
        }

        case "transcript_user": {
          const text = msg.text as string;
          const isFinal = msg.isFinal as boolean;
          if (isFinal) {
            finalizeStreamingTranscript("user", text);
          } else {
            updateStreamingTranscript("user", text);
          }
          break;
        }

        case "transcript_assistant": {
          const text = msg.text as string;
          const isFinal = msg.isFinal as boolean;
          if (isFinal) {
            finalizeStreamingTranscript("assistant", text);
          } else {
            updateStreamingTranscript("assistant", text);
          }
          break;
        }

        case "vad": {
          const vadEvent = msg.event as string;
          if (vadEvent === "speech_started") {
            setIsUserSpeaking(true);
            // Interrupt AI if it's speaking
            if (isSpeaking && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "interrupt" }));
              // Clear audio queue
              audioQueueRef.current = [];
            }
          } else if (vadEvent === "speech_stopped") {
            setIsUserSpeaking(false);
          }
          break;
        }

        case "ai_speaking": {
          setIsSpeaking(msg.speaking as boolean);
          if (!(msg.speaking as boolean)) {
            // Clear any remaining audio queue when AI stops
            // audioQueueRef.current = [];
          }
          break;
        }

        case "function_call": {
          const callId = msg.callId as string;
          const name = msg.name as string;
          const status = msg.status as "executing" | "complete" | "error";
          const result = msg.result as string | undefined;

          setFunctionCalls((prev) => {
            const existing = prev.find((fc) => fc.id === callId);
            if (existing) {
              return prev.map((fc) =>
                fc.id === callId ? { ...fc, status, result } : fc
              );
            }
            return [...prev, { id: callId, name, status, result }];
          });
          break;
        }

        case "session_started": {
          setSessionId(msg.sessionId as string);
          setConnectionState("connected");
          addTranscriptEntry("assistant", "NEO Voice is ready. How can I help you?", true);
          break;
        }

        case "session_ended": {
          const usage = msg.usage as {
            inputTokens: number;
            outputTokens: number;
            costUsd: number;
            durationSeconds: number;
          };
          if (usage) {
            setInputTokens(usage.inputTokens);
            setOutputTokens(usage.outputTokens);
          }
          cleanupAll();
          setConnectionState("idle");
          break;
        }

        case "usage_update": {
          setInputTokens(msg.inputTokens as number);
          setOutputTokens(msg.outputTokens as number);
          break;
        }

        case "error": {
          setError(msg.message as string);
          break;
        }
      }
    },
    [enqueueAudio, isSpeaking]
  );

  // ── Transcript Helpers ──
  const addTranscriptEntry = (role: "user" | "assistant", text: string, isFinal: boolean) => {
    setTranscript((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        role,
        text,
        timestamp: new Date(),
        isFinal,
      },
    ]);
  };

  const updateStreamingTranscript = (role: "user" | "assistant", delta: string) => {
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && !last.isFinal) {
        return [...prev.slice(0, -1), { ...last, text: last.text + delta }];
      }
      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          role,
          text: delta,
          timestamp: new Date(),
          isFinal: false,
        },
      ];
    });
  };

  const finalizeStreamingTranscript = (role: "user" | "assistant", text: string) => {
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && !last.isFinal) {
        return [...prev.slice(0, -1), { ...last, text, isFinal: true }];
      }
      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          role,
          text,
          timestamp: new Date(),
          isFinal: true,
        },
      ];
    });
  };

  // ── Start Session ──
  const startSession = useCallback(async () => {
    setError(null);
    setConnectionState("connecting");
    setTranscript([]);
    setFunctionCalls([]);
    setInputTokens(0);
    setOutputTokens(0);

    try {
      // Step 1: Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
        },
      });
      mediaStreamRef.current = stream;

      // Step 2: Set up AudioContext for mic capture
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;

      // Create AudioWorklet from inline code
      const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await audioCtx.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const source = audioCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioCtx, "pcm-capture-processor");
      workletNodeRef.current = workletNode;

      // Step 3: Set up playback context
      const playbackCtx = new AudioContext({ sampleRate: 24000 });
      playbackContextRef.current = playbackCtx;

      // Step 4: Connect WebSocket to server
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/voice?voice=${selectedVoice}&language=${selectedLanguage}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Start capturing audio
        workletNode.port.onmessage = (e: MessageEvent) => {
          if (ws.readyState === WebSocket.OPEN) {
            const pcm16Buffer = e.data.pcm16 as ArrayBuffer;
            const base64 = arrayBufferToBase64(pcm16Buffer);
            ws.send(JSON.stringify({ type: "audio", audio: base64 }));
          }
        };
        source.connect(workletNode);
        workletNode.connect(audioCtx.destination); // needed for worklet to process

        sessionStartRef.current = new Date();
        setSessionStartTime(new Date());
      };

      ws.onmessage = handleServerMessage;

      ws.onerror = () => {
        setError("WebSocket connection error. Please try again.");
        setConnectionState("error");
      };

      ws.onclose = (event) => {
        if (event.code !== 1000) {
          setError(`Connection closed: ${event.reason || "Unknown reason"}`);
        }
        cleanupAll();
        setConnectionState("idle");
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start voice session";
      setError(message);
      setConnectionState("error");
      cleanupAll();
    }
  }, [selectedVoice, selectedLanguage, handleServerMessage]);

  // ── End Session ──
  const endSession = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end" }));
    }
    setConnectionState("disconnecting");
    // Server will send session_ended event which triggers cleanup
    setTimeout(() => {
      cleanupAll();
      setConnectionState("idle");
    }, 3000); // Fallback cleanup after 3s
  }, []);

  // ── Cleanup ──
  const cleanupAll = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    // Stop mic
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    // Close audio contexts
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    playbackContextRef.current?.close().catch(() => {});
    playbackContextRef.current = null;

    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  // ── Mute Toggle ──
  const toggleMute = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // toggle
      });
      setIsMuted((prev) => !prev);
    }
  }, [isMuted]);

  // ── Session Duration ──
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    if (connectionState !== "connected" || !sessionStartTime) {
      setDuration(0);
      return;
    }
    const interval = setInterval(() => {
      setDuration(Math.round((Date.now() - sessionStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [connectionState, sessionStartTime]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";
  const isDisconnecting = connectionState === "disconnecting";

  return (
    <div className="flex flex-col h-full bg-[#05080F] text-white rounded-xl overflow-hidden border border-white/10">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0A0F1E]">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isConnected
                ? isSpeaking
                  ? "bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50"
                  : isUserSpeaking
                  ? "bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50"
                  : "bg-green-400 shadow-lg shadow-green-400/30"
                : isConnecting || isDisconnecting
                ? "bg-amber-400 animate-pulse"
                : "bg-white/20"
            }`}
          />
          <div>
            <div className="font-semibold text-sm text-white flex items-center gap-2">
              NEO Voice
              <Badge variant="outline" className="text-[8px] border-cyan-400/30 text-cyan-400 bg-cyan-400/10 px-1.5 py-0">
                <Wifi className="w-2 h-2 mr-0.5" />
                WS
              </Badge>
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">
              {isConnected
                ? isSpeaking
                  ? "NEO Speaking..."
                  : isUserSpeaking
                  ? "Listening..."
                  : `Connected · ${formatDuration(duration)}`
                : isConnecting
                ? "Connecting..."
                : isDisconnecting
                ? "Ending session..."
                : "Ready"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <Badge
                variant="outline"
                className="text-[10px] border-amber-400/30 text-amber-400 bg-amber-400/10"
              >
                <Radio className="w-2.5 h-2.5 mr-1" />
                LIVE
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className={`h-8 w-8 p-0 ${
                  isMuted
                    ? "text-red-400 hover:text-red-300"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isConnected) endSession();
                onClose();
              }}
              className="h-8 w-8 p-0 text-white/40 hover:text-white"
            >
              ×
            </Button>
          )}
        </div>
      </div>

      {/* ── Visualizer ── */}
      <div className="flex items-center justify-center py-8 relative">
        {/* Outer ring */}
        <div
          className={`absolute w-32 h-32 rounded-full border-2 transition-all duration-300 ${
            isConnected && (isSpeaking || isUserSpeaking)
              ? "border-amber-400/40 scale-110"
              : "border-white/5 scale-100"
          }`}
        />
        {/* Middle ring */}
        <div
          className={`absolute w-24 h-24 rounded-full border transition-all duration-500 ${
            isConnected && isSpeaking
              ? "border-amber-400/60 scale-105"
              : isConnected && isUserSpeaking
              ? "border-blue-400/60 scale-105"
              : "border-white/10 scale-100"
          }`}
        />
        {/* Core button */}
        <button
          onClick={isConnected ? endSession : () => void startSession()}
          disabled={isConnecting || isDisconnecting}
          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl ${
            isConnected
              ? "bg-red-500 hover:bg-red-400 shadow-red-500/30"
              : isConnecting || isDisconnecting
              ? "bg-amber-500/50 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-400 shadow-amber-500/30"
          }`}
        >
          {isConnecting || isDisconnecting ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isConnected ? (
            <PhoneOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-[#05080F]" />
          )}
        </button>
      </div>

      {/* ── Connection Info ── */}
      {!isConnected && !isConnecting && (
        <div className="px-5 pb-4 text-center">
          <p className="text-white/40 text-xs mb-1">
            Real-time WebSocket audio — server-relayed for reliability
          </p>
          <p className="text-white/30 text-[10px]">
            Click the mic button to start a voice conversation with NEO
          </p>
        </div>
      )}

      {/* ── Voice & Language Selectors ── */}
      {!isConnected && !isConnecting && (
        <div className="flex gap-3 px-5 pb-4">
          <div className="flex-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 block">
              Voice
            </label>
            <Select
              value={selectedVoice}
              onValueChange={(v) => setSelectedVoice(v as VoiceId)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F1E] border-white/10">
                {VOICES.map((v) => (
                  <SelectItem
                    key={v.id}
                    value={v.id}
                    className="text-white hover:bg-white/10"
                  >
                    <span className="font-medium">{v.label}</span>
                    <span className="text-white/40 text-xs ml-2">{v.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 block">
              Language
            </label>
            <Select
              value={selectedLanguage}
              onValueChange={(v) => setSelectedLanguage(v as Language)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F1E] border-white/10">
                <SelectItem value="auto" className="text-white hover:bg-white/10">
                  Auto-detect
                </SelectItem>
                <SelectItem value="en" className="text-white hover:bg-white/10">
                  English
                </SelectItem>
                <SelectItem value="ar" className="text-white hover:bg-white/10">
                  Arabic (عربي)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div className="mx-5 mb-3 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-300 text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {/* ── Transcript ── */}
      {transcript.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 mx-5 mb-3">
          <button
            onClick={() => setShowTranscript((p) => !p)}
            className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest mb-2 hover:text-white/60 transition-colors"
          >
            <span>Transcript ({transcript.length})</span>
            {showTranscript ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          {showTranscript && (
            <div className="flex-1 overflow-y-auto space-y-2 max-h-48 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex gap-2 ${
                    entry.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                      entry.role === "user"
                        ? "bg-amber-500/20 text-amber-100 border border-amber-500/20"
                        : "bg-white/5 text-white/80 border border-white/10"
                    } ${!entry.isFinal ? "opacity-60 italic" : ""}`}
                  >
                    {entry.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>
      )}

      {/* ── Function Call Log ── */}
      {functionCalls.length > 0 && (
        <div className="mx-5 mb-3">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5">
            AI Actions
          </div>
          <div className="space-y-1">
            {functionCalls.slice(-5).map((fc) => (
              <div key={fc.id} className="flex items-center gap-2 text-xs">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    fc.status === "complete"
                      ? "bg-green-400"
                      : fc.status === "error"
                      ? "bg-red-400"
                      : "bg-amber-400 animate-pulse"
                  }`}
                />
                <span className="text-white/60 font-mono">
                  {fc.name.replace(/_/g, " ")}
                </span>
                {fc.status === "complete" && (
                  <span className="text-green-400/60 truncate max-w-[120px]">
                    {fc.result}
                  </span>
                )}
                {fc.status === "error" && (
                  <span className="text-red-400/60 truncate max-w-[120px]">
                    {fc.result}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer Stats ── */}
      {isConnected && (
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-white/30">
            <span className="flex items-center gap-1">
              {isMuted ? (
                <VolumeX className="w-3 h-3" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
              {isMuted ? "Muted" : "Active"}
            </span>
            <span>{inputTokens + outputTokens} tokens</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={endSession}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs h-7 px-2"
          >
            End Session
          </Button>
        </div>
      )}
    </div>
  );
}
