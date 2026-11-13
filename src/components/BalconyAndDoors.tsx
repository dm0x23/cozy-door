import React from 'react';
import { useStore } from '@nanostores/react';
import {
  timeOfDayStore,
  weatherStore,
  elementsStore,
} from '../stores/appStore';

export const BalconyAndDoors: React.FC = () => {
  const timeOfDay = useStore(timeOfDayStore);
  const weather = useStore(weatherStore);
  const elements = useStore(elementsStore);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';
  const isRainyOrThunder = weather === 'rainy' || weather === 'thunder';
  const isSnowy = weather === 'snowy';
  const lightsGlow = isNight || isSunset || weather === 'thunder';

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-10 overflow-hidden">
      {/* =========================================================================
          1. OUTDOOR BALCONY OVERHANG & STRING LIGHTS (Z-10)
          ========================================================================= */}
      {/* Upper Balcony Roof / Cedar Overhang */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#1a1c23] to-[#262833] border-b border-black/50 shadow-md flex items-center px-4">
        <div className="w-full h-1 bg-[#373946] rounded-full opacity-40" />
      </div>

      {/* String Lights across upper overhang (Toggleable) */}
      {elements.stringLights && (
        <div className="absolute top-6 left-0 right-0 h-14 pointer-events-none z-15 overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 50">
            {/* Hanging wire */}
            <path
              d="M0,8 Q 250,34 500,10 Q 750,34 1000,8"
              fill="none"
              stroke="#2c303c"
              strokeWidth="1.8"
            />
            {/* Bulbs positioned along catenary curve */}
            {[
              { cx: 70, cy: 15 },
              { cx: 160, cy: 23 },
              { cx: 250, cy: 28 },
              { cx: 350, cy: 24 },
              { cx: 450, cy: 16 },
              { cx: 550, cy: 16 },
              { cx: 650, cy: 24 },
              { cx: 750, cy: 28 },
              { cx: 840, cy: 23 },
              { cx: 930, cy: 15 },
            ].map((bulb, idx) => (
              <g key={idx}>
                {/* Socket */}
                <rect x={bulb.cx - 2.5} y={bulb.cy - 5} width="5" height="5" fill="#1e222d" rx="1" />
                {/* Bulb glow & filament */}
                <circle
                  cx={bulb.cx}
                  cy={bulb.cy + 3}
                  r="5"
                  fill={lightsGlow ? '#fde047' : '#e2e8f0'}
                  opacity={lightsGlow ? '0.95' : '0.4'}
                  style={lightsGlow ? { animation: 'stringLightGlow 4s ease-in-out infinite', animationDelay: `${idx * 0.3}s` } : {}}
                />
                {lightsGlow && (
                  <circle
                    cx={bulb.cx}
                    cy={bulb.cy + 3}
                    r="12"
                    fill="#fbbf24"
                    opacity="0.25"
                  />
                )}
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* =========================================================================
          2. BALCONY PATIO DECK & RAILING (Outdoor Mid-ground)
          ========================================================================= */}
      {/* Balcony Railing: Sleek wrought-iron / glass rail horizontally across lower third */}
      <div className="absolute left-0 right-0 bottom-16 md:bottom-20 h-24 pointer-events-none z-10 flex flex-col justify-end">
        {/* Snow Dusting on Railing Cap */}
        {isSnowy && (
          <div className="w-full h-2 bg-gradient-to-r from-white/90 via-slate-100 to-white/90 rounded-full shadow-[0_2px_4px_rgba(255,255,255,0.4)]" />
        )}

        {/* Top Handrail */}
        <div className="w-full h-3.5 bg-gradient-to-r from-[#2a2c35] via-[#3a3d4a] to-[#2a2c35] border-y border-black/60 shadow-lg" />

        {/* Vertical Balusters / Sleek Posts */}
        <div className="w-full h-20 bg-gradient-to-b from-black/20 to-black/40 flex justify-between px-8 relative">
          {/* Glass Balustrade Panel Sheen */}
          <div className="absolute inset-x-8 inset-y-1 bg-white/[0.03] backdrop-blur-[0.5px] border-t border-white/10" />

          {/* Posts */}
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-full bg-gradient-to-r from-[#20222b] via-[#353844] to-[#1a1b22] shadow-sm z-10"
            />
          ))}
        </div>

        {/* Bottom Rail Base */}
        <div className="w-full h-2 bg-[#1f2129] border-t border-black/40" />
      </div>

      {/* =========================================================================
          2b. PROPERLY SCALED PATIO SIDE TABLE & STEAMING CERAMIC MUG
          Positioned right-[26%] bottom-8, width ~90px, height ~65px, mug ~28px x 26px
          ========================================================================= */}
      {elements.patioMug && (
        <div className="absolute right-[26%] bottom-8 z-14 pointer-events-none transition-transform duration-300">
          <svg width="96" height="80" viewBox="0 0 96 80">
            <defs>
              <linearGradient id="woodTableTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8d4925" />
                <stop offset="50%" stopColor="#713619" />
                <stop offset="100%" stopColor="#53240f" />
              </linearGradient>
              <linearGradient id="ceramicMugGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="65%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>

            {/* Table Shadow on Patio Deck */}
            <ellipse cx="48" cy="74" rx="42" ry="6" fill="#000000" opacity="0.35" />

            {/* Mid-Century Angled Legs */}
            {/* Back Legs */}
            <line x1="28" y1="46" x2="18" y2="74" stroke="#2c140a" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="68" y1="46" x2="78" y2="74" stroke="#2c140a" strokeWidth="4.5" strokeLinecap="round" />
            {/* Cross Stretcher */}
            <line x1="23" y1="62" x2="73" y2="62" stroke="#220e06" strokeWidth="3" strokeLinecap="round" />
            {/* Front Center Legs */}
            <line x1="48" y1="48" x2="48" y2="75" stroke="#3b1b0d" strokeWidth="4.5" strokeLinecap="round" />

            {/* Table Top Surface (width ~90px) */}
            {/* Table Bevel Edge */}
            <ellipse cx="48" cy="46" rx="44" ry="12" fill="#3b1a0c" stroke="#220f06" strokeWidth="1.5" />
            {/* Table Main Surface */}
            <ellipse cx="48" cy="44" rx="43" ry="11" fill="url(#woodTableTopGrad)" />
            {/* Subtle Woodgrain Rim Highlight */}
            <ellipse cx="48" cy="43.5" rx="41" ry="9.5" fill="none" stroke="#a75d32" strokeWidth="1" opacity="0.6" />

            {/* Generously Sized Artisanal Ceramic Mug (width ~28px, height ~26px) at (34, 18) */}
            <g transform="translate(34, 18)">
              {/* Mug Drop Shadow on Table */}
              <ellipse cx="14" cy="27" rx="14" ry="4" fill="#000000" opacity="0.3" />

              {/* Mug Handle */}
              <path
                d="M 23,8 C 31,8 31,21 23,21"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M 23,9 C 29,9 29,20 23,20"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* Mug Body */}
              <rect x="3" y="6" width="22" height="19" rx="4" fill="url(#ceramicMugGrad)" stroke="#94a3b8" strokeWidth="1" />
              <path d="M 3,21 Q 14,26 25,21 L 25,22 Q 14,27 3,22 Z" fill="#64748b" opacity="0.4" />

              {/* Mug Rim & Hot Coffee / Tea */}
              <ellipse cx="14" cy="6" rx="11" ry="3.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
              {/* Coffee Liquid */}
              <ellipse cx="14" cy="6" rx="9" ry="2.5" fill="#2d1204" />
              {/* Crema / Warm highlight */}
              <ellipse cx="15" cy="5.5" rx="7" ry="1.5" fill="#582a0e" opacity="0.8" />
              <ellipse cx="13" cy="5.2" rx="4" ry="0.8" fill="#a16207" opacity="0.5" />

              {/* Soft Curling Steam Wisps rising smoothly */}
              <g className="opacity-75">
                <path
                  d="M 9,2 Q 6,-8 11,-16 Q 16,-24 12,-32"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  style={{ animation: 'steamWisp 3.2s ease-out infinite' }}
                />
                <path
                  d="M 16,1 Q 20,-7 15,-17 Q 11,-26 17,-35"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  style={{ animation: 'steamWisp 3.8s ease-out infinite', animationDelay: '1.4s' }}
                />
              </g>
            </g>
          </svg>
        </div>
      )}

      {/* =========================================================================
          3. FLOOR-TO-CEILING SLIDING GLASS PATIO DOORS (Full Bleed View)
          ========================================================================= */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-15 flex">
        {/* Left Sliding Glass Pane */}
        <div className="relative flex-1 h-full glass-pane border-r-[7px] border-[#22242b] shadow-2xl">
          {/* Glass reflection sheen */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              background:
                isNight
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 45%, rgba(255,255,255,0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(255,255,255,0.06) 80%)',
            }}
          />

          {/* Rain streaks and water droplets running down left pane */}
          {isRainyOrThunder && <RainGlassCondensation pane="left" />}
        </div>

        {/* Center Vertical Overlap Stile & Sleek Brushed Handle */}
        <div className="w-5 h-full bg-gradient-to-r from-[#17191f] via-[#2d303b] to-[#17191f] border-x border-black/70 flex items-center justify-center relative shadow-2xl z-20">
          {/* Sleek Vertical Door Handle */}
          <div className="w-2.5 h-36 bg-gradient-to-b from-[#94a3b8] via-[#e2e8f0] to-[#64748b] rounded-full shadow-lg border border-black/30 flex flex-col justify-between py-2">
            <div className="w-full h-1 bg-black/30 rounded-full" />
            <div className="w-full h-1 bg-black/30 rounded-full" />
          </div>
        </div>

        {/* Right Sliding Glass Pane */}
        <div className="relative flex-1 h-full glass-pane border-l-[7px] border-[#22242b] shadow-2xl">
          {/* Glass reflection sheen */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              background:
                isNight
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 55%, rgba(255,255,255,0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 50%, rgba(255,255,255,0.05) 85%)',
            }}
          />

          {/* Rain streaks and water droplets running down right pane */}
          {isRainyOrThunder && <RainGlassCondensation pane="right" />}
        </div>

        {/* Outer Door Frame: Top Header Track & Far Left / Right Stiles */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#15171d] to-[#252832] border-b border-black/80 z-20" />
        <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-[#15171d] to-[#252832] border-r border-black/80 z-20" />
        <div className="absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-l from-[#15171d] to-[#252832] border-l border-black/80 z-20" />
        <div className="absolute bottom-8 left-0 right-0 h-3 bg-gradient-to-t from-[#15171d] via-[#2a2d38] to-[#15171d] border-t border-black/80 z-20">
          {/* Sliding track groove */}
          <div className="w-full h-0.5 bg-black/60 my-1" />
        </div>
      </div>

      {/* =========================================================================
          4. SOFT PLEATED SHEER CURTAINS (Left & Right framing)
          ========================================================================= */}
      {/* Far Left Sheer Curtain */}
      <div className="absolute top-0 bottom-8 left-0 w-16 md:w-28 pointer-events-none z-22 opacity-75">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 800">
          <defs>
            <linearGradient id="curtainGradLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.8" />
              <stop offset="25%" stopColor="#cbd5e1" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="75%" stopColor="#94a3b8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="800" fill="url(#curtainGradLeft)" />
        </svg>
      </div>

      {/* Far Right Sheer Curtain */}
      <div className="absolute top-0 bottom-8 right-0 w-16 md:w-28 pointer-events-none z-22 opacity-75">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 800">
          <defs>
            <linearGradient id="curtainGradRight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#94a3b8" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="75%" stopColor="#cbd5e1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="800" fill="url(#curtainGradRight)" />
        </svg>
      </div>

      {/* =========================================================================
          5. INTERIOR FLOOR STRIP (h-8 Warm Hardwood along bottom)
          ========================================================================= */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-[#2c1d11] via-[#432818] to-[#2c1d11] border-t-2 border-[#1c120a] z-25 flex items-center shadow-[0_-6px_20px_rgba(0,0,0,0.6)]">
        {/* Wood planks separation lines */}
        <div className="w-full h-full flex justify-between px-6 opacity-35">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-[1.5px] h-full bg-[#170e06]" />
          ))}
        </div>
      </div>

      {/* =========================================================================
          6. TOGGLEABLE INDOOR PROPS (Floor Plant & Sleeping Dog)
          ========================================================================= */}
      {/* Floor Plant (left-10 md:left-14 bottom-8): Tall indoor fiddle-leaf fig in ceramic planter */}
      {elements.plant && (
        <div className="absolute left-10 md:left-14 bottom-8 z-26 pointer-events-none transition-transform duration-300">
          <svg width="110" height="190" viewBox="0 0 110 190">
            {/* Ceramic Floor Planter */}
            <polygon points="32,190 78,190 85,135 25,135" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Pot Rim & Soil */}
            <ellipse cx="55" cy="135" rx="30" ry="6" fill="#3e2723" />
            <ellipse cx="55" cy="133" rx="30" ry="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Main Plant Stems */}
            <path d="M55,135 Q 52,90 45,55" fill="none" stroke="#2e7d32" strokeWidth="4" strokeLinecap="round" />
            <path d="M55,135 Q 64,85 75,40" fill="none" stroke="#388e3c" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M50,95 Q 30,75 18,50" fill="none" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round" />
            <path d="M58,80 Q 75,65 92,55" fill="none" stroke="#388e3c" strokeWidth="3" strokeLinecap="round" />

            {/* Broad Lush Leaves */}
            <path
              d="M45,55 C 20,40 15,10 40,8 C 60,6 60,35 45,55 Z"
              fill="#1b5e20"
              stroke="#2e7d32"
              strokeWidth="1.5"
            />
            <path
              d="M75,40 C 95,25 105,5 85,5 C 65,5 60,25 75,40 Z"
              fill="#2e7d32"
              stroke="#388e3c"
              strokeWidth="1.5"
            />
            <path
              d="M18,50 C 0,45 -2,22 15,25 C 30,28 30,42 18,50 Z"
              fill="#1b5e20"
              opacity="0.95"
            />
            <path
              d="M92,55 C 110,50 112,28 98,28 C 82,28 80,45 92,55 Z"
              fill="#2e7d32"
              opacity="0.95"
            />
            <path
              d="M52,70 C 40,55 45,35 55,35 C 65,35 68,55 52,70 Z"
              fill="#43a047"
            />
          </svg>
        </div>
      )}

      {/* =========================================================================
          6b. COZY SLEEPING DOG (left-[36%] bottom-6)
          No white plate! Curled peacefully on the warm hardwood floor with floppy ears,
          tucked paws, gentle breathing animation, and faint Zzz bubbles.
          Safely offset from center vertical door frame (left-1/2).
          ========================================================================= */}
      {elements.dog && (
        <div className="absolute left-[36%] bottom-6 z-26 pointer-events-none transition-transform duration-300">
          <div className="relative flex flex-col items-center">
            {/* Floating 'Zzz' animation */}
            <div className="absolute -top-7 right-6 text-xs font-semibold text-amber-200/90 tracking-widest pointer-events-none select-none flex space-x-1">
              <span style={{ animation: 'floatZzz 3.2s ease-out infinite' }}>z</span>
              <span style={{ animation: 'floatZzz 3.2s ease-out infinite', animationDelay: '1s' }}>z</span>
              <span style={{ animation: 'floatZzz 3.2s ease-out infinite', animationDelay: '2s' }}>z</span>
            </div>

            {/* Cozy Sleeping Dog on subtle flat woven floor mat directly on the hardwood */}
            <svg width="130" height="72" viewBox="0 0 130 72">
              <defs>
                <linearGradient id="dogFurGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f3b562" />
                  <stop offset="45%" stopColor="#de9338" />
                  <stop offset="100%" stopColor="#b66e1b" />
                </linearGradient>
                <linearGradient id="dogBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fde6b8" />
                  <stop offset="100%" stopColor="#f1c784" />
                </linearGradient>
                <linearGradient id="wovenMatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#25272e" />
                  <stop offset="50%" stopColor="#31343e" />
                  <stop offset="100%" stopColor="#25272e" />
                </linearGradient>
              </defs>

              {/* Subtle Flat Rectangular Woven Floor Mat (Dark Charcoal with warm terracotta stitched border) */}
              <rect x="8" y="52" width="114" height="15" rx="3" fill="url(#wovenMatGrad)" stroke="#8c4a30" strokeWidth="1" opacity="0.85" />
              {/* Mat woven texture lines */}
              <g stroke="#ffffff" strokeWidth="0.5" opacity="0.12">
                <line x1="20" y1="52" x2="20" y2="67" />
                <line x1="38" y1="52" x2="38" y2="67" />
                <line x1="56" y1="52" x2="56" y2="67" />
                <line x1="74" y1="52" x2="74" y2="67" />
                <line x1="92" y1="52" x2="92" y2="67" />
                <line x1="110" y1="52" x2="110" y2="67" />
              </g>

              {/* Curled Sleeping Dog with gentle breathing animation */}
              <g style={{ transformOrigin: '65px 44px', animation: 'breathing 3.8s ease-in-out infinite' }}>
                {/* Dog Shadow */}
                <ellipse cx="65" cy="57" rx="46" ry="10" fill="#000000" opacity="0.32" />

                {/* Fluffy wrapped tail with lighter tip */}
                <path
                  d="M 102,46 C 114,44 116,33 108,28 C 100,24 92,29 95,35"
                  fill="none"
                  stroke="#c97c23"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                />
                <circle cx="108" cy="28.5" r="4.2" fill="#fde6b8" />

                {/* Curled Dog Torso */}
                <ellipse cx="68" cy="42" rx="34" ry="18" fill="url(#dogFurGrad)" />

                {/* Soft lighter chest & belly fur */}
                <ellipse cx="68" cy="45" rx="22" ry="10" fill="url(#dogBellyGrad)" />

                {/* Fur texture shading on back */}
                <path d="M 58,28 Q 66,25 76,26 Q 86,28 92,33" fill="none" stroke="#ad6212" strokeWidth="2.5" strokeLinecap="round" />

                {/* Tucked Back Leg / Haunch */}
                <ellipse cx="88" cy="44" rx="14" ry="11" fill="#c77b22" />
                <ellipse cx="86" cy="45" rx="10" ry="7" fill="#df9539" />

                {/* Tucked Paws beneath muzzle */}
                <ellipse cx="46" cy="54" rx="6" ry="4" fill="#fde6b8" stroke="#c0731a" strokeWidth="1" />
                <ellipse cx="54" cy="54" rx="5.5" ry="3.8" fill="#fde6b8" stroke="#c0731a" strokeWidth="1" />

                {/* Peaceful Dog Head resting down */}
                <ellipse cx="44" cy="41" rx="15" ry="13" fill="#de9338" />
                {/* Muzzle */}
                <ellipse cx="34" cy="45" rx="9" ry="7" fill="#fde6b8" />

                {/* Cute black nose with specular highlight */}
                <ellipse cx="27" cy="43.5" rx="3" ry="2.2" fill="#1c1917" />
                <circle cx="26.2" cy="42.8" r="0.8" fill="#ffffff" />

                {/* Peaceful closed sleeping eye */}
                <path
                  d="M 36,39 Q 40,43 44,39"
                  fill="none"
                  stroke="#572803"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                {/* Floppy Golden Ear folded gently down */}
                <path
                  d="M 45,30 C 53,28 58,35 56,46 C 54,53 48,51 46,42 Z"
                  fill="#b46a15"
                  stroke="#8e4e08"
                  strokeWidth="1"
                />
                <path
                  d="M 47,33 C 51,32 54,37 53,44 C 51,48 48,46 47,40 Z"
                  fill="#de9338"
                />

                {/* Cozy Olive Collar with brass tag */}
                <path d="M 47,48 Q 50,52 54,49" fill="none" stroke="#365314" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="51" cy="52" r="1.8" fill="#eab308" />
              </g>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Enhanced Glass Condensation & Water Droplets (Requirement 4)
// =========================================================================
const RainGlassCondensation: React.FC<{ pane: 'left' | 'right' }> = ({ pane }) => {
  const streaks = pane === 'left' ? [14, 28, 46, 68, 86] : [12, 32, 54, 74, 90];
  const droplets = pane === 'left'
    ? [
        { x: 18, y: 15, r: 2.2 },
        { x: 26, y: 35, r: 1.6 },
        { x: 42, y: 22, r: 2.5 },
        { x: 58, y: 60, r: 1.8 },
        { x: 72, y: 40, r: 3.0 },
        { x: 82, y: 75, r: 2.0 },
        { x: 34, y: 80, r: 1.5 },
        { x: 64, y: 18, r: 2.4 },
        { x: 88, y: 30, r: 1.8 },
      ]
    : [
        { x: 15, y: 25, r: 2.0 },
        { x: 24, y: 70, r: 1.8 },
        { x: 38, y: 45, r: 2.8 },
        { x: 50, y: 20, r: 1.5 },
        { x: 68, y: 82, r: 2.2 },
        { x: 78, y: 35, r: 1.9 },
        { x: 86, y: 55, r: 3.1 },
        { x: 44, y: 65, r: 1.7 },
        { x: 60, y: 38, r: 2.3 },
      ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Sliding Slow Glass Drips */}
      {streaks.map((leftPercent, idx) => {
        const duration = 3.6 + idx * 0.6;
        const delay = idx * 0.8;
        return (
          <div
            key={`streak-${idx}`}
            className="absolute top-0 w-[1.5px] bg-gradient-to-b from-transparent via-white/35 to-cyan-100/50 rounded-full pointer-events-none"
            style={{
              left: `${leftPercent}%`,
              height: '75px',
              animation: `slowGlassDrip ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}

      {/* Clinging Glass Droplets with Specular Highlights */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {droplets.map((drop, idx) => (
          <g
            key={`drop-${idx}`}
            style={{ animation: `dropletGlisten ${3 + (idx % 3)}s ease-in-out infinite`, animationDelay: `${idx * 0.4}s` }}
          >
            {/* Soft droplet refraction shadow */}
            <circle cx={`${drop.x}%`} cy={`${drop.y}%`} r={drop.r} fill="rgba(0, 0, 0, 0.25)" />
            {/* Droplet water body */}
            <circle cx={`${drop.x}%`} cy={`${drop.y}%`} r={drop.r - 0.4} fill="rgba(255, 255, 255, 0.45)" />
            {/* Specular glisten */}
            <circle cx={`${drop.x - 0.3}%`} cy={`${drop.y - 0.3}%`} r={drop.r * 0.45} fill="#ffffff" opacity="0.9" />
          </g>
        ))}
      </svg>
    </div>
  );
};
