import { atom } from 'nanostores';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ParticipantStatus = 'Focusing' | 'Break' | 'Idle';
export type SyncMode = 'synced' | 'unsynced';
export type AppType = 'window' | 'patio';

export interface Participant {
  id: string; // sessionTabId
  username: string;
  appType: AppType;
  status: ParticipantStatus;
  remainingSeconds: number;
  endTime?: number | null;
  isRunning?: boolean;
  mode?: 'focus' | 'break';
  isSynced: boolean;
  avatarColor?: string;
  syncMode?: SyncMode; // backwards compat
}

export interface TimerSyncPayload {
  isRunning: boolean;
  mode: 'focus' | 'break';
  endTime: number | null;
  remainingSeconds: number;
  updatedBy: string; // sessionTabId
  action?: 'START' | 'PAUSE' | 'RESET' | 'MODE_CHANGE';
}

const AVATAR_COLORS = [
  '#8EA2FF', // Periwinkle
  '#38BDF8', // Sky Blue
  '#34D399', // Emerald
  '#F472B6', // Rose
  '#FBBF24', // Amber
  '#A78BFA', // Violet
  '#F87171', // Red
  '#2DD4BF', // Teal
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitialRoom(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('room');
    if (fromUrl) return fromUrl.trim().toLowerCase().replace(/^#/, '');
    try {
      return (localStorage.getItem('vg_study_room') || 'study-lounge').replace(/^#/, '');
    } catch {
      return 'study-lounge';
    }
  }
  return 'study-lounge';
}

function getInitialUsername(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('vg_study_username');
      if (stored) return stored;
    } catch {}
    const defaultNames = ['CozyScholar', 'LofiLearner', 'WindowWatcher', 'QuietReader', 'NightOwl', 'DayDreamer'];
    const chosen = defaultNames[Math.floor(Math.random() * defaultNames.length)];
    try {
      localStorage.setItem('vg_study_username', chosen);
    } catch {}
    return chosen;
  }
  return 'CozyScholar';
}

function getInitialIsJoined(): boolean {
  if (typeof window !== 'undefined') {
    try {
      return sessionStorage.getItem('vg_study_joined') === 'true';
    } catch {
      return false;
    }
  }
  return false;
}

// Generate unique sessionTabId per browser tab stored in sessionStorage
export const sessionTabId =
  typeof window !== 'undefined'
    ? (() => {
        let id = sessionStorage.getItem('vg_session_tab_id');
        if (!id) {
          id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : 'tab_' + Math.random().toString(36).substring(2, 11);
          sessionStorage.setItem('vg_session_tab_id', id);
        }
        return id;
      })()
    : 'server_tab';

export const localParticipantId = sessionTabId; // Alias for compatibility
export const tabId = sessionTabId; // Unified tab identifier

export interface LocalTimerState {
  isRunning: boolean;
  mode: 'focus' | 'break';
  remainingSeconds: number;
  endTime: number | null;
}

export const localTimerStateStore = atom<LocalTimerState>({
  isRunning: false,
  mode: 'focus',
  remainingSeconds: 25 * 60,
  endTime: null,
});

export const roomCodeStore = atom<string>(getInitialRoom());
export const usernameStore = atom<string>(getInitialUsername());
export const isJoinedStore = atom<boolean>(getInitialIsJoined());
export const isConnectedStore = isJoinedStore; // Alias for backward compatibility
export const isConnectingStore = atom<boolean>(false);
export const connectionErrorStore = atom<string | null>(null);
export const channelStatusStore = atom<'online' | 'connecting' | 'reconnecting' | 'offline' | 'SUBSCRIBED' | 'CONNECTING' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'>('offline');
export const syncModeStore = atom<SyncMode>('synced');
export const participantsStore = atom<Participant[]>([]);
export const incomingTimerSyncStore = atom<TimerSyncPayload | null>(null);

let activeChannelInstance: RealtimeChannel | null = null;

export function setChannelInstance(channel: RealtimeChannel | null) {
  activeChannelInstance = channel;
}

