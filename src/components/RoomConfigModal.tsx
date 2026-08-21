import React, { useState } from 'react';
import { UserProfile, RoomObject, PlacementSlot } from '../types';
import { db, doc, updateDoc, deleteDoc } from '../firebase';
import { X, Pin, Archive, Trash2, Sliders, Sparkles, Check, Move } from 'lucide-react';

interface RoomConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  selectedObject: RoomObject | null;
  onObjectUpdated: (updated: RoomObject) => void;
  onObjectDeleted: (id: string) => void;
}

const SLOTS: { id: PlacementSlot; name: string; icon: string }[] = [
  { id: 'wall', name: '壁ポスター・額縁', icon: '🖼️' },
  { id: 'shelf', name: '本棚・レコード棚', icon: '📚' },
  { id: 'desk', name: 'デスク・卓上', icon: '☕' },
  { id: 'floor', name: '床・インテリア', icon: '🪴' },
  { id: 'terrace', name: '今日のスポット・テラス', icon: '🌿' },
];

export const RoomConfigModal: React.FC<RoomConfigModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedObject,
  onObjectUpdated,
  onObjectDeleted,
}) => {
  if (!isOpen || !selectedObject) return null;

  const isOwner = selectedObject.userId === currentUser.uid;
  const [slot, setSlot] = useState<PlacementSlot>(selectedObject.placementSlot || 'desk');
  const [posX, setPosX] = useState(selectedObject.x);
  const [posY, setPosY] = useState(selectedObject.y);
  const [isPinned, setIsPinned] = useState(selectedObject.isPinned);
  const [areaType, setAreaType] = useState(selectedObject.areaType);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedObject.id) return;
    setSaving(true);
    try {
      const updatedData = {
        placementSlot: slot,
        x: posX,
        y: posY,
        isPinned,
        areaType,
      };

      await updateDoc(doc(db, 'room_objects', selectedObject.id), updatedData);
      onObjectUpdated({ ...selectedObject, ...updatedData });
      onClose();
    } catch (err) {
      console.error('Update object error:', err);
      alert('更新に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveToCloset = async () => {
    if (!selectedObject.id) return;
    try {
      await updateDoc(doc(db, 'room_objects', selectedObject.id), {
        areaType: 'closet',
      });
      onObjectUpdated({ ...selectedObject, areaType: 'closet' });
      alert('「思い出のクローゼット」に収納しました。いつでもカレンダーやクローゼットから部屋に戻せます。');
      onClose();
    } catch (err) {
      console.error('Move to closet error:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedObject.id) return;
    if (!confirm('このオブジェクトを削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'room_objects', selectedObject.id));
      onObjectDeleted(selectedObject.id);
      onClose();
    } catch (err) {
      console.error('Delete object error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-stone-50 rounded-3xl max-w-md w-full overflow-hidden border border-stone-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-100/60">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedObject.iconEmoji}</span>
            <div>
              <h3 className="font-bold text-stone-900 text-base">{selectedObject.name}</h3>
              <p className="text-xs text-stone-500">
                {selectedObject.date} 記録・{selectedObject.isSharedItem ? '🤝おそろい' : '日常アイテム'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Object Texture / Preview */}
          {selectedObject.imageUrl && (
            <div className="w-full h-40 rounded-2xl overflow-hidden border border-stone-200 relative group">
              <img
                src={selectedObject.imageUrl}
                alt={selectedObject.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent flex items-end p-3">
                <span className="text-xs text-stone-100 line-clamp-2">
                  {selectedObject.memoryNote}
                </span>
              </div>
            </div>
          )}

          {/* Giver info if reaction gift */}
          {selectedObject.giverDisplayName && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <span className="text-base">💌</span>
              <div>
                <span className="font-bold">{selectedObject.giverDisplayName}</span> さんからの差し入れ:
                <p className="text-amber-800 mt-0.5">{selectedObject.giftMessage}</p>
              </div>
            </div>
          )}

          {/* Memory Note Display */}
          {selectedObject.memoryNote && !selectedObject.imageUrl && (
            <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200 text-xs text-stone-700">
              <p className="font-medium">💭 {selectedObject.memoryNote}</p>
            </div>
          )}

          {/* Placement Slot Selector */}
          {isOwner && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                配置スロットの変更
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SLOTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSlot(s.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-left transition-all ${
                      slot === s.id
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-2xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Position Coordinates Slider */}
          {isOwner && (
            <div className="p-3.5 rounded-2xl bg-stone-100/70 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span className="flex items-center gap-1 font-medium">
                  <Move className="w-3.5 h-3.5 text-stone-500" /> 位置の微調整
                </span>
                <span className="text-[11px] text-stone-400">X: {posX}% / Y: {posY}%</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-stone-500">左右 (X)</span>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    value={posX}
                    onChange={(e) => setPosX(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-500">上下 (Y)</span>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={posY}
                    onChange={(e) => setPosY(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Toggles: Pin & AreaType */}
          {isOwner && (
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isPinned
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-stone-100 text-stone-600 border border-stone-200'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-700 text-amber-700' : ''}`} />
                <span>{isPinned ? 'ピン留め中（押し出し保護）' : 'ピン留めする（最大5個）'}</span>
              </button>

              <button
                type="button"
                onClick={handleMoveToCloset}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium hover:bg-purple-100"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>クローゼットへ</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {isOwner && (
            <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-stone-900 text-white font-medium hover:bg-stone-800 text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>配置と設定を保存</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
