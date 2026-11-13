import React from 'react';
import { useStore } from '@nanostores/react';
import {
  sceneryStore,
  timeOfDayStore,
  weatherStore,
  elementsStore,
  lightningFlashStore,
} from '../stores/appStore';

// Deterministic Night Sky Stars (92 static circular stars)
// Defined outside component render cycle with fixed coordinates and opacities
interface StarConfig {
  x: number;
  y: number;
  r: number;
  o: number;
}

const NIGHT_STARS: StarConfig[] = [
  { x: 3, y: 8, r: 0.8, o: 0.5 },
  { x: 6, y: 22, r: 1.2, o: 0.85 },
  { x: 8, y: 14, r: 0.7, o: 0.45 },
  { x: 11, y: 5, r: 1.4, o: 0.9 },
  { x: 14, y: 28, r: 0.9, o: 0.6 },
  { x: 16, y: 18, r: 1.6, o: 0.95 },
  { x: 19, y: 35, r: 0.7, o: 0.4 },
  { x: 21, y: 9, r: 1.1, o: 0.75 },
  { x: 24, y: 24, r: 0.8, o: 0.55 },
  { x: 26, y: 4, r: 1.3, o: 0.85 },
  { x: 29, y: 15, r: 0.9, o: 0.65 },
  { x: 31, y: 32, r: 1.5, o: 0.9 },
  { x: 34, y: 11, r: 0.7, o: 0.45 },
  { x: 36, y: 26, r: 1.2, o: 0.8 },
  { x: 38, y: 6, r: 1.0, o: 0.7 },
  { x: 41, y: 19, r: 0.8, o: 0.5 },
  { x: 43, y: 38, r: 1.4, o: 0.85 },
  { x: 46, y: 14, r: 0.7, o: 0.4 },
  { x: 48, y: 29, r: 1.3, o: 0.8 },
  { x: 51, y: 8, r: 0.9, o: 0.6 },
  { x: 53, y: 22, r: 1.6, o: 0.95 },
  { x: 56, y: 42, r: 0.8, o: 0.45 },
  { x: 58, y: 17, r: 1.1, o: 0.75 },
  { x: 61, y: 5, r: 0.7, o: 0.5 },
  { x: 63, y: 31, r: 1.5, o: 0.9 },
  { x: 66, y: 13, r: 1.0, o: 0.7 },
  { x: 68, y: 25, r: 0.8, o: 0.55 },
  { x: 71, y: 7, r: 1.3, o: 0.85 },
  { x: 73, y: 36, r: 0.7, o: 0.4 },
  { x: 76, y: 16, r: 1.2, o: 0.8 },
  { x: 78, y: 28, r: 0.9, o: 0.6 },
  { x: 81, y: 10, r: 1.4, o: 0.9 },
  { x: 83, y: 44, r: 0.8, o: 0.45 },
  { x: 86, y: 20, r: 1.1, o: 0.75 },
  { x: 88, y: 6, r: 1.7, o: 0.95 },
  { x: 91, y: 33, r: 0.7, o: 0.4 },
  { x: 93, y: 15, r: 1.3, o: 0.85 },
  { x: 96, y: 24, r: 0.9, o: 0.6 },
  { x: 5, y: 36, r: 1.1, o: 0.7 },
  { x: 9, y: 45, r: 0.7, o: 0.45 },
  { x: 13, y: 11, r: 1.5, o: 0.9 },
  { x: 17, y: 41, r: 0.8, o: 0.5 },
  { x: 22, y: 17, r: 1.2, o: 0.8 },
  { x: 25, y: 47, r: 0.7, o: 0.4 },
  { x: 28, y: 21, r: 1.4, o: 0.85 },
  { x: 33, y: 40, r: 0.9, o: 0.6 },
  { x: 37, y: 16, r: 1.1, o: 0.75 },
  { x: 40, y: 49, r: 0.8, o: 0.45 },
  { x: 44, y: 23, r: 1.3, o: 0.85 },
  { x: 47, y: 35, r: 0.7, o: 0.4 },
  { x: 52, y: 15, r: 1.6, o: 0.95 },
  { x: 55, y: 27, r: 0.9, o: 0.65 },
  { x: 59, y: 39, r: 1.2, o: 0.75 },
  { x: 62, y: 19, r: 0.8, o: 0.5 },
  { x: 67, y: 33, r: 1.4, o: 0.85 },
  { x: 70, y: 21, r: 0.7, o: 0.4 },
  { x: 74, y: 43, r: 1.1, o: 0.7 },
  { x: 79, y: 18, r: 0.9, o: 0.6 },
  { x: 82, y: 37, r: 1.5, o: 0.9 },
  { x: 87, y: 27, r: 0.8, o: 0.5 },
  { x: 90, y: 12, r: 1.2, o: 0.8 },
  { x: 94, y: 41, r: 0.7, o: 0.45 },
  { x: 97, y: 18, r: 1.0, o: 0.7 },
  { x: 4, y: 15, r: 0.8, o: 0.55 },
  { x: 12, y: 33, r: 1.3, o: 0.85 },
  { x: 20, y: 43, r: 0.7, o: 0.4 },
  { x: 27, y: 12, r: 1.1, o: 0.75 },
  { x: 35, y: 45, r: 0.9, o: 0.6 },
  { x: 42, y: 7, r: 1.4, o: 0.9 },
  { x: 50, y: 46, r: 0.8, o: 0.45 },
  { x: 57, y: 11, r: 1.2, o: 0.8 },
  { x: 65, y: 48, r: 0.7, o: 0.4 },
  { x: 72, y: 15, r: 1.5, o: 0.9 },
  { x: 80, y: 50, r: 0.9, o: 0.55 },
  { x: 89, y: 38, r: 1.3, o: 0.85 },
  { x: 95, y: 9, r: 0.8, o: 0.5 },
  { x: 7, y: 30, r: 0.9, o: 0.6 },
  { x: 15, y: 7, r: 1.1, o: 0.75 },
  { x: 23, y: 39, r: 0.8, o: 0.5 },
  { x: 30, y: 25, r: 1.3, o: 0.85 },
  { x: 39, y: 33, r: 0.7, o: 0.4 },
  { x: 45, y: 11, r: 1.2, o: 0.8 },
  { x: 54, y: 48, r: 0.9, o: 0.6 },
  { x: 60, y: 24, r: 1.4, o: 0.9 },
  { x: 69, y: 40, r: 0.8, o: 0.5 },
  { x: 75, y: 8, r: 1.0, o: 0.7 },
  { x: 84, y: 23, r: 1.2, o: 0.8 },
  { x: 92, y: 47, r: 0.7, o: 0.4 },
  { x: 2, y: 42, r: 1.0, o: 0.65 },
  { x: 49, y: 18, r: 1.3, o: 0.85 },
  { x: 64, y: 9, r: 0.8, o: 0.55 },
  { x: 85, y: 52, r: 1.1, o: 0.75 },
];

