import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  initializeFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  UserProfile,
  RoomObject,
  FriendRelation,
  AppNotification,
  SharedMatch,
  WavePoint,
} from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
const customDbId = firebaseConfig.firestoreDatabaseId;
export const db: Firestore =
  customDbId && customDbId !== '(default)'
    ? initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
        },
        customDbId
      )
    : initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });

export type { FirebaseUser };

// ============================================================================
// Local Storage Persistence Cache for Offline Fallback
// ============================================================================
const LOCAL_STORAGE_USERS_KEY = 'roomon_firebase_users';
const LOCAL_STORAGE_OBJECTS_KEY = 'roomon_firebase_objects';
const LOCAL_STORAGE_FRIENDS_KEY = 'roomon_firebase_friends';
const LOCAL_STORAGE_NOTIFS_KEY = 'roomon_firebase_notifs';

function getLocalData<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save warning:', e);
  }
}

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

export async function firebaseSignUp(
  email: string,
  password: string,
  displayName: string,
  username?: string,
  photoURL?: string
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const formattedUsername = username
      ? (username.startsWith('@') ? username : `@${username}`)
      : `@${email.split('@')[0]}_${user.uid.substring(0, 4)}`;

    const avatar = photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`;

    await updateProfile(user, {
      displayName: displayName || 'ユーザー',
      photoURL: avatar,
    });

    const profile: UserProfile = {
      uid: user.uid,
      displayName: displayName || 'ユーザー',
      username: formattedUsername,
      photoURL: avatar,
      bio: '日常のできごとをお部屋に飾っています🌱',
      avatarOutfit: 'casual_hoodie',
      customShareCategories: ['親友', '部活', '家族', 'パートナー'],
      latestStatus: {
        text: 'DailyLinkをはじめました！',
        emoji: '🌱',
        updatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };

    await firebaseSaveProfile(profile);
    return { user, profile, error: null };
  } catch (error: any) {
    console.error('Firebase SignUp error:', error);
    return { user: null, profile: null, error };
  }
}

export async function firebaseSignIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    let profile = await firebaseGetProfile(user.uid);

    if (!profile) {
      profile = {
        uid: user.uid,
        displayName: user.displayName || email.split('@')[0],
        username: `@${email.split('@')[0]}`,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        bio: '日常のできごとをお部屋に飾っています🌱',
        avatarOutfit: 'casual_hoodie',
        customShareCategories: ['親友', '部活', '家族', 'パートナー'],
        latestStatus: {
          text: 'おかえりなさい！',
          emoji: '☕️',
          updatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      };
      await firebaseSaveProfile(profile);
    }

    return { user, profile, error: null };
  } catch (error: any) {
    console.error('Firebase SignIn error:', error);
    return { user: null, profile: null, error };
  }
}

export async function firebaseSignInWithGoogle() {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    let profile = await firebaseGetProfile(user.uid);

    if (!profile) {
      const emailPrefix = user.email ? user.email.split('@')[0] : 'user';
      const cleanHandle = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '');
      profile = {
        uid: user.uid,
        displayName: user.displayName || 'Google ユーザー',
        username: `@${cleanHandle || 'user'}_${user.uid.substring(0, 4)}`,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        bio: '日常のできごとをお部屋に飾っています🌱',
        avatarOutfit: 'default',
        avatarAccessory: 'none',
        customShareCategories: ['親友', '部活', '家族', 'パートナー'],
        latestStatus: {
          text: 'はじめまして！',
          emoji: '🌱',
          updatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      };
      await firebaseSaveProfile(profile);
    }

    return { data: { user }, profile, error: null };
  } catch (error: any) {
    console.error('Firebase Google SignIn error:', error);
    return { data: null, profile: null, error };
  }
}

export async function firebaseSignOut() {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  }
  try {
    localStorage.removeItem('roomon_current_uid');
    localStorage.removeItem('roomon_user_profile');
  } catch (err) {
    // Ignore storage cleanup issues
  }
}

export function firebaseOnAuthStateChange(
  callback: (user: FirebaseUser | null, profile: UserProfile | null) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      let profile = await firebaseGetProfile(user.uid);
      if (!profile) {
        const emailPrefix = user.email ? user.email.split('@')[0] : 'user';
        const cleanHandle = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '');
        profile = {
          uid: user.uid,
          displayName: user.displayName || 'ユーザー',
          username: `@${cleanHandle || 'user'}_${user.uid.substring(0, 4)}`,
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          bio: 'DailyLinkをはじめました！',
          avatarOutfit: 'default',
          avatarAccessory: 'none',
          customShareCategories: ['親友', '部活', '家族', 'パートナー'],
          latestStatus: {
            text: 'はじめまして！',
            emoji: '🌱',
            updatedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
        };
        await firebaseSaveProfile(profile);
      }
      callback(user, profile);
    } else {
      callback(null, null);
    }
  });
}

// ============================================================================
// PROFILES API
// ============================================================================

export async function firebaseGetProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  try {
    const docRef = doc(db, 'profiles', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    const localUsers = getLocalData<Record<string, UserProfile>>(LOCAL_STORAGE_USERS_KEY, {});
    return localUsers[uid] || null;
  } catch (err) {
    console.error('firebaseGetProfile error:', err);
    const localUsers = getLocalData<Record<string, UserProfile>>(LOCAL_STORAGE_USERS_KEY, {});
    return localUsers[uid] || null;
  }
}

export async function firebaseSaveProfile(profile: UserProfile): Promise<boolean> {
  if (!profile.uid) return false;
  try {
    const docRef = doc(db, 'profiles', profile.uid);
    await setDoc(docRef, profile, { merge: true });

    const localUsers = getLocalData<Record<string, UserProfile>>(LOCAL_STORAGE_USERS_KEY, {});
    localUsers[profile.uid] = profile;
    setLocalData(LOCAL_STORAGE_USERS_KEY, localUsers);
    return true;
  } catch (err) {
    console.error('firebaseSaveProfile error:', err);
    const localUsers = getLocalData<Record<string, UserProfile>>(LOCAL_STORAGE_USERS_KEY, {});
    localUsers[profile.uid] = profile;
    setLocalData(LOCAL_STORAGE_USERS_KEY, localUsers);
    return true;
  }
}

export async function firebaseSearchUsers(q: string): Promise<UserProfile[]> {
  const term = q.trim().toLowerCase().replace(/^@/, '');
  if (!term) return [];
  try {
    const snapshot = await getDocs(collection(db, 'profiles'));
    const results: UserProfile[] = [];
    snapshot.forEach((doc) => {
      const u = doc.data() as UserProfile;
      const dName = (u.displayName || '').toLowerCase();
      const uName = (u.username || '').toLowerCase();
      if (dName.includes(term) || uName.includes(term)) {
        results.push(u);
      }
    });
    return results;
  } catch (err) {
    console.error('firebaseSearchUsers error:', err);
    const localUsers = getLocalData<Record<string, UserProfile>>(LOCAL_STORAGE_USERS_KEY, {});
    return Object.values(localUsers).filter((u) =>
      u.displayName.toLowerCase().includes(term) || u.username.toLowerCase().includes(term)
    );
  }
}

// ============================================================================
// ROOM OBJECTS API
// ============================================================================

export async function firebaseFetchRoomObjects(userId?: string): Promise<RoomObject[]> {
  try {
    const colRef = collection(db, 'room_objects');
    let q = query(colRef, orderBy('createdAt', 'desc'));
    if (userId) {
      q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    const list: RoomObject[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as RoomObject);
    });
    return list;
  } catch (err) {
    console.error('firebaseFetchRoomObjects error:', err);
    const localObjects = getLocalData<RoomObject[]>(LOCAL_STORAGE_OBJECTS_KEY, []);
    return userId ? localObjects.filter((o) => o.userId === userId) : localObjects;
  }
}

export async function firebaseSaveRoomObject(obj: RoomObject): Promise<RoomObject> {
  const id = obj.id || `obj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const itemToSave = { ...obj, id };
  try {
    const docRef = doc(db, 'room_objects', id);
    await setDoc(docRef, itemToSave, { merge: true });

    const localObjects = getLocalData<RoomObject[]>(LOCAL_STORAGE_OBJECTS_KEY, []);
    const idx = localObjects.findIndex((o) => o.id === id);
    if (idx >= 0) localObjects[idx] = itemToSave;
    else localObjects.unshift(itemToSave);
    setLocalData(LOCAL_STORAGE_OBJECTS_KEY, localObjects);

    return itemToSave;
  } catch (err) {
    console.error('firebaseSaveRoomObject error:', err);
    const localObjects = getLocalData<RoomObject[]>(LOCAL_STORAGE_OBJECTS_KEY, []);
    localObjects.unshift(itemToSave);
    setLocalData(LOCAL_STORAGE_OBJECTS_KEY, localObjects);
    return itemToSave;
  }
}

