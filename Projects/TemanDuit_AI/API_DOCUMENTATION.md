# 📖 TemanDuit API Documentation

Base URL: `http://localhost:3001/api`

All authenticated endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 🔐 Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "token": "uuid-registration-token",
  "name": "Budi Santoso",
  "age": 25,
  "timezone": "WIB",
  "occupation": "Software Engineer",
  "incomeSource": "Karyawan tetap",
  "financialGoal": "Membeli rumah dalam 3 tahun"
}

Response 201:
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", ... },
    "token": "jwt-token"
  },
  "message": "Selamat datang, Budi! Akun TemanDuit kamu sudah siap. 🎉"
}
```

### Validate Registration Token
```http
GET /auth/validate-token/:token

Response 200:
{
  "success": true,
  "data": {
    "telegramId": "123456789",
    "expiresAt": "2024-01-02T12:00:00.000Z"
  }
}
```

### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": "...",
    "telegramId": "...",
    "name": "Budi Santoso",
    "age": 25,
    "timezone": "WIB",
    "occupation": "Software Engineer",
    "incomeSource": "Karyawan tetap",
    "financialGoal": "...",
    "balance": 5000000,
    "savingBalance": 2000000,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## 💸 Transactions

### List Transactions
```http
GET /transactions?page=1&limit=20&month=7&year=2024&type=expense
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "expense",
      "amount": 15000,
      "categoryId": "...",
      "categoryName": "Makanan",
      "categoryIcon": "🍜",
      "description": "Bakso",
      "note": "Dengan teman",
      "date": "2024-07-15T10:30:00.000Z",
      "aiParsed": true,
      "rawInput": "beli bakso 15rb",
      ...
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### Create Expense
```http
POST /transactions/expense
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "categoryId": "cat-transport-...",
  "description": "Bensin motor",
  "note": "Full tank",
  "date": "2024-07-15"
}

Response 201:
{
  "success": true,
  "data": { ... },
  "message": "Pengeluaran berhasil dicatat"
}
```

### Create Income
```http
POST /transactions/income
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000000,
  "source": "salary",
  "description": "Gaji Juli",
  "note": "",
  "date": "2024-07-01"
}

Response 201:
{
  "success": true,
  "data": { ... },
  "message": "Pemasukan berhasil dicatat"
}
```

## 💰 Budget

### List Budgets
```http
GET /budgets?month=7&year=2024
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "categoryId": "...",
      "categoryName": "Makanan",
      "categoryIcon": "🍜",
      "categoryColor": "#F97316",
      "amount": 1000000,
      "spent": 850000,
      "remaining": 150000,
      "usagePercent": 85,
      "isWarning": true,
      "isExceeded": false,
      "rollover": false,
      ...
    }
  ]
}
```

### Create Budget
```http
POST /budgets
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoryId": "cat-makanan-...",
  "amount": 1000000,
  "month": 7,
  "year": 2024,
  "rollover": true
}

Response 201:
{
  "success": true,
  "data": { ... },
  "message": "Budget berhasil dibuat"
}
```

## 📋 Debt

### Get Debt Summary
```http
GET /debts/summary
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "totalDebt": 5000000,
    "totalReceivable": 2000000,
    "activeCount": 3,
    "overdueCount": 1
  }
}
```

### Record Debt Payment
```http
POST /debts/:id/payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500000,
  "note": "Cicilan bulan Juli"
}

Response 200:
{
  "success": true,
  "data": {
    "debt": { ... },
    "payment": { ... }
  },
  "message": "Pembayaran berhasil dicatat"
}
```

## ⏰ Reminder

### List Reminders
```http
GET /reminders?active=true
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "bill",
      "title": "Bayar listrik",
      "description": "PLN postpaid",
      "amount": 200000,
      "frequency": "monthly",
      "dueDate": "...",
      "nextTrigger": "2024-07-20T10:00:00.000Z",
      "isActive": true,
      ...
    }
  ]
}
```

## 🏦 Saving