export const OutdoorScenery: React.FC = () => {
  const scenery = useStore(sceneryStore);
  const timeOfDay = useStore(timeOfDayStore);
  const weather = useStore(weatherStore);
  const elements = useStore(elementsStore);
  const lightningFlash = useStore(lightningFlashStore);

  // Explicit sky gradient based on time of day
  const getSkyGradient = () => {
    // STRICT RULE: Lightning flash sky illumination ONLY runs when weather === 'thunder'
    if (weather === 'thunder' && lightningFlash) {
      return 'linear-gradient(to bottom, #dbeafe 0%, #eff6ff 50%, #93c5fd 100%)';
    }
    if (weather === 'thunder') {
      return timeOfDay === 'day'
        ? 'linear-gradient(to bottom, #2b3342 0%, #3a4556 50%, #526074 100%)'
        : 'linear-gradient(to bottom, #0d1117 0%, #161b22 55%, #1f2937 100%)';
    }
    if (weather === 'rainy' || weather === 'cloudy') {
      if (timeOfDay === 'day') {
        return 'linear-gradient(to bottom, #606d7d 0%, #8391a1 50%, #a8b7c7 100%)';
      }
      if (timeOfDay === 'sunset') {
        return 'linear-gradient(to bottom, #44374b 0%, #6e4c5b 45%, #9d6b6d 100%)';
      }
      return 'linear-gradient(to bottom, #0a0d14 0%, #121824 50%, #1a2232 100%)';
    }
    // Clear / Snowy default sky
    switch (timeOfDay) {
      case 'day':
        return 'linear-gradient(to bottom, #3b82f6 0%, #60a5fa 40%, #93c5fd 75%, #bae6fd 100%)';
      case 'sunset':
        return 'linear-gradient(to bottom, #311b47 0%, #582457 25%, #9b3956 55%, #df5e52 80%, #f9a061 100%)';
      case 'night':
      default:
        return 'linear-gradient(to bottom, #060913 0%, #0c1222 45%, #151d33 80%, #1e293b 100%)';
    }
  };

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';
  const isDay = timeOfDay === 'day';
  const showWarmLights = isNight || isSunset || weather === 'thunder' || weather === 'rainy';

  return (
    <div
      data-weather={weather}
      data-scenery={scenery}
      data-timeofday={timeOfDay}
      className="absolute inset-0 w-full h-full pointer-events-none transition-colors duration-1000 overflow-hidden"
      style={{ background: getSkyGradient() }}
    >
      {/* Lightning Overlay Flash - STRICTLY only during thunder mode */}
      {weather === 'thunder' && lightningFlash && (
        <div className="absolute inset-0 bg-white/70 z-30 transition-opacity duration-75 pointer-events-none" />
      )}

      {/* Celestial Bodies: Sun / Moon / Stars */}
      {isNight && (
        <>
          {/* Static Circular Starfield: Only visible in Clear weather; zero animations, no sparkle paths */}
          {weather === 'clear' && (
            <svg className="absolute inset-0 w-full h-2/3 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              {NIGHT_STARS.map((star, idx) => (
                <circle
                  key={`star-${idx}`}
                  cx={`${star.x}%`}
                  cy={`${star.y}%`}
                  r={star.r}
                  fill="#ffffff"
                  opacity={star.o}
                />
              ))}
            </svg>
          )}

          {/* Soft Atmospheric Moon with Ethereal Halo Glow */}
          <div className="absolute right-[22%] top-[12%] -translate-x-6 -translate-y-6 w-28 h-28 rounded-full bg-indigo-300/15 blur-xl pointer-events-none" />
          <div className="absolute right-[22%] top-[12%] w-16 h-16 rounded-full bg-amber-50 shadow-[0_0_50px_rgba(254,243,199,0.5),0_0_80px_rgba(165,180,252,0.25)] flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-amber-100/95 shadow-inner" />
          </div>
        </>
      )}

      {isDay && (
        /* Soft Daylight Sun */
        <div className="absolute right-[24%] top-[14%] w-20 h-20 rounded-full bg-yellow-100 shadow-[0_0_70px_rgba(253,224,71,0.6)] opacity-95" />
      )}

      {isSunset && (
        /* Low Golden Sunset Sun */
        <div className="absolute right-[28%] bottom-[42%] w-24 h-24 rounded-full bg-gradient-to-t from-amber-400 to-rose-300 shadow-[0_0_80px_rgba(251,146,60,0.8)] opacity-90" />
      )}

      {/* Flying Birds (Day or Sunset, and Clear/Snowy, and elements.birds on) */}
      {elements.birds && (isDay || isSunset) && weather !== 'thunder' && weather !== 'rainy' && (
        <div
          className="absolute top-[18%] left-0 w-32 h-16 pointer-events-none opacity-70"
          style={{ animation: 'birdFly 26s linear infinite' }}
        >
          <svg viewBox="0 0 100 50" className="w-full h-full fill-current text-slate-800/80">
            {/* V-formation birds */}
            <path d="M10 20 Q 20 12, 30 20 Q 40 12, 50 20 Q 40 16, 30 23 Q 20 16, 10 20 Z" />
            <path d="M45 10 Q 52 4, 60 10 Q 67 4, 75 10 Q 67 7, 60 12 Q 52 7, 45 10 Z" opacity="0.8" />
            <path d="M60 26 Q 66 21, 72 26 Q 78 21, 84 26 Q 78 23, 72 28 Q 66 23, 60 26 Z" opacity="0.6" />
          </svg>
        </div>
      )}

      {/* Multi-layered Drifting Clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Cloud Layer 1: High & Slow */}
        <div
          className="absolute top-[8%] left-[-20%] w-[140%] h-32 opacity-40"
          style={{ animation: 'cloudDriftSlow 75s linear infinite' }}
        >
          <svg viewBox="0 0 1200 160" className="w-full h-full fill-white/60">
            <ellipse cx="200" cy="80" rx="140" ry="40" />
            <ellipse cx="280" cy="65" rx="100" ry="35" />
            <ellipse cx="750" cy="90" rx="180" ry="45" />
            <ellipse cx="860" cy="70" rx="120" ry="38" />
          </svg>
        </div>

        {/* Cloud Layer 2: Lower & Mid */}
        <div
          className={`absolute top-[18%] left-[-25%] w-[150%] h-40 ${
            weather === 'thunder' ? 'opacity-85 text-slate-700' : weather === 'cloudy' ? 'opacity-65 text-slate-200' : 'opacity-30 text-white'
          }`}
          style={{ animation: 'cloudDriftFast 50s linear infinite' }}
        >
          <svg viewBox="0 0 1400 200" className="w-full h-full fill-current">
            <ellipse cx="350" cy="110" rx="170" ry="50" />
            <ellipse cx="460" cy="90" rx="130" ry="42" />
            <ellipse cx="1000" cy="120" rx="220" ry="58" />
            <ellipse cx="1140" cy="95" rx="150" ry="45" />
          </svg>
        </div>
      </div>

      {/* Specific Scenery Visuals */}
      {scenery === 'countryside' && (
        <CountrysideLandscape isNight={isNight} isSunset={isSunset} showWarmLights={showWarmLights} treesEnabled={elements.trees} />
      )}
      {scenery === 'ocean' && (
        <OceanLandscape isNight={isNight} isSunset={isSunset} showWarmLights={showWarmLights} />
      )}
      {scenery === 'mountains' && (
        <MountainsLandscape isNight={isNight} isSunset={isSunset} showWarmLights={showWarmLights} treesEnabled={elements.trees} />
      )}
      {scenery === 'city' && (
        <CityLandscape isNight={isNight} isSunset={isSunset} showWarmLights={showWarmLights} />
      )}

      {/* Weather Particle Systems: Rain, Snow, Leaves */}
      {weather === 'rainy' && <RainParticles heavy={false} />}
      {weather === 'thunder' && <RainParticles heavy={true} />}
      {weather === 'snowy' && <SnowParticles />}
      {/* Auto-hide leaves during Rainy, Thunder, Snowy - only active in Cloudy */}
      {elements.leaves && weather === 'cloudy' && <DriftingLeaves />}
    </div>
  );
};

