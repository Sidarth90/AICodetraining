'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface TranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
}

export default function WhisperVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError('');
      setTranscription('');
      setAudioUrl('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Convert to base64 and send for transcription
        await transcribeAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const response = await fetch('/api/openai/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio
        }),
      });

      const result: TranscriptionResult = await response.json();
      
      if (result.success && result.text) {
        setTranscription(result.text);
      } else {
        setError(result.error || 'Transcription failed');
      }
    } catch (err) {
      console.error('Error transcribing audio:', err);
      setError('Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearTranscription = () => {
    setTranscription('');
    setError('');
    setAudioUrl('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Whisper Voice Recorder
      </h2>
      
      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-4">
        <motion.button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          className={`relative p-6 rounded-full text-white font-bold transition-all duration-200 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          {isRecording ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </motion.button>

        {/* Recording Status */}
        <div className="text-center">
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
              <span className="text-red-500 font-medium">Recording...</span>
            </motion.div>
          )}
          
          {isTranscribing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
              />
              <span className="text-blue-500 font-medium">Transcribing...</span>
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <p className="text-gray-600 text-center text-sm">
          {isRecording 
            ? 'Speak clearly into your microphone. Click the button to stop recording.' 
            : 'Click the microphone to start recording your voice.'
          }
        </p>
      </div>

      {/* Audio Playback */}
      {audioUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3 mb-3">
            <Volume2 className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Your Recording:</span>
          </div>
          <audio 
            controls 
            src={audioUrl}
            className="w-full"
            preload="metadata"
          >
            Your browser does not support the audio element.
          </audio>
        </motion.div>
      )}

      {/* Transcription Results */}
      {transcription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-green-800">Transcription:</h3>
            <button
              onClick={clearTranscription}
              className="text-sm text-green-600 hover:text-green-800"
            >
              Clear
            </button>
          </div>
          <p className="text-gray-800 leading-relaxed">{transcription}</p>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <h3 className="font-medium text-red-800 mb-2">Error:</h3>
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}
    </div>
  );
}