import React from 'react';
import { ArrowLeft, BookOpen, Scale, FileText, CheckCircle2, ShieldAlert, Mail } from 'lucide-react';

interface TermsOfServiceViewProps {
  onBack?: () => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = ({ onBack }) => {
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.origin + '/terms');
    alert('利用規約のURLをコピーしました！📋');
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
            <Scale className="w-4 h-4 text-amber-700" />
            <span>利用規約 (Terms of Service)</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              サービス利用規約
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              サービス名: DailyLink
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              最終更新日・制定日: 2026年8月20日
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs sm:text-sm text-stone-700 leading-relaxed">
            本利用規約（以下「本規約」）は、「DailyLink」（以下「本サービス」）の提供条件および本サービスをご利用いただく全てのユーザーの皆様（以下「ユーザー」）との権利義務関係を定めるものです。本サービスをご利用（アカウント登録、Google認証等の利用を含む）される前に、本規約の全文をお読みいただき、同意いただく必要があります。
          </div>
        </div>

        {/* Terms Content Sections */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-8 text-xs sm:text-sm text-stone-700 leading-relaxed">
          
          {/* Article 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">1</span>
              <span>第1条（適用）</span>
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-stone-700">
              <li>本規約は、ユーザーと本サービス運営者（以下「当運営」）との間の本サービスの利用に関わる一切の関係に適用されます。</li>
              <li>当運営が本サービス上で掲載するプライバシーポリシー、各種ガイドラインその他の個別規定は、本規約の一部を構成するものとします。</li>
            </ol>
          </section>

          {/* Article 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">2</span>
              <span>第2条（定義）</span>
            </h2>
            <p>本規約において使用する主要な用語の定義は、以下の通りとします。</p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-stone-700">
              <li><strong>「本サービス」:</strong> 当運営が提供するクローズド空間SNSおよびライフログ日記サービス「DailyLink」および関連する全機能。</li>
              <li><strong>「ユーザー」:</strong> 本規約に同意の上、本サービスに登録または利用する個人。</li>
              <li><strong>「投稿データ」:</strong> ユーザーが本サービス上に記録・アップロードしたテキスト、日記、音声、画像、感情値等の情報。</li>
              <li><strong>「AI生成物」:</strong> 投稿データに基づき、生成AI技術を通じて作成される3Dミニチュアオブジェクト、感情オーブ、要約テキスト等。</li>
            </ul>
          </section>

          {/* Article 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">3</span>
              <span>第3条（アカウント登録・認証及び管理）</span>
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-stone-700">
              <li>登録希望者は、真実、正確かつ最新の情報を登録するものとします。</li>
              <li>ユーザーは、Google OAuth等の外部アカウント連携、またはメールアドレスとパスワードによる認証情報を自己の責任において適切に管理するものとします。</li>
              <li>ユーザーのアカウント情報の管理不十分による第三者の不正利用等により生じた損害について、当運営に故意または重大な過失がある場合を除き、当運営は一切の責任を負いません。</li>
            </ol>
          </section>

          {/* Article 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">4</span>
              <span>第4条（禁止事項）</span>
            </h2>
            <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-stone-700">
              <li>法令または公序良俗に違反する行為、犯罪行為に関連する行為</li>
              <li>当運営、他のユーザー、または第三者の著作権、商標権、名誉、プライバシーその他一切の権利を侵害する行為</li>
              <li>誹謗中傷、脅迫、わいせつ、暴力的な表現、他人に不快感を与えるコンテンツの投稿</li>
              <li>当運営のサーバーやネットワークの機能を破壊・妨害する行為、過度な負荷をかける行為</li>
              <li>本サービスのプログラム・APIに対するリバースエンジニアリング、スクレイピング等の不正解析行為</li>
              <li>他のユーザーへのなりすまし、アカウントの不正取得や譲渡・売買</li>
              <li>宣伝、広告、勧誘、その他本サービスが意図しない営業活動</li>
              <li>その他、当運営が不適切と合理的に判断する行為</li>
            </ul>
          </section>

          {/* Article 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">5</span>
              <span>第5条（投稿データの権利および管理）</span>
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-stone-700">
              <li>ユーザーが投稿したテキスト、写真等の著作権は、引き続き当該ユーザーまたは正当な権利者に帰属します。</li>
              <li>ユーザーは、本サービスのシステム運用、3Dオブジェクトの自動変換・表示、およびフレンド間での共有に必要な範囲において、当運営に対して非独占的な利用（複製、翻案、表示等）を無償で許諾するものとします。</li>
              <li>投稿データのバックアップはユーザー自身の責任において行うものとします。</li>
            </ol>
          </section>

          {/* Article 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">6</span>
              <span>第6条（AI機能に関する特記事項および免責）</span>
            </h2>
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1.5">
              <p className="font-bold text-stone-900">【AI生成機能についての留意事項】</p>
              <ul className="list-disc list-inside space-y-1 text-stone-700">
                <li>本サービスが提供するAI機能（3Dミニチュアオブジェクト生成、感情解釈、音声文字起こし等）は、高度な機械学習モデル（Google Gemini等）を用いて自動処理されます。</li>
                <li>当運営は、AI生成物の完全性、正確性、特定の目的に対する適合性についていかなる保証も行いません。</li>
                <li>AIによって生成された3Dミニチュアや思い出メモは、ユーザーの日常記録の楽しさを補助する表現物としてお楽しみください。</li>
              </ul>
            </div>
          </section>

          {/* Article 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">7</span>
              <span>第7条（本サービスの停止・変更・終了）</span>
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-stone-700">
              <li>当運営は、システムの保守点検、火災・停電等の天災地変、サーバー障害等の不可抗力が発生した場合、事前の通知なく本サービスの提供を一時的に中断または停止することができます。</li>
              <li>当運営は、都合により、本サービスの内容を変更し、または提供を終了することができます。重大な変更または終了を行う場合は、事前に適切な方法でユーザーに通知するよう努めます。</li>
            </ol>
          </section>

          {/* Article 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">8</span>
              <span>第8条（免責事項・損害賠償の制限）</span>
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-stone-700">
              <li>当運営は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
              <li>当運営は、本サービスに起因してユーザーに生じたあらゆる損害について、当運営に故意または重大な過失がある場合を除き、一切の責任を負いません。</li>
            </ol>
          </section>

          {/* Article 9 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">9</span>
              <span>第9条（利用規約の変更）</span>
            </h2>
            <p>
              当運営は、必要と判断した場合には、ユーザーへの事前の通知または本サービス上での告知をもって本規約を変更することができるものとします。変更後の利用規約は、本サービス上に掲載された時点より効力を生じます。
            </p>
          </section>

          {/* Article 10 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">10</span>
              <span>第10条（準拠法および管轄裁判所）</span>
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-stone-700">
              <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
              <li>本サービスまたは本規約に関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
            </ol>
          </section>

          {/* Article 11 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">11</span>
              <span>第11条（お問い合わせ）</span>
            </h2>
            <p>本規約に関するお問い合わせは、下記窓口までご連絡ください。</p>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <p className="font-bold text-stone-900">DailyLink 運営事務局</p>
              <div className="flex items-center gap-2 text-stone-700 text-xs sm:text-sm">
                <Mail className="w-4 h-4 text-amber-700" />
                <span>連絡先: <a href="mailto:di0119264@gmail.com" className="text-amber-900 font-bold underline hover:text-amber-950">di0119264@gmail.com</a></span>
              </div>
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
