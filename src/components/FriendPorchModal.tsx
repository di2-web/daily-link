import React from 'react';
import { FriendRelation, RoomObject } from '../types';
import { ArrowLeft, Home, Sparkles, Heart, ShieldCheck } from 'lucide-react';

interface FriendPorchModalProps {
  friend: FriendRelation;
  friendRoomObjects: RoomObject[];
  onClose: () => void;
  onEnterRoom: () => void;
}

export const FriendPorchModal: React.FC<FriendPorchModalProps> = ({
  friend,
  friendRoomObjects,
  onClose,
  onEnterRoom,
}) => {
  // Extract recent events only from non-private room objects
  const publicFriendObjects = friendRoomObjects.filter(
    (o) => o.privacyScope !== 'private' && !o.isPrivate
  );

  const recentEvents =
    friend.recentEvents && friend.recentEvents.length > 0
      ? friend.recentEvents
      : publicFriendObjects
          .slice(0, 3)
          .map((obj, i) => ({
            id: obj.id || `evt_${i}`,
            emoji: obj.iconEmoji || '✨',
            title: obj.caption || `${obj.name}を部屋に飾った`,
            timeAgo: i === 0 ? '今日' : i === 1 ? '昨日' : `${i + 1}日前`,
            date: obj.date,
          }));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#faf8f5] rounded-3xl max-w-sm sm:max-w-md w-full border border-stone-300/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Top Navigation Bar */}
        <div className="bg-white px-4 py-3.5 border-b border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-bold text-sm text-stone-900">{friend.friendDisplayName}</span>
              <span className="text-xs text-stone-400 font-mono">
                {friend.friendUsername || `@${friend.friendUid.slice(0, 6)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3" />
              親しい友達
            </span>
          </div>
        </div>

        {/* Porch Scene & Character Avatar (Image 3 - 2) */}
        <div className="relative w-full h-48 bg-gradient-to-b from-amber-100/70 via-stone-100 to-[#e8dfd3] flex flex-col items-center justify-end pb-0 overflow-hidden border-b border-stone-200">
          {/* House Door & Porch Lighting */}
          <div className="absolute top-2 w-32 h-44 rounded-t-3xl bg-[#7c4d32] border-4 border-[#5a341f] shadow-inner flex flex-col items-center justify-start pt-3">
            <div className="w-16 h-8 rounded-lg bg-amber-200/40 border border-amber-300/50 flex items-center justify-center text-xs">
              🏡
            </div>
          </div>

          {/* Porch Lamp */}
          <div className="absolute top-4 right-12 w-6 h-6 rounded-full bg-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.8)] border border-amber-400 flex items-center justify-center text-[10px]">
            💡
          </div>

          {/* Plant at porch */}
          <div className="absolute bottom-2 left-10 text-2xl filter drop-shadow-md">🪴</div>

          {/* Cute Standing Character Avatar */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-28 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-white">
              <img
                src={friend.friendPhotoURL}
                alt={friend.friendDisplayName}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Ground Shadow */}
            <div className="w-24 h-3 bg-stone-900/20 rounded-full blur-xs mt-1" />
          </div>
        </div>

        {/* Recent Events Card List (Image 3 - 2) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div>
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              最近のできごと
            </h3>

            <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-2xs">
              {recentEvents.length > 0 ? (
                recentEvents.map((evt) => (
                  <div key={evt.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-base shrink-0">
                        {evt.emoji}
                      </div>
                      <p className="text-xs font-bold text-stone-800 truncate">{evt.title}</p>
                    </div>
                    <span className="text-[11px] font-medium text-stone-400 shrink-0 ml-2">
                      {evt.timeAgo}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-stone-400">
                  まだ最近の記録はありません
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enter Room Action Button (Image 3 - 2) */}
        <div className="p-4 bg-white border-t border-stone-200">
          <button
            onClick={onEnterRoom}
            className="w-full py-3.5 rounded-2xl bg-[#3c342b] hover:bg-[#2b241c] text-white font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-amber-300" />
            <span>{friend.friendDisplayName}の部屋へ遊びに行く</span>
          </button>
        </div>
      </div>
    </div>
  );
};
