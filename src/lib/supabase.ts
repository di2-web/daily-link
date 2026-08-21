import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import {
  UserProfile,
  RoomObject,
  FriendRelation,
  AppNotification,
  SharedMatch,
  WavePoint,
} from '../types';

// Read from Environment or Local Storage Configuration
const metaEnv = (import.meta as any).env || {};
const envSupabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const envSupabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

const localSupabaseUrl = typeof window !== 'undefined' ? localStorage.getItem('ROOMON_SUPABASE_URL') || '' : '';
const localSupabaseAnonKey = typeof window !== 'undefined' ? localStorage.getItem('ROOMON_SUPABASE_ANON_KEY') || '' : '';

export const SUPABASE_URL = localSupabaseUrl || envSupabaseUrl;
export const SUPABASE_ANON_KEY = localSupabaseAnonKey || envSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_URL.startsWith('http') &&
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY.length > 20
);

// Create Supabase Client
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder', {
      auth: {
        persistSession: false,
      },
    });

export type { SupabaseUser };

// ============================================================================
// Local Storage Persistence Cache for Offline / Development Fallback
// ============================================================================
const LOCAL_STORAGE_USERS_KEY = 'roomon_supabase_users';
const LOCAL_STORAGE_OBJECTS_KEY = 'roomon_supabase_objects';
const LOCAL_STORAGE_FRIENDS_KEY = 'roomon_supabase_friends';
const LOCAL_STORAGE_NOTIFS_KEY = 'roomon_supabase_notifs';
const LOCAL_STORAGE_MATCHES_KEY = 'roomon_supabase_matches';
const LOCAL_STORAGE_WAVE_KEY = 'roomon_supabase_wave';

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

export async function supabaseSignUp(email: string, password: string, displayName: string, username?: string, photoURL?: string) {
  if (!isSupabaseConfigured) {
    // Local / Offline Simulation
    const uid = 'user_' + Math.random().toString(36).substring(2, 10);
    const profile: UserProfile = {
      uid,
      displayName: displayName || 'ユーザー',
      username: username || `@${email.split('@')[0]}`,
      photoURL: photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: '日常のできごとをお部屋に飾っています🌱',
      avatarOutfit: 'casual_hoodie',
      customShareCategories: ['親友', '部活', '家族', 'パートナー'],
      latestStatus: { text: 'Roomonをはじめました！', emoji: '🌱', updatedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    };
    const users = getLocalData<Record<string, UserProfile>>(LOCAL_STORAGE_USERS_KEY, {});
    users[uid] = profile;
    setLocalData(LOCAL_STORAGE_USERS_KEY, users);
    localStorage.setItem('roomon_current_uid', uid);
    return { user: { id: uid, email }, profile, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username,
        avatar_url: photoURL,
      },
    },
  });

  if (error) return { user: null, profile: null, error };

  if (data.user) {
    const profile: UserProfile = {
      uid: data.user.id,
      displayName: displayName || 'ユーザー',
      username: username || `@${email.split('@')[0]}`,
      photoURL: photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: '日常のできごとをお部屋に飾っています🌱',
      avatarOutfit: 'casual_hoodie',
      customShareCategories: ['親友', '部活', '家族', 'パートナー'],
      latestStatus: { text: 'Roomonをはじめました！', emoji: '🌱', updatedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    };
    await supabaseSaveProfile(profile);
    return { user: data.user, profile, error: null };
  }

  return { user: null, profile: null, error: new Error('User creation returned empty') };
}

