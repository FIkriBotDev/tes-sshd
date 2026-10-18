# Flowchart Alur Kerja Aplikasi TemanDuit AI

Dokumen ini menjelaskan alur kerja (workflow) aplikasi **TemanDuit** — asisten keuangan pribadi berbasis AI dengan tiga pintu masuk: **Telegram Bot**, **Web Dashboard (Next.js)**, dan **Scheduler Cron**, yang semuanya terhubung ke satu backend Express dan satu file JSON sebagai database.

---

## 1. Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Node.js + TypeScript, Express 4, JWT, Zod, node-cron, Telegraf, winston |
| Database | File JSON (`database/database.json`) via `DatabaseManager` (in-memory cache + write queue) |
| AI | Pollinations AI (`https://gen.pollinations.ai/v1/chat/completions`, model `openai`) |
| Frontend | Next.js 14 (App Router), React 18, Tailwind + shadcn/ui, recharts, zustand, axios |
| Bot | Telegraf (polling atau webhook) |

---

## 2. Arsitektur Sistem

```mermaid
flowchart LR
    subgraph Entry
        TG[Telegram User]
        WEB[Web User]
    end

    subgraph Frontend
        BOT[Telegram Bot<br/>Telegraf]
        UI[Next.js Dashboard<br/>:3000]
    end

    subgraph Backend
        API[Express Backend :3001<br/>Routes / Controllers]
        ENG[Engines &amp; Services<br/>Expense / Income / Budget / Debt<br/>Reminder / Saving / Analytics / Notification / AI / Context / Search]
        CRON[SchedulerService<br/>node-cron]
    end

    AI[(Pollinations AI<br/>HTTPS)]
    DB[("database/database.json<br/>13 koleksi JSON")]

    TG --> BOT
    WEB -- axios + JWT --> UI
    BOT -- text / command --> API
    UI -- REST /api --> API
    API --> ENG
    ENG --> AI
    ENG --> DB
    CRON --> ENG
    ENG -- notifikasi --> BOT
    BOT -- DM notifikasi --> TG
```

**Aliran data inti:** semua input (Telegram maupun web) masuk ke Express API → diproses oleh Engines/Services → menyimpan/membaca `database.json` → untuk fitur AI, konteks pengguna dikirim ke Pollinations AI.

---

## 3. Pipeline Request Backend

```mermaid
flowchart TD
    REQ[Request masuk] --> HL[helmet]
    HL --> CORS[CORS<br/>allow frontend + credentials]
    CORS --> RL[Rate Limit<br/>200 req / 15 menit]
    RL --> JSON[express.json 10kb]
    JSON --> WH{Webhook<br/>Telegram dikonfigurasi?}
    WH -- ya --> HWM[Webhook middleware → bot.handleUpdate]
    WH -- tidak --> ROUTE
    HWM --> ROUTE[Router /api]
    ROUTE --> AUTH{Butuh auth?}
    AUTH -- ya --> JWT[authenticate → verifikasi JWT → req.userId]
    AUTH -- tidak --> HANDLER
    JWT --> HANDLER[Controller → Engine → DatabaseManager]
    HANDLER -- 401 --> ERR[errorHandler]
    HANDLER -- ok --> RESP[Response JSON]
```

---

## 4. Autentikasi & Registrasi

Tidak ada password. Login menggunakan **kode 8 karakter** yang dikirim bot Telegram.

