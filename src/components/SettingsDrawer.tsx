import React from 'react';
import { useStore } from '@nanostores/react';
import {
  sceneryStore,
  timeOfDayStore,
  weatherStore,
  elementsStore,
  soundMixerStore,
  pomodoroSettingsStore,
  settingsOpenStore,
  setSceneryWithSmartAudio,
  setWeatherWithSmartAudio,
  type SceneryType,
  type TimeOfDayType,
  type WeatherType,
  type ElementsConfig,
} from '../stores/appStore';
import { audioEngine } from '../utils/audio';
import {
  X,
  Volume2,
  Volume1,
  CloudRain,
  Zap,
  Wind,
  Feather,
  Waves,
} from 'lucide-react';

export const SettingsDrawer: React.FC = () => {
  const isOpen = useStore(settingsOpenStore);
  const scenery = useStore(sceneryStore);
  const timeOfDay = useStore(timeOfDayStore);
  const weather = useStore(weatherStore);
  const elements = useStore(elementsStore);
  const soundMixer = useStore(soundMixerStore);
  const pomoSettings = useStore(pomodoroSettingsStore);

  if (!isOpen) return null;

  const handleSoundToggle = (channelKey: 'rain' | 'thunder' | 'trees' | 'birds' | 'waves') => {
    audioEngine.init();
    const current = soundMixer[channelKey];
    soundMixerStore.setKey(channelKey, { ...current, on: !current.on });
  };

  const handleSoundVolume = (
    channelKey: 'rain' | 'thunder' | 'trees' | 'birds' | 'waves',
    val: number
  ) => {
    audioEngine.init();
    const current = soundMixer[channelKey];
    soundMixerStore.setKey(channelKey, { ...current, volume: val });
  };

  const handleMasterVolume = (val: number) => {
    audioEngine.init();
    soundMixerStore.setKey('masterVolume', val);
  };

  const handleElementToggle = (key: keyof ElementsConfig) => {
    elementsStore.setKey(key, !elements[key]);
  };

  const soundIcons = {
    rain: CloudRain,
    thunder: Zap,
    trees: Wind,
    birds: Feather,
    waves: Waves,
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[3px] transition-opacity"
        onClick={() => settingsOpenStore.set(false)}
      />

      {/* Refined M3 Slide-over Drawer (w-[340px] md:w-[360px], zero subtext) */}
      <div className="relative w-[340px] md:w-[360px] h-full bg-[#1C1D22] border-l border-[#35373E] shadow-2xl flex flex-col z-10 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#25272E] border-b border-white/5 flex items-center justify-between">
          <span className="font-semibold text-base tracking-wide text-slate-100">Settings</span>
          <button
            onClick={() => settingsOpenStore.set(false)}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors active:scale-95"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (Spacious p-5, space-y-6, zero subtext clutter) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 1. SCENERY */}
          <section className="space-y-2.5">
            <h3 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Scenery</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['countryside', 'ocean', 'mountains', 'city'] as SceneryType[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    audioEngine.init();
                    setSceneryWithSmartAudio(s);
                  }}
                  className={`h-9 px-3 rounded-xl text-xs font-medium capitalize flex items-center justify-center transition-all ${
                    scenery === s
                      ? 'bg-[#8EA2FF]/15 text-[#B8C4FF] border border-[#8EA2FF]/45 shadow-sm'
                      : 'bg-[#25272E] text-slate-300 border border-white/5 hover:border-white/20'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* 2. TIME OF DAY */}
          <section className="space-y-2.5">
            <h3 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Time of Day</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['day', 'sunset', 'night'] as TimeOfDayType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    audioEngine.init();
                    timeOfDayStore.set(t);
                  }}
                  className={`h-9 px-2 rounded-xl text-xs font-medium capitalize flex items-center justify-center transition-all ${
                    timeOfDay === t
                      ? 'bg-[#8EA2FF]/15 text-[#B8C4FF] border border-[#8EA2FF]/45 shadow-sm'
                      : 'bg-[#25272E] text-slate-300 border border-white/5 hover:border-white/20'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* 3. WEATHER */}
          <section className="space-y-2.5">
            <h3 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Weather</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['clear', 'cloudy', 'rainy', 'thunder', 'snowy'] as WeatherType[]).map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    audioEngine.init();
                    setWeatherWithSmartAudio(w);
                  }}
                  className={`h-9 px-2 rounded-xl text-xs font-medium capitalize flex items-center justify-center transition-all ${
                    weather === w
                      ? 'bg-[#8EA2FF]/15 text-[#B8C4FF] border border-[#8EA2FF]/45 shadow-sm'
                      : 'bg-[#25272E] text-slate-300 border border-white/5 hover:border-white/20'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </section>

          {/* 4. SOUNDS (Refined M3 Slider Rows with Top Label & Thin Slider Underneath) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Sounds</h3>
              <div className="flex items-center space-x-2">
                <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundMixer.masterVolume}
                  onChange={(e) => handleMasterVolume(parseInt(e.target.value))}
                  className="w-20 h-1 bg-[#17181d] rounded-full appearance-none cursor-pointer accent-[#8EA2FF]"
                  title="Master Volume"
                />
              </div>
            </div>

            <div className="space-y-2.5 bg-[#25272E] p-3.5 rounded-2xl border border-white/5">
              {(
                [
                  { key: 'rain', label: 'Rain' },
                  { key: 'thunder', label: 'Thunder' },
                  { key: 'trees', label: 'Trees' },
                  { key: 'birds', label: 'Birds' },
                  { key: 'waves', label: 'Waves' },
                ] as const
              ).map(({ key, label }) => {
                const channel = soundMixer[key];
                const IconComponent = soundIcons[key] || Volume1;
                return (
                  <div key={key} className="space-y-1.5 p-2 rounded-xl bg-[#1c1d22]/70 border border-white/5">
                    {/* Top Row: Icon + Label + Value + M3 Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`w-3.5 h-3.5 ${channel.on ? 'text-[#8EA2FF]' : 'text-slate-500'}`} />
                        <span className={`text-xs font-medium ${channel.on ? 'text-slate-200' : 'text-slate-400'}`}>
                          {label}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
                          {channel.volume}%
                        </span>
                        {/* Compact M3 Toggle Switch with Periwinkle Active Color */}
                        <button
                          onClick={() => handleSoundToggle(key)}
                          className={`w-8 h-4.5 rounded-full p-0.5 transition-colors relative flex items-center ${
                            channel.on ? 'bg-[#8EA2FF]' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
                              channel.on ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Sleek Thin M3 Slider Track Underneath */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={channel.volume}
                      disabled={!channel.on}
                      onChange={(e) => handleSoundVolume(key, parseInt(e.target.value))}
                      className={`w-full h-1 bg-[#121316] rounded-full appearance-none cursor-pointer transition-opacity ${
                        channel.on ? 'accent-[#8EA2FF] opacity-90' : 'opacity-25'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* 5. ELEMENTS (Clean 2-Column Grid of Compact M3 Toggle Switches, DOG instead of Cat) */}
          <section className="space-y-2.5">
            <h3 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Elements</h3>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: 'plant', label: 'Plant' },
                  { key: 'dog', label: 'Dog' },
                  { key: 'stringLights', label: 'String Lights' },
                  { key: 'patioMug', label: 'Patio Mug' },
                  { key: 'birds', label: 'Birds' },
                  { key: 'trees', label: 'Trees' },
                  { key: 'leaves', label: 'Leaves' },
                ] as const
              ).map(({ key, label }) => {
                const isActive = elements[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleElementToggle(key)}
                    className={`h-9 px-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-[#8EA2FF]/15 text-[#B8C4FF] border border-[#8EA2FF]/45 shadow-sm'
                        : 'bg-[#25272E] text-slate-400 border-white/5 hover:text-slate-200'
                    }`}
                  >
                    <span>{label}</span>
                    {/* Compact M3 Pill Indicator with Periwinkle glow */}
                    <span
                      className={`w-2 h-2 rounded-full transition-colors ${
                        isActive ? 'bg-[#8EA2FF] shadow-[0_0_6px_#8EA2FF]' : 'bg-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          {/* 6. POMODORO DURATIONS */}
          <section className="space-y-2.5 pb-2">
            <h3 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Pomodoro</h3>
            <div className="grid grid-cols-2 gap-3 bg-[#25272E] p-3.5 rounded-2xl border border-white/5">
              <div>
                <label className="text-[10px] font-medium text-zinc-400 block mb-1">Focus (min)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={pomoSettings.focusMinutes}
                  onChange={(e) =>
                    pomodoroSettingsStore.setKey(
                      'focusMinutes',
                      Math.max(1, parseInt(e.target.value) || 25)
                    )
                  }
                  className="w-full bg-[#1C1D22] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-[#8EA2FF]"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-zinc-400 block mb-1">Break (min)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={pomoSettings.breakMinutes}
                  onChange={(e) =>
                    pomodoroSettingsStore.setKey(
                      'breakMinutes',
                      Math.max(1, parseInt(e.target.value) || 5)
                    )
                  }
                  className="w-full bg-[#1C1D22] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
