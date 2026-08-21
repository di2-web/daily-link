import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  RoomObject,
  FriendRelation,
  AppNotification,
  RoomItemReaction,
} from './types';
import {
  auth,
  db,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
} from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  supabaseOnAuthStateChange,
  supabaseSignOut,
  supabaseGetProfile,
  isSupabaseConfigured,
} from './lib/supabase';

import { AuthScreen } from './components/AuthScreen';
import { RoomFeedSwipeView } from './components/RoomFeedSwipeView';
import { HomeFriendHouses } from './components/HomeFriendHouses';
import { FriendPorchModal } from './components/FriendPorchModal';
import { RoomCanvasView } from './components/RoomCanvasView';
import { ObjectDetailModal } from './components/ObjectDetailModal';
import { ReactionSenderModal } from './components/ReactionSenderModal';
import { PostingFlowModal } from './components/PostingFlowModal';
import { CalendarThumbnailsView } from './components/CalendarThumbnailsView';
import { CalendarClosetView } from './components/CalendarClosetView';
import { NotificationsView } from './components/NotificationsView';
import { MyPageView } from './components/MyPageView';
import { MobileBottomNav, MainNavTab } from './components/MobileBottomNav';
import { UserProfileModal } from './components/UserProfileModal';
import { FriendManager } from './components/FriendManager';
import { MyRoomDashboardView } from './components/MyRoomDashboardView';
import { FriendsRoomFeedView } from './components/FriendsRoomFeedView';
import { Loader2 } from 'lucide-react';

