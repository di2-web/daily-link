import React from 'react';
import { RoomObject, UserProfile } from '../types';
import { GameRoomCanvas } from './GameRoomCanvas';
import { RoomObjectImage } from './RoomObjectImage';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  ArchiveRestore,
  Pin,
  Heart,
} from 'lucide-react';

interface DayRoomMemoryModalProps {
  currentUser: UserProfile;
  selectedDate: string; // YYYY-MM-DD
  dayObjects: RoomObject[];
  allDatesWithActivity: string[];
  onClose: () => void;
  onSelectDate: (date: string) => void;
  onSelectObject: (obj: RoomObject) => void;
  onRestoreObject?: (obj: RoomObject) => void;
  onPinObject?: (obj: RoomObject) => void;
}

export const DayRoomMemoryModal: React.FC<DayRoomMemoryModalProps> = ({
  currentUser,
  selectedDate,
  dayObjects,
  allDatesWithActivity,
  onClose,
  onSelectDate,
  onSelectObject,
  onRestoreObject,
  onPinObject,
}) => {
  // Format Date for Header
  const dateObj = new Date(selectedDate);
  const formattedTitle = !isNaN(dateObj.getTime())
    ? `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日の部屋`
    : `${selectedDate}の部屋`;

  // Sorted list of dates for prev/next navigation
  const sortedDates = [...allDatesWithActivity].sort();
  const currentIndex = sortedDates.indexOf(selectedDate);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < sortedDates.length - 1;

  const handlePrevDay = () => {
    if (hasPrev) {
      onSelectDate(sortedDates[currentIndex - 1]);
    }
  };

  const handleNextDay = () => {
    if (hasNext) {
      onSelectDate(sortedDates[currentIndex + 1]);
    }
  };

  return (
    <div
      id="day-room-memory-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
    >
      <div className="bg-[#faf8f5] rounded-3xl max-w-xl sm:max-w-2xl w-full border border-stone-300 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Top Bar with Day Navigation */}
        <div className="bg-white px-4 py-3 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-amber-100 text-amber-900">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900">{formattedTitle}</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                  {dayObjects.length} 個の思い出
                </span>
              </div>
              <p className="text-[10px] text-stone-500">この日に飾られていたお部屋のタイムカプセル</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Prev / Next day arrows */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-2xl border border-stone-200">
              <button
                onClick={handlePrevDay}
                disabled={!hasPrev}
                className="p-1.5 rounded-xl hover:bg-white text-stone-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="前の記録日へ"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDay}
                disabled={!hasNext}
                className="p-1.5 rounded-xl hover:bg-white text-stone-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="次の記録日へ"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Reconstructed 3D Isometric Room for this Date */}
          <div className="w-full">
            <GameRoomCanvas
              ownerProfile={{
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                username: currentUser.username,
                photoURL: currentUser.photoURL,
                statusText: `${selectedDate} の思い出`,
                statusEmoji: '📖',
              }}
              isOwner={true}
              objects={dayObjects}
              onSelectObject={onSelectObject}
              specificDateFilter={selectedDate}
              hideControls={false}
            />
          </div>

          {/* List of items decorated on this day */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5 px-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>この日に飾ったアイテム ({dayObjects.length})</span>
            </h4>

            {dayObjects.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-stone-200 text-xs text-stone-500">
                この日のお部屋にはアイテムがありませんでした。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dayObjects.map((obj) => (
                  <div
                    key={obj.id || obj.name}
                    onClick={() => onSelectObject(obj)}
                    className="p-3 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-11 h-11 rounded-xl bg-stone-100/80 border border-stone-200 flex items-center justify-center shrink-0 overflow-hidden p-1">
                        {obj.imageUrl || obj.customTextureUrl ? (
                          <RoomObjectImage
                            src={obj.imageUrl || obj.customTextureUrl!}
                            alt={obj.name}
                            className="w-full h-full object-contain filter drop-shadow-xs"
                          />
                        ) : (
                          <span className="text-2xl">{obj.iconEmoji || '✨'}</span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-stone-900 group-hover:text-amber-900 truncate">
                          {obj.name}
                        </p>
                        <p className="text-[10px] text-stone-500 truncate mt-0.5">
                          {obj.caption || obj.memoryNote || '思い出のアイテム'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {obj.reactions && obj.reactions.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          ❤️ {obj.reactions.length}
                        </span>
                      )}
                      <span className="text-xs text-stone-400 group-hover:text-amber-700">＞</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-stone-100 px-4 py-2.5 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <span>タップするとアイテムの詳細やリアクションを確認できます</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