### Get Saving Summary
```http
GET /savings/summary
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "totalSaving": 5000000,
    "totalGoals": 3,
    "completedGoals": 1,
    "activeGoals": 2
  }
}
```

### Create Saving Transaction
```http
POST /savings/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "deposit",
  "amount": 500000,
  "description": "Menabung untuk dana darurat",
  "goalId": "goal-id-optional"
}

Response 201:
{
  "success": true,
  "data": { ... },
  "message": "Berhasil menabung"
}
```

## 📊 Analytics

### Get Full Analytics
```http
GET /analytics?month=7&year=2024
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": 5000000,
      "totalExpense": 3500000,
      "netSavings": 1500000,
      "savingRate": 30,
      "budgetUsage": 85,
      "averageDailySpending": 112903,
      "mostExpensiveCategory": "Makanan",
      "mostFrequentCategory": "Transport",
      "balance": 5000000,
      "savingBalance": 2000000
    },
    "incomeTrend": [ ... ],
    "expenseTrend": [ ... ],
    "savingTrend": [ ... ],
    "budgetTrend": [ ... ],
    "dailySpending": [ ... ],
    "categoryBreakdown": [ ... ]
  }
}
```

## 🤖 AI

### Generate Insight
```http
POST /ai/insights/generate
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Insight Keuangan Juli 2024",
    "content": "Pengeluaran bulan ini terkendali dengan baik...",
    "recommendations": [
      "Pertahankan pola pengeluaran yang konsisten",
      "Tingkatkan saving rate menjadi 35%",
      "Alokasikan 10% income untuk investasi"
    ],
    "period": "2024-07",
    "createdAt": "..."
  }
}
```

### Ask Question
```http
POST /ai/ask
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "Bulan ini aku boros gak?"
}

Response 200:
{
  "success": true,
  "data": {
    "question": "Bulan ini aku boros gak?",
    "answer": "Tidak, pengeluaran kamu bulan ini masih dalam batas wajar..."
  }
}
```

### Get Budget Advisor
```http
GET /ai/budget-advisor
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "advice": "Berdasarkan pola pengeluaran kamu, berikut saran budget optimal..."
  }
}
```

### Get Forecast
```http
GET /ai/forecast
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "forecast": "Perkiraan pengeluaran bulan depan adalah Rp 3.700.000..."
  }
}
```

## 🔔 Notifications

### List Notifications
```http
GET /notifications?unread=true
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "budget_warning",
      "title": "Budget Makanan Hampir Habis",
      "message": "Budget Makanan sudah terpakai 85%. Sisa: Rp 150.000.",
      "isRead": false,
      "sentToTelegram": true,
      "createdAt": "..."
    }
  ],
  "unreadCount": 3
}
```

### Mark All Read
```http
PUT /notifications/read-all
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "message": "Semua notifikasi ditandai sudah dibaca"
}
```

## 🔍 Search

### Global Search
```http
GET /search?q=bakso
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "type": "transaction",
      "id": "...",
      "title": "Bakso",
      "subtitle": "-Rp 15.000 • Makanan",
      "amount": 15000,
      "date": "..."
    }
  ]
}
```

## 📱 Dashboard

### Get Dashboard Data
```http
GET /dashboard
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "user": { ... },
    "summary": { ... },
    "recentTransactions": [ ... ],
    "budgets": [ ... ],
    "notifications": [ ... ],
    "upcomingReminders": [ ... ],
    "savingGoals": [ ... ],
    "categoryBreakdown": [ ... ],
    "cashFlowTrend": { income: [...], expense: [...] }
  }
}
```

## ❌ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validasi gagal",
  "details": [
    { "field": "amount", "message": "Nominal harus positif" }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Token tidak valid atau sudah kedaluwarsa"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Transaksi tidak ditemukan"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Terjadi kesalahan internal. Coba lagi nanti."
}
```

---

**Note**: Semua endpoint yang memerlukan authentication harus menyertakan JWT token di header `Authorization: Bearer <token>`.
