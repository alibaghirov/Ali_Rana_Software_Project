# ADA University
## School of Information Technologies and Engineering
### CSCI 3509: Intro to Software Engineering — Fall 2026

---

# Project Proposal

# **Qənaət: Smart Personal Finance & Intelligent Savings Platform**

**Project team:** Qənaət Core Engineering Team  
**Instructor:** Kamila Ismayilova  

*Submitted in partial fulfillment of the requirements of the CSCI 3509: Intro to Software Engineering course project*

---

### Team Members & Contributions

| Team Member | Contribution to the homework / project |
| :--- | :--- |
| **Ali Baghirov** | System architecture, full-stack development, database schema design, Open Banking mock integration, OTP authentication flow, smart daily savings algorithm, and financial comparative reporting engine. |
| **\<Student Name 2\>** | Requirements elicitation, frontend UI/UX design with Tailwind CSS, Telegram monitoring & alerting bot integration, and QA test plan documentation. |

---

## 1. Project Overview

### What is the project?
**Qənaət** is an intelligent personal finance and smart savings management platform tailored for individuals and young professionals in Azerbaijan. The platform tackles financial vulnerability, lack of disciplined saving habits, and opaque transaction tracking by providing automated transaction logging, dynamic daily savings calculations, and bank integration (supporting local institutions such as ABB, Kapital Bank, Pasha Bank, and Leobank). By transforming lump-sum financial targets into attainable daily habits and using AI-powered financial advisory, Qənaət empowers users to achieve true financial discipline and avoid month-end deficits.

### Who are the users?
1. **Young Professionals and Students:** Need intuitive, friction-free tracking of daily living expenses, income, and peer-to-peer transfers with local AZN currency formatting and Azerbaijani language support.
2. **Goal-Oriented Savers:** Users striving to accumulate funds for significant purchases (e.g., laptop, vacation, vehicle, emergency fund) who require dynamic daily contribution recommendations, visual progress milestones, and behavioral smart-locking to prevent impulsive withdrawals.
3. **Active Multi-Bank Account Holders:** Users with accounts across multiple Azerbaijani banks who need a unified financial dashboard that automatically deduplicates transactions and consolidates net cash flow.

### Main Features (One Sentence Each)
1. **5-Question Financial Dashboard:** Instantly answers the five critical daily financial questions regarding total net worth, free unallocated cash, current month earnings, expenses, and savings trajectory.
2. **Dynamic Daily Savings Engine:** Computes an adaptive, daily saving quota for active goals based on remaining targets, deadlines, and past contributions, preventing last-minute savings failure.
3. **Behavioral Emergency Smart-Lock:** Protects earmarked savings funds by enforcing configurable cooling-off periods and friction modals before withdrawals can be processed.
4. **Open Banking Aggregator & Deduplication:** Connects local bank feeds via simulated API protocols, automatically categorizing card transactions and filtering duplicate records.
5. **AI Financial Advisor & Smart Categorization (AI):** Employs generative AI to analyze historical spending patterns, deliver personalized daily budgeting tips, and classify ambiguous transaction narratives.
6. **Habit Streak & Milestone Gamification:** Rewards consistent daily financial reviews and goal contributions with streak counters, level upgrades, and milestone achievement medals.
7. **Monthly Comparative Analytics & CSV Export:** Generates month-over-month performance analytics, expense category breakdowns, and downloadable accounting reports.

---

## 2. Tech Stack

### Architecture Rules Compliance
- **Frontend and Backend:** Built with a decoupled frontend (React + TypeScript SPA) communicating with an Express.js REST API backend over well-defined REST endpoints.
- **Database:** Relational schema store with strict typing and relational constraints (transactions, goals, contributions, user accounts, and streaks) ensuring atomic state persistence and transaction deduplication.
- **User Interface:** Modern, polished, high-contrast dark fintech UI built with Tailwind CSS, Lucide icons, responsive grid systems, and intuitive micro-interactions.
- **AI Integration:** Integrated with Google Gemini API (`@google/genai` model family) to analyze spending patterns, provide contextual savings recommendations, and parse unstructured transaction descriptions.
- **Monitoring & Alerting:** Automated server-side health watcher and anomaly observer that triggers real-time markdown notifications to the engineering team's Telegram channel via the official Telegram Bot API (using free tier infrastructure).

### Technology Selection Table

| Layer | Technology | Why we chose it |
| :--- | :--- | :--- |
| **Frontend (UI)** | React (v19), TypeScript, Tailwind CSS, Lucide Icons | Provides a highly responsive, component-driven UI with type safety; Tailwind allows rapid styling of a modern dark-mode fintech interface without CSS overhead. |
| **Backend** | Node.js, Express.js, TypeScript | Enables a robust, lightweight asynchronous REST API sharing domain TypeScript interfaces between client and server, optimizing developer velocity. |
| **Database** | PostgreSQL (Relational schema / Drizzle ORM structure) | Financial balances, double-entry style transactions, and goals require ACID compliance, strong referential integrity, and relational integrity. |
| **AI service / model** | Google Gemini 2.5 Flash (`@google/genai` SDK) | Offers ultra-fast inference latency, rich multilingual Azerbaijani & English financial reasoning, and structured JSON outputs at cost-effective rates. |
| **Monitoring & alerting** | Node.js Error Watcher & Telegram Bot API | Completely free, highly accessible monitoring solution that delivers instant push notifications with stack traces directly to team members' mobile devices. |
| **Other tools** | Git, GitHub, Vite, Postman, Figma | Industry standard version control, sub-second HMR bundler, automated API verification suites, and collaborative UI component wireframing. |

