import React from 'react';
import { UserProfile, FriendRelation } from '../types';
import { Home, Waves, Users, Archive, Plus, Handshake, LogIn, User, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'room' | 'wave' | 'friends' | 'closet';
  setActiveTab: (tab: 'room' | 'wave' | 'friends' | 'closet') => void;
  currentUser: UserProfile | null;
  onOpenPostModal: () => void;
  onOpenSharedMatchModal: () => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  unreadGiftsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenPostModal,
  onOpenSharedMatchModal,
  onOpenAuthModal,
  onOpenProfileModal,
  unreadGiftsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('room')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-xl">🛋️</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-stone-900 tracking-tight">DailyLink</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium border border-amber-200">
                  空間SNS
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                記録する時間を減らし、思い出に残る時間を増やす
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-200/60 p-1 rounded-2xl border border-stone-300/40">
          <button
            onClick={() => setActiveTab('room')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'room'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
            }`}
          >
            <Home className="w-4 h-4 text-amber-600" />
            <span>わたしの部屋</span>
            {unreadGiftsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('wave')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'wave'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
            }`}
          >
            <Waves className="w-4 h-4 text-sky-600" />
            <span>気分の波</span>
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'friends'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>友達の部屋</span>
          </button>

          <button
            onClick={() => setActiveTab('closet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'closet'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
            }`}
          >
            <Archive className="w-4 h-4 text-purple-600" />
            <span>クローゼット</span>
          </button>
        </nav>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Shared Match Button */}
          <button
            onClick={onOpenSharedMatchModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 text-xs sm:text-sm font-medium transition-colors shadow-2xs"
            title="合言葉でおそろいインテリアを作成"
          >
            <Handshake className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">合言葉でおそろい</span>
          </button>

          {/* Quick Post Button */}
          <button
            onClick={onOpenPostModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs sm:text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>スキマ記録</span>
          </button>

          {/* Profile / Auth Button */}
          {currentUser ? (
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-stone-200/60 transition-colors"
              title="プロフィール・フレンド設定"
            >
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full border border-stone-300 object-cover"
              />
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs sm:text-sm font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>ログイン</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
