import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IwFUsSJJXxmEI_ZZ_DHguVz4oz40j7xzavgebZNQKofw';

export const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface FinancialContext {
  fullName: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
  totalBalance: number;
  currency: string;
  categoryTotals: Record<string, number>;
  activeGoals: Array<{ name: string; target: number; saved: number; deadline: string }>;
  streak: number;
  question?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number = 4000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI request timeout')), ms)),
  ]);
}

/**
 * Generate personalized financial advice using Gemini AI with resilient retry & fallback
 */
export async function getAiFinancialAdvice(ctx: FinancialContext): Promise<{
  advice: string;
  isAiGenerated: boolean;
  insights: string[];
  suggestedActions: string[];
}> {
  const systemPrompt = `Sən "Qənaət" tətbiqinin peşəkar, mehriban və analitik Süni İntellekt Şəxsi Maliyyə Məsləhətçisisən (AI Financial Advisor).
Azərbaycan manatı (AZN) mühitində şəxsi büdcə idarəçiliyi, qənaət strategiyaları və xərclərin optimallaşdırılması üzrə ixtisaslaşmısan.

İstifadəçinin cari maliyyə vəziyyəti:
- Adı: ${ctx.fullName}
- Ümumi Balans: ${ctx.totalBalance.toFixed(2)} ${ctx.currency}
- Bu ayın ümumi gəliri: ${ctx.monthlyIncome.toFixed(2)} ${ctx.currency}
- Bu ayın ümumi xərci: ${ctx.monthlyExpenses.toFixed(2)} ${ctx.currency}
- Xalis fərq (Net Cash Flow): ${ctx.netCashFlow.toFixed(2)} ${ctx.currency}
- Qənaət və vərdiş ardıcıllığı (Streak): ${ctx.streak} gün
- Aktiv yığım hədəfləri: ${JSON.stringify(ctx.activeGoals)}
- Kateqoriyalar üzrə xərclər: ${JSON.stringify(ctx.categoryTotals)}

${
  ctx.question
    ? `İstifadəçi xüsusi olaraq bunu soruşur: "${ctx.question}"`
    : 'İstifadəçinin maliyyə vəziyyətinə ətraflı diaqnoz qoy, ən çox qənaət edə biləcəyi kateqoriyaları göstər və hədəflərinə çatmaq üçün konkret gündəlik/aylıq fəaliyyət planı təqdim et.'
}

Cavabı Azərbaycan dilində, səliqəli Markdown formatında (başlıqlar, maddələr, emoji) ver. Struktur:
1. 📊 Maliyyə Vəziyyətinin Təhlili
2. 💡 Ən Böyük Xərc Maddələri və Qənaət İmkanları
3. 🎯 Hədəflərə Doğru Konkret Addımlar (Gündəlik nə qədər yığmalı)
4. 🚀 Həvəsləndirici Nəticə`;

  // Attempt Gemini API call with supported models, prioritizing high-availability models
  const candidateModels = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  for (const model of candidateModels) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: systemPrompt,
          config: {
            temperature: 0.7,
          },
        }),
        4500
      );

      if (response.text && response.text.trim().length > 0) {
        return {
          advice: response.text.trim(),
          isAiGenerated: true,
          insights: extractKeyInsights(response.text.trim(), ctx),
          suggestedActions: extractSuggestedActions(ctx),
        };
      }
    } catch (_err) {
      // Continue to next high-availability model in fallback chain
    }
  }

  // Graceful rule-based intelligent financial engine fallback
  return generateRuleBasedAdvice(ctx);
}

/**
 * Natural language transaction parser using Gemini AI
 */
export async function parseTransactionWithAi(text: string): Promise<{
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  paymentMethod: 'card' | 'cash' | 'bank_transfer';
  date: string;
}> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const prompt = `Aşağıdakı mətndən maliyyə əməliyyatını çıxar və YALNIZ JSON obyekt kimi qaytar.
Mətn: "${text}"
Bugünkü tarix: ${todayStr}

Kateqoriyalar:
- food (ərzaq, restoran, kafe, yemək, market, Bravo, Bazarstore, Araz, Wolt, Bolt Food)
- transport (taksi, Bolt, Uber, metro, avtobus, yanacaq, benzin, SOCAR, parkinq)
- housing (kirayə, ev, təmir, mebel)
- utilities (kommunal, işıq, qaz, su, internet, telefon)
- shopping (geyim, ayaqqabı, texnika, alış-veriş, Trendyol)
- entertainment (kino, teatr, konsert, oyun, əyləncə)
- health (aptek, həkim, klinika, dərman)
- salary (maaş, əmək haqqı, avans)
- freelance (əlavə qazanc, qonorar)
- investment (investisiya, faiz)
- other (digər)

JSON nümunəsi:
{
  "type": "expense",
  "amount": 25.50,
  "category": "food",
  "description": "Bravo Market alış-verişi",
  "paymentMethod": "card",
  "date": "${todayStr}"
}`;

  const candidateModels = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  for (const model of candidateModels) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
        4000
      );

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.amount && !isNaN(Number(parsed.amount))) {
          return {
            type: parsed.type === 'income' ? 'income' : 'expense',
            amount: Math.abs(Number(parsed.amount)),
            category: parsed.category || 'other',
            description: parsed.description || text.slice(0, 50),
            paymentMethod: ['card', 'cash', 'bank_transfer'].includes(parsed.paymentMethod)
              ? parsed.paymentMethod
              : 'card',
            date: parsed.date || todayStr,
          };
        }
      }
    } catch (_err) {
      // Continue to next high-availability model in fallback chain
    }
  }

  // Fallback heuristic parser in Azerbaijani
  return fallbackHeuristicParser(text, todayStr);
}

