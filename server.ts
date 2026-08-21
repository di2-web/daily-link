import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limit for base64 media uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize GenAI
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "dummy-key",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Endpoints

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Roomon", timestamp: new Date().toISOString() });
});

// 2. AI Media to Room Object Parser & Multi-Item Suggestion (Iconic Event Objects OR Emotion Tokens)
app.post("/api/ai/suggest-moment-items", async (req, res) => {
  try {
    const {
      contentText = "",
      mediaUrls = [],
      locationData,
      musicMetadata,
      userDisplayName = "ユーザー",
      postType = "item", // "item" | "feeling"
      feelingEmotion = "",
    } = req.body;

    const ai = getGenAI();

    const isFeelingMode = postType === "feeling";

    const systemInstruction = isFeelingMode
      ? `あなたはクローズド空間SNS「Roomon（ルーモン）」のキモチ・感情オブジェクト生成AIです。
ユーザーは「出来事のモノ」ではなく、「今の気持ち・感情・気分（もやもや、うれしい、しんどい、ほっこり、お疲れ、ワクワク、しみじみ等）」を部屋に残したいと思っています。
気持ちは具体的な日用品や家具にするのが難しいため、その感情をやさしく包み込んで可視化する【キモチ結晶・感情オーブ・ムードボトル・ふわふわの雲・お星さま・癒やしの光のカプセル】などの愛らしく温かい3Dミニチュアトイを3つのバリエーションで提案してください。

【キモチ表現のルール】
1. 感情に寄り添う抽象的でかわいい立体オブジェクトを生成：
   - もやもや・しんどい → 「もやもやの小さな雨雲ボトル」「静かに休むグレーの小石」「しずくのガラス玉」
   - ほっこり・癒やし → 「ほっと温まる光のオーブ」「ぽかぽかハートのマグカップ」「まったりクローバー」
   - おつかれ・限界 → 「おやすみ前の星屑カプセル」「ふかふかの月まくら」「電池切れのミニロボ」
   - わくわく・うれしい → 「弾けるキラキラ水晶」「虹色のシャボン玉」「小さなクラッカー」
   - 考えごと・ぼーっと → 「考え中の思考バルーン」「ふわふわ浮かぶ綿毛」「静かな砂時計」
   - やる気・前向き → 「小さな炎のキャンドル」「芽吹いたふたば」「きらめく太陽バッジ」
2. name: 感情を象徴する可愛らしい名前（10文字以内、例: ほっこり光のオーブ、もやもや雲ボトル、おやすみ星屑）
3. iconEmoji: 感情を表す絵文字（例: 💭, ☁️, 🌧️, ☀️, 🌙, ☕, 💤, 🔥, 🧁, 🍀, ✨）
4. memoryNote: ユーザーの今の気持ちに優しく寄り添う、あたたかい一言メモ
5. visualPromptEn: 3Dクレイやガラス、淡い発光の質感をもつ美しいミニチュアトイの鮮明な英語描写（例: "a cute pastel miniature glowing orb with warm inner light, matte clay 3d figure", "a tiny glass bottle containing a fluffy miniature cloud, cute collectible toy"）
6. reasonExplanation: そのキモチをどう表現したかの優しい説明（1文）`
      : `あなたはクローズド空間SNS「Roomon（ルーモン）」の空間オブジェクト生成AIです。
ユーザーの「今日のできごと」（テキスト・写真・音声など）を解析し、その出来事そのものをダイレクトに象徴するカラフルで愛嬌のある3Dミニチュアオブジェクトを3つのバリエーションで提案してください。

【最重要ルール：出来事の象徴アイテムのみを生成】
1. 「応援・リフレッシュ・癒やし・家具・解決アイテム」は【絶対に禁止】：
   × 模試で疲れた → ベッド、アロマ、温かいお茶、マッサージクッション（癒やし・家具アイテムはNG）
   ○ 模試で疲れた → 破れた模試の解答用紙、芯が丸くなった使い古しの鉛筆、付箋だらけの単語帳、削りかすの山
   × 雨でびしょ濡れ → 温かいお風呂、乾いたタオル（NG）
   ○ 雨でびしょ濡れ → 水滴が滴る透明ビニール傘、泥はねしたスニーカー、濡れた靴下
   × 料理を焦がした → 消臭スプレー、出前ピザ（NG）
   ○ 料理を焦がした → 底が真っ黒に焦げたフライパン、煙の出ている鍋
   × バイトで怒られた・ミスした → 癒やしのぬいぐるみ、甘いスイーツ（NG）
   ○ バイトで怒られた・ミスした → メモで真っ黒な業務ノート、折れ曲がった名札、油性ペン
   × ボート漕いだ → キャビネット、白い机、ベッド（家具は絶対にNG！）
   ○ ボート漕いだ → 木製の手漕ぎボートとオール、黄色いスワンボートのミニチュア、水滴のついたパドル、ライフジャケット
   × ライブで大騒ぎした → 快眠アイマスク（NG）
   ○ ライブで大騒ぎした → 折れたサイリウム、破れた銀テープ、汗が染みたツアータオル、折れ曲がったチケット半券
   × 徹夜でレポート・残業 → 睡眠サプリ（NG）
   ○ 徹夜でレポート・残業 → 飲み干した冷たいエナジードリンク缶、乱雑に貼られた付箋
   × 筋トレで筋肉痛 → 湿布（NG）
   ○ 筋トレで筋肉痛 → 重たいダンベル、使い古したプロテインシェイカー

2. 【家具や部屋の概念の完全排除】：
   机・キャビネット・タンスなどの無関係な家具は絶対に生成しないでください。出来事そのもの・使った道具・現場の痕跡をそのまま小さな立体トイとして象徴化してください。

3. 各アイテムの要素：
   - name: その出来事をダイレクトに象徴する具体的なオブジェクト名（10文字以内、例: 木製ボートとオール、焦げたフライパン）
   - iconEmoji: 象徴する絵文字1つ（例: 🚣, 🍳, 📝, 🌂）
   - memoryNote: その瞬間のリアルな情景・感情を切り取った1〜2文の短い一言メモ
   - visualPromptEn: 画像生成AI（拡散モデル）が正確に3Dトイとして描画できる、鮮明で具体的な英語のオブジェクト描写（例: "a cute miniature colorful wooden rowboat with a pair of wooden oars, vibrant collectible toy figure", "a burnt miniature black frying pan with smoke marks"）
   - reasonExplanation: なぜその出来事の象徴としてこのオブジェクトを選んだのかの理由（1文）
`;

    const promptContext = isFeelingMode
      ? `【ユーザー】: ${userDisplayName}
【投稿モード】: キモチ・感情
【選択された感情タグ】: ${feelingEmotion || "なし"}
【気持ちのつぶやき】: ${contentText || feelingEmotion || "今の素直な気持ち"}

上記の気持ちを優しく受け止め、部屋に飾れる可愛らしい3Dキモチトイ（オーブ、雲、星、ボトルなど）を3つ提案し、JSONで返してください。`
      : `【ユーザー】: ${userDisplayName}
【投稿モード】: 出来事・アイテム
【投稿テキスト】: ${contentText || "写真や記録の投稿"}
【位置情報】: ${locationData ? JSON.stringify(locationData) : "なし"}
【音楽】: ${musicMetadata ? `${musicMetadata.trackName} - ${musicMetadata.artistName}` : "なし"}

上記のできごとそのもののリアルな情景や痕跡を象徴するカラフルな3Dミニチュアトイを3つ提案し、JSONで返してください。家具や癒やしグッズはNGです。`;

    const contents: any[] = [{ text: promptContext }];

    if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      const firstMedia = mediaUrls[0];
      if (firstMedia && typeof firstMedia === 'string' && firstMedia.startsWith('data:image/')) {
        const matches = firstMedia.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          contents.unshift({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        }
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasonExplanation: {
              type: Type.STRING,
              description: "出来事の象徴アイテムを選んだ理由",
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING, description: "出来事を象徴するオブジェクト名（10文字以内、家具は厳禁）" },
                  category: { type: Type.STRING, description: "カテゴリ（自由配置）" },
                  placementSlot: { type: Type.STRING, description: "配置スロット（free / desk / floor / wall / shelf）" },
                  iconEmoji: { type: Type.STRING, description: "絵文字" },
                  imageUrl: { type: Type.STRING, description: "初期画像URL" },
                  visualPromptEn: { type: Type.STRING, description: "画像生成用の具体的で鮮明な英語のオブジェクト描写（例: a miniature colorful rowboat with wooden oars）" },
                  defaultX: { type: Type.INTEGER, description: "推奨X座標 (10-90)" },
                  defaultY: { type: Type.INTEGER, description: "推奨Y座標 (15-85)" },
                  memoryNote: { type: Type.STRING, description: "出来事の思い出メモ" },
                },
                required: ["name", "iconEmoji", "memoryNote", "visualPromptEn"],
              },
            },
          },
          required: ["reasonExplanation", "items"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error("Suggest moment items error:", error);
    const content = req.body?.contentText || "";
    const isFeeling = req.body?.postType === "feeling";
    const emotion = req.body?.feelingEmotion || "💭 考え中";

    let fallbackItems = isFeeling
      ? [
          {
            id: "feeling_1",
            name: "ほっこり光のオーブ",
            category: "memory",
            placementSlot: "free",
            iconEmoji: "✨",
            visualPromptEn: "a cute miniature pastel glowing orb with soft gradient lighting, cute 3d toy model",
            imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
            defaultX: 45,
            defaultY: 45,
            memoryNote: content || `${emotion}な気持ちを優しく包んだ光のしるし`,
          },
          {
            id: "feeling_2",
            name: "ふんわり雲ボトル",
            category: "memory",
            placementSlot: "free",
            iconEmoji: "☁️",
            visualPromptEn: "a tiny glass bottle containing a fluffy miniature pastel cloud, cute collectible toy",
            imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
            defaultX: 60,
            defaultY: 50,
            memoryNote: "心の中に浮かんだ思いを大切に閉じ込めたボトル",
          },
          {
            id: "feeling_3",
            name: "おやすみ星屑カプセル",
            category: "memory",
            placementSlot: "free",
            iconEmoji: "🌙",
            visualPromptEn: "a cute pastel star crystal capsule with sparkling dust inside, 3d collectible model",
            imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
            defaultX: 35,
            defaultY: 60,
            memoryNote: "今日をがんばった自分への穏やかな贈り物",
          },
        ]
      : [
          {
            id: "item_1",
            name: content.includes("ボート") ? "木製ボートとオール" : (content.slice(0, 10) || "出来事のしるし"),
            category: "memory",
            placementSlot: "free",
            iconEmoji: content.includes("ボート") ? "🚣" : "📝",
            visualPromptEn: content.includes("ボート") ? "a cute miniature wooden rowboat with a pair of oars, colorful 3D toy figure" : "a cute miniature souvenir trinket representing daily memory, colorful 3D toy model",
            imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&auto=format&fit=crop&q=80",
            defaultX: 45,
            defaultY: 65,
            memoryNote: content || "今日の象徴的なワンシーン",
          },
          {
            id: "item_2",
            name: "手書きメモ",
            category: "memory",
            placementSlot: "free",
            iconEmoji: "✏️",
            visualPromptEn: "a cute miniature notepad with a colorful pencil, 3D toy model",
            imageUrl: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80",
            defaultX: 60,
            defaultY: 60,
            memoryNote: "今日の記録を残したメモ",
          },
          {
            id: "item_3",
            name: "日常のしるし",
            category: "memory",
            placementSlot: "free",
            iconEmoji: "🏷️",
            visualPromptEn: "a cute collectible 3D souvenir token badge, colorful miniature",
            imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&auto=format&fit=crop&q=80",
            defaultX: 30,
            defaultY: 70,
            memoryNote: "今日を物語るアイテム",
          }
        ];

    res.json({
      success: true,
      reasonExplanation: isFeeling
        ? "今のキモチを優しく形にしたエモーショントイをセレクトしました。"
        : (content ? `「${content}」のできごとを象徴するアイテムを選びました。` : "日常の記録から象徴オブジェクトを作成しました。"),
      items: fallbackItems,
    });
  }
});

