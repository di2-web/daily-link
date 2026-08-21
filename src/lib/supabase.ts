import {
  firebaseSignUp,
  firebaseSignIn,
  firebaseSignInWithGoogle,
  firebaseSignOut,
  firebaseOnAuthStateChange,
  firebaseGetProfile,
  firebaseSaveProfile,
  firebaseSearchUsers,
  firebaseFetchRoomObjects,
  firebaseSaveRoomObject,
  firebaseUpdateRoomObject,
  firebaseDeleteRoomObject,
  firebaseFetchFriends,
  firebaseSaveFriend,
  firebaseDeleteFriend,
  firebaseUpdateFriendStatus,
  firebaseFetchNotifications,
  firebaseCreateNotification,
  firebaseMarkNotificationsAsRead,
  firebaseSaveWaveCanvas,
  firebaseGetWaveCanvas,
  firebaseSubscribeToRoomObjects,
  firebaseSubscribeToFriends,
  firebaseSubscribeToNotifications,
} from './firebase';

import {
  UserProfile,
  RoomObject,
  FriendRelation,
  AppNotification,
  SharedMatch,
  WavePoint,
} from '../types';

export const isSupabaseConfigured = true;

// Re-export Firebase methods under supabase* names to seamlessly bridge existing components
export {
  firebaseSignUp as supabaseSignUp,
  firebaseSignIn as supabaseSignIn,
  firebaseSignInWithGoogle as supabaseSignInWithGoogle,
  firebaseSignOut as supabaseSignOut,
  firebaseOnAuthStateChange as supabaseOnAuthStateChange,
  firebaseGetProfile as supabaseGetProfile,
  firebaseSaveProfile as supabaseSaveProfile,
  firebaseSearchUsers as supabaseSearchUsers,
  firebaseFetchRoomObjects as supabaseFetchRoomObjects,
  firebaseSaveRoomObject as supabaseSaveRoomObject,
  firebaseUpdateRoomObject as supabaseUpdateRoomObject,
  firebaseDeleteRoomObject as supabaseDeleteRoomObject,
  firebaseFetchFriends as supabaseFetchFriends,
  firebaseSaveFriend as supabaseSaveFriend,
  firebaseDeleteFriend as supabaseDeleteFriend,
  firebaseUpdateFriendStatus as supabaseUpdateFriendStatus,
  firebaseFetchNotifications as supabaseFetchNotifications,
  firebaseCreateNotification as supabaseCreateNotification,
  firebaseMarkNotificationsAsRead as supabaseMarkNotificationsAsRead,
  firebaseSaveWaveCanvas as supabaseSaveWaveCanvas,
  firebaseGetWaveCanvas as supabaseGetWaveCanvas,
  firebaseSubscribeToRoomObjects as supabaseSubscribeToRoomObjects,
  firebaseSubscribeToFriends as supabaseSubscribeToFriends,
  firebaseSubscribeToNotifications as supabaseSubscribeToNotifications,
};

// Image Upload via base64 data URL
export async function supabaseUploadImage(file: File | Blob, _fileName?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}

// Shared Match APIs
export async function supabaseCreateSharedMatch(match: Omit<SharedMatch, 'id' | 'createdAt'>): Promise<string | null> {
  const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  try {
    const fullMatch: SharedMatch = {
      ...match,
      id: matchId,
      createdAt: new Date().toISOString(),
    };
    const key = `shared_match_${match.passCode.toUpperCase()}`;
    localStorage.setItem(key, JSON.stringify(fullMatch));
    return matchId;
  } catch (err) {
    console.error('Create shared match error:', err);
    return null;
  }
}

export async function supabaseFindSharedMatch(passCode: string): Promise<SharedMatch | null> {
  try {
    const key = `shared_match_${passCode.toUpperCase()}`;
    const item = localStorage.getItem(key);
    if (!item) return null;
    const match = JSON.parse(item) as SharedMatch;
    if (new Date(match.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    return match;
  } catch (err) {
    console.error('Find shared match error:', err);
    return null;
  }
}

export async function supabaseJoinSharedMatch(matchId: string, user: UserProfile): Promise<SharedMatch | null> {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('shared_match_')) {
        const item = localStorage.getItem(k);
        if (item) {
          const match = JSON.parse(item) as SharedMatch;
          if (match.id === matchId) {
            if (!match.matchedUserIds.includes(user.uid)) {
              match.matchedUserIds.push(user.uid);
            }
            if (match.matchedUserNames && !match.matchedUserNames.includes(user.displayName)) {
              match.matchedUserNames.push(user.displayName);
            }
            localStorage.setItem(k, JSON.stringify(match));
            return match;
          }
        }
      }
    }
    return null;
  } catch (err) {
    console.error('Join shared match error:', err);
    return null;
  }
}
