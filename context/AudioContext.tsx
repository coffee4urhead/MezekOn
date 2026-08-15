import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AudioContextType {
  currentAudio: {
    fileUrl: string;
    fileName: string;
    fileId: string;
    coverPhotoUrl?: string;
  } | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  isLoaded: boolean;
  playAudio: (fileUrl: string, fileName: string, fileId: string, coverPhotoUrl?: string) => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<{
    fileUrl: string;
    fileName: string;
    fileId: string;
    coverPhotoUrl?: string;
  } | null>(null);

  const player = useAudioPlayer(fileUrl || '');
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
    });
  }, []);

  useEffect(() => {
    if (status?.didJustFinish) {
      stopAudio();
    }
  }, [status?.didJustFinish]);

  const playAudio = async (url: string, fileName: string, fileId: string, coverPhotoUrl?: string) => {
    try {
      setFileUrl(url);
      setCurrentAudio({ fileUrl: url, fileName, fileId, coverPhotoUrl });
      await player.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  };

  const pauseAudio = async () => {
    try {
      await player.pause();
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const resumeAudio = async () => {
    try {
      await player.play();
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  };

  const stopAudio = async () => {
    try {
      await player.pause();
      await player.seekTo(0);
      setFileUrl(null);
      setCurrentAudio(null);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const seekTo = async (position: number) => {
    try {
      await player.seekTo(position);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentAudio,
        isPlaying: status?.playing || false,
        position: status?.currentTime || 0,
        duration: status?.duration || 0,
        isLoaded: status?.isLoaded || false,
        playAudio,
        pauseAudio,
        resumeAudio,
        stopAudio,
        seekTo,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}