import React from 'react';
import { useStore } from '@nanostores/react';
import {
  zenModeStore,
  settingsOpenStore,
  soundMixerStore,
  timeOfDayStore,
  weatherStore,
} from '../stores/appStore';
import { audioEngine } from '../utils/audio';
import {
  Settings,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const zenMode = useStore(zenModeStore);
  const settingsOpen = useStore(settingsOpenStore);
  const soundMixer = useStore(soundMixerStore);
  const timeOfDay = useStore(timeOfDayStore);
  const weather = useStore(weatherStore);

  const toggleZenMode = () => {
    zenModeStore.set(!zenMode);
  };

  const toggleSettings = () => {
    audioEngine.init();
    settingsOpenStore.set(!settingsOpen);
  };

  const toggleMuteAll = () => {
    audioEngine.init();
    if (soundMixer.masterVolume > 0) {
      soundMixerStore.setKey('masterVolume', 0);
    } else {
      soundMixerStore.setKey('masterVolume', 80);
    }
  };

  if (zenMode) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleZenMode}
          className="w-10 h-10 rounded-full bg-[#1C1D22]/80 hover:bg-[#1C1D22] border border-[#35373E] text-slate-300 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-95"
          title="Exit Zen Mode"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center space-x-2 pointer-events-auto">
      {/* Quick Sound Mute / Unmute */}
      <button
        onClick={toggleMuteAll}
        className="w-10 h-10 rounded-full bg-[#1C1D22]/90 hover:bg-[#25272E] border border-[#35373E] text-slate-300 hover:text-white flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95"
        title={soundMixer.masterVolume > 0 ? 'Mute Audio' : 'Unmute Audio'}
      >
        {soundMixer.masterVolume > 0 ? (
          <Volume2 className="w-4 h-4 text-[#8EA2FF]" />
        ) : (
          <VolumeX className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Zen Mode Button */}
      <button
        onClick={toggleZenMode}
        className="px-3.5 h-10 rounded-full bg-[#1C1D22]/90 hover:bg-[#25272E] border border-[#35373E] text-slate-300 hover:text-white flex items-center space-x-2 shadow-xl backdrop-blur-md transition-all active:scale-95"
        title="Zen Mode"
      >
        <EyeOff className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold tracking-wide">Zen</span>
      </button>

      {/* Settings Gear Button */}
      <button
        onClick={toggleSettings}
        className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95 ${
          settingsOpen
            ? 'bg-[#8EA2FF]/20 border-[#8EA2FF]/50 text-[#B8C4FF]'
            : 'bg-[#1C1D22]/90 hover:bg-[#25272E] border-[#35373E] text-slate-300 hover:text-white'
        }`}
        title="Settings"
      >
        <Settings className={`w-4 h-4 ${settingsOpen ? 'rotate-45' : ''} transition-transform duration-300`} />
      </button>
    </div>
  );
};