export async function firebaseUpdateRoomObject(
  id: string,
  updates: Partial<RoomObject>
): Promise<boolean> {
  try {
    const docRef = doc(db, 'room_objects', id);
    await updateDoc(docRef, updates as any);

    const localObjects = getLocalData<RoomObject[]>(LOCAL_STORAGE_OBJECTS_KEY, []);
    const idx = localObjects.findIndex((o) => o.id === id);
    if (idx >= 0) {
      localObjects[idx] = { ...localObjects[idx], ...updates };
      setLocalData(LOCAL_STORAGE_OBJECTS_KEY, localObjects);
    }
    return true;
  } catch (err) {
    console.error('firebaseUpdateRoomObject error:', err);
    return false;
  }
}

export async function firebaseDeleteRoomObject(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'room_objects', id);
    await deleteDoc(docRef);

    const localObjects = getLocalData<RoomObject[]>(LOCAL_STORAGE_OBJECTS_KEY, []);
    setLocalData(
      LOCAL_STORAGE_OBJECTS_KEY,
      localObjects.filter((o) => o.id !== id)
    );
    return true;
  } catch (err) {
    console.error('firebaseDeleteRoomObject error:', err);
    return false;
  }
}

// ============================================================================
// FRIENDS API
// ============================================================================

export async function firebaseFetchFriends(userId: string): Promise<FriendRelation[]> {
  try {
    const colRef = collection(db, 'friend_relations');
    const q1 = query(colRef, where('userId', '==', userId));
    const snapshot = await getDocs(q1);
    const list: FriendRelation[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as FriendRelation);
    });
    return list;
  } catch (err) {
    console.error('firebaseFetchFriends error:', err);
    const localFriends = getLocalData<FriendRelation[]>(LOCAL_STORAGE_FRIENDS_KEY, []);
    return localFriends.filter((f) => f.userId === userId || f.friendUid === userId);
  }
}

