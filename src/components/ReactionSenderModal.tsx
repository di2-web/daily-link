import React, { useState } from 'react';
import { X, Send, Sparkles, Flower2, Coffee, BookOpen, Heart } from 'lucide-react';
import { RoomItemReaction, RoomObject } from '../types';

interface ReactionSenderModalProps {
  targetUserDisplayName: string;
  targetObject?: RoomObject;
  onClose: () => void;
  onSendReaction: (reaction: {
    type: 'flower' | 'coffee' | 'heart' | 'book' | 'plushie';
    itemSubtype: string;
    itemEmoji: string;
    message?: string;
  }) => void;
}

type TabType = 'flower' | 'coffee' | 'book' | 'plushie' | 'message';

const REACTION_TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'flower', label: '花', icon: '💐' },
  { id: 'coffee', label: 'コーヒー', icon: '☕' },
  { id: 'book', label: '本', icon: '📚' },
  { id: 'plushie', label: 'ぬいぐるみ', icon: '🧸' },
  { id: 'message', label: 'メッセージ', icon: '💬' },
];

const GIFT_OPTIONS: Record<
  TabType,
  { subtype: string; name: string; emoji: string; desc: string }[]
> = {
  flower: [
    { subtype: 'tulip', name: 'チューリップ', emoji: '🌷', desc: '思いやりと感謝' },
    { subtype: 'sunflower', name: 'ひまわり', emoji: '🌻', desc: '元気とあたたかさ' },
    { subtype: 'lavender', name: 'ラベンダー', emoji: '🪻', desc: '癒しとやすらぎ' },
    { subtype: 'plant', name: '小さな観葉植物', emoji: '🪴', desc: 'すこやかな毎日を' },
  ],
  coffee: [
    { subtype: 'hot_coffee', name: 'ホットコーヒー', emoji: '☕', desc: 'ホッとする温かさ' },
    { subtype: 'ice_latte', name: 'アイスカフェラテ', emoji: '🧋', desc: 'すっきり気分転換' },
    { subtype: 'matcha', name: '抹茶ラテ', emoji: '🍵', desc: '心落ち着く一杯' },
    { subtype: 'tea', name: 'ハーブティー', emoji: '🫖', desc: '夜のひと休みに' },
  ],
  book: [
    { subtype: 'novel', name: '心温まる小説', emoji: '📖', desc: 'おすすめの物語' },
    { subtype: 'comic', name: '話題のマンガ', emoji: '📚', desc: '笑える一冊' },
    { subtype: 'artbook', name: '写真・画集', emoji: '🎨', desc: 'インスピレーション' },
    { subtype: 'essay', name: '暮らしのエッセイ', emoji: '✍️', desc: '共感のひと言' },
  ],
  plushie: [
    { subtype: 'bear', name: 'くまのぬいぐるみ', emoji: '🧸', desc: 'ふかふか見守り' },
    { subtype: 'cat', name: 'ねこの置物', emoji: '🐱', desc: 'のんびり気ままに' },
    { subtype: 'rabbit', name: 'うさぎマスコット', emoji: '🐰', desc: 'ぴょんと跳ねる幸運' },
    { subtype: 'penguin', name: 'ペンギンさん', emoji: '🐧', desc: '涼やかな癒し' },
  ],
  message: [
    { subtype: 'cheer', name: '応援レター', emoji: '💌', desc: 'いつも応援してるよ' },
    { subtype: 'thanks', name: 'ありがとうカード', emoji: '💐', desc: '感謝の気持ち' },
    { subtype: 'hello', name: '元気？カード', emoji: '✨', desc: 'ふと思い出して' },
    { subtype: 'congrats', name: 'おめでとうクラッカー', emoji: '🎉', desc: '新しいスタートに' },
  ],
};

export const ReactionSenderModal: React.FC<ReactionSenderModalProps> = ({
  targetUserDisplayName,
  targetObject,
  onClose,
  onSendReaction,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('flower');
  const [selectedItem, setSelectedItem] = useState(GIFT_OPTIONS.flower[0]);
  const [customMessage, setCustomMessage] = useState('');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedItem(GIFT_OPTIONS[tab][0]);
  };

  const handleSend = () => {
    let reactionType: 'flower' | 'coffee' | 'heart' | 'book' | 'plushie' = 'flower';
    if (activeTab === 'coffee') reactionType = 'coffee';
    else if (activeTab === 'book') reactionType = 'book';
    else if (activeTab === 'plushie') reactionType = 'plushie';
    else if (activeTab === 'message') reactionType = 'heart';

    onSendReaction({
      type: reactionType,
      itemSubtype: selectedItem.subtype,
      itemEmoji: selectedItem.emoji,
      message: customMessage.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#faf8f5] rounded-t-3xl sm:rounded-3xl max-w-sm sm:max-w-md w-full border border-stone-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="bg-white px-4 py-3.5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <span>リアクションを贈る</span>
              <span className="text-base">🎁</span>
            </h3>
            <p className="text-[11px] text-stone-500">
              {targetObject
                ? `${targetUserDisplayName}の「${targetObject.name}」に置く`
                : `${targetUserDisplayName}の部屋にそっと置いていく`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Image 3 - 6) */}
        <div className="bg-stone-100/70 p-1.5 flex gap-1 border-b border-stone-200 overflow-x-auto">
          {REACTION_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 min-w-[64px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-2xs border border-stone-200/80 scale-[1.02]'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="text-[10px] whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Item Selection Grid */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {GIFT_OPTIONS[activeTab].map((item) => {
              const isSelected = selectedItem.subtype === item.subtype;
              return (
                <div
                  key={item.subtype}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/70 shadow-xs scale-102'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <span className="text-3xl mb-1.5 filter drop-shadow-2xs">{item.emoji}</span>
                  <p className="font-bold text-xs text-stone-900 truncate w-full">{item.name}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Optional Message Field */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              メッセージを添える（任意）
            </label>
            <input
              type="text"
              maxLength={50}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="例: 花を置いていくね！いつも応援してるよ〜"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedItem.emoji}</span>
            <div>
              <p className="text-xs font-bold text-stone-800">{selectedItem.name}</p>
              <p className="text-[10px] text-stone-400">言葉を使わなくても伝わる贈り物</p>
            </div>
          </div>

          <button
            onClick={handleSend}
            className="py-2.5 px-5 rounded-2xl bg-[#3c342b] hover:bg-[#2b241c] text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>送る</span>
          </button>
        </div>
      </div>
    </div>
  );
};
