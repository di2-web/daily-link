import React, { useState } from 'react';
import { UserProfile, FriendRelation, RoomObject } from '../types';
import { RoomView } from './RoomView';
import {
  Users,
  UserPlus,
  Gift,
  Search,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface FriendsRoomViewProps {
  currentUser: UserProfile;
  friendsList: FriendRelation[];
  allRoomObjects: RoomObject[];
  onOpenInviteModal: () => void;
  onOpenGiftModalForFriend: (friend: { uid: string; displayName: string; photoURL: string }) => void;
  onSelectObject: (obj: RoomObject) => void;
}

export const FriendsRoomView: React.FC<FriendsRoomViewProps> = ({
  currentUser,
  friendsList,
  allRoomObjects,
  onOpenInviteModal,
  onOpenGiftModalForFriend,
  onSelectObject,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeVisitingFriend, setActiveVisitingFriend] = useState<FriendRelation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all categories from friends
  const categories = ['all', '親友', '部活', '家族', 'パートナー'];

  // Filter friends
  const filteredFriends = friendsList.filter((f) => {
    const matchCat =
      selectedCategory === 'all' ||
      (f.assignedCategories && f.assignedCategories.includes(selectedCategory));
    const matchQuery =
      f.friendDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.friendBio && f.friendBio.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQuery;
  });

  // If visiting a specific friend's room
  if (activeVisitingFriend) {
    const friendProfile: UserProfile = {
      uid: activeVisitingFriend.friendUid,
      displayName: activeVisitingFriend.friendDisplayName,
      photoURL: activeVisitingFriend.friendPhotoURL,
      bio: activeVisitingFriend.friendBio || '親しい友達の部屋',
      createdAt: activeVisitingFriend.createdAt,
    };

    const friendBaseObjects = allRoomObjects.filter(
      (o) => o.userId === activeVisitingFriend.friendUid && o.areaType === 'base_room'
    );
    const friendTodayObjects = allRoomObjects.filter(
      (o) => o.userId === activeVisitingFriend.friendUid && o.areaType === 'todays_spot'
    );

    return (
      <div className="space-y-4">
        <div className="max-w-6xl mx-auto px-4 pt-2 flex items-center justify-between">
          <button
            onClick={() => setActiveVisitingFriend(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>友達一覧に戻る</span>
          </button>
        </div>

        <RoomView
          currentUser={currentUser}
          roomOwner={friendProfile}
          isVisiting={true}
          baseRoomObjects={friendBaseObjects}
          todaysSpotObjects={friendTodayObjects}
          onOpenPostModal={() => {}}
          onOpenSharedMatchModal={() => {}}
          onOpenGiftModal={() =>
            onOpenGiftModalForFriend({
              uid: activeVisitingFriend.friendUid,
              displayName: activeVisitingFriend.friendDisplayName,
              photoURL: activeVisitingFriend.friendPhotoURL,
            })
          }
          onSelectObject={onSelectObject}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <h2 className="text-xl font-bold text-stone-900">友達の部屋（クローズド）</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            親しい人（2〜5人）の部屋を覗いたり、テラスにお花やコーヒーをそっと置けます
          </p>
        </div>

        <button
          onClick={onOpenInviteModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-all shadow-xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>招待リンクを発行</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 bg-stone-200/50 p-1 rounded-2xl border border-stone-300/40 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {cat === 'all' ? 'すべて' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="友達の名前で検索..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
          />
        </div>
      </div>

      {/* Friends Room Cards Grid */}
      {filteredFriends.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredFriends.map((f) => {
            const friendObjects = allRoomObjects.filter((o) => o.userId === f.friendUid);
            const todayGifts = friendObjects.filter((o) => o.category === 'gift');

            return (
              <div
                key={f.id || f.friendUid}
                className="bg-stone-50 rounded-3xl p-5 border border-stone-200/80 shadow-xs hover:shadow-md transition-all hover:border-amber-400 flex flex-col justify-between"
              >
                <div>
                  {/* Friend Header */}
                  <div className="flex items-center gap-3">
                    <img
                      src={f.friendPhotoURL}
                      alt={f.friendDisplayName}
                      className="w-12 h-12 rounded-2xl border border-stone-300 object-cover shadow-2xs"
                    />
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{f.friendDisplayName}</h4>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {(f.assignedCategories || ['親友']).map((cat) => (
                          <span
                            key={cat}
                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-200 text-stone-600 font-medium"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Room Overview Preview */}
                  <div className="mt-4 p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium">
                      <span>部屋のアイテム</span>
                      <span className="font-bold text-amber-900">{friendObjects.length} 個</span>
                    </div>
                    {todayGifts.length > 0 && (
                      <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                        <span>💌</span> 届いた差し入れ: {todayGifts.length} 件
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-stone-200">
                  <button
                    onClick={() =>
                      onOpenGiftModalForFriend({
                        uid: f.friendUid,
                        displayName: f.friendDisplayName,
                        photoURL: f.friendPhotoURL,
                      })
                    }
                    className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors"
                    title="お花やコーヒーを置く"
                  >
                    <Gift className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveVisitingFriend(f)}
                    className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                  >
                    <span>部屋に入る</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-stone-50 rounded-3xl p-10 border border-stone-200 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-3xl">
            👥
          </div>
          <h3 className="font-bold text-stone-900 text-base">友達がまだ登録されていません</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Roomonは親しい友達（2〜5人）だけの完全クローズド空間です。
            招待リンクをLINEなどで共有して、お互いの部屋をつなぎましょう。
          </p>
          <button
            onClick={onOpenInviteModal}
            className="px-5 py-2.5 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs"
          >
            招待リンクを作成する
          </button>
        </div>
      )}
    </div>
  );
};