// 1. COUNTRYSIDE SCENERY
const CountrysideLandscape: React.FC<{
  isNight: boolean;
  isSunset: boolean;
  showWarmLights: boolean;
  treesEnabled: boolean;
}> = ({ isNight, isSunset, showWarmLights, treesEnabled }) => {
  const hillFar = isNight ? '#101a2e' : isSunset ? '#6b364e' : '#578e5f';
  const hillMid = isNight ? '#0b1322' : isSunset ? '#50283c' : '#45794d';
  const hillNear = isNight ? '#070c17' : isSunset ? '#371c2a' : '#33623a';
  const treeColor = isNight ? '#040810' : isSunset ? '#27131e' : '#1e4324';

  return (
    <div className="absolute inset-0 w-full h-full">
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        className="w-full h-full absolute inset-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Distant Rolling Hills */}
        <path d="M0,580 Q 320,490 680,550 T 1440,510 L 1440,900 L 0,900 Z" fill={hillFar} opacity="0.85" />
        {/* Middle Rolling Hills */}
        <path d="M0,640 Q 420,560 880,620 T 1440,590 L 1440,900 L 0,900 Z" fill={hillMid} />
        {/* Fore Hills */}
        <path d="M0,710 Q 500,640 1020,700 T 1440,680 L 1440,900 L 0,900 Z" fill={hillNear} />

        {/* Layered Pine Trees on slopes */}
        {treesEnabled && (
          <g fill={treeColor} className="transition-transform duration-700">
            {/* Clump 1 - Left */}
            <path d="M 120,620 L 135,570 L 150,620 Z M 125,580 L 135,550 L 145,580 Z" />
            <path d="M 145,630 L 165,565 L 185,630 Z M 152,580 L 165,545 L 178,580 Z" />
            <path d="M 180,640 L 195,585 L 210,640 Z" />
            {/* Clump 2 - Mid Left */}
            <path d="M 380,650 L 400,580 L 420,650 Z M 388,595 L 400,560 L 412,595 Z" />
            <path d="M 415,660 L 430,600 L 445,660 Z" />
            {/* Clump 3 - Right slope */}
            <path d="M 1120,670 L 1145,590 L 1170,670 Z M 1130,610 L 1145,570 L 1160,610 Z" />
            <path d="M 1165,680 L 1185,615 L 1205,680 Z" />
            <path d="M 1200,690 L 1220,625 L 1240,690 Z" />
          </g>
        )}

        {/* Cozy Distant House on Mid Hill */}
        <g transform="translate(760, 560)">
          {/* House body */}
          <rect x="0" y="30" width="70" height="42" fill={isNight ? '#161922' : isSunset ? '#452b36' : '#d1c7bd'} />
          {/* Gable Roof */}
          <polygon points="-8,30 35,2 78,30" fill={isNight ? '#0d1017' : isSunset ? '#2c1921' : '#7c3f3f'} />
          {/* Chimney */}
          <rect x="52" y="10" width="10" height="20" fill={isNight ? '#0d1017' : isSunset ? '#2c1921' : '#693333'} />
          {/* Windows (glowing amber during sunset/night) */}
          <rect
            x="12"
            y="42"
            width="16"
            height="18"
            rx="1"
            fill={showWarmLights ? '#fbbf24' : '#64748b'}
            className={showWarmLights ? 'shadow-[0_0_12px_#fbbf24]' : ''}
          />
          <rect
            x="42"
            y="42"
            width="16"
            height="18"
            rx="1"
            fill={showWarmLights ? '#fbbf24' : '#64748b'}
            className={showWarmLights ? 'shadow-[0_0_12px_#fbbf24]' : ''}
          />
          {/* Chimney smoke puff */}
          {showWarmLights && (
            <ellipse cx="57" cy="4" rx="5" ry="3" fill="#cbd5e1" opacity="0.45" />
          )}
        </g>
      </svg>
    </div>
  );
};

