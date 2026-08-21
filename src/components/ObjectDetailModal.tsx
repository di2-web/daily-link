import React, { useState } from 'react';
import { RoomObject, RoomItemReaction, UserProfile } from '../types';
import { RoomObjectImage } from './RoomObjectImage';
import {
  X,
  Heart,
  MessageSquare,
  Flower2,
  Coffee,
  Sparkles,
  Clock,
  Share2,
  Trash2,
  Move,
  Archive,
  ArchiveRestore,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface ObjectDetailModalProps {
  object: RoomObject;
  isOwner: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onOpenReactionModal: () => void;
  onDeleteObject?: (objectId: string) => Promise<void> | void;
  onUpdatePosition?: (objectId: string, x: number, y: number) => Promise<void> | void;
  onToggleArea?: (objectId: string, newArea: 'base_room' | 'closet') => Promise<void> | void;
  onEnterRoomEditMode?: (targetObjectId?: string) => void;
}

export const ObjectDetailModal: React.FC<ObjectDetailModalProps> = ({
  object,
  isOwner,
  currentUser,
  onClose,
  onOpenReactionModal,
  onDeleteObject,
  onUpdatePosition,
  onToggleArea,
  onEnterRoomEditMode,
}) => {
  const reactions = object.reactions || [];

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveControls, setShowMoveControls] = useState(false);
  const [currentX, setCurrentX] = useState(object.x ?? 45);
  const [currentY, setCurrentY] = useState(object.y ?? 60);
  const [isSavingPos, setIsSavingPos] = useState(false);
  const [isTogglingArea, setIsTogglingArea] = useState(false);

  // Group reaction counts
  const flowerCount = reactions.filter((r) => r.type === 'flower').length;
  const coffeeCount = reactions.filter((r) => r.type === 'coffee').length;
  const heartCount = reactions.filter((r) => r.type === 'heart').length;
  const otherCount = reactions.filter((r) => r.type !== 'flower' && r.type !== 'coffee' && r.type !== 'heart').length;

  const objectId = object.id || object.assetId;

  // Move coordinate step
  const handleShiftPosition = async (dx: number, dy: number) => {
    const newX = Math.max(10, Math.min(90, Math.round(currentX + dx)));
    const newY = Math.max(15, Math.min(88, Math.round(currentY + dy)));
    setCurrentX(newX);
    setCurrentY(newY);
    if (onUpdatePosition && objectId) {
      setIsSavingPos(true);
      try {
        await onUpdatePosition(objectId, newX, newY);
      } finally {
        setIsSavingPos(false);
      }
    }
  };

  const handleExecuteDelete = async () => {
    if (!objectId || !onDeleteObject) return;
    setIsDeleting(true);
    try {
      await onDeleteObject(objectId);
      onClose();
    } catch (err) {
      console.error('Failed to delete object:', err);
      alert('削除に失敗しました。');
      setIsDeleting(false);
    }
  };

  const handleToggleClosetState = async () => {
    if (!objectId || !onToggleArea) return;
    const targetArea = object.areaType === 'closet' ? 'base_room' : 'closet';
    setIsTogglingArea(true);
    try {
      await onToggleArea(objectId, targetArea);
      onClose();
    } catch (err) {
      console.error('Failed to toggle object area:', err);
      alert('変更に失敗しました。');
    } finally {
      setIsTogglingArea(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#faf8f5] rounded-3xl max-w-sm sm:max-w-md w-full border border-stone-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="bg-white px-4 py-3 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{object.iconEmoji}</span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm text-stone-900 leading-tight">{object.name}</h3>
                {object.postType === 'feeling' && (
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[9px] font-bold">
                    💭 キモチ
                  </span>
                )}
                {object.postType === 'item' && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                    🎁 アイテム
                  </span>
                )}
                {(object.privacyScope === 'private' || object.isPrivate) && (
                  <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[9px] font-bold">
                    🔒 非公開
                  </span>
                )}
                {(object.privacyScope === 'friends' || object.isCloseFriendsOnly) && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                    👥 友達限定
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-400 font-medium">{object.date} 投稿</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (Image 3 - 4) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Main Photo / 3D Model Card */}
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-gradient-to-b from-stone-50 to-stone-100 min-h-48 max-h-64 flex items-center justify-center p-4">
            {object.imageUrl ? (
              <div className="w-40 h-40 flex items-center justify-center">
                <RoomObjectImage
                  src={object.imageUrl}
                  alt={object.name}
                  className="w-full h-full object-contain filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.2)]"
                />
              </div>
            ) : object.customTextureUrl ? (
              <img
                src={object.customTextureUrl}
                alt={object.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span className="text-6xl filter drop-shadow-md">{object.iconEmoji || '✨'}</span>
            )}
            {/* Corner Badge */}
            <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{object.postType === 'feeling' ? 'キモチのしるし' : '思い出のしるし'}</span>
            </div>
          </div>

          {/* Caption Text (Image 3 - 4) */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
            {object.feelingEmotion && (
              <div className="mb-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                  {object.feelingEmotion}
                </span>
              </div>
            )}
            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
              {object.caption || object.memoryNote || '大切に部屋に飾られた思い出のアイテムです。'}
            </p>
          </div>

          {/* Reaction Summary Pills (Image 3 - 4) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold shadow-2xs">
              <span>💐</span>
              <span>{flowerCount}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-900 text-xs font-bold shadow-2xs">
              <span>☕</span>
              <span>{coffeeCount}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-900 text-xs font-bold shadow-2xs">
              <span>❤️</span>
              <span>{heartCount}</span>
            </div>
            {otherCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold shadow-2xs">
                <span>🎁</span>
                <span>{otherCount}</span>
              </div>
            )}
          </div>

          {/* OWNER MANAGEMENT ACTIONS (Move, Toggle Closet, Delete) */}
          {isOwner && (
            <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <span>⚙️</span>
                  <span>アイテムの管理・配置</span>
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  位置: ({currentX}%, {currentY}%)
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {/* Toggle Move Pad */}
                <button
                  type="button"
                  onClick={() => setShowMoveControls((prev) => !prev)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    showMoveControls
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>{showMoveControls ? '位置調整を閉じる' : '位置を動かす'}</span>
                </button>

                {/* Direct Room Drag Mode */}
                {onEnterRoomEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEnterRoomEditMode(objectId);
                    }}
                    className="py-2 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>🪄</span>
                    <span>部屋でドラッグ移動</span>
                  </button>
                )}

                {/* Toggle Closet / Room */}
                {onToggleArea && (
                  <button
                    type="button"
                    disabled={isTogglingArea}
                    onClick={handleToggleClosetState}
                    className="py-2 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isTogglingArea ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : object.areaType === 'closet' ? (
                      <>
                        <ArchiveRestore className="w-3.5 h-3.5 text-amber-600" />
                        <span>普段の部屋に出す</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5 text-stone-500" />
                        <span>クローゼットへ片付ける</span>
                      </>
                    )}
                  </button>
                )}

                {/* Delete Button */}
                {onDeleteObject && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>アイテムを削除</span>
                  </button>
                )}
              </div>

              {/* Move D-Pad Controls */}
              {showMoveControls && (
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium">
                    <span>矢印ボタンで部屋内の位置を移動：</span>
                    {isSavingPos && (
                      <span className="text-amber-700 text-[10px] flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>保存中...</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleShiftPosition(0, -6)}
                      className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer shadow-2xs active:scale-95"
                      title="上へ移動"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleShiftPosition(-6, 0)}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer shadow-2xs active:scale-95"
                        title="左へ移動"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-stone-400 px-2 select-none">
                        {object.iconEmoji}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleShiftPosition(6, 0)}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer shadow-2xs active:scale-95"
                        title="右へ移動"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleShiftPosition(0, 6)}
                      className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer shadow-2xs active:scale-95"
                      title="下へ移動"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Alert */}
              {showDeleteConfirm && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2 text-rose-900 text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p>
                      「<span className="font-bold">{object.name}</span>」を部屋から完全に削除しますか？この操作は元に戻せません。
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleExecuteDelete}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>削除中...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>削除を確定する</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* "置いてくれたもの" 履歴リスト (Image 3 - 4) */}
          <div>
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>置いてくれたもの</span>
              <span className="text-[10px] font-normal text-stone-400">
                {reactions.length} 件
              </span>
            </h4>

            <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-2xs">
              {reactions.length > 0 ? (
                reactions.map((r) => (
                  <div key={r.id} className="p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-200 shrink-0">
                        <img
                          src={r.senderPhotoURL}
                          alt={r.senderName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-800 truncate">
                          {r.senderName} が
                          {r.type === 'flower'
                            ? '花を置きました 💐'
                            : r.type === 'coffee'
                            ? 'コーヒーを置きました ☕'
                            : r.type === 'book'
                            ? '本を置きました 📚'
                            : r.type === 'plushie'
                            ? 'ぬいぐるみを置きました 🧸'
                            : 'リアクションを残しました ❤️'}
                        </p>
                        {r.message && (
                          <p className="text-[11px] text-stone-500 truncate mt-0.5 italic">
                            "{r.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400 shrink-0 ml-2">
                      {new Date(r.createdAt).toLocaleDateString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-stone-400">
                  まだ置かれたリアクションはありません。最初の花やコーヒーを置いてみましょう！
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-stone-200">
          {!isOwner ? (
            <button
              onClick={onOpenReactionModal}
              className="w-full py-3 rounded-2xl bg-[#3c342b] hover:bg-[#2b241c] text-white font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>このアイテムにリアクションを置く 🎁</span>
            </button>
          ) : (
            <div className="text-center py-1 text-xs text-stone-500">
              あなたの部屋のアイテムです（友達が訪れるとリアクションを残せます）
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
