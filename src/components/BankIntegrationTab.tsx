import React, { useState } from 'react';
import {
  Building2,
  RefreshCw,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code,
  Trash2,
} from 'lucide-react';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';
import type { BankConnection } from '../types/finance.ts';

interface BankIntegrationTabProps {
  connections: BankConnection[];
  providers: Array<{
    code: string;
    name: string;
    logo: string;
    apiType: string;
    sandboxSupported: boolean;
  }>;
  onConnectBank: (bankCode: string) => Promise<void>;
  onSyncBank: (bankId: string) => Promise<{ newImportedCount: number }>;
  onDisconnectBank: (bankId: string) => Promise<void>;
  language: Language;
}

export const BankIntegrationTab: React.FC<BankIntegrationTabProps> = ({
  connections,
  providers,
  onConnectBank,
  onSyncBank,
  onDisconnectBank,
  language,
}) => {
  const t = (key: any) => getTranslation(key, language);

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedProviderCode, setSelectedProviderCode] = useState(providers[0]?.code || 'abb');
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ id: string; count: number } | null>(null);
  const [showDocsModal, setShowDocsModal] = useState(false);

  const handleSync = async (connId: string) => {
    setSyncingId(connId);
    setSyncResult(null);
    try {
      const res = await onSyncBank(connId);
      setSyncResult({ id: connId, count: res.newImportedCount });
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingId(null);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    try {
      await onConnectBank(selectedProviderCode);
      setIsConnectModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Xəta baş verdi');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            {t('openBankingTitle')}
          </h2>
          <p className="text-xs text-slate-400">
            {t('openBankingDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDocsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span>API & İnteqrasiya Sənədləri</span>
          </button>
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('connectBank')}</span>
          </button>
        </div>
      </div>

      {/* Security Guarantee Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800/80 border border-slate-800 flex items-start gap-3 text-xs">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-200">
            Maliyyə Məlumatlarının Təhlükəsizliyi və Məxfilik Zəmanəti
          </h4>
          <p className="text-slate-400 leading-relaxed">
            Qənaət tətbiqi heç vaxt bank şifrənizi, kart PİN və ya CVV kodlarını tələb etmir və saxlamır.
            Bütün əlaqələr Azərbaycan Mərkəzi Bankının (CBAR) Açıq Bankçılıq protokolu və token əsaslı OAuth2
            vasitəsilə yalnız oxu (read-only) rejimində həyata keçirilir.
          </p>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncResult && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {syncResult.count > 0
                ? `${syncResult.count} yeni əməliyyat uğurla idxal edildi və təkrar qeydlər avtomatik aradan qaldırıldı.`
                : 'Sinxronizasiya tamamlandı: Yeni əməliyyat yoxdur. Bütün əməliyyatlar artıq bazadadır (Deduplication aktivdir).'}
            </span>
          </div>
          <button
            onClick={() => setSyncResult(null)}
            className="text-[11px] underline hover:text-white"
          >
            Bağla
          </button>
        </div>
      )}

      {/* Connected Bank Accounts List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          {t('connectedAccounts')} ({connections.length})
        </h3>

        {connections.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500 space-y-2">
            <Building2 className="w-8 h-8 mx-auto text-slate-600" />
            <p>Hələ heç bir bank hesabı qoşulmayıb.</p>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="text-emerald-400 font-semibold hover:underline"
            >
              İndi bank hesabı qoşun
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((conn) => {
              const isSyncing = syncingId === conn.id;

              return (
                <div
                  key={conn.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                          🏦
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-100 text-sm">{conn.bankName}</h4>
                          <span className="text-[11px] font-mono text-slate-400">
                            Hesab: {conn.accountNumberMasked}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Aktiv
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>{t('lastSync')}:</span>
                      <span className="font-mono text-slate-300">
                        {conn.lastSyncedAt
                          ? new Date(conn.lastSyncedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Yeni'}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>İdxal olunmuş əməliyyat sayı:</span>
                      <span className="font-mono font-bold text-white">{conn.importedCount}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSync(conn.id)}
                      disabled={isSyncing}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Yenilənir...' : t('syncBank')}</span>
                    </button>
                    <button
                      onClick={() => onDisconnectBank(conn.id)}
                      title="Bağlantını kəs"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connect Bank Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              {t('connectBank')}
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Azərbaycan bankınızı təhlükəsiz Open Banking sandbox protokolu ilə qoşun:
            </p>

            <form onSubmit={handleConnect} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bank Təşkilatını Seçin
                </label>
                <div className="space-y-2">
                  {providers.map((p) => (
                    <label
                      key={p.code}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedProviderCode === p.code
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{p.logo}</span>
                        <div>
                          <div className="text-xs font-bold leading-none">{p.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{p.apiType}</div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="bankProvider"
                        value={p.code}
                        checked={selectedProviderCode === p.code}
                        onChange={(e) => setSelectedProviderCode(e.target.value)}
                        className="text-emerald-500 focus:ring-emerald-500 bg-slate-700"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400">
                <span className="font-semibold text-emerald-400">İcazə növü:</span> Tranzaksiya tarixçəsinin
                avtomatik oxunması və kateqoriyalara ayrılması. Kartdan birbaşa çıxarış və ya köçürmə icazəsi verilmir.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
                >
                  {isConnecting ? 'Qoşulur...' : 'Hesabı Təsdiqlə və Qoş'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Technical Documentation Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-400" />
              Azərbaycan Bankları üçün Open Banking İnteqrasiya Bələdçisi
            </h3>

            <div className="mt-4 space-y-4 text-xs text-slate-300">
              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-100 text-sm">
                  1. Azərbaycan Mərkəzi Bankı (CBAR) Open Banking Standartı
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Azərbaycan Mərkəzi Bankının Açıq Bankçılıq Strategiyasına əsasən, ölkə bankları (ABB, Kapital Bank, PAŞA Bank və s.)
                  AISP (Account Information Service Provider) protokolu üzrə REST API təqdim edirlər.
                  Tətbiqimiz modul abstraksiya qatı (`deduplicateBankTransactions`, `provider_transaction_id`) ilə qurulub.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-100 text-sm">
                  2. Demo Sandboksundan Real İstehsala (Production) Keçid
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Real istehsal rejimində bank inteqrasiyasını aktivləşdirmək üçün:
                </p>
                <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-300 space-y-1 border border-slate-800">
                  <div>1. CBAR Open Banking Portalında AISP lisenziyası və Client_ID əldə edin</div>
                  <div>2. .env faylında BANK_CLIENT_ID və BANK_CLIENT_SECRET təyin edin</div>
                  <div>3. server.ts faylında /api/banks/connect endpointini bank OAuth2 redirect URL-inə yönləndirin</div>
                </div>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-100 text-sm">
                  3. Dublikatların Qarşısının Alınması (Deduplication)
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Hər bir tranzaksiya bankın unikal `providerTransactionId` identifikatoru ilə yoxlanılır.
                  İstifadəçi nə qədər "Sinxronizasiya et" düyməsini sıxsa da, sistem eyni əməliyyatı ikinci dəfə
                  əlavə etmir və balansın təhrif olunmasına yol vermir (Test 8 sınaqdan keçirilmişdir).
                </p>
              </section>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800 mt-5">
              <button
                onClick={() => setShowDocsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
