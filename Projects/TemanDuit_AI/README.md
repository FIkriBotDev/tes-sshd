# 💰 TemanDuit - AI Personal Finance Assistant

**Asisten keuangan pribadi berbasis AI** dengan Telegram Bot dan Web Dashboard yang modern, powerful, dan mudah digunakan.

## ✨ Features

### 🤖 AI-Powered
- **Natural Language Processing** - Catat pengeluaran dengan bahasa sehari-hari: "beli bakso 15 ribu"
- **AI Financial Advisor** - Insight, rekomendasi, dan forecast berbasis kondisi keuangan Anda
- **Smart Question Answering** - Tanya AI tentang kondisi keuangan: "bulan ini aku boros gak?"
- **Budget Advisor** - Saran budget optimal menggunakan AI

### 💸 Financial Management
- **Expense Tracking** - Catat pengeluaran dengan AI parsing atau manual
- **Income Management** - Kelola berbagai sumber pemasukan (gaji, bonus, freelance, dll)
- **Budget Planning** - Set budget per kategori dengan notifikasi warning & rollover
- **Debt & Receivable** - Track hutang, piutang, cicilan dengan status & payment history
- **Savings Goals** - Buat target tabungan dengan progress tracking
- **Reminders** - Pengingat otomatis untuk tagihan, hutang, budget (sekali/harian/mingguan/bulanan/tahunan)

### 📊 Analytics & Reports
- **Real-time Dashboard** - Overview lengkap kondisi keuangan
- **Cash Flow Chart** - Visualisasi pemasukan vs pengeluaran
- **Category Breakdown** - Pie chart pengeluaran per kategori
- **Daily Spending** - Bar chart pengeluaran harian
- **Heatmap Calendar** - Kalender interaktif pengeluaran
- **Trend Analysis** - Analisis tren 6 bulan (income, expense, saving, budget)
- **Financial Summary** - Saving rate, budget usage, rata-rata pengeluaran harian

### 📱 Telegram Bot
- **Natural Language Commands** - Input transaksi dengan bahasa sehari-hari
- **Rich Notifications** - Notifikasi budget warning, reminder, insight
- **Quick Commands** - `/saldo`, `/ringkasan`, `/hutang`, `/reminder`, `/insight`, `/tabung`
- **Timezone Support** - WIB, WITA, WIT

### 🎨 Web Dashboard
- **Modern UI** - shadcn/ui components, Framer Motion animations
- **Responsive Design** - Mobile-friendly, desktop-optimized
- **Dark Mode** - Light/Dark/System theme
- **Interactive Charts** - Recharts with custom tooltips
- **Real-time Updates** - Live saldo, notifikasi counter

## 🛠 Tech Stack

### Backend
- **Node.js + TypeScript** - Type-safe backend
- **Express.js** - REST API framework
- **JSON Database** - DatabaseManager dengan atomic writes
- **Pollinations AI** - OpenAI-compatible API untuk NLP
- **Telegraf** - Telegram Bot framework
- **JWT** - Authentication
- **Zod** - Validation
- **Winston** - Logging
- **Node-cron** - Scheduler untuk reminders

### Frontend
- **Next.js 14** - React framework dengan App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - High-quality UI components
- **Framer Motion** - Smooth animations
- **Recharts** - Beautiful charts
- **Zustand** - State management
- **Axios** - HTTP client
- **next-themes** - Theme management
- **Sonner** - Toast notifications

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm / yarn / pnpm
- Telegram Bot Token (dari BotFather)

### 1. Clone Repository
```bash
git clone <repository-url>
cd TemanDuit_AI
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Copy `.env.example` ke `.env`:
```bash
cp ../.env.example ../.env
```

Edit `.env` dan isi:
- `TELEGRAM_BOT_TOKEN` dari BotFather
- `JWT_SECRET` (generate random string)
- Sesuaikan port jika perlu

Build & Run:
```bash
npm run build
npm start

# Development mode:
npm run dev
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
```

Edit `.env.local` (atau `.env`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/YourBotUsername
```