// 2. REFINED OCEAN SCENERY (Clean Horizon, Subtle Wave Contours & Sailboat)
const OceanLandscape: React.FC<{
  isNight: boolean;
  isSunset: boolean;
  showWarmLights: boolean;
}> = ({ isNight, isSunset, showWarmLights }) => {
  // Light shimmer horizontal center aligned with sun/moon
  const lightCenter = isSunset ? 1030 : isNight ? 1120 : 1090;

  // Horizon glow line color
  const horizonGlow = isSunset ? '#fed7aa' : isNight ? '#93c5fd' : '#bae6fd';

  // Smooth continuous depth gradient stops
  const waterTop = isNight ? '#0b1426' : isSunset ? '#6b253b' : '#1e40af';
  const waterMid = isNight ? '#070e1c' : isSunset ? '#451525' : '#1d4ed8';
  const waterBottom = isNight ? '#030710' : isSunset ? '#260a14' : '#172554';

  // Delicate wave contour stroke
  const waveStroke = isSunset ? '#fbcfe8' : isNight ? '#93c5fd' : '#bfdbfe';

  // Subtle organic glint color beneath sun/moon (soft, thin, no cone)
  const glintColor = isSunset ? '#fde68a' : isNight ? '#e0f2fe' : '#ffffff';

  // Rocky headland tone
  const rockDark = isNight ? '#060a14' : isSunset ? '#26111e' : '#1e293b';
  const rockMid = isNight ? '#0b1322' : isSunset ? '#3d1b30' : '#334155';

  return (
    <div className="absolute inset-0 w-full h-full">
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        className="w-full h-full absolute inset-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Continuous Depth Gradient from Horizon to Foreground */}
          <linearGradient id="oceanSmoothDepthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={waterTop} />
            <stop offset="42%" stopColor={waterMid} />
            <stop offset="100%" stopColor={waterBottom} />
          </linearGradient>

          {/* Lighthouse Beam */}
          <linearGradient id="lighthouseBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
            <stop offset="30%" stopColor="#fef08a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Crisp Horizon & Smooth Continuous Depth Gradient */}
        <rect x="0" y="510" width="1440" height="390" fill="url(#oceanSmoothDepthGrad)" />

        {/* Subtle Bright Horizon Glow Line */}
        <line
          x1="0"
          y1="510"
          x2="1440"
          y2="510"
          stroke={horizonGlow}
          strokeWidth="1.2"
          opacity="0.65"
        />

        {/* Subtle Curved Wave Contours (Delicate, thin 1px lines, low opacity 0.15-0.25) */}
        <g fill="none" stroke={waveStroke} strokeWidth="1" strokeLinecap="round" opacity="0.22">
          {/* Distant gentle swells */}
          <path d="M 0,528 Q 360,524 720,528 T 1440,526" />
          <path d="M 0,548 Q 340,553 680,547 T 1440,550" />
          <path d="M 0,572 Q 380,566 760,573 T 1440,569" />
          {/* Mid swells */}
          <path d="M 0,604 Q 360,612 720,603 T 1440,607" />
          <path d="M 0,642 Q 400,634 800,644 T 1440,639" />
          <path d="M 0,685 Q 380,696 780,684 T 1440,689" />
          {/* Near swells */}
          <path d="M 0,735 Q 420,724 840,737 T 1440,730" />
          <path d="M 0,792 Q 380,805 780,790 T 1440,796" />
          <path d="M 0,854 Q 440,842 880,856 T 1440,849" />
        </g>

        {/* Soft Organic Shimmer of Thin Horizontal Light Glints (No triangular cone shape, no thick white ovals) */}
        <g stroke={glintColor} strokeWidth="1.2" strokeLinecap="round">
          {[
            { y: 516, len: 16, off: -4, o: 0.65, dur: '3.0s', del: '0.2s' },
            { y: 524, len: 26, off: 6, o: 0.6, dur: '3.8s', del: '1.2s' },
            { y: 534, len: 34, off: -8, o: 0.55, dur: '3.4s', del: '0.5s' },
            { y: 546, len: 28, off: 12, o: 0.5, dur: '4.2s', del: '1.8s' },
            { y: 560, len: 44, off: -12, o: 0.5, dur: '3.6s', del: '0.8s' },
            { y: 578, len: 38, off: 8, o: 0.45, dur: '4.0s', del: '2.1s' },
            { y: 598, len: 52, off: -6, o: 0.4, dur: '3.3s', del: '0.4s' },
            { y: 622, len: 42, off: 14, o: 0.38, dur: '4.5s', del: '1.6s' },
            { y: 650, len: 60, off: -10, o: 0.35, dur: '3.7s', del: '1.0s' },
            { y: 684, len: 48, off: 8, o: 0.32, dur: '4.3s', del: '2.4s' },
            { y: 724, len: 66, off: -14, o: 0.3, dur: '3.9s', del: '0.7s' },
            { y: 770, len: 54, off: 10, o: 0.28, dur: '4.6s', del: '1.9s' },
            { y: 825, len: 72, off: -8, o: 0.25, dur: '4.1s', del: '1.3s' },
          ].map((glint, i) => (
            <line
              key={`glint-${i}`}
              x1={lightCenter + glint.off - glint.len / 2}
              y1={glint.y}
              x2={lightCenter + glint.off + glint.len / 2}
              y2={glint.y}
              opacity={glint.o}
              style={{
                animation: `waterShimmer ${glint.dur} ease-in-out infinite`,
                animationDelay: glint.del,
              }}
            />
          ))}
        </g>

        {/* Distant Crisp White Sailboat Gliding along distant left/mid-horizon */}
        <g transform="translate(370, 488)">
          <g style={{ animation: 'sailboatGlide 14s ease-in-out infinite' }}>
            {/* Subtle water reflection shadow */}
            <ellipse cx="14" cy="24" rx="14" ry="2" fill="#000000" opacity="0.3" />

            {/* Crisp Sleek Hull */}
            <path
              d="M 0,20 L 26,20 L 22,24 L 4,24 Z"
              fill={isNight ? '#cbd5e1' : '#ffffff'}
              stroke={isNight ? '#334155' : '#94a3b8'}
              strokeWidth="0.8"
            />

            {/* Slender Mast */}
            <line x1="15" y1="2" x2="15" y2="20" stroke={isNight ? '#94a3b8' : '#475569'} strokeWidth="1.2" />

            {/* Crisp White Main Sail */}
            <path
              d="M 15,3 L 25,17 L 15,17 Z"
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="0.5"
              opacity="0.95"
            />

            {/* Crisp White Jib Sail */}
            <path
              d="M 13,5 L 3,18 L 13,18 Z"
              fill="#f1f5f9"
              stroke="#cbd5e1"
              strokeWidth="0.5"
              opacity="0.88"
            />
          </g>
        </g>

        {/* Refined Rocky Headland & Coastal Lighthouse on the Left */}
        <g transform="translate(60, 440)">
          {/* Weathered rock cliff strata */}
          <polygon
            points="20,280 60,170 120,135 180,122 240,130 300,165 350,280"
            fill={rockDark}
          />
          <polygon
            points="60,170 110,145 170,135 220,140 270,175 220,230 110,240"
            fill={rockMid}
            opacity="0.85"
          />
          <path
            d="M 90,145 L 140,132 L 200,135 L 245,152"
            fill="none"
            stroke={isSunset ? '#f472b6' : isNight ? '#334155' : '#64748b'}
            strokeWidth="1.5"
            opacity="0.5"
          />

          {/* Lighthouse Tower on High Crag */}
          <g transform="translate(170, 32)">
            {/* Tapered stone tower */}
            <polygon
              points="14,90 36,90 32,15 18,15"
              fill={isNight ? '#cbd5e1' : '#f1f5f9'}
            />
            {/* Red accent bands */}
            <polygon points="15,70 35,70 34,52 16,52" fill="#ef4444" />
            <polygon points="17,34 33,34 32,22 18,22" fill="#ef4444" />

            {/* Observation Balcony Railing */}
            <rect x="12" y="12" width="26" height="3" fill="#1e293b" />
            <line x1="12" y1="9" x2="38" y2="9" stroke="#1e293b" strokeWidth="1" />

            {/* Lantern Room & Glass Housing */}
            <rect x="16" y="2" width="18" height="10" fill={showWarmLights ? '#fef08a' : '#94a3b8'} />
            <polygon points="14,2 25,-7 36,2" fill="#0f172a" />

            {/* Rotating Light Beam (Pinned strictly to lantern bulb at cx:25 cy:7) */}
            {showWarmLights && (
              <g
                style={{
                  transformOrigin: '25px 7px',
                  animation: 'lighthouseSweep 7s ease-in-out infinite',
                }}
              >
                <polygon
                  points="25,7 500,-65 500,80"
                  fill="url(#lighthouseBeamGrad)"
                  opacity="0.8"
                />
              </g>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
};

// 3. MOUNTAINS SCENERY
const MountainsLandscape: React.FC<{
  isNight: boolean;
  isSunset: boolean;
  showWarmLights: boolean;
  treesEnabled: boolean;
}> = ({ isNight, isSunset, showWarmLights, treesEnabled }) => {
  const peakFar = isNight ? '#131e36' : isSunset ? '#582b4a' : '#5b6b80';
  const peakMid = isNight ? '#0e1627' : isSunset ? '#411e37' : '#475569';
  const peakNear = isNight ? '#080d17' : isSunset ? '#2a1223' : '#334155';
  const snowCap = isNight ? '#334155' : isSunset ? '#fed7aa' : '#ffffff';

  return (
    <div className="absolute inset-0 w-full h-full">
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        className="w-full h-full absolute inset-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Distant Alpine Peaks (Atmospheric Perspective) */}
        <polygon points="-40,650 220,380 480,650" fill={peakFar} opacity="0.7" />
        <polygon points="180,650 540,320 860,650" fill={peakFar} opacity="0.8" />
        <polygon points="680,650 980,360 1320,650" fill={peakFar} opacity="0.7" />

        {/* Far Peak Snowcaps */}
        <polygon points="500,358 540,320 575,355 558,348 540,356 522,347" fill={snowCap} opacity="0.75" />
        <polygon points="950,395 980,360 1010,395 995,388 980,396 965,388" fill={snowCap} opacity="0.75" />

        {/* Drifting Valley Mist Layer 1 */}
        <path
          d="M0,520 Q 360,490 720,530 T 1440,510 L 1440,570 L 0,570 Z"
          fill={isSunset ? '#9d4edd' : '#ffffff'}
          opacity="0.25"
        />

        {/* Mid-range Alpine Ridges */}
        <polygon points="0,720 320,440 680,720" fill={peakMid} />
        <polygon points="460,720 880,420 1260,720" fill={peakMid} />
        <polygon points="1020,720 1320,480 1500,720" fill={peakMid} />

        {/* Mid Peak Snowcaps */}
        <polygon points="840,460 880,420 920,460 900,450 880,462 860,450" fill={snowCap} opacity="0.85" />
        <polygon points="290,478 320,440 350,478 335,468 320,480 305,468" fill={snowCap} opacity="0.85" />

        {/* Drifting Valley Mist Layer 2 */}
        <path
          d="M0,600 Q 400,560 800,610 T 1440,590 L 1440,650 L 0,650 Z"
          fill={isSunset ? '#f472b6' : '#f1f5f9'}
          opacity="0.2"
        />

        {/* Foreground Pine Slopes */}
        <polygon points="-60,850 260,560 740,850" fill={peakNear} />
        <polygon points="620,850 1100,540 1520,850" fill={peakNear} />

        {/* Pine Silhouettes along slopes */}
        {treesEnabled && (
          <g fill={isNight ? '#030509' : isSunset ? '#1a0b16' : '#1e293b'}>
            <polygon points="230,570 240,540 250,570" />
            <polygon points="245,580 258,545 270,580" />
            <polygon points="275,595 290,555 305,595" />
            <polygon points="320,620 335,575 350,620" />
            <polygon points="1060,560 1075,525 1090,560" />
            <polygon points="1085,570 1100,535 1115,570" />
            <polygon points="1120,590 1135,550 1150,590" />
          </g>
        )}
      </svg>
    </div>
  );
};

// 4. CITY SCENERY (Aesthetic Lo-fi Skyline with Water Towers & Glowing Window Grids)
const CityLandscape: React.FC<{
  isNight: boolean;
  isSunset: boolean;
  showWarmLights: boolean;
}> = ({ isNight, isSunset, showWarmLights }) => {
  const bldgFar = isNight ? '#0f172a' : isSunset ? '#4c2e42' : '#64748b';
  const bldgMid = isNight ? '#0b1120' : isSunset ? '#3a2032' : '#475569';
  const bldgNear = isNight ? '#060a14' : isSunset ? '#261320' : '#334155';

  const windowColor = showWarmLights ? '#fbbf24' : '#94a3b8';
  const windowOpacity = showWarmLights ? '0.9' : '0.25';

  return (
    <div className="absolute inset-0 w-full h-full">
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        className="w-full h-full absolute inset-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Layer 1: Distant Towers & Spires */}
        <g fill={bldgFar} opacity="0.75">
          <rect x="180" y="380" width="85" height="380" />
          <polygon points="222,290 220,380 225,380" stroke={bldgFar} strokeWidth="3" />
          <rect x="340" y="420" width="95" height="340" />
          <rect x="520" y="340" width="110" height="420" />
          <polygon points="575,250 573,340 577,340" stroke={bldgFar} strokeWidth="4" />
          <rect x="760" y="390" width="90" height="370" />
          <rect x="940" y="360" width="120" height="400" />
          <rect x="1140" y="410" width="100" height="350" />
        </g>

        {/* Layer 2: Mid-distance lo-fi architectural buildings */}
        <g fill={bldgMid}>
          <rect x="80" y="460" width="120" height="360" />
          <rect x="250" y="440" width="140" height="380" />
          {/* Water Tower seated squarely on roof of bldg 2 */}
          <g transform="translate(305, 408)">
            {/* Legs */}
            <line x1="6" y1="32" x2="10" y2="12" stroke="#1e293b" strokeWidth="2" />
            <line x1="26" y1="32" x2="22" y2="12" stroke="#1e293b" strokeWidth="2" />
            <line x1="16" y1="32" x2="16" y2="12" stroke="#1e293b" strokeWidth="1.5" />
            {/* Cross brace */}
            <line x1="7" y1="28" x2="25" y2="16" stroke="#1e293b" strokeWidth="1" />
            <line x1="25" y1="28" x2="7" y2="16" stroke="#1e293b" strokeWidth="1" />
            {/* Tank */}
            <rect x="4" y="0" width="24" height="15" rx="1" fill="#78350f" />
            <polygon points="2,0 16,-6 30,0" fill="#451a03" />
          </g>

          <rect x="440" y="480" width="130" height="340" />
          <rect x="660" y="430" width="160" height="390" />
          {/* Rooftop HVAC and antenna */}
          <rect x="700" y="415" width="25" height="15" fill="#1e293b" />
          <line x1="780" y1="430" x2="780" y2="385" stroke="#64748b" strokeWidth="1.5" />
          {/* Stationary Red Aviation Warning Light (Opacity-only pulse, zero transform/scale) */}
          <circle
            cx="780"
            cy="385"
            r="2.5"
            fill="#ef4444"
            opacity="0.9"
            style={{ animation: 'beaconPulse 2.5s ease-in-out infinite' }}
          />

          <rect x="870" y="470" width="130" height="350" />
          <rect x="1050" y="450" width="150" height="370" />
          {/* Water tower on bldg 6 */}
          <g transform="translate(1110, 418)">
            <line x1="6" y1="32" x2="10" y2="12" stroke="#1e293b" strokeWidth="2" />
            <line x1="26" y1="32" x2="22" y2="12" stroke="#1e293b" strokeWidth="2" />
            <rect x="4" y="0" width="24" height="15" rx="1" fill="#78350f" />
            <polygon points="2,0 16,-6 30,0" fill="#451a03" />
          </g>
          <rect x="1240" y="490" width="140" height="330" />
        </g>

        {/* Layer 3: Foreground lo-fi buildings with aligned window grids */}
        <g fill={bldgNear}>
          <rect x="0" y="550" width="130" height="350" />
          <rect x="170" y="530" width="160" height="370" />
          <rect x="380" y="560" width="180" height="340" />
          <rect x="600" y="520" width="170" height="380" />
          <rect x="820" y="550" width="150" height="350" />
          <rect x="1010" y="530" width="190" height="370" />
          <rect x="1230" y="570" width="210" height="330" />
        </g>

        {/* Aligned Window Grids (lighting up warm amber during sunset/rain/thunder/night) */}
        <g fill={windowColor} opacity={windowOpacity}>
          {/* Building at 170 */}
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => (
              <rect
                key={`b1-${row}-${col}`}
                x={195 + col * 28}
                y={555 + row * 38}
                width="14"
                height="18"
                rx="1"
              />
            ))
          )}

          {/* Building at 380 */}
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 5 }).map((_, col) => (
              <rect
                key={`b2-${row}-${col}`}
                x={405 + col * 28}
                y={585 + row * 38}
                width="14"
                height="18"
                rx="1"
              />
            ))
          )}

          {/* Building at 600 */}
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => (
              <rect
                key={`b3-${row}-${col}`}
                x={630 + col * 32}
                y={545 + row * 40}
                width="16"
                height="20"
                rx="1"
              />
            ))
          )}

          {/* Building at 1010 */}
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 5 }).map((_, col) => (
              <rect
                key={`b4-${row}-${col}`}
                x={1035 + col * 30}
                y={555 + row * 38}
                width="14"
                height="18"
                rx="1"
              />
            ))
          )}
        </g>
      </svg>
    </div>
  );
};