export function getChannelInstance(): RealtimeChannel | null {
  return activeChannelInstance;
}

let currentLocalPresence: Participant = {
  id: sessionTabId,
  username: getInitialUsername(),
  appType: 'patio',
  avatarColor: getAvatarColor(getInitialUsername()),
  status: 'Idle',
  remainingSeconds: 25 * 60,
  endTime: null,
  isRunning: false,
  mode: 'focus',
  isSynced: true,
  syncMode: 'synced',
};

let localStateSupplier: (() => TimerSyncPayload | null) | null = null;

export function registerLocalStateSupplier(supplier: () => TimerSyncPayload | null) {
  localStateSupplier = supplier;
}

export function getLocalPresence(): Participant {
  if (localStateSupplier) {
    const state = localStateSupplier();
    if (state) {
      currentLocalPresence.isRunning = state.isRunning;
      currentLocalPresence.mode = state.mode;
      currentLocalPresence.remainingSeconds = state.remainingSeconds;
      currentLocalPresence.endTime = state.endTime;
      currentLocalPresence.status = state.isRunning
        ? state.mode === 'focus'
          ? 'Focusing'
          : 'Break'
        : 'Idle';
    }
  }
  return {
    ...currentLocalPresence,
    id: sessionTabId,
    username: usernameStore.get(),
    appType: 'patio',
    avatarColor: getAvatarColor(usernameStore.get()),
    isSynced: syncModeStore.get() === 'synced',
    syncMode: syncModeStore.get(),
  };
}

export function setSyncMode(mode: SyncMode) {
  syncModeStore.set(mode);
  const isSynced = mode === 'synced';
  currentLocalPresence.syncMode = mode;
  currentLocalPresence.isSynced = isSynced;

  if (activeChannelInstance && (channelStatusStore.get() === 'online' || channelStatusStore.get() === 'SUBSCRIBED')) {
    activeChannelInstance.track(getLocalPresence()).catch((e) => {
      console.warn('Presence track error:', e);
    });
  }

  // Instant catch-up when switching to 'synced'
  if (isSynced) {
    performCatchup();
  }
}

export function updateLocalPresence(data: Partial<Participant>) {
  const isSynced = syncModeStore.get() === 'synced';
  currentLocalPresence = {
    ...currentLocalPresence,
    ...data,
    id: sessionTabId,
    username: usernameStore.get(),
    appType: 'patio',
    avatarColor: getAvatarColor(usernameStore.get()),
    isSynced,
    syncMode: syncModeStore.get(),
  };

  // Keep local participant in participantsStore up-to-date instantly
  const currentList = participantsStore.get();
  const selfIdx = currentList.findIndex((p) => p.id === sessionTabId);
  if (selfIdx >= 0) {
    const updated = [...currentList];
    updated[selfIdx] = { ...updated[selfIdx], ...currentLocalPresence };
    participantsStore.set(updated);
  } else if (isJoinedStore.get()) {
    participantsStore.set([{ ...currentLocalPresence }, ...currentList]);
  }

  // Track over network on meaningful changes
  if (activeChannelInstance && (channelStatusStore.get() === 'online' || channelStatusStore.get() === 'SUBSCRIBED')) {
    activeChannelInstance.track(currentLocalPresence).catch((e) => {
      console.warn('Presence track error:', e);
    });
  }
}