// 2. AI Media to Room Object Parser (Core Pipeline Step 1 - 4)
app.post("/api/ai/parse-moment-to-object", async (req, res) => {
  try {
    const {
      contentText = "",
      mediaUrls = [],
      locationData,
      musicMetadata,
      moodScore = 0,
      hour = new Date().getHours(),
      userDisplayName = "ユーザー"
    } = req.body;

    const ai = getGenAI();

    const systemInstruction = `あなたはクローズド空間SNS「Roomon（ルーモン）」の空間オブジェクト生成AIです。
日常の出来事（テキスト・写真・音声・音楽など）を解析し、その出来事そのものをダイレクトに象徴する3Dオブジェクト（1点）へ変換してください。

【厳格な変換ルール】
1. 「応援・リフレッシュ・癒やしアイテム」は厳禁：
   × 模試で疲れた → ベッド、アロマ、温かいお茶（NG）
   ○ 模試で疲れた → 破れた模試の解答用紙、芯が丸くなった使い古しの鉛筆、ボロボロの単語帳
   × 雨でびしょ濡れ → 温かいお風呂、タオル（NG）
   ○ 雨でびしょ濡れ → 水滴が滴るビニール傘、泥のついたスニーカー
   × 料理を焦がした → 消臭スプレー（NG）
   ○ 料理を焦がした → 底が真っ黒に焦げたフライパン、煙の出ている鍋
   × バイトで怒られた → 癒やしのぬいぐるみ（NG）
   ○ バイトで怒られた → メモで真っ黒な業務ノート、折れ曲がった名札

2. カテゴリ固定の排除（自由配置）：
   部屋の好きな位置に自由に置けるオブジェクトとして生成してください。

3. 思い出メモ (memoryNote): 長文ではなく、その瞬間の事実や情景をそっと振り返れる1〜2文の短い一言メモ。`;

    const promptContext = `【ユーザー情報】: ${userDisplayName}
【投稿時刻】: ${hour}:00
【投稿テキスト】: ${contentText || "（テキストなし・写真や音楽の記録）"}
【位置情報】: ${locationData ? JSON.stringify(locationData) : "なし"}
【音楽メタデータ】: ${musicMetadata ? `${musicMetadata.trackName} - ${musicMetadata.artistName}` : "なし"}
【入力ムードスコア】: ${moodScore}
【添付メディア数】: ${Array.isArray(mediaUrls) ? mediaUrls.length : 0}

上記のできごとをダイレクトに象徴する3D空間オブジェクトを決定し、JSON形式で返してください。`;

    const contents: any[] = [{ text: promptContext }];

    // If base64 image is passed in mediaUrls, pass first image to multimodal
    if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      const firstMedia = mediaUrls[0];
      if (firstMedia && typeof firstMedia === 'string' && firstMedia.startsWith('data:image/')) {
        const matches = firstMedia.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          contents.unshift({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        }
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "出来事を象徴するオブジェクト名（例: 破れたテスト用紙、焦げたフライパン、滴るビニール傘）",
            },
            category: {
              type: Type.STRING,
              description: "カテゴリ（自由配置）",
            },
            placementSlot: {
              type: Type.STRING,
              description: "配置スロット（free / desk / floor / wall / shelf）",
            },
            iconEmoji: {
              type: Type.STRING,
              description: "オブジェクトを象徴する絵文字1個（例: 📝, ✏️, 🌂, 🍳, 🎸, 📚, 🏷️）",
            },
            memoryNote: {
              type: Type.STRING,
              description: "オブジェクトに込められた1〜2文の短い思い出メモ",
            },
            moodScore: {
              type: Type.INTEGER,
              description: "-100 から +100 の感情スコア",
            },
            suggestedX: {
              type: Type.INTEGER,
              description: "推奨配置X座標（10〜90のパーセント値）",
            },
            suggestedY: {
              type: Type.INTEGER,
              description: "推奨配置Y座標（15〜85のパーセント値）",
            },
            isPinRecommended: {
              type: Type.BOOLEAN,
              description: "大切な思い出として普段の部屋へピン留めを推奨するか",
            },
          },
          required: ["name", "iconEmoji", "memoryNote", "moodScore", "suggestedX", "suggestedY"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, object: parsed });
  } catch (error: any) {
    console.error("Parse moment to object error:", error);
    // Fallback response for offline / error tolerance
    res.json({
      success: true,
      object: {
        name: "日常のしるし",
        category: "memory",
        placementSlot: "free",
        iconEmoji: "📝",
        memoryNote: req.body?.contentText || "大切に記録された日常のワンシーン",
        moodScore: 20,
        suggestedX: 45,
        suggestedY: 65,
        isPinRecommended: false,
      },
    });
  }
});

