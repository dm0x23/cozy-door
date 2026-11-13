import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  widgetMinimizedStore,
  zenModeStore,
} from '../stores/appStore';
import { useDraggable } from '../hooks/useDraggable';
import {
  Music,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio,
  GripHorizontal,
} from 'lucide-react';

interface BuiltInTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
}

const BUILT_IN_TRACKS: BuiltInTrack[] = [
  {
    id: '1',
    title: 'Rainy Night In Tokyo',
    artist: 'Lofi Cozy',
    src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: '2',
    title: 'Warm Fireplace Reverie',
    artist: 'Ambient Dreams',
    src: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=cozy-chill-lo-fi-10493.mp3',
  },
  {
    id: '3',
    title: 'Midnight Porch Chords',
    artist: 'Chillhop Valley',
    src: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-chill-medium-version-159456.mp3',
  },
  {
    id: '4',
    title: 'Coffee Steam & Waves',
    artist: 'Sliding Patio',
    src: 'https://cdn.pixabay.com/download/audio/2023/07/30/audio_5500d0f2f3.mp3?filename=good-night-lofi-cozy-chill-160166.mp3',
  },
];

const YOUTUBE_PRESETS = [
  { name: 'Lofi Girl 24/7', id: 'jfKfPfyJRdk' },
  { name: 'Chillhop Beats', id: '5yx6BWlEVcY' },
  { name: 'Cozy Coffee Shop', id: 'lTRiuFIWV54' },
];

