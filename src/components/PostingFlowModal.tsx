import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Lock,
  Users,
  EyeOff,
  Tag,
  Mic,
  Square,
  Volume2,
  RotateCw,
} from 'lucide-react';
import { RoomObject, PlacementSlot } from '../types';
import { transcribeAudioWithAi, generateItemImageWithAi } from '../lib/geminiApi';
import { RoomObjectImage } from './RoomObjectImage';

interface PostingFlowModalProps {
  currentUserUid: string;
  currentUserDisplayName: string;
  onClose: () => void;
  onCompletePost: (newObject: RoomObject) => void;
}

interface SuggestedItem {
  id: string;
  name: string;
  category?: string;
  placementSlot?: PlacementSlot;
  iconEmoji: string;
  imageUrl?: string;
  visualPromptEn?: string;
  defaultX?: number;
  defaultY?: number;
  memoryNote: string;
}

const EMOTION_PRESETS = [
  { emoji: '☀️', label: '☀️ 晴れやか' },
  { emoji: '☕', label: '☕ ほっと一息' },
  { emoji: '🌿', label: '🌿 リラックス' },
  { emoji: '💪', label: '💪 がんばった！' },
  { emoji: '💭', label: '💭 考え中・もやもや' },
  { emoji: '😴', label: '😴 おつかれ・眠い' },
  { emoji: '✨', label: '✨ わくわく' },
  { emoji: '🌸', label: '🌸 うれしい・感謝' },
  { emoji: '🛋️', label: '🛋️ まったり' },
  { emoji: '🌙', label: '🌙 しみじみ・夜更かし' },
];