// 3. AI Audio Transcription (Groq Whisper-large-v3-turbo with Gemini Flash fallback)
app.post("/api/ai/transcribe-audio", async (req, res) => {
  try {
    const { audioData, mimeType = "audio/webm" } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "音声データがありません。" });
    }

    const base64Data = audioData.replace(/^data:audio\/[a-zA-Z0-9.\-_]+;base64,/, "");
    const groqKey = process.env.GROQ_API_KEY;

    // Try Groq Whisper (0.3s ultra-fast transcription) if GROQ_API_KEY is available
    if (groqKey) {
      try {
        const audioBuffer = Buffer.from(base64Data, 'base64');
        const formData = new FormData();
        const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });
        formData.append('file', blob, 'audio.webm');
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('language', 'ja');
        formData.append('response_format', 'json');

        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          body: formData,
        });

        if (groqRes.ok) {
          const groqJson: any = await groqRes.json();
          if (groqJson.text) {
            return res.json({ success: true, text: groqJson.text.trim(), source: 'groq-whisper' });
          }
        }
      } catch (groqErr) {
        console.warn("Groq transcription fallback to Gemini:", groqErr);
      }
    }

    // Fallback to Gemini 2.5 Flash / Flash-Lite
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [
        {
          inlineData: {
            mimeType: mimeType.includes("audio") ? mimeType : "audio/webm",
            data: base64Data,
          },
        },
        {
          text: "この音声メモを日本語で正確に文字起こししてください。相槌や余計な解説は省き、話されたテキストのみを出力してください。",
        },
      ],
    });

    const transcribed = response.text?.trim() || "";
    res.json({ success: true, text: transcribed, source: 'gemini' });
  } catch (error: any) {
    console.error("Transcribe audio error:", error);
    res.status(500).json({ error: "音声の文字起こしに失敗しました。" });
  }
});

