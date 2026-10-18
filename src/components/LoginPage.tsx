import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Phone,
  CreditCard,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: any) => void;
  language: Language;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, language }) => {
  const t = (key: any) => getTranslation(key, language);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Registration fields
  const [phone, setPhone] = useState('+994');
  const [finCode, setFinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [incomingSmsPreview, setIncomingSmsPreview] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5 minutes = 300 seconds
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 5-minute Countdown Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, secondsRemaining]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  // Step 1: Send OTP for Phone verification
  const handleSendOtp = async (phoneNumberToSend: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumberToSend }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'SMS göndərilmədi');
      }

      setSecondsRemaining(300);
      setIsTimerActive(true);
      setStep('otp');
      setSuccessMsg('5 dəqiqə ərzində keçərli olan birdəfəlik SMS təsdiq kodu göndərildi.');

      if (data.codePreview) {
        setIncomingSmsPreview(data.codePreview);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg('Təsdiq kodu 6 rəqəmdən ibarət olmalıdır.');
      return;
    }

    if (secondsRemaining <= 0) {
      setErrorMsg('Kodun 5 dəqiqəlik keçərlilik müddəti bitib. Yeni kod tələb edin.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, code: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kod yanlışdır');
      }

      // If user already existed and logged in via OTP
      if (data.token && data.user) {
        onLoginSuccess(data.token, data.user);
        return;
      }

      // If registering, complete registration now
      if (mode === 'register') {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phone,
            finCode,
            displayName,
            password,
            openingBalance: Number(openingBalance) || 0,
          }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          throw new Error(regData.error || 'Qeydiyyat tamamlanmadı');
        }

        onLoginSuccess(regData.token, regData.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  // Submit initial registration form -> triggers OTP step
  const handleStartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanFin = finCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{7}$/.test(cleanFin)) {
      setErrorMsg('Şəxsiyyət vəsiqəsinin FİN kodu düz 7 simvol (rəqəm və latın hərfi) olmalıdır.');
      return;
    }

    if (phone.length < 13) {
      setErrorMsg('Düzgün mobil nömrə daxil edin (+994 XX XXX XX XX).');
      return;
    }

    if (!displayName.trim() || !password) {
      setErrorMsg('Ad, soyad və şifrə sahələri mütləqdir.');
      return;
    }

    handleSendOtp(phone);
  };

  // Standard Login submit
  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Giriş uğursuz oldu');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Giriş xətası');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Login
  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo giriş alınmadı');
      }
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-6 relative z-10">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/20 text-white font-bold mb-3">
          <Wallet className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <span>Qənaət</span>
          <span className="text-xs uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            AZN
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Şəxsi Maliyyə, Gündəlik Yığım Hədəfləri və Açıq Bankçılıq Platforması
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-md">
        {/* Mode Selector Tabs */}
        {step === 'form' && (
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daxil Ol
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Qeydiyyatdan Keç
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Simulated Incoming SMS Banner (shows real-time code for smooth user testing) */}
        {step === 'otp' && incomingSmsPreview && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 to-slate-800 border border-blue-500/40 text-xs text-blue-200 shadow-md">
            <div className="flex items-center justify-between font-bold mb-1">
              <span className="flex items-center gap-1.5 text-blue-300">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Gələn SMS Bildirişi (Simulyasiya)
              </span>
              <span className="text-[10px] text-blue-400 font-mono">İndi</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Hörmətli müştəri, Qənaət tətbiqinə giriş üçün birdəfəlik təsdiq kodunuz:{' '}
              <strong className="text-white font-mono text-sm tracking-wider underline">
                {incomingSmsPreview}
              </strong>
              . Kod 5 dəqiqə ərzində etibarlıdır.
            </p>
            <button
              type="button"
              onClick={() => setOtpCode(incomingSmsPreview)}
              className="mt-2 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline block"
            >
              Kodu avtomatik daxil et
            </button>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && step === 'form' && (
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mobil Nömrə, FİN Kod və ya Email
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="+994 50 123 45 67 və ya 5ABC123"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Şifrə</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Hesaba Daxil Ol</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Login Option */}
            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Nümunə Hesabla Sürətli Giriş (Əli Bağırov)</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTRATION FORM (Step 1: Info Collection) */}
        {mode === 'register' && step === 'form' && (
          <form onSubmit={handleStartRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mobil Telefon Nömrəsi *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+994 50 123 45 67"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Nömrəni təsdiqləmək üçün 5 dəqiqəlik SMS kodu göndəriləcək.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Şəxsiyyət Vəsiqəsinin FİN Kodu *
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  maxLength={7}
                  required
                  value={finCode}
                  onChange={(e) => setFinCode(e.target.value.toUpperCase())}
                  placeholder="Məs: 5ABC123"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-white text-xs font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Düz 7 simvoldan ibarət şəxsi identifikasiya nömrəsi.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ad və Soyad *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ad və Soyadınız"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Şifrə *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mürəkkəb şifrə təyin edin"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                İlkin Balans (AZN)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>SMS Təsdiq Kodunu Göndər</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. STEP 2: SMS OTP VERIFICATION (5-minute countdown) */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Nömrənin Təsdiqlənməsi</h3>
              <p className="text-xs text-slate-400">
                <strong className="text-slate-200">{phone}</strong> nömrəsinə göndərilmiş 6 rəqəmli
                kodu daxil edin:
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-white text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 5-minute countdown display */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Keçərlilik müddəti:</span>
              </div>
              <span
                className={`font-mono font-bold text-sm ${
                  secondsRemaining < 60 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {formatTimer(secondsRemaining)}
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading || secondsRemaining <= 0}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Təsdiq et və Giriş et</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ← Məlumatları dəyiş
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOtp(phone)}
                  disabled={loading || secondsRemaining > 240}
                  className="text-emerald-400 hover:text-emerald-300 disabled:opacity-40 font-semibold"
                >
                  Kodu yenidən göndər
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Security badge note */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Şəxsi məlumatlar 256-bit şifrələmə ilə qorunur</span>
        </div>
      </div>
    </div>
  );
};
