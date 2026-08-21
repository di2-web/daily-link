import React, { useState, useRef } from 'react';
import { RoomObject } from '../types';
import { RoomObjectImage } from './RoomObjectImage';
import {
  Sun,
  Sunset,
  Moon,
  Move,
  Sparkles,
  Archive,
  Pin,
  Maximize2,
} from 'lucide-react';

interface GameRoomCanvasProps {
  ownerProfile: {
    uid: string;
    displayName: string;
    username?: string;
    photoURL: string;
    bio?: string;
    statusText?: string;
    statusEmoji?: string;
  };
  isOwner: boolean;
  objects: RoomObject[];
  onSelectObject: (obj: RoomObject) => void;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  onUpdateObjectPosition?: (objectId: string, x: number, y: number) => Promise<void> | void;
  onOpenCloset?: () => void;
  hideControls?: boolean;
  compact?: boolean;
  specificDateFilter?: string; // Optional: when previewing a specific day in the past
}

/**
 * Automatically calculates appropriate visual scale and grounding shadow
 * based on item category, name, and emoji characteristics.
 */
export function calculateItemVisualSize(obj: RoomObject): {
  containerSize: string;
  shadowSize: string;
  badgeOffset: string;
} {
  const name = (obj.name || '').toLowerCase();
  const category = (obj.category || '').toLowerCase();
  const note = (obj.memoryNote || obj.caption || '').toLowerCase();
  const emoji = obj.iconEmoji || '';
  const text = `${name} ${category} ${note} ${emoji}`;

  // Small items (Drinks, Jewelry, Accessories, Stationery, Small Snacks, Candle, Phone)
  const isSmall =
    /コーヒー|お茶|カフェ|ラテ|マグ|カップ|指輪|アクセ|キー|鍵|クッキー|マカロン|ケーキ|パン|チョコ|お菓子|ペン|時計|イヤホン|スマホ|キャンドル|candle|coffee|tea|cup|latte|ring|key|snack|dessert|phone|drink/i.test(
      text
    );

  // Large items (Furniture, Bikes, Instruments, Big Electronics, Large Plants, Canvas)
  const isLarge =
    /ソファ|ベッド|机|デスク|自転車|バイク|車|テレビ|ギター|ピアノ|本棚|タンス|テント|テーブル|ドラム|家具|sofa|bed|bike|car|guitar|piano|shelf|tent|table/i.test(
      text
    );

  if (isSmall) {
    return {
      containerSize: 'w-12 h-12 sm:w-14 sm:h-14',
      shadowSize: 'w-10 sm:w-11 h-2',
      badgeOffset: '-top-1 -right-1',
    };
  }

  if (isLarge) {
    return {
      containerSize: 'w-20 h-20 sm:w-24 sm:h-24',
      shadowSize: 'w-18 sm:w-20 h-3.5',
      badgeOffset: '-top-2 -right-2',
    };
  }

  // Medium (Default for standard memories, plants, plushies, cameras, books, gifts, etc.)
  return {
    containerSize: 'w-16 h-16 sm:w-18 sm:h-18',
    shadowSize: 'w-14 sm:w-16 h-2.5',
    badgeOffset: '-top-1.5 -right-1.5',
  };
}