export const MusicPlayerWidget: React.FC = () => {
  const zenMode = useStore(zenModeStore);
  const minimized = useStore(widgetMinimizedStore);

  const [activeTab, setActiveTab] = useState<'builtin' | 'youtube' | 'spotify'>('builtin');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);

  // YouTube state
  const [youtubeVideoId, setYoutubeVideoId] = useState('jfKfPfyJRdk');
  const [customYtInput, setCustomYtInput] = useState('');

  // Spotify state
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState('https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0');
  const [customSpotifyInput, setCustomSpotifyInput] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { position, dragHandleProps } = useDraggable('music', () => ({
    x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 360) : 800,
    y: typeof window !== 'undefined' ? Math.max(16, window.innerHeight - 340) : 500,
  }));

  const isMinimized = minimized.music;

  const toggleMinimize = () => {
    widgetMinimizedStore.setKey('music', !isMinimized);
  };

  const currentTrack = BUILT_IN_TRACKS[currentTrackIndex];

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log('Autoplay blocked or stream loading:', e));
    }
  };

  const handleNextTrack = () => {
    const next = (currentTrackIndex + 1) % BUILT_IN_TRACKS.length;
    setCurrentTrackIndex(next);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    const prev = (currentTrackIndex - 1 + BUILT_IN_TRACKS.length) % BUILT_IN_TRACKS.length;
    setCurrentTrackIndex(prev);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioProgress(audioRef.current.currentTime);
      setTrackDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setAudioProgress(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleCustomYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYoutubeId(customYtInput.trim());
    if (id) {
      setYoutubeVideoId(id);
      setCustomYtInput('');
    } else if (customYtInput.trim().length === 11) {
      setYoutubeVideoId(customYtInput.trim());
      setCustomYtInput('');
    }
  };

  const handleCustomSpotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSpotifyInput.trim();
    if (!trimmed) return;
    if (trimmed.includes('spotify.com')) {
      const embedUrl = trimmed.replace('open.spotify.com/', 'open.spotify.com/embed/');
      setSpotifyEmbedUrl(embedUrl);
      setCustomSpotifyInput('');
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (zenMode) return null;

  return (
    <div
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '340px',
      }}
      className="z-40 select-none"
    >
      <div className="bg-[#1C1D22]/95 backdrop-blur-md border border-[#35373E] text-slate-100 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200">
        {/* Header Bar (Draggable) */}
        <div
          {...dragHandleProps}
          className="px-4 py-3 bg-[#25272E] border-b border-white/5 flex items-center justify-between cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center space-x-2">
            <GripHorizontal className="w-4 h-4 text-slate-400" />
            <Music className="w-4 h-4 text-[#8EA2FF]" />
            <span className="text-sm font-semibold tracking-wide text-slate-100">Music</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize();
            }}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Card Body */}
        {!isMinimized && (
          <div className="p-3.5 space-y-3">
            {/* 3 Tabs: Built-in, YouTube, Spotify */}
            <div className="flex p-1 bg-[#16171b] rounded-lg border border-white/5 text-xs">
              <button
                onClick={() => setActiveTab('builtin')}
                className={`flex-1 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'builtin'
                    ? 'bg-[#2b2e38] text-[#B8C4FF] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Built-in
              </button>
              <button
                onClick={() => setActiveTab('youtube')}
                className={`flex-1 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'youtube'
                    ? 'bg-[#2b2e38] text-[#B8C4FF] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                YouTube
              </button>
              <button
                onClick={() => setActiveTab('spotify')}
                className={`flex-1 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'spotify'
                    ? 'bg-[#2b2e38] text-[#B8C4FF] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Spotify
              </button>
            </div>

            {/* TAB 1: Built-in HTML5 Audio Player */}
            {activeTab === 'builtin' && (
              <div className="space-y-3">
                <audio
                  ref={audioRef}
                  src={currentTrack.src}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleNextTrack}
                  autoPlay={isPlaying}
                />

                {/* Track Info Display */}
                <div className="bg-[#22242b] p-2.5 rounded-xl border border-white/5 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-[#8EA2FF]/20 text-[#B8C4FF] flex items-center justify-center flex-shrink-0">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-100 truncate">
                      {currentTrack.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {currentTrack.artist}
                    </div>
                  </div>
                </div>

                {/* Progress Slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={trackDuration || 100}
                    value={audioProgress}
                    onChange={handleSeek}
                    className="w-full h-1 bg-[#2e313c] rounded-lg appearance-none cursor-pointer accent-[#8EA2FF]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{formatSeconds(audioProgress)}</span>
                    <span>{formatSeconds(trackDuration)}</span>
                  </div>
                </div>

                {/* Playback Controls & Volume */}
                <div className="flex items-center justify-between pt-1">
                  {/* Prev / Play / Next */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevTrack}
                      className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-300 flex items-center justify-center transition-all"
                      title="Previous"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={togglePlayPause}
                      className="w-9 h-9 rounded-full bg-[#8EA2FF] hover:bg-[#7a90ff] text-slate-900 flex items-center justify-center shadow-lg active:scale-95 transition-all"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
                    </button>
                    <button
                      onClick={handleNextTrack}
                      className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-300 flex items-center justify-center transition-all"
                      title="Next"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseInt(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-16 h-1 bg-[#2e313c] rounded-lg appearance-none cursor-pointer accent-slate-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: YouTube Embed */}
            {activeTab === 'youtube' && (
              <div className="space-y-2.5">
                {/* Full-width aspect-video youtube-nocookie.com embed */}
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=0&enablejsapi=1`}
                    title="YouTube Lo-Fi Music"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* 3 Working Presets */}
                <div className="flex space-x-1.5">
                  {YOUTUBE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setYoutubeVideoId(preset.id)}
                      className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-medium truncate transition-all ${
                        youtubeVideoId === preset.id
                          ? 'bg-[#8EA2FF]/20 text-[#B8C4FF] border border-[#8EA2FF]/40'
                          : 'bg-[#22242b] text-slate-400 hover:text-slate-200 border border-white/5'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* Custom YouTube URL input */}
                <form onSubmit={handleCustomYoutubeSubmit} className="flex space-x-1.5">
                  <input
                    type="text"
                    value={customYtInput}
                    onChange={(e) => setCustomYtInput(e.target.value)}
                    placeholder="YouTube link or Video ID..."
                    className="flex-1 bg-[#25272E] border border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#8EA2FF]/50"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-xl bg-[#8EA2FF]/20 hover:bg-[#8EA2FF]/30 text-[#B8C4FF] text-xs font-medium border border-[#8EA2FF]/30 transition-all"
                  >
                    Load
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: Spotify Embed */}
            {activeTab === 'spotify' && (
              <div className="space-y-2.5">
                <div className="w-full h-[152px] rounded-xl overflow-hidden bg-black border border-white/10">
                  <iframe
                    className="w-full h-full"
                    src={spotifyEmbedUrl}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>

                {/* Custom Spotify URL input */}
                <form onSubmit={handleCustomSpotifySubmit} className="flex space-x-1.5">
                  <input
                    type="text"
                    value={customSpotifyInput}
                    onChange={(e) => setCustomSpotifyInput(e.target.value)}
                    placeholder="Spotify playlist or track link..."
                    className="flex-1 bg-[#25272E] border border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400/50"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-all"
                  >
                    Load
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
