import React, { useState } from 'react';
import { UserProfile, RoomObject } from '../types';
import { GameRoomCanvas } from './GameRoomCanvas';
import { CalendarClosetView } from './CalendarClosetView';
import {
  Move,
  Archive,
  Settings,
  Sparkles,
  Pin,
  Smile,
  LogOut,
  Users,
  Plus,
  Info,
} from 'lucide-react';

interface MyRoomDashboardViewProps {
  currentUser: UserProfile;
  userRoomObjects: RoomObject[];
  friendsCount: number;
  unreadNotificationsCount?: number;
  onSelectObject: (obj: RoomObject) => void;
  onOpenPostingModal: () => void;
  onOpenFriendManager: () => void;
  onOpenProfileEdit: () => void;
  onUpdateObjectPosition: (objectId: string, x: number, y: number) => Promise<void> | void;
  onObjectRestored?: (obj: RoomObject) => void;
  onLogout?: () => void;
}

export const MyRoomDashboardView: React.FC<MyRoomDashboardViewProps> = ({
  currentUser,
  userRoomObjects,
  friendsCount,
  unreadNotificationsCount = 0,
  onSelectObject,
  onOpenPostingModal,
  onOpenFriendManager,
  onOpenProfileEdit,
  onUpdateObjectPosition,
  onObjectRestored,
  onLogout,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isClosetModalOpen, setIsClosetModalOpen] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Active items in room today + pinned items
  const activeItems = userRoomObjects.filter((o) => {
    if (o.areaType === 'closet' || (o as any).isArchived) return false;
    const isToday = o.date === todayStr || !o.date;
    const isPinnedOrFav = o.isPinned || (o as any).isFavorite;
    return isToday || isPinnedOrFav;
  });

  // Stored closet items count
  const closetItemsCount = userRoomObjects.filter((o) => {
    const isToday = o.date === todayStr || !o.date;
    const isPinnedOrFav = o.isPinned || (o as any).isFavorite;
    return o.areaType === 'closet' || (o as any).isArchived || (!isToday && !isPinnedOrFav);
  }).length;

  return (
    <div id="myroom-dashboard-view" className="max-w-md sm:max-w-xl mx-auto px-4 pt-3 pb-28 space-y-4">
      {/* 1. Top Profile & Quick Controls Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            onClick={onOpenProfileEdit}
            className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-amber-300 ring-2 ring-amber-100 shadow-xs cursor-pointer group"
            title="プロフィール・AIアバターを変更"
          >
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
              編集
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-stone-900">{currentUser.displayName}</h2>
              <span className="text-xs text-stone-400 font-mono">
                {currentUser.username || `@${currentUser.uid.slice(0, 6)}`}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
              {currentUser.bio || 'お部屋をコーディネート中☕'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenProfileEdit}
            className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            title="プロフィール設定"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Room Canvas Container */}
      <div className="relative">
        <GameRoomCanvas
          ownerProfile={{
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            username: currentUser.username,
            photoURL: currentUser.photoURL,
            statusText: currentUser.latestStatus?.text || 'わたしのマイルーム',
            statusEmoji: currentUser.latestStatus?.emoji || '✨',
          }}
          isOwner={true}
          objects={userRoomObjects}
          onSelectObject={onSelectObject}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(false)}
          onUpdateObjectPosition={onUpdateObjectPosition}
          onOpenCloset={() => setIsClosetModalOpen(true)}
        />
      </div>

      {/* 3. Action Toolbar (模様替え / クローゼット / 飾る) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Toggle Edit Mode */}
        <button
          id="btn-room-edit-mode"
          onClick={() => setIsEditMode((prev) => !prev)}
          className={`py-3 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs ${
            isEditMode
              ? 'bg-amber-600 border-amber-600 text-white ring-2 ring-amber-300'
              : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Move className="w-4 h-4 text-amber-600" />
          <span>{isEditMode ? '模様替え完了' : '模様替え'}</span>
        </button>

        {/* Open Closet Modal */}
        <button
          id="btn-room-closet"
          onClick={() => setIsClosetModalOpen(true)}
          className="py-3 px-2 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
        >
          <div className="relative">
            <Archive className="w-4 h-4 text-purple-600" />
            {closetItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-purple-600 text-white text-[8px] font-black px-1 rounded-full">
                {closetItemsCount}
              </span>
            )}
          </div>
          <span>クローゼット</span>
        </button>

        {/* Decorate new memory */}
        <button
          id="btn-room-decorate-action"
          onClick={onOpenPostingModal}
          className="py-3 px-2 rounded-2xl border border-stone-800 bg-[#3c342b] hover:bg-[#2a241e] text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 text-amber-300 stroke-[3]" />
          <span>思い出を飾る</span>
        </button>
      </div>

      {/* 4. Room Summary & Status Card */}
      <div className="bg-amber-50/80 rounded-3xl p-4 sm:p-5 border border-amber-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h3 className="font-extrabold text-xs sm:text-sm text-stone-900">マイルームの状態</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
            本日: {activeItems.length} 個配置中
          </span>
        </div>
        <p className="text-xs text-stone-700 leading-relaxed">
          今日飾ったアイテムやお気に入りの思い出が部屋に並んでいます。
          過去のアイテムは自動でクローゼットに保管され、いつでもカレンダーから振り返ったり復元できます🚪
        </p>
      </div>

      {/* 5. Friends Shortcut & Management */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-900">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-900">親しい友達</p>
            <p className="text-[10px] text-stone-500">現在 {friendsCount} 人とつながり中</p>
          </div>
        </div>

        <button
          onClick={onOpenFriendManager}
          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
        >
          友達を管理
        </button>
      </div>

      {/* Closet Modal Popup */}
      {isClosetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-5 py-3.5 bg-[#faf8f5] border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-purple-700" />
                <h3 className="text-sm font-extrabold text-stone-900">思い出のクローゼット</h3>
              </div>
              <button
                onClick={() => setIsClosetModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              <CalendarClosetView
                currentUser={currentUser}
                allUserObjects={userRoomObjects}
                onSelectObject={(obj) => {
                  setIsClosetModalOpen(false);
                  onSelectObject(obj);
                }}
                onObjectRestored={(obj) => {
                  if (onObjectRestored) onObjectRestored(obj);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