```mermaid
flowchart TD
    Start([Pengguna baru]) --> StartCmd["Bot: /start"]
    StartCmd --> CekUser{User sudah ada<br/>di database?}
    CekUser -- ya --> Greet[Greeting + menu fitur]
    CekUser -- tidak --> BuatToken[Buat registration token<br/>uuid, masa aktif 24 jam]
    BuatToken --> Link["Balas: /register?token=..."]
    Link --> Form[Frontend /register<br/>isi: nama, usia, zona waktu,<br/>pekerjaan, sumber penghasilan, tujuan]
    Form --> Valid{"GET /auth/validate-token/:token"}
    Valid -- invalid/expired --> ErrToken[Error / token tidak valid]
    Valid -- valid --> Submit[Submit form]
    Submit --> Reg["POST /auth/register"]
    Reg --> CreateUser[Simpan user<br/>balance 0, savingBalance 0]
    CreateUser --> Seed[Seed 15 kategori default]
    Seed --> GenCode[Buat kode login 8 karakter]
    GenCode --> JWT[Generate JWT 7 hari]
    JWT --> KirimKode[Bot DM kode login ke pengguna]
    JWT --> Dashboard[(Simpan token di localStorage<br/>→ /dashboard)]
```

```mermaid
flowchart TD
    Login([Pengguna lama]) --> Page[Frontend /activeUserLogin]
    Page --> Kode[Input kode 8 karakter]
    Kode --> API["POST /auth/login-code"]
    API --> Cek{Kode valid<br/>dan aktif?}
    Cek -- ya --> Tok[Return JWT 7 hari]
    Cek -- tidak --> Salah[Kode salah / tidak valid]
    Tok --> Dash[→ /dashboard]
    Tok --> Note["Catatan: kode aktif<br/>terus sampai digenerate ulang<br/>(bot /akundashboard)"]
```

---

## 5. Alur Input Transaksi via Bot Telegram (jalur AI utama)

```mermaid
flowchart TD
    Msg[Pengguna kirim pesan bebas<br/>mis. "makan siang 50rb"] --> Auth{requireAuth?}
    Auth -- belum login --> Hint[Suruh /start atau login]
    Auth -- sudah login --> Parse["AIEngine.parseUserMessage<br/>→ Pollinations AI → JSON action"]
    Parse --> Retry{JSON valid?<br/>(maks 2 retry)}
    Retry -- tidak --> Fallback["Fallback: action = question"]
    Retry -- ya --> Switch{action}

    Switch -- expense --> Exp["recordExpense<br/>+ update balance &amp; category<br/>+ update budget spent"]
    Exp --> Notif1["notifLargeExpense<br/>+ checkBudgetWarnings"]
    Notif1 --> Reply1[Balasan format transaksi + sisa budget]

    Switch -- income --> Inc["recordIncome<br/>+ update balance"]
    Inc --> Reply2[Balasan konfirmasi pemasukan]

    Switch -- debt / receivable<br/>/ installment --> Debt["createDebt"]
    Debt --> Reply3[Balasan konfirmasi hutang/piutang]

    Switch -- saving --> Sav["recordSaving<br/>+ update goal &amp; savingBalance"]
    Sav --> Reply4[Balasan konfirmasi tabungan]

    Switch -- reminder --> Rem["createReminder"]
    Rem --> Reply5[Balasan konfirmasi reminder]

    Switch -- question --> Ans["answerQuestion<br/>dengan konteks keuangan"]
    Ans --> Reply6[Jawaban AI]

    Switch -- unknown --> Help[Pesan bantuan]
```

### Perintah Bot

| Perintah | Fungsi |
|---|---|
| `/start` | Registrasi / greeting |
| `/saldo` | Saldo & tabungan |
| `/ringkasan` | Ringkasan keuangan bulan berjalan |
| `/hutang` | Daftar hutang aktif |
| `/reminder` | Pengingat 30 hari ke depan |
| `/insight` | Insight AI |
| `/tabung [nominal] [ket]` | Catat tabungan cepat |
| `/akundashboard` | Generate ulang kode login web |
| `/bantuan` | Daftar bantuan |

---

## 6. Alur Web Dashboard

