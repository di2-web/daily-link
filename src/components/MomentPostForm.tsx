import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, RoomObject, PlacementSlot, ObjectCategory } from '../types';
import { parseMomentToRoomObject, transcribeAudioWithAi } from '../lib/geminiApi';
import {
  supabaseSaveRoomObject,
  supabaseFetchRoomObjects,
  supabaseUpdateRoomObject,
  supabaseUploadImage,
} from '../lib/supabase';
import {
  X,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Mic,
  Square,
  Music,
  MapPin,
  Pin,
  Loader2,
  CheckCircle2,
  Sliders,
  Volume2,
} from 'lucide-react';

interface MomentPostFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  selectedDate: string; // YYYY-MM-DD
  onObjectCreated: (obj: RoomObject) => void;
  userMoodScore?: number;
}

export const MomentPostForm: React.FC<MomentPostFormProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedDate,
  onObjectCreated,
  userMoodScore = 0,
}) => {
  const [contentText, setContentText] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Music input toggle
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [musicTrack, setMusicTrack] = useState('');
  const [musicArtist, setMusicArtist] = useState('');

  // Location input toggle
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationSpot, setLocationSpot] = useState('');

  // Mood Score (-100 to +100)
  const [moodScore, setMoodScore] = useState<number>(userMoodScore || 20);

  // Pin protection
  const [isProtected, setIsProtected] = useState(false);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<{
    name: string;
    category: ObjectCategory;
    placementSlot: PlacementSlot;
    iconEmoji: string;
    memoryNote: string;
    suggestedX: number;
    suggestedY: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      setContentText('');
      setMediaUrls([]);
      setAudioUrl(null);
      setGeneratedPreview(null);
      setMusicTrack('');
      setMusicArtist('');
      setLocationSpot('');
      setIsProtected(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Image Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setMediaUrls((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioReader = new FileReader();
        audioReader.onloadend = async () => {
          const base64Audio = audioReader.result as string;
          setAudioUrl(base64Audio);

          // Auto-transcribe using AI
          try {
            setIsTranscribing(true);
            const transcript = await transcribeAudioWithAi(base64Audio, 'audio/webm');
            if (transcript) {
              setContentText((prev) => (prev ? `${prev} ${transcript}` : transcript));
            }
          } catch (err) {
            console.warn('Transcription error:', err);
          } finally {
            setIsTranscribing(false);
          }
        };
        audioReader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('マイクへのアクセスが許可されていません。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Location Geolocation helper
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('お使いのブラウザは位置情報に対応していません。');
      return;
    }
    setShowLocationInput(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationSpot(`現在地付近 (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
      },
      () => {
        setLocationSpot('お気に入りの場所');
      }
    );
  };

  // Submit and Convert to Room Object via AI Pipeline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentText && mediaUrls.length === 0 && !audioUrl && !musicTrack) {
      alert('写真、テキスト、音声、音楽のいずれかを入力してください。');
      return;
    }

    setIsGenerating(true);

    try {
      // 1. AI Media to Room Object Parsing
      const aiObject = await parseMomentToRoomObject({
        contentText,
        mediaUrls,
        locationData: locationSpot ? { spotName: locationSpot } : null,
        musicMetadata: musicTrack ? { trackName: musicTrack, artistName: musicArtist } : null,
        moodScore,
        hour: new Date().getHours(),
        userDisplayName: currentUser.displayName,
      });

      // 1.5. Generate or fetch 3D Cozy Clay Miniature image
      let itemImageUrl = mediaUrls[0] || undefined;
      try {
        const imgRes = await fetch('/api/ai/generate-item-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemName: aiObject.name,
            category: aiObject.category,
            memoryNote: aiObject.memoryNote,
            style: 'clay_3d',
            referenceImageBase64: mediaUrls[0] || null,
          }),
        });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          if (imgData.imageUrl) {
            itemImageUrl = imgData.imageUrl;
          }
        }
      } catch (imgErr) {
        console.warn('3D item image generation fallback:', imgErr);
      }

      // 2. Determine initial areaType and execute Pattern 2 push-out if necessary
      // Rule: New items go to 'todays_spot' (or 'base_room' if pinned)
      const targetArea = isProtected ? 'base_room' : 'todays_spot';

      // Check current base_room items count to maintain 10-12 limit
      if (targetArea === 'base_room') {
        const allObjects = await supabaseFetchRoomObjects();
        const baseItems = allObjects.filter(
          (o) => o.userId === currentUser.uid && o.areaType === 'base_room'
        );

        if (baseItems.length >= 12) {
          // Push-out Pattern 2:
          // 1. Find oldest unpinned standalone item
          const unpinnedSolo = baseItems
            .filter((it) => !it.isPinned && !it.isSharedItem)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          if (unpinnedSolo.length > 0) {
            const pushItem = unpinnedSolo[0];
            await supabaseUpdateRoomObject(pushItem.id, { areaType: 'closet' });
          } else {
            // 2. Find oldest unpinned shared item
            const unpinnedShared = baseItems
              .filter((it) => !it.isPinned && it.isSharedItem)
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            if (unpinnedShared.length > 0) {
              const pushItem = unpinnedShared[0];
              await supabaseUpdateRoomObject(pushItem.id, { areaType: 'closet' });
            }
          }
        }
      }

      // 3. Save the generated Room Object to Supabase
      const newRoomObject: Omit<RoomObject, 'id'> = {
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName,
        userPhotoURL: currentUser.photoURL,
        assetId: `${aiObject.category}_${Date.now()}`,
        name: aiObject.name,
        category: aiObject.category,
        placementSlot: aiObject.placementSlot,
        iconEmoji: aiObject.iconEmoji,
        imageUrl: itemImageUrl || mediaUrls[0] || undefined,
        customTextureUrl: mediaUrls[0] || undefined,
        x: aiObject.suggestedX || 45,
        y: aiObject.suggestedY || 65,
        memoryNote: aiObject.memoryNote,
        date: selectedDate,
        areaType: targetArea,
        isPinned: isProtected || Boolean(aiObject.isPinRecommended),
        privacyScope: isProtected ? 'private' : 'friends',
        isPrivate: Boolean(isProtected),
        isSharedItem: false,
        createdAt: new Date().toISOString(),
      };

      const savedRoomObject = await supabaseSaveRoomObject(newRoomObject);
      onObjectCreated(savedRoomObject);

      onClose();
    } catch (err) {
      console.error('Error creating moment & room object:', err);
      alert('オブジェクトの作成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-stone-50 rounded-3xl max-w-lg w-full overflow-hidden border border-stone-200/90 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-100/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h3 className="font-bold text-stone-900 text-base">日常のスキマ記録</h3>
              <p className="text-xs text-stone-500">AIが解析して部屋のインテリアに変換します</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Text Area */}
          <div>
            <textarea
              rows={3}
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="何気ない出来事や今考えていること、食べたものなど...（例: 友達とカフェで話した、ライブ最高だった）"
              className="w-full px-4 py-3 rounded-2xl bg-white border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm leading-relaxed transition-all resize-none"
            />
          </div>

          {/* Photo Previews */}
          {mediaUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {mediaUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-200 shrink-0">
                  <img src={url} alt="Attached" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-stone-900/70 text-white hover:bg-stone-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Audio Player if recorded */}
          {audioUrl && (
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-sky-600" />
                <span className="text-xs text-sky-900 font-medium">音声メモを添付中</span>
                {isTranscribing && (
                  <span className="text-[11px] text-sky-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> 文字起こし中
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setAudioUrl(null)}
                className="text-xs text-stone-400 hover:text-rose-500"
              >
                削除
              </button>
            </div>
          )}

          {/* Optional Music Input */}
          {showMusicInput && (
            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-purple-900 font-medium">
                <span className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-600" /> 聴いていた音楽
                </span>
                <button
                  type="button"
                  onClick={() => setShowMusicInput(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={musicTrack}
                  onChange={(e) => setMusicTrack(e.target.value)}
                  placeholder="曲名（例: Pretender）"
                  className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-purple-400"
                />
                <input
                  type="text"
                  value={musicArtist}
                  onChange={(e) => setMusicArtist(e.target.value)}
                  placeholder="アーティスト名"
                  className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-purple-400"
                />
              </div>
            </div>
          )}

          {/* Optional Location Input */}
          {showLocationInput && (
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-900 font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> スポット・場所
                </span>
                <button
                  type="button"
                  onClick={() => setShowLocationInput(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={locationSpot}
                onChange={(e) => setLocationSpot(e.target.value)}
                placeholder="場所の名前（例: 渋谷のカフェ、代々木公園）"
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          )}

          {/* Mood Slider */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs text-stone-600 mb-1.5">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-amber-600" /> その時の気分
              </span>
              <span className="font-semibold text-stone-800">
                {moodScore > 30 ? '😆 最高・高揚' : moodScore > 0 ? '😊 ほのぼの・充実' : moodScore > -30 ? '😐 穏やか・ふつう' : '🌙 静か・リラックス'}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={moodScore}
              onChange={(e) => setMoodScore(parseInt(e.target.value, 10))}
              className="w-full accent-amber-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
            />
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <div className="flex items-center gap-1">
              {/* Media File Upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl hover:bg-stone-200/70 text-stone-600 hover:text-stone-900 transition-colors"
                title="写真・画像を追加"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Voice Record Button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-xl transition-colors ${
                  isRecording
                    ? 'bg-rose-100 text-rose-600 animate-pulse ring-1 ring-rose-400'
                    : 'hover:bg-stone-200/70 text-stone-600 hover:text-stone-900'
                }`}
                title={isRecording ? '録音を停止' : '音声メモを録音'}
              >
                {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Music Toggle */}
              <button
                type="button"
                onClick={() => setShowMusicInput(!showMusicInput)}
                className={`p-2 rounded-xl hover:bg-stone-200/70 transition-colors ${
                  showMusicInput ? 'text-purple-600 bg-purple-100' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="音楽を追加"
              >
                <Music className="w-5 h-5" />
              </button>

              {/* Location Toggle */}
              <button
                type="button"
                onClick={handleGetLocation}
                className={`p-2 rounded-xl hover:bg-stone-200/70 transition-colors ${
                  showLocationInput ? 'text-emerald-600 bg-emerald-100' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="位置情報を追加"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>

            {/* Pin Protection Toggle */}
            <button
              type="button"
              onClick={() => setIsProtected(!isProtected)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isProtected
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
              }`}
              title="普段の部屋へピン留め（押し出し保護）"
            >
              <Pin className={`w-3.5 h-3.5 ${isProtected ? 'fill-amber-700 text-amber-700' : ''}`} />
              <span>{isProtected ? 'ピン留め中' : 'ピン留め'}</span>
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 rounded-2xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                  <span>AIが空間オブジェクトを生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>空間オブジェクトに変換して部屋に飾る</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
