import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  isJoinedStore,
  roomCodeStore,
  usernameStore,
  syncModeStore,
  participantsStore,
  channelStatusStore,
  connectionErrorStore,
  incomingTimerSyncStore,
  localTimerStateStore,
  tabId,
  getAvatarColor,
  setChannelInstance,
  type Participant,
  type TimerSyncPayload,
} from '../stores/groupStudyStore';

export function useStudyRoom() {
  const isJoined = useStore(isJoinedStore);
  const roomCode = useStore(roomCodeStore);
  const username = useStore(usernameStore);
  const syncMode = useStore(syncModeStore);
  const participants = useStore(participantsStore);
  const channelStatus = useStore(channelStatusStore);
  const timerState = useStore(localTimerStateStore);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const isSynced = syncMode === 'synced';
  const latestStateRef = useRef({
    username,
    appType: 'patio' as const,
    isRunning: timerState.isRunning,
    mode: timerState.mode,
    remainingSeconds: timerState.remainingSeconds,
    endTime: timerState.endTime,
    isSynced,
    status: timerState.isRunning
      ? (timerState.mode === 'focus' ? 'Focusing' : 'Break')
      : 'Idle',
    avatarColor: getAvatarColor(username),
  });

  // Keep latestStateRef updated on every render without triggering effects
  latestStateRef.current = {
    username,
    appType: 'patio',
    isRunning: timerState.isRunning,
    mode: timerState.mode,
    remainingSeconds: timerState.remainingSeconds,
    endTime: timerState.endTime,
    isSynced,
    status: timerState.isRunning
      ? (timerState.mode === 'focus' ? 'Focusing' : 'Break')
      : 'Idle',
    avatarColor: getAvatarColor(username),
  };

  // 1. Clean Channel Lifecycle (useEffect depending on [isJoined, roomCode, reconnectAttempt])
  useEffect(() => {
    if (!isJoined || !supabase) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channelRef.current) {
        try {
          supabase?.removeChannel(channelRef.current);
        } catch {}
        channelRef.current = null;
      }
      setChannelInstance(null);
      channelStatusStore.set('offline');
      return;
    }

    let isCancelled = false;
    const cleanRoom = roomCode.trim().toLowerCase().replace(/^#/, '') || 'study-lounge';
    const channelName = `cozy-study-room:${cleanRoom}`;

    const setupChannel = async () => {
      if (isCancelled) return;

      // Always remove previous channels so no duplicate cozy-study-room topic collides
      try {
        await supabase.removeAllChannels();
      } catch (err) {
        console.warn('removeAllChannels warning:', err);
      }
      if (isCancelled) return;

      channelStatusStore.set('connecting');

      const channel = supabase.channel(channelName, {
        config: {
          presence: { key: tabId },
          broadcast: { self: false },
        },
      });

      // Presence Listener: Flatten Object.values(channel.presenceState()).flat() with ZERO filtering by appType
      channel.on('presence', { event: 'sync' }, () => {
        if (isCancelled) return;
        const presenceState = channel.presenceState();
        const rawList: any[] = Object.values(presenceState).flat();

        const list: Participant[] = rawList.map((item: any) => {
          const isPeerSynced =
            item.isSynced === true ||
            (item.isSynced as any) === 'true' ||
            item.syncMode === 'synced';
          const isPeerRunning =
            item.isRunning === true ||
            (item.isRunning as any) === 'true' ||
            item.status === 'Focusing' ||
            item.status === 'Break';
          const peerMode = item.mode || (item.status === 'Break' ? 'break' : 'focus');
          const peerEndTime = item.endTime ? Number(item.endTime) : null;
          const peerRemaining =
            typeof item.remainingSeconds === 'number'
              ? item.remainingSeconds
              : Number(item.remainingSeconds) || 0;

          return {
            id: item.id || 'peer',
            username: item.username || 'Scholar',
            appType: item.appType || 'window',
            status:
              item.status || (isPeerRunning ? (peerMode === 'focus' ? 'Focusing' : 'Break') : 'Idle'),
            isSynced: isPeerSynced,
            syncMode: isPeerSynced ? 'synced' : 'unsynced',
            isRunning: isPeerRunning,
            mode: peerMode,
            endTime: peerEndTime,
            remainingSeconds: peerRemaining,
            avatarColor: item.avatarColor || getAvatarColor(item.username || 'Scholar'),
          };
        });

        // Ensure (You) is always present
        const hasSelf = list.some((p) => p.id === tabId);
        if (!hasSelf && isJoinedStore.get()) {
          list.unshift({
            id: tabId,
            username: latestStateRef.current.username,
            appType: 'patio',
            status: latestStateRef.current.status as any,
            remainingSeconds: latestStateRef.current.remainingSeconds,
            endTime: latestStateRef.current.endTime,
            isRunning: latestStateRef.current.isRunning,
            mode: latestStateRef.current.mode,
            isSynced: latestStateRef.current.isSynced,
            avatarColor: latestStateRef.current.avatarColor,
          });
        }

        // Sort (You) (id === tabId) first, followed by all other peers
        list.sort((a, b) => {
          if (a.id === tabId) return -1;
          if (b.id === tabId) return 1;
          return a.username.localeCompare(b.username);
        });

        participantsStore.set(list);

        // If local user is synced, adopt active countdown of any running synced peer
        if (latestStateRef.current.isSynced) {
          const now = Date.now();
          const runningSyncedPeer = list.find(
            (peer) =>
              peer.id !== tabId &&
              peer.isSynced &&
              peer.isRunning &&
              peer.endTime &&
              peer.endTime > now
          );

          if (runningSyncedPeer && runningSyncedPeer.endTime) {
            const targetEnd = runningSyncedPeer.endTime;
            const remaining = Math.max(0, Math.ceil((targetEnd - now) / 1000));
            const mode = runningSyncedPeer.mode || 'focus';

            const currentLocal = latestStateRef.current;
            if (
              !(
                currentLocal.isRunning &&
                currentLocal.endTime &&
                Math.abs(currentLocal.endTime - targetEnd) < 2000 &&
                currentLocal.mode === mode
              )
            ) {
              incomingTimerSyncStore.set({
                isRunning: true,
                mode,
                endTime: targetEnd,
                remainingSeconds: remaining,
                updatedBy: runningSyncedPeer.id,
                action: 'START',
              });
            }
          } else {
            const pausedSyncedPeer = list.find((peer) => peer.id !== tabId && peer.isSynced);
            if (pausedSyncedPeer && !latestStateRef.current.isRunning) {
              const remaining =
                pausedSyncedPeer.remainingSeconds ||
                (pausedSyncedPeer.mode === 'break' ? 5 * 60 : 25 * 60);
              const mode = pausedSyncedPeer.mode || 'focus';
              if (
                latestStateRef.current.remainingSeconds !== remaining ||
                latestStateRef.current.mode !== mode
              ) {
                incomingTimerSyncStore.set({
                  isRunning: false,
                  mode,
                  endTime: null,
                  remainingSeconds: remaining,
                  updatedBy: pausedSyncedPeer.id,
                  action: 'PAUSE',
                });
              }
            }
          }
        }
      });

      // Broadcast Listener: timer_sync
      channel.on('broadcast', { event: 'timer_sync' }, ({ payload }) => {
        if (isCancelled) return;
        if (payload && payload.updatedBy !== tabId && latestStateRef.current.isSynced) {
          incomingTimerSyncStore.set(payload as TimerSyncPayload);
        }
      });

      // Broadcast Listener: request_state
      channel.on('broadcast', { event: 'request_state' }, ({ payload }) => {
        if (isCancelled) return;
        if (payload && payload.updatedBy !== tabId && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'timer_sync',
            payload: {
              isRunning: latestStateRef.current.isRunning,
              mode: latestStateRef.current.mode,
              endTime: latestStateRef.current.endTime,
              remainingSeconds: latestStateRef.current.remainingSeconds,
              updatedBy: tabId,
              action: latestStateRef.current.isRunning ? 'START' : 'PAUSE',
            },
          });
        }
      });

      // Subscription Callback
      channel.subscribe(async (status) => {
        if (isCancelled) return;
        if (status === 'SUBSCRIBED') {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          channelRef.current = channel;
          setChannelInstance(channel);
          channelStatusStore.set('online');
          connectionErrorStore.set(null);

          // Track presence immediately inside status === 'SUBSCRIBED'
          try {
            await channel.track({
              id: tabId,
              ...latestStateRef.current,
            });
          } catch (e) {
            console.warn('Track on SUBSCRIBED error:', e);
          }

          // Ensure local user is immediately in participantsStore
          const currentList = participantsStore.get();
          if (!currentList.some((p) => p.id === tabId)) {
            participantsStore.set([
              {
                id: tabId,
                username: latestStateRef.current.username,
                appType: 'patio',
                status: latestStateRef.current.status as any,
                remainingSeconds: latestStateRef.current.remainingSeconds,
                endTime: latestStateRef.current.endTime,
                isRunning: latestStateRef.current.isRunning,
                mode: latestStateRef.current.mode,
                isSynced: latestStateRef.current.isSynced,
                avatarColor: latestStateRef.current.avatarColor,
              },
              ...currentList,
            ]);
          }

          // Emit request_state for immediate sync catchup
          channel.send({
            type: 'broadcast',
            event: 'request_state',
            payload: { updatedBy: tabId, timestamp: Date.now() },
          });
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          console.warn('Realtime channel status:', status, '- scheduling auto-reconnect');
          if (isJoinedStore.get()) {
            channelStatusStore.set('reconnecting');
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!isCancelled && isJoinedStore.get()) {
                try {
                  supabase.removeChannel(channel);
                } catch {}
                channelRef.current = null;
                setReconnectAttempt((n) => n + 1);
              }
            }, 2000);
          }
        }
      });
    };

    setupChannel();

    return () => {
      isCancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch {}
        channelRef.current = null;
      }
      setChannelInstance(null);
    };
  }, [isJoined, roomCode, reconnectAttempt]);

  // 2. Discrete State Tracking (No Per-Second Spam)
  // Track ONLY when username, isRunning, mode, or isSynced changes
  useEffect(() => {
    if (
      isJoined &&
      channelRef.current &&
      (channelStatusStore.get() === 'online' || channelStatusStore.get() === 'SUBSCRIBED')
    ) {
      channelRef.current
        .track({
          id: tabId,
          ...latestStateRef.current,
        })
        .catch((e) => {
          console.warn('Track on discrete state change error:', e);
        });
    }
  }, [username, timerState.isRunning, timerState.mode, syncMode]);

  // 3. Immediate Health Check on Tab Focus (visibilitychange & online)
  useEffect(() => {
    const handleHealthCheck = async () => {
      if (!isJoinedStore.get()) return;

      const isVisible =
        typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
      if (!isVisible) return;

      const state = (channelRef.current as any)?.state;
      const currentStatus = channelStatusStore.get();

      if (
        !channelRef.current ||
        state !== 'joined' ||
        currentStatus === 'reconnecting' ||
        currentStatus === 'offline' ||
        currentStatus === 'CHANNEL_ERROR' ||
        currentStatus === 'TIMED_OUT' ||
        currentStatus === 'CLOSED'
      ) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        if (channelRef.current) {
          try {
            supabase?.removeChannel(channelRef.current);
          } catch {}
          channelRef.current = null;
        }
        channelStatusStore.set('connecting');
        setReconnectAttempt((n) => n + 1);
      } else {
        try {
          await channelRef.current.track({
            id: tabId,
            ...latestStateRef.current,
          });
        } catch (e) {
          console.warn('Visibility re-track error:', e);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleHealthCheck);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleHealthCheck);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleHealthCheck);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleHealthCheck);
      }
    };
  }, [isJoined]);

  return {
    isJoined,
    roomCode,
    username,
    syncMode,
    isSynced,
    participants,
    channelStatus,
    tabId,
  };
}