// Helper to generate a pristine 3D clay miniature SVG when external AI networks are unreachable
function generate3DClayMiniatureSvg(itemName: string, emoji: string = "✨"): string {
  const cleanName = (itemName || "思い出の品").replace(/[<>&"]/g, "").slice(0, 12);
  const cleanEmoji = emoji || "✨";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="pedestalTop" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#ece6dc"/>
      <stop offset="100%" stop-color="#d6cebf"/>
    </radialGradient>
    <filter id="clayShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#54483a" flood-opacity="0.28"/>
    </filter>
    <filter id="softBlur">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>
  <!-- Transparent Canvas: No solid background rect -->
  <ellipse cx="256" cy="395" rx="130" ry="28" fill="#44392e" opacity="0.18" filter="url(#softBlur)"/>
  <ellipse cx="256" cy="375" rx="116" ry="22" fill="url(#pedestalTop)" filter="url(#clayShadow)"/>
  <ellipse cx="256" cy="373" rx="108" ry="18" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.85"/>
  <g filter="url(#clayShadow)" transform="translate(0, -12)">
    <text x="256" y="265" font-size="136" text-anchor="middle" dominant-baseline="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">
      ${cleanEmoji}
    </text>
  </g>
  <circle cx="155" cy="145" r="4" fill="#f59e0b" opacity="0.7"/>
  <circle cx="355" cy="165" r="5" fill="#f59e0b" opacity="0.8"/>
  <circle cx="330" cy="125" r="3" fill="#f59e0b" opacity="0.5"/>
  <g transform="translate(256, 442)">
    <rect x="-85" y="-15" width="170" height="30" rx="15" fill="#292524" filter="url(#clayShadow)"/>
    <text x="0" y="5" font-size="12" font-weight="bold" fill="#fef3c7" text-anchor="middle" font-family="sans-serif">
      ${cleanName}
    </text>
  </g>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 3.5. 3D Cozy Miniature Item Image Generator (gemini-3.1-flash-lite-image / Cloudflare Workers AI / Pollinations / SVG)
app.post("/api/ai/generate-item-image", async (req, res) => {
  try {
    const {
      itemName = "インテリア小物",
      category = "free",
      memoryNote = "",
      visualPromptEn = "",
      iconEmoji = "✨",
      style = "clay_3d", // 'clay_3d' | 'pixel' | 'wood' | 'watercolor'
      referenceImageBase64 = null
    } = req.body;

    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;

    // 1. Ensure we have a vivid English visual subject
    let englishSubject = visualPromptEn ? visualPromptEn.trim() : "";
    if (!englishSubject || englishSubject.length < 5) {
      try {
        const ai = getGenAI();
        const transRes = await ai.models.generateContent({
          model: "gemini-flash-lite-latest",
          contents: [{
            text: `Convert this moment/item into a vivid, colorful single 3D miniature toy figure description in 6-12 English words.
Examples:
- "ボート漕いだー" -> "a cute miniature wooden rowboat with a pair of oars and water droplets"
- "模試で疲れた" -> "a torn mock test paper covered in red grading marks with pencil shavings"
- "料理焦がした" -> "a miniature burnt black frying pan with smoke marks and charred food"
- "雨で濡れた" -> "a transparent plastic umbrella with glossy raindrops"

Rules: Output ONLY the 6-12 word English object description. No furniture, no rooms, no quotes.
Item: "${itemName}" (Memory: "${memoryNote || ''}")`
          }],
        });
        englishSubject = transRes.text?.trim() || itemName;
      } catch (tErr) {
        console.warn("[ImageGen] English translation fallback:", tErr);
        if (itemName.includes("ボート")) {
          englishSubject = "a cute miniature wooden rowboat with a pair of oars and blue water ripples";
        } else {
          englishSubject = `a colorful 3D miniature toy model of ${itemName}`;
        }
      }
    }

    // Clean, vivid prompt with crisp silhouette boundaries on uniform white
    let fullPrompt = `isolated centered single 3D collectible toy figure of ${englishSubject}, cute smooth clay diorama miniature, vibrant soft colors, studio rim lighting, crisp sharp silhouette edges, pure solid uniform white background, no floor shadow, no background objects, ultra clean 3D render`;
    if (style === "pixel") {
      fullPrompt = `isolated 16-bit cute pixel art sticker of ${englishSubject}, vibrant pastel colors, clean solid flat white background, sharp border, single centered item`;
    } else if (style === "wood") {
      fullPrompt = `isolated handcrafted miniature wooden toy figurine of ${englishSubject}, smooth warm carved wood grain, studio lighting, crisp edges, pure solid flat white background`;
    }

    // =========================================================================
    // 1. First Priority: Gemini Image Generation
    // =========================================================================
    try {
      console.log(`[ImageGen] 1. Attempting Gemini image generation for "${itemName}" (${englishSubject})...`);
      const ai = getGenAI();
      const parts: any[] = [];
      if (referenceImageBase64 && typeof referenceImageBase64 === 'string' && referenceImageBase64.startsWith('data:image/')) {
        const matches = referenceImageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        }
      }
      parts.push({ text: `${fullPrompt}, strictly one single object centered, pure white background` });

      const imgResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts,
        },
      });

      if (imgResponse.candidates?.[0]?.content?.parts) {
        for (const part of imgResponse.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || "image/png";
            console.log(`[ImageGen] Gemini image generated successfully for "${itemName}"`);
            return res.json({
              success: true,
              imageUrl: `data:${mime};base64,${part.inlineData.data}`,
              source: "gemini",
              message: "Gemini により画像を生成しました",
            });
          }
        }
      }
    } catch (geminiErr: any) {
      console.log(`[ImageGen] Gemini image generation skipped/unavailable, trying secondary providers...`);
    }

    // =========================================================================
    // 2. Fallback 1: Cloudflare Workers AI (SDXL Lightning -> SDXL Base -> FLUX Schnell)
    // =========================================================================
    const cfPrompt = `${fullPrompt}, 3d render, cute toy figure, centered, high quality, soft studio lighting`;
    if (cfAccountId && cfApiToken) {
      try {
        console.log(`[ImageGen] 2. Attempting Cloudflare Workers AI for "${itemName}"...`);
        
        const cfConfigs = [
          {
            model: "@cf/bytedance/stable-diffusion-xl-lightning",
            body: { prompt: cfPrompt, num_steps: 4 },
          },
          {
            model: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
            body: { prompt: cfPrompt, num_steps: 20 },
          },
          {
            model: "@cf/black-forest-labs/flux-1-schnell",
            body: { prompt: cfPrompt, steps: 4 },
          },
          {
            model: "@cf/runwayml/stable-diffusion-v1-5",
            body: { prompt: cfPrompt, num_steps: 20 },
          },
        ];

        for (const config of cfConfigs) {
          try {
            const cfRes = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${config.model}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${cfApiToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(config.body),
                signal: AbortSignal.timeout(12000),
              }
            );

            if (cfRes.ok) {
              const buffer = await cfRes.arrayBuffer();
              const base64 = Buffer.from(buffer).toString("base64");
              console.log(`[ImageGen] Cloudflare Workers AI generated with ${config.model}`);
              return res.json({
                success: true,
                imageUrl: `data:image/png;base64,${base64}`,
                source: "cloudflare",
                model: config.model,
                message: `Cloudflare AI (${config.model.split('/').pop()}) により画像を生成しました`,
              });
            } else {
              console.log(`[ImageGen] Cloudflare ${config.model} returned ${cfRes.status}, continuing to next model...`);
            }
          } catch (mErr) {
            console.log(`[ImageGen] Cloudflare ${config.model} notice, trying next...`);
          }
        }
      } catch (cfErr) {
        console.log("[ImageGen] Cloudflare Workers AI notice, moving to Pollinations AI...");
      }
    }

    // =========================================================================
    // 3. Fallback 2: Pollinations AI (Multiple endpoints)
    // =========================================================================
    try {
      console.log(`[ImageGen] 3. Attempting Pollinations AI for "${itemName}"...`);
      const encodedPrompt = encodeURIComponent(cfPrompt);
      const pollEndpoints = [
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100000)}`,
        `https://gen.pollinations.ai/image/${encodedPrompt}?width=512&height=512&nologo=true`,
      ];
      
      for (const endpoint of pollEndpoints) {
        try {
          const pollRes = await fetch(endpoint, {
            headers: {
              'User-Agent': 'Roomon-App/1.0',
            },
            signal: AbortSignal.timeout(8000),
          });

          if (pollRes.ok) {
            const buffer = await pollRes.arrayBuffer();
            if (buffer && buffer.byteLength > 1000) {
              const base64 = Buffer.from(buffer).toString("base64");
              const contentType = pollRes.headers.get("content-type") || "image/jpeg";
              console.log(`[ImageGen] Pollinations AI image generated successfully for "${itemName}"`);
              return res.json({
                success: true,
                imageUrl: `data:${contentType};base64,${base64}`,
                source: "flux-2-klein-4b",
                message: "AI画像モデルにより美しく生成しました",
              });
            }
          }
        } catch (subErr) {
          // continue
        }
      }
    } catch (pollErr) {
      console.log("[ImageGen] Pollinations AI notice, generating 3D SVG miniature...");
    }

    // =========================================================================
    // 4. Guaranteed Fallback 3: Dynamic 3D Clay Miniature SVG Rendering
    // =========================================================================
    console.log(`[ImageGen] 4. Rendering dynamic 3D clay miniature SVG for "${itemName}"...`);
    const svg3dUrl = generate3DClayMiniatureSvg(itemName, iconEmoji || "✨");
    return res.json({
      success: true,
      imageUrl: svg3dUrl,
      source: "preset",
      prompt: fullPrompt,
      itemName,
      visualPromptEn: englishSubject,
      category,
      message: "3Dクレイミニチュアモデルを作成しました",
    });
  } catch (error: any) {
    console.error("Item image generation error:", error);
    const safeSvg = generate3DClayMiniatureSvg(req.body?.itemName || "小物", req.body?.iconEmoji || "✨");
    res.json({
      success: true,
      imageUrl: safeSvg,
      source: "preset",
      message: "3Dクレイミニチュアモデルを作成しました",
    });
  }
});

