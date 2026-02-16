import React, { useState, useEffect, useRef, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import hark from 'hark';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { toast } from "sonner";

interface VoiceInputProps {
  onTranscriptUpdate: (text: string, isFinal: boolean) => void;
  onLLMMessage: (text: string, isFinal: boolean) => void;
}

export function VoiceInput({ onTranscriptUpdate, onLLMMessage }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const speechEventsRef = useRef<any>(null);

  // Use environment variable or default to localhost
  const WS_URL = 'ws://localhost:8000/api/v1/chat/ws';

  const { sendMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL, {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    onOpen: () => {
      console.log('WebSocket Connected');
      toast.success("语音服务已连接");
    },
    onClose: () => {
      console.log('WebSocket Disconnected');
      toast.error("语音服务已断开");
    },
    onError: (e) => {
      console.error('WebSocket Error', e);
      toast.error("语音服务连接错误");
    },
  });

  // Handle incoming messages
  useEffect(() => {
    if (lastJsonMessage) {
      const msg = lastJsonMessage as any;
      if (msg.type === 'asr_partial') {
        // Real-time partial result
        onTranscriptUpdate(msg.content, false);
        setStatus('speaking');
      } else if (msg.type === 'asr_final') {
        // Final result for a sentence, but not sending to LLM yet
        onTranscriptUpdate(msg.content, false);
        setStatus('listening');
      } else if (msg.type === 'asr_stopped') {
        // Recording stopped completely
        setStatus('idle');
      } else if (msg.type === 'llm_chunk') {
        onLLMMessage(msg.content, false);
        setStatus('processing');
      } else if (msg.type === 'llm_end') {
        onLLMMessage(msg.content, true);
        setStatus('idle');
      } else if (msg.type === 'error') {
        toast.error(msg.content);
        stopRecording();
      }
    }
  }, [lastJsonMessage, onTranscriptUpdate, onLLMMessage]);

  const processAudio = useCallback((inputData: Float32Array) => {
    if (readyState !== ReadyState.OPEN || !isRecordingRef.current) return;

    // Resample to 16000Hz
    const targetSampleRate = 16000;
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;

    const sourceSampleRate = audioCtx.sampleRate;

    // Simple downsampling
    // If source is 48000, ratio is 3. We take every 3rd sample approx.
    // Better: Linear Interpolation

    const ratio = sourceSampleRate / targetSampleRate;
    const newLength = Math.floor(inputData.length / ratio);
    const result = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIndex = Math.floor(i * ratio);
      let s = inputData[originalIndex];
      // Clamp to [-1, 1]
      s = Math.max(-1, Math.min(1, s));
      // Convert to 16-bit PCM
      result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Send binary data
    sendMessage(result.buffer);
  }, [readyState, sendMessage]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Setup VAD (Voice Activity Detection)
      // options: threshold (decibels), interval (ms)
      const speechEvents = hark(stream, { threshold: -50, interval: 50 });
      speechEventsRef.current = speechEvents;

      speechEvents.on('speaking', () => {
        // console.log('VAD: Speaking');
        setStatus('speaking');
      });

      speechEvents.on('stopped_speaking', () => {
        // console.log('VAD: Stopped');
        setStatus('listening');
      });

      // Setup Processor
      // bufferSize: 2048, 4096, 8192, 16384
      // 4096 @ 44.1k is ~92ms
      const bufferSize = 4096;
      const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        processAudio(inputData);
      };

      source.connect(processor);
      processor.connect(audioCtx.destination); // Required for Chrome

      // Notify Backend
      sendMessage(JSON.stringify({ type: 'start_recording' }));

      setIsRecording(true);
      isRecordingRef.current = true;
      setStatus('listening');
      toast.success("开始录音");

    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('无法访问麦克风，请检查权限。');
    }
  };

  const stopRecording = () => {
    if (!isRecordingRef.current) return;

    // Stop tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Disconnect nodes
    if (sourceRef.current) sourceRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (speechEventsRef.current) speechEventsRef.current.stop();

    // Reset refs
    streamRef.current = null;
    sourceRef.current = null;
    processorRef.current = null;
    audioContextRef.current = null;
    speechEventsRef.current = null;

    // Notify Backend
    sendMessage(JSON.stringify({ type: 'stop_recording' }));

    setIsRecording(false);
    isRecordingRef.current = false;
    // Status will be updated by backend messages
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={toggleRecording}
        disabled={readyState !== ReadyState.OPEN}
        className={`relative p-2 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center ${isRecording
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-white hover:bg-gray-100 text-black border border-gray-200'
          } ${readyState !== ReadyState.OPEN ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={readyState !== ReadyState.OPEN ? "正在连接服务器..." : isRecording ? "停止录音" : "开始语音对话"}
      >
        {isRecording && (
          <span className="absolute w-full h-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
        )}
        {isRecording ? <Square className="h-5 w-5 z-10" /> : <Mic className="h-5 w-5 z-10" />}
      </button>

      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 h-5 flex items-center justify-center whitespace-nowrap pointer-events-none">
        {status === 'listening' && <span className="text-xs text-gray-500 animate-pulse">正在聆听...</span>}
        {status === 'speaking' && <span className="text-xs text-blue-500 font-medium flex items-center"><Volume2 className="h-3 w-3 mr-1" /> 检测到语音</span>}
        {status === 'processing' && <span className="text-xs text-green-600 font-medium flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" /> AI 思考中...</span>}
      </div>
    </div>
  );
}
