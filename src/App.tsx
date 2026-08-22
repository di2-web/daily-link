import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  RoomObject,
  FriendRelation,
  AppNotification,
  RoomItemReaction,
} from './types';
import {
  supabaseOnAuthStateChange,
  supabaseSignOut,
  supabaseGetProfile,
  supabaseSaveProfile,
  supabaseFetchRoomObjects,
  supabaseSaveRoomObject,
  supabaseUpdateRoomObject,
  supabaseDeleteRoomObject,
  supabaseFetchFriends,
  supabaseSaveFriend,
  supabaseUpdateFriendStatus,
  supabaseFetchNotifications,
  supabaseCreateNotification,
  supabaseMarkNotificationsAsRead,
  supabaseSubscribeToRoomObjects,
  supabaseSubscribeToFriends,
  supabaseSubscribeToNotifications,
  isSupabaseConfigured,
} from './lib/supabase';

import { AuthScreen } from './components/AuthScreen';
import { LandingHomepageView } from './components/LandingHomepageView';
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
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { TermsOfServiceView } from './components/TermsOfServiceView';
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

export type AppRoute = 'home' | 'login' | 'app' | 'privacy' | 'terms';

const getInitialRoute = (): AppRoute => {
  if (typeof window === 'undefined') return 'login';
  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const page = search.get('page') || search.get('view');

  if (path.includes('/privacy') || page === 'privacy') return 'privacy';
  if (path.includes('/terms') || page === 'terms') return 'terms';
  if (path.includes('/home') || page === 'home') return 'home';
  if (path.includes('/app') || page === 'app') return 'app';
  if (path.includes('/login') || page === 'login') return 'login';
  return 'login';
};