// 4. AI Photo to Illustrated Chibi Avatar Generator
app.post("/api/generate-avatar-illustration", async (req, res) => {
  try {
    const { photoBase64, userPrompt = "", style = "chibi" } = req.body;

    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;

    let characterDescription = "a cute chibi anime character with a happy smile, cozy hoodie, stylish hair, vibrant aesthetic";

    // Step 1: If user provided a photo, analyze visual characteristics with Gemini
    if (photoBase64 && typeof photoBase64 === "string" && photoBase64.startsWith("data:image/")) {
      try {
        const ai = getGenAI();
        const matches = photoBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          const analysisPrompt = `Analyze the person in this photo and describe their visual traits in 1 concise English sentence for an avatar portrait generator:
- Hair: length, style, color (e.g. short wavy brown hair with bangs, or long black ponytail)
- Glasses/Accessories: if present (e.g. round glasses, silver earrings)
- Expression: friendly smile, warm look
- Clothing: casual cozy top/hoodie/shirt color
Format: Return ONLY the description phrase. (e.g. "a young person with short black hair, round glasses, wearing a warm cream sweater, smiling gently")`;

          const analysisRes = await ai.models.generateContent({
            model: "gemini-flash-lite-latest",
            contents: [
              {
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2],
                },
              },
              { text: analysisPrompt },
            ],
          });

          const detected = analysisRes.text?.trim();
          if (detected && detected.length > 5) {
            characterDescription = detected;
          }
        }
      } catch (aErr) {
        console.warn("[AvatarGen] Gemini photo analysis fallback:", aErr);
      }
    } else if (userPrompt) {
      characterDescription = userPrompt;
    }

    // Step 2: Build avatar prompt for high-quality illustrated diorama avatar
    const avatarPrompt = `cute 3D chibi diorama avatar figure of ${characterDescription}, collectible clay figurine portrait, cute face, smooth 3d rendering, soft studio lighting, centered portrait, pastel aesthetic, vibrant clean colors, solid plain background`;

    console.log(`[AvatarGen] Generating avatar with description: "${characterDescription}"...`);

    // Priority 1: Gemini Image
    try {
      const ai = getGenAI();
      const imgRes = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{ text: `${avatarPrompt}, clean avatar icon` }],
        },
      });

      if (imgRes.candidates?.[0]?.content?.parts) {
        for (const part of imgRes.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || "image/png";
            return res.json({
              success: true,
              imageUrl: `data:${mime};base64,${part.inlineData.data}`,
              description: characterDescription,
              source: "gemini",
            });
          }
        }
      }
    } catch (gErr: any) {
      console.log("[AvatarGen] Gemini image notice, trying secondary generators...");
    }

    // Priority 2: Cloudflare Workers AI
    if (cfAccountId && cfApiToken) {
      try {
        const cfRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${cfApiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: avatarPrompt, num_steps: 4 }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (cfRes.ok) {
          const buffer = await cfRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          return res.json({
            success: true,
            imageUrl: `data:image/png;base64,${base64}`,
            description: characterDescription,
            source: "cloudflare-flux",
          });
        }
      } catch (cfErr) {
        console.log("[AvatarGen] Cloudflare notice, trying Pollinations...");
      }
    }

    // Priority 3: Pollinations AI
    try {
      const encoded = encodeURIComponent(avatarPrompt);
      const pollUrl = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
      const pollRes = await fetch(pollUrl, {
        headers: { "User-Agent": "Roomon-App/1.0" },
        signal: AbortSignal.timeout(8000),
      });

      if (pollRes.ok) {
        const buffer = await pollRes.arrayBuffer();
        if (buffer && buffer.byteLength > 1000) {
          const base64 = Buffer.from(buffer).toString("base64");
          const contentType = pollRes.headers.get("content-type") || "image/jpeg";
          return res.json({
            success: true,
            imageUrl: `data:${contentType};base64,${base64}`,
            description: characterDescription,
            source: "pollinations",
          });
        }
      }
    } catch (pErr) {
      console.log("[AvatarGen] Pollinations notice, using Dicebear avatar...");
    }

    // Fallback: Return nice stylized avatar
    return res.json({
      success: true,
      imageUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(characterDescription)}`,
      description: characterDescription,
      source: "dicebear",
    });
  } catch (error: any) {
    console.error("Avatar generation error:", error);
    res.json({
      success: true,
      imageUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(req.body?.userPrompt || "user")}`,
      description: req.body?.userPrompt || "avatar",
      source: "dicebear",
    });
  }
});

