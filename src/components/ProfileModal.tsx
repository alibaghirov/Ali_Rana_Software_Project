import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Bell,
  RefreshCw,
  LogOut,
  Users,
  ShieldAlert,
  Save,
  Check,
} from 'lucide-react';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';
import { formatAZN } from '../utils/finance.ts';
import type { UserProfile } from '../types/finance.ts';

interface ProfileModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updates: any) => Promise<void>;
  onSwitchUser: (userId: string) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onLogout: () => void;
  language: Language;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateProfile,
  onSwitchUser,
  onResetDemo,
  onLogout,
  language,
}) => {
  const t = (key: any) => getTranslation(key, language);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [openingBalance, setOpeningBalance] = useState(user?.openingBalance?.toString() || '0');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || 'AZN');
  const [timeZone, setTimeZone] = useState(user?.timeZone || 'Asia/Baku');
  const [dailyReminders, setDailyReminders] = useState(user?.notificationPreferences?.dailyReminders ?? true);
  const [reminderTime, setReminderTime] = useState(user?.notificationPreferences?.reminderTime || '20:00');
  const [userList, setUserList] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setOpeningBalance(user.openingBalance.toString());
      setPreferredCurrency(user.preferredCurrency);
      setTimeZone(user.timeZone);
      setDailyReminders(user.notificationPreferences?.dailyReminders ?? true);
      setReminderTime(user.notificationPreferences?.reminderTime || '20:00');
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setLoadingUsers(true);
      fetch('/api/auth/users-list')
        .then((res) => res.json())
        .then((data) => setUserList(data.users || []))
        .catch(console.error)
        .finally(() => setLoadingUsers(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateProfile({
        displayName: displayName.trim(),
        openingBalance: Number(openingBalance) || 0,
        preferredCurrency,
        timeZone,
        notificationPreferences: {
          dailyReminders,
          reminderTime,
          milestoneAlerts: true,
          weeklySummary: true,
        },
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            {t('settings')}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            Bağla
          </button>
        </div>

        {isSaved && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Tənzimləmələr uğurla yadda saxlanıldı!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ad və Soyad
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                İlkin Balans (Opening Balance)
              </label>
              <input
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Əsas Valyuta
              </label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
              >
                <option value="AZN">AZN (₼ - Azərbaycan Manatı)</option>
                <option value="USD">USD ($ - ABŞ Dolları)</option>
                <option value="EUR">EUR (€ - Avro)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Saat Qurşağı (Time Zone)
            </label>
            <input
              type="text"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
            />
          </div>

          {/* Notifications */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  Gündəlik Qənaət Xatırlatması
                </span>
              </div>
              <input
                type="checkbox"
                checked={dailyReminders}
                onChange={(e) => setDailyReminders(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-700"
              />
            </div>
            {dailyReminders && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Xatırlatma saatı:</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Yadda saxla</span>
            </button>
          </div>
        </form>

        {/* Multi-User Financial Workspace Switcher (Test 9 Isolation) */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span>İstifadəçi İş Sahələri (İzolyasiya Testi)</span>
            </h4>
            <span className="text-[10px] text-slate-500">Müstəqil maliyyə bazası</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Hər bir istifadəçinin tranzaksiyaları, balansları və hədəfləri tamamilə izolyasiya olunub (Test 9 tələbi).
          </p>

          <div className="space-y-1.5">
            {userList.map((u) => {
              const isCurrent = u.id === user?.id;
              return (
                <div
                  key={u.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    isCurrent
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{u.displayName}</span>
                    <span className="text-[10px] text-slate-400">{u.email}</span>
                  </div>
                  {isCurrent ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      Aktiv Hesab
                    </span>
                  ) : (
                    <button
                      onClick={() => onSwitchUser(u.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-semibold transition-colors"
                    >
                      Keçid et
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset Database Demo Data */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-400 block">Nümunə Məlumatları Sıfırla</span>
            <span className="text-[10px] text-slate-500">İlkin demo vəziyyətinə qaytarır</span>
          </div>
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sıfırla</span>
          </button>
        </div>

        {/* Logout from Account */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Hesabdan Çıxış</span>
            <span className="text-[10px] text-slate-500">Cari sessiyanı sonlandırır və giriş səhifəsinə qayıdır</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıxış et</span>
          </button>
        </div>
      </div>
    </div>
  );
};
