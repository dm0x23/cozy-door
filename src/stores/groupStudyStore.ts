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
  isSynced: boolean;
  avatarColor?: string;
  isRunning?: boolean;
  mode?: 'focus' | 'break';
  endTime?: number;
  syncMode?: SyncMode; // backwards compat
}

export interface TimerSyncPayload {
  isRunning: boolean;
  mode: 'focus' | 'break';
  endTime: number;
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

export const roomCodeStore = atom<string>(getInitialRoom());
export const usernameStore = atom<string>(getInitialUsername());
export const isConnectedStore = atom<boolean>(false);
export const isConnectingStore = atom<boolean>(false);
export const connectionErrorStore = atom<string | null>(null);
export const channelStatusStore = atom<'DISCONNECTED' | 'CONNECTING' | 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'>('DISCONNECTED');
export const syncModeStore = atom<SyncMode>('synced');
export const participantsStore = atom<Participant[]>([]);
export const incomingTimerSyncStore = atom<TimerSyncPayload | null>(null);

let activeChannel: RealtimeChannel | null = null;
let currentLocalPresence: Participant = {
  id: sessionTabId,
  username: getInitialUsername(),
  appType: 'patio',
  avatarColor: getAvatarColor(getInitialUsername()),
  status: 'Idle',
  remainingSeconds: 25 * 60,
  isSynced: true,
  syncMode: 'synced',
};

let localStateSupplier: (() => TimerSyncPayload | null) | null = null;

export function registerLocalStateSupplier(supplier: () => TimerSyncPayload | null) {
  localStateSupplier = supplier;
}

export function setSyncMode(mode: SyncMode) {
  syncModeStore.set(mode);
  currentLocalPresence.syncMode = mode;
  currentLocalPresence.isSynced = mode === 'synced';
  if (activeChannel && channelStatusStore.get() === 'SUBSCRIBED') {
    activeChannel.track(currentLocalPresence);
  }
}

export function updateLocalPresence(data: Partial<Participant>) {
  currentLocalPresence = {
    ...currentLocalPresence,
    ...data,
    id: sessionTabId,
    username: usernameStore.get(),
    appType: 'patio',
    avatarColor: getAvatarColor(usernameStore.get()),
    isSynced: syncModeStore.get() === 'synced',
    syncMode: syncModeStore.get(),
  };

  if (activeChannel && channelStatusStore.get() === 'SUBSCRIBED') {
    activeChannel.track(currentLocalPresence).catch((e) => {
      console.warn('Presence track error:', e);
    });
  }
}

export async function joinRoom(roomCode: string, username: string): Promise<boolean> {
  const cleanRoom = roomCode.trim().toLowerCase().replace(/^#/, '') || 'study-lounge';
  const cleanUser = username.trim() || 'CozyScholar';

  roomCodeStore.set(cleanRoom);
  usernameStore.set(cleanUser);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('vg_study_room', cleanRoom);
      localStorage.setItem('vg_study_username', cleanUser);
    } catch {}
  }

  if (!isSupabaseConfigured || !supabase) {
    channelStatusStore.set('CHANNEL_ERROR');
    connectionErrorStore.set('Offline / Check .env');
    return false;
  }

  isConnectingStore.set(true);
  channelStatusStore.set('CONNECTING');
  connectionErrorStore.set(null);

  // Leave any existing channel
  if (activeChannel) {
    try {
      await supabase.removeChannel(activeChannel);
    } catch {}
    activeChannel = null;
  }

