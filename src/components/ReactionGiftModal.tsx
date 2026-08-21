import React, { useState } from 'react';
import { UserProfile, RoomObject } from '../types';
import { db, collection, addDoc } from '../firebase';
import { X, Gift, Sparkles, Coffee, Heart, Mail, Star, Cake, Loader2 } from 'lucide-react';

interface ReactionGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  targetUser: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
  selectedDate: string;
  onGiftSent: (createdObj: RoomObject) => void;
}

const GIFT_OPTIONS = [
  {
    type: 'flower',
    name: '友情のお花束',
    iconEmoji: '💐',
    imageUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&auto=format&fit=crop&q=80',
    description: '穏やかで温かい気持ちを届けるブーケ',
    defaultMsg: 'いつもありがとう！素敵な一日を💐',
  },
  {
    type: 'coffee',
    name: '淹れたてカフェラテ',
    iconEmoji: '☕',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80',
    description: '「今日もお疲れ様」のほっと一息マグ',
    defaultMsg: '今日もお疲れ様☕️ ゆっくり休んでね！',
  },
  {
    type: 'message',
    name: '手書きメッセージカード',
    iconEmoji: '💌',
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop&q=80',
    description: 'そっと置かれた親友からのメモ',
    defaultMsg: '部屋遊びに来たよ！また話そうね💌',
  },
  {
    type: 'star',
    name: '輝く星のランプ',
    iconEmoji: '⭐',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80',
    description: '夜の部屋を優しく照らすミニランプ',
    defaultMsg: '応援してるよ！キラキラな毎日を✨',
  },
  {
    type: 'cake',
    name: 'ごほうびショートケーキ',
    iconEmoji: '🍰',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80',
    description: '甘いスイーツのプレゼント',
    defaultMsg: 'がんばった自分にごほうびを！🍰',
  },
];

export const ReactionGiftModal: React.FC<ReactionGiftModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUser,
  selectedDate,
  onGiftSent,
}) => {
  const [selectedGiftIndex, setSelectedGiftIndex] = useState(0);
  const [customMessage, setCustomMessage] = useState(GIFT_OPTIONS[0].defaultMsg);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentOption = GIFT_OPTIONS[selectedGiftIndex];

  const handleSelectOption = (idx: number) => {
    setSelectedGiftIndex(idx);
    setCustomMessage(GIFT_OPTIONS[idx].defaultMsg);
  };

  const handleSendGift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Record in reaction_gifts collection
      await addDoc(collection(db, 'reaction_gifts'), {
        targetUserId: targetUser.uid,
        senderUserId: currentUser.uid,
        senderDisplayName: currentUser.displayName,
        senderPhotoURL: currentUser.photoURL,
        reactionType: currentOption.type,
        message: customMessage,
        date: selectedDate,
        createdAt: new Date().toISOString(),
      });

      // 2. Add spatial object to friend's 'todays_spot' terrace area
      const newRoomObject: Omit<RoomObject, 'id'> = {
        userId: targetUser.uid,
        userDisplayName: targetUser.displayName,
        userPhotoURL: targetUser.photoURL,
        assetId: `gift_${currentOption.type}_${Date.now()}`,
        name: `${currentUser.displayName}さんからの${currentOption.name}`,
        category: 'gift',
        placementSlot: 'terrace',
        iconEmoji: currentOption.iconEmoji,
        imageUrl: currentOption.imageUrl,
        x: 40 + Math.floor(Math.random() * 20),
        y: 45 + Math.floor(Math.random() * 15),
        memoryNote: customMessage,
        date: selectedDate,
        areaType: 'todays_spot',
        isPinned: false,
        isSharedItem: false,
        giverUid: currentUser.uid,
        giverDisplayName: currentUser.displayName,
        giverPhotoURL: currentUser.photoURL,
        giftMessage: customMessage,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'room_objects'), newRoomObject);
      onGiftSent({ id: docRef.id, ...newRoomObject });

      alert(`🎉 ${targetUser.displayName}さんの部屋のテラスに「${currentOption.name}」をそっと置きました！`);
      onClose();
    } catch (err) {
      console.error('Send gift error:', err);
      alert('リアクションの送信に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-stone-50 rounded-3xl max-w-md w-full overflow-hidden border border-stone-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-100/60">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-700" />
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                {targetUser.displayName}さんの部屋に差し入れ
              </h3>
              <p className="text-xs text-stone-500">お相手のテラス（今日のスポット）に24時間飾られます</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gift Options Carousel */}
        <form onSubmit={handleSendGift} className="p-6 space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {GIFT_OPTIONS.map((opt, idx) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleSelectOption(idx)}
                className={`flex flex-col items-center p-2 rounded-2xl border transition-all ${
                  selectedGiftIndex === idx
                    ? 'border-amber-600 bg-amber-50 shadow-xs ring-2 ring-amber-500/30'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <span className="text-2xl">{opt.iconEmoji}</span>
                <span className="text-[10px] text-stone-700 font-medium mt-1 truncate w-full text-center">
                  {opt.name.replace('からの', '').slice(0, 4)}
                </span>
              </button>
            ))}
          </div>

          {/* Selected Gift Preview Card */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center gap-3">
            <img
              src={currentOption.imageUrl}
              alt={currentOption.name}
              className="w-14 h-14 rounded-xl object-cover border border-amber-200 shadow-xs shrink-0"
            />
            <div>
              <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1">
                <span>{currentOption.iconEmoji}</span>
                <span>{currentOption.name}</span>
              </h4>
              <p className="text-[11px] text-stone-500 mt-0.5">{currentOption.description}</p>
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              添える短いメッセージカード（非同期）
            </label>
            <textarea
              rows={2}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="一言メッセージを添えて送れます"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span>部屋のテラスにそっと置く</span>
          </button>
        </form>
      </div>
    </div>
  );
};