```mermaid
flowchart TD
    Login[Login via kode / register] --> Guard[useRequireAuth]
    Guard -- no token --> LoginP[/login]
    Guard -- token ada --> App[AppLayout: Sidebar + Header]
    App --> Poll[Poll jumlah notifikasi tiap 30 detik]
    App --> Search{"Global search (≥ 2 huruf)<br/>→ GET /search"}
    App --> Nav{Pilih menu}

    Nav -- Dashboard --> Dash["GET /dashboard<br/>user + summary + 5 transaksi<br/>+ budget + 5 notifikasi<br/>+ reminder 7 hari + goal<br/>+ top 5 kategori + tren 6 bulan"]
    Nav -- Transaksi --> Tx["GET /transactions (paginated)<br/>CRUD expense"]
    Nav -- Pemasukan --> Inc["GET /transactions<br/>CRUD income"]
    Nav -- Budget --> Bud["GET /budgets<br/>CRUD budget + progress + rollover"]
    Nav -- Hutang --> Debt["GET /debts + /summary<br/>create + recordPayment"]
    Nav -- Reminder --> Rem["GET /reminders + /upcoming<br/>CRUD + toggle aktif"]
    Nav -- Tabungan --> Sav["GET /savings/goals + /summary<br/>create goal + deposit/withdraw"]
    Nav -- Analitik --> Ana["GET /analytics<br/>summary, trends, daily, categories"]
    Nav -- AI Insight --> AIP["GET/POST /ai/insights<br/>POST /ai/ask, /ai/insights/generate<br/>GET /ai/budget-advisor, /ai/forecast"]
    Nav -- Notifikasi --> Not["GET /notifications<br/>mark read / read-all / delete"]
    Nav -- Pengaturan --> Set["Kategori custom CRUD, theme, logout"]
    Nav -- Profil --> Prof["PUT /auth/profile + ringkasan keuangan"]

    Ana --> Charts[Recharts:<br/>CashFlow, Pie, Trend, DailyBar, Heatmap]
```

---

## 7. Alur Fitur AI (Insight, Tanya, Advisor, Forecast)

```mermaid
flowchart TD
    Trigger{Pemicu} --> Ctx

    Trigger -- Bot /insight --> Ctx
    Trigger -- Web: POST /ai/insights/generate --> Ctx
    Trigger -- Web: POST /ai/ask --> Ctx
    Trigger -- Web: GET /ai/budget-advisor --> Ctx
    Trigger -- Web: GET /ai/forecast --> Ctx

    Ctx["ContextService.buildAIContext(userId)<br/>user + summary + transaksi terbaru<br/>+ budget + hutang + goal + reminder"]
    Ctx --> Call["AIEngine → Pollinations AI<br/>(model openai, timeout 30s)"]
    Call --> Mode{Mode}

    Mode -- generateInsight --> I1["{title, content, recommendations[]}<br/>→ simpan ke aiInsights"]
    Mode -- answerQuestion --> I2[Jawaban bebas]
    Mode -- budgetAdvisor --> I3[Rekomendasi 50/30/20]
    Mode -- forecast --> I4[Proyeksi keuangan]
    I1 --> Out([Respons ke user])
    I2 --> Out
    I3 --> Out
    I4 --> Out
```

---

## 8. Scheduler (Cron Jobs)

```mermaid
flowchart TD
    Sched[SchedulerService.start] --> C1["* * * * * — setiap menit<br/>processReminders()"]
    Sched --> C2["0 * * * * — tiap jam<br/>debtEngine.checkOverdue()"]
    Sched --> C3["0 */6 * * * — tiap 6 jam<br/>checkAllUserBudgets()"]

    C1 --> Rem{Reminder due?}
    Rem -- ya --> N1["Buat notifikasi reminder_due<br/>+ kirim Telegram<br/>+ markTriggered (nextTrigger++)"]
    Rem -- tidak --> Skip1[Lewat]

    C2 --> OD{Hutang overdue?}
    OD -- ya --> N2[Update status OVERDUE + notifikasi]
    OD -- tidak --> Skip2[Lewat]

    C3 --> Bud{Budget warning / exceeded?}
    Bud -- ya --> N3["Buat notifikasi budget_warning /<br/>budget_exceeded + kirim Telegram"]
    Bud -- tidak --> Skip3[Lewat]
```