---

## 3. Functional Requirements

All requirements follow the `"The system shall ..."` format and are prioritized using the **MoSCoW** convention (**Must**, **Should**, **Could**).

| ID | Requirement | Priority |
| :--- | :--- | :--- |
| **FR-01** | The system shall allow users to register and log in securely using their mobile number, FİN code, or email with one-time SMS verification password (OTP). | **Must** |
| **FR-02** | The system shall record, update, filter, and delete income and expense transactions in Azerbaijani Manat (AZN) with amount, date, category, and payment method. | **Must** |
| **FR-03** | The system shall compute and present real-time totals for total account balance, earmarked savings, and unallocated liquid cash. | **Must** |
| **FR-04** | The system shall let users establish target savings goals with a target amount, deadline date, priority, and calculate a dynamic daily savings quota. | **Must** |
| **FR-05** | The system shall allow users to deposit funds into or withdraw funds from specific savings goals, recording individual contribution histories. | **Must** |
| **FR-06 (AI)** | The system shall analyze the user's monthly income and expense history using Google Gemini AI to generate personalized daily financial advice and budget warnings. | **Must** |
| **FR-07 (AI)** | The system shall automatically predict and classify ambiguous transaction vendor descriptions (e.g., raw merchant receipts) into standardized financial categories using an LLM classifier. | **Should** |
| **FR-08** | The system shall support connecting multiple mock bank accounts (e.g., Kapital Bank, ABB, Pasha Bank, Leobank) and synchronize transactions without duplicate entries. | **Should** |
| **FR-09** | The system shall track continuous daily financial tracking streaks, awarding XP points, user levels, and milestone achievement medals (10, 20, 30, 40, and 100 days). | **Should** |
| **FR-10** | The system shall enforce a configurable smart cooling-off delay on locked goals when an early withdrawal is requested to prevent impulse spending. | **Should** |
| **FR-11** | The system shall render month-over-month comparative analysis of income, expenses, and net cash flow with expense category percentage breakdowns. | **Should** |
| **FR-12** | The system shall allow users to export the complete transaction ledger in standardized CSV format with UTF-8 encoding. | **Could** |
| **FR-13 (AI)** | The system shall allow users to query their financial balance and upcoming targets via natural language voice or text commands (e.g., "Bu həftə nə qədər xərclədim?"). | **Could** |

---

## 4. Monitoring and Alerting

### System Monitoring Strategy
The Qənaət production environment incorporates an autonomous background health and anomaly monitor. It inspects operational metrics, server availability, database read/write latencies, authentication failures, and third-party integration statuses.

### How it Works:
1. **Event Capture:** An Express middleware intercepts application exceptions, failed HTTP requests, database latency thresholds, and API connection failures.
2. **Detection Rules:** A lightweight rules engine evaluates metrics against predefined thresholds (e.g., error frequencies, response time degradation, authentication bursts).
3. **Alert Dispatch:** Once a threshold is breached, the alerting daemon formats an actionable Markdown message and transmits it to the team's designated Telegram channel via the Telegram Bot API (`https://api.telegram.org/bot<TOKEN>/sendMessage`).

### Security of Bot Credentials:
- The `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are stored strictly as environment variables (`.env`) on the host server.
- The `.env` file is excluded from version control via `.gitignore`.
- Dummy placeholders are provided in `.env.example`, preventing any accidental credential leaks to public repositories.

### Monitoring & Alerting Matrix

| What we monitor | When it triggers an alert | Alert message |
| :--- | :--- | :--- |
| **Backend Health Check** | Health endpoint (`/api/health`) fails to return HTTP 200 for 3 consecutive checks (30s intervals). | `🚨 [ALERT] Backend is DOWN! Health check failed 3 times in a row on instance eu-west-2.` |
| **Brute-Force & OTP Failures** | More than 5 failed OTP or login attempts on a single phone/FIN within 3 minutes. | `⚠️ [ALERT] Security: 5 failed authentication attempts detected for account +994-50-***-45-67 within 3 mins.` |
| **Database Latency & Disk I/O** | Database read/write queries exceed 2,000 ms or disk write fails. | `⚠️ [WARNING] Database latency spike: read/write duration reached 2.45s (threshold: 2.0s).` |
| **Bank Sync API Failures** | Open banking sync endpoint fails for 3 consecutive user requests or encounters 5xx error. | `⚠️ [WARNING] BankIntegrationService: Open Banking connection failure with provider 'kapital_open_api' (HTTP 502).` |
| **AI Service Downtime / Rate Limit** | Gemini API returns HTTP 429 (Rate Limit Exceeded) or 503 for more than 10% of recommendation requests. | `⚠️ [WARNING] AIService: Gemini API rate limit or outage detected (12% failed calls in last 5 min).` |
| **High Server Response Time** | Average 95th percentile REST API response latency exceeds 3.5 seconds over a 5-minute window. | `📈 [WARNING] High API Latency: p95 response time is 3.8s across all client requests.` |
