import React, { useState } from 'react';
import {
  supabaseSignUp,
  supabaseSignIn,
  supabaseSignInWithGoogle,
  supabaseGetProfile,
  isSupabaseConfigured,
} from '../lib/supabase';
import { Sparkles, User, Lock, Mail, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onBackToHome?: () => void;
}

const AVATAR_SELECTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onOpenPrivacy,
  onOpenTerms,
  onBackToHome,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(AVATAR_SELECTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage('');
    try {
      const res: any = await supabaseSignInWithGoogle();
      if (res.error) {
        throw res.error;
      }
      if (res.profile) {
        onLoginSuccess(res.profile);
      } else if (res.data?.user?.id) {
        const profile = await supabaseGetProfile(res.data.user.id);
        if (profile) {
          onLoginSuccess(profile);
        }
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setErrorMessage(err.message || 'Googleログインに失敗しました。');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const uName = username.trim()
        ? (username.startsWith('@') ? username : `@${username}`)
        : `@user_${Math.floor(100 + Math.random() * 900)}`;
      const name = displayName.trim() || '私の部屋';

      if (isSignUp) {
        const { profile, error } = await supabaseSignUp(
          email,
          password,
          name,
          uName,
          selectedPhoto
        );

        if (error) {
          throw error;
        }

        if (profile) {
          onLoginSuccess(profile);
          return;
        }
      } else {
        const { profile, error } = await supabaseSignIn(email, password);
        if (error) {
          throw error;
        }

        if (profile) {
          onLoginSuccess(profile);
          return;
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg = err.message || '';
      if (
        msg.includes('invalid-credential') ||
        msg.includes('Invalid login credentials') ||
        msg.includes('wrong-password')
      ) {
        setErrorMessage('メールアドレスまたはパスワードが正しくありません。');
      } else if (
        msg.includes('already-in-use') ||
        msg.includes('User already registered')
      ) {
        setErrorMessage('このメールアドレスは既に登録されています。ログインしてください。');
      } else if (
        msg.includes('weak-password') ||
        msg.includes('Password should be')
      ) {
        setErrorMessage('パスワードは6文字以上で設定してください。');
      } else {
        setErrorMessage(msg || '認証に失敗しました。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4 selection:bg-amber-200">
      {/* Visual Header */}
      <div className="max-w-md w-full text-center space-y-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {onBackToHome && (
          <div className="flex justify-start mb-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-stone-200 text-stone-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ホームページ（機能紹介）に戻る</span>
            </button>
          </div>
        )}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-100/80 border border-amber-200 shadow-xs mb-1">
          <span className="text-3xl filter drop-shadow-xs">🏡</span>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center justify-center gap-2">
            <span>DailyLink</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-950 font-bold">
              完全クローズド空間SNS
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 font-medium">
            「人の部屋を覗きに行く」SNS — 読むSNSから、歩くSNSへ
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl max-w-md w-full border border-stone-200 shadow-xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              {isSignUp ? 'アカウントを新規作成' : 'おかえりなさい（ログイン）'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {isSignUp
                ? '親しい友達とだけ、日々の暮らしを部屋で共有しましょう'
                : '登録したアカウントでログイン'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Google One-Click Sign In Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Googleアカウントでログイン / 登録</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-stone-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-stone-400 font-medium absolute">
            またはメールアドレスで
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <>
              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  アバターを選んでください
                </label>
                <div className="flex gap-2 justify-between">
                  {AVATAR_SELECTIONS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhoto(url)}
                      className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedPhoto === url
                          ? 'border-amber-600 scale-105 shadow-xs ring-2 ring-amber-400/40'
                          : 'border-stone-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">お名前・ニックネーム</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="例: あや"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ユーザーID（部屋の目印）</label>
                <div className="relative">
                  <span className="text-stone-400 text-xs font-bold absolute left-3.5 top-1/2 -translate-y-1/2">
                    @
                  </span>
                  <input
                    type="text"
                    value={username.replace(/^@/, '')}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="aya_room"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">メールアドレス</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">パスワード（6文字以上）</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full mt-2 py-3 rounded-2xl bg-[#3c342b] hover:bg-[#2b241c] text-white text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <>
                <span>{isSignUp ? '部屋を開設する' : '部屋に入る（ログイン）'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Legal Consent Notice */}
        <p className="mt-3 text-center text-[11px] text-stone-500 leading-normal">
          ログインまたはアカウント登録により、
          <button
            type="button"
            onClick={onOpenTerms}
            className="text-amber-900 font-bold underline hover:text-amber-950 mx-0.5 cursor-pointer"
          >
            利用規約
          </button>
          および
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-amber-900 font-bold underline hover:text-amber-950 mx-0.5 cursor-pointer"
          >
            プライバシーポリシー
          </button>
          に同意したものとみなされます。
        </p>

        <div className="mt-4 pt-3.5 border-t border-stone-100 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage('');
            }}
            className="text-xs text-amber-900 font-bold hover:underline cursor-pointer"
          >
            {isSignUp
              ? '既にアカウントをお持ちの方はこちら（ログイン）'
              : 'メールで新規アカウント作成したい方はこちら'}
          </button>
        </div>
      </div>

      {/* Feature Footnote & Legal Footer */}
      <div className="mt-5 text-center text-[11px] text-stone-500 max-w-sm space-y-2">
        <p>🔒 招待した親しい友達（2〜5人）とだけ繋がれる完全クローズド設計です。</p>
        <div className="flex items-center justify-center gap-3 pt-1 text-stone-600 font-medium">
          <button
            type="button"
            onClick={onOpenTerms}
            className="hover:text-stone-900 underline cursor-pointer"
          >
            利用規約
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="hover:text-stone-900 underline cursor-pointer"
          >
            プライバシーポリシー
          </button>
        </div>
      </div>
    </div>
  );
};
