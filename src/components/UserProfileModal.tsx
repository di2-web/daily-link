import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { db, doc, setDoc } from '../firebase';
import { X, User, LogOut, Check, Sparkles, Tag, Plus, Camera, Upload, Loader2, RefreshCw } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
  onOpenFriendManager: () => void;
  onLogout?: () => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  onOpenFriendManager,
  onLogout,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [photoURL, setPhotoURL] = useState(currentUser.photoURL || DEFAULT_AVATARS[0]);
  const [categories, setCategories] = useState<string[]>(
    currentUser.customShareCategories || ['親友', '部活', '家族', 'パートナー']
  );
  const [newCatInput, setNewCatInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [avatarGenPrompt, setAvatarGenPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddCategory = () => {
    if (!newCatInput.trim() || categories.includes(newCatInput.trim())) return;
    setCategories([...categories, newCatInput.trim()]);
    setNewCatInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  // Convert uploaded user photo to illustrated chibi avatar
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      await generateAvatarFromPhoto(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const generateAvatarFromPhoto = async (photoBase64?: string) => {
    setIsGeneratingAvatar(true);
    try {
      const res = await fetch('/api/generate-avatar-illustration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPhotoBase64: photoBase64,
          stylePrompt: avatarGenPrompt || 'cute cozy chibi aesthetic, friendly anime style, warm lighting',
          displayName: displayName || currentUser.displayName,
        }),
      });

      const data = await res.json();
      if (data.avatarUrl) {
        setPhotoURL(data.avatarUrl);
      } else {
        alert('アバターの生成に失敗しました。もう一度お試しください。');
      }
    } catch (err) {
      console.error('Avatar generation error:', err);
      alert('通信エラーが発生しました。');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated: UserProfile = {
        ...currentUser,
        displayName: displayName.trim() || 'ユーザー',
        bio: bio.trim(),
        photoURL,
        customShareCategories: categories,
      };

      await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      onProfileUpdated(updated);
      alert('プロフィールを保存しました。');
      onClose();
    } catch (err) {
      console.error('Update profile error:', err);
      alert('プロフィールの保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    onClose();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-stone-50 rounded-3xl max-w-md w-full overflow-hidden border border-stone-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-100/60">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-base">プロフィール ＆ アバター設定</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Avatar AI Photo to Chibi Illustration Section */}
          <div className="p-4 rounded-2xl bg-white border border-amber-200/70 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-amber-950">
              📸 自分を写真に撮ってイラスト化
            </label>
            
            <div className="flex items-center gap-4">
              {/* Current Preview */}
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500 ring-2 ring-amber-300 shadow-md shrink-0 bg-stone-100">
                <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                {isGeneratingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  capture="user"
                  className="hidden"
                />
                
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isGeneratingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>写真を撮る / 選択</span>
                  </button>

                  <button
                    type="button"
                    disabled={isGeneratingAvatar}
                    onClick={() => generateAvatarFromPhoto()}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                    title="AIイラストを再生成"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>AIおまかせ</span>
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 leading-tight">
                  あなたの写真をAIが分析し、可愛いチビキャラ風イラストに変換してお部屋に配置します。
                </p>
              </div>
            </div>

            {/* Presets fallback */}
            <div className="pt-2 border-t border-stone-100">
              <span className="text-[10px] text-stone-400 font-medium block mb-1.5">プリセットから選ぶ:</span>
              <div className="flex gap-2">
                {DEFAULT_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoURL(url)}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-transform ${
                      photoURL === url ? 'border-amber-600 scale-105 shadow-xs' : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">名前・ニックネーム</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">部屋の紹介文（ひとこと）</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="例: まったり音楽とカフェが好きです"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Custom Closed Categories */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              公開グループカテゴリ設定
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-xl bg-amber-100/80 text-amber-900 text-xs font-medium flex items-center gap-1"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="新しいグループ名（例: 軽音部）"
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-medium cursor-pointer"
              >
                追加
              </button>
            </div>
          </div>

          {/* Friend Manager shortcut button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFriendManager();
              }}
              className="w-full py-2.5 rounded-2xl bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
            >
              🤝 友達リストの管理・招待リンク
            </button>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1 text-xs text-rose-600 hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ログアウト</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 shadow-sm"
            >
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