  try {
    // Exact Unified Channel Name: cozy-study-room:${cleanRoom}
    const channelName = `cozy-study-room:${cleanRoom}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: sessionTabId,
        },
        broadcast: {
          self: false,
        },
      },
    });

    // 1. Presence Sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const list: Participant[] = [];
      Object.keys(state).forEach((key) => {
        const presences = state[key] as any[];
        if (presences && presences.length > 0) {
          const item = presences[presences.length - 1];
          list.push({
            ...item,
            id: item.id || key,
            isSynced: item.isSynced ?? (item.syncMode === 'synced'),
            appType: item.appType || 'window',
            status: item.status || 'Idle',
          });
        }
      });
      participantsStore.set(list);

      // Late-joiner sync: If local user is synced, adopt any active running timer from the room
      if (syncModeStore.get() === 'synced') {
        const now = Date.now();
        const activeRunningBuddy = list.find((m) => {
          if (m.id === sessionTabId) return false;
          const isBuddySynced = m.isSynced ?? (m.syncMode === 'synced');
          const isBuddyRunning = m.isRunning || m.status === 'Focusing';
          const endTime = m.endTime || (m.remainingSeconds ? now + m.remainingSeconds * 1000 : 0);
          return isBuddySynced && isBuddyRunning && endTime > now;
        });

        if (activeRunningBuddy) {
          const targetEnd = activeRunningBuddy.endTime || (now + activeRunningBuddy.remainingSeconds * 1000);
          const remaining = Math.max(0, Math.ceil((targetEnd - now) / 1000));
          incomingTimerSyncStore.set({
            isRunning: true,
            mode: (activeRunningBuddy.mode || (activeRunningBuddy.status === 'Break' ? 'break' : 'focus')) as 'focus' | 'break',
            endTime: targetEnd,
            remainingSeconds: remaining,
            updatedBy: activeRunningBuddy.id,
            action: 'START',
          });
        }
      }
    });

    // 2. Broadcast: Timer Sync ('timer_sync')
    channel.on('broadcast', { event: 'timer_sync' }, ({ payload }) => {
      if (payload && payload.updatedBy !== sessionTabId) {
        if (syncModeStore.get() === 'synced') {
          incomingTimerSyncStore.set(payload as TimerSyncPayload);
        }
      }
    });

    // 3. Broadcast: Request State
    channel.on('broadcast', { event: 'request_state' }, ({ payload }) => {
      if (payload && payload.updatedBy !== sessionTabId && localStateSupplier) {
        const state = localStateSupplier();
        if (state && channel) {
          channel.send({
            type: 'broadcast',
            event: 'timer_sync',
            payload: state,
          });
        }
      }
    });

    // Real Channel Status Subscription
    const subscribedPromise = new Promise<string>((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelStatusStore.set('SUBSCRIBED');
          isConnectedStore.set(true);
          isConnectingStore.set(false);
          connectionErrorStore.set(null);
          resolve('SUBSCRIBED');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          channelStatusStore.set(status as any);
          isConnectedStore.set(false);
          isConnectingStore.set(false);
          connectionErrorStore.set('Offline / Check .env');
          resolve(status);
        }
      });
    });

    const statusResult = await subscribedPromise;

    if (statusResult === 'SUBSCRIBED') {
      activeChannel = channel;

      // Track presence with unified schema
      currentLocalPresence.username = cleanUser;
      currentLocalPresence.avatarColor = getAvatarColor(cleanUser);
      currentLocalPresence.isSynced = syncModeStore.get() === 'synced';
      currentLocalPresence.syncMode = syncModeStore.get();
      await channel.track(currentLocalPresence);

      // Emit request_state for immediate sync catchup
      channel.send({
        type: 'broadcast',
        event: 'request_state',
        payload: {
          updatedBy: sessionTabId,
          timestamp: Date.now(),
        },
      });

      return true;
    } else {
      return false;
    }
  } catch (err: any) {
    isConnectingStore.set(false);
    channelStatusStore.set('CHANNEL_ERROR');
    connectionErrorStore.set('Offline / Check .env');
    return false;
  }
}

export async function leaveRoom(): Promise<void> {
  if (activeChannel && supabase) {
    try {
      await activeChannel.untrack();
      await supabase.removeChannel(activeChannel);
    } catch {}
    activeChannel = null;
  }
  channelStatusStore.set('DISCONNECTED');
  isConnectedStore.set(false);
  isConnectingStore.set(false);
  participantsStore.set([]);
  connectionErrorStore.set(null);
}

export function broadcastTimerAction(
  action: 'START' | 'PAUSE' | 'RESET' | 'MODE_CHANGE',
  mode: 'focus' | 'break',
  remainingSeconds: number,
  endTime?: number
) {
  if (!activeChannel || channelStatusStore.get() !== 'SUBSCRIBED' || syncModeStore.get() !== 'synced') return;

  const isRunning = action === 'START';
  const targetEndTime = endTime || (isRunning ? Date.now() + remainingSeconds * 1000 : 0);
  const payload: TimerSyncPayload = {
    isRunning,
    mode,
    endTime: targetEndTime,
    remainingSeconds,
    updatedBy: sessionTabId,
    action,
  };

  activeChannel.send({
    type: 'broadcast',
    event: 'timer_sync',
    payload,
  }).catch((e) => {
    console.warn('Broadcast timer_sync error:', e);
  });
}
