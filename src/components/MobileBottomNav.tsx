import React from 'react';
import { Users, Calendar, Plus, Bell, Home } from 'lucide-react';

export type MainNavTab = 'friends' | 'calendar' | 'notifications' | 'myroom';

interface MobileBottomNavProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  unreadNotificationsCount?: number;
  onOpenPostingModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  unreadNotificationsCount = 0,
  onOpenPostingModal,
}) => {
  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-3 py-1.5 flex items-center justify-around shadow-lg select-none"
    >
      {/* 1. Friends' Rooms (みんなの部屋) */}
      <button
        id="nav-tab-friends"
        onClick={() => setActiveTab('friends')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
          activeTab === 'friends'
            ? 'text-amber-950 font-extrabold scale-105'
            : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Users className={`w-5 h-5 ${activeTab === 'friends' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">みんなの部屋</span>
      </button>

      {/* 2. Calendar & Daily Memories (カレンダー) */}
      <button
        id="nav-tab-calendar"
        onClick={() => setActiveTab('calendar')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
          activeTab === 'calendar'
            ? 'text-amber-950 font-extrabold scale-105'
            : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Calendar className={`w-5 h-5 ${activeTab === 'calendar' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">カレンダー</span>
      </button>

      {/* 3. Center Decorate Button (飾る) */}
      <button
        id="nav-btn-decorate-center"
        onClick={onOpenPostingModal}
        className="flex flex-col items-center justify-center -mt-4 group cursor-pointer"
        title="部屋に思い出を飾る"
      >
        <div className="w-12 h-12 rounded-full bg-[#3c342b] group-hover:bg-[#28221c] text-white flex items-center justify-center shadow-lg group-active:scale-95 transition-all border-2 border-white ring-2 ring-amber-300/40">
          <Plus className="w-6 h-6 text-amber-300 stroke-[3]" />
        </div>
        <span className="text-[9px] font-bold text-amber-900 mt-0.5 whitespace-nowrap">飾る</span>
      </button>

      {/* 4. Notifications (お知らせ) */}
      <button
        id="nav-tab-notifications"
        onClick={() => setActiveTab('notifications')}
        className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
          activeTab === 'notifications'
            ? 'text-amber-950 font-extrabold scale-105'
            : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Bell className={`w-5 h-5 ${activeTab === 'notifications' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">お知らせ</span>
        {unreadNotificationsCount > 0 && (
          <span className="absolute top-0 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border border-white">
            {unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* 5. My Room (マイルーム) */}
      <button
        id="nav-tab-myroom"
        onClick={() => setActiveTab('myroom')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
          activeTab === 'myroom'
            ? 'text-amber-950 font-extrabold scale-105'
            : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'myroom' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">マイルーム</span>
      </button>
    </nav>
  );
};
