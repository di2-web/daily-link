import React from 'react';
import {
  Sparkles,
  Shield,
  Lock,
  Users,
  Compass,
  Heart,
  Calendar,
  FileText,
  Mail,
  ArrowRight,
  CheckCircle2,
  Database,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Gift,
  Smile,
} from 'lucide-react';

interface LandingHomepageViewProps {
  onOpenAuth: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  isLoggedIn?: boolean;
  onGoToApp?: () => void;
}

export const LandingHomepageView: React.FC<LandingHomepageViewProps> = ({
  onOpenAuth,
  onOpenPrivacy,
  onOpenTerms,
  isLoggedIn = false,
  onGoToApp,
}) => {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 font-sans selection:bg-amber-200">
      {/* 1. Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#faf8f5]/90 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-xl shadow-xs">
              🏡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-stone-900 tracking-tight">DailyLink</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-950 font-bold border border-amber-300/50">
                  空間SNS
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
                完全クローズド空間SNS ＆ 手帳風AI日記
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2 sm:gap-6 text-xs font-semibold text-stone-600">
            <a href="#features" className="hover:text-stone-900 transition-colors hidden md:inline-block">
              機能紹介
            </a>
            <a href="#data-usage" className="hover:text-stone-900 transition-colors hidden md:inline-block">
              データ利用の透明性
            </a>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="hover:text-stone-900 transition-colors hidden sm:inline-block cursor-pointer"
            >
              プライバシーポリシー
            </button>
            <button
              type="button"
              onClick={onOpenTerms}
              className="hover:text-stone-900 transition-colors hidden sm:inline-block cursor-pointer"
            >
              利用規約
            </button>

            {isLoggedIn && onGoToApp ? (
              <button
                type="button"
                onClick={onGoToApp}
                className="px-4 py-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>お部屋へ戻る</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-2xl bg-amber-900 hover:bg-amber-950 text-amber-50 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>ログイン / 新規登録</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="px-4 sm:px-8 pt-12 pb-16 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/90 border border-amber-200 text-amber-950 text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>「人の部屋を覗きに行く」新しいコミュニケーション空間</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight sm:leading-tight">
          日々のつぶやきが、お部屋の家具になる。<br />
          <span className="text-amber-900">親しい友達（2〜5人）と過ごす、完全クローズド空間SNS。</span>
        </h1>

        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
          DailyLink（デイリーリンク）は、テキスト・音声・写真の日々のつぶやきからAIが手帳風日記と空間オブジェクトを自動生成するライフログサービスです。タイムラインの数字や広告に疲れた人のために、親しい友達だけの穏やかなプライベート空間を提供します。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isLoggedIn && onGoToApp ? (
            <button
              type="button"
              onClick={onGoToApp}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>あなたのお部屋に入る</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-900 hover:bg-amber-950 text-amber-50 font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>無料で今すぐ始める</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <a
            href="#data-usage"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-emerald-700" />
            <span>データ取扱い・セキュリティ</span>
          </a>
        </div>

        {/* Hero Visual Mockup */}
        <div className="pt-8">
          <div className="relative rounded-3xl bg-amber-50/60 border border-amber-200/90 p-4 sm:p-6 shadow-xl max-w-4xl mx-auto overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Card 1 */}
              <div className="p-4 rounded-2xl bg-white/90 border border-stone-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-base">
                  🎙️
                </div>
                <h3 className="font-bold text-sm text-stone-900">つぶやき・音声・写真を記録</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  文字だけでなく、音声メモや日常の写真・動画を投稿。AIが感情や情景を汲み取ります。
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-2xl bg-white/90 border border-stone-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-base">
                  🛋️
                </div>
                <h3 className="font-bold text-sm text-stone-900">手帳日記 ＆ 空間家具の生成</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  一日のできごとが可愛い家具やポスター、手帳の日記ページとしてお部屋に飾られます。
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-4 rounded-2xl bg-white/90 border border-stone-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-base">
                  🤝
                </div>
                <h3 className="font-bold text-sm text-stone-900">友達のお部屋を行き来</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  親しい友達（2〜5人）の部屋へお散歩。お花やコーヒーを置く優しいリアクション。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Section */}
      <section id="features" className="px-4 sm:px-8 py-16 bg-white border-y border-stone-200/80">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              DailyLinkの4つのコア体験
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-xl mx-auto">
              数字の比較や拡散を排し、大切な人たちとの居心地の良さを最優先に設計されています。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-[#faf8f5] border border-stone-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-xl">
                  📖
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">手帳風AI日記 ＆ 感情分析</h3>
                  <span className="text-[10px] font-semibold text-amber-800">LifeLog AI Diary</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                毎日の忙しい合間に残した短いメモや音声から、Gemini AIが心温まる手帳風の日記をまとめます。気分や感情オーブも自動で記録され、過去の思い出をカレンダーからいつでも振り返ることができます。
              </p>
              <ul className="text-xs text-stone-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>音声・写真・動画・テキストのマルチモーダル対応</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>日別の感情オーブと日記アーカイブ</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-[#faf8f5] border border-stone-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xl">
                  🪑
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">自分だけの3D空間ルーム</h3>
                  <span className="text-[10px] font-semibold text-emerald-800">Room Customization</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                日記の内容に応じたミニチュア家具（コーヒーカップ、読書デスク、観葉植物など）が部屋に配置されます。ドラッグ＆ドロップで自由に模様替えができ、思い出のクローゼット機能で大切な品を整理できます。
              </p>
              <ul className="text-xs text-stone-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>自由なドラッグ配置＆スロット配置</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>お部屋のテーマ変更と壁紙カスタマイズ</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-[#faf8f5] border border-stone-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-xl">
                  🔒
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">完全クローズド（2〜5人限定）</h3>
                  <span className="text-[10px] font-semibold text-sky-800">Ultra-Private Circles</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                見知らぬ人からの閲覧や拡散は一切ありません。自分が招待リンクを送った家族、親友、パートナーだけがアクセスできる安全な空間です。フォロワー数やいいね数の競い合いとは無縁です。
              </p>
              <ul className="text-xs text-stone-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>専用招待URL / QRコードでの相互認証</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>公開範囲（全体・親友限定・非公開）の個別設定</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-[#faf8f5] border border-stone-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-xl">
                  🌷
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">おそろいアイテム ＆ そっと残すリアクション</h3>
                  <span className="text-[10px] font-semibold text-purple-800">Warm Gifting & Matching</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                合言葉（Passcode）でおそろいの家具を友達と一緒に作成したり、友達の部屋に訪れて「お花」や「温かいコーヒー」を机にそっと置いていく穏やかな交流が楽しめます。
              </p>
              <ul className="text-xs text-stone-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>合言葉でのペアアイテム生成</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>部屋に直接届くギフト・リアクション通知</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Google OAuth & User Data Usage Transparency Section (Crucial for OAuth Verification) */}
      <section id="data-usage" className="px-4 sm:px-8 py-16 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-950 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-emerald-700" />
            <span>プライバシーとデータセキュリティへの誓い</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            ユーザーデータおよびGoogle連携の利用目的と透明性
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-2xl mx-auto">
            DailyLinkでは、ユーザーの皆様が安心してご利用いただけるよう、収集するデータとその使用目的を完全に開示しています。
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Requested Data & Purpose */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                <KeyRound className="w-4 h-4 text-amber-800" />
                <span>取得する情報と利用目的（Google認証含む）</span>
              </div>
              <ul className="text-xs text-stone-700 space-y-2 leading-relaxed">
                <li>
                  <strong>• 基本プロフィール情報（お名前・メールアドレス・プロフィール画像）:</strong>
                  <br />
                  アカウントの安全な作成・認証、および相互招待したフレンドがお部屋の中であなたを識別するために使用します。
                </li>
                <li>
                  <strong>• 投稿データ（メモ・音声・画像・日記）:</strong>
                  <br />
                  あなた自身の手帳風日記や空間家具オブジェクトを生成・表示するためだけに使用されます。
                </li>
              </ul>
            </div>

            {/* Box 2: Strict Privacy Policy & Non-Disclosure */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                <Lock className="w-4 h-4 text-emerald-800" />
                <span>厳格な非開示・セキュリティ原則</span>
              </div>
              <ul className="text-xs text-stone-700 space-y-2 leading-relaxed">
                <li>
                  <strong>• 広告販売・第三者提供の禁止:</strong>
                  <br />
                  収集した個人情報や日記データを広告トラッキング企業や第三者に販売・提供することは一切ありません。
                </li>
                <li>
                  <strong>• 高度な暗号化とアクセス制御:</strong>
                  <br />
                  すべての通信およびデータベース保存はSSL/TLS等により暗号化され、安全に保管されます。
                </li>
              </ul>
            </div>
          </div>

          {/* User Rights Box */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-2">
            <p className="font-bold text-stone-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-stone-600" />
              <span>ユーザーのデータ管理権と退会・削除請求</span>
            </p>
            <p className="leading-relaxed">
              ユーザーはいつでも自身の投稿データを修正・削除できます。また、マイページまたは運営窓口（
              <a href="mailto:di0119264@gmail.com" className="text-amber-900 underline font-bold">
                di0119264@gmail.com
              </a>
              ）へのご連絡により、アカウントおよび関連するすべてのデータの完全削除をいつでも請求いただけます。
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-bold text-amber-900">
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="inline-flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>プライバシーポリシー全文を読む</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <span className="text-stone-300">•</span>
            <button
              type="button"
              onClick={onOpenTerms}
              className="inline-flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>利用規約を読む</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action */}
      <section className="px-4 sm:px-8 py-16 bg-gradient-to-b from-[#faf8f5] to-amber-100/50 border-t border-stone-200/80">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <div className="w-14 h-14 rounded-3xl bg-amber-900 text-amber-100 flex items-center justify-center text-2xl mx-auto shadow-md">
            🏡
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            親しい友達と、穏やかな日常をはじめましょう。
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            登録は無料です。Googleアカウントまたはメールアドレスですぐに開始できます。
          </p>

          <div className="pt-2">
            {isLoggedIn && onGoToApp ? (
              <button
                type="button"
                onClick={onGoToApp}
                className="px-8 py-4 rounded-2xl bg-amber-900 hover:bg-amber-950 text-amber-50 font-bold text-sm sm:text-base shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>お部屋へ移動する</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-8 py-4 rounded-2xl bg-amber-900 hover:bg-amber-950 text-amber-50 font-bold text-sm sm:text-base shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>無料でアカウントを作成 / ログイン</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 6. Footer (Meeting Domain & Verification Criteria) */}
      <footer className="bg-stone-900 text-stone-400 text-xs px-4 sm:px-8 py-12 border-t border-stone-800">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
                🏡
              </div>
              <div>
                <span className="text-white font-bold text-sm">DailyLink</span>
                <p className="text-[11px] text-stone-400">完全クローズド空間SNS ＆ 手帳風AI日記</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-stone-300 font-medium">
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="hover:text-white underline cursor-pointer"
              >
                プライバシーポリシー
              </button>
              <button
                type="button"
                onClick={onOpenTerms}
                className="hover:text-white underline cursor-pointer"
              >
                利用規約
              </button>
              <a
                href="mailto:di0119264@gmail.com"
                className="hover:text-white underline cursor-pointer"
              >
                お問い合わせ
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-stone-400">
            <div>
              <p className="text-stone-300 font-bold mb-1">運営・お問い合わせ窓口</p>
              <p>DailyLink 運営事務局</p>
              <p>連絡先: di0119264@gmail.com</p>
            </div>
            <div className="sm:text-right">
              <p>© 2026 DailyLink. All rights reserved.</p>
              <p className="text-stone-500 mt-1">
                GoogleおよびGoogleロゴはGoogle LLCの商標です。
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
