import { MomentPost, RoomObject, WavePoint, ObjectCategory, PlacementSlot } from '../types';
import { makeImageBackgroundTransparent } from './imageProcessor';

export interface GeneratedObjectResponse {
  name: string;
  category: ObjectCategory;
  placementSlot: PlacementSlot;
  iconEmoji: string;
  memoryNote: string;
  moodScore: number;
  suggestedX: number;
  suggestedY: number;
  isPinRecommended?: boolean;
}

export async function parseMomentToRoomObject(params: {
  contentText?: string;
  mediaUrls?: string[];
  locationData?: any;
  musicMetadata?: any;
  moodScore?: number;
  hour?: number;
  userDisplayName?: string;
}): Promise<GeneratedObjectResponse> {
  const response = await fetch('/api/ai/parse-moment-to-object', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('AIオブジェクト変換リクエストに失敗しました');
  }

  const data = await response.json();
  return data.object;
}

export async function transcribeAudioWithAi(audioData: string, mimeType: string = 'audio/webm'): Promise<string> {
  const response = await fetch('/api/ai/transcribe-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioData, mimeType }),
  });

  if (!response.ok) {
    throw new Error('音声文字起こしに失敗しました');
  }

  const data = await response.json();
  return data.text || '';
}

export async function generateSharedMatchItem(params: {
  passCode: string;
  creatorName: string;
  momentContext?: string;
}): Promise<any> {
  const response = await fetch('/api/ai/create-shared-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('おそろいアイテムの生成に失敗しました');
  }

  const data = await response.json();
  return data.item;
}

export async function analyzeMoodWavePoints(wavePoints: WavePoint[]): Promise<{
  peakHour: number;
  peakType: string;
  insight: string;
}> {
  const response = await fetch('/api/ai/analyze-mood-wave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wavePoints }),
  });

  if (!response.ok) {
    throw new Error('気分の波の解析に失敗しました');
  }

  return response.json();
}

declare global {
  interface Window {
    puter?: any;
  }
}

export interface ItemImageGenResult {
  imageUrl: string;
  source: 'gemini' | 'cloudflare' | 'puterjs' | 'preset' | 'failed';
  message: string;
  failedAllAi?: boolean;
}

// Fallback preset library in case all AI models fail
const FALLBACK_PRESET_IMAGES: Record<string, string> = {
  desk: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80",
  wall: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80",
  floor: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
  shelf: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80",
  plant: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&auto=format&fit=crop&q=80",
  hobby: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
  meal: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
};

/**
 * Executes Puter.js anonymous text2img generation without requiring user login/popup.
 */
async function tryPuterTxt2Img(prompt: string): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;

    // Check if window.puter is loaded
    if (!window.puter?.ai?.txt2img) {
      for (let i = 0; i < 15; i++) {
        if (window.puter?.ai?.txt2img) break;
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (window.puter?.ai?.txt2img) {
      console.log('[ImageGen] 3. Fallback to Puter.js (Anonymous Mode):', prompt);
      // Puter.js ai.txt2img runs anonymously in free tier without triggering auth popups
      const res = await window.puter.ai.txt2img(prompt);
      if (res) {
        if (typeof res === 'string') return res;
        if (res.src) return res.src;
        if (res instanceof HTMLImageElement && res.src) return res.src;
      }
    }
  } catch (puterErr) {
    console.warn('[ImageGen] Puter.js txt2img notice:', puterErr);
  }
  return null;
}

export async function generateItemImageWithAi(params: {
  itemName: string;
  category?: string;
  memoryNote?: string;
  visualPromptEn?: string;
  iconEmoji?: string;
  style?: 'clay_3d' | 'pixel' | 'wood';
  referenceImageBase64?: string | null;
}): Promise<ItemImageGenResult> {
  const englishVisual = params.visualPromptEn || (params.itemName.includes('ボート') ? 'a cute miniature wooden rowboat with oars' : `a colorful 3D miniature toy model of ${params.itemName}`);
  const promptForPuter = `isolated 3D miniature collectible toy figure of ${englishVisual}, cute colorful diorama figurine, vibrant colors, fine crafted details, soft studio lighting, centered on plain neutral solid white background, single isolated item, clean 3D render`;

  try {
    // 1 & 2. Call Server (Attempts 1: Gemini API -> 2: Cloudflare Workers AI)
    const response = await fetch('/api/ai/generate-item-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).catch(() => null);

    if (response && response.ok) {
      const data = await response.json().catch(() => ({}));
      if (data.success && data.imageUrl) {
        const transparentUrl = await makeImageBackgroundTransparent(data.imageUrl);
        return {
          imageUrl: transparentUrl,
          source: data.source || 'gemini',
          message: data.message || '3D画像を生成しました',
        };
      }
    }

    // 3. Fallback: Client-side Puter.js (Anonymous, no login required)
    const puterImgUrl = await tryPuterTxt2Img(promptForPuter);
    if (puterImgUrl) {
      const transparentUrl = await makeImageBackgroundTransparent(puterImgUrl);
      return {
        imageUrl: transparentUrl,
        source: 'puterjs',
        message: 'Puter.js (匿名AI) により画像を生成しました',
      };
    }

    // 4. Fallback: Direct Pollinations AI (Client-side Direct URL)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      `isometric 3D clay miniature toy figurine of ${englishVisual}, clean white plain background, isolated diorama item`
    )}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
    const transparentPollinations = await makeImageBackgroundTransparent(pollinationsUrl);
    return {
      imageUrl: transparentPollinations,
      source: 'cloudflare',
      message: 'AI画像を生成しました',
    };
  } catch (err) {
    console.log('[ImageGen] Fallback to direct client generator:', err);
    try {
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        `isometric 3D clay miniature toy figurine of ${englishVisual}, clean white plain background, isolated diorama item`
      )}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
      const transparentPollinations = await makeImageBackgroundTransparent(pollinationsUrl);
      return {
        imageUrl: transparentPollinations,
        source: 'cloudflare',
        message: 'AI画像を生成しました',
      };
    } catch {
      // 5. Guaranteed Fallback Preset
      const fallbackPreset = FALLBACK_PRESET_IMAGES[params.category || 'desk'] || FALLBACK_PRESET_IMAGES.desk;
      const transparentPreset = await makeImageBackgroundTransparent(fallbackPreset);
      return {
        imageUrl: transparentPreset,
        source: 'preset',
        failedAllAi: false,
        message: '3Dオブジェクトを作成しました',
      };
    }
  }
}