export const GameRoomCanvas: React.FC<GameRoomCanvasProps> = ({
  ownerProfile,
  isOwner,
  objects,
  onSelectObject,
  isEditMode = false,
  onToggleEditMode,
  onUpdateObjectPosition,
  onOpenCloset,
  hideControls = false,
  compact = false,
  specificDateFilter,
}) => {
  // Time of Day state: 'day' | 'sunset' | 'night'
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('sunset');
  const [avatarReaction, setAvatarReaction] = useState<string | null>(null);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [hoveredFurniture, setHoveredFurniture] = useState<string | null>(null);

  // Dragging state in edit mode
  const [draggingObjectId, setDraggingObjectId] = useState<string | null>(null);
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});
  const stageRef = useRef<HTMLDivElement>(null);

  // Current date for daily room cleanup: today's items + pinned items remain in room
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter visible objects
  // 1. Explicitly in closet or archived -> NEVER show in active room
  // 2. Specific date filter (for calendar day review) -> show items for that date
  // 3. Normal active room -> show items created today OR pinned items
  const activeRoomObjects = objects.filter((o) => {
    // A. Privacy filter
    if (!isOwner && (o.privacyScope === 'private' || o.isPrivate)) {
      return false;
    }

    // B. Explicit closet / archived items are strictly hidden from room
    if (o.areaType === 'closet' || (o as any).isArchived) {
      return false;
    }

    // C. Specific date review mode (from Calendar)
    if (specificDateFilter) {
      return o.date === specificDateFilter;
    }

    // D. Daily room cleanup rule: Today's items OR pinned items
    const isToday = o.date === todayStr || !o.date;
    const isPinnedOrFav = o.isPinned || (o as any).isFavorite;

    return isToday || isPinnedOrFav;
  });

  // Stored in closet count (items stored in closet or past unpinned items)
  const closetObjectsCount = objects.filter((o) => {
    const isToday = o.date === todayStr || !o.date;
    const isPinnedOrFav = o.isPinned || (o as any).isFavorite;
    return o.areaType === 'closet' || (o as any).isArchived || (!isToday && !isPinnedOrFav);
  }).length;

  // Avatar interactive tap
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const avatarQuotes = [
      '来てくれてありがとう！☕',
      'ゆっくり部屋を見ていってね🛋️',
      '今日もおつかれさま〜🍵',
      '新しい思い出を飾ったよ📸',
      'またいつでも遊びに来てね🌿',
      'クローゼットにも過去の思い出があるよ🚪',
    ];
    const quote = avatarQuotes[Math.floor(Math.random() * avatarQuotes.length)];
    setAvatarReaction(quote);
    setTimeout(() => setAvatarReaction(null), 3000);

    // Soft chime
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {}
  };

  // Drag handlers for objects in Edit Mode
  const handlePointerDown = (e: React.PointerEvent, objId: string, currentX: number, currentY: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setDraggingObjectId(objId);
    setDragPositions((prev) => ({
      ...prev,
      [objId]: { x: currentX, y: currentY },
    }));
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingObjectId || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(12, Math.min(88, Math.round(rawX)));
    const clampedY = Math.max(22, Math.min(88, Math.round(rawY)));

    setDragPositions((prev) => ({
      ...prev,
      [draggingObjectId]: { x: clampedX, y: clampedY },
    }));
  };

  const handlePointerUp = async () => {
    if (!draggingObjectId) return;
    const finalPos = dragPositions[draggingObjectId];
    const targetId = draggingObjectId;
    setDraggingObjectId(null);

    if (finalPos && onUpdateObjectPosition) {
      await onUpdateObjectPosition(targetId, finalPos.x, finalPos.y);
    }
  };

  // Lighting & Atmosphere Themes
  const envStyles = {
    day: {
      ceilingBg: 'bg-[#ebe4d8]',
      leftWall: 'from-[#fcf9f2] to-[#ede3d1]',
      rightWall: 'from-[#f5ece0] to-[#dfd3be]',
      cornerCrease: 'rgba(70, 45, 20, 0.15)',
      floorBase: 'bg-[#d2b896]',
      floorPlanks: 'rgba(100, 65, 30, 0.12)',
      rugBg: 'bg-[#6b7f6b]',
      rugBorder: 'border-[#4e634e]',
      windowSky: 'from-[#70b2f5] via-[#a3cdfa] to-[#d6e8fd]',
      sunbeam: 'from-amber-100/35 via-amber-200/15 to-transparent',
      woodTone: 'bg-[#bc9064] border-[#7d5028]',
      stageBorder: 'border-stone-300 shadow-stone-900/10',
    },
    sunset: {
      ceilingBg: 'bg-[#dfbeaa]',
      leftWall: 'from-[#fff5ea] to-[#e8c6ae]',
      rightWall: 'from-[#f5d9c3] to-[#d3ad93]',
      cornerCrease: 'rgba(80, 35, 15, 0.22)',
      floorBase: 'bg-[#c49873]',
      floorPlanks: 'rgba(85, 40, 15, 0.16)',
      rugBg: 'bg-[#7a5744]',
      rugBorder: 'border-[#5a3b2b]',
      windowSky: 'from-[#ea580c] via-[#f97316] to-[#fed7aa]',
      sunbeam: 'from-orange-300/40 via-amber-300/20 to-transparent',
      woodTone: 'bg-[#a36e43] border-[#663b19]',
      stageBorder: 'border-amber-800/40 shadow-amber-950/20',
    },
    night: {
      ceilingBg: 'bg-[#181324]',
      leftWall: 'from-[#2b243b] to-[#1c1628]',
      rightWall: 'from-[#241d32] to-[#151020]',
      cornerCrease: 'rgba(0, 0, 0, 0.5)',
      floorBase: 'bg-[#483730]',
      floorPlanks: 'rgba(20, 10, 10, 0.3)',
      rugBg: 'bg-[#313c4e]',
      rugBorder: 'border-[#1e2634]',
      windowSky: 'from-[#0b0f19] via-[#151c33] to-[#252f55]',
      sunbeam: 'from-indigo-300/15 via-indigo-400/8 to-transparent',
      woodTone: 'bg-[#3d2d25] border-[#221610]',
      stageBorder: 'border-indigo-950/80 shadow-indigo-950/40',
    },
  }[timeOfDay];

  return (
    <div
      id="isometric-room-stage"
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden shadow-2xl border-4 transition-all duration-700 select-none ${envStyles.ceilingBg} ${envStyles.stageBorder}`}
    >
      {/* ========================================================================= */}
      {/* 1. ROOM SHELL: SEAMLESS WALLS, CORNER, AND ISOMETRIC PARQUET FLOOR */}
      {/* ========================================================================= */}

      {/* Ceiling Ambient Light Gradient */}
      <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10" />

      {/* Pendant Lamp Hanging from Center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20">
        <div className="w-0.5 h-6 sm:h-8 bg-stone-700" />
        <div className="w-6 sm:w-8 h-2.5 rounded-t-full bg-amber-800 shadow-xs" />
        <div className="w-3 h-1.5 rounded-b-full bg-amber-200 shadow-md shadow-amber-300/60 -mt-0.5" />
      </div>

      {/* A. LEFT WALL (Harmonious 2.5D Slanted Plane) */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${envStyles.leftWall} transition-colors duration-700`}
        style={{
          clipPath: 'polygon(0 0, 50% 18%, 50% 64%, 0 80%)',
        }}
      >
        {/* Subtle vertical wood/wallpaper paneling */}
        <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,#000_20px,#000_21px)]" />

        {/* Elegant Arched Window on Left Wall */}
        <div
          className="absolute top-[16%] left-[8%] w-[25%] h-[48%] rounded-t-full bg-stone-900/90 p-1 border-2 border-[#b59270] shadow-md flex flex-col justify-between overflow-hidden"
          style={{
            transform: 'skewY(-13deg)',
          }}
        >
          {/* Outdoor Vista Sky */}
          <div
            className={`relative w-full h-full rounded-t-full bg-gradient-to-b ${envStyles.windowSky} overflow-hidden transition-all duration-700 flex items-center justify-center`}
          >
            {timeOfDay === 'day' && (
              <div className="absolute inset-0">
                <div className="absolute top-2 left-2 w-6 h-2 rounded-full bg-white/80 blur-[0.3px]" />
                <div className="absolute top-6 right-2 w-7 h-2.5 rounded-full bg-white/70 blur-[0.3px]" />
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-yellow-200/90 blur-xs" />
              </div>
            )}
            {timeOfDay === 'sunset' && (
              <div className="absolute inset-0">
                <div className="absolute bottom-1 inset-x-0 h-6 bg-gradient-to-t from-red-500/40 to-transparent" />
                <div className="absolute top-4 right-2 w-6 h-6 rounded-full bg-amber-200 blur-xs" />
              </div>
            )}
            {timeOfDay === 'night' && (
              <div className="absolute inset-0">
                <div className="absolute top-2 right-2 text-xs text-yellow-200">🌙</div>
                <div className="absolute top-5 left-3 text-[8px] text-white/90 animate-pulse">✨</div>
                <div className="absolute bottom-3 right-4 text-[7px] text-white/80">⭐</div>
              </div>
            )}

            {/* Window Pane Dividers */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-[#8b6140]/80 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#8b6140]/80 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* B. RIGHT WALL (Harmonious 2.5D Slanted Plane) */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${envStyles.rightWall} transition-colors duration-700`}
        style={{
          clipPath: 'polygon(50% 18%, 100% 0, 100% 80%, 50% 64%)',
        }}
      >
        {/* Subtle vertical texture */}
        <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,#000_20px,#000_21px)]" />

        {/* Aesthetic Framed Picture / Board on Right Wall */}
        <div
          className="absolute top-[16%] right-[12%] w-[20%] h-[36%] rounded-lg bg-amber-50/90 border-2 border-[#b59270] shadow-sm p-1 flex flex-col items-center justify-between"
          style={{
            transform: 'skewY(13deg)',
          }}
        >
          <div className="w-full h-full rounded bg-gradient-to-br from-amber-100 via-stone-100 to-rose-50 flex items-center justify-center text-sm shadow-inner">
            <span>🖼️</span>
          </div>
        </div>
      </div>

      {/* C. 3D CORNER CREASE SHADOW */}
      <div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 pointer-events-none z-10 opacity-70"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 64%, 0 64%)',
          background: `linear-gradient(90deg, transparent 0%, ${envStyles.cornerCrease} 50%, transparent 100%)`,
        }}
      />

      {/* D. ISOMETRIC FLOOR PLANE */}
      <div
        className={`absolute inset-0 ${envStyles.floorBase} transition-colors duration-700 shadow-inner`}
        style={{
          clipPath: 'polygon(0 80%, 50% 64%, 100% 80%, 100% 100%, 0 100%)',
        }}
      >
        {/* Isometric Parquet Planks */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(26deg, transparent, transparent 16px, ${envStyles.floorPlanks} 16px, ${envStyles.floorPlanks} 17px), repeating-linear-gradient(-26deg, transparent, transparent 16px, ${envStyles.floorPlanks} 16px, ${envStyles.floorPlanks} 17px)`,
          }}
        />

        {/* Sunlight Shadow Projection from Window */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${envStyles.sunbeam} pointer-events-none transition-all duration-700 blur-[0.5px]`}
          style={{
            clipPath: 'polygon(10% 78%, 36% 67%, 68% 86%, 32% 98%)',
          }}
        />

        {/* Cozy Woven Round Rug in Center */}
        <div
          className={`absolute bottom-[6%] left-1/2 -translate-x-1/2 w-[52%] h-[32%] rounded-[50%] ${envStyles.rugBg} border-2 ${envStyles.rugBorder} shadow-lg transition-colors duration-700 flex items-center justify-center opacity-90`}
        >
          <div className="w-[84%] h-[78%] rounded-[50%] border border-dashed border-white/30 flex items-center justify-center">
            <div className="w-[70%] h-[68%] rounded-[50%] bg-black/10 flex items-center justify-center">
              <span className="text-sm opacity-25 select-none">✨</span>
            </div>
          </div>
        </div>
      </div>

      {/* Baseboard Corner Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
        <line x1="0%" y1="80%" x2="50%" y2="64%" stroke="#69401f" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50%" y1="64%" x2="100%" y2="80%" stroke="#523014" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* ========================================================================= */}
      {/* 2. FURNITURE SPACES (Closet, Desk, Floating Shelves) */}
      {/* ========================================================================= */}

      {/* 🚪 FURNITURE A: WOODEN CLOSET (Corner Left) */}
      <div
        id="room-closet-furniture"
        onClick={() => onOpenCloset?.()}
        onMouseEnter={() => setHoveredFurniture('closet')}
        onMouseLeave={() => setHoveredFurniture(null)}
        style={{
          transform: 'skewY(-13deg)',
        }}
        className="absolute top-[42%] left-[4%] z-20 w-[18%] sm:w-[17%] h-[36%] cursor-pointer group select-none transition-transform hover:scale-105"
        title="クローゼットを開く（過去の思い出・片付けたアイテム）"
      >
        {/* Closet Ground Shadow */}
        <div className="absolute -bottom-1.5 inset-x-1 h-3 bg-stone-950/30 rounded-[50%] blur-[2px]" />

        {/* Closet Body */}
        <div className={`relative w-full h-full rounded-t-xl rounded-b-md ${envStyles.woodTone} border-2 shadow-xl flex flex-col justify-between p-1 overflow-hidden group-hover:ring-2 group-hover:ring-amber-400`}>
          {/* Top Crown */}
          <div className="w-full h-2 bg-amber-950/30 rounded-t-xs" />

          {/* Double Doors */}
          <div className="flex-1 flex gap-0.5 p-0.5">
            <div className="flex-1 rounded-xs bg-black/10 border border-white/10 flex items-center justify-end pr-1">
              <div className="w-1 h-2.5 rounded-full bg-amber-200 shadow-xs" />
            </div>
            <div className="flex-1 rounded-xs bg-black/10 border border-white/10 flex items-center justify-start pl-1">
              <div className="w-1 h-2.5 rounded-full bg-amber-200 shadow-xs" />
            </div>
          </div>

          {/* Bottom Drawer */}
          <div className="w-full h-2.5 bg-black/20 rounded-xs border-t border-white/10 flex items-center justify-center">
            <div className="w-4 h-0.5 bg-amber-200/70 rounded-full" />
          </div>

          {/* Closet Storage Badge (Number of stored items) */}
          {closetObjectsCount > 0 && (
            <div className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md border border-white animate-pulse">
              {closetObjectsCount}
            </div>
          )}
        </div>

        {/* Hover Tooltip */}
        {hoveredFurniture === 'closet' && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap shadow-lg border border-amber-400/40 z-30 pointer-events-none">
            🚪 クローゼット ({closetObjectsCount}個)
          </div>
        )}
      </div>

      {/* 🪵 FURNITURE B: FLOATING WALL SHELVES */}
      {/* Left Wall Shelf with Plant & Books */}
      <div
        style={{ transform: 'skewY(-13deg)' }}
        className="absolute top-[32%] left-[28%] z-15 w-[15%] h-1.5 bg-[#784c25] rounded-xs shadow-md border-b border-stone-900/40"
      >
        <span className="absolute -top-3.5 left-1 text-[11px] filter drop-shadow-xs">🪴</span>
        <span className="absolute -top-3 left-4 text-[9px]">📚</span>
      </div>

      {/* Right Wall Shelf with Candle & Radio */}
      <div
        style={{ transform: 'skewY(13deg)' }}
        className="absolute top-[32%] right-[28%] z-15 w-[15%] h-1.5 bg-[#693f1c] rounded-xs shadow-md border-b border-stone-900/40"
      >
        <span className="absolute -top-3.5 right-1.5 text-[11px] filter drop-shadow-xs">🕯️</span>
        <span className="absolute -top-3 right-4.5 text-[9px]">📻</span>
      </div>

      {/* 🪑 FURNITURE C: WORK DESK & CHAIR (Right Floor) */}
      <div
        style={{ transform: 'skewY(8deg)' }}
        className="absolute bottom-[20%] right-[7%] sm:right-[9%] z-20 w-[24%] sm:w-[22%] h-[19%] select-none pointer-events-none"
      >
        {/* Desk Ground Shadow */}
        <div className="absolute -bottom-1 inset-x-0 h-3 bg-stone-950/25 rounded-[50%] blur-[2px]" />

        {/* Desk Surface */}
        <div className={`relative w-full h-[38%] rounded-lg ${envStyles.woodTone} border-2 shadow-md flex items-center justify-between px-2`}>
          <span className="text-[11px] filter drop-shadow-xs">💻</span>
          <span className="text-[9px]">☕</span>
        </div>

        {/* Desk Legs */}
        <div className="flex justify-between px-1.5 -mt-0.5">
          <div className="w-1.5 h-6 bg-[#523014] rounded-b-xs shadow-xs" />
          <div className="w-1.5 h-6 bg-[#523014] rounded-b-xs shadow-xs" />
          <div className="w-1.5 h-6 bg-[#523014] rounded-b-xs shadow-xs" />
          <div className="w-1.5 h-6 bg-[#523014] rounded-b-xs shadow-xs" />
        </div>

        {/* Stool */}
        <div className="absolute -bottom-1 left-2 w-6 h-3.5 rounded-full bg-[#82542c] border border-[#4a2b10] shadow-xs" />
      </div>

      {/* ========================================================================= */}
      {/* 3. TIME OF DAY CONTROLS (Top Right Pill) */}
      {/* ========================================================================= */}
      {!hideControls && (
        <div className="absolute top-3 right-3 z-40 flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-md text-white">
          <button
            onClick={() => setTimeOfDay('day')}
            className={`p-1.5 rounded-full text-xs transition-all cursor-pointer ${
              timeOfDay === 'day' ? 'bg-amber-400 text-stone-900 shadow-xs scale-105 font-bold' : 'text-stone-300 hover:text-white'
            }`}
            title="昼（自然光）"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTimeOfDay('sunset')}
            className={`p-1.5 rounded-full text-xs transition-all cursor-pointer ${
              timeOfDay === 'sunset' ? 'bg-orange-500 text-white shadow-xs scale-105 font-bold' : 'text-stone-300 hover:text-white'
            }`}
            title="夕暮れ（オレンジの灯り）"
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTimeOfDay('night')}
            className={`p-1.5 rounded-full text-xs transition-all cursor-pointer ${
              timeOfDay === 'night' ? 'bg-indigo-600 text-yellow-200 shadow-xs scale-105 font-bold' : 'text-stone-300 hover:text-white'
            }`}
            title="夜（静かなナイトルーム）"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Left Closet Quick Access (If items exist in closet) */}
      {!hideControls && closetObjectsCount > 0 && onOpenCloset && (
        <button
          onClick={onOpenCloset}
          className="absolute top-3 left-3 z-40 flex items-center gap-1.5 bg-stone-900/85 hover:bg-stone-900 text-white backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-400/40 shadow-md text-[10px] font-bold cursor-pointer transition-all active:scale-95"
        >
          <Archive className="w-3 h-3 text-amber-300" />
          <span>クローゼット</span>
          <span className="bg-amber-500 text-stone-950 font-black px-1.5 py-0.2 rounded-full text-[9px]">
            {closetObjectsCount}
          </span>
        </button>
      )}

      {/* ========================================================================= */}
      {/* 4. EDIT MODE BANNER */}
      {/* ========================================================================= */}
      {isEditMode && (
        <div className="absolute top-3 inset-x-4 z-40 bg-stone-900/90 backdrop-blur-md text-white text-[11px] font-bold py-2 px-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-amber-400/40 animate-in fade-in">
          <span className="flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>アイテムをドラッグして机や床、好きな場所に配置できます</span>
          </span>
          {onToggleEditMode && (
            <button
              onClick={onToggleEditMode}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-2.5 py-0.8 rounded-xl text-[11px] cursor-pointer shadow-sm transition-all"
            >
              完了 ✓
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. 3D CHIBI AVATAR IN THE ROOM */}
      {/* ========================================================================= */}
      <div
        id="room-avatar-figure"
        onClick={handleAvatarClick}
        className="absolute bottom-[20%] left-[34%] -translate-x-1/2 z-25 cursor-pointer group flex flex-col items-center select-none"
      >
        {/* Avatar Speech Bubble */}
        <div className="relative mb-1.5 whitespace-nowrap transition-transform group-hover:scale-105">
          <div className="bg-white/95 backdrop-blur-md text-stone-900 border border-stone-200 shadow-md rounded-2xl px-2.5 py-1 text-[11px] font-bold flex items-center gap-1">
            <span className="text-xs">{ownerProfile.statusEmoji || '🌱'}</span>
            <span className="max-w-[130px] sm:max-w-[160px] truncate text-[11px]">
              {avatarReaction || ownerProfile.statusText || (isOwner ? 'わたしの部屋' : `${ownerProfile.displayName}の部屋`)}
            </span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-stone-200 transform rotate-45" />
          </div>
        </div>

        {/* 3D Chibi Figure */}
        <div className="relative flex flex-col items-center">
          <div className="relative w-12 sm:w-14 h-12 sm:h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-amber-100 ring-2 ring-amber-400/50 group-hover:ring-amber-500 transition-all">
            <img
              src={ownerProfile.photoURL}
              alt={ownerProfile.displayName}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Body */}
          <div className="relative -mt-1 w-8 sm:w-9 h-7 sm:h-8 rounded-b-xl bg-[#c49b72] border border-[#7a4f27] shadow-xs flex items-center justify-center">
            <span className="text-[9px] text-amber-950 font-bold">🧥</span>
          </div>
          {/* Shoes */}
          <div className="flex gap-1 -mt-0.5">
            <div className="w-2.5 h-1.5 bg-[#4a2e16] rounded-full" />
            <div className="w-2.5 h-1.5 bg-[#4a2e16] rounded-full" />
          </div>
        </div>

        {/* Ground Contact Shadow */}
        <div className="w-11 sm:w-13 h-2.5 bg-stone-950/25 rounded-[50%] blur-[1px] mt-0.5" />
      </div>

      {/* ========================================================================= */}
      {/* 6. TRANSPARENT-BACKGROUND 3D OBJECTS WITH AUTO-SIZING & DROP SHADOW */}
      {/* ========================================================================= */}
      {Array.from(new Map(activeRoomObjects.map((o) => [o.id || `${o.name}_${o.createdAt}`, o])).values()).map(
        (obj, idx) => {
          const hasReactions = obj.reactions && obj.reactions.length > 0;
          const isPrivate = obj.privacyScope === 'private' || obj.isPrivate;
          const objId = obj.id || `obj_${idx}`;
          const currentPos = dragPositions[objId] || { x: obj.x ?? 54, y: obj.y ?? 66 };
          const isDragging = draggingObjectId === objId;
          const isHovered = hoveredObjectId === objId;

          // 3D Depth Sorting: Items lower on screen render in front
          const depthZIndex = Math.min(39, Math.max(20, Math.round(currentPos.y / 2.5)));

          const verbatimText = obj.caption || obj.memoryNote || obj.name;
          const formattedDate = obj.date ? obj.date.slice(5).replace('-', '/') : '';

          // Calculate visual size dynamically based on item characteristics
          const { containerSize, shadowSize, badgeOffset } = calculateItemVisualSize(obj);

          return (
            <div
              key={objId}
              id={`room-object-${objId}`}
              onPointerDown={(e) => isEditMode && handlePointerDown(e, objId, currentPos.x, currentPos.y)}
              onMouseEnter={() => setHoveredObjectId(objId)}
              onMouseLeave={() => setHoveredObjectId(null)}
              onClick={() => {
                if (!isEditMode) onSelectObject(obj);
              }}
              style={{
                left: `${currentPos.x}%`,
                top: `${currentPos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isDragging ? 50 : isHovered ? 45 : depthZIndex,
              }}
              className={`absolute select-none flex flex-col items-center touch-none ${
                isEditMode
                  ? 'cursor-grab active:cursor-grabbing hover:scale-105'
                  : 'cursor-pointer group active:scale-95'
              }`}
            >
              {/* Clean Floating Speech Bubble on hover / edit / pinned */}
              <div
                className={`absolute bottom-full mb-1.5 pointer-events-none transition-all duration-200 ${
                  isHovered || isEditMode || obj.isPinned
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-1 scale-95 pointer-events-none'
                }`}
              >
                <div
                  className={`relative bg-white/95 backdrop-blur-md text-stone-900 border rounded-2xl px-2.5 py-1 text-[11px] font-bold flex flex-col items-center justify-center max-w-[150px] sm:max-w-[190px] shadow-lg ${
                    isEditMode
                      ? 'border-amber-400 ring-2 ring-amber-300'
                      : 'border-stone-200/90'
                  }`}
                >
                  <div className="flex items-center gap-1 w-full justify-center">
                    <span className="truncate text-stone-900 leading-tight text-center">
                      {verbatimText}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[9px] text-stone-400 font-normal mt-0.5">
                    {formattedDate && <span>({formattedDate})</span>}
                    {obj.isPinned && (
                      <span className="px-1 rounded bg-amber-100 text-amber-800 font-bold flex items-center gap-0.5">
                        <Pin className="w-2.5 h-2.5 inline" /> お気に入り
                      </span>
                    )}
                    {isPrivate && (
                      <span className="px-1 rounded bg-stone-100 text-stone-600 font-medium">
                        🔒 非公開
                      </span>
                    )}
                    {hasReactions && (
                      <span className="inline-flex items-center text-[10px] text-rose-500 font-bold ml-0.5">
                        💐 {obj.reactions!.length}
                      </span>
                    )}
                  </div>

                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-stone-200 transform rotate-45" />
                </div>
              </div>

              {/* 3D Cutout Figurine (Pure Transparent Background with Depth Filter) */}
              <div
                className={`relative ${containerSize} flex items-center justify-center transition-all duration-200 ${
                  isEditMode
                    ? 'ring-2 ring-amber-400 ring-offset-2 rounded-2xl scale-105 animate-pulse'
                    : isHovered
                    ? '-translate-y-2 scale-110'
                    : 'group-hover:-translate-y-1 group-hover:scale-105'
                }`}
              >
                {obj.imageUrl || obj.customTextureUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                    <RoomObjectImage
                      src={obj.imageUrl || obj.customTextureUrl!}
                      alt={obj.name}
                      className="w-full h-full object-contain filter drop-shadow-[0_6px_8px_rgba(0,0,0,0.24)]"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl sm:text-5xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)] transform group-hover:scale-110 transition-transform">
                      {obj.iconEmoji || '✨'}
                    </span>
                  </div>
                )}

                {/* Badge Emoji */}
                <span
                  className={`absolute ${badgeOffset} text-[11px] bg-white/95 rounded-full p-0.5 shadow-sm border border-stone-200`}
                >
                  {obj.iconEmoji || '✨'}
                </span>

                {/* Pin indicator */}
                {obj.isPinned && (
                  <span className="absolute -top-1.5 -left-1.5 text-[9px] bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm font-bold">
                    📌
                  </span>
                )}
              </div>

              {/* 3D Ground Contact Shadow */}
              <div
                className={`${shadowSize} bg-stone-950/25 rounded-[50%] blur-[1.5px] mt-0.5 transition-all duration-200 ${
                  isHovered ? 'scale-75 opacity-15' : 'scale-100 opacity-30'
                }`}
              />
            </div>
          );
        }
      )}
    </div>
  );
};
