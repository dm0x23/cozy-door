import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  pomodoroSettingsStore,
  zenModeStore,
} from '../stores/appStore';
import {
  isConnectedStore,
  syncModeStore,
  setSyncMode,
  broadcastTimerAction,
  incomingTimerSyncStore,
  localParticipantId,
  updateLocalPresence,
  registerLocalStateSupplier,
  localTimerStateStore,
} from '../stores/groupStudyStore';
import { useDraggable } from '../hooks/useDraggable';
import { audioEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, GripHorizontal, Users } from 'lucide-react';

export const PomodoroWidget: React.FC = () => {
  const zenMode = useStore(zenModeStore);
  const settings = useStore(pomodoroSettingsStore);
  const isConnected = useStore(isConnectedStore);
  const syncMode = useStore(syncModeStore);

  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.focusMinutes * 60);

  const workerRef = useRef<Worker | null>(null);

  const { position, dragHandleProps } = useDraggable('pomodoro', () => ({
    x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth / 2 - 140) : 400,
    y: 20,
  }));

  // Setup inline Web Worker
  useEffect(() => {
    const workerScript = `
      let timerId = null;
      let targetTime = 0;
      let remaining = 0;

      self.onmessage = function(e) {
        const { action, payload } = e.data;
        if (action === 'START') {
          remaining = payload.duration;
          targetTime = Date.now() + remaining * 1000;
          if (timerId) clearInterval(timerId);
          timerId = setInterval(() => {
            const now = Date.now();
            const left = Math.max(0, Math.ceil((targetTime - now) / 1000));
            self.postMessage({ type: 'TICK', timeLeft: left });
            if (left <= 0) {
              clearInterval(timerId);
              timerId = null;
              self.postMessage({ type: 'COMPLETE' });
            }
          }, 250);
        } else if (action === 'PAUSE') {
          if (timerId) clearInterval(timerId);
          timerId = null;
          if (payload && typeof payload.duration === 'number') {
            remaining = payload.duration;
          } else if (targetTime > 0) {
            const now = Date.now();
            remaining = Math.max(0, Math.ceil((targetTime - now) / 1000));
          }
          self.postMessage({ type: 'PAUSED', timeLeft: remaining });
        } else if (action === 'RESUME') {
          targetTime = Date.now() + remaining * 1000;
          if (timerId) clearInterval(timerId);
          timerId = setInterval(() => {
            const now = Date.now();
            const left = Math.max(0, Math.ceil((targetTime - now) / 1000));
            self.postMessage({ type: 'TICK', timeLeft: left });
            if (left <= 0) {
              clearInterval(timerId);
              timerId = null;
              self.postMessage({ type: 'COMPLETE' });
            }
          }, 250);
        } else if (action === 'RESET') {
          if (timerId) clearInterval(timerId);
          timerId = null;
          remaining = payload ? payload.duration : 0;
          self.postMessage({ type: 'RESET', timeLeft: remaining });
        } else if (action === 'SYNC') {
          if (timerId) {
            const now = Date.now();
            const left = Math.max(0, Math.ceil((targetTime - now) / 1000));
            self.postMessage({ type: 'TICK', timeLeft: left });
            if (left <= 0) {
              clearInterval(timerId);
              timerId = null;
              self.postMessage({ type: 'COMPLETE' });
            }
          }
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, timeLeft: workerTime } = e.data;
      if (type === 'TICK') {
        setTimeLeft(workerTime);
      } else if (type === 'PAUSED') {
        setIsRunning(false);
        setTimeLeft(workerTime);
      } else if (type === 'RESET') {
        setIsRunning(false);
        setTimeLeft(workerTime);
      } else if (type === 'COMPLETE') {
        setIsRunning(false);
        setTimeLeft(0);
        handleTimerComplete();
      }
    };

    return () => {
      worker.terminate();
    };
  }, [mode]);

  // Handle settings changes
  useEffect(() => {
    if (!isRunning) {
      const duration = (mode === 'focus' ? settings.focusMinutes : settings.breakMinutes) * 60;
      setTimeLeft(duration);
      if (workerRef.current) {
        workerRef.current.postMessage({ action: 'RESET', payload: { duration } });
      }
    }
  }, [settings.focusMinutes, settings.breakMinutes, mode]);

  // Sync timer when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        workerRef.current?.postMessage({ action: 'SYNC' });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning]);

  // Keep shared local timer state store up-to-date for useStudyRoom hook
  useEffect(() => {
    localTimerStateStore.set({
      isRunning,
      mode,
      remainingSeconds: timeLeft,
      endTime: isRunning ? Date.now() + timeLeft * 1000 : null,
    });
  }, [isRunning, mode, timeLeft]);

  // Register local state supplier for late-joiners in study room
  useEffect(() => {
    registerLocalStateSupplier(() => {
      return {
        updatedBy: sessionTabId,
        action: isRunning ? 'START' : 'PAUSE',
        isRunning,
        mode,
        endTime: isRunning ? Date.now() + timeLeft * 1000 : null,
        remainingSeconds: timeLeft,
      };
    });
  }, [isRunning, mode, timeLeft]);

  // Sync local presence to room members on meaningful state transitions (start, pause, mode, syncMode)
  useEffect(() => {
    const isSynced = syncMode === 'synced';
    const currentEndTime = isRunning ? Date.now() + timeLeft * 1000 : null;
    updateLocalPresence({
      status: isRunning ? (mode === 'focus' ? 'Focusing' : 'Break') : 'Idle',
      remainingSeconds: timeLeft,
      endTime: currentEndTime,
      isRunning,
      mode,
      isSynced,
    });
  }, [isRunning, mode, syncMode]);

  // Listen for incoming broadcast timer actions ('timer_sync') from room
  useEffect(() => {
    const unsub = incomingTimerSyncStore.subscribe((payload) => {
      if (!payload || payload.updatedBy === sessionTabId || syncModeStore.get() !== 'synced') return;

      const isIncomingRunning = Boolean(payload.isRunning || payload.action === 'START');
      const targetMode: 'focus' | 'break' = payload.mode || 'focus';

      if (isIncomingRunning) {
        const now = Date.now();
        const remaining = payload.endTime && Number(payload.endTime) > now
          ? Math.max(0, Math.ceil((Number(payload.endTime) - now) / 1000))
          : Math.max(0, payload.remainingSeconds);

        setMode(targetMode);
        setTimeLeft(remaining);
        setIsRunning(true);
        workerRef.current?.postMessage({
          action: 'START',
          payload: { duration: remaining },
        });
      } else {
        const remaining = Math.max(0, payload.remainingSeconds);
        setIsRunning(false);
        setMode(targetMode);
        setTimeLeft(remaining);
        workerRef.current?.postMessage({
          action: 'RESET',
          payload: { duration: remaining },
        });
      }
    });

    return () => unsub();
  }, []);

  const handleTimerComplete = () => {
    // 1. Play procedural chime
    audioEngine.playChime();

    // 2. Trigger Confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.2 },
      });
    } catch {
      // ignore
    }

    // 3. Native Browser Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const isFocus = mode === 'focus';
      const notif = new Notification(
        isFocus ? 'Focus session complete!' : 'Break is over!',
        {
          body: isFocus ? 'Time to take a cozy break.' : 'Ready to jump back into focus?',
          icon: '/favicon.svg',
        }
      );
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    }
  };

  const toggleStartPause = () => {
    audioEngine.init(); // initialize Web Audio on gesture
    if (isRunning) {
      workerRef.current?.postMessage({ action: 'PAUSE' });
      setIsRunning(false);
      broadcastTimerAction('PAUSE', mode, timeLeft);
    } else {
      // Request notification permission if not yet decided
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      const duration = timeLeft <= 0 ? (mode === 'focus' ? settings.focusMinutes : settings.breakMinutes) * 60 : timeLeft;
      const targetEndTime = Date.now() + duration * 1000;

      if (timeLeft <= 0) {
        setTimeLeft(duration);
        workerRef.current?.postMessage({ action: 'START', payload: { duration } });
      } else {
        workerRef.current?.postMessage({ action: 'RESUME' });
      }
      setIsRunning(true);
      broadcastTimerAction('START', mode, duration, targetEndTime);
    }
  };

  const handleReset = () => {
    const duration = (mode === 'focus' ? settings.focusMinutes : settings.breakMinutes) * 60;
    workerRef.current?.postMessage({ action: 'RESET', payload: { duration } });
    setIsRunning(false);
    setTimeLeft(duration);
    broadcastTimerAction('RESET', mode, duration);
    updateLocalPresence({
      status: 'Idle',
      remainingSeconds: duration,
      endTime: null,
      isRunning: false,
      mode,
      isSynced: syncMode === 'synced',
    });
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    if (newMode === mode) return;
    setMode(newMode);
    setIsRunning(false);
    const duration = (newMode === 'focus' ? settings.focusMinutes : settings.breakMinutes) * 60;
    setTimeLeft(duration);
    workerRef.current?.postMessage({ action: 'RESET', payload: { duration } });
    broadcastTimerAction('MODE_CHANGE', newMode, duration);
    updateLocalPresence({
      status: 'Idle',
      remainingSeconds: duration,
      endTime: null,
      isRunning: false,
      mode: newMode,
      isSynced: syncMode === 'synced',
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (zenMode) return null;

  return (
    <div
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        position: 'fixed',
        top: 0,
        left: 0,
      }}
      className="z-40 select-none"
    >
      {/* Material Design 3 Pill Design: Strictly digital clock, focus/break switcher, play/pause/reset. NO progress rings/bars */}
      <div className="bg-[#1C1D22]/90 backdrop-blur-md border border-[#35373E] text-slate-100 rounded-full px-4 py-2.5 shadow-2xl flex items-center space-x-3 transition-shadow duration-200 hover:border-slate-500/40">
        {/* Drag handle */}
        <div {...dragHandleProps} className="text-slate-400 hover:text-slate-200 px-1 py-1 cursor-grab">
          <GripHorizontal className="w-4 h-4" />
        </div>

        {/* Focus / Break Switcher */}
        <div className="flex bg-[#25272E] p-0.5 rounded-full border border-white/5">
          <button
            onClick={() => switchMode('focus')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              mode === 'focus' ? 'bg-[#8EA2FF]/20 text-[#B8C4FF] shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              mode === 'break' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Break
          </button>
        </div>

        {/* Digital Countdown Clock ONLY */}
        <span className="font-mono text-xl font-bold tracking-wider text-slate-100 px-1 min-w-[70px] text-center">
          {formatTime(timeLeft)}
        </span>

        {/* Play/Pause Button */}
        <button
          onClick={toggleStartPause}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-slate-100 flex items-center justify-center transition-all"
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
        </button>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Synced / Solo Segmented Pill (Visible when connected to a Study Room) */}
        {isConnected && (
          <div className="flex bg-[#25272E] p-0.5 rounded-full border border-white/5 text-[10px]">
            <button
              onClick={() => setSyncMode('synced')}
              className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                syncMode === 'synced'
                  ? 'bg-[#8EA2FF]/25 text-[#B8C4FF] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Synced with Room Timer"
            >
              Synced
            </button>
            <button
              onClick={() => setSyncMode('unsynced')}
              className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                syncMode === 'unsynced'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Independent Personal Timer"
            >
              Solo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

