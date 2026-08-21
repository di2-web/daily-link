export type PlacementSlot = 'wall' | 'desk' | 'floor' | 'shelf' | 'terrace' | 'free';
export type RoomAreaType = 'base_room' | 'todays_spot' | 'closet';

export type PostCategory =
  | 'meal'
  | 'book'
  | 'music'
  | 'outing'
  | 'hobby'
  | 'shopping'
  | 'nature'
  | 'other';

export type ObjectCategory =
  | 'wall'
  | 'desk'
  | 'floor'
  | 'shelf'
  | 'plant'
  | 'hobby'
  | 'music'
  | 'meal'
  | 'work'
  | 'gift'
  | 'memory';

export interface UserProfile {
  uid: string;
  displayName: string;
  username?: string; // e.g. @aya_room
  photoURL: string;
  bio: string;
  avatarOutfit?: string; // e.g. 'casual_hoodie', 'knit_sweater'
  avatarAccessory?: string; // e.g. 'camera', 'tote_bag'
  customShareCategories?: string[]; // e.g. ['親友', '部活', '家族', 'パートナー']
  latestStatus?: {
    text: string;
    emoji: string;
    updatedAt: string;
  };
  createdAt: string;
}

export interface RecentEvent {
  id: string;
  emoji: string;
  title: string;
  timeAgo: string;
  date: string;
}

export interface WavePoint {
  hour: number;
  mood: number;
}

export interface MomentPost {
  id?: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  contentText?: string;
  mediaUrls?: string[];
  audioUrl?: string;
  locationData?: any;
  musicMetadata?: any;
  moodScore?: number;
  privacyScope?: 'public' | 'friends' | 'private';
  isPrivate?: boolean;
  isCloseFriendsOnly?: boolean;
  createdAt: string;
  date: string;
}

export interface RoomItemReaction {
  id: string;
  type: 'flower' | 'coffee' | 'heart' | 'book' | 'plushie' | 'footprint';
  itemSubtype?: string; // e.g. 'tulip', 'sunflower', 'latte', 'cat_plushie'
  senderUid: string;
  senderName: string;
  senderPhotoURL: string;
  message?: string;
  createdAt: string;
}

export interface RoomObject {
  id?: string;
  userId: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  postId?: string;
  assetId: string;
  name: string;
  category: ObjectCategory;
  placementSlot: PlacementSlot;
  iconEmoji: string;
  imageUrl?: string;
  customTextureUrl?: string; // photo attached from post
  x: number; // 0-100% position
  y: number; // 0-100% position
  caption?: string; // 投稿本文
  memoryNote?: string;
  visualPromptEn?: string; // 3Dモデル生成用の視覚的英語プロンプト
  date: string; // YYYY-MM-DD
  areaType: RoomAreaType; // 'base_room' | 'todays_spot' | 'closet'
  isPinned: boolean;
  postType?: 'item' | 'feeling'; // アイテム（出来事・物）か、キモチ（感情・気分）か
  feelingType?: string; // e.g. 'calm', 'tired', 'happy', 'thinking', 'gloomy', 'spark'
  feelingEmotion?: string; // e.g. '☁️ もやもや', '☀️ ぽかぽか'
  privacyScope?: 'public' | 'friends' | 'private';
  isPrivate?: boolean;
  isCloseFriendsOnly?: boolean;
  isSharedItem?: boolean;
  sharedMatchId?: string;
  sharedFriendNames?: string[];
  reactions?: RoomItemReaction[];
  giverUid?: string;
  giverDisplayName?: string;
  giverPhotoURL?: string;
  giftMessage?: string;
  createdAt: string;
}

export interface SharedMatch {
  id?: string;
  passCode: string;
  creatorId: string;
  creatorDisplayName: string;
  expiresAt: string;
  matchedUserIds: string[];
  matchedUserNames?: string[];
  objectTemplate: {
    name: string;
    category: ObjectCategory;
    iconEmoji: string;
    imageUrl?: string;
    memoryNote?: string;
    placementSlot?: PlacementSlot;
  };
  createdAt: string;
}

export interface FriendRelation {
  id?: string;
  userId: string;
  friendUid: string;
  friendDisplayName: string;
  friendUsername?: string;
  friendPhotoURL: string;
  friendBio?: string;
  status?: 'accepted' | 'pending' | 'rejected';
  requestedBy?: string; // UID of user who sent request
  statusText?: string;
  statusEmoji?: string;
  lastActiveText?: string; // e.g. 'オンライン', '2時間前', '昨日'
  isCloseFriend?: boolean;
  assignedCategories: string[];
  recentEvents?: RecentEvent[];
  createdAt: string;
  acceptedAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'flower' | 'coffee' | 'reaction' | 'visit' | 'gift' | 'match' | 'friend_request' | 'friend_accept';
  title: string;
  description: string;
  iconEmoji: string;
  senderUid: string;
  senderName: string;
  senderPhotoURL: string;
  targetObjectId?: string;
  targetObjectName?: string;
  read: boolean;
  createdAt: string;
}

export interface RoomPresetItem {
  id: string;
  name: string;
  category: ObjectCategory;
  placementSlot: PlacementSlot;
  iconEmoji: string;
  defaultX: number;
  defaultY: number;
  imageUrl: string;
  description: string;
}
