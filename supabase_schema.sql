-- ============================================================================
-- Supabase Schema for Roomon (DailyLink Closed Room SNS)
-- Paste this into your Supabase Dashboard -> SQL Editor and click RUN
-- ============================================================================

-- 1. Profiles Table (Synced with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- matches auth.users.id
  display_name TEXT NOT NULL DEFAULT 'ユーザー',
  username TEXT,
  photo_url TEXT,
  bio TEXT DEFAULT '日常のできごとをお部屋に飾っています🌱',
  avatar_outfit TEXT DEFAULT 'casual_hoodie',
  avatar_accessory TEXT,
  custom_share_categories JSONB DEFAULT '["親友", "部活", "家族", "パートナー"]'::jsonb,
  latest_status JSONB DEFAULT '{"text": "Roomonをはじめました！", "emoji": "🌱"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (true);

-- 2. Room Objects Table (3D Miniature Items & Feelings)
CREATE TABLE IF NOT EXISTS public.room_objects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_display_name TEXT,
  user_photo_url TEXT,
  post_id TEXT,
  asset_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  placement_slot TEXT NOT NULL DEFAULT 'floor',
  icon_emoji TEXT DEFAULT '✨',
  image_url TEXT,
  custom_texture_url TEXT,
  x NUMERIC DEFAULT 50,
  y NUMERIC DEFAULT 50,
  caption TEXT,
  memory_note TEXT,
  visual_prompt_en TEXT,
  date TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'base_room',
  is_pinned BOOLEAN DEFAULT false,
  post_type TEXT DEFAULT 'item',
  feeling_type TEXT,
  feeling_emotion TEXT,
  privacy_scope TEXT DEFAULT 'friends',
  is_private BOOLEAN DEFAULT false,
  is_close_friends_only BOOLEAN DEFAULT false,
  is_shared_item BOOLEAN DEFAULT false,
  shared_match_id TEXT,
  shared_friend_names JSONB DEFAULT '[]'::jsonb,
  reactions JSONB DEFAULT '[]'::jsonb,
  giver_uid TEXT,
  giver_display_name TEXT,
  giver_photo_url TEXT,
  gift_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.room_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room objects are viewable by all authenticated users" 
  ON public.room_objects FOR SELECT USING (true);

CREATE POLICY "Users can insert room objects" 
  ON public.room_objects FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their room objects or add reactions" 
  ON public.room_objects FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own room objects" 
  ON public.room_objects FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_room_objects_user_id ON public.room_objects(user_id);
CREATE INDEX IF NOT EXISTS idx_room_objects_date ON public.room_objects(date);

-- 3. Friend Relations Table
CREATE TABLE IF NOT EXISTS public.friend_relations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  friend_uid TEXT NOT NULL,
  friend_display_name TEXT NOT NULL,
  friend_username TEXT,
  friend_photo_url TEXT,
  friend_bio TEXT,
  status TEXT NOT NULL DEFAULT 'accepted',
  requested_by TEXT,
  status_text TEXT,
  status_emoji TEXT,
  is_close_friend BOOLEAN DEFAULT false,
  assigned_categories JSONB DEFAULT '["親友"]'::jsonb,
  recent_events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

ALTER TABLE public.friend_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Friend relations are viewable by involved users" 
  ON public.friend_relations FOR SELECT USING (true);

CREATE POLICY "Users can insert friend relations" 
  ON public.friend_relations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update friend relations" 
  ON public.friend_relations FOR UPDATE USING (true);

CREATE POLICY "Users can delete friend relations" 
  ON public.friend_relations FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_friend_relations_user ON public.friend_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_relations_friend ON public.friend_relations(friend_uid);

-- 4. App Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT DEFAULT '🔔',
  sender_uid TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_photo_url TEXT,
  target_object_id TEXT,
  target_object_name TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications viewable by target user" 
  ON public.notifications FOR SELECT USING (true);

CREATE POLICY "Anyone can create notification for users" 
  ON public.notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notifications" 
  ON public.notifications FOR UPDATE USING (true);

CREATE POLICY "Users can delete notifications" 
  ON public.notifications FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- 5. Shared Matches Table
CREATE TABLE IF NOT EXISTS public.shared_matches (
  id TEXT PRIMARY KEY,
  pass_code TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  creator_display_name TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  matched_user_ids JSONB DEFAULT '[]'::jsonb,
  matched_user_names JSONB DEFAULT '[]'::jsonb,
  object_template JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shared_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared matches viewable by all" 
  ON public.shared_matches FOR SELECT USING (true);

CREATE POLICY "Insert shared matches" 
  ON public.shared_matches FOR INSERT WITH CHECK (true);

CREATE POLICY "Update shared matches" 
  ON public.shared_matches FOR UPDATE USING (true);

-- 6. Mood Wave Canvas Data
CREATE TABLE IF NOT EXISTS public.wave_canvas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  points JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wave_canvas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wave canvas viewable by all" 
  ON public.wave_canvas FOR SELECT USING (true);

CREATE POLICY "Wave canvas insert and update" 
  ON public.wave_canvas FOR ALL USING (true);

-- 7. Enable Realtime Replication for Tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_objects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_relations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 8. Storage Buckets (For Image Uploads)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('room-photos', 'room-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public room photos bucket access" 
  ON storage.objects FOR SELECT USING (bucket_id = 'room-photos');

CREATE POLICY "Public room photos upload access" 
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-photos');
