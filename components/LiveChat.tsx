
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface LiveChatProps {
  voiceName?: string;
  onClose: () => void;
}

// --- Audio Helpers ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Fix: Added React import above to resolve 'Cannot find namespace React' error.
const LiveChat: React.FC<LiveChatProps> = ({ voiceName = 'Kore', onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = async () => {
    console.debug("[DHSYSTEM-DEBUG] Stopping LiveChat session...");
    if (sessionRef.current) {
       try {
           const session = await sessionRef.current;
           session.close();
           console.debug("[DHSYSTEM-DEBUG] session.close() called.");
       } catch (e) {
           console.warn("[DHSYSTEM-DEBUG] Error closing session:", e);
       }
       sessionRef.current = null;
    }

    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (inputContextRef.current) {
        inputContextRef.current.close().catch(() => {});
        inputContextRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsInitializing(false);
  };

  const startSession = async () => {
    console.debug("[DHSYSTEM-DEBUG] Starting LiveChat session...");
    setError(null);
    setIsInitializing(true);

    try {
      const manualKey = localStorage.getItem('manual_api_key');
      const apiKey = manualKey || process.env.API_KEY;
      
      if (!apiKey) {
        throw new Error("Chưa cấu hình API Key.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = audioContextRef.current.createGain();
      outputNode.connect(audioContextRef.current.destination);

      try {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.debug("[DHSYSTEM-DEBUG] Microphone stream acquired.");
      } catch (mediaErr: any) {
          console.error("[DHSYSTEM-DEBUG] Microphone error:", mediaErr);
          throw new Error("Vui lòng cấp quyền Microphone.");
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
            },
            systemInstruction: "Bạn là giảng viên môn Nguồn điện an toàn và môi trường. Hãy trò chuyện chuyên nghiệp, đặt câu hỏi kiểm tra kiến thức cho sinh viên về an toàn điện."
        },
        callbacks: {
            onopen: () => {
                console.debug("[DHSYSTEM-DEBUG] Live session connection OPENED.");
                setIsConnected(true);
                setIsInitializing(false);
                
                if (!inputContextRef.current || !streamRef.current) return;
                const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
                const scriptProcessor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
                processorRef.current = scriptProcessor;

                scriptProcessor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    // CRITICAL: Ensure data is streamed only after the session promise resolves.
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputContextRef.current.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio) {
                    console.debug("[DHSYSTEM-DEBUG] Audio chunk received. Decoding...");
                    if (audioContextRef.current) {
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                        const source = audioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputNode);
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                }
                if (message.serverContent?.interrupted) {
                     console.debug("[DHSYSTEM-DEBUG] Model interrupted. Stopping audio playback.");
                     sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
                     sourcesRef.current.clear();
                     nextStartTimeRef.current = 0;
                }
            },
            onclose: () => {
                console.debug("[DHSYSTEM-DEBUG] Live session CLOSED.");
                setIsConnected(false);
                setIsInitializing(false);
            },
            onerror: async (err: any) => {
                console.error("[DHSYSTEM-DEBUG] Live API Error event:", err);
                setError("Lỗi kết nối AI. Vui lòng kiểm tra lại API Key.");
                setIsConnected(false);
                stopSession();
            }
        }
      });
      sessionRef.current = sessionPromise;

    } catch (err: any) {
        console.error("[DHSYSTEM-DEBUG] Session Initialization failed:", err);
        setError(err.message || "Lỗi khởi tạo hội thoại.");
        setIsInitializing(false);
        stopSession();
    }
  };

  useEffect(() => {
      return () => { stopSession(); };
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white font-inter">
      <div className="mb-8 relative">
        <div className={`absolute -inset-10 bg-blue-500/10 rounded-full blur-2xl transition-transform duration-700 ${isConnected ? 'scale-150 animate-pulse' : 'scale-0'}`}></div>
        <div className={`w-32 h-32 rounded-3xl flex items-center justify-center bg-white/5 border-2 border-white/10 transition-all duration-500 shadow-2xl ${isConnected ? "scale-110 border-blue-400 bg-blue-500/20" : ""}`}>
            <i className={`fas ${isInitializing ? 'fa-circle-notch fa-spin' : isConnected ? 'fa-volume-high' : 'fa-microphone'} text-5xl`}></i>
        </div>
      </div>

      <div className="text-center space-y-2 mb-10">
        <h3 className="text-2xl font-black">Giảng viên AI</h3>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            {isInitializing ? "Đang kết nối API..." : isConnected ? "Đang lắng nghe & Phản hồi" : "Sẵn sàng vấn đáp chuyên môn"}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500/30 px-6 py-3 rounded-2xl text-center max-w-xs animate-shake">
            <p className="text-red-200 text-[10px] font-black uppercase tracking-tight">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        {!isConnected ? (
            <button
            onClick={startSession}
            disabled={isInitializing}
            className="px-14 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-500 transition-all shadow-xl flex items-center gap-3 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
            >
            <i className="fas fa-play"></i> BẮT ĐẦU HỌC
            </button>
        ) : (
            <button
            onClick={stopSession}
            className="px-14 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all shadow-xl flex items-center gap-3 active:scale-95 uppercase tracking-widest text-sm"
            >
            <i className="fas fa-stop"></i> KẾT THÚC
            </button>
        )}
      </div>
      
      <div className="mt-auto pt-6 text-[9px] text-white/20 font-black uppercase tracking-[0.3em] text-center">
         Engine: Gemini 2.5 Native Audio
      </div>
    </div>
  );
};

export default LiveChat;