/**
 * Intelligent financial diagnosis when upstream network API experiences temporary spike
 */
function generateRuleBasedAdvice(ctx: FinancialContext): {
  advice: string;
  isAiGenerated: boolean;
  insights: string[];
  suggestedActions: string[];
} {
  const isSurplus = ctx.netCashFlow >= 0;
  const savingsRate = ctx.monthlyIncome > 0
    ? Math.max(0, Math.round((ctx.netCashFlow / ctx.monthlyIncome) * 100))
    : 0;

  // Find top expense category
  const sortedCategories = Object.entries(ctx.categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCat = sortedCategories[0];
  const topCatName = topCat ? topCat[0] : 'food';
  const topCatAmount = topCat ? topCat[1] : 0;

  const catLabels: Record<string, string> = {
    food: 'Ərzaq və Yemək',
    transport: 'Nəqliyyat və Taksi',
    housing: 'Mənzil və Kirayə',
    utilities: 'Kommunal və Rabitə',
    shopping: 'Geyim və Alış-veriş',
    entertainment: 'İstirahət və Əyləncə',
    health: 'Sağlamlıq və Aptek',
  };

  const adviceMd = `### 📊 Maliyyə Vəziyyətinin Təhlili
Hörmətli **${ctx.fullName}**, sizin cari aylıq balansınız **${ctx.totalBalance.toFixed(2)} ${ctx.currency}** təşkil edir.
Bu ay ərzində ümumi gəliriniz **${ctx.monthlyIncome.toFixed(2)} ${ctx.currency}**, ümumi xərcləriniz isə **${ctx.monthlyExpenses.toFixed(2)} ${ctx.currency}** olub.
Xalis aylıq nəticəniz: **${ctx.netCashFlow >= 0 ? '+' : ''}${ctx.netCashFlow.toFixed(2)} ${ctx.currency}** (Qənaət dərəcəsi: ~%${savingsRate}).

---

### 💡 Ən Böyük Xərc Maddələri və Qənaət İmkanları
* **Əsas xərc sahəniz**: Bu ay ən böyük xərciniz **${catLabels[topCatName] || topCatName}** kateqoriyasındadır (**${topCatAmount.toFixed(2)} ${ctx.currency}**).
* **Tövsiyə olunan optimizasiya**: Bu kateqoriyada gündəlik kiçik xərcləri (məsələn, spontan sifarişlər və ya tez-tez taksi istifadəsi) 15-20% azaltsanız, ayın sonuna qədər əlavə **${(topCatAmount * 0.15).toFixed(2)} ${ctx.currency}** sərbəst vəsait əldə edə bilərsiniz.
${!isSurplus ? '⚠️ **Diqqət**: Aylıq xərcləriniz gəlirinizi üstələyir. Qeyri-zəruri alış-verişləri 7 gün müddətinə dayandırmaq büdcənizi tarazlaşdıracaq.' : '✅ **Müsbət tendensiya**: Büdcəniz müsbət saldoya malikdir. Yaranmış sərbəst qalıq aktiv yığım hədəfləriniz üçün əla mənbədir.'}

---

### 🎯 Hədəflərə Doğru Konkret Addımlar
${
  ctx.activeGoals.length > 0
    ? ctx.activeGoals
        .map((g) => {
          const rem = Math.max(0, g.target - g.saved);
          const dailyTarget = rem > 0 ? (rem / 30).toFixed(2) : '0';
          return `* **${g.name}**: Hədəf: ${g.target} ${ctx.currency} (Yığılıb: ${g.saved} ${ctx.currency}). Vaxtında çatmaq üçün gündəlik təxminən **${dailyTarget} ${ctx.currency}** ayırmaq tövsiyə edilir.`;
        })
        .join('\n')
    : '* Hazırda aktiv yığım hədəfiniz yoxdur. "Yığım Hədəfləri" bölməsindən Təcili Fond və ya Şəxsi Plan üçün yeni hədəf yaradın.'
}

---

### 🚀 Həvəsləndirici Nəticə
Sizin cari vərdiş zənciriniz (streak): **${ctx.streak} gün**! Maliyyə intizamınızı qoruyun, hər gün əməliyyatlarınızı daxil edin və gələcəyiniz üçün yığıma sadiq qalın.`;

  return {
    advice: adviceMd,
    isAiGenerated: false,
    insights: [
      `Bu ay ən böyük xərciniz: ${catLabels[topCatName] || topCatName} (${topCatAmount.toFixed(2)} ${ctx.currency})`,
      `Aylıq qənaət dərəcəniz: %${savingsRate}`,
      ctx.netCashFlow >= 0 ? 'Büdcəniz balanslıdır və müsbət qalıqla davam edir.' : 'Xərclər gəliri üstələyir, qənaət rejimi tövsiyə olunur.',
    ],
    suggestedActions: [
      `Gündəlik xərcləri qeyd etməklə ${ctx.streak + 1}-ci gün vərdiş zəncirini tamamlayın`,
      `${catLabels[topCatName] || topCatName} xərclərini 15% azaldaraq büdcəyə qənaət edin`,
      'Aktiv yığım hədəflərinizə bu gün kiçik məbləğ köçürün',
    ],
  };
}

function extractKeyInsights(text: string, ctx: FinancialContext): string[] {
  return [
    `Büdcə saldosu: ${ctx.netCashFlow >= 0 ? '+' : ''}${ctx.netCashFlow.toFixed(2)} ${ctx.currency}`,
    `Cari vərdiş zənciri: ${ctx.streak} gün`,
    `Aktiv yığım hədəfləri: ${ctx.activeGoals.length} ədəd`,
  ];
}

function extractSuggestedActions(ctx: FinancialContext): string[] {
  return [
    'Qənaət vərdişinizi davam etdirmək üçün bu gün əməliyyatlarınızı qeyd edin',
    'Aktiv hədəflərinizə gündəlik tövsiyə olunan yığımı köçürün',
    'Gereksiz abunəlikləri və spontan xərcləri nəzərdən keçirin',
  ];
}

function fallbackHeuristicParser(text: string, todayStr: string) {
  const lower = text.toLowerCase();

  // Extract amount
  const matchNum = text.match(/(\d+(?:[.,]\d{1,2})?)/);
  const amount = matchNum ? parseFloat(matchNum[1].replace(',', '.')) : 10.0;

  // Determine type
  const isIncome =
    lower.includes('maaş') ||
    lower.includes('avans') ||
    lower.includes('gəlir') ||
    lower.includes('qazanc') ||
    lower.includes('salary') ||
    lower.includes('income');

  // Determine category
  let category = 'other';
  if (lower.includes('bravo') || lower.includes('bazarstore') || lower.includes('araz') || lower.includes('market') || lower.includes('yemək') || lower.includes('restoran') || lower.includes('wolt') || lower.includes('kafe')) {
    category = 'food';
  } else if (lower.includes('bolt') || lower.includes('uber') || lower.includes('taksi') || lower.includes('yanacaq') || lower.includes('socar') || lower.includes('metro') || lower.includes('benzin')) {
    category = 'transport';
  } else if (lower.includes('kommunal') || lower.includes('işıq') || lower.includes('qaz') || lower.includes('su') || lower.includes('internet') || lower.includes('azercell') || lower.includes('bakcell')) {
    category = 'utilities';
  } else if (lower.includes('geyim') || lower.includes('paltar') || lower.includes('trendyol') || lower.includes('mall') || lower.includes('shopping')) {
    category = 'shopping';
  } else if (lower.includes('aptek') || lower.includes('həkim') || lower.includes('dərman') || lower.includes('klinika')) {
    category = 'health';
  } else if (isIncome) {
    category = 'salary';
  }

  // Payment method
  const paymentMethod: 'card' | 'cash' | 'bank_transfer' =
    lower.includes('nağd') || lower.includes('cash')
      ? 'cash'
      : lower.includes('köçürmə') || lower.includes('transfer')
      ? 'bank_transfer'
      : 'card';

  return {
    type: isIncome ? ('income' as const) : ('expense' as const),
    amount,
    category,
    description: text.slice(0, 50).trim() || 'Əməliyyat',
    paymentMethod,
    date: todayStr,
  };
}