export async function firebaseSaveFriend(relation: FriendRelation): Promise<FriendRelation> {
  const id = relation.id || `${relation.userId}_${relation.friendUid}`;
  const row = { ...relation, id };
  try {
    const docRef = doc(db, 'friend_relations', id);
    await setDoc(docRef, row, { merge: true });

    const localFriends = getLocalData<FriendRelation[]>(LOCAL_STORAGE_FRIENDS_KEY, []);
    const idx = localFriends.findIndex((f) => f.id === id);
    if (idx >= 0) localFriends[idx] = row;
    else localFriends.push(row);
    setLocalData(LOCAL_STORAGE_FRIENDS_KEY, localFriends);

    return row;
  } catch (err) {
    console.error('firebaseSaveFriend error:', err);
    return row;
  }
}

export async function firebaseDeleteFriend(
  id?: string,
  userId?: string,
  friendUid?: string
): Promise<boolean> {
  try {
    if (id) {
      const docRef = doc(db, 'friend_relations', id);
      await deleteDoc(docRef);
    }
    if (userId && friendUid) {
      const revDocRef = doc(db, 'friend_relations', `${friendUid}_${userId}`);
      await deleteDoc(revDocRef).catch(() => {});
    }

    const localFriends = getLocalData<FriendRelation[]>(LOCAL_STORAGE_FRIENDS_KEY, []);
    setLocalData(
      LOCAL_STORAGE_FRIENDS_KEY,
      localFriends.filter((f) => f.id !== id && !(userId && friendUid && f.userId === friendUid && f.friendUid === userId))
    );
    return true;
  } catch (err) {
    console.error('firebaseDeleteFriend error:', err);
    return false;
  }
}

