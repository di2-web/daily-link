import React, { useState } from 'react';
import { UserProfile, RoomObject } from '../types';
import { generateSharedMatchItem } from '../lib/geminiApi';
import {
  supabaseCreateSharedMatch,
  supabaseFindSharedMatch,
  supabaseJoinSharedMatch,
  supabaseSaveRoomObject,
} from '../lib/supabase';
import { X, Handshake, Sparkles, Key, Users, CheckCircle2, Loader2, Copy, Check } from 'lucide-react';

interface SharedMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  selectedDate: string;
  onMatchComplete: (createdItem: RoomObject) => void;
}

export const SharedMatchModal: React.FC<SharedMatchModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedDate,
  onMatchComplete,
}) => {
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [passCode, setPassCode] = useState('');
  const [momentContext, setMomentContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdMatchCode, setCreatedMatchCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Step 1: Create a shared passcode session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passCode.trim()) {
      alert('合言葉（英数字や数字など）を入力してください。');
      return;
    }

    setLoading(true);
    try {
      // Generate AI item template based on moment context
      const aiItem = await generateSharedMatchItem({
        passCode: passCode.trim().toUpperCase(),
        creatorName: currentUser.displayName,
        momentContext: momentContext.trim(),
      });

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      const matchId = await supabaseCreateSharedMatch({
        passCode: passCode.trim().toUpperCase(),
        creatorId: currentUser.uid,
        creatorDisplayName: currentUser.displayName,
        expiresAt,
        matchedUserIds: [currentUser.uid],
        matchedUserNames: [currentUser.displayName],
        objectTemplate: aiItem,
      });

      if (!matchId) {
        throw new Error('Failed to create match session');
      }

      // Place in creator's base room
      const newRoomObject: Omit<RoomObject, 'id'> = {
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName,
        userPhotoURL: currentUser.photoURL,
        assetId: `shared_${Date.now()}`,
        name: `【おそろい】${aiItem.name}`,
        category: aiItem.category || 'hobby',
        placementSlot: aiItem.placementSlot || 'desk',
        iconEmoji: aiItem.iconEmoji || '🤝',
        x: aiItem.suggestedX || 50,
        y: aiItem.suggestedY || 65,
        memoryNote: `合言葉「${passCode.trim().toUpperCase()}」でおそろい作成: ${aiItem.memoryNote}`,
        date: selectedDate,
        areaType: 'base_room',
        isPinned: true,
        isSharedItem: true,
        sharedMatchId: matchId,
        sharedFriendNames: [currentUser.displayName],
        createdAt: new Date().toISOString(),
      };

      const savedObj = await supabaseSaveRoomObject(newRoomObject);
      onMatchComplete(savedObj);

      setCreatedMatchCode(passCode.trim().toUpperCase());
    } catch (err) {
      console.error('Create match error:', err);
      alert('合言葉セッションの作成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Join an existing passcode session
  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passCode.trim()) {
      alert('合言葉を入力してください。');
      return;
    }

    setLoading(true);
    try {
      const match = await supabaseFindSharedMatch(passCode.trim().toUpperCase());

      if (!match) {
        alert(`合言葉「${passCode}」のセッションが見つかりませんでした。友人に合言葉を確認してください。`);
        setLoading(false);
        return;
      }

      // Check expiration
      if (new Date(match.expiresAt).getTime() < Date.now()) {
        alert('この合言葉セッションは有効期限（24時間）が切れています。');
        setLoading(false);
        return;
      }

      // Join session in Supabase
      const joinedMatch = await supabaseJoinSharedMatch(match.id, currentUser);

      const template = match.objectTemplate || {
        name: 'おそろいのインテリア',
        category: 'desk',
        placementSlot: 'desk',
        iconEmoji: '🤝',
        memoryNote: '友達と合言葉でつながった思い出',
      };

      // Add to current user's room
      const newRoomObject: Omit<RoomObject, 'id'> = {
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName,
        userPhotoURL: currentUser.photoURL,
        assetId: `shared_${Date.now()}`,
        name: `【おそろい】${template.name}`,
        category: template.category,
        placementSlot: template.placementSlot || 'desk',
        iconEmoji: template.iconEmoji || '🤝',
        x: (template as any).suggestedX || 50,
        y: (template as any).suggestedY || 65,
        memoryNote: `合言葉「${passCode.trim().toUpperCase()}」でおそろい作成: ${template.memoryNote}`,
        date: selectedDate,
        areaType: 'base_room',
        isPinned: true,
        isSharedItem: true,
        sharedMatchId: match.id,
        sharedFriendNames: joinedMatch?.matchedUserNames || [...(match.matchedUserNames || []), currentUser.displayName],
        createdAt: new Date().toISOString(),
      };

      const savedObj = await supabaseSaveRoomObject(newRoomObject);
      onMatchComplete(savedObj);

      alert(`🎉 合言葉「${passCode}」が一致しました！「${template.name}」があなたの部屋に配置されました！`);
      onClose();
    } catch (err) {
      console.error('Join match error:', err);
      alert('合言葉の参加に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!createdMatchCode) return;
    navigator.clipboard.writeText(createdMatchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-stone-50 rounded-3xl max-w-md w-full overflow-hidden border border-stone-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-100/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤝</span>
            <div>
              <h3 className="font-bold text-stone-900 text-base">合言葉でおそろいインテリア</h3>
              <p className="text-xs text-stone-500">同じ合言葉を入力した友達全員の部屋に配置されます</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        {!createdMatchCode && (
          <div className="flex border-b border-stone-200 bg-stone-100/40 p-1">
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === 'join' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              合言葉を入力して受け取る
            </button>
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === 'create' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              新しい合言葉を発行する
            </button>
          </div>
        )}

        <div className="p-6">
          {createdMatchCode ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-3xl">
                ✨
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-lg">合言葉を発行しました！</h4>
                <p className="text-xs text-stone-500 mt-1">
                  友達にこの合言葉をLINEや対面で伝えてください。
                  入力すると友達の部屋にも同じアイテムが届きます。
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="font-mono text-2xl font-black text-amber-900 tracking-wider">
                  {createdMatchCode}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 rounded-xl bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-[11px] text-stone-400">有効期限: 24時間</p>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
              >
                部屋に戻る
              </button>
            </div>
          ) : tab === 'join' ? (
            <form onSubmit={handleJoinSession} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  友達から聞いた合言葉
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={passCode}
                    onChange={(e) => setPassCode(e.target.value)}
                    placeholder="例: 0811, BBQ, TRIP2026"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-stone-200 text-stone-800 text-sm font-mono tracking-wide focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !passCode.trim()}
                className="w-full py-3.5 rounded-2xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
                <span>合言葉を照合しておそろいアイテムを受け取る</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  好きな合言葉を決める（英数字や数字など）
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={passCode}
                    onChange={(e) => setPassCode(e.target.value)}
                    placeholder="例: 0811, FES, CAMP"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-stone-200 text-stone-800 text-sm font-mono tracking-wide focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  どんな思い出・出来事ですか？（AIがアイテムを提案）
                </label>
                <input
                  type="text"
                  value={momentContext}
                  onChange={(e) => setMomentContext(e.target.value)}
                  placeholder="例: フェスに行った、深夜までファミレスで話した"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !passCode.trim()}
                className="w-full py-3.5 rounded-2xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
                <span>合言葉を発行しておそろいを作る</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
