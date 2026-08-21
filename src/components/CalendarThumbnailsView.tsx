import React, { useState } from 'react';
import { RoomObject, UserProfile } from '../types';
import { ChevronLeft, ChevronRight, Sparkles, Calendar as CalendarIcon, Eye, DoorOpen } from 'lucide-react';
import { DayRoomMemoryModal } from './DayRoomMemoryModal';
import { RoomObjectImage } from './RoomObjectImage';

interface CalendarThumbnailsViewProps {
  currentUser: UserProfile;
  roomObjects: RoomObject[];
  onSelectObject: (obj: RoomObject) => void;
}

export const CalendarThumbnailsView: React.FC<CalendarThumbnailsViewProps> = ({
  currentUser,
  roomObjects,
  onSelectObject,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayForRoomModal, setSelectedDayForRoomModal] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build calendar matrix
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: { dayNumber: number | null; dateString: string }[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push({ dayNumber: null, dateString: '' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dayNumber: d, dateString: formattedDate });
  }

  // Group objects by date
  const objectsByDate = roomObjects.reduce<Record<string, RoomObject[]>>((acc, obj) => {
    if (!acc[obj.date]) acc[obj.date] = [];
    acc[obj.date].push(obj);
    return acc;
  }, {});

  const allDatesWithActivity = Object.keys(objectsByDate).filter(
    (d) => objectsByDate[d].length > 0
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysObjects = objectsByDate[todayStr] || [];

  return (
    <div id="calendar-thumbnails-view" className="max-w-md sm:max-w-xl mx-auto px-4 pt-4 pb-28 space-y-4">
      {/* 1. Today's Room Quick Card */}
      <div
        onClick={() => setSelectedDayForRoomModal(todayStr)}
        className="bg-gradient-to-br from-[#3d3328] via-[#4f4336] to-[#2e261e] text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-stone-700/50 hover:shadow-xl transition-all cursor-pointer group select-none"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              🛋️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">今日の部屋を振り返る</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold">
                  Today
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                本日飾ったアイテム: {todaysObjects.length} 個
              </p>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-stone-900 transition-colors">
            <DoorOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Calendar Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-amber-100 text-amber-900">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-stone-900">
                {year}年 {month + 1}月
              </h2>
              <p className="text-[11px] text-stone-500">日付をタップするとその日の部屋を振り返れます</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-white text-stone-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-white text-stone-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-stone-400 mb-2">
          <span className="text-rose-500">日</span>
          <span>月</span>
          <span>火</span>
          <span>水</span>
          <span>木</span>
          <span>金</span>
          <span className="text-sky-500">土</span>
        </div>

        {/* Date Matrix with Room Miniatures */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((item, idx) => {
            if (!item.dayNumber) {
              return (
                <div
                  key={`empty_${idx}`}
                  className="aspect-[3/4] rounded-2xl bg-stone-50/50 border border-transparent"
                />
              );
            }

            const dayObjects = objectsByDate[item.dateString] || [];
            const hasActivity = dayObjects.length > 0;
            const primaryObj = dayObjects[0];

            return (
              <div
                key={item.dateString}
                onClick={() => {
                  if (hasActivity) {
                    setSelectedDayForRoomModal(item.dateString);
                  }
                }}
                className={`relative aspect-[3/4] rounded-2xl border flex flex-col justify-between p-1 transition-all ${
                  hasActivity
                    ? 'border-amber-300 bg-amber-50/60 shadow-2xs hover:shadow-md hover:scale-105 cursor-pointer'
                    : 'border-stone-100 bg-stone-50/60 text-stone-400'
                }`}
              >
                {/* Date Number */}
                <div className="flex justify-between items-start">
                  <span
                    className={`text-[10px] font-bold px-1 rounded-md ${
                      hasActivity ? 'text-amber-950 font-extrabold' : 'text-stone-500'
                    }`}
                  >
                    {item.dayNumber}
                  </span>
                  {dayObjects.length > 1 && (
                    <span className="text-[8px] px-1 rounded-full bg-amber-200 text-amber-900 font-bold">
                      +{dayObjects.length - 1}
                    </span>
                  )}
                </div>

                {/* Miniature Room Snapshot */}
                {hasActivity ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {primaryObj.imageUrl || primaryObj.customTextureUrl ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-stone-200/80 shadow-2xs flex items-center justify-center p-0.5">
                        <RoomObjectImage
                          src={primaryObj.imageUrl || primaryObj.customTextureUrl!}
                          alt={primaryObj.name}
                          className="w-full h-full object-contain filter drop-shadow-2xs"
                        />
                      </div>
                    ) : (
                      <span className="text-xl filter drop-shadow-2xs">
                        {primaryObj.iconEmoji}
                      </span>
                    )}
                    <span className="text-[8px] font-bold text-stone-700 truncate max-w-full px-0.5 mt-0.5">
                      {primaryObj.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Summary Card */}
      <div className="bg-white rounded-3xl p-4 border border-stone-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center text-xl">
            🌱
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-stone-900">
              今月の記録: {roomObjects.length} 個のアイテム
            </h4>
            <p className="text-[11px] text-stone-500">
              日々の積み重ねがお部屋の歴史として保存されています✨
            </p>
          </div>
        </div>
      </div>

      {/* Day Room Memory Modal (When user clicks on any active date) */}
      {selectedDayForRoomModal && (
        <DayRoomMemoryModal
          currentUser={currentUser}
          selectedDate={selectedDayForRoomModal}
          dayObjects={objectsByDate[selectedDayForRoomModal] || []}
          allDatesWithActivity={allDatesWithActivity}
          onClose={() => setSelectedDayForRoomModal(null)}
          onSelectDate={(newDate) => setSelectedDayForRoomModal(newDate)}
          onSelectObject={onSelectObject}
        />
      )}
    </div>
  );
};
