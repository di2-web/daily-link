import React from 'react';
import { UserProfile, FriendRelation, RoomObject } from '../types';
import { Plus, Bell, Sparkles, User, DoorOpen, Home as HomeIcon } from 'lucide-react';

interface HomeFriendHousesProps {
  currentUser: UserProfile;
  friendsList: FriendRelation[];
  allRoomObjects: RoomObject[];
  unreadNotificationCount: number;
  onSelectFriend: (friend: FriendRelation) => void;
  onOpenMyRoom: () => void;
  onOpenPostingModal: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenFriendManager?: () => void;
}

// Visual 3D cute house backgrounds for demo
const HOUSE_THEMES = [
  {
    bg: 'bg-amber-50/90 border-amber-200/80',
    roofBg: 'bg-[#d97736]',
    doorBg: 'bg-[#8d4f27]',
    accentEmoji: '🌿',
  },
  {
    bg: 'bg-orange-50/90 border-orange-200/80',
    roofBg: 'bg-[#cb5a3e]',
    doorBg: 'bg-[#7a3220]',
    accentEmoji: '🎸',
  },
  {
    bg: 'bg-emerald-50/90 border-emerald-200/80',
    roofBg: 'bg-[#437a5b]',
    doorBg: 'bg-[#29503b]',
    accentEmoji: '📚',
  },
  {
    bg: 'bg-sky-50/90 border-sky-200/80',
    roofBg: 'bg-[#3b7ea1]',
    doorBg: 'bg-[#214e66]',
    accentEmoji: '⛺',
  },
];

export const HomeFriendHouses: React.FC<HomeFriendHousesProps> = ({
  currentUser,
  friendsList,
  allRoomObjects,
  unreadNotificationCount,
  onSelectFriend,
  onOpenMyRoom,
  onOpenPostingModal,
  onOpenNotifications,
  onOpenProfile,
  onOpenFriendManager,
}) => {
  // Only accepted mutual friends are displayed as houses
  const acceptedFriends = friendsList.filter(
    (f) => f.status === 'accepted' || (!f.status && f.friendUid)
  );

  return (
    <div className="max-w-md sm:max-w-xl mx-auto px-4 pt-4 pb-28 space-y-5">
      {/* Top Welcome Header (Image 3 - 1) */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="flex items-center gap-1.5 text-stone-800">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">おかえり</h1>
            <span className="text-lg">🌱</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
            今日は誰の部屋に遊びに行く？
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-full bg-white border border-stone-200 shadow-2xs hover:bg-stone-50 transition-colors text-stone-700 cursor-pointer"
            title="お知らせ"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Profile Avatar Button */}
          <button
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-stone-300 hover:border-amber-600 transition-colors shadow-2xs cursor-pointer"
            title="マイページ"
          >
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName}
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* Friends' House Grid (Image 3 - 1) or Empty State */}
      {acceptedFriends.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {acceptedFriends.map((friend, index) => {
            const theme = HOUSE_THEMES[index % HOUSE_THEMES.length];
            const latestObj = allRoomObjects
              .filter(
                (o) =>
                  o.userId === friend.friendUid &&
                  o.privacyScope !== 'private' &&
                  !o.isPrivate
              )
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            const statusBubbleText =
              friend.statusText ||
              (latestObj ? `${latestObj.name}を飾ったよ` : '部屋でのんびり中');
            const statusEmoji = friend.statusEmoji || latestObj?.iconEmoji || theme.accentEmoji;

            return (
              <div
                key={friend.id || friend.friendUid}
                onClick={() => onSelectFriend(friend)}
                className="group relative bg-white rounded-3xl p-3.5 sm:p-4 border border-stone-200/90 shadow-sm hover:shadow-md transition-all hover:border-amber-400 cursor-pointer flex flex-col items-center justify-between"
              >
                {/* Cute Floating Status Bubble */}
                <div className="w-full mb-2">
                  <div className="relative bg-amber-50/90 border border-amber-200/70 rounded-2xl px-2.5 py-1.5 text-center shadow-2xs">
                    <p className="text-[11px] font-bold text-stone-800 truncate flex items-center justify-center gap-1">
                      <span className="truncate">{statusBubbleText}</span>
                      <span className="shrink-0">{statusEmoji}</span>
                    </p>
                    {/* Bubble tail */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-50 border-r border-b border-amber-200/70 transform rotate-45" />
                  </div>
                </div>

                {/* 3D Cute House & Avatar Display */}
                <div className="relative w-full h-32 sm:h-36 rounded-2xl bg-gradient-to-b from-stone-100 to-amber-50/60 border border-stone-200/70 flex flex-col items-center justify-end pb-2 overflow-hidden group-hover:scale-[1.02] transition-transform">
                  {/* House Roof & Wall Shape Illustration */}
                  <div
                    className={`absolute top-0 inset-x-3 h-7 rounded-b-xl ${theme.roofBg} opacity-85 shadow-xs flex items-center justify-center`}
                  >
                    <div className="w-12 h-1 bg-white/30 rounded-full" />
                  </div>

                  {/* Decorative Window / Wall items */}
                  <div className="absolute top-9 left-3 w-5 h-5 rounded-md bg-amber-100 border border-amber-200/60 flex items-center justify-center text-[10px] shadow-2xs">
                    🪟
                  </div>
                  <div className="absolute top-9 right-3 w-5 h-5 rounded-md bg-amber-100 border border-amber-200/60 flex items-center justify-center text-[10px] shadow-2xs">
                    🪴
                  </div>

                  {/* Door Frame */}
                  <div
                    className={`w-14 h-20 rounded-t-2xl ${theme.doorBg} border-2 border-stone-200/80 shadow-inner flex items-center justify-center relative overflow-hidden`}
                  >
                    {/* Character Avatar */}
                    <img
                      src={friend.friendPhotoURL}
                      alt={friend.friendDisplayName}
                      className="w-12 h-16 object-cover rounded-t-xl mt-3 filter drop-shadow-xs"
                    />
                  </div>
                </div>

                {/* Friend Info Footer */}
                <div className="w-full mt-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                      {friend.friendDisplayName}
                    </h3>
                    {friend.lastActiveText === 'オンライン' ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>オンライン</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400">
                        {friend.lastActiveText || '最近'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm text-center space-y-3.5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 mx-auto flex items-center justify-center text-3xl shadow-2xs">
            🏡
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">まだお友達の家がありません</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
              DailyLinkは親しい友達（2〜5人）とつながるプライベート空間です。専用招待リンクやユーザー名検索でお友達を追加しましょう。
            </p>
          </div>
          {onOpenFriendManager && (
            <button
              onClick={onOpenFriendManager}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>お友達を招待・追加する</span>
            </button>
          )}
        </div>
      )}

      {/* Your Own Room Quick Entry Banner */}
      <div
        onClick={onOpenMyRoom}
        className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-3xl p-4 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
            🛋️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-white">あなたの部屋へ</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                My Room
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              {currentUser.latestStatus?.text || '現在の部屋の様子を見る・模様替え'}
            </p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-stone-900 transition-colors">
          <DoorOpen className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
