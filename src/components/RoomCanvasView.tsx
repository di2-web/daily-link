import React, { useState } from 'react';
import { RoomObject, UserProfile } from '../types';
import {
  ArrowLeft,
  Music,
  Flower2,
  Coffee,
  Sparkles,
  Move,
  Check,
  Volume2,
} from 'lucide-react';
import { GameRoomCanvas } from './GameRoomCanvas';

interface RoomCanvasViewProps {
  ownerProfile: UserProfile | { displayName: string; username?: string; photoURL: string; uid: string };
  isOwner: boolean;
  currentUser: UserProfile;
  objects: RoomObject[];
  onBack: () => void;
  onSelectObject: (obj: RoomObject) => void;
  onQuickSendGift: (type: 'flower' | 'coffee') => void;
  onOpenFullReactionModal: () => void;
  onUpdateObjectPosition?: (objectId: string, x: number, y: number) => Promise<void> | void;
  onDeleteObject?: (objectId: string) => Promise<void> | void;
}

export const RoomCanvasView: React.FC<RoomCanvasViewProps> = ({
  ownerProfile,
  isOwner,
  currentUser,
  objects,
  onBack,
  onSelectObject,
  onQuickSendGift,
  onOpenFullReactionModal,
  onUpdateObjectPosition,
  onDeleteObject,
}) => {
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#faf8f5] flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header */}
      <div className="relative z-30 bg-white/90 backdrop-blur-md px-4 py-3 border-b border-stone-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-400 shadow-xs">
              <img
                src={ownerProfile.photoURL}
                alt={ownerProfile.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-extrabold text-stone-900 leading-tight">
                  {isOwner ? 'あなたの部屋' : `${ownerProfile.displayName}の部屋`}
                </h2>
                {!isOwner ? (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold">
                    訪問中
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                    マイルーム
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-400 font-mono">
                {ownerProfile.username || `@${ownerProfile.uid.slice(0, 6)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Owner Edit Mode Toggle */}
          {isOwner && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isEditMode
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400 animate-pulse'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300'
              }`}
            >
              {isEditMode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>配置完了</span>
                </>
              ) : (
                <>
                  <Move className="w-3.5 h-3.5" />
                  <span>模様替え</span>
                </>
              )}
            </button>
          )}

          {/* BGM Toggle button */}
          <button
            onClick={() => setBgmPlaying(!bgmPlaying)}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              bgmPlaying
                ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs scale-105'
                : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
            }`}
            title="部屋のBGM"
          >
            {bgmPlaying ? <Volume2 className="w-4 h-4 text-amber-800" /> : <Music className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Room 3D Isometric Game Stage */}
      <div className="relative flex-1 w-full max-w-2xl mx-auto flex items-center justify-center p-3 sm:p-4">
        <GameRoomCanvas
          ownerProfile={ownerProfile}
          isOwner={isOwner}
          objects={objects}
          onSelectObject={onSelectObject}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onUpdateObjectPosition={onUpdateObjectPosition}
        />
      </div>

      {/* Bottom Action Bar for Visitor (Clean Gift & Reaction Actions - No Footprint) */}
      {!isOwner && (
        <div className="relative z-30 bg-white/90 backdrop-blur-md border-t border-stone-200 px-4 py-3 shadow-lg">
          <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
            {/* Quick Leave Flower */}
            <button
              onClick={() => onQuickSendGift('flower')}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              <Flower2 className="w-4 h-4 text-amber-600" />
              <span>お花を置く</span>
            </button>

            {/* Quick Leave Coffee */}
            <button
              onClick={() => onQuickSendGift('coffee')}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              <Coffee className="w-4 h-4 text-orange-600" />
              <span>コーヒーを置く</span>
            </button>

            {/* Full Reaction / Gift Menu */}
            <button
              onClick={onOpenFullReactionModal}
              className="py-2.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="メッセージやプレゼントを贈る"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>プレゼント</span>
            </button>
          </div>
        </div>
      )}

      {/* Owner hint if viewing own room */}
      {isOwner && (
        <div className="relative z-30 bg-white/80 backdrop-blur-md border-t border-stone-200 px-4 py-2.5 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
          <span>💡</span>
          <span>
            {isEditMode
              ? 'アイテムをドラッグして好きな場所に移動できます'
              : '置かれた思い出をタップすると、拡大表示やリアクション確認ができます'}
          </span>
        </div>
      )}
    </div>
  );
};
