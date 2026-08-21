import React, { useState } from 'react';
import {
  supabaseSignUp,
  supabaseSignIn,
  supabaseGetProfile,
  isSupabaseConfigured,
} from '../lib/supabase';
import { auth, db, doc, setDoc } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
} from 'firebase/auth';
import { X, LogIn, Sparkles, User, Lock, Mail, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const name = displayName.trim() || 'ユーザー';
      const photo =
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

      // 1. Supabase Auth
      if (isSignUp) {
        const { profile, error } = await supabaseSignUp(
          email,
          password,
          name,
          `@${email.split('@')[0]}`,
          photo
        );

        if (error) {
          throw error;
        }

        if (profile) {
          try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password).catch(() => null);
            if (userCred?.user) {
              await updateProfile(userCred.user, { displayName: name, photoURL: photo }).catch(() => {});
              await setDoc(doc(db, 'users', profile.uid), profile, { merge: true }).catch(() => {});
            }
          } catch {
            // sync error ignored
          }
          onLoginSuccess(profile);
          onClose();
          return;
        }
      } else {
        const { profile, error } = await supabaseSignIn(email, password);
        if (error) {
          throw error;
        }
        if (profile) {
          onLoginSuccess(profile);
          onClose();
          return;
        }
      }
    } catch (err: any) {
      console.error('Supabase Auth error, attempting Firebase fallback:', err);
      // 2. Firebase Fallback
      try {
        if (isSignUp) {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          const name = displayName.trim() || 'ユーザー';
          const photo =
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

          await updateProfile(userCred.user, {
            displayName: name,
            photoURL: photo,
          });

          const profile: UserProfile = {
            uid: userCred.user.uid,
            displayName: name,
            photoURL: photo,
            bio: 'Roomonで日常を空間オブジェクトに記録しています',
            customShareCategories: ['親友', '部活', '家族', 'パートナー'],
            createdAt: new Date().toISOString(),
          };

          await setDoc(doc(db, 'users', userCred.user.uid), profile, { merge: true });
          onLoginSuccess(profile);
        } else {
          const userCred = await signInWithEmailAndPassword(auth, email, password);
          const profile: UserProfile = {
            uid: userCred.user.uid,
            displayName: userCred.user.displayName || 'ユーザー',
            photoURL:
              userCred.user.photoURL ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            bio: 'Roomonで日常を空間オブジェクトに記録しています',
            createdAt: new Date().toISOString(),
          };
          onLoginSuccess(profile);
        }
        onClose();
      } catch (fbErr: any) {
        setErrorMessage(err.message || fbErr.message || '認証エラーが発生しました。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const userCred = await signInAnonymously(auth);
      const guestName = `ゲスト_${Math.floor(1000 + Math.random() * 9000)}`;
      const photo =
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

      const profile: UserProfile = {
        uid: userCred.user.uid,
        displayName: guestName,
        photoURL: photo,
        bio: 'Roomonで日常を空間オブジェクトに記録しています',
        customShareCategories: ['親友', '部活', '家族'],
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', userCred.user.uid), profile, { merge: true });
      onLoginSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error('Guest login error:', err);
      setErrorMessage('ゲストログインに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-stone-50 rounded-3xl max-w-sm w-full overflow-hidden border border-stone-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-100/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛋️</span>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Roomon（ルーモン）</h3>
              <p className="text-xs text-stone-500">完全クローズド空間SNS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">お名前</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="ニックネーム"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">メールアドレス</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">パスワード</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 shadow-sm flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{isSignUp ? 'アカウントを作成' : 'ログイン'}</span>
            </button>
          </form>

          <div className="text-center text-xs text-stone-500">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-amber-800 font-semibold hover:underline"
            >
              {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : '初めての方はこちら（新規作成）'}
            </button>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-stone-50 px-2 text-stone-400">または</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>ゲストとして試す（登録不要）</span>
          </button>
        </div>
      </div>
    </div>
  );
};