Run:
```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## 🚀 Usage

### 1. Setup Telegram Bot
1. Buka `@BotFather` di Telegram
2. Kirim `/newbot` dan ikuti instruksi
3. Copy bot token ke `.env` → `TELEGRAM_BOT_TOKEN`
4. Set bot commands di BotFather:
```
start - Mulai menggunakan TemanDuit
saldo - Lihat saldo
ringkasan - Ringkasan bulan ini
hutang - Daftar hutang
reminder - Daftar reminder
insight - AI insight keuangan
tabung - Menabung
bantuan - Panduan lengkap
```

### 2. Registrasi User
1. Start bot dengan `/start` di Telegram
2. Klik link registrasi yang dikirim bot
3. Isi form registrasi (2 steps)
4. Login otomatis ke dashboard

### 3. Catat Transaksi
Via Telegram (Natural Language):
```
"gw habis beli bakso 15 ribu"
"isi bensin 50rb"
"bayar listrik 200k"
"gajian 5 juta"
"hutang ke budi 100k"
"tabung 500 ribu"
```

Via Web Dashboard:
- Klik tombol "+ Tambah" di halaman yang sesuai
- Isi form manual

### 4. AI Features
- **Generate Insight**: Klik "Generate Insight" di halaman AI Insight
- **Tanya AI**: Ketik pertanyaan di chat box (misal: "bulan ini aku boros gak?")
- **Forecast**: Klik "Refresh" di section Forecast & Budget Advisor
- **Bot**: Kirim pertanyaan langsung di Telegram

## 📁 Project Structure

```
TemanDuit_AI/
├── backend/
│   └── src/
│       ├── bot/              # Telegram Bot
│       ├── controllers/      # REST API Controllers
│       ├── engines/          # Business Logic Engines
│       │   ├── AIEngine.ts           # AI parsing & insights
│       │   ├── ExpenseEngine.ts      # Expense management
│       │   ├── IncomeEngine.ts       # Income management
│       │   ├── BudgetEngine.ts       # Budget tracking
│       │   ├── DebtEngine.ts         # Debt & payment
│       │   ├── ReminderEngine.ts     # Reminder scheduler
│       │   ├── SavingEngine.ts       # Saving goals
│       │   ├── AnalyticsEngine.ts    # Reports & analytics
│       │   └── NotificationEngine.ts # Notifications
│       ├── database/         # DatabaseManager & seed
│       ├── middlewares/      # Auth, validation, error handler
│       ├── routes/           # API routes
│       ├── services/         # Services (Auth, Context, Search, Scheduler)
│       ├── types/            # TypeScript types
│       ├── utils/            # Helpers & logger
│       └── index.ts          # Entry point
├── frontend/
│   └── src/
│       ├── app/              # Next.js pages
│       │   ├── dashboard/
│       │   ├── transactions/
│       │   ├── budget/
│       │   ├── debt/
│       │   ├── reminder/
│       │   ├── saving/
│       │   ├── analytics/
│       │   ├── ai-insight/
│       │   ├── notifications/
│       │   ├── settings/
│       │   ├── profile/
│       │   ├── register/
│       │   └── login/
│       ├── components/       # React components
│       │   ├── ui/           # shadcn/ui primitives
│       │   ├── layout/       # Layout components
│       │   ├── charts/       # Chart components
│       │   ├── dashboard/    # Dashboard widgets
│       │   └── shared/       # Shared components
│       ├── lib/              # API client & utils
│       ├── hooks/            # React hooks
│       └── store/            # Zustand stores
└── database/
    └── database.json         # JSON database file
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Zod schema validation
- **Sanitization** - XSS protection
- **Rate Limiting** - API rate limits
- **Helmet** - Security headers
- **CORS** - Cross-origin protection
- **UUID** - Non-sequential IDs
- **Environment Variables** - No hardcoded secrets

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `GET /api/auth/validate-token/:token` - Validate registration token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions/expense` - Create expense
- `POST /api/transactions/income` - Create income
- `PUT /api/transactions/:type/:id` - Update transaction
- `DELETE /api/transactions/:type/:id` - Delete transaction

### Budget
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Debt
- `GET /api/debts` - List debts
- `POST /api/debts` - Create debt
- `POST /api/debts/:id/payment` - Record payment
- `GET /api/debts/summary` - Get debt summary

### Reminder
- `GET /api/reminders` - List reminders
- `POST /api/reminders` - Create reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

### Saving
- `GET /api/savings/goals` - List goals
- `POST /api/savings/goals` - Create goal
- `POST /api/savings/transactions` - Create saving transaction

### Analytics
- `GET /api/analytics` - Full analytics
- `GET /api/analytics/summary` - Financial summary
- `GET /api/analytics/trends` - Trend data

### AI
- `GET /api/ai/insights` - List insights
- `POST /api/ai/insights/generate` - Generate new insight
- `POST /api/ai/ask` - Ask question
- `GET /api/ai/budget-advisor` - Get budget advice
- `GET /api/ai/forecast` - Get forecast

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Dashboard
- `GET /api/dashboard` - Complete dashboard data

### Search
- `GET /api/search?q={query}` - Global search

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create custom category
- `DELETE /api/categories/:id` - Delete custom category

## 📝 License

Proprietary - TemanDuit © 2026

## 🤝 Contributing

Project ini adalah portfolio project. Jika ingin berkontribusi, silakan fork dan buat PR.

## 💬 Support

Untuk bantuan atau pertanyaan, hubungi developer atau buka issue di repository.

---

**Built with ❤️ using Node.js, TypeScript, Next.js, and Pollinations AI**