// 5. AI Shared Item Generator (つながりボタン＋合言葉でおそろいアイテム生成)
app.post("/api/ai/create-shared-item", async (req, res) => {
  try {
    const { passCode, creatorName, momentContext = "" } = req.body;

    const ai = getGenAI();
    const systemInstruction = `あなたは「Roomon」のおそろい家具・インテリア生成AIです。
親しい友人たちが合言葉を共有して一緒に作った思い出の空間オブジェクトを1つ提案してください。
例:
- おそろいの観葉植物（「2人で育て始めたパキラ」）
- 友情のレコード（「一緒に聴いたあの曲」）
- ペアマグカップ（「夜遅くまで話したカフェ」）
- ライブフェスポスター（「最高の夏の思い出」）`;

    const prompt = `合言葉: ${passCode}
作成者: ${creatorName}
出来事の背景: ${momentContext || "親しい友達とおそろいの思い出の品"}

友達全員の部屋に飾られる特別な「おそろいインテリアオブジェクト」をJSONで提案してください。`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [{ text: prompt }],
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: ["wall", "desk", "floor", "shelf", "plant", "hobby", "music", "gift"],
            },
            placementSlot: {
              type: Type.STRING,
              enum: ["wall", "desk", "floor", "shelf", "terrace"],
            },
            iconEmoji: { type: Type.STRING },
            memoryNote: { type: Type.STRING },
            suggestedX: { type: Type.INTEGER },
            suggestedY: { type: Type.INTEGER },
          },
          required: ["name", "category", "placementSlot", "iconEmoji", "memoryNote"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, item: parsed });
  } catch (error: any) {
    console.error("Shared item error:", error);
    res.json({
      success: true,
      item: {
        name: "おそろいの思い出ランプ",
        category: "desk",
        placementSlot: "desk",
        iconEmoji: "🛋️",
        memoryNote: "合言葉でつながった親友とおそろいのインテリア",
        suggestedX: 50,
        suggestedY: 65,
      },
    });
  }
});