export const PostingFlowModal: React.FC<PostingFlowModalProps> = ({
  currentUserUid,
  currentUserDisplayName,
  onClose,
  onCompletePost,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [postType, setPostType] = useState<'item' | 'feeling'>('item');
  const [feelingEmotion, setFeelingEmotion] = useState<string>('💭 考え中');
  const [contentText, setContentText] = useState('');
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Clean up recording stream on component unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const [loadingAi, setLoadingAi] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationStatusMessage, setGenerationStatusMessage] = useState<string | null>(null);
  const [generationErrorNotice, setGenerationErrorNotice] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [suggestedItems, setSuggestedItems] = useState<SuggestedItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  // Pre-generated image states per candidate item: index -> { loading, url, source, error }
  const [itemImageStates, setItemImageStates] = useState<
    Record<number, { loading: boolean; url: string | null; source?: string; error?: string }>
  >({});

  const [privacyScope, setPrivacyScope] = useState<'all' | 'close' | 'only_me'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start pre-generating 3D miniature images for all candidate items in parallel
  const preGenerateImagesForItems = (items: SuggestedItem[], refMedia: string | null) => {
    items.forEach((item, idx) => {
      setItemImageStates((prev) => ({
        ...prev,
        [idx]: { loading: true, url: null },
      }));

      generateItemImageWithAi({
        itemName: item.name,
        category: item.category || 'memory',
        memoryNote: item.memoryNote,
        visualPromptEn: item.visualPromptEn,
        iconEmoji: item.iconEmoji || '✨',
        style: 'clay_3d',
        referenceImageBase64: refMedia || null,
      })
        .then((res) => {
          if (res.imageUrl) {
            setItemImageStates((prev) => ({
              ...prev,
              [idx]: { loading: false, url: res.imageUrl, source: res.source },
            }));
            setSuggestedItems((curr) => {
              const updated = [...curr];
              if (updated[idx]) {
                updated[idx] = { ...updated[idx], imageUrl: res.imageUrl };
              }
              return updated;
            });
          } else {
            setItemImageStates((prev) => ({
              ...prev,
              [idx]: { loading: false, url: null, error: res.message },
            }));
          }
        })
        .catch((err) => {
          console.warn(`[PreGen] Error generating image for candidate ${idx}:`, err);
          setItemImageStates((prev) => ({
            ...prev,
            [idx]: { loading: false, url: null, error: '生成エラー' },
          }));
        });
    });
  };

  // Voice Recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setAudioBlobUrl(base64Audio);
          setIsTranscribing(true);
          try {
            const transcribed = await transcribeAudioWithAi(base64Audio, 'audio/webm');
            if (transcribed) {
              setContentText((prev) => (prev ? `${prev} ${transcribed}` : transcribed));
            }
          } catch (err) {
            console.error('Audio transcription error:', err);
          } finally {
            setIsTranscribing(false);
          }
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start audio recording:', err);
      alert('マイクの使用許可が必要です。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1 -> Step 2: Call Gemini API for Iconic Item Suggestions and start pre-generating images
  const handleProceedToAiSuggestions = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/suggest-moment-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentText: contentText || (postType === 'feeling' ? feelingEmotion : ''),
          mediaUrls: mediaDataUrl ? [mediaDataUrl] : [],
          userDisplayName: currentUserDisplayName,
          postType,
          feelingEmotion: postType === 'feeling' ? feelingEmotion : undefined,
        }),
      });
      const data = await res.json();
      let candidates: SuggestedItem[] = [];
      if (data.items && data.items.length > 0) {
        candidates = data.items;
        setSuggestedItems(candidates);
        setAiExplanation(
          data.reasonExplanation ||
            (postType === 'feeling'
              ? '今のキモチをやさしく包み込むエモーショントイをセレクトしました。'
              : '今日のできごとを象徴するオブジェクトをセレクトしました。')
        );
      } else {
        candidates =
          postType === 'feeling'
            ? [
                {
                  id: 'feeling_1',
                  name: 'ほっこり光のオーブ',
                  category: 'memory',
                  placementSlot: 'free',
                  iconEmoji: '✨',
                  defaultX: 45,
                  defaultY: 50,
                  memoryNote: contentText || `${feelingEmotion}な気持ちを包んだ光のしるし`,
                },
              ]
            : [
                {
                  id: 'item_1',
                  name: contentText.slice(0, 10) || '出来事のしるし',
                  category: 'memory',
                  placementSlot: 'free',
                  iconEmoji: '📝',
                  defaultX: 45,
                  defaultY: 65,
                  memoryNote: contentText || '今日を象徴するアイテム',
                },
              ];
        setSuggestedItems(candidates);
        setAiExplanation(
          postType === 'feeling'
            ? '今のキモチに寄り添うエモーショントイを作成しました。'
            : '日常の記録から象徴オブジェクトを作成しました。'
        );
      }
      setStep(2);
      // Immediately start background 3D image generation for all candidates
      preGenerateImagesForItems(candidates, mediaDataUrl);
    } catch (err) {
      console.error('Error suggesting items:', err);
      const fallback: SuggestedItem[] =
        postType === 'feeling'
          ? [
              {
                id: 'feeling_fallback',
                name: 'キモチのしずく',
                category: 'memory',
                placementSlot: 'free',
                iconEmoji: '💭',
                defaultX: 45,
                defaultY: 50,
                memoryNote: contentText || feelingEmotion,
              },
            ]
          : [
              {
                id: 'item_fallback',
                name: contentText.slice(0, 10) || '日常の記録',
                category: 'memory',
                placementSlot: 'free',
                iconEmoji: '✏️',
                defaultX: 45,
                defaultY: 65,
                memoryNote: contentText,
              },
            ];
      setSuggestedItems(fallback);
      setStep(2);
      preGenerateImagesForItems(fallback, mediaDataUrl);
    } finally {
      setLoadingAi(false);
    }
  };

  // Final Complete Post -> Add to Room
  const handleFinalSubmit = async () => {
    const chosenItem = suggestedItems[selectedItemIndex] || suggestedItems[0];
    const itemImgState = itemImageStates[selectedItemIndex];
    const today = new Date().toISOString().slice(0, 10);

    let finalImageUrl = itemImgState?.url || chosenItem.imageUrl || mediaDataUrl || undefined;

    // If image is still generating for this item, wait up to 3 seconds for it
    if (itemImgState?.loading && !finalImageUrl) {
      setIsGeneratingImage(true);
      setGenerationStatusMessage('3D画像の生成を完了しています...');
      // Wait shortly for background generation to finish
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 200));
        if (itemImageStates[selectedItemIndex]?.url) {
          finalImageUrl = itemImageStates[selectedItemIndex].url!;
          break;
        }
      }
      setIsGeneratingImage(false);
    }

    const isPrivate = privacyScope === 'only_me';
    const isClose = privacyScope === 'close';
    const mappedScope: 'public' | 'friends' | 'private' = isPrivate
      ? 'private'
      : isClose
      ? 'friends'
      : 'public';

    const rawObj: RoomObject = {
      userId: currentUserUid,
      userDisplayName: currentUserDisplayName,
      assetId: chosenItem.id || `obj_${Date.now()}`,
      name: chosenItem.name,
      category: (chosenItem.category as any) || 'memory',
      placementSlot: chosenItem.placementSlot || 'free',
      iconEmoji: chosenItem.iconEmoji || (postType === 'feeling' ? '💭' : '✨'),
      x: chosenItem.defaultX || 45,
      y: chosenItem.defaultY || 65,
      caption: contentText || (postType === 'feeling' ? feelingEmotion : ''),
      memoryNote: chosenItem.memoryNote || contentText || feelingEmotion,
      date: today,
      areaType: 'base_room',
      isPinned: false,
      privacyScope: mappedScope,
      isPrivate: isPrivate,
      isCloseFriendsOnly: isClose,
      postType: postType,
      feelingEmotion: postType === 'feeling' ? feelingEmotion : undefined,
      feelingType: postType === 'feeling' ? 'orb' : undefined,
      reactions: [],
      createdAt: new Date().toISOString(),
      ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
      ...(mediaDataUrl ? { customTextureUrl: mediaDataUrl } : {}),
    };

    onCompletePost(rawObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#faf8f5] rounded-3xl max-w-sm sm:max-w-md w-full border border-stone-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Step Indicator Header (Image 2) */}
        <div className="bg-white px-4 py-3.5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold flex items-center justify-center">
              {step}
            </span>
            <h3 className="font-bold text-xs sm:text-sm text-stone-900">
              {step === 1 && (postType === 'feeling' ? '今のキモチを残す' : '今日のできごとを入力')}
              {step === 2 && (postType === 'feeling' ? 'AIがキモチを形に提案' : 'AIがアイテムを提案')}
              {step === 3 && '公開範囲を選ぶ'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: Mode Switcher & Content Input */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Type Switcher: Item vs Feeling */}
              <div className="bg-stone-100 p-1 rounded-2xl flex items-center gap-1 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setPostType('item')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    postType === 'item'
                      ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <span>🎁</span>
                  <span>アイテム（出来事・モノ）</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('feeling')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    postType === 'feeling'
                      ? 'bg-white text-amber-950 shadow-xs border border-amber-200'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <span>💭</span>
                  <span>キモチ（気持ち・気分）</span>
                </button>
              </div>

              {/* Feeling Emotion Chips Selection (When feeling is active) */}
              {postType === 'feeling' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    いまの気分・感情タグを選ぶ（タップで選択）
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                    {EMOTION_PRESETS.map((preset) => {
                      const isSelected = feelingEmotion === preset.label;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setFeelingEmotion(preset.label)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold shadow-xs scale-102'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    {postType === 'feeling'
                      ? '気持ちのつぶやき・一言（任意）'
                      : '今日はどんな1日だった？'}
                  </label>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>停止</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3 text-rose-500" />
                        <span>音声で話す</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder={
                    postType === 'feeling'
                      ? '例: なんとなく心が落ち着かない、今日の夕焼けが綺麗で癒やされた、模試終わって抜け殻状態...'
                      : '例: ずっと楽しみにしてたライブ！席も近くて最高の時間だった…また行きたいな🥺🎸'
                  }
                  className="w-full p-3 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
                {isTranscribing && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1.5 mt-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Whisperが音声を文字起こし中...</span>
                  </p>
                )}
              </div>

              {/* Photo Attachment */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  写真・動画を追加（任意）
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {mediaDataUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 h-36 bg-stone-100">
                    <img
                      src={mediaDataUrl}
                      alt="Uploaded media"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaDataUrl(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl bg-white/70 flex flex-col items-center justify-center gap-1 text-stone-500 hover:text-amber-700 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-6 h-6 text-stone-400" />
                    <span className="text-xs font-bold">写真を添付する</span>
                    <span className="text-[10px] text-stone-400">
                      ドラッグ＆ドロップまたはクリック
                    </span>
                  </button>
                )}
              </div>

              {/* Hints / Description */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-[11px] text-stone-600 leading-relaxed">
                <span className="font-bold text-stone-800">
                  {postType === 'feeling' ? '💭 キモチの記録：' : '💡 どんな日常でもOK：'}
                </span>
                <p className="mt-0.5 text-stone-500">
                  {postType === 'feeling'
                    ? '「もやもや」「しんどい」「ほっこり」「おつかれ」など、形にしにくい気持ちをやさしく包み込む【キモチ結晶・感情オーブ・ムードボトル】をAIが作ります。'
                    : '「模試で疲れた」「雨でびしょ濡れ」「ライブで叫んだ」「料理で焦がした」など、あなたの出来事そのものを象徴する3DアイテムをAIが作ります。'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: AI Item Suggestions with Live Pre-generated 3D Images */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                  {aiExplanation}
                  <br />
                  <span className="font-bold text-stone-800">
                    部屋に追加したい象徴オブジェクトを選んでください：
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                {suggestedItems.map((item, idx) => {
                  const isSelected = selectedItemIndex === idx;
                  const imgState = itemImageStates[idx];
                  const liveImageUrl = imgState?.url || item.imageUrl;

                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => setSelectedItemIndex(idx)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/20 shadow-md scale-101'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* 3D Miniature Thumbnail Preview */}
                        <div className="relative w-14 h-14 rounded-2xl bg-stone-100/70 border border-stone-200/90 shadow-2xs overflow-hidden flex items-center justify-center shrink-0 p-1">
                          {imgState?.loading ? (
                            <div className="flex flex-col items-center justify-center gap-1 text-amber-600">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span className="text-[8px] font-bold">3D生成中</span>
                            </div>
                          ) : liveImageUrl ? (
                            <RoomObjectImage
                              src={liveImageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain filter drop-shadow-xs transform transition-transform hover:scale-105"
                            />
                          ) : (
                            <span className="text-2xl">{item.iconEmoji}</span>
                          )}

                          {/* Source badge if generated */}
                          {imgState?.source && !imgState.loading && (
                            <span className="absolute bottom-0.5 right-0.5 text-[7px] font-extrabold px-1 rounded bg-black/60 text-white leading-tight">
                              3D
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                              {item.name}
                            </h4>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium shrink-0">
                              自由配置
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {item.memoryNote}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-stone-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Privacy Scope Selection (Image 2 - Step 4) */}
          {step === 3 && (
            <div className="space-y-3.5">
              <div>
                <h4 className="text-xs font-bold text-stone-700 mb-2">公開範囲を選んでください</h4>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPrivacyScope('all')}
                    className={`w-full p-3 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                      privacyScope === 'all'
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                        : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">友達全員に公開</p>
                        <p className="text-[10px] text-stone-500">
                          部屋を訪れたすべての友達が見られます
                        </p>
                      </div>
                    </div>
                    {privacyScope === 'all' && (
                      <Check className="w-4 h-4 text-amber-600 font-bold" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacyScope('close')}
                    className={`w-full p-3 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                      privacyScope === 'close'
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                        : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">親しい友達のみ</p>
                        <p className="text-[10px] text-stone-500">
                          親しい友達リストのユーザーだけが見られます
                        </p>
                      </div>
                    </div>
                    {privacyScope === 'close' && (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacyScope('only_me')}
                    className={`w-full p-3 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                      privacyScope === 'only_me'
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                        : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-stone-100 text-stone-700">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">自分だけ（非公開）</p>
                        <p className="text-[10px] text-stone-500">
                          自分だけの思い出として部屋に飾ります
                        </p>
                      </div>
                    </div>
                    {privacyScope === 'only_me' && (
                      <Check className="w-4 h-4 text-stone-600 font-bold" />
                    )}
                  </button>
                </div>
              </div>

              {/* Status / Error Notice Display */}
              {generationErrorNotice && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium space-y-1 animate-in fade-in">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <span>⚠️</span>
                    <span>AI画像生成の通知</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-900">{generationErrorNotice}</p>
                </div>
              )}

              {isGeneratingImage && generationStatusMessage && (
                <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200 text-stone-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                  <span className="text-[11px] font-bold text-stone-700">{generationStatusMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              disabled={isGeneratingImage}
              onClick={() => setStep((s) => (s - 1) as any)}
              className="py-2.5 px-4 rounded-2xl border border-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>戻る</span>
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              type="button"
              disabled={
                loadingAi ||
                (postType === 'item' && !contentText.trim() && !mediaDataUrl) ||
                (postType === 'feeling' && !feelingEmotion && !contentText.trim() && !mediaDataUrl)
              }
              onClick={handleProceedToAiSuggestions}
              className="py-3 px-5 rounded-2xl bg-[#3c342b] hover:bg-[#2b241c] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-transform active:scale-95"
            >
              {loadingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>
                    {postType === 'feeling'
                      ? 'AIがキモチを形に考案中...'
                      : 'AIがアイテムを考案中...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {postType === 'feeling'
                      ? 'キモチを形にしてもらう'
                      : 'アイテムを提案してもらう'}
                  </span>
                </>
              )}
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="py-3 px-5 rounded-2xl bg-[#3c342b] hover:bg-[#2b241c] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-transform active:scale-95"
            >
              <span>公開範囲へ進む</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              disabled={isGeneratingImage}
              onClick={handleFinalSubmit}
              className="py-3 px-6 rounded-2xl bg-[#3c342b] hover:bg-[#2b241c] disabled:opacity-60 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-transform active:scale-95"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>生成＆配置中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>部屋に反映する！ 🛋️</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
