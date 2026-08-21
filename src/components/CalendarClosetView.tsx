import React, { useState } from 'react';
import { UserProfile, RoomObject } from '../types';
import { db, doc, updateDoc } from '../firebase';
import { RoomObjectImage } from './RoomObjectImage';
import {
  Archive,
  Calendar as CalendarIcon,
  Search,
  Handshake,
  Pin,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

interface CalendarClosetViewProps {
  currentUser: UserProfile;
  allUserObjects: RoomObject[];
  onSelectObject: (obj: RoomObject) => void;
  onObjectRestored: (obj: RoomObject) => void;
}

export const CalendarClosetView: React.FC<CalendarClosetViewProps> = ({
  currentUser,
  allUserObjects,
  onSelectObject,
  onObjectRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'closet' | 'calendar'>('closet');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSharedOnly, setFilterSharedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calendar states
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Filter closet items (areaType === 'closet' or all history)
  const closetItems = allUserObjects.filter((obj) => {
    const matchCloset = obj.areaType === 'closet';
    const matchQuery =
      obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (obj.memoryNote && obj.memoryNote.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchShared = !filterSharedOnly || obj.isSharedItem;
    const matchCat = selectedCategory === 'all' || obj.category === selectedCategory;

    return matchCloset && matchQuery && matchShared && matchCat;
  });

  // Restore item to base room
  const handleRestoreToBaseRoom = async (obj: RoomObject) => {
    if (!obj.id) return;
    try {
      await updateDoc(doc(db, 'room_objects', obj.id), {
        areaType: 'base_room',
        isPinned: true,
      });
      onObjectRestored({ ...obj, areaType: 'base_room', isPinned: true });
      alert(`「${obj.name}」を部屋に飾り直しました！`);
    } catch (err) {
      console.error('Restore object error:', err);
    }
  };

  // Calendar logic
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  // Objects on selected calendar day
  const selectedDayObjects = allUserObjects.filter((o) => o.date === selectedDay);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗄️</span>
            <h2 className="text-xl font-bold text-stone-900">思い出のクローゼット ＆ カレンダー</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            過去の全オブジェクトが無制限に保存されています。いつでも普段の部屋へ復元できます。
          </p>
        </div>

        {/* View switcher */}
        <div className="flex bg-stone-200/60 p-1 rounded-2xl border border-stone-300/40 text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('closet')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition-all ${
              activeTab === 'closet' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-purple-600" />
            <span>クローゼット ({closetItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition-all ${
              activeTab === 'calendar' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>カレンダー</span>
          </button>
        </div>
      </div>

      {/* CLOSET VIEW */}
      {activeTab === 'closet' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFilterSharedOnly(!filterSharedOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  filterSharedOnly
                    ? 'bg-sky-50 text-sky-900 border-sky-300 shadow-2xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Handshake className="w-3.5 h-3.5 text-sky-600" />
                <span>おそろいのみ</span>
              </button>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-700 font-medium focus:outline-hidden"
              >
                <option value="all">すべてのカテゴリ</option>
                <option value="wall">ポスター・壁</option>
                <option value="desk">デスク・卓上</option>
                <option value="floor">床・家具</option>
                <option value="shelf">本棚・棚</option>
                <option value="gift">差し入れ</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="思い出や名前で検索..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          {/* Closet Objects Grid */}
          {closetItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {closetItems.map((obj, idx) => (
                <div
                  key={obj.id ? `${obj.id}` : `closet_${idx}`}
                  className="bg-stone-50 rounded-3xl p-4 border border-stone-200 shadow-xs hover:shadow-md transition-all hover:border-purple-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Item Visual Preview */}
                    <div
                      onClick={() => onSelectObject(obj)}
                      className="w-full h-28 rounded-2xl bg-stone-100/70 border border-stone-200 overflow-hidden relative cursor-pointer group flex items-center justify-center p-2"
                    >
                      {obj.imageUrl || obj.customTextureUrl ? (
                        <RoomObjectImage
                          src={obj.imageUrl || obj.customTextureUrl!}
                          alt={obj.name}
                          className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="text-4xl filter drop-shadow-xs">{obj.iconEmoji || '✨'}</span>
                      )}

                      {obj.isSharedItem && (
                        <span className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200 font-bold">
                          🤝 おそろい
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-stone-900 text-xs mt-2.5 truncate">{obj.name}</h4>
                    <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                      {obj.memoryNote || `${obj.date} の思い出`}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400">{obj.date}</span>
                    <button
                      onClick={() => handleRestoreToBaseRoom(obj)}
                      className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 text-[11px] font-semibold transition-colors flex items-center gap-1"
                      title="普段の部屋へ戻す"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>部屋に戻す</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-stone-50 rounded-3xl p-10 border border-stone-200 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-2xl">
                🗄️
              </div>
              <h3 className="font-bold text-stone-800 text-sm">クローゼットは現在空です</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                普段の部屋の上限（10〜12個）を超えたアイテムや、片付けたアイテムがここに安全にストックされます。
              </p>
            </div>
          )}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="md:col-span-2 bg-stone-50 rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-base">
                {year}年 {month + 1}月
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center text-xs text-stone-400 font-medium">
              <span>日</span>
              <span>月</span>
              <span>火</span>
              <span>水</span>
              <span>木</span>
              <span>金</span>
              <span>土</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-14 sm:h-16" />
              ))}

              {Array.from({ length: totalDays }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                  dayNum
                ).padStart(2, '0')}`;
                const isSelected = selectedDay === formattedDate;
                const dayItems = allUserObjects.filter((o) => o.date === formattedDate);

                return (
                  <button
                    key={formattedDate}
                    onClick={() => setSelectedDay(formattedDate)}
                    className={`h-14 sm:h-16 p-1 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-amber-100/80 border-amber-500 shadow-xs'
                        : 'bg-white border-stone-200/80 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-stone-800">{dayNum}</span>
                    {dayItems.length > 0 && (
                      <div className="flex gap-0.5 overflow-hidden">
                        {dayItems.slice(0, 3).map((it, idx) => (
                          <span key={idx} className="text-xs">
                            {it.iconEmoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day's Memories Panel */}
          <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="border-b border-stone-200 pb-3">
              <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">
                Daily Memories
              </span>
              <h3 className="font-bold text-stone-900 text-base">{selectedDay} のオブジェクト</h3>
            </div>

            {selectedDayObjects.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {selectedDayObjects.map((obj, idx) => (
                  <div
                    key={obj.id ? `${obj.id}` : `selected_${idx}`}
                    onClick={() => onSelectObject(obj)}
                    className="p-3 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:border-amber-400 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-xl shrink-0 overflow-hidden p-0.5">
                      {obj.imageUrl || obj.customTextureUrl ? (
                        <RoomObjectImage
                          src={obj.imageUrl || obj.customTextureUrl!}
                          alt={obj.name}
                          className="w-full h-full object-contain filter drop-shadow-2xs"
                        />
                      ) : (
                        obj.iconEmoji
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs text-stone-900 truncate">{obj.name}</h5>
                      <p className="text-[11px] text-stone-500 truncate">{obj.memoryNote}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-400 text-xs">
                この日のオブジェクト記録はありません
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
