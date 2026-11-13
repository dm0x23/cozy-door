import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  zenModeStore,
  widgetMinimizedStore,
} from '../stores/appStore';
import {
  roomCodeStore,
  usernameStore,
  isConnectedStore,
  isConnectingStore,
  connectionErrorStore,
  syncModeStore,
  participantsStore,
  localParticipantId,
  joinRoom,
  leaveRoom,
  setSyncMode,
  type SyncMode,
} from '../stores/groupStudyStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { useDraggable } from '../hooks/useDraggable';
import {
  Users,
  ChevronDown,
  ChevronUp,
  GripHorizontal,
  LogOut,
  Copy,
  Check,
  Link as LinkIcon,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const StudyRoomWidget: React.FC = () => {
  const zenMode = useStore(zenModeStore);
  const minimized = useStore(widgetMinimizedStore);
  const roomCode = useStore(roomCodeStore);
  const username = useStore(usernameStore);
  const isConnected = useStore(isConnectedStore);
  const isConnecting = useStore(isConnectingStore);
  const connectionError = useStore(connectionErrorStore);
  const syncMode = useStore(syncModeStore);
  const participants = useStore(participantsStore);

  const [inputUsername, setInputUsername] = useState(username);
  const [inputRoomCode, setInputRoomCode] = useState(roomCode);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Popover open state when disconnected

  const { position, dragHandleProps } = useDraggable('studyRoom', () => ({
    x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth / 2 + 160) : 600,
    y: 20,
  }));

  const isMinimized = minimized.studyRoom;

  const toggleMinimize = () => {
    widgetMinimizedStore.setKey('studyRoom', !isMinimized);
  };

  // Auto-fill from URL query param if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setInputRoomCode(roomParam.trim().toLowerCase());
        setIsOpen(true);
      }
    }
  }, []);

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const success = await joinRoom(inputRoomCode, inputUsername);
    if (success) {
      setIsOpen(false);
    }
  };

  const handleLeave = async () => {
    await leaveRoom();
  };

  const handleCopyInvite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const targetRoom = isConnected ? roomCode : inputRoomCode || 'study-lounge';
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(targetRoom)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
        width: isConnected && !isMinimized ? '320px' : 'auto',
      }}
      className="z-40 select-none"
    >
      {/* =========================================================================
          DISCONNECTED STATE: Compact Pill + Popover Form
          ========================================================================= */}
      {!isConnected && (
        <div className="relative">
          {/* Main Pill Button */}
          <div className="bg-[#1C1D22]/90 backdrop-blur-md border border-[#35373E] text-slate-100 rounded-full px-3.5 py-2 shadow-2xl flex items-center space-x-2 transition-all duration-200 hover:border-slate-500/40">
            {/* Drag Handle */}
            <div {...dragHandleProps} className="text-slate-400 hover:text-slate-200 cursor-grab px-0.5">
              <GripHorizontal className="w-4 h-4" />
            </div>

            {/* Study Room Toggle Pill */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 text-xs font-semibold tracking-wide text-slate-200 hover:text-[#B8C4FF] transition-colors"
            >
              <Users className="w-4 h-4 text-[#8EA2FF]" />
              <span>Study Room</span>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>

          {/* Popover Form (Shown when isOpen) */}
          {isOpen && (
            <div className="absolute top-12 left-0 w-72 bg-[#1C1D22]/95 backdrop-blur-md border border-[#35373E] text-slate-100 rounded-2xl shadow-2xl p-4 space-y-3 z-50">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-100">
                  <Sparkles className="w-3.5 h-3.5 text-[#8EA2FF]" />
                  <span>Join Group Study</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleJoin} className="space-y-2.5">
                {/* Username Input */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Username
                  </label>
                  <input
                    type="text"
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    placeholder="Your name..."
                    required
                    className="w-full bg-[#25272E] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#8EA2FF]/50"
                  />
                </div>

                {/* Room Code Input + Copy Invite Button */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Room Code
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="text-[10px] text-[#8EA2FF] hover:text-[#B8C4FF] flex items-center space-x-1"
                      title="Copy Invite Link"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <LinkIcon className="w-3 h-3" />}
                      <span>{copied ? 'Copied Link' : 'Invite Link'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={inputRoomCode}
                    onChange={(e) => setInputRoomCode(e.target.value.toLowerCase())}
                    placeholder="e.g. study-lounge"
                    required
                    className="w-full bg-[#25272E] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-[#8EA2FF]/50"
                  />
                </div>

                {/* Missing Supabase Warning */}
                {!isSupabaseConfigured && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center space-x-2 text-[11px] text-amber-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Add Supabase keys to connect</span>
                  </div>
                )}

                {connectionError && (
                  <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300">
                    {connectionError}
                  </div>
                )}

                {/* Join Button */}
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="w-full py-2 rounded-xl bg-[#8EA2FF] hover:bg-[#7a90ff] active:scale-95 text-slate-900 text-xs font-semibold shadow-lg transition-all disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Join Room'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CONNECTED STATE: Study Buddies Widget (Room Code, Presence, Synced Toggle)
          ========================================================================= */}
      {isConnected && (
        <div className="bg-[#1C1D22]/95 backdrop-blur-md border border-[#35373E] text-slate-100 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200">
          {/* Header Bar */}
          <div
            {...dragHandleProps}
            className="px-3 py-2 bg-[#25272E] border-b border-white/5 flex items-center justify-between cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center space-x-1.5 min-w-0">
              <GripHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <Users className="w-4 h-4 text-[#8EA2FF] flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-100 truncate">
                #{roomCode}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            </div>

            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Copy Invite Link */}
              <button
                onClick={handleCopyInvite}
                className="w-6 h-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
                title="Copy Invite Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Leave Room Button */}
              <button
                onClick={handleLeave}
                className="w-6 h-6 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                title="Leave Room"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>

              {/* Minimize Toggle */}
              <button
                onClick={toggleMinimize}
                className="w-6 h-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Card Body */}
          {!isMinimized && (
            <div className="p-3 space-y-2.5">
              {/* Synced vs. Unsynced Segmented Control */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>Timer Mode</span>
                  <span className="text-[#B8C4FF]">
                    {syncMode === 'synced' ? 'Locked to Room' : 'Independent'}
                  </span>
                </div>
                <div className="flex p-0.5 bg-[#16171b] rounded-lg border border-white/5 text-xs">
                  <button
                    onClick={() => setSyncMode('synced')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                      syncMode === 'synced'
                        ? 'bg-[#8EA2FF]/20 text-[#B8C4FF] border border-[#8EA2FF]/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Synced
                  </button>
                  <button
                    onClick={() => setSyncMode('unsynced')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                      syncMode === 'unsynced'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Unsynced
                  </button>
                </div>
              </div>

              {/* Study Buddies Participant List */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-0.5">
                  <span>Study Buddies ({participants.length})</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                  {participants.map((member) => {
                    const isSelf = member.id === localParticipantId;
                    const isFocusing = member.status === 'focusing';
                    const isBreak = member.status === 'break';

                    return (
                      <div
                        key={member.id}
                        className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                          isSelf
                            ? 'bg-[#25272E]/90 border-[#8EA2FF]/30'
                            : 'bg-[#22242b] border-white/5'
                        }`}
                      >
                        {/* Member Identity: Avatar initial + Name */}
                        <div className="flex items-center space-x-2 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: member.avatarColor || '#8EA2FF' }}
                          >
                            {(member.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-200 truncate flex items-center space-x-1">
                              <span>{member.username}</span>
                              {isSelf && (
                                <span className="text-[9px] text-[#8EA2FF] font-semibold">
                                  (You)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge + Countdown + Sync Tag */}
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          {/* Status Badge */}
                          <div
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium flex items-center space-x-1 ${
                              isFocusing
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : isBreak
                                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-700/30 text-slate-400 border border-slate-700/40'
                            }`}
                          >
                            <span>
                              {isFocusing
                                ? `Focus ${formatSeconds(member.remainingSeconds)}`
                                : isBreak
                                ? `Break ${formatSeconds(member.remainingSeconds)}`
                                : 'Idle'}
                            </span>
                          </div>

                          {/* Synced vs. Solo Tag */}
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              member.syncMode === 'synced'
                                ? 'bg-[#8EA2FF]/20 text-[#B8C4FF]'
                                : 'bg-amber-500/15 text-amber-300'
                            }`}
                          >
                            {member.syncMode === 'synced' ? 'Synced' : 'Solo'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