---

## 9. Alur Lengkap End-to-End (Ringkasan)

```mermaid
flowchart TD
    subgraph Sumber
        T[Input Telegram]
        W[Input Web]
        C[Cron Scheduler]
    end

    T --> AI[AI Engine: parse intent]
    W --> CTRL[Controller langsung]
    C --> ENG[Engine terjadwal]

    AI --> ENG
    CTRL --> ENG

    ENG --> DB[(database.json)]
    ENG --> N[NotificationEngine]
    N --> DB
    N --> TG[Telegram DM]
    N --> WEBN[Notifikasi di dashboard]

    ENG -. fitur AI .-> PAI[(Pollinations AI)]

    subgraph Output
        R[Respons / reply]
        D[Dashboard / Chart / Report]
    end

    AI --> R
    CTRL --> D
    N --> R
```

**Alur transaksi (bot):** teks → AI parse (JSON action) → engine menyimpan transaksi + update saldo/kategori/budget → notifikasi → balasan Telegram.

**Alur transaksi (web):** form halaman → axios + JWT → controller → engine → database JSON → respons → refresh UI.

**Alur dashboard:** `/dashboard` meng-aggregate banyak engine dalam satu payload → widget & chart.

**Alur laporan:** `/analytics` → `AnalyticsEngine` menghitung summary/trends/daily/category → ditampilkan recharts.

**Alur AI:** request → `ContextService` snapshot data pengguna → `AIEngine` → Pollinations → insight/jawaban (disimpan atau direturn).

---

## 10. Model Data (13 Koleksi)

```mermaid
erDiagram
    users ||--o{ transactions : punya
    users ||--o{ categories : punya
    users ||--o{ budgets : punya
    users ||--o{ debts : punya
    users ||--o{ reminders : punya
    users ||--o{ savingGoals : punya
    users ||--o{ notifications : punya
    users ||--o{ aiInsights : punya
    debts ||--o{ debtPayments : memiliki
    savingGoals ||--o{ savingTransactions : memiliki
    categories ||--o{ transactions : mengelompokkan
    categories ||--o{ budgets : membatasi

    users { string id PK "telegramId, balance, savingBalance" }
    transactions { string id PK "type, amount, date, aiParsed" }
    categories { string id PK "isDefault" }
    budgets { string id PK "amount, spent, month, year, rollover" }
    debts { string id PK "type, remainingAmount, status" }
    debtPayments { string id PK "amount, paidAt" }
    reminders { string id PK "frequency, nextTrigger, isActive" }
    savingGoals { string id PK "targetAmount, currentAmount" }
    savingTransactions { string id PK "deposit/withdrawal" }
    notifications { string id PK "type, isRead" }
    aiInsights { string id PK "recommendations" }
    registrationTokens { string token PK "24h expiry" }
    loginCodes { string code PK "8 char, reusable" }
```

---

## 11. Catatan Penting

- **Database = 1 file JSON** (`database/database.json`) — tanpa SQL/migrasi; ditulis atomik (temp file + rename) dengan antrian write.
- **Tidak ada password** — login web memakai kode 8 karakter dari bot Telegram; kode aktif terus sampai digenerate ulang.
- Endpoint AI **hardcoded** ke `https://gen.pollinations.ai` di `AIEngine.ts` (tidak memakai `POLLINATIONS_BASE_URL` dari config).
- Seeder membuat **15 kategori default** (`cat-makanan` … `cat-lainnya`) saat registrasi.
- JWT berlaku **7 hari**; rate limit **200 request / 15 menit** pada `/api`.
- `database/hapus_database/index.js` adalah utilitas cleanup manual (bukan bagian runtime aplikasi).