export function performCatchup(customList?: Participant[]) {
  if (syncModeStore.get() !== 'synced') return;

  const list = customList || participantsStore.get();
  if (!list || list.length === 0) return;

  const now = Date.now();
  // Filter for other online members where member.isSynced === true
  const syncedBuddies = list.filter((m) => {
    if (m.id === sessionTabId) return false;
    return m.isSynced === true || (m.isSynced as any) === 'true' || m.syncMode === 'synced';
  });

  if (syncedBuddies.length === 0) return;

  // 1. If any synced member currently has member.isRunning === true and member.endTime > Date.now()
  const activeRunningBuddy = syncedBuddies.find((m) => {
    const isBuddyRunning = m.isRunning === true || (m.isRunning as any) === 'true' || m.status === 'Focusing' || m.status === 'Break';
    const targetEnd = m.endTime ? Number(m.endTime) : (isBuddyRunning && m.remainingSeconds ? now + m.remainingSeconds * 1000 : 0);
    return isBuddyRunning && targetEnd > now;
  });

  if (activeRunningBuddy) {
    const targetEnd = activeRunningBuddy.endTime ? Number(activeRunningBuddy.endTime) : (now + activeRunningBuddy.remainingSeconds * 1000);
    const remaining = Math.max(0, Math.ceil((targetEnd - now) / 1000));
    const mode = (activeRunningBuddy.mode || (activeRunningBuddy.status === 'Break' ? 'break' : 'focus')) as 'focus' | 'break';

    // Check if we are already locally running the exact same countdown
    const localState = localStateSupplier ? localStateSupplier() : null;
    if (localState?.isRunning && localState.endTime && Math.abs(localState.endTime - targetEnd) < 2000 && localState.mode === mode) {
      return; // Already in sync!
    }

    incomingTimerSyncStore.set({
      isRunning: true,
      mode,
      endTime: targetEnd,
      remainingSeconds: remaining,
      updatedBy: activeRunningBuddy.id,
      action: 'START',
    });
  } else {
    // 2. If no synced member is running, adopt their paused remainingSeconds and mode
    const pausedBuddy = syncedBuddies[0];
    if (pausedBuddy) {
      const mode = (pausedBuddy.mode || (pausedBuddy.status === 'Break' ? 'break' : 'focus')) as 'focus' | 'break';
      const remaining = typeof pausedBuddy.remainingSeconds === 'number'
        ? pausedBuddy.remainingSeconds
        : Number(pausedBuddy.remainingSeconds) || (mode === 'focus' ? 25 * 60 : 5 * 60);

      const localState = localStateSupplier ? localStateSupplier() : null;
      if (!localState?.isRunning && localState?.remainingSeconds === remaining && localState?.mode === mode) {
        return; // Already in sync!
      }

      incomingTimerSyncStore.set({
        isRunning: false,
        mode,
        endTime: null,
        remainingSeconds: remaining,
        updatedBy: pausedBuddy.id,
        action: 'PAUSE',
      });
    }
  }
}

export function joinRoom(roomCode: string, username: string): boolean {
  const cleanRoom = roomCode.trim().toLowerCase().replace(/^#/, '') || 'study-lounge';
  const cleanUser = username.trim() || 'CozyScholar';

  roomCodeStore.set(cleanRoom);
  usernameStore.set(cleanUser);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('vg_study_room', cleanRoom);
      localStorage.setItem('vg_study_username', cleanUser);
      sessionStorage.setItem('vg_study_joined', 'true');
    } catch {}
  }

  isJoinedStore.set(true);
  return true;
}

export async function leaveRoom(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('vg_study_joined');
    } catch {}
  }
  isJoinedStore.set(false);
  channelStatusStore.set('offline');
  participantsStore.set([]);
  connectionErrorStore.set(null);

  if (activeChannelInstance) {
    try {
      await activeChannelInstance.untrack();
      if (supabase) {
        await supabase.removeChannel(activeChannelInstance);
      }
    } catch {}
    activeChannelInstance = null;
  }
}

export function broadcastTimerAction(
  action: 'START' | 'PAUSE' | 'RESET' | 'MODE_CHANGE',
  mode: 'focus' | 'break',
  remainingSeconds: number,
  endTime?: number | null
) {
  if (!activeChannelInstance || syncModeStore.get() !== 'synced') return;

  const isRunning = action === 'START';
  const targetEndTime = isRunning ? (endTime || Date.now() + remainingSeconds * 1000) : null;
  const payload: TimerSyncPayload = {
    isRunning,
    mode,
    endTime: targetEndTime,
    remainingSeconds,
    updatedBy: sessionTabId,
    action,
  };

  activeChannelInstance.send({
    type: 'broadcast',
    event: 'timer_sync',
    payload,
  }).catch((e) => {
    console.warn('Broadcast timer_sync error:', e);
  });
}