export async function firebaseUpdateFriendStatus(
  id?: string,
  status?: 'accepted' | 'pending' | 'rejected' | 'declined',
  _acceptedAt?: string,
  userId?: string,
  friendUid?: string
): Promise<boolean> {
  if (!id) return false;
  try {
    const docRef = doc(db, 'friend_relations', id);
    await updateDoc(docRef, { status: status || 'accepted' });

    if (status === 'accepted' && userId && friendUid) {
      const revDocRef = doc(db, 'friend_relations', `${friendUid}_${userId}`);
      await setDoc(
        revDocRef,
        {
          id: `${friendUid}_${userId}`,
          userId: friendUid,
          friendUid: userId,
          status: 'accepted',
          assignedCategories: ['親友'],
          createdAt: new Date().toISOString(),
          acceptedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    return true;
  } catch (err) {
    console.error('firebaseUpdateFriendStatus error:', err);
    return false;
  }
}

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export async function firebaseFetchNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const colRef = collection(db, 'notifications');
    const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const list: AppNotification[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as AppNotification);
    });
    return list;
  } catch (err) {
    console.error('firebaseFetchNotifications error:', err);
    const localNotifs = getLocalData<AppNotification[]>(LOCAL_STORAGE_NOTIFS_KEY, []);
    return localNotifs.filter((n) => n.userId === userId);
  }
}

export async function firebaseCreateNotification(
  notif: Omit<AppNotification, 'id'>
): Promise<boolean> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const item = { ...notif, id };
  try {
    const docRef = doc(db, 'notifications', id);
    await setDoc(docRef, item);

    const localNotifs = getLocalData<AppNotification[]>(LOCAL_STORAGE_NOTIFS_KEY, []);
    localNotifs.unshift(item);
    setLocalData(LOCAL_STORAGE_NOTIFS_KEY, localNotifs);
    return true;
  } catch (err) {
    console.error('firebaseCreateNotification error:', err);
    return false;
  }
}

export async function firebaseMarkNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const notifs = await firebaseFetchNotifications(userId);
    const unread = notifs.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }))
    );
    return true;
  } catch (err) {
    console.error('firebaseMarkNotificationsAsRead error:', err);
    return false;
  }
}

// ============================================================================
// WAVE CANVAS API
// ============================================================================

export async function firebaseSaveWaveCanvas(
  userId: string,
  date: string,
  points: WavePoint[]
): Promise<boolean> {
  const id = `${userId}_${date}`;
  try {
    const docRef = doc(db, 'wave_canvas', id);
    await setDoc(docRef, { userId, date, points, updatedAt: new Date().toISOString() });
    return true;
  } catch (err) {
    console.error('firebaseSaveWaveCanvas error:', err);
    return false;
  }
}

export async function firebaseGetWaveCanvas(
  userId: string,
  date: string
): Promise<WavePoint[]> {
  const id = `${userId}_${date}`;
  try {
    const docRef = doc(db, 'wave_canvas', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return (docSnap.data().points || []) as WavePoint[];
    }
    return [];
  } catch (err) {
    console.error('firebaseGetWaveCanvas error:', err);
    return [];
  }
}

// ============================================================================
// REAL-TIME LISTENERS
// ============================================================================

export function firebaseSubscribeToRoomObjects(
  _userId: string,
  onUpdate: (objects: RoomObject[]) => void
) {
  const colRef = collection(db, 'room_objects');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: RoomObject[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as RoomObject);
    });
    onUpdate(list);
  });
}

export function firebaseSubscribeToFriends(
  userId: string,
  onUpdate: (friends: FriendRelation[]) => void
) {
  const colRef = collection(db, 'friend_relations');
  const q = query(colRef, where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const list: FriendRelation[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as FriendRelation);
    });
    onUpdate(list);
  });
}

export function firebaseSubscribeToNotifications(
  userId: string,
  onUpdate: (notifs: AppNotification[]) => void
) {
  const colRef = collection(db, 'notifications');
  const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: AppNotification[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as AppNotification);
    });
    onUpdate(list);
  });
}
