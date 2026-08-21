import React, { useState } from 'react';
import { UserProfile, RoomObject, FriendRelation } from '../types';
import {
  Bell,
  UserPlus,
  Move,
  Check,
} from 'lucide-react';
import { FriendsJumpDrawer } from './FriendsJumpDrawer';
import { GameRoomCanvas } from './GameRoomCanvas';

interface RoomFeedSwipeViewProps {
  currentUser: UserProfile;
  friendsList: FriendRelation[];
  allRoomObjects: RoomObject[];
  unreadNotificationCount: number;
  onSelectObject: (obj: RoomObject) => void;
  onOpenPostingModal: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenFriendManager: () => void;
  onOpenCloset?: () => void;
  onQuickSendGift: (targetUid: string, type: 'flower' | 'coffee') => void;
  onOpenFullReactionModal: (
    targetObj?: RoomObject,
    targetUser?: { uid: string; displayName: string }
  ) => void;
  onUpdateObjectPosition?: (objectId: string, x: number, y: number) => Promise<void> | void;
}

export const RoomFeedSwipeView: React.FC<RoomFeedSwipeViewProps> = ({
  currentUser,
  friendsList,
  allRoomObjects,
  unreadNotificationCount,
  onSelectObject,
  onOpenPostingModal,
  onOpenNotifications,
  onOpenProfile,
  onOpenFriendManager,
  onOpenCloset,
  onQuickSendGift,
  onOpenFullReactionModal,
  onUpdateObjectPosition,
}) => {
  // Only accepted mutual friends
  const acceptedFriends = friendsList.filter(
    (f) => f.status === 'accepted' || (!f.status && f.friendUid)
  );

  // Selected friend (null = current user's own room)
  const [selectedFriend, setSelectedFriend] = useState<FriendRelation | null>(null);
  const [isJumpDrawerOpen, setIsJumpDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [giftFeedback, setGiftFeedback] = useState<string | null>(null);

  const isOwner = selectedFriend === null;

  const currentRoomOwner = isOwner
    ? {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        username: currentUser.username,
        photoURL: currentUser.photoURL,
        bio: currentUser.bio,
        statusText: currentUser.latestStatus?.text,
        statusEmoji: currentUser.latestStatus?.emoji,
      }
    : {
        uid: selectedFriend.friendUid,
        displayName: selectedFriend.friendDisplayName,
        username: selectedFriend.friendUsername,
        photoURL: selectedFriend.friendPhotoURL,
        bio: selectedFriend.friendBio,
        statusText: selectedFriend.statusText,
        statusEmoji: selectedFriend.statusEmoji,
      };

  const currentRoomObjects = allRoomObjects.filter(
    (o) => o.userId === currentRoomOwner.uid
  );

  const handleSendGift = (type: 'flower' | 'coffee') => {
    if (!selectedFriend) return;
    onQuickSendGift(selectedFriend.friendUid, type);
    setGiftFeedback(`${selectedFriend.friendDisplayName}さんに${type === 'flower' ? 'お花💐' : 'コーヒー☕'}を置きました！`);
    setTimeout(() => setGiftFeedback(null), 2500);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#faf8f5] flex flex-col justify-between select-none pb-20">
      {/* 1. TOP HEADER & FRIEND AVATARS */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Room Title */}
          <div className="flex items-center gap-2">
            <span className="text-base">{isOwner ? '🏠' : currentRoomOwner.statusEmoji || '🏡'}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm sm:text-base text-stone-900 leading-tight">
                  {isOwner ? 'あなたの部屋' : `${currentRoomOwner.displayName} の部屋`}
                </h1>
                {isOwner ? (
                  <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                    マイルーム
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded-full bg-sky-100 text-sky-900 text-[10px] font-bold">
                    訪問中
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-400 font-mono">
                {currentRoomOwner.username || `@${currentRoomOwner.uid.slice(0, 6)}`}
              </p>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-2">
            {/* Owner Edit Mode Toggle */}
            {isOwner && (
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isEditMode
                    ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300'
                }`}
              >
                {isEditMode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>完了</span>
                  </>
                ) : (
                  <>
                    <Move className="w-3.5 h-3.5" />
                    <span>模様替え</span>
                  </>
                )}
              </button>
            )}

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
              title="お知らせ"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. FRIEND & MY ROOM SWITCH STRIP (Direct Tap Navigation) */}
        <div className="max-w-4xl mx-auto px-4 pb-2.5 pt-1 overflow-x-auto scrollbar-none flex items-center gap-3">
          {/* My Room Button */}
          <button
            onClick={() => setSelectedFriend(null)}
            className={`flex flex-col items-center gap-1 shrink-0 cursor-pointer transition-transform ${
              isOwner ? 'scale-105' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div
              className={`relative p-0.5 rounded-full transition-all ${
                isOwner
                  ? 'ring-2 ring-amber-800 ring-offset-2'
                  : 'border-2 border-dashed border-amber-600/60'
              }`}
            >
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-800 text-white text-[10px] flex items-center justify-center shadow-xs">
                🏠
              </span>
            </div>
            <span
              className={`text-[10px] max-w-[56px] truncate ${
                isOwner ? 'font-extrabold text-amber-950' : 'text-stone-600'
              }`}
            >
              マイルーム
            </span>
          </button>

          {/* Friends' Room Bubbles */}
          {acceptedFriends.map((friend) => {
            const isActive = selectedFriend?.friendUid === friend.friendUid;

            return (
              <button
                key={friend.friendUid}
                onClick={() => setSelectedFriend(friend)}
                className={`flex flex-col items-center gap-1 shrink-0 cursor-pointer transition-transform ${
                  isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div
                  className={`relative p-0.5 rounded-full transition-all ${
                    isActive
                      ? 'ring-2 ring-amber-800 ring-offset-2'
                      : 'border-2 border-stone-300'
                  }`}
                >
                  <img
                    src={friend.friendPhotoURL}
                    alt={friend.friendDisplayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="absolute -bottom-1 -right-1 text-xs p-0.5 rounded-full bg-white shadow-xs">
                    {friend.statusEmoji || '🌱'}
                  </span>
                </div>
                <span
                  className={`text-[10px] max-w-[56px] truncate ${
                    isActive ? 'font-extrabold text-amber-950' : 'text-stone-600'
                  }`}
                >
                  {friend.friendDisplayName}
                </span>
              </button>
            );
          })}

          {/* Add Friend Shortcut */}
          <button
            onClick={onOpenFriendManager}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            title="友達を追加"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center bg-stone-50 text-stone-500">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-stone-500">追加</span>
          </button>
        </div>
      </header>

      {/* Floating Gift Feedback Toast */}
      {giftFeedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in duration-200">
          <span>🎁</span>
          <span>{giftFeedback}</span>
        </div>
      )}

      {/* 3. MAXIMIZED ROOM CANVAS (Big, Spacious, Seamless Display) */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-3 flex flex-col items-center justify-center">
        <GameRoomCanvas
          ownerProfile={currentRoomOwner}
          isOwner={isOwner}
          objects={currentRoomObjects}
          onSelectObject={onSelectObject}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onUpdateObjectPosition={onUpdateObjectPosition}
          onOpenCloset={onOpenCloset}
        />

        {/* Visitor Gift Actions */}
        {!isOwner && selectedFriend && (
          <div className="mt-3 w-full max-w-xl bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200 p-2.5 flex items-center justify-between shadow-xs">
            <span className="text-xs font-bold text-stone-700">
              {currentRoomOwner.displayName} さんにプレゼント
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleSendGift('flower')}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 cursor-pointer transition-all active:scale-95 flex items-center gap-1"
              >
                <span>💐</span>
                <span>お花</span>
              </button>
              <button
                onClick={() => handleSendGift('coffee')}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 cursor-pointer transition-all active:scale-95 flex items-center gap-1"
              >
                <span>☕</span>
                <span>コーヒー</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Friends Drawer */}
      <FriendsJumpDrawer
        isOpen={isJumpDrawerOpen}
        onClose={() => setIsJumpDrawerOpen(false)}
        currentUser={currentUser}
        friendsList={friendsList}
        allRoomObjects={allRoomObjects}
        currentRoomIndex={isOwner ? 0 : acceptedFriends.findIndex((f) => f.friendUid === selectedFriend?.friendUid) + 1}
        onSelectRoomIndex={(idx) => {
          if (idx === 0) {
            setSelectedFriend(null);
          } else {
            setSelectedFriend(acceptedFriends[idx - 1] || null);
          }
          setIsJumpDrawerOpen(false);
        }}
        onOpenFriendManager={() => {
          setIsJumpDrawerOpen(false);
          onOpenFriendManager();
        }}
        onOpenPostingModal={() => {
          setIsJumpDrawerOpen(false);
          onOpenPostingModal();
        }}
      />
    </div>
  );
};