export async function supabaseSignIn(email: string, password: string) {
  if (!isSupabaseConfigured) {
    // Local / Offline Simulation
    const users = getLocalData<Record<string, UserProfile>>(LOCAL_STORAGE_USERS_KEY, {});
    const existing = Object.values(users).find(u => u.username?.includes(email.split('@')[0]) || u.uid);
    if (existing) {
      localStorage.setItem('roomon_current_uid', existing.uid);
      return { user: { id: existing.uid, email }, profile: existing, error: null };
    }
    // Create new profile for this email if none found
    const uid = 'user_' + Math.random().toString(36).substring(2, 10);
    const profile: UserProfile = {
      uid,
      displayName: email.split('@')[0],
      username: `@${email.split('@')[0]}`,
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: '日常のできごとをお部屋に飾っています🌱',
      avatarOutfit: 'casual_hoodie',
      customShareCategories: ['親友', '部活', '家族', 'パートナー'],
      latestStatus: { text: 'おかえりなさい！', emoji: '☕️', updatedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    };
    users[uid] = profile;
    setLocalData(LOCAL_STORAGE_USERS_KEY, users);
    localStorage.setItem('roomon_current_uid', uid);
    return { user: { id: uid, email }, profile, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { user: null, profile: null, error };

  if (data.user) {
    const profile = await supabaseGetProfile(data.user.id);
    return { user: data.user, profile, error: null };
  }

  return { user: null, profile: null, error: new Error('SignIn returned empty') };
}

export async function supabaseSignInWithGoogle() {
  if (!isSupabaseConfigured) {
    return supabaseSignUp('google_user@example.com', 'password123', 'Google ユーザー');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  return { data, error };
}

export async function supabaseSignOut() {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase auth signOut error:', err);
    }
  }
  try {
    localStorage.removeItem('roomon_current_uid');
    localStorage.removeItem('roomon_user_profile');
    localStorage.removeItem('supabase.auth.token');
  } catch (err) {
    // Ignore storage cleanup issues
  }
}

export function supabaseOnAuthStateChange(callback: (user: SupabaseUser | null, profile: UserProfile | null) => void) {
  if (!isSupabaseConfigured) {
    const uid = localStorage.getItem('roomon_current_uid');
    if (uid) {
      const users = getLocalData<Record<string, UserProfile>>(LOCAL_STORAGE_USERS_KEY, {});
      const profile = users[uid] || null;
      callback({ id: uid } as any, profile);
    } else {
      callback(null, null);
    }
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const profile = await supabaseGetProfile(session.user.id);
      callback(session.user, profile);
    } else {
      callback(null, null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

// ============================================================================
// PROFILES API
// ============================================================================

export async function supabaseGetProfile(uid: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) {
    const users = getLocalData<Record<string, UserProfile>>(LOCAL_STORAGE_USERS_KEY, {});
    return users[uid] || null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (error || !data) return null;

    return {
      uid: data.id,
      displayName: data.display_name,
      username: data.username,
      photoURL: data.photo_url,
      bio: data.bio,
      avatarOutfit: data.avatar_outfit,
      avatarAccessory: data.avatar_accessory,
      customShareCategories: data.custom_share_categories || ['親友', '部活', '家族', 'パートナー'],
      latestStatus: data.latest_status,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('supabaseGetProfile error:', err);
    return null;
  }
}

export async function supabaseSaveProfile(profile: UserProfile): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const users = getLocalData<Record<string, UserProfile>>(LOCAL_STORAGE_USERS_KEY, {});
    users[profile.uid] = profile;
    setLocalData(LOCAL_STORAGE_USERS_KEY, users);
    return true;
  }

  try {
    const { error } = await supabase.from('profiles').upsert({
      id: profile.uid,
      display_name: profile.displayName,
      username: profile.username,
      photo_url: profile.photoURL,
      bio: profile.bio,
      avatar_outfit: profile.avatarOutfit,
      avatar_accessory: profile.avatarAccessory,
      custom_share_categories: profile.customShareCategories,
      latest_status: profile.latestStatus,
      created_at: profile.createdAt || new Date().toISOString(),
    });

    return !error;
  } catch (err) {
    console.error('supabaseSaveProfile error:', err);
    return false;
  }
}

// ============================================================================
// ROOM OBJECTS API (3D Miniatures / Items / Feelings)
// ============================================================================

function mapRowToRoomObject(row: any): RoomObject {
  return {
    id: row.id,
    userId: row.user_id,
    userDisplayName: row.user_display_name,
    userPhotoURL: row.user_photo_url,
    postId: row.post_id,
    assetId: row.asset_id,
    name: row.name,
    category: row.category,
    placementSlot: row.placement_slot,
    iconEmoji: row.icon_emoji,
    imageUrl: row.image_url,
    customTextureUrl: row.custom_texture_url,
    x: Number(row.x ?? 50),
    y: Number(row.y ?? 50),
    caption: row.caption,
    memoryNote: row.memory_note,
    visualPromptEn: row.visual_prompt_en,
    date: row.date,
    areaType: row.area_type || 'base_room',
    isPinned: Boolean(row.is_pinned),
    postType: row.post_type,
    feelingType: row.feeling_type,
    feelingEmotion: row.feeling_emotion,
    privacyScope: row.privacy_scope,
    isPrivate: Boolean(row.is_private),
    isCloseFriendsOnly: Boolean(row.is_close_friends_only),
    isSharedItem: Boolean(row.is_shared_item),
    sharedMatchId: row.shared_match_id,
    sharedFriendNames: row.shared_friend_names || [],
    reactions: row.reactions || [],
    giverUid: row.giver_uid,
    giverDisplayName: row.giver_display_name,
    giverPhotoURL: row.giver_photo_url,
    giftMessage: row.gift_message,
    createdAt: row.created_at,
  };
}

function mapRoomObjectToRow(obj: RoomObject) {
  return {
    id: obj.id || `obj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: obj.userId,
    user_display_name: obj.userDisplayName,
    user_photo_url: obj.userPhotoURL,
    post_id: obj.postId,
    asset_id: obj.assetId,
    name: obj.name,
    category: obj.category,
    placement_slot: obj.placementSlot,
    icon_emoji: obj.iconEmoji,
    image_url: obj.imageUrl,
    custom_texture_url: obj.customTextureUrl,
    x: obj.x,
    y: obj.y,
    caption: obj.caption,
    memory_note: obj.memoryNote,
    visual_prompt_en: obj.visualPromptEn,
    date: obj.date,
    area_type: obj.areaType,
    is_pinned: obj.isPinned,
    post_type: obj.postType,
    feeling_type: obj.feelingType,
    feeling_emotion: obj.feelingEmotion,
    privacy_scope: obj.privacyScope,
    is_private: obj.isPrivate,
    is_close_friends_only: obj.isCloseFriendsOnly,
    is_shared_item: obj.isSharedItem,
    shared_match_id: obj.sharedMatchId,
    shared_friend_names: obj.sharedFriendNames,
    reactions: obj.reactions,
    giver_uid: obj.giverUid,
    giver_display_name: obj.giverDisplayName,
    giver_photo_url: obj.giverPhotoURL,
    gift_message: obj.giftMessage,
    created_at: obj.createdAt || new Date().toISOString(),
  };
}

export async function supabaseFetchRoomObjects(userId?: string): Promise<RoomObject[]> {
  if (!isSupabaseConfigured) {
    const list = getLocalData<RoomObject[]>(LOCAL_STORAGE_OBJECTS_KEY, []);
    return userId ? list.filter(o => o.userId === userId) : list;
  }

  try {
    let query = supabase.from('room_objects').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapRowToRoomObject);
  } catch (err) {
    console.error('supabaseFetchRoomObjects error:', err);
    return [];
  }
}

export async function supabaseSaveRoomObject(obj: RoomObject): Promise<RoomObject> {
  const row = mapRoomObjectToRow(obj);

  if (!isSupabaseConfigured) {
    const list = getLocalData<RoomObject[]>(LOCAL_STORAGE_OBJECTS_KEY, []);
    const savedObj = mapRowToRoomObject(row);
    const existingIndex = list.findIndex(item => item.id === savedObj.id);
    if (existingIndex >= 0) {
      list[existingIndex] = savedObj;
    } else {
      list.unshift(savedObj);
    }
    setLocalData(LOCAL_STORAGE_OBJECTS_KEY, list);
    return savedObj;
  }

  try {
    const { data, error } = await supabase
      .from('room_objects')
      .upsert(row)
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to save room object');
    return mapRowToRoomObject(data);
  } catch (err) {
    console.error('supabaseSaveRoomObject error:', err);
    return mapRowToRoomObject(row);
  }
}

export async function supabaseUpdateRoomObject(id: string, updates: Partial<RoomObject>): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const list = getLocalData<RoomObject[]>(LOCAL_STORAGE_OBJECTS_KEY, []);
    const idx = list.findIndex(o => o.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      setLocalData(LOCAL_STORAGE_OBJECTS_KEY, list);
      return true;
    }
    return false;
  }

  try {
    const rowUpdates: any = {};
    if (updates.x !== undefined) rowUpdates.x = updates.x;
    if (updates.y !== undefined) rowUpdates.y = updates.y;
    if (updates.areaType !== undefined) rowUpdates.area_type = updates.areaType;
    if (updates.isPinned !== undefined) rowUpdates.is_pinned = updates.isPinned;
    if (updates.reactions !== undefined) rowUpdates.reactions = updates.reactions;
    if (updates.caption !== undefined) rowUpdates.caption = updates.caption;
    if (updates.name !== undefined) rowUpdates.name = updates.name;

    const { error } = await supabase
      .from('room_objects')
      .update(rowUpdates)
      .eq('id', id);

    return !error;
  } catch (err) {
    console.error('supabaseUpdateRoomObject error:', err);
    return false;
  }
}

export async function supabaseDeleteRoomObject(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const list = getLocalData<RoomObject[]>(LOCAL_STORAGE_OBJECTS_KEY, []);
    setLocalData(LOCAL_STORAGE_OBJECTS_KEY, list.filter(o => o.id !== id));
    return true;
  }

  try {
    const { error } = await supabase.from('room_objects').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('supabaseDeleteRoomObject error:', err);
    return false;
  }
}

// ============================================================================
// FRIEND RELATIONS API
// ============================================================================

export async function supabaseFetchFriends(userId: string): Promise<FriendRelation[]> {
  if (!isSupabaseConfigured) {
    const list = getLocalData<FriendRelation[]>(LOCAL_STORAGE_FRIENDS_KEY, []);
    return list.filter(f => f.userId === userId || f.friendUid === userId);
  }

  try {
    const { data, error } = await supabase
      .from('friend_relations')
      .select('*')
      .or(`user_id.eq.${userId},friend_uid.eq.${userId}`);

    if (error || !data) return [];

    return data.map(r => ({
      id: r.id,
      userId: r.user_id,
      friendUid: r.friend_uid,
      friendDisplayName: r.friend_display_name,
      friendUsername: r.friend_username,
      friendPhotoURL: r.friend_photo_url,
      friendBio: r.friend_bio,
      status: r.status,
      requestedBy: r.requested_by,
      statusText: r.status_text,
      statusEmoji: r.status_emoji,
      isCloseFriend: Boolean(r.is_close_friend),
      assignedCategories: r.assigned_categories || ['親友'],
      recentEvents: r.recent_events || [],
      createdAt: r.created_at,
      acceptedAt: r.accepted_at,
    }));
  } catch (err) {
    console.error('supabaseFetchFriends error:', err);
    return [];
  }
}

export async function supabaseSaveFriend(relation: FriendRelation): Promise<FriendRelation> {
  const id = relation.id || `fr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const row = {
    id,
    user_id: relation.userId,
    friend_uid: relation.friendUid,
    friend_display_name: relation.friendDisplayName,
    friend_username: relation.friendUsername,
    friend_photo_url: relation.friendPhotoURL,
    friend_bio: relation.friendBio,
    status: relation.status || 'accepted',
    requested_by: relation.requestedBy,
    status_text: relation.statusText,
    status_emoji: relation.statusEmoji,
    is_close_friend: relation.isCloseFriend,
    assigned_categories: relation.assignedCategories,
    recent_events: relation.recentEvents,
    created_at: relation.createdAt || new Date().toISOString(),
    accepted_at: relation.acceptedAt,
  };

  if (!isSupabaseConfigured) {
    const list = getLocalData<FriendRelation[]>(LOCAL_STORAGE_FRIENDS_KEY, []);
    const saved = { ...relation, id };
    list.unshift(saved);
    setLocalData(LOCAL_STORAGE_FRIENDS_KEY, list);
    return saved;
  }

  try {
    const { data, error } = await supabase.from('friend_relations').upsert(row).select().single();
    if (error || !data) return { ...relation, id };
    return {
      ...relation,
      id: data.id,
    };
  } catch (err) {
    console.error('supabaseSaveFriend error:', err);
    return { ...relation, id };
  }
}

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export async function supabaseFetchNotifications(userId: string): Promise<AppNotification[]> {
  if (!isSupabaseConfigured) {
    const list = getLocalData<AppNotification[]>(LOCAL_STORAGE_NOTIFS_KEY, []);
    return list.filter(n => n.userId === userId);
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(n => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      description: n.description,
      iconEmoji: n.icon_emoji,
      senderUid: n.sender_uid,
      senderName: n.sender_name,
      senderPhotoURL: n.sender_photo_url,
      targetObjectId: n.target_object_id,
      targetObjectName: n.target_object_name,
      read: Boolean(n.read),
      createdAt: n.created_at,
    }));
  } catch (err) {
    console.error('supabaseFetchNotifications error:', err);
    return [];
  }
}

export async function supabaseCreateNotification(notif: Omit<AppNotification, 'id'>): Promise<boolean> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const row = {
    id,
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    description: notif.description,
    icon_emoji: notif.iconEmoji,
    sender_uid: notif.senderUid,
    sender_name: notif.senderName,
    sender_photo_url: notif.senderPhotoURL,
    target_object_id: notif.targetObjectId,
    target_object_name: notif.targetObjectName,
    read: notif.read || false,
    created_at: notif.createdAt || new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    const list = getLocalData<AppNotification[]>(LOCAL_STORAGE_NOTIFS_KEY, []);
    list.unshift({ ...notif, id });
    setLocalData(LOCAL_STORAGE_NOTIFS_KEY, list);
    return true;
  }

  try {
    const { error } = await supabase.from('notifications').insert(row);
    return !error;
  } catch (err) {
    console.error('supabaseCreateNotification error:', err);
    return false;
  }
}

// ============================================================================
// IMAGE STORAGE API (Supabase Storage Bucket: room-photos)
// ============================================================================

export async function supabaseUploadImage(file: File | Blob, fileName?: string): Promise<string> {
  if (!isSupabaseConfigured) {
    // Return Object URL or Base64 in local mode
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  try {
    const cleanName = `${Date.now()}_${fileName || 'photo.png'}`;
    const filePath = `uploads/${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from('room-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload fallback:', uploadError);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data } = supabase.storage.from('room-photos').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (e) {
    console.error('supabaseUploadImage error:', e);
    return '';
  }
}

// ============================================================================
// REALTIME SUBSCRIPTION HELPERS
// ============================================================================

export function supabaseSubscribeToRoomObjects(userId: string, onUpdate: (objects: RoomObject[]) => void) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`room_objects_${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_objects' },
      async () => {
        const refreshed = await supabaseFetchRoomObjects();
        onUpdate(refreshed);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