// 5. AI Mood Wave Analyzer
app.post("/api/ai/analyze-mood-wave", async (req, res) => {
  try {
    const { wavePoints = [] } = req.body;
    if (!Array.isArray(wavePoints) || wavePoints.length === 0) {
      return res.json({ success: true, peakHour: 15, insight: "穏やかな1日でした。" });
    }

    let maxDiff = -1;
    let peakHour = 12;
    let peakType = "high";

    for (let i = 0; i < wavePoints.length; i++) {
      const p = wavePoints[i];
      const absVal = Math.abs(p.mood || 0);
      if (absVal > maxDiff) {
        maxDiff = absVal;
        peakHour = p.hour;
        peakType = (p.mood || 0) >= 0 ? "high" : "low";
      }
    }

    const insight =
      peakType === "high"
        ? `${peakHour}時頃に最もテンションや感情が高まったポジティブな瞬間がありました！`
        : `${peakHour}時頃に感情の揺らぎや落ち着きの時間がありました。`;

    res.json({ success: true, peakHour, peakType, insight });
  } catch (error: any) {
    console.error("Analyze wave error:", error);
    res.json({ success: true, peakHour: 15, insight: "感情の波を記録しました。" });
  }
});

// Vite middleware for development vs static build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Roomon Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

export { app };
