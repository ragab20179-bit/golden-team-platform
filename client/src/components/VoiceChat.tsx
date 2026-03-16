/**
 * VoiceChat — Real-Time WebRTC Voice Chat with OpenAI Realtime API
 *
 * Architecture:
 *   1. User clicks "Start Voice" → component calls trpc.neoVoice.getEphemeralToken
 *   2. Server mints a short-lived token (60s TTL) and returns it with the session config
 *   3. Component opens a WebRTC peer connection to OpenAI Realtime API using the token
 *   4. Audio streams bidirectionally: mic → OpenAI, OpenAI audio → speaker
 *   5. A WebRTC data channel carries text events: transcripts, function calls, session events
 *   6. When OpenAI triggers a function call, component calls trpc.neoVoice.executeTool
 *      to run the DB query server-side, then sends the result back via the data channel
 *   7. On session end, component calls trpc.neoVoice.logSessionUsage to record token cost
 *
 * Source: https://developers.openai.com/api/docs/guides/realtime-webrtc/
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Loader2,
  Radio,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type VoiceId = "alloy" | "echo" | "shimmer" | "nova" | "coral" | "fable" | "onyx";
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
  status: "pending" | "complete" | "error";
  result?: string;
}

// ─── Voice Selector ───────────────────────────────────────────────────────────

const VOICES: { id: VoiceId; label: string; description: string }[] = [
  { id: "nova", label: "Nova", description: "Warm, professional — recommended" },
  { id: "alloy", label: "Alloy", description: "Neutral, balanced" },
  { id: "echo", label: "Echo", description: "Clear, precise" },
  { id: "shimmer", label: "Shimmer", description: "Soft, calm" },
  { id: "coral", label: "Coral", description: "Friendly, energetic" },
  { id: "fable", label: "Fable", description: "Expressive, narrative" },
  { id: "onyx", label: "Onyx", description: "Deep, authoritative" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface VoiceChatProps {
  onClose?: () => void;
}

export function VoiceChat({ onClose }: VoiceChatProps) {
  // ── State ──
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>("nova");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("auto");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // AI is speaking
  const [isUserSpeaking, setIsUserSpeaking] = useState(false); // User is speaking (VAD)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [functionCalls, setFunctionCalls] = useState<FunctionCallEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);

  // ── Refs ──
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const sessionStartRef = useRef<Date | null>(null);

  // ── tRPC ──
  const getTokenMutation = trpc.neoVoice.getEphemeralToken.useMutation();
  const executeToolMutation = trpc.neoVoice.executeTool.useMutation();
  const logUsageMutation = trpc.neoVoice.logSessionUsage.useMutation();

  // ── Auto-scroll transcript ──
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      void endSession(true);
    };
  }, []);

  // ─── Session Management ─────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    setError(null);
    setConnectionState("connecting");
    setTranscript([]);
    setFunctionCalls([]);

    try {
      // Step 1: Get ephemeral token from server
      const tokenData = await getTokenMutation.mutateAsync({
        voice: selectedVoice,
        language: selectedLanguage,
      });

      setSessionId(tokenData.sessionId);
      sessionStartRef.current = new Date();
      setSessionStartTime(new Date());

      // Step 2: Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
        },
      });
      localStreamRef.current = stream;

      // Step 3: Create WebRTC peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Step 4: Set up audio output (AI voice → speaker)
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioRef.current = audioEl;

      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];
      };

      // Step 5: Add microphone track to peer connection
      stream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Step 6: Create data channel for text events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setConnectionState("connected");
        addTranscriptEntry("assistant", "NEO Voice is ready. How can I help you?", true);
      };

      dc.onmessage = (event) => {
        void handleDataChannelMessage(event.data);
      };

      dc.onerror = (err) => {
        console.error("[VoiceChat] Data channel error:", err);
        setError("Voice connection error. Please try again.");
        setConnectionState("error");
      };

      // Step 7: Create SDP offer and send to OpenAI
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Source: https://developers.openai.com/api/docs/guides/realtime-webrtc/
      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.ephemeralToken}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        throw new Error(`WebRTC SDP exchange failed: ${sdpResponse.status} ${sdpResponse.statusText}`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start voice session";
      setError(message);
      setConnectionState("error");
      cleanupConnection();
    }
  }, [selectedVoice, selectedLanguage, getTokenMutation]);

  const endSession = useCallback(async (silent = false) => {
    if (connectionState === "idle" && !silent) return;
    setConnectionState("disconnecting");

    // Log usage if we have a session
    if (sessionId && sessionStartRef.current) {
      const durationSeconds = Math.round(
        (Date.now() - sessionStartRef.current.getTime()) / 1000
      );
      try {
        await logUsageMutation.mutateAsync({
          sessionId,
          durationSeconds,
          inputTokens,
          outputTokens,
        });
      } catch (e) {
        // Non-critical — don't block session end
        console.warn("[VoiceChat] Failed to log usage:", e);
      }
    }

    cleanupConnection();
    setConnectionState("idle");
    setSessionId(null);
    setSessionStartTime(null);
    setInputTokens(0);
    setOutputTokens(0);
    setIsSpeaking(false);
    setIsUserSpeaking(false);
  }, [connectionState, sessionId, inputTokens, outputTokens, logUsageMutation]);

  const cleanupConnection = useCallback(() => {
    dcRef.current?.close();
    dcRef.current = null;

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }
  }, []);

  // ─── Data Channel Message Handler ──────────────────────────────────────────

  const handleDataChannelMessage = useCallback(async (rawData: string) => {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawData) as Record<string, unknown>;
    } catch {
      return;
    }

    const eventType = event.type as string;

    switch (eventType) {
      // User speech started (VAD)
      case "input_audio_buffer.speech_started":
        setIsUserSpeaking(true);
        break;

      // User speech ended (VAD)
      case "input_audio_buffer.speech_stopped":
        setIsUserSpeaking(false);
        break;

      // User transcript (from Whisper)
      case "conversation.item.input_audio_transcription.completed": {
        const text = (event.transcript as string) ?? "";
        if (text.trim()) {
          addTranscriptEntry("user", text, true);
        }
        break;
      }

      // AI response text streaming
      case "response.audio_transcript.delta": {
        const delta = (event.delta as string) ?? "";
        if (delta) {
          setIsSpeaking(true);
          updateStreamingTranscript("assistant", delta);
        }
        break;
      }

      // AI response text complete
      case "response.audio_transcript.done": {
        const text = (event.transcript as string) ?? "";
        if (text.trim()) {
          finalizeStreamingTranscript("assistant", text);
        }
        setIsSpeaking(false);
        break;
      }

      // AI stopped speaking
      case "response.audio.done":
        setIsSpeaking(false);
        break;

      // Function call triggered by AI
      case "response.function_call_arguments.done": {
        const callId = (event.call_id as string) ?? "";
        const name = (event.name as string) ?? "";
        const argsStr = (event.arguments as string) ?? "{}";

        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(argsStr) as Record<string, unknown>;
        } catch { /* ignore */ }

        // Add to function call log
        setFunctionCalls((prev) => [
          ...prev,
          { id: callId, name, status: "pending" },
        ]);

        // Execute the tool server-side
        try {
          const validTools = ["get_kpi_status", "search_vault", "get_pending_requests", "raise_request"];
          if (!validTools.includes(name)) {
            throw new Error(`Unknown tool: ${name}`);
          }
          const result = await executeToolMutation.mutateAsync({
            toolName: name as "get_kpi_status" | "search_vault" | "get_pending_requests" | "raise_request",
            arguments: args,
          });

          // Send result back to Realtime API via data channel
          dcRef.current?.send(JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: callId,
              output: JSON.stringify(result),
            },
          }));

          // Trigger AI to respond with the tool result
          dcRef.current?.send(JSON.stringify({ type: "response.create" }));

          setFunctionCalls((prev) =>
            prev.map((fc) =>
              fc.id === callId
                ? { ...fc, status: "complete", result: JSON.stringify(result).slice(0, 100) }
                : fc
            )
          );
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Tool execution failed";
          dcRef.current?.send(JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: callId,
              output: JSON.stringify({ error: errMsg }),
            },
          }));
          dcRef.current?.send(JSON.stringify({ type: "response.create" }));

          setFunctionCalls((prev) =>
            prev.map((fc) =>
              fc.id === callId ? { ...fc, status: "error", result: errMsg } : fc
            )
          );
        }
        break;
      }

      // Token usage tracking
      case "response.done": {
        const usage = event.usage as { input_tokens?: number; output_tokens?: number } | undefined;
        if (usage) {
          setInputTokens((prev) => prev + (usage.input_tokens ?? 0));
          setOutputTokens((prev) => prev + (usage.output_tokens ?? 0));
        }
        break;
      }

      // Session error
      case "error": {
        const errMsg = (event.error as { message?: string })?.message ?? "Unknown error";
        setError(`Voice session error: ${errMsg}`);
        break;
      }
    }
  }, [executeToolMutation]);

  // ─── Transcript Helpers ─────────────────────────────────────────────────────

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
        return [
          ...prev.slice(0, -1),
          { ...last, text: last.text + delta },
        ];
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

  // ─── Mute Toggle ────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // toggle
      });
      setIsMuted((prev) => !prev);
    }
  }, [isMuted]);

  // ─── Session Duration ───────────────────────────────────────────────────────

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
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
            isConnected
              ? isSpeaking
                ? "bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50"
                : isUserSpeaking
                ? "bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50"
                : "bg-green-400 shadow-lg shadow-green-400/30"
              : isConnecting || isDisconnecting
              ? "bg-amber-400 animate-pulse"
              : "bg-white/20"
          }`} />
          <div>
            <div className="font-semibold text-sm text-white">NEO Voice</div>
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
              <Badge variant="outline" className="text-[10px] border-amber-400/30 text-amber-400 bg-amber-400/10">
                <Radio className="w-2.5 h-2.5 mr-1" />
                LIVE
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className={`h-8 w-8 p-0 ${isMuted ? "text-red-400 hover:text-red-300" : "text-white/60 hover:text-white"}`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
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
        <div className={`absolute w-32 h-32 rounded-full border-2 transition-all duration-300 ${
          isConnected && (isSpeaking || isUserSpeaking)
            ? "border-amber-400/40 scale-110"
            : "border-white/5 scale-100"
        }`} />
        {/* Middle ring */}
        <div className={`absolute w-24 h-24 rounded-full border transition-all duration-500 ${
          isConnected && isSpeaking
            ? "border-amber-400/60 scale-105"
            : isConnected && isUserSpeaking
            ? "border-blue-400/60 scale-105"
            : "border-white/10 scale-100"
        }`} />
        {/* Core button */}
        <button
          onClick={isConnected ? () => void endSession() : () => void startSession()}
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
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          ) : isConnected ? (
            <PhoneOff className="w-7 h-7 text-white" />
          ) : (
            <Phone className="w-7 h-7 text-white" />
          )}
        </button>
      </div>

      {/* ── Voice & Language Config (only when idle) ── */}
      {!isConnected && !isConnecting && (
        <div className="px-5 pb-4 flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 block">Voice</label>
            <Select value={selectedVoice} onValueChange={(v) => setSelectedVoice(v as VoiceId)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F1E] border-white/10">
                {VOICES.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-white hover:bg-white/10">
                    <span className="font-medium">{v.label}</span>
                    <span className="text-white/40 text-xs ml-2">{v.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 block">Language</label>
            <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as Language)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F1E] border-white/10">
                <SelectItem value="auto" className="text-white hover:bg-white/10">Auto-detect</SelectItem>
                <SelectItem value="en" className="text-white hover:bg-white/10">English</SelectItem>
                <SelectItem value="ar" className="text-white hover:bg-white/10">Arabic (عربي)</SelectItem>
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
            {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTranscript && (
            <div className="flex-1 overflow-y-auto space-y-2 max-h-48 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex gap-2 ${entry.role === "user" ? "justify-end" : "justify-start"}`}
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
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5">AI Actions</div>
          <div className="space-y-1">
            {functionCalls.slice(-3).map((fc) => (
              <div key={fc.id} className="flex items-center gap-2 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  fc.status === "complete" ? "bg-green-400" :
                  fc.status === "error" ? "bg-red-400" :
                  "bg-amber-400 animate-pulse"
                }`} />
                <span className="text-white/60 font-mono">{fc.name.replace(/_/g, " ")}</span>
                {fc.status === "complete" && (
                  <span className="text-green-400/60 truncate max-w-[120px]">{fc.result}</span>
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
              {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              {isMuted ? "Muted" : "Active"}
            </span>
            <span>{inputTokens + outputTokens} tokens</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void endSession()}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs h-7 px-2"
          >
            End Session
          </Button>
        </div>
      )}
    </div>
  );
}
