import React, { useState } from 'react';
import { UserProfile, RoomObject, FriendRelation } from '../types';
import {
  User,
  Settings,
  DoorOpen,
  Sparkles,
  Users,
  Copy,
  Check,
  LogOut,
  Shirt,
  Heart,
  Share2,
  Smile,
  ShieldCheck,
  FileText,
  Info,
} from 'lucide-react';

interface MyPageViewProps {
  currentUser: UserProfile;
  roomObjects: RoomObject[];
  friendsCount: number;
  onOpenMyRoom: () => void;
  onOpenFriendManager: () => void;
  onOpenProfileEdit: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onLogout: () => void;
}

export const MyPageView: React.FC<MyPageViewProps> = ({
  currentUser,
  roomObjects,
  friendsCount,
  onOpenMyRoom,
  onOpenFriendManager,
  onOpenProfileEdit,
  onOpenPrivacy,
  onOpenTerms,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    const textToCopy = currentUser.username || `@${currentUser.uid.slice(0, 6)}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md sm:max-w-xl mx-auto px-4 pt-4 pb-28 space-y-4">
      {/* 1. Profile Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-300 shadow-xs">
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-stone-900">
                {currentUser.displayName}
              </h2>
              <span className="text-xs text-stone-400 font-mono">
                {currentUser.username || `@${currentUser.uid.slice(0, 6)}`}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{currentUser.bio}</p>
          </div>
        </div>

        <button
          onClick={onOpenProfileEdit}
          className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
          title="プロフィール設定"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* 2. "あなたの部屋 ＞" Big Entrance Card (Image 3 - 7) */}
      <div
        onClick={onOpenMyRoom}
        className="bg-gradient-to-br from-[#3c342b] via-[#4d4237] to-[#2b241c] text-white rounded-3xl p-5 shadow-lg border border-stone-700/50 hover:shadow-xl transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              🛋️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">あなたの部屋</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold">
                  Enter
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                現在のアイテム数: {roomObjects.length} 個
              </p>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-stone-900 transition-colors">
            <DoorOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Monthly Reflection Summary (Image 3 - 7) */}
      <div className="bg-amber-50/80 rounded-3xl p-4 sm:p-5 border border-amber-200/80 shadow-2xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">✨</span>
          <h4 className="font-bold text-xs sm:text-sm text-stone-900">今月のふりかえり</h4>
        </div>
        <p className="text-xs text-stone-700 leading-relaxed">
          今月は <span className="font-bold text-amber-900">{roomObjects.length} 回</span>{' '}
          日常のできごとを記録しました。いろんなことがあって、お部屋が素敵に育っています🌱
        </p>
      </div>

      {/* 4. Friends & Management Options */}
      <div className="bg-white rounded-3xl border border-stone-200 divide-y divide-stone-100 shadow-2xs overflow-hidden">
        {/* Manage Friends */}
        <button
          onClick={onOpenFriendManager}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-900">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">親しい友達を管理・招待</p>
              <p className="text-[10px] text-stone-500">現在 {friendsCount} 人の友達とつながり中</p>
            </div>
          </div>
          <span className="text-xs text-stone-400">＞</span>
        </button>

        {/* Copy User ID */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-stone-100 text-stone-700">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">マイIDをコピー</p>
              <p className="text-[10px] text-stone-400 font-mono">
                {currentUser.username || `@${currentUser.uid.slice(0, 6)}`}
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyId}
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">コピー済</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>コピー</span>
              </>
            )}
          </button>
        </div>

        {/* Privacy Policy */}
        <button
          onClick={onOpenPrivacy}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">プライバシーポリシー</p>
              <p className="text-[10px] text-stone-500">個人情報の取扱い・Google OAuthポリシー</p>
            </div>
          </div>
          <span className="text-xs text-stone-400">＞</span>
        </button>

        {/* Terms of Service */}
        <button
          onClick={onOpenTerms}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-stone-100 text-stone-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">利用規約</p>
              <p className="text-[10px] text-stone-500">サービスのご利用条件・AI免責事項</p>
            </div>
          </div>
          <span className="text-xs text-stone-400">＞</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full p-4 flex items-center gap-3 hover:bg-rose-50/50 transition-colors cursor-pointer text-left text-rose-600"
        >
          <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
            <LogOut className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold">ログアウト</p>
        </button>
      </div>

      {/* App & Operator Info Card */}
      <div className="p-4 rounded-3xl bg-stone-100/70 border border-stone-200/80 text-center space-y-1">
        <p className="text-xs font-bold text-stone-700">Roomon（ルーモン） v1.0</p>
        <p className="text-[11px] text-stone-500">
          お問い合わせ: <a href="mailto:di0119264@gmail.com" className="text-amber-900 underline font-medium">di0119264@gmail.com</a>
        </p>
      </div>
    </div>
  );
};
