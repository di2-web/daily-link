import React, { useState } from 'react';
import { UserProfile, RoomObject, PlacementSlot } from '../types';
import { ROOM_WALLPAPERS } from '../data/roomItems';
import {
  Sparkles,
  Pin,
  Handshake,
  Gift,
  Plus,
  Sliders,
  Archive,
  Layers,
  ChevronRight,
  Sun,
  Eye,
  Coffee,
  Info,
} from 'lucide-react';

interface RoomViewProps {
  currentUser: UserProfile;
  roomOwner: UserProfile;
  isVisiting: boolean;
  baseRoomObjects: RoomObject[];
  todaysSpotObjects: RoomObject[];
  onOpenPostModal: () => void;
  onOpenSharedMatchModal: () => void;
  onOpenGiftModal: () => void;
  onSelectObject: (obj: RoomObject) => void;
  onAutoCleanAndOrganize?: () => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  currentUser,
  roomOwner,
  isVisiting,
  baseRoomObjects,
  todaysSpotObjects,
  onOpenPostModal,
  onOpenSharedMatchModal,
  onOpenGiftModal,
  onSelectObject,
  onAutoCleanAndOrganize,
}) => {
  const [selectedWallpaperIndex, setSelectedWallpaperIndex] = useState(0);
  const [activeAreaTab, setActiveAreaTab] = useState<'all' | 'base' | 'today'>('all');

  const currentWallpaper = ROOM_WALLPAPERS[selectedWallpaperIndex];
  const isOwner = currentUser.uid === roomOwner.uid;

  // Filter objects based on tab
  const displayedBaseObjects =
    activeAreaTab === 'today' ? [] : baseRoomObjects.slice(0, 12);
  const displayedTodayObjects =
    activeAreaTab === 'base' ? [] : todaysSpotObjects;

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Top Profile & Space Control Bar */}
      <div className="bg-stone-50 rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={roomOwner.photoURL}
            alt={roomOwner.displayName}
            className="w-12 h-12 rounded-2xl border border-stone-300 object-cover shadow-2xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-stone-900 text-base sm:text-lg">
                {isOwner ? 'わたしの部屋' : `${roomOwner.displayName} さんの部屋`}
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 font-medium">
                完全クローズド
              </span>
            </div>
            <p className="text-xs text-stone-500 line-clamp-1">
              {roomOwner.bio || '日常を空間オブジェクトにして飾っています'}
            </p>
          </div>
        </div>

        {/* Visiting Actions or Owner Controls */}
        <div className="flex items-center gap-2">
          {isVisiting ? (
            <button
              onClick={onOpenGiftModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-semibold hover:from-amber-700 hover:to-amber-800 shadow-sm transition-all active:scale-95"
            >
              <Gift className="w-4 h-4" />
              <span>テラスにお花やコーヒーを置く</span>
            </button>
          ) : (
            <>
              {/* Area View Filter */}
              <div className="flex bg-stone-200/60 p-1 rounded-xl border border-stone-300/40 text-xs">
                <button
                  onClick={() => setActiveAreaTab('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeAreaTab === 'all'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  全フロア
                </button>
                <button
                  onClick={() => setActiveAreaTab('base')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeAreaTab === 'base'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  普段の部屋 ({baseRoomObjects.length}/12)
                </button>
                <button
                  onClick={() => setActiveAreaTab('today')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeAreaTab === 'today'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  今日のスポット ({todaysSpotObjects.length})
                </button>
              </div>

              {/* Wallpaper switch */}
              <button
                onClick={() =>
                  setSelectedWallpaperIndex(
                    (selectedWallpaperIndex + 1) % ROOM_WALLPAPERS.length
                  )
                }
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                title="部屋のテーマ変更"
              >
                <Sun className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main 2.5D Room Canvas Layout */}
      <div
        className={`relative w-full rounded-3xl border border-stone-300/80 shadow-md overflow-hidden bg-gradient-to-b ${currentWallpaper.bgClass} min-h-[480px] sm:min-h-[560px] p-4 transition-colors duration-500`}
      >
        {/* Subtle Room Architecture Background Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          {/* Wall / Floor Divider Line */}
          <div className="absolute top-[48%] left-0 right-0 h-[1px] bg-stone-400/40" />
          {/* Left Wall Angle */}
          <div className="absolute top-0 bottom-[52%] left-[18%] w-[1px] bg-stone-400/25 rotate-[15deg] origin-bottom" />
          {/* Right Wall Angle */}
          <div className="absolute top-0 bottom-[52%] right-[18%] w-[1px] bg-stone-400/25 -rotate-[15deg] origin-bottom" />
          {/* Perspective Floor Grid */}
          <div className="absolute top-[48%] bottom-0 left-0 right-0 bg-[radial-gradient(#d6c7b2_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
        </div>

        {/* 2-Layer Area Zone Indicators */}
        <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
          <div className="px-3 py-1 rounded-xl bg-white/80 backdrop-blur-xs border border-stone-200/80 text-[11px] font-semibold text-stone-700 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>普段の部屋 (Base Room)</span>
            <span className="text-stone-400">|</span>
            <span className="text-stone-500">{displayedBaseObjects.length}/12個</span>
          </div>

          <div className="px-3 py-1 rounded-xl bg-amber-100/90 backdrop-blur-xs border border-amber-300/80 text-[11px] font-semibold text-amber-900 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>今日のスポット・テラス</span>
            <span className="text-amber-800">({displayedTodayObjects.length}件)</span>
          </div>
        </div>

        {/* Room Interactive Objects Placement */}

        {/* 1. Base Room Objects */}
        {Array.from(new Map(displayedBaseObjects.map((o) => [o.id || `${o.name}_${o.createdAt}`, o])).values()).map((obj, idx) => (
          <button
            key={obj.id ? `${obj.id}` : `base_${idx}`}
            onClick={() => onSelectObject(obj)}
            style={{
              left: `${Math.min(88, Math.max(8, obj.x))}%`,
              top: `${Math.min(85, Math.max(12, obj.y))}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-hidden z-20 transition-transform duration-200 hover:scale-110 active:scale-95"
          >
            <div className="relative flex flex-col items-center">
              {/* Badge: Pin or Shared */}
              {obj.isPinned && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-sm z-30">
                  📌
                </span>
              )}
              {obj.isSharedItem && (
                <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] shadow-sm z-30">
                  🤝
                </span>
              )}

              {/* Object visual box */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/90 backdrop-blur-xs border border-stone-200/90 shadow-md p-1.5 flex items-center justify-center overflow-hidden transition-shadow group-hover:shadow-xl group-hover:border-amber-400">
                {obj.imageUrl ? (
                  <img
                    src={obj.imageUrl}
                    alt={obj.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-3xl filter drop-shadow-xs">{obj.iconEmoji || '✨'}</span>
                )}
              </div>

              {/* Object Speech Bubble Tag */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap pointer-events-none z-30">
                <div className="relative bg-white/95 backdrop-blur-md text-stone-900 border border-stone-200 shadow-md rounded-2xl px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 group-hover:scale-105 group-hover:border-amber-400 transition-all max-w-[180px]">
                  <span className="truncate">{obj.caption || obj.name}</span>
                  {obj.date && (
                    <span className="text-[9px] text-stone-400 font-normal shrink-0">
                      ({obj.date.slice(5).replace('-', '/')})
                    </span>
                  )}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-stone-200 transform rotate-45" />
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* 2. Today's Spot / Terrace Interactive Objects */}
        {Array.from(new Map(displayedTodayObjects.map((o) => [o.id || `${o.name}_${o.createdAt}`, o])).values()).map((obj, idx) => (
          <button
            key={obj.id ? `${obj.id}` : `today_${idx}`}
            onClick={() => onSelectObject(obj)}
            style={{
              left: `${Math.min(85, Math.max(10, obj.x))}%`,
              top: `${Math.min(82, Math.max(15, obj.y))}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-hidden z-25 transition-transform duration-200 hover:scale-110 active:scale-95"
          >
            <div className="relative flex flex-col items-center">
              {/* Glow indicator for Today's Area */}
              <div className="absolute inset-0 rounded-2xl bg-amber-400/30 blur-xs -z-10 animate-pulse" />

              {/* Gift Badge */}
              {obj.giverDisplayName && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shadow-sm z-30">
                  💌
                </span>
              )}

              {/* Object Visual Box */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50/95 backdrop-blur-xs border-2 border-amber-400/90 shadow-md p-1.5 flex items-center justify-center overflow-hidden group-hover:shadow-xl group-hover:border-amber-600">
                {obj.imageUrl ? (
                  <img
                    src={obj.imageUrl}
                    alt={obj.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-3xl filter drop-shadow-xs">{obj.iconEmoji || '☕'}</span>
                )}
              </div>

              {/* Tag with Memory Note preview */}
              <div className="mt-1 px-2 py-0.5 rounded-lg bg-amber-950/80 backdrop-blur-xs text-amber-100 text-[10px] font-medium whitespace-nowrap opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-xs pointer-events-none">
                {obj.giverDisplayName ? `💌 ${obj.giverDisplayName}さんより` : obj.name}
              </div>
            </div>
          </button>
        ))}

        {/* Empty State Prompt */}
        {displayedBaseObjects.length === 0 && displayedTodayObjects.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
            <div className="w-16 h-16 rounded-3xl bg-white/80 backdrop-blur-xs border border-stone-200 flex items-center justify-center text-3xl shadow-sm mb-3">
              🪴
            </div>
            <h3 className="font-bold text-stone-800 text-base">まだ部屋にインテリアがありません</h3>
            <p className="text-xs text-stone-500 max-w-sm mt-1">
              写真や一言メモを投稿すると、AIが内容を読み取って部屋を彩る家具や小物を自動配置します。
            </p>
          </div>
        )}
      </div>

      {/* Footer Info & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Info className="w-4 h-4 text-stone-400" />
          <span>
            タップすると思い出の確認・ピン留め・クローゼットへの片付けができます
          </span>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSharedMatchModal}
              className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              🤝 合言葉でおそろい作成
            </button>
            <button
              onClick={onOpenPostModal}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shadow-xs"
            >
              ＋ スキマ記録を投稿
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