const deduplicateObjects = (list: RoomObject[]): RoomObject[] => {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (!item) return false;
    const key = item.id ? String(item.id) : `${item.userId}_${item.assetId || item.name}_${item.createdAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<MainNavTab>('myroom');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data States (No dummy users)
  const [userRoomObjects, setUserRoomObjects] = useState<RoomObject[]>([]);
  const [friendsList, setFriendsList] = useState<FriendRelation[]>([]);
  const [allRoomObjects, setAllRoomObjects] = useState<RoomObject[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Active View / Modals
  const [selectedFriendForPorch, setSelectedFriendForPorch] = useState<FriendRelation | null>(null);
  const [visitingRoomTarget, setVisitingRoomTarget] = useState<{
    profile: { uid: string; displayName: string; username?: string; photoURL: string };
    isOwner: boolean;
  } | null>(null);

  const [selectedObjectForDetail, setSelectedObjectForDetail] = useState<RoomObject | null>(null);
  const [isReactionSenderOpen, setIsReactionSenderOpen] = useState(false);
  const [reactionTargetObject, setReactionTargetObject] = useState<RoomObject | undefined>(undefined);
  const [reactionTargetUser, setReactionTargetUser] = useState<{ uid: string; displayName: string } | null>(null);

  const [isPostingFlowOpen, setIsPostingFlowOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFriendManagerOpen, setIsFriendManagerOpen] = useState(false);

  // 1. Auth Listener - Supabase Auth (Primary) + Firebase Auth (Fallback)
  useEffect(() => {
    let isMounted = true;

    // A. Supabase Auth Listener
    const unsubSupabase = supabaseOnAuthStateChange((supabaseUser, profile) => {
      if (!isMounted) return;
      if (supabaseUser && profile) {
        setCurrentUser(profile);
      } else if (!supabaseUser) {
        // Logged out
        setCurrentUser(null);
        setUserRoomObjects([]);
        setFriendsList([]);
        setAllRoomObjects([]);
        setNotifications([]);
      }
      setAuthLoading(false);
    });

    // B. Firebase Auth Listener (Fallback only when Supabase is not configured)
    const unsubFirebase = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      if (isSupabaseConfigured) {
        // Supabase is the primary auth provider
        return;
      }
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setCurrentUser(data);
          } else {
            const emailPrefix = user.email?.split('@')[0] || user.uid.slice(0, 6);
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'ユーザー',
              username: `@${emailPrefix}`,
              photoURL:
                user.photoURL ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              bio: '日常のできごとをお部屋に飾っています🌱',
              customShareCategories: ['親友', '部活', '家族', 'パートナー'],
              latestStatus: {
                text: 'Roomonをはじめました！',
                emoji: '🌱',
                updatedAt: new Date().toISOString(),
              },
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile, { merge: true });
            setCurrentUser(newProfile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setCurrentUser(null);
        setUserRoomObjects([]);
        setFriendsList([]);
        setAllRoomObjects([]);
        setNotifications([]);
      }
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      unsubSupabase();
      unsubFirebase();
    };
  }, []);

  // 2. Realtime Friends List Listener from Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'friends'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const friends: FriendRelation[] = [];
        for (const docSnap of snapshot.docs) {
          const fData = docSnap.data() as FriendRelation;
          // Optionally fetch latest user profile to keep display name/photo synced
          try {
            const uSnap = await getDoc(doc(db, 'users', fData.friendUid));
            if (uSnap.exists()) {
              const uData = uSnap.data() as UserProfile;
              friends.push({
                ...fData,
                id: docSnap.id,
                friendDisplayName: uData.displayName || fData.friendDisplayName,
                friendUsername: uData.username || fData.friendUsername,
                friendPhotoURL: uData.photoURL || fData.friendPhotoURL,
                statusText: uData.latestStatus?.text || fData.statusText,
                statusEmoji: uData.latestStatus?.emoji || fData.statusEmoji,
              });
              continue;
            }
          } catch {
            // fallback to stored relation data
          }
          friends.push({ id: docSnap.id, ...fData });
        }
        setFriendsList(friends);
      },
      (error) => {
        console.error('Friends snapshot listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // 3. Check for Invite Link in URL and prompt to connect
  useEffect(() => {
    if (!currentUser?.uid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const inviteFrom = urlParams.get('invite_from');
    const inviteName = urlParams.get('name') || '友達';

    if (inviteFrom && inviteFrom !== currentUser.uid) {
      // Clean URL param
      window.history.replaceState({}, document.title, window.location.pathname);

      // Check if already friends
      (async () => {
        try {
          const uSnap = await getDoc(doc(db, 'users', inviteFrom));
          if (uSnap.exists()) {
            const inviter = uSnap.data() as UserProfile;
            const alreadyFriends = friendsList.some((f) => f.friendUid === inviteFrom);
            if (!alreadyFriends) {
              if (
                window.confirm(
                  `「${inviter.displayName}」さんから招待されました！友達に追加してお部屋をつなぎますか？`
                )
              ) {
                const newFriend: Omit<FriendRelation, 'id'> = {
                  userId: currentUser.uid,
                  friendUid: inviter.uid,
                  friendDisplayName: inviter.displayName,
                  friendUsername: inviter.username,
                  friendPhotoURL: inviter.photoURL,
                  friendBio: inviter.bio || '親しい友達の部屋',
                  assignedCategories: ['親友'],
                  statusText: inviter.latestStatus?.text || '',
                  statusEmoji: inviter.latestStatus?.emoji || '🌱',
                  createdAt: new Date().toISOString(),
                };
                await addDoc(collection(db, 'friends'), newFriend);
                alert(`「${inviter.displayName}」さんとつながりました！🎉`);
              }
            }
          }
        } catch (err) {
          console.error('Error handling invite link:', err);
        }
      })();
    }
  }, [currentUser?.uid, friendsList]);

  // 4. Realtime User Room Objects Listener
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'room_objects'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const objs: RoomObject[] = [];
        snapshot.forEach((docSnap) => {
          objs.push({ id: docSnap.id, ...(docSnap.data() as RoomObject) });
        });

        // Sort by date descending
        objs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (objs.length > 0) {
          setUserRoomObjects(deduplicateObjects(objs));
          setAllRoomObjects((prev) =>
            deduplicateObjects([
              ...objs,
              ...prev.filter((o) => o.userId !== currentUser.uid),
            ])
          );
        } else {
          // Initialize user's own room with a lovely starter object
          const starterObj: RoomObject = {
            id: `starter_${currentUser.uid}`,
            userId: currentUser.uid,
            userDisplayName: currentUser.displayName,
            assetId: 'starter_mug',
            name: 'お気に入りのマグカップ',
            category: 'meal',
            placementSlot: 'desk',
            iconEmoji: '☕',
            imageUrl:
              'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
            x: 48,
            y: 65,
            caption: 'Roomonを始めました！これからの思い出をここに飾っていきます✨',
            date: new Date().toISOString().slice(0, 10),
            areaType: 'base_room',
            isPinned: true,
            reactions: [],
            createdAt: new Date().toISOString(),
          };
          setUserRoomObjects([starterObj]);
          setAllRoomObjects((prev) =>
            deduplicateObjects([
              starterObj,
              ...prev.filter((o) => o.userId !== currentUser.uid),
            ])
          );
        }
      },
      (error) => {
        console.error('Room objects snapshot listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // 5. Realtime Friends' Room Objects Listener
  useEffect(() => {
    if (friendsList.length === 0) {
      setAllRoomObjects((prev) => deduplicateObjects(prev.filter((o) => o.userId === currentUser?.uid)));
      return;
    }

    const friendUids = friendsList.map((f) => f.friendUid);
    const unsubscribers: (() => void)[] = [];

    // Listen to each friend's room objects
    friendUids.forEach((fUid) => {
      const qFriend = query(
        collection(db, 'room_objects'),
        where('userId', '==', fUid)
      );
      const unsub = onSnapshot(
        qFriend,
        (snapshot) => {
          const friendObjs: RoomObject[] = [];
          snapshot.forEach((docSnap) => {
            friendObjs.push({ id: docSnap.id, ...(docSnap.data() as RoomObject) });
          });
          setAllRoomObjects((prev) =>
            deduplicateObjects([
              ...prev.filter((o) => o.userId !== fUid),
              ...friendObjs,
            ])
          );
        },
        (err) => {
          console.error(`Friend ${fUid} objects listener error:`, err);
        }
      );
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [friendsList, currentUser?.uid]);

  // 6. Realtime Notifications Listener from Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          notifs.push({ id: docSnap.id, ...(docSnap.data() as AppNotification) });
        });
        notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notifs);
      },
      (error) => {
        console.error('Notifications snapshot listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Handle Post Completion (Image 2 -> 5)
  const handleCompletePost = async (newObj: RoomObject) => {
    try {
      if (currentUser?.uid) {
        // Sanitize object to remove undefined values
        const sanitizedObj: any = {};
        Object.entries(newObj).forEach(([k, v]) => {
          if (v !== undefined) {
            sanitizedObj[k] = v;
          }
        });

        const docRef = await addDoc(collection(db, 'room_objects'), sanitizedObj);
        newObj.id = docRef.id;

        // Also update user's latest status
        await updateDoc(doc(db, 'users', currentUser.uid), {
          latestStatus: {
            text: `${newObj.name}を飾りました`,
            emoji: newObj.iconEmoji || '🌱',
            updatedAt: new Date().toISOString(),
          },
        });
      }
    } catch (err) {
      console.error('Error saving new room object:', err);
      alert('保存に失敗しました。');
      return;
    }

    setUserRoomObjects((prev) => deduplicateObjects([newObj, ...prev]));
    setAllRoomObjects((prev) => deduplicateObjects([newObj, ...prev]));
    setIsPostingFlowOpen(false);

    // Open own room to admire the new addition
    if (currentUser) {
      setVisitingRoomTarget({
        profile: {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          username: currentUser.username,
          photoURL: currentUser.photoURL,
        },
        isOwner: true,
      });
    }
  };

  // Send Reaction Gift (Image 3 - 6)
  const handleSendReaction = async (
    reaction: {
      type: 'flower' | 'coffee' | 'heart' | 'book' | 'plushie' | 'footprint';
      itemSubtype: string;
      itemEmoji: string;
      message?: string;
    },
    targetUid?: string,
    targetName?: string
  ) => {
    if (!currentUser) return;

    const recipientUid =
      targetUid ||
      reactionTargetUser?.uid ||
      reactionTargetObject?.userId ||
      visitingRoomTarget?.profile.uid;
    const recipientName =
      targetName ||
      reactionTargetUser?.displayName ||
      reactionTargetObject?.userDisplayName ||
      visitingRoomTarget?.profile.displayName ||
      'お友達';

    if (!recipientUid) return;

    const newReactionItem: RoomItemReaction = {
      id: `rx_${Date.now()}`,
      type: reaction.type,
      itemSubtype: reaction.itemSubtype,
      senderUid: currentUser.uid,
      senderName: currentUser.displayName,
      senderPhotoURL: currentUser.photoURL,
      message: reaction.message,
      createdAt: new Date().toISOString(),
    };

    // If attached to a specific object, persist to Firestore room_objects
    if (reactionTargetObject && reactionTargetObject.id) {
      try {
        const objDocRef = doc(db, 'room_objects', reactionTargetObject.id);
        const curRx = reactionTargetObject.reactions || [];
        await updateDoc(objDocRef, {
          reactions: [newReactionItem, ...curRx],
        });
      } catch (err) {
        console.error('Error attaching reaction to object:', err);
      }

      const updatedObjs = allRoomObjects.map((obj) => {
        if (obj.id === reactionTargetObject.id) {
          const rxList = obj.reactions || [];
          return { ...obj, reactions: [newReactionItem, ...rxList] };
        }
        return obj;
      });
      setAllRoomObjects(updatedObjs);
      setSelectedObjectForDetail((prev) =>
        prev && prev.id === reactionTargetObject.id
          ? { ...prev, reactions: [newReactionItem, ...(prev.reactions || [])] }
          : prev
      );
    }

    // Add notification to Firestore
    const newNotif: Omit<AppNotification, 'id'> = {
      userId: recipientUid,
      type: reaction.type === 'flower' ? 'flower' : reaction.type === 'coffee' ? 'coffee' : 'reaction',
      title: `${currentUser.displayName}さんが${
        reaction.type === 'flower'
          ? '花を置きました 💐'
          : reaction.type === 'coffee'
          ? 'コーヒーを置きました ☕'
          : '贈り物を置きました 🎁'
      }`,
      description: reaction.message || 'やさしいリアクションが届きました',
      iconEmoji: reaction.itemEmoji,
      senderUid: currentUser.uid,
      senderName: currentUser.displayName,
      senderPhotoURL: currentUser.photoURL,
      targetObjectName: reactionTargetObject?.name,
      read: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'notifications'), newNotif);
    } catch (err) {
      console.error('Error creating notification:', err);
    }

    setIsReactionSenderOpen(false);
    setReactionTargetUser(null);
  };

  // Delete Room Object
  const handleDeleteObject = async (objectId: string) => {
    if (!currentUser) return;
    try {
      if (!objectId.startsWith('starter_')) {
        await deleteDoc(doc(db, 'room_objects', objectId));
      }
      setUserRoomObjects((prev) => prev.filter((o) => (o.id || o.assetId) !== objectId));
      setAllRoomObjects((prev) => prev.filter((o) => (o.id || o.assetId) !== objectId));
    } catch (err) {
      console.error('Delete object error:', err);
      throw err;
    }
  };

  // Update Object Position (x, y)
  const handleUpdateObjectPosition = async (objectId: string, x: number, y: number) => {
    if (!currentUser) return;
    try {
      if (!objectId.startsWith('starter_')) {
        await updateDoc(doc(db, 'room_objects', objectId), { x, y });
      }
      setUserRoomObjects((prev) =>
        prev.map((o) => ((o.id || o.assetId) === objectId ? { ...o, x, y } : o))
      );
      setAllRoomObjects((prev) =>
        prev.map((o) => ((o.id || o.assetId) === objectId ? { ...o, x, y } : o))
      );
    } catch (err) {
      console.error('Update object position error:', err);
    }
  };

  // Toggle Object Area (base_room vs closet)
  const handleToggleObjectArea = async (objectId: string, newArea: 'base_room' | 'closet') => {
    if (!currentUser) return;
    try {
      if (!objectId.startsWith('starter_')) {
        await updateDoc(doc(db, 'room_objects', objectId), { areaType: newArea });
      }
      setUserRoomObjects((prev) =>
        prev.map((o) => ((o.id || o.assetId) === objectId ? { ...o, areaType: newArea } : o))
      );
      setAllRoomObjects((prev) =>
        prev.map((o) => ((o.id || o.assetId) === objectId ? { ...o, areaType: newArea } : o))
      );
    } catch (err) {
      console.error('Toggle object area error:', err);
      throw err;
    }
  };

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      // 1. Immediately reset memory state and close modals
      setIsProfileModalOpen(false);
      setIsFriendManagerOpen(false);
      setIsPostingFlowOpen(false);
      setSelectedFriendForPorch(null);
      setVisitingRoomTarget(null);
      setSelectedObjectForDetail(null);
      setCurrentUser(null);
      setUserRoomObjects([]);
      setFriendsList([]);
      setAllRoomObjects([]);
      setNotifications([]);

      // 2. Clear cached local session keys
      try {
        localStorage.removeItem('roomon_user_profile');
        sessionStorage.clear();
      } catch (storageErr) {
        console.warn('Storage clear notice:', storageErr);
      }

      // 3. Trigger sign out on both Supabase and Firebase
      try {
        await supabaseSignOut();
      } catch (err) {
        console.warn('Supabase signout notice:', err);
      }
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Firebase signout notice:', err);
      }
    }
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-800" />
          <p className="text-xs font-bold text-stone-600">お部屋の鍵を確認中...</p>
        </div>
      </div>
    );
  }

  // 1. MUST LOGIN: Show AuthScreen if not authenticated (Guest login completely removed)
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 font-sans selection:bg-amber-200">
      {/* 2. Primary Views based on Navigation & State */}

      {/* A. If Visiting a Room (Image 3 - 3) */}
      {visitingRoomTarget ? (
        <RoomCanvasView
          ownerProfile={visitingRoomTarget.profile}
          isOwner={visitingRoomTarget.isOwner}
          currentUser={currentUser}
          objects={allRoomObjects.filter(
            (o) => o.userId === visitingRoomTarget.profile.uid
          )}
          onBack={() => setVisitingRoomTarget(null)}
          onSelectObject={(obj) => setSelectedObjectForDetail(obj)}
          onQuickSendGift={(type) => {
            handleSendReaction({
              type,
              itemSubtype: type === 'flower' ? 'tulip' : 'hot_coffee',
              itemEmoji: type === 'flower' ? '🌷' : '☕',
              message: `${type === 'flower' ? 'お花' : 'コーヒー'}を置いていくね！`,
            });
          }}
          onOpenFullReactionModal={() => {
            setReactionTargetObject(undefined);
            setIsReactionSenderOpen(true);
          }}
          onUpdateObjectPosition={handleUpdateObjectPosition}
          onDeleteObject={handleDeleteObject}
        />
      ) : (
        /* B. Main Tab Views */
        <main className="w-full">
          {activeTab === 'myroom' && (
            <MyRoomDashboardView
              currentUser={currentUser}
              userRoomObjects={userRoomObjects}
              friendsCount={friendsList.filter((f) => f.status === 'accepted').length}
              unreadNotificationsCount={unreadCount}
              onSelectObject={(obj) => setSelectedObjectForDetail(obj)}
              onOpenPostingModal={() => setIsPostingFlowOpen(true)}
              onOpenFriendManager={() => setIsFriendManagerOpen(true)}
              onOpenProfileEdit={() => setIsProfileModalOpen(true)}
              onUpdateObjectPosition={handleUpdateObjectPosition}
              onObjectRestored={(obj) => {
                setUserRoomObjects((prev) =>
                  prev.map((o) => (o.id === obj.id ? { ...o, areaType: 'base_room' } : o))
                );
              }}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'friends' && (
            <FriendsRoomFeedView
              currentUser={currentUser}
              friendsList={friendsList}
              allRoomObjects={allRoomObjects}
              onSelectObject={(obj) => setSelectedObjectForDetail(obj)}
              onVisitFriendRoom={(friend) => {
                setVisitingRoomTarget({
                  profile: friend,
                  isOwner: false,
                });
              }}
              onOpenFriendManager={() => setIsFriendManagerOpen(true)}
              onQuickSendGift={(targetUid, type) => {
                handleSendReaction(
                  {
                    type,
                    itemSubtype: type === 'flower' ? 'tulip' : 'hot_coffee',
                    itemEmoji: type === 'flower' ? '🌷' : '☕',
                    message: `${type === 'flower' ? 'お花' : 'コーヒー'}を置いていくね！`,
                  },
                  targetUid
                );
              }}
              onOpenFullReactionModal={(targetObj, targetUser) => {
                setReactionTargetObject(targetObj);
                if (targetUser) {
                  setReactionTargetUser(targetUser);
                }
                setIsReactionSenderOpen(true);
              }}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarThumbnailsView
              currentUser={currentUser}
              roomObjects={userRoomObjects}
              onSelectObject={(obj) => setSelectedObjectForDetail(obj)}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onMarkAllAsRead={async () => {
                // Mark all read in state & Firestore
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                for (const n of notifications) {
                  if (!n.read && n.id) {
                    try {
                      await updateDoc(doc(db, 'notifications', n.id), { read: true });
                    } catch {}
                  }
                }
              }}
              onAcceptFriendRequest={async (senderUid) => {
                if (!currentUser) return;
                try {
                  const now = new Date().toISOString();

                  // Query existing friend relations between current user and sender
                  const q1 = query(
                    collection(db, 'friends'),
                    where('userId', '==', currentUser.uid),
                    where('friendUid', '==', senderUid)
                  );
                  const q2 = query(
                    collection(db, 'friends'),
                    where('userId', '==', senderUid),
                    where('friendUid', '==', currentUser.uid)
                  );

                  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

                  // Update or create currentUser -> sender
                  if (!snap1.empty) {
                    for (const d of snap1.docs) {
                      await updateDoc(doc(db, 'friends', d.id), { status: 'accepted', updatedAt: now });
                    }
                  } else {
                    const senderFriend = friendsList.find((f) => f.friendUid === senderUid);
                    await addDoc(collection(db, 'friends'), {
                      userId: currentUser.uid,
                      friendUid: senderUid,
                      friendDisplayName: senderFriend?.friendDisplayName || 'お友達',
                      friendUsername: senderFriend?.friendUsername || '',
                      friendPhotoURL: senderFriend?.friendPhotoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                      status: 'accepted',
                      createdAt: now,
                      updatedAt: now,
                    });
                  }

                  // Update or create sender -> currentUser
                  if (!snap2.empty) {
                    for (const d of snap2.docs) {
                      await updateDoc(doc(db, 'friends', d.id), { status: 'accepted', updatedAt: now });
                    }
                  } else {
                    await addDoc(collection(db, 'friends'), {
                      userId: senderUid,
                      friendUid: currentUser.uid,
                      friendDisplayName: currentUser.displayName || 'お友達',
                      friendUsername: currentUser.username || '',
                      friendPhotoURL: currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                      status: 'accepted',
                      createdAt: now,
                      updatedAt: now,
                    });
                  }

                  // Mark any related friend_request notifications as read
                  const reqNotifs = notifications.filter(
                    (n) => n.type === 'friend_request' && n.senderUid === senderUid && !n.read
                  );
                  for (const n of reqNotifs) {
                    if (n.id) {
                      await updateDoc(doc(db, 'notifications', n.id), { read: true });
                    }
                  }

                  alert('友達申請を承認しました！相互フレンドになりました 🤝');
                } catch (err) {
                  console.error('Accept friend request error:', err);
                  alert('承認処理に失敗しました。');
                }
              }}
              onDeclineFriendRequest={async (senderUid) => {
                if (!currentUser) return;
                try {
                  const now = new Date().toISOString();
                  const q1 = query(
                    collection(db, 'friends'),
                    where('userId', '==', currentUser.uid),
                    where('friendUid', '==', senderUid)
                  );
                  const q2 = query(
                    collection(db, 'friends'),
                    where('userId', '==', senderUid),
                    where('friendUid', '==', currentUser.uid)
                  );

                  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

                  for (const d of snap1.docs) {
                    await updateDoc(doc(db, 'friends', d.id), { status: 'declined', updatedAt: now });
                  }
                  for (const d of snap2.docs) {
                    await updateDoc(doc(db, 'friends', d.id), { status: 'declined', updatedAt: now });
                  }

                  const reqNotifs = notifications.filter(
                    (n) => n.type === 'friend_request' && n.senderUid === senderUid && !n.read
                  );
                  for (const n of reqNotifs) {
                    if (n.id) {
                      await updateDoc(doc(db, 'notifications', n.id), { read: true });
                    }
                  }

                  alert('友達申請を辞退しました。');
                } catch (err) {
                  console.error('Decline friend request error:', err);
                }
              }}
              onSelectNotification={(notif) => {
                const friend = friendsList.find((f) => f.friendUid === notif.senderUid && f.status === 'accepted');
                if (friend) {
                  setSelectedFriendForPorch(friend);
                } else if (currentUser) {
                  setVisitingRoomTarget({
                    profile: {
                      uid: currentUser.uid,
                      displayName: currentUser.displayName,
                      username: currentUser.username,
                      photoURL: currentUser.photoURL,
                    },
                    isOwner: true,
                  });
                }
              }}
            />
          )}

          {/* Persistent Bottom Navigation */}
          <MobileBottomNav
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setVisitingRoomTarget(null);
              setSelectedFriendForPorch(null);
              setActiveTab(tab);
            }}
            unreadNotificationsCount={unreadCount}
            onOpenPostingModal={() => setIsPostingFlowOpen(true)}
          />
        </main>
      )}

      {/* 3. MODALS */}

      {/* Modal 1: Friend Porch Pre-visit Screen (Image 3 - 2) */}
      {selectedFriendForPorch && (
        <FriendPorchModal
          friend={selectedFriendForPorch}
          friendRoomObjects={allRoomObjects.filter(
            (o) => o.userId === selectedFriendForPorch.friendUid
          )}
          onClose={() => setSelectedFriendForPorch(null)}
          onEnterRoom={() => {
            const friend = selectedFriendForPorch;
            setSelectedFriendForPorch(null);
            setVisitingRoomTarget({
              profile: {
                uid: friend.friendUid,
                displayName: friend.friendDisplayName,
                username: friend.friendUsername,
                photoURL: friend.friendPhotoURL,
              },
              isOwner: false,
            });
          }}
        />
      )}

      {/* Modal 2: Object Detail Modal (Image 3 - 4) */}
      {selectedObjectForDetail && (
        <ObjectDetailModal
          object={selectedObjectForDetail}
          isOwner={selectedObjectForDetail.userId === currentUser.uid}
          currentUser={currentUser}
          onClose={() => setSelectedObjectForDetail(null)}
          onOpenReactionModal={() => {
            setReactionTargetObject(selectedObjectForDetail);
            setIsReactionSenderOpen(true);
          }}
          onDeleteObject={handleDeleteObject}
          onUpdatePosition={handleUpdateObjectPosition}
          onToggleArea={handleToggleObjectArea}
          onEnterRoomEditMode={(targetId) => {
            setVisitingRoomTarget({
              profile: {
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                username: currentUser.username,
                photoURL: currentUser.photoURL,
              },
              isOwner: true,
            });
          }}
        />
      )}

      {/* Modal 3: Reaction Sender Modal (Image 3 - 6) */}
      {isReactionSenderOpen && (
        <ReactionSenderModal
          targetUserDisplayName={
            reactionTargetUser?.displayName ||
            reactionTargetObject?.userDisplayName ||
            visitingRoomTarget?.profile.displayName ||
            'お友達'
          }
          targetObject={reactionTargetObject}
          onClose={() => {
            setIsReactionSenderOpen(false);
            setReactionTargetUser(null);
          }}
          onSendReaction={(r) => handleSendReaction(r)}
        />
      )}

      {/* Modal 4: 5-Step Posting Flow (Image 2) */}
      {isPostingFlowOpen && (
        <PostingFlowModal
          currentUserUid={currentUser.uid}
          currentUserDisplayName={currentUser.displayName}
          onClose={() => setIsPostingFlowOpen(false)}
          onCompletePost={handleCompletePost}
        />
      )}

      {/* Modal 5: User Profile & Category Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => setCurrentUser(updated)}
        onOpenFriendManager={() => setIsFriendManagerOpen(true)}
        onLogout={handleLogout}
      />

      {/* Modal 6: Friend Manager (Closed Network / Invite links) */}
      <FriendManager
        isOpen={isFriendManagerOpen}
        onClose={() => setIsFriendManagerOpen(false)}
        currentUser={currentUser}
        friendsList={friendsList}
        onFriendsUpdated={(list) => setFriendsList(list)}
      />
    </div>
  );
}

export default App;
