import React, { useState } from 'react';
import { UserProfile, FriendRelation, AppNotification } from '../types';
import { db, collection, addDoc, doc, deleteDoc, updateDoc, getDocs, query, where } from '../firebase';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Copy,
  Check,
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

interface FriendManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  friendsList: FriendRelation[];
  onFriendsUpdated: (updatedList: FriendRelation[]) => void;
}

export const FriendManager: React.FC<FriendManagerProps> = ({
  isOpen,
  onClose,
  currentUser,
  friendsList,
  onFriendsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'received' | 'sent' | 'invite'>('friends');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchFeedback, setSearchFeedback] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('親友');
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);

  if (!isOpen) return null;

  const inviteUrl = `${window.location.origin}?invite_from=${currentUser.uid}&name=${encodeURIComponent(
    currentUser.displayName
  )}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Split friends list into categories
  const acceptedFriends = friendsList.filter(
    (f) => f.status === 'accepted' || (!f.status && f.friendUid)
  );
  const receivedRequests = friendsList.filter(
    (f) => f.status === 'pending' && f.requestedBy !== currentUser.uid
  );
  const sentRequests = friendsList.filter(
    (f) => f.status === 'pending' && f.requestedBy === currentUser.uid
  );

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    const qText = searchQuery.trim();
    if (!qText) return;

    setSearching(true);
    setSearchFeedback('');
    setSearchResults([]);

    try {
      const usersRef = collection(db, 'users');
      const formattedUsername = qText.startsWith('@') ? qText : `@${qText}`;

      const qUsername = query(usersRef, where('username', '==', formattedUsername));
      const qName = query(usersRef, where('displayName', '==', qText));

      const [snapUsername, snapName] = await Promise.all([
        getDocs(qUsername),
        getDocs(qName),
      ]);

      const foundMap = new Map<string, UserProfile>();
      snapUsername.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u.uid !== currentUser.uid) foundMap.set(u.uid, u);
      });
      snapName.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u.uid !== currentUser.uid) foundMap.set(u.uid, u);
      });

      const list = Array.from(foundMap.values());
      setSearchResults(list);
      if (list.length === 0) {
        setSearchFeedback(
          '一致するユーザーが見つかりませんでした。ユーザー名（例: @username）を正確に入力してください。'
        );
      }
    } catch (err) {
      console.error('Search user error:', err);
      setSearchFeedback('ユーザーの検索中にエラーが発生しました。');
    } finally {
      setSearching(false);
    }
  };

  // Send Friend Request (相互承認のための申請送信)
  const handleSendFriendRequest = async (targetUser: UserProfile) => {
    if (targetUser.uid === currentUser.uid) {
      alert('自分自身に友達申請を送ることはできません。');
      return;
    }

    // Check if already friends or requested
    const existing = friendsList.find((f) => f.friendUid === targetUser.uid);
    if (existing) {
      if (existing.status === 'accepted') {
        alert('すでに相互友達です。');
        return;
      }
      if (existing.status === 'pending' && existing.requestedBy === currentUser.uid) {
        alert('すでに友達申請を送信済みです。相手の承認をお待ちください。');
        return;
      }
      if (existing.status === 'pending' && existing.requestedBy !== currentUser.uid) {
        // Auto accept if other user already requested us!
        await handleAcceptRequest(existing);
        return;
      }
    }

    setActionLoadingUid(targetUser.uid);

    try {
      const now = new Date().toISOString();

      // 1. Create document for currentUser
      const myDocRef = await addDoc(collection(db, 'friends'), {
        userId: currentUser.uid,
        friendUid: targetUser.uid,
        friendDisplayName: targetUser.displayName,
        friendUsername: targetUser.username,
        friendPhotoURL: targetUser.photoURL,
        friendBio: targetUser.bio || '親しい友達の部屋',
        status: 'pending',
        requestedBy: currentUser.uid,
        assignedCategories: [selectedCategory],
        statusText: targetUser.latestStatus?.text || '',
        statusEmoji: targetUser.latestStatus?.emoji || '🌱',
        createdAt: now,
      });

      // 2. Create document for targetUser
      await addDoc(collection(db, 'friends'), {
        userId: targetUser.uid,
        friendUid: currentUser.uid,
        friendDisplayName: currentUser.displayName,
        friendUsername: currentUser.username,
        friendPhotoURL: currentUser.photoURL,
        friendBio: currentUser.bio || '親しい友達の部屋',
        status: 'pending',
        requestedBy: currentUser.uid,
        assignedCategories: ['親友'],
        statusText: currentUser.latestStatus?.text || '',
        statusEmoji: currentUser.latestStatus?.emoji || '🌱',
        createdAt: now,
      });

      // 3. Create notification for targetUser
      await addDoc(collection(db, 'notifications'), {
        userId: targetUser.uid,
        type: 'friend_request',
        title: '友達申請が届きました 💌',
        description: `${currentUser.displayName}さんから友達申請が届きました。承認するとお互いのお部屋を行き来できるようになります。`,
        iconEmoji: '🏡',
        senderUid: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhotoURL: currentUser.photoURL,
        read: false,
        createdAt: now,
      });

      const updatedSent: FriendRelation = {
        id: myDocRef.id,
        userId: currentUser.uid,
        friendUid: targetUser.uid,
        friendDisplayName: targetUser.displayName,
        friendUsername: targetUser.username,
        friendPhotoURL: targetUser.photoURL,
        friendBio: targetUser.bio || '親しい友達の部屋',
        status: 'pending',
        requestedBy: currentUser.uid,
        assignedCategories: [selectedCategory],
        createdAt: now,
      };

      onFriendsUpdated([...friendsList, updatedSent]);
      setSearchResults((prev) => prev.filter((u) => u.uid !== targetUser.uid));
      setSearchQuery('');
      setActiveTab('sent');
      alert(`「${targetUser.displayName}」さんに友達申請を送信しました！相手が承認するとお部屋がつながります。`);
    } catch (err) {
      console.error('Send friend request error:', err);
      alert('友達申請の送信に失敗しました。');
    } finally {
      setActionLoadingUid(null);
    }
  };

  // Accept Friend Request (相互友達の承認)
  const handleAcceptRequest = async (relation: FriendRelation) => {
    setActionLoadingUid(relation.friendUid);
    try {
      const now = new Date().toISOString();

      // 1. Update currentUser's relation to accepted
      if (relation.id) {
        await updateDoc(doc(db, 'friends', relation.id), {
          status: 'accepted',
          acceptedAt: now,
        });
      }

      // 2. Find and update the other user's relation to accepted
      const otherQuery = query(
        collection(db, 'friends'),
        where('userId', '==', relation.friendUid),
        where('friendUid', '==', currentUser.uid)
      );
      const otherSnap = await getDocs(otherQuery);
      for (const d of otherSnap.docs) {
        await updateDoc(doc(db, 'friends', d.id), {
          status: 'accepted',
          acceptedAt: now,
        });
      }

      // 3. Send notification to the requester
      await addDoc(collection(db, 'notifications'), {
        userId: relation.friendUid,
        type: 'friend_accept',
        title: '友達申請が承認されました！🎉',
        description: `${currentUser.displayName}さんと相互友達になりました！お部屋を訪れてみましょう🏡`,
        iconEmoji: '🤝',
        senderUid: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhotoURL: currentUser.photoURL,
        read: false,
        createdAt: now,
      });

      // Update local state
      const updated = friendsList.map((f) =>
        f.friendUid === relation.friendUid
          ? { ...f, status: 'accepted' as const, acceptedAt: now }
          : f
      );
      onFriendsUpdated(updated);
      setActiveTab('friends');
      alert(`「${relation.friendDisplayName}」さんの申請を承認しました！相互友達になりました。`);
    } catch (err) {
      console.error('Accept friend error:', err);
      alert('承認処理中にエラーが発生しました。');
    } finally {
      setActionLoadingUid(null);
    }
  };

  // Decline or Cancel Request (申請拒否・キャンセル・解除)
  const handleRemoveOrDecline = async (
    relation: FriendRelation,
    confirmMsg?: string
  ) => {
    if (confirmMsg && !confirm(confirmMsg)) return;

    setActionLoadingUid(relation.friendUid);
    try {
      // Delete currentUser's relation doc
      if (relation.id) {
        await deleteDoc(doc(db, 'friends', relation.id));
      }

      // Delete other user's relation doc
      const otherQuery = query(
        collection(db, 'friends'),
        where('userId', '==', relation.friendUid),
        where('friendUid', '==', currentUser.uid)
      );
      const otherSnap = await getDocs(otherQuery);
      for (const d of otherSnap.docs) {
        await deleteDoc(doc(db, 'friends', d.id));
      }

      onFriendsUpdated(friendsList.filter((f) => f.friendUid !== relation.friendUid));
    } catch (err) {
      console.error('Remove relation error:', err);
      alert('処理中にエラーが発生しました。');
    } finally {
      setActionLoadingUid(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-stone-50 rounded-3xl max-w-md w-full overflow-hidden border border-stone-200 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-100/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-1.5">
                <span>相互友達の管理</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </h3>
              <p className="text-[11px] text-stone-500">
                お互いに承認した相手のみとお部屋を行き来できます
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-stone-200 bg-white text-xs font-bold px-2 pt-1">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'friends'
                ? 'border-amber-800 text-amber-950 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>友達 ({acceptedFriends.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 relative ${
              activeTab === 'received'
                ? 'border-amber-800 text-amber-950 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>届いた申請</span>
            {receivedRequests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-extrabold">
                {receivedRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'sent'
                ? 'border-amber-800 text-amber-950 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>申請中 ({sentRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'invite'
                ? 'border-amber-800 text-amber-950 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>招待 / 検索</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: ACCEPTED MUTUAL FRIENDS */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                🌿 相互承認された友達のお部屋のみがホームに表示され、お互いに訪問できます。非公開アイテムは相手には見えません。
              </div>

              {acceptedFriends.length > 0 ? (
                <div className="space-y-2.5">
                  {acceptedFriends.map((f) => (
                    <div
                      key={f.id || f.friendUid}
                      className="p-3 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={f.friendPhotoURL}
                          alt={f.friendDisplayName}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-xs text-stone-900 truncate">
                              {f.friendDisplayName}
                            </h5>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200/60">
                              相互友達
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-400 font-mono truncate">
                            {f.friendUsername || `@${f.friendUid.slice(0, 6)}`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleRemoveOrDecline(
                            f,
                            `「${f.friendDisplayName}」さんとの相互友達を解除しますか？解除するとお互いの部屋が見えなくなります。`
                          )
                        }
                        disabled={actionLoadingUid === f.friendUid}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="友達解除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 rounded-3xl border border-dashed border-stone-300 bg-white/70 space-y-2">
                  <div className="text-3xl">🏡</div>
                  <p className="text-xs font-bold text-stone-700">まだ相互友達がいません</p>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                    「招待 / 検索」タブから専用招待リンクをシェアするか、ユーザー名で友達申請を送りましょう！
                  </p>
                  <button
                    onClick={() => setActiveTab('invite')}
                    className="mt-2 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-amber-800 text-white text-xs font-bold shadow-xs cursor-pointer hover:bg-amber-900"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>友達を追加する</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECEIVED REQUESTS */}
          {activeTab === 'received' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 font-medium">
                あなたに届いた友達申請です。承認するとお互いにお部屋を行き来できるようになります。
              </p>

              {receivedRequests.length > 0 ? (
                <div className="space-y-2.5">
                  {receivedRequests.map((f) => (
                    <div
                      key={f.id || f.friendUid}
                      className="p-3.5 rounded-2xl bg-white border border-amber-300/80 shadow-xs flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={f.friendPhotoURL}
                          alt={f.friendDisplayName}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs text-stone-900 truncate">
                            {f.friendDisplayName}
                          </h5>
                          <p className="text-[10px] text-stone-500 truncate">
                            {f.friendUsername || `@${f.friendUid.slice(0, 6)}`} からの申請
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-stone-100">
                        <button
                          onClick={() => handleAcceptRequest(f)}
                          disabled={actionLoadingUid === f.friendUid}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingUid === f.friendUid ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>承認して部屋をつなぐ</span>
                        </button>
                        <button
                          onClick={() => handleRemoveOrDecline(f)}
                          disabled={actionLoadingUid === f.friendUid}
                          className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-600 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <span>拒否</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 rounded-3xl border border-dashed border-stone-300 bg-white/70 space-y-1">
                  <div className="text-3xl">📬</div>
                  <p className="text-xs font-bold text-stone-600">現在、届いている申請はありません</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SENT REQUESTS */}
          {activeTab === 'sent' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 font-medium">
                あなたが送信した友達申請です。相手が承認するまでお部屋は表示されません。
              </p>

              {sentRequests.length > 0 ? (
                <div className="space-y-2.5">
                  {sentRequests.map((f) => (
                    <div
                      key={f.id || f.friendUid}
                      className="p-3 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={f.friendPhotoURL}
                          alt={f.friendDisplayName}
                          className="w-9 h-9 rounded-xl object-cover border border-stone-200"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-stone-900 truncate">
                            {f.friendDisplayName}
                          </h5>
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md font-medium border border-amber-200/60">
                            <Clock className="w-2.5 h-2.5" />
                            <span>相手の承認待ち</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleRemoveOrDecline(f, `「${f.friendDisplayName}」さんへの申請を取り消しますか？`)
                        }
                        disabled={actionLoadingUid === f.friendUid}
                        className="px-2.5 py-1 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 rounded-3xl border border-dashed border-stone-300 bg-white/70 space-y-1">
                  <div className="text-3xl">⏳</div>
                  <p className="text-xs font-bold text-stone-600">承認待ちの申請はありません</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INVITE LINK & USER SEARCH */}
          {activeTab === 'invite' && (
            <div className="space-y-4">
              {/* 1. Dedicated Invite Link */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5">
                <h4 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                  <span>🔗</span> あなたの専用招待リンク
                </h4>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  リンクを親しい友達（LINEなど）に送ると、相手がクリックして承認するだけで相互友達になれます。
                </p>
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-[11px] text-stone-600 truncate font-mono"
                  />
                  <button
                    onClick={handleCopyInvite}
                    className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors shadow-2xs cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'コピー済' : 'コピー'}</span>
                  </button>
                </div>
              </div>

              {/* 2. User Search */}
              <form
                onSubmit={handleSearchUsers}
                className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-2xs"
              >
                <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-stone-600" />
                  <span>ユーザー名検索で申請を送る</span>
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ユーザー名（例: @username または 名前）"
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                  />
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                    className="px-3.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    {searching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>検索</span>
                  </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="pt-2 space-y-2 border-t border-stone-200">
                    <p className="text-[11px] font-bold text-stone-600">
                      検索結果 ({searchResults.length} 件):
                    </p>
                    {searchResults.map((user) => {
                      const isAlreadyFriend = acceptedFriends.some(
                        (f) => f.friendUid === user.uid
                      );
                      const isPendingSent = sentRequests.some(
                        (f) => f.friendUid === user.uid
                      );
                      const isPendingReceived = receivedRequests.some(
                        (f) => f.friendUid === user.uid
                      );

                      return (
                        <div
                          key={user.uid}
                          className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={user.photoURL}
                              alt={user.displayName}
                              className="w-8 h-8 rounded-full object-cover border border-stone-200"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-900 truncate">
                                {user.displayName}
                              </p>
                              <p className="text-[10px] text-stone-500 truncate">
                                {user.username || `@${user.uid.slice(0, 6)}`}
                              </p>
                            </div>
                          </div>

                          {isAlreadyFriend ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                              相互友達
                            </span>
                          ) : isPendingSent ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                              申請中
                            </span>
                          ) : isPendingReceived ? (
                            <button
                              type="button"
                              onClick={() => {
                                const rel = receivedRequests.find((f) => f.friendUid === user.uid);
                                if (rel) handleAcceptRequest(rel);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-xs cursor-pointer hover:bg-emerald-700"
                            >
                              承認する
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendFriendRequest(user)}
                              disabled={actionLoadingUid === user.uid}
                              className="px-2.5 py-1 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              {actionLoadingUid === user.uid ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserPlus className="w-3 h-3" />
                              )}
                              <span>申請を送る</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {searchFeedback && (
                  <p className="text-[11px] text-stone-500 pt-1 leading-relaxed">
                    {searchFeedback}
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