export function App() {
  // Application Routing State
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => getInitialRoute());

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

  // Sync route and Browser History (Supports /home, /login, /privacy, /terms)
  const navigateToRoute = (route: AppRoute) => {
    setCurrentRoute(route);
    let targetPath = '/';
    if (route === 'privacy') targetPath = '/privacy';
    else if (route === 'terms') targetPath = '/terms';
    else if (route === 'login') targetPath = '/login';
    else if (route === 'home') targetPath = '/home';
    else if (route === 'app') targetPath = '/';

    if (window.location.pathname !== targetPath) {
      try {
        window.history.pushState({}, '', targetPath);
      } catch (err) {
        // Handle iframe pushState safety
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 1. Supabase Auth Listener
  useEffect(() => {
    let isMounted = true;

    const unsubSupabase = supabaseOnAuthStateChange((supabaseUser, profile) => {
      if (!isMounted) return;
      if (supabaseUser && profile) {
        setCurrentUser(profile);
        setCurrentRoute((prev) => (prev === 'login' ? 'app' : prev));
      } else if (!supabaseUser) {
        // Logged out
        setCurrentUser(null);
        setUserRoomObjects([]);
        setFriendsList([]);
        setAllRoomObjects([]);
        setNotifications([]);
        setCurrentRoute((prev) => (prev === 'app' ? 'home' : prev));
      }
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      unsubSupabase();
    };
  }, []);

  // 2. Friends & Realtime Listener
  useEffect(() => {
    if (!currentUser?.uid) return;

    let isMounted = true;
    const loadFriends = async () => {
      const friends = await supabaseFetchFriends(currentUser.uid);
      if (isMounted) {
        setFriendsList(friends);
      }
    };

    loadFriends();

    const unsub = supabaseSubscribeToFriends(currentUser.uid, (friends) => {
      if (isMounted) {
        setFriendsList(friends);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [currentUser?.uid]);

  // 3. Check for Invite Link in URL and prompt to connect
  useEffect(() => {
    if (!currentUser?.uid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const inviteFrom = urlParams.get('invite_from');

    if (inviteFrom && inviteFrom !== currentUser.uid) {
      window.history.replaceState({}, document.title, window.location.pathname);

      (async () => {
        try {
          const inviter = await supabaseGetProfile(inviteFrom);
          if (inviter) {
            const alreadyFriends = friendsList.some((f) => f.friendUid === inviteFrom);
            if (!alreadyFriends) {
              if (
                window.confirm(
                  `「${inviter.displayName}」さんから招待されました！友達に追加してお部屋をつなぎますか？`
                )
              ) {
                const newFriend: FriendRelation = {
                  id: `fr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  userId: currentUser.uid,
                  friendUid: inviter.uid,
                  friendDisplayName: inviter.displayName,
                  friendUsername: inviter.username,
                  friendPhotoURL: inviter.photoURL,
                  friendBio: inviter.bio || '親しい友達の部屋',
                  assignedCategories: ['親友'],
                  status: 'accepted',
                  statusText: inviter.latestStatus?.text || '',
                  statusEmoji: inviter.latestStatus?.emoji || '🌱',
                  createdAt: new Date().toISOString(),
                };
                await supabaseSaveFriend(newFriend);
                alert(`「${inviter.displayName}」さんとつながりました！🎉`);
                setFriendsList((prev) => [newFriend, ...prev]);
              }
            }
          }
        } catch (err) {
          console.error('Error handling invite link:', err);
        }
      })();
    }
  }, [currentUser?.uid, friendsList]);

  // 4. Room Objects & Realtime Subscriptions
  useEffect(() => {
    if (!currentUser?.uid) return;

    let isMounted = true;
    const loadObjects = async () => {
      const objs = await supabaseFetchRoomObjects();
      if (!isMounted) return;

      const myObjs = objs.filter((o) => o.userId === currentUser.uid);
      if (myObjs.length === 0) {
        // Starter object
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
          caption: 'DailyLinkを始めました！これからの思い出をここに飾っていきます✨',
          date: new Date().toISOString().slice(0, 10),
          areaType: 'base_room',
          isPinned: true,
          reactions: [],
          createdAt: new Date().toISOString(),
        };
        setUserRoomObjects([starterObj]);
        setAllRoomObjects(deduplicateObjects([starterObj, ...objs]));
      } else {
        setUserRoomObjects(deduplicateObjects(myObjs));
        setAllRoomObjects(deduplicateObjects(objs));
      }
    };

    loadObjects();

    const unsub = supabaseSubscribeToRoomObjects(currentUser.uid, (refreshedObjs) => {
      if (!isMounted) return;
      const myObjs = refreshedObjs.filter((o) => o.userId === currentUser.uid);
      setUserRoomObjects(deduplicateObjects(myObjs));
      setAllRoomObjects(deduplicateObjects(refreshedObjs));
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [currentUser?.uid]);

  // 5. Realtime Notifications Listener
  useEffect(() => {
    if (!currentUser?.uid) return;

    let isMounted = true;
    const loadNotifs = async () => {
      const notifs = await supabaseFetchNotifications(currentUser.uid);
      if (isMounted) {
        setNotifications(notifs);
      }
    };

    loadNotifs();

    const unsub = supabaseSubscribeToNotifications(currentUser.uid, (notifs) => {
      if (isMounted) {
        setNotifications(notifs);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [currentUser?.uid]);

  // Handle Post Completion (Image 2 -> 5)
  const handleCompletePost = async (newObj: RoomObject) => {
    try {
      if (currentUser?.uid) {
        const saved = await supabaseSaveRoomObject(newObj);
        newObj.id = saved.id;

        // Update latest status on profile
        const updatedProfile: UserProfile = {
          ...currentUser,
          latestStatus: {
            text: `${newObj.name}を飾りました`,
            emoji: newObj.iconEmoji || '🌱',
            updatedAt: new Date().toISOString(),
          },
        };
        await supabaseSaveProfile(updatedProfile);
        setCurrentUser(updatedProfile);
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

    // If attached to a specific object, persist to room_objects reactions
    if (reactionTargetObject && reactionTargetObject.id) {
      try {
        const curRx = reactionTargetObject.reactions || [];
        const nextRx = [newReactionItem, ...curRx];
        await supabaseUpdateRoomObject(reactionTargetObject.id, {
          reactions: nextRx,
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

    // Add notification
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
      await supabaseCreateNotification(newNotif);
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
        await supabaseDeleteRoomObject(objectId);
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
        await supabaseUpdateRoomObject(objectId, { x, y });
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
        await supabaseUpdateRoomObject(objectId, { areaType: newArea });
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
      navigateToRoute('home');

      try {
        localStorage.removeItem('roomon_user_profile');
        sessionStorage.clear();
      } catch (storageErr) {
        console.warn('Storage clear notice:', storageErr);
      }

      try {
        await supabaseSignOut();
      } catch (err) {
        console.warn('Supabase signout notice:', err);
      }
    }
  };

  // 1. Legal Policy Views (Accessible directly via URL /privacy or /terms, or buttons)
  if (currentRoute === 'privacy') {
    return <PrivacyPolicyView onBack={() => navigateToRoute(currentUser ? 'app' : 'home')} />;
  }
  if (currentRoute === 'terms') {
    return <TermsOfServiceView onBack={() => navigateToRoute(currentUser ? 'app' : 'home')} />;
  }

  // 2. Loading Screen
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

  // 3. Unauthenticated Visitors: Default to Login Screen, with /home going to Homepage
  if (!currentUser) {
    if (currentRoute === 'home') {
      // Public App Homepage when accessing /home
      return (
        <LandingHomepageView
          onOpenAuth={() => navigateToRoute('login')}
          onOpenPrivacy={() => navigateToRoute('privacy')}
          onOpenTerms={() => navigateToRoute('terms')}
        />
      );
    }

    // Default view: Login Page
    return (
      <AuthScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          navigateToRoute('app');
        }}
        onBackToHome={() => navigateToRoute('home')}
        onOpenPrivacy={() => navigateToRoute('privacy')}
        onOpenTerms={() => navigateToRoute('terms')}
      />
    );
  }

  // 4. Authenticated User explicitly viewing the App Homepage (/home)
  if (currentRoute === 'home') {
    return (
      <LandingHomepageView
        isLoggedIn={true}
        onGoToApp={() => navigateToRoute('app')}
        onOpenAuth={() => navigateToRoute('app')}
        onOpenPrivacy={() => navigateToRoute('privacy')}
        onOpenTerms={() => navigateToRoute('terms')}
      />
    );
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
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                await supabaseMarkNotificationsAsRead(currentUser.uid);
              }}
              onAcceptFriendRequest={async (senderUid) => {
                if (!currentUser) return;
                try {
                  const now = new Date().toISOString();
                  const existingFriends = await supabaseFetchFriends(currentUser.uid);
                  const senderFriend = existingFriends.find((f) => f.friendUid === senderUid || f.userId === senderUid);

                  if (senderFriend) {
                    await supabaseUpdateFriendStatus(senderFriend.id, 'accepted', now);
                  } else {
                    const senderProfile = await supabaseGetProfile(senderUid);
                    await supabaseSaveFriend({
                      id: `fr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                      userId: currentUser.uid,
                      friendUid: senderUid,
                      friendDisplayName: senderProfile?.displayName || 'お友達',
                      friendUsername: senderProfile?.username || '',
                      friendPhotoURL: senderProfile?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                      status: 'accepted',
                      assignedCategories: ['親友'],
                      createdAt: now,
                      acceptedAt: now,
                    });
                  }

                  // Refetch friends
                  const refreshed = await supabaseFetchFriends(currentUser.uid);
                  setFriendsList(refreshed);

                  alert('友達申請を承認しました！相互フレンドになりました 🤝');
                } catch (err) {
                  console.error('Accept friend request error:', err);
                  alert('承認処理に失敗しました。');
                }
              }}
              onDeclineFriendRequest={async (senderUid) => {
                if (!currentUser) return;
                try {
                  const existingFriends = await supabaseFetchFriends(currentUser.uid);
                  const senderFriend = existingFriends.find((f) => f.friendUid === senderUid || f.userId === senderUid);
                  if (senderFriend) {
                    await supabaseUpdateFriendStatus(senderFriend.id, 'declined');
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
          onEnterRoomEditMode={(_targetId) => {
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
        onOpenPrivacy={() => navigateToRoute('privacy')}
        onOpenTerms={() => navigateToRoute('terms')}
        onOpenLandingHome={() => navigateToRoute('home')}
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
