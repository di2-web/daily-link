import React, { useState } from 'react';
import { AppNotification } from '../types';
import { Bell, Flower2, Coffee, Footprints, Heart, Gift, Sparkles, Check, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onSelectNotification?: (notification: AppNotification) => void;
  onAcceptFriendRequest?: (senderUid: string) => Promise<void>;
  onDeclineFriendRequest?: (senderUid: string) => Promise<void>;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
}) => {
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  const handleAccept = async (e: React.MouseEvent, senderUid: string) => {
    e.stopPropagation();
    if (!onAcceptFriendRequest) return;
    setProcessingUid(senderUid);
    try {
      await onAcceptFriendRequest(senderUid);
    } finally {
      setProcessingUid(null);
    }
  };

  const handleDecline = async (e: React.MouseEvent, senderUid: string) => {
    e.stopPropagation();
    if (!onDeclineFriendRequest) return;
    setProcessingUid(senderUid);
    try {
      await onDeclineFriendRequest(senderUid);
    } finally {
      setProcessingUid(null);
    }
  };

  return (
    <div className="max-w-md sm:max-w-xl mx-auto px-4 pt-4 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <span>お知らせ</span>
            <span className="text-base">🔔</span>
          </h2>
          <p className="text-xs text-stone-500">リアクションや友達申請のお知らせ</p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-amber-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>すべて既読にする</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-stone-200 divide-y divide-stone-100 shadow-2xs overflow-hidden">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const isFriendRequest = notif.type === 'friend_request';

            return (
              <div
                key={notif.id}
                onClick={() => onSelectNotification?.(notif)}
                className={`p-4 flex flex-col gap-2.5 transition-colors cursor-pointer hover:bg-stone-50/80 ${
                  !notif.read ? 'bg-amber-50/40' : ''
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Sender Avatar */}
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-stone-200 shrink-0">
                    <img
                      src={notif.senderPhotoURL}
                      alt={notif.senderName}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute -bottom-1 -right-1 text-xs">{notif.iconEmoji}</span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-900">{notif.title}</h4>
                      <span className="text-[10px] text-stone-400">
                        {new Date(notif.createdAt).toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      {notif.description}
                    </p>
                    {notif.targetObjectName && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold">
                        📍 {notif.targetObjectName}
                      </span>
                    )}
                  </div>

                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2" />
                  )}
                </div>

                {/* Interactive Action for Friend Requests */}
                {isFriendRequest && onAcceptFriendRequest && (
                  <div className="ml-13 flex items-center gap-2 pt-1">
                    <button
                      onClick={(e) => handleAccept(e, notif.senderUid)}
                      disabled={processingUid === notif.senderUid}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {processingUid === notif.senderUid ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>承認する</span>
                    </button>
                    {onDeclineFriendRequest && (
                      <button
                        onClick={(e) => handleDecline(e, notif.senderUid)}
                        disabled={processingUid === notif.senderUid}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-600 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <span>拒否</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-stone-400 space-y-2">
            <div className="text-3xl">📭</div>
            <p className="text-xs font-bold">まだ新しいお知らせはありません</p>
            <p className="text-[11px]">お友達の部屋に遊びに行って花やコーヒーを置いてみましょう！</p>
          </div>
        )}
      </div>
    </div>
  );
};