// MULTI-LAYERED FALLING RAIN
// Deterministic drops to avoid re-randomization jumps on re-renders
const BG_RAIN_DROPS = Array.from({ length: 65 }).map((_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const rnd = seed / 233280;
  const left = `${(i * 100) / 65 + (rnd * 4 - 2)}%`;
  const duration = 0.8 + rnd * 0.4;
  const delay = -((i * 0.17) % 2.5);
  const height = 32 + rnd * 26;
  const opacity = 0.22 + rnd * 0.25;
  return { left, duration, delay, height, opacity };
});

const FG_RAIN_DROPS = Array.from({ length: 55 }).map((_, i) => {
  const seed = ((i + 77) * 9301 + 49297) % 233280;
  const rnd = seed / 233280;
  const left = `${(i * 100) / 55 + (rnd * 4 - 2)}%`;
  const duration = 0.5 + rnd * 0.3;
  const delay = -((i * 0.23) % 2);
  const height = 48 + rnd * 36;
  const opacity = 0.45 + rnd * 0.35;
  return { left, duration, delay, height, opacity };
});

const RainParticles: React.FC<{ heavy: boolean }> = ({ heavy }) => {
  return (
    <div
      className="rain-container rain-particles absolute -inset-[25%] pointer-events-none overflow-hidden z-20 origin-center"
      style={{ transform: 'rotate(11deg)' }}
    >
      {/* Layer 1: Background Softer, Finer Rain */}
      {BG_RAIN_DROPS.slice(0, heavy ? 65 : 40).map((drop, i) => (
        <div
          key={`bg-rain-${i}`}
          className="absolute top-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-100/50 to-blue-200/70"
          style={{
            left: drop.left,
            height: `${heavy ? drop.height * 1.3 : drop.height}px`,
            opacity: heavy ? drop.opacity * 1.2 : drop.opacity,
            animation: `smoothRainFall ${heavy ? drop.duration * 0.8 : drop.duration}s linear infinite`,
            animationDelay: `${drop.delay}s`,
          }}
        />
      ))}

      {/* Layer 2: Foreground Faster, Crisper Rain */}
      {FG_RAIN_DROPS.slice(0, heavy ? 55 : 32).map((drop, i) => (
        <div
          key={`fg-rain-${i}`}
          className="absolute top-0 w-[1.5px] bg-gradient-to-b from-transparent via-cyan-50/80 to-blue-100/90"
          style={{
            left: drop.left,
            height: `${heavy ? drop.height * 1.3 : drop.height}px`,
            opacity: heavy ? drop.opacity * 1.2 : drop.opacity,
            animation: `smoothRainFall ${heavy ? drop.duration * 0.8 : drop.duration}s linear infinite`,
            animationDelay: `${drop.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// FALLING SNOW PARTICLES (Deterministic Mulberry32 PRNG for uniform non-correlated full-screen dispersion)
interface SnowFlakeConfig {
  left: string;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  animName: string;
}

const SNOW_FLAKES: SnowFlakeConfig[] = (() => {
  let s = 1847192;
  const rnd = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const flakes: SnowFlakeConfig[] = [];
  for (let i = 0; i < 72; i++) {
    const left = `${(rnd() * 100).toFixed(2)}%`;
    const size = parseFloat((2.0 + rnd() * 3.0).toFixed(1)); // 2.0px to 5.0px
    const opacity = parseFloat((0.5 + rnd() * 0.4).toFixed(2)); // 0.5 to 0.9
    const duration = parseFloat((8.0 + rnd() * 8.0).toFixed(1)); // 8.0s to 16.0s
    const delay = parseFloat((-(rnd() * 15.0)).toFixed(1)); // -15.0s to 0.0s (already falling across full screen)
    const animName = i % 2 === 0 ? 'snowFallA' : 'snowFallB';
    flakes.push({ left, size, opacity, duration, delay, animName });
  }
  return flakes;
})();

const SnowParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-15">
      {SNOW_FLAKES.map((flake, i) => (
        <div
          key={`snow-${i}`}
          className="absolute top-0 rounded-full bg-white shadow-[0_0_3px_rgba(255,255,255,0.7)] pointer-events-none"
          style={{
            left: flake.left,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `${flake.animName} ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// DRIFTING LEAVES (Deterministic)
const DRIFTING_LEAVES_DATA = Array.from({ length: 8 }).map((_, i) => {
  const duration = 9.5 + ((i * 1.8) % 6);
  const delay = -(i * 1.7);
  const top = `${8 + ((i * 11) % 45)}%`;
  return { duration, delay, top };
});

const DriftingLeaves: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {DRIFTING_LEAVES_DATA.map((leaf, i) => (
        <div
          key={i}
          className="absolute left-[-20px] pointer-events-none"
          style={{
            top: leaf.top,
            animation: `leafDrift ${leaf.duration}s ease-in-out infinite`,
            animationDelay: `${leaf.delay}s`,
          }}
        >
          <svg width="22" height="14" viewBox="0 0 22 14" fill="#d97706" opacity="0.75">
            <path d="M0,7 C 6,0 16,0 22,7 C 16,14 6,14 0,7 Z" />
            <line x1="2" y1="7" x2="20" y2="7" stroke="#78350f" strokeWidth="0.8" />
          </svg>
        </div>
      ))}
    </div>
  );
};

