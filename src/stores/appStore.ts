import { atom, map } from 'nanostores';

export type SceneryType = 'countryside' | 'ocean' | 'mountains' | 'city';
export type TimeOfDayType = 'day' | 'sunset' | 'night';
export type WeatherType = 'clear' | 'cloudy' | 'rainy' | 'thunder' | 'snowy';

export interface ElementsConfig {
  plant: boolean;
  dog: boolean;
  stringLights: boolean;
  patioMug: boolean;
  birds: boolean;
  trees: boolean;
  leaves: boolean;
}

export interface SoundChannel {
  on: boolean;
  volume: number; // 0 - 100
}

export interface SoundMixerState {
  rain: SoundChannel;
  thunder: SoundChannel;
  trees: SoundChannel;
  birds: SoundChannel;
  waves: SoundChannel;
  masterVolume: number;
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

const isClient = typeof window !== 'undefined';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (!isClient) return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (!isClient) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

// Stores
export const sceneryStore = atom<SceneryType>(loadFromStorage('vg_scenery', 'ocean'));
export const timeOfDayStore = atom<TimeOfDayType>(loadFromStorage('vg_timeOfDay', 'sunset'));
export const weatherStore = atom<WeatherType>(loadFromStorage('vg_weather', 'clear'));

const defaultElements: ElementsConfig = {
  plant: true,
  dog: true,
  stringLights: true,
  patioMug: true,
  birds: true,
  trees: true,
  leaves: true,
};

function getInitialElements(): ElementsConfig {
  const loaded = loadFromStorage<any>('vg_elements', defaultElements);
  if (loaded && loaded.dog === undefined && loaded.cat !== undefined) {
    loaded.dog = loaded.cat;
  }
  return { ...defaultElements, ...loaded };
}

export const elementsStore = map<ElementsConfig>(getInitialElements());

export const soundMixerStore = map<SoundMixerState>(
  loadFromStorage('vg_sound_mixer', {
    rain: { on: false, volume: 65 },
    thunder: { on: false, volume: 75 },
    trees: { on: false, volume: 50 },
    birds: { on: true, volume: 45 },
    waves: { on: true, volume: 60 },
    masterVolume: 80,
  })
);

export const zenModeStore = atom<boolean>(false);
export const settingsOpenStore = atom<boolean>(false);
export const lightningFlashStore = atom<boolean>(false);

// Tasks
const initialTasks: TaskItem[] = [
  { id: '1', text: 'Sip warm tea & watch the waves', completed: false, createdAt: Date.now() - 3600000 },
  { id: '2', text: 'Deep work focus sprint', completed: false, createdAt: Date.now() - 1800000 },
  { id: '3', text: 'Daily reflection & cozy break', completed: true, createdAt: Date.now() - 900000 },
];
export const tasksStore = atom<TaskItem[]>(loadFromStorage('vg_tasks', initialTasks));
export const taskFilterStore = atom<'all' | 'active' | 'done'>('all');

// Pomodoro Settings
export const pomodoroSettingsStore = map<{ focusMinutes: number; breakMinutes: number }>(
  loadFromStorage('vg_pomo_settings', { focusMinutes: 25, breakMinutes: 5 })
);

// Widget positions & minimize states
export const widgetPositionsStore = map<{
  tasks: WidgetPosition;
  pomodoro: WidgetPosition;
  music: WidgetPosition;
}>(
  loadFromStorage('vg_widget_positions', {
    tasks: { x: 28, y: 28 },
    pomodoro: { x: -1, y: 28 }, // -1 means centered horizontally
    music: { x: -1, y: -1 }, // -1 means anchored bottom right
  })
);

export const widgetMinimizedStore = map<{
  tasks: boolean;
  pomodoro: boolean;
  music: boolean;
}>(
  loadFromStorage('vg_widget_minimized', {
    tasks: false,
    pomodoro: false,
    music: false,
  })
);

// Subscribe & persist helpers
if (isClient) {
  sceneryStore.subscribe((val) => saveToStorage('vg_scenery', val));
  timeOfDayStore.subscribe((val) => saveToStorage('vg_timeOfDay', val));
  weatherStore.subscribe((val) => saveToStorage('vg_weather', val));
  elementsStore.subscribe((val) => saveToStorage('vg_elements', val));
  soundMixerStore.subscribe((val) => saveToStorage('vg_sound_mixer', val));
  tasksStore.subscribe((val) => saveToStorage('vg_tasks', val));
  pomodoroSettingsStore.subscribe((val) => saveToStorage('vg_pomo_settings', val));
  widgetPositionsStore.subscribe((val) => saveToStorage('vg_widget_positions', val));
  widgetMinimizedStore.subscribe((val) => saveToStorage('vg_widget_minimized', val));
}

// Preset logic: Smart auto-presets on weather/scenery change
export function setSceneryWithSmartAudio(scenery: SceneryType) {
  sceneryStore.set(scenery);
  const current = soundMixerStore.get();
  if (scenery === 'ocean') {
    soundMixerStore.setKey('waves', { ...current.waves, on: true });
  }
}

export function setWeatherWithSmartAudio(weather: WeatherType) {
  weatherStore.set(weather);
  const current = soundMixerStore.get();
  
  if (weather === 'thunder') {
    soundMixerStore.setKey('rain', { ...current.rain, on: true });
    soundMixerStore.setKey('thunder', { ...current.thunder, on: true });
  } else if (weather === 'rainy') {
    // Explicitly enable ONLY Rain and mute Thunder, clearing any lightning
    soundMixerStore.setKey('rain', { ...current.rain, on: true });
    soundMixerStore.setKey('thunder', { ...current.thunder, on: false });
    lightningFlashStore.set(false);
  } else {
    // Clear, Cloudy, Snowy - strictly NO thunder and NO lightning
    soundMixerStore.setKey('thunder', { ...current.thunder, on: false });
    lightningFlashStore.set(false);
    
    if (weather === 'snowy') {
      soundMixerStore.setKey('rain', { ...current.rain, on: false });
      soundMixerStore.setKey('trees', { ...current.trees, on: true });
    } else if (weather === 'cloudy') {
      soundMixerStore.setKey('rain', { ...current.rain, on: false });
      soundMixerStore.setKey('trees', { ...current.trees, on: true });
    } else if (weather === 'clear') {
      soundMixerStore.setKey('rain', { ...current.rain, on: false });
      const time = timeOfDayStore.get();
      if (time !== 'night') {
        soundMixerStore.setKey('birds', { ...current.birds, on: true });
      }
    }
  }
}

