import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, Sparkles, Mail, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.origin + '/privacy');
    alert('プライバシーポリシーのURLをコピーしました！📋');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 py-8 px-4 sm:px-6 lg:px-8 selection:bg-amber-200">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header Controls */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-stone-200">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>戻る</span>
            </button>
          ) : (
            <a
              href="/"
              onClick={(e) => {
                if (window.history.length > 1) {
                  e.preventDefault();
                  window.history.pushState({}, '', '/');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>アプリへ戻る</span>
            </a>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              title="URLをコピー"
            >
              URLをコピー
            </button>
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              印刷 / PDF
            </button>
          </div>
        </div>

        {/* Title Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>プライバシー保護方針 (Privacy Policy)</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              プライバシーポリシー
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              サービス名: DailyLink
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              最終更新日・制定日: 2026年8月20日
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs sm:text-sm text-stone-700 leading-relaxed">
            「DailyLink」（以下「本サービス」）は、ユーザーの皆様が安心して日々の記録や思い出を親しいフレンドと共有できるよう、個人情報の保護およびデータセキュリティを最重要事項として取り扱います。本プライバシーポリシーでは、当サービスにおける個人情報の収集、利用、管理、および保護について定めます。
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-8 text-xs sm:text-sm text-stone-700 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">1</span>
              <span>取得する情報およびその取得方法</span>
            </h2>
            <p>本サービスでは、円滑な機能提供およびユーザー体験向上のため、以下の情報を取得・保持します。</p>
            
            <div className="space-y-2.5 pt-1">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                <h3 className="font-bold text-stone-900 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>1. アカウントおよび認証情報</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-stone-600 pl-1">
                  <li>メールアドレス、表示名（ニックネーム）、ユーザーID（@username）</li>
                  <li>プロフィールアイコン画像（アバターURL）および自己紹介文</li>
                  <li>Googleアカウント認証（Google OAuth）や認証プロバイダを介してユーザーが明示的に連携を許可した基本プロフィール情報（メールアドレス、氏名、プロフィール写真）</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                <h3 className="font-bold text-stone-900 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-700" />
                  <span>2. ユーザー投稿コンテンツ及び記録データ</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-stone-600 pl-1">
                  <li>日記メモ、日々の出来事のテキスト、感情・気分（ムードスコア）</li>
                  <li>ユーザーが任意でアップロードした写真・画像データ</li>
                  <li>音声メモ録音データ（文字起こし処理用）</li>
                  <li>部屋のオブジェクト配置情報、カレンダー記録、フレンドとのつながり情報</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                <h3 className="font-bold text-stone-900 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  <span>3. 端末・アクセス情報</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-stone-600 pl-1">
                  <li>アクセスログ、IPアドレス、ブラウザ種類、OS情報、エラーログ（サービス品質向上および不正アクセス防止目的）</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">2</span>
              <span>個人情報の利用目的</span>
            </h2>
            <p>当サービスは、取得した個人情報を以下の目的でのみ利用します。</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-stone-700">
              <li>本サービスへのログイン認証、アカウント作成および本人確認のため</li>
              <li>ユーザーの日常記録を可視化し、バーチャルルームおよび3Dアイテムを自動生成・表示するため</li>
              <li>招待・相互承認したフレンド間での安全な部屋の相互閲覧・リアクション共有のため</li>
              <li>AI（人工知能）による日記要約、音声文字起こし、及び感情オブジェクト生成処理を実行するため</li>
              <li>システムの保守、不具合修正、セキュリティ対策および不正利用防止のため</li>
              <li>ユーザーからのお問い合わせ対応および重要なお知らせの配信のため</li>
            </ul>
          </section>

          {/* Section 3 - Google OAuth Specific Limited Use Notice */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">3</span>
              <span>Google API及びOAuthユーザーデータの取扱い（Limited Use Policy）</span>
            </h2>
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300/80 space-y-2 text-stone-800">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Google API ユーザーデータの限定的使用に関する誓約</span>
              </div>
              <p className="leading-relaxed">
                本サービスによる Google API から受信した情報の使用および他のアプリへの転送は、
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800 underline font-bold hover:text-amber-900 mx-1"
                >
                  Google API サービスのユーザーデータに関するポリシー（限定的使用の要件を含む）
                </a>
                に厳格に準拠します。
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-700 pt-1">
                <li>Google OAuth認証で取得したデータ（メールアドレス、名前、アイコン写真）は、ユーザーのアカウント作成・サインインおよび部屋の初期プロフィール設定にのみ使用されます。</li>
                <li>取得したGoogleユーザーデータを広告目的に使用したり、第三者へ販売・提供したりすることは一切ありません。</li>
                <li>人間がユーザーの個人データを閲覧することは、セキュリティインシデントの調査や法令遵守、またはユーザーの明示的な同意がある場合を除き、原則として行われません。</li>
              </ul>
            </div>
          </section>

          {/* Section 4 - AI Processing */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">4</span>
              <span>AI処理および外部クラウドサービスの利用について</span>
            </h2>
            <p>本サービスでは、3Dミニチュアオブジェクト生成や音声文字起こし機能を実現するために以下の外部APIおよびクラウド基盤を利用しています。</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-stone-700">
              <li>
                <strong>Google Gemini API:</strong> ユーザーが入力した日記・出来事テキストを解析し、3Dオブジェクトの形状や思い出メモを生成するために使用します。データはHTTPS暗号化通信で送信され、公開AIモデルの一般学習データとして無断転用されない安全なAPIエンドポイントを利用しています。
              </li>
              <li>
                <strong>Groq API (Whisper):</strong> 音声入力時の高速文字起こしに使用します。
              </li>
              <li>
                <strong>Firebase / Supabase:</strong> ユーザーの認証データおよびデータベースの暗号化保管に使用します。
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">5</span>
              <span>個人情報の第三者提供について</span>
            </h2>
            <p>本サービスは、以下の場合を除き、ユーザーの事前の同意なく個人情報を第三者に提供・開示することはありません。</p>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-stone-700">
              <li>法令に基づく正式な開示要請があった場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合</li>
              <li>利用規約違反や不正行為の調査等、サービス保護に必要な緊急措置をとる場合</li>
            </ol>
          </section>

          {/* Section 6 - User Rights & Deletion */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">6</span>
              <span>ユーザーの権利（データの開示・訂正・アカウント削除）</span>
            </h2>
            <p>
              ユーザーは、本サービス上でいつでも自己のプロフィール情報や投稿した思い出オブジェクトを編集・削除することができます。
            </p>
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <p className="font-bold text-stone-900 mb-1">【アカウントおよび全データの削除について】</p>
              <p className="text-stone-600">
                アカウントの完全削除（退会）および保存されている全ての投稿・画像・部屋データの抹消を希望される場合は、アプリ内設定または下記のお問い合わせ窓口へご連絡ください。確認後、速やかに関連データを復元不能な形で削除いたします。
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">7</span>
              <span>安全管理措置</span>
            </h2>
            <p>
              本サービスでは、個人情報への不正アクセス、紛失、破壊、改ざん及び漏洩を防ぐため、通信の常時暗号化（SSL/TLS）、厳格なアクセス制御、セキュリティルールの設定等の適切な安全管理対策を実施しています。
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">8</span>
              <span>プライバシーポリシーの改定</span>
            </h2>
            <p>
              本サービスは、法令の変更やサービス内容の改定に伴い、本ポリシーを適宜改定することがあります。重要な変更を行う場合は、アプリ内または本ページ上でお知らせいたします。
            </p>
          </section>

          {/* Section 9 - Contact */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">9</span>
              <span>お問い合わせ窓口</span>
            </h2>
            <p>
              本プライバシーポリシーに関するご質問、個人情報の取扱いに関するご相談や削除請求は、以下の窓口までご連絡ください。
            </p>
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
              <p className="font-bold text-stone-900">DailyLink 運営窓口</p>
              <div className="flex items-center gap-2 text-stone-700">
                <Mail className="w-4 h-4 text-amber-700" />
                <span>メールアドレス: <a href="mailto:di0119264@gmail.com" className="text-amber-900 font-bold underline hover:text-amber-950">di0119264@gmail.com</a></span>
              </div>
              <p className="text-[11px] text-stone-500 pt-1">
                ※原則として土日祝日を除く3営業日以内にご回答申し上げます。
              </p>
            </div>
          </section>

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-stone-500 py-4 space-y-2">
          <p>© 2026 DailyLink. All rights reserved.</p>
          <div className="flex justify-center gap-4 text-amber-900 font-semibold">
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/terms');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:underline cursor-pointer"
            >
              利用規約 (Terms of Service)
            </a>
            <span>•</span>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/privacy');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:underline cursor-pointer"
            >
              プライバシーポリシー (Privacy Policy)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
