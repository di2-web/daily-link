import React, { useState } from 'react';
import { UserProfile, FriendRelation, RoomObject } from '../types';
import {
  X,
  Search,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  UserPlus,
  Home,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface FriendsJumpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  friendsList: FriendRelation[];
  allRoomObjects: RoomObject[];
  currentRoomIndex: number;
  onSelectRoomIndex: (index: number) => void;
  onOpenFriendManager: () => void;
  onOpenPostingModal: () => void;
}

export const FriendsJumpDrawer: React.FC<FriendsJumpDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  friendsList,
  allRoomObjects,
  currentRoomIndex,
  onSelectRoomIndex,
  onOpenFriendManager,
  onOpenPostingModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<'all' | 'recent' | 'close'>('all');

  if (!isOpen) return null;

  // Filter accepted mutual friends
  const acceptedFriends = friendsList.filter(
    (f) => f.status === 'accepted' || (!f.status && f.friendUid)
  );

  // Search filter
  const q = searchQuery.toLowerCase().trim();
  const filteredFriends = acceptedFriends.filter((f) => {
    if (!q) return true;
    const matchName = f.friendDisplayName?.toLowerCase().includes(q);
    const matchUser = f.friendUsername?.toLowerCase().includes(q);
    const matchStatus = f.statusText?.toLowerCase().includes(q);
    return matchName || matchUser || matchStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer content */}
      <div className="relative w-full max-w-sm bg-stone-50 h-full flex flex-col shadow-2xl border-r border-stone-200 z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm">部屋を探す・ジャンプ</h3>
              <p className="text-[11px] text-stone-500">
                相互フレンド ({acceptedFriends.length}人)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3.5 bg-white border-b border-stone-200/60">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="友達の名前やステータスを検索..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-amber-700 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-stone-400 hover:text-stone-700 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* 1. Current User's Own Room Item (Always at top) */}
          <div
            onClick={() => {
              onSelectRoomIndex(0);
              onClose();
            }}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              currentRoomIndex === 0
                ? 'bg-amber-50 border-amber-300 shadow-xs ring-1 ring-amber-400/50'
                : 'bg-white border-stone-200 hover:border-amber-200 hover:bg-amber-50/40 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-11 h-11 rounded-full object-cover border-2 border-amber-600/40"
                />
                <span className="absolute -bottom-1 -right-1 text-xs p-0.5 rounded-full bg-white shadow-xs">
                  🏠
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs text-stone-900 truncate">
                    {currentUser.displayName}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                    あなた
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                  {currentUser.latestStatus?.emoji || '🌱'}{' '}
                  {currentUser.latestStatus?.text || '日常を飾っています'}
                </p>
              </div>
            </div>

            <div className="flex items-center text-amber-900 text-xs font-bold shrink-0">
              {currentRoomIndex === 0 ? (
                <span className="text-[11px] text-amber-700 font-bold bg-amber-100/70 px-2 py-1 rounded-lg">
                  現在地
                </span>
              ) : (
                <ArrowRight className="w-4 h-4 text-stone-400" />
              )}
            </div>
          </div>

          <div className="pt-2 pb-1 px-1 flex items-center justify-between text-[11px] font-bold text-stone-500">
            <span>友達の部屋 ({filteredFriends.length})</span>
            {searchQuery && (
              <span className="text-[10px] text-amber-800 font-normal">検索中</span>
            )}
          </div>

          {/* 2. Friends' Rooms */}
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => {
              // Find real index in room sequence: index 0 is currentUser, friends start at index 1
              const friendIndex = acceptedFriends.findIndex(
                (f) => f.friendUid === friend.friendUid
              );
              const targetIndex = friendIndex !== -1 ? friendIndex + 1 : 0;
              const isCurrent = currentRoomIndex === targetIndex;

              // Latest friend room object preview
              const friendObjects = allRoomObjects.filter(
                (o) =>
                  o.userId === friend.friendUid &&
                  o.privacyScope !== 'private' &&
                  !o.isPrivate
              );
              const latestObj = friendObjects.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];

              return (
                <div
                  key={friend.friendUid}
                  onClick={() => {
                    onSelectRoomIndex(targetIndex);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-amber-50 border-amber-300 shadow-xs ring-1 ring-amber-400/50'
                      : 'bg-white border-stone-200 hover:border-amber-200 hover:bg-amber-50/40 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={friend.friendPhotoURL}
                        alt={friend.friendDisplayName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-stone-200"
                      />
                      <span className="absolute -bottom-1 -right-1 text-xs p-0.5 rounded-full bg-white shadow-xs">
                        {friend.statusEmoji || '🌱'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-stone-900 truncate">
                          {friend.friendDisplayName}
                        </h4>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {friend.friendUsername || `@${friend.friendUid.slice(0, 6)}`}
                        </span>
                      </div>

                      {/* Status / Latest Item Snippet */}
                      {latestObj ? (
                        <p className="text-[11px] text-stone-600 truncate mt-0.5 flex items-center gap-1">
                          <span>{latestObj.iconEmoji}</span>
                          <span className="font-medium text-stone-800">{latestObj.name}</span>
                          <span className="text-[9px] text-stone-400">
                            ({latestObj.date.slice(5).replace('-', '/')})
                          </span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          {friend.statusText || '部屋を整理中🌿'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center text-xs font-bold shrink-0">
                    {isCurrent ? (
                      <span className="text-[11px] text-amber-700 font-bold bg-amber-100/70 px-2 py-1 rounded-lg">
                        訪問中
                      </span>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-stone-300 bg-white/70 space-y-2">
              <p className="text-xs font-bold text-stone-600">
                {searchQuery
                  ? '該当する友達が見つかりませんでした'
                  : 'まだ相互友達がいません'}
              </p>
              <p className="text-[11px] text-stone-400">
                友達申請を送るか招待リンクを共有してお部屋をつなげましょう
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-stone-200/80 bg-white space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenFriendManager();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>友達を追加・管理する</span>
          </button>
        </div>
      </div>
    </div>
  );
};
