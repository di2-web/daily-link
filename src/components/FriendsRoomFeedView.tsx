import React, { useState } from 'react';
import { UserProfile, FriendRelation, RoomObject } from '../types';
import { GameRoomCanvas } from './GameRoomCanvas';
import {
  Users,
  UserPlus,
  Gift,
  Search,
  Heart,
  Flower2,
  Coffee,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

interface FriendsRoomFeedViewProps {
  currentUser: UserProfile;
  friendsList: FriendRelation[];
  allRoomObjects: RoomObject[];
  onSelectObject: (obj: RoomObject) => void;
  onVisitFriendRoom: (friend: {
    uid: string;
    displayName: string;
    username?: string;
    photoURL: string;
    bio?: string;
  }) => void;
  onOpenFriendManager: () => void;
  onQuickSendGift: (targetUid: string, type: 'flower' | 'coffee') => void;
  onOpenFullReactionModal: (
    targetObj?: RoomObject,
    targetUser?: { uid: string; displayName: string }
  ) => void;
}

export const FriendsRoomFeedView: React.FC<FriendsRoomFeedViewProps> = ({
  currentUser,
  friendsList,
  allRoomObjects,
  onSelectObject,
  onVisitFriendRoom,
  onOpenFriendManager,
  onQuickSendGift,
  onOpenFullReactionModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const acceptedFriends = friendsList.filter((f) => f.status === 'accepted');

  const filteredFriends = acceptedFriends.filter((f) => {
    const matchQuery =
      f.friendDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.friendBio && f.friendBio.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat =
      selectedCategory === 'all' ||
      (f.assignedCategories && f.assignedCategories.includes(selectedCategory));
    return matchQuery && matchCat;
  });

  return (
    <div id="friends-room-feed-view" className="max-w-md sm:max-w-xl mx-auto px-4 pt-3 pb-28 space-y-4">
      {/* 1. Header with Title & Add Friend */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h2 className="text-base sm:text-lg font-extrabold text-stone-900">みんなの部屋</h2>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            親しい友達の部屋を訪れたり、お花やコーヒーを届けられます☕
          </p>
        </div>

        <button
          onClick={onOpenFriendManager}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#3c342b] hover:bg-[#27221c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-amber-300" />
          <span>友達追加</span>
        </button>
      </div>

      {/* 2. Friends Avatar Quick Navigation Strip */}
      {acceptedFriends.length > 0 && (
        <div className="bg-white rounded-3xl p-3 border border-stone-200 shadow-xs">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            {acceptedFriends.map((f) => (
              <div
                key={f.friendUid}
                onClick={() =>
                  onVisitFriendRoom({
                    uid: f.friendUid,
                    displayName: f.friendDisplayName,
                    username: f.friendUsername,
                    photoURL: f.friendPhotoURL,
                    bio: f.friendBio,
                  })
                }
                className="flex flex-col items-center gap-1 min-w-[64px] cursor-pointer group select-none"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-stone-200 group-hover:border-amber-400 group-hover:ring-2 group-hover:ring-amber-200 transition-all shadow-2xs">
                  <img
                    src={f.friendPhotoURL}
                    alt={f.friendDisplayName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="text-[10px] font-bold text-stone-700 group-hover:text-amber-900 truncate max-w-[64px] text-center">
                  {f.friendDisplayName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Empty state: No Friends Yet */}
      {acceptedFriends.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-900 flex items-center justify-center text-3xl mx-auto">
            🌱
          </div>
          <div>
            <h3 className="font-extrabold text-base text-stone-900">まだ友達がつながっていません</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1 leading-relaxed">
              親しい友達のマイIDを入力して、招待リクエストを送りましょう。お互いの部屋を行き来できるようになります✨
            </p>
          </div>

          <button
            onClick={onOpenFriendManager}
            className="px-5 py-2.5 rounded-2xl bg-[#3c342b] text-amber-200 text-xs font-bold hover:bg-[#28221c] transition-all shadow-md cursor-pointer"
          >
            友達を招待・検索する
          </button>
        </div>
      ) : (
        /* 4. Friends Rooms Cards Feed */
        <div className="space-y-4">
          {filteredFriends.map((f) => {
            const friendObjects = allRoomObjects.filter((o) => o.userId === f.friendUid);

            return (
              <div
                key={f.friendUid}
                className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all space-y-3 p-4"
              >
                {/* Friend Header */}
                <div className="flex items-center justify-between">
                  <div
                    onClick={() =>
                      onVisitFriendRoom({
                        uid: f.friendUid,
                        displayName: f.friendDisplayName,
                        username: f.friendUsername,
                        photoURL: f.friendPhotoURL,
                        bio: f.friendBio,
                      })
                    }
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-amber-300 ring-2 ring-amber-50">
                      <img
                        src={f.friendPhotoURL}
                        alt={f.friendDisplayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-stone-900 group-hover:text-amber-900">
                        {f.friendDisplayName}のお部屋
                      </h3>
                      <p className="text-[10px] text-stone-400">
                        {f.friendBio || '親しい友達'} • アイテム {friendObjects.length} 個
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onVisitFriendRoom({
                        uid: f.friendUid,
                        displayName: f.friendDisplayName,
                        username: f.friendUsername,
                        photoURL: f.friendPhotoURL,
                        bio: f.friendBio,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>入室</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3D Isometric Mini Canvas for Friend's Room */}
                <div
                  onClick={() =>
                    onVisitFriendRoom({
                      uid: f.friendUid,
                      displayName: f.friendDisplayName,
                      username: f.friendUsername,
                      photoURL: f.friendPhotoURL,
                      bio: f.friendBio,
                    })
                  }
                  className="cursor-pointer"
                >
                  <GameRoomCanvas
                    ownerProfile={{
                      uid: f.friendUid,
                      displayName: f.friendDisplayName,
                      username: f.friendUsername,
                      photoURL: f.friendPhotoURL,
                      statusText: `${f.friendDisplayName}の部屋`,
                      statusEmoji: '☕',
                    }}
                    isOwner={false}
                    objects={friendObjects}
                    onSelectObject={onSelectObject}
                    hideControls={true}
                  />
                </div>

                {/* Quick Gift & Footprint Bar */}
                <div className="bg-stone-50 rounded-2xl p-2.5 flex items-center justify-between gap-2 border border-stone-200/80">
                  <span className="text-[11px] text-stone-600 font-bold flex items-center gap-1 pl-1">
                    <Gift className="w-3.5 h-3.5 text-amber-700" />
                    <span>気持ちを届ける:</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuickSendGift(f.friendUid, 'flower')}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-300 text-rose-700 text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Flower2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>お花を置く</span>
                    </button>

                    <button
                      onClick={() => onQuickSendGift(f.friendUid, 'coffee')}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-300 text-amber-800 text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>コーヒー</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
