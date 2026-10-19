import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building,
  Coins,
  Sparkles,
  Check,
} from 'lucide-react';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';
import { formatAZN } from '../utils/finance.ts';
import type { Transaction, TransactionType, Category, PaymentMethod } from '../types/finance.ts';

interface TransactionsTabProps {
  transactions: Transaction[];
  onAddTransaction: (tx: any) => Promise<void>;
  onUpdateTransaction: (id: string, updates: any) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onExportCsv: () => void;
  language: Language;
  getHeaders?: () => Record<string, string>;
}

const CATEGORY_NAMES_AZ: Record<string, string> = {
  salary: 'Əməkhaqqı',
  freelance: 'Frilans / Əlavə iş',
  gifts: 'Hədiyyələr',
  business: 'Biznes gəliri',
  allowance: 'Müavinət',
  investments: 'İnvestisiya',
  other_income: 'Digər gəlir',
  food: 'Qida və Ərzaq',
  transport: 'Nəqliyyat',
  education: 'Təhsil',
  rent: 'Kirayə və Mənzil',
  shopping: 'Geyim və Alış-veriş',
  entertainment: 'Əyləncə',
  subscriptions: 'Abunəliklər',
  utilities: 'Kommunal',
  health: 'Sağlamlıq',
  other_expense: 'Digər xərc',
};

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onExportCsv,
  language,
  getHeaders,
}) => {
  const t = (key: any) => getTranslation(key, language);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all'); // all, manual, imported

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // AI Quick Parse modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Form fields
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txCategory, setTxCategory] = useState<Category>('food');
  const [txDescription, setTxDescription] = useState('');
  const [txPaymentMethod, setTxPaymentMethod] = useState<PaymentMethod>('card');
  const [txNote, setTxNote] = useState('');
  const [txIsRecurring, setTxIsRecurring] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtered transactions
  const filtered = transactions.filter((tx) => {
    if (selectedType !== 'all' && tx.type !== selectedType) return false;
    if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
    if (selectedMethod !== 'all' && tx.paymentMethod !== selectedMethod) return false;
    if (selectedSource === 'manual' && tx.isImported) return false;
    if (selectedSource === 'imported' && !tx.isImported) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchNote = tx.note?.toLowerCase().includes(q);
      const catLabel = (CATEGORY_NAMES_AZ[tx.category] || tx.category).toLowerCase();
      const matchCat = catLabel.includes(q);
      if (!matchDesc && !matchNote && !matchCat) return false;
    }
    return true;
  });

  // Calculate filtered totals
  const totalIncome = filtered
    .filter((tx) => tx.type === 'income')
    .reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = filtered
    .filter((tx) => tx.type === 'expense')
    .reduce((s, tx) => s + tx.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  const handleOpenAdd = (type: TransactionType = 'expense') => {
    setEditingTx(null);
    setTxType(type);
    setTxAmount('');
    setTxDate(new Date().toISOString().slice(0, 10));
    setTxCategory(type === 'income' ? 'salary' : 'food');
    setTxDescription('');
    setTxPaymentMethod('card');
    setTxNote('');
    setTxIsRecurring(false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxAmount(tx.amount.toString());
    setTxDate(tx.date.slice(0, 10));
    setTxCategory(tx.category);
    setTxDescription(tx.description);
    setTxPaymentMethod(tx.paymentMethod);
    setTxNote(tx.note || '');
    setTxIsRecurring(Boolean(tx.isRecurring));
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(txAmount);
    if (!num || num <= 0) {
      setErrorMsg('Məbləğ 0-dan böyük olmalıdır.');
      return;
    }
    if (!txDescription.trim()) {
      setErrorMsg('Təsvir məcburidir.');
      return;
    }

    try {
      if (editingTx) {
        await onUpdateTransaction(editingTx.id, {
          type: txType,
          amount: num,
          date: txDate,
          category: txCategory,
          description: txDescription.trim(),
          paymentMethod: txPaymentMethod,
          note: txNote.trim(),
          isRecurring: txIsRecurring,
        });
      } else {
        await onAddTransaction({
          type: txType,
          amount: num,
          date: txDate,
          category: txCategory,
          description: txDescription.trim(),
          paymentMethod: txPaymentMethod,
          note: txNote.trim(),
          isRecurring: txIsRecurring,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Xəta baş verdi');
    }
  };

  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiText.trim() || isAiParsing) return;
    setIsAiParsing(true);
    setAiError(null);
    try {
      const headers = getHeaders ? getHeaders() : { 'Content-Type': 'application/json' };
      const res = await fetch('/api/ai/parse-transaction', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: aiText.trim() }),
      });
      if (!res.ok) throw new Error('AI mətni təhlil edə bilmədi.');
      const data = await res.json();
      const p = data.transaction;
      if (p) {
        setTxType(p.type || 'expense');
        setTxAmount(p.amount ? p.amount.toString() : '');
        setTxDate(p.date || new Date().toISOString().slice(0, 10));
        setTxCategory((p.category as Category) || (p.type === 'income' ? 'salary' : 'food'));
        setTxDescription(p.description || aiText.trim());
        setTxPaymentMethod((p.paymentMethod as PaymentMethod) || 'card');
        setTxNote(`AI ilə daxil edildi: "${aiText.slice(0, 60)}"`);
        setTxIsRecurring(false);
        setIsAiModalOpen(false);
        setEditingTx(null);
        setIsModalOpen(true);
      }
    } catch (err: any) {
      setAiError(err.message || 'Xəta baş verdi');
    } finally {
      setIsAiParsing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">{t('transactions')}</h2>
          <p className="text-xs text-slate-400">
            Bütün gəlir, xərc və bankdan avtomatik idxal olunan əməliyyatların idarə edilməsi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setAiText('');
              setAiError(null);
              setIsAiModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>AI ilə Sürətli Qeyd</span>
          </button>
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={() => handleOpenAdd('income')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Gəlir</span>
          </button>
          <button
            onClick={() => handleOpenAdd('expense')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Xərc</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Bütün növlər</option>
              <option value="income">Gəlirlər (+)</option>
              <option value="expense">Xərclər (-)</option>
            </select>

            {/* Source Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Bütün mənbələr</option>
              <option value="manual">Manual qeydiyyat</option>
              <option value="imported">Bankdan İdxal</option>
            </select>
          </div>
        </div>

        {/* Filtered stats summary bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>Tapılan: <strong className="text-slate-200">{filtered.length}</strong> əməliyyat</span>
          <div className="flex items-center gap-3 font-mono">
            <span>Gəlir: <strong className="text-emerald-400">+{formatAZN(totalIncome)}</strong></span>
            <span>Xərc: <strong className="text-rose-400">-{formatAZN(totalExpense)}</strong></span>
            <span>Xalis: <strong className={netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {netCashFlow >= 0 ? '+' : ''}{formatAZN(netCashFlow)}
            </strong></span>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Axtarışa uyğun heç bir əməliyyat tapılmadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tarix</th>
                  <th className="py-3 px-4">Təsvir & Kateqoriya</th>
                  <th className="py-3 px-4">Ödəniş / Mənbə</th>
                  <th className="py-3 px-4 text-right">Məbləğ</th>
                  <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((tx) => {
                  const isInc = tx.type === 'income';
                  const catLabel = CATEGORY_NAMES_AZ[tx.category] || tx.category;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {tx.date.slice(0, 10)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          <span>{tx.description}</span>
                          {tx.isRecurring && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              Təkrarlanan
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {catLabel}
                          </span>
                          {tx.note && <span className="italic truncate max-w-xs">{tx.note}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.isImported ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                            <Building className="w-3 h-3" />
                            {tx.bankName || 'Bank İdxal'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {tx.paymentMethod === 'cash' ? (
                              <Coins className="w-3 h-3 text-amber-400" />
                            ) : (
                              <CreditCard className="w-3 h-3 text-blue-400" />
                            )}
                            {tx.paymentMethod === 'cash'
                              ? 'Nağd'
                              : tx.paymentMethod === 'card'
                              ? 'Kart'
                              : 'Köçürmə'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-sm">
                        <span className={isInc ? 'text-emerald-400' : 'text-rose-400'}>
                          {isInc ? '+' : '-'}
                          {formatAZN(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            title="Kateqoriyanı dəyiş / Düzəliş et"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            title="Sil"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              {editingTx ? 'Əməliyyata Düzəliş et' : txType === 'income' ? '+ Gəlir Əlavə et' : '- Xərc Əlavə et'}
            </h3>

            {errorMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-800">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    txType === 'expense'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Xərc (-)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    txType === 'income'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Gəlir (+)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Məbləğ (AZN) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Təsvir *
                </label>
                <input
                  type="text"
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Məsələn: Supermarket, Maaş, Nahar..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kateqoriya
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  >
                    {txType === 'income' ? (
                      <>
                        <option value="salary">Əməkhaqqı</option>
                        <option value="freelance">Frilans / Əlavə iş</option>
                        <option value="gifts">Hədiyyələr</option>
                        <option value="business">Biznes gəliri</option>
                        <option value="allowance">Müavinət</option>
                        <option value="investments">İnvestisiya</option>
                        <option value="other_income">Digər gəlir</option>
                      </>
                    ) : (
                      <>
                        <option value="food">Qida və Ərzaq</option>
                        <option value="transport">Nəqliyyat</option>
                        <option value="education">Təhsil</option>
                        <option value="rent">Kirayə və Mənzil</option>
                        <option value="shopping">Geyim və Alış-veriş</option>
                        <option value="entertainment">Əyləncə</option>
                        <option value="subscriptions">Abunəliklər</option>
                        <option value="utilities">Kommunal</option>
                        <option value="health">Sağlamlıq</option>
                        <option value="other_expense">Digər xərc</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ödəniş Üsulu
                  </label>
                  <select
                    value={txPaymentMethod}
                    onChange={(e) => setTxPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  >
                    <option value="card">Bank kartı</option>
                    <option value="cash">Nağd</option>
                    <option value="bank_transfer">Bank köçürməsi</option>
                    <option value="other">Digər</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tarix *
                </label>
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Qeyd (İstəyə bağlı)
                </label>
                <input
                  type="text"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder="Əlavə məlumat..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tx_recurring"
                  checked={txIsRecurring}
                  onChange={(e) => setTxIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-700 border-slate-600"
                />
                <label htmlFor="tx_recurring" className="text-xs text-slate-300">
                  {t('recurring')} (Hər ay təkrarlanır)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
                >
                  Yadda saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Quick Add Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Süni İntellektlə Əməliyyat Qeydi</h3>
                  <p className="text-xs text-slate-400">
                    Azərbaycan dilində sərbəst cümlə yazın (Gemini avtomatik tanıyacaq)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {aiError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {aiError}
              </div>
            )}

            <form onSubmit={handleAiParse} className="space-y-4">
              <div>
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="məs: Dünən Bravo-da 45 manat kartla ərzaq aldım"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none"
                  autoFocus
                />
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1.5 font-medium">
                  Nümunə cümlələrə klikləyin:
                </span>
                <div className="space-y-1">
                  {[
                    'Dünən Bravo-da 38.50 AZN kartla bazarlıq etdim',
                    'Bolt taksiyə 5.20 AZN nağd verdim',
                    'Maaş kartıma 1400 AZN köçürüldü',
                    'Kommunal işıq pulu 28 AZN ödədim',
                  ].map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAiText(s)}
                      className="text-left w-full text-xs text-slate-300 hover:text-indigo-300 hover:bg-slate-800 p-2 rounded-lg border border-slate-800/80 transition-colors"
                    >
                      "{s}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={!aiText.trim() || isAiParsing}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white shadow-md transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAiParsing ? 'Təhlil edilir...' : 'Təhlil Et və Formaya Köçür'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
