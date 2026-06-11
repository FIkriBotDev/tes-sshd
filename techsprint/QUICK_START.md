# 🚀 JadiKelas 2.0 - Quick Start Guide

## 📦 Installation

```bash
# Clone atau masuk ke folder project
cd JadiKelas/backup

# Install dependencies (jika belum)
npm install

# Start server
node index.js
```

Server akan jalan di: **http://localhost:5526**

---

## 🎯 Testing Flow Lengkap

### 1️⃣ **Upload PDF sebagai Pengajar**

1. Buka **http://localhost:5526**
2. **Register** akun pengajar baru (jika belum punya)
3. **Login** ke dashboard
4. **Upload PDF** course baru
5. Tunggu AI generate (30-60 detik)
6. **Copy URL course** yang dihasilkan

---

### 2️⃣ **Akses Course sebagai Siswa**

1. Buka URL course: `http://localhost:5526/course/{courseId}`
2. **Otomatis redirect** ke halaman auth: `/course-auth/{courseId}`
3. **Klik "Daftar Sekarang"**
4. **Register** dengan:
   - Username: `testuser`
   - Email: `test@mail.com`
   - Password: `test123`
5. **Berhasil!** Langsung masuk ke course

---

### 3️⃣ **Explore Interactive Features**

#### 📚 **Learning Blocks**
- Scroll dan baca setiap learning block
- Klik **"Tandai Selesai & Raih XP"** di akhir block
- 🎉 Dapat **+30 XP** dan **+10 Coin**!
- Watch your **XP bar** bertambah di sidebar

#### 💻 **Code Playground**
- Find block dengan type `code_playground`
- **Edit code** di editor
- Klik **"Run Code"** button (hijau)
- Lihat **output** di console area bawah
- 🎯 Dapat **+10 XP** untuk run code!

**Try this example:**
```javascript
let nama = "Budi";
console.log("Halo, " + nama + "!");

// Coba ganti nama dengan nama kamu!
```

#### 🧠 **Interactive Quiz**
- Klik **"Quiz"** di sidebar
- Jawab soal satu per satu
- ✅ **Jawaban benar** → +50 XP + 20 Coin + confetti! 🎊
- ❌ **Jawaban salah** → lihat penjelasan, +5 XP
- 💯 **Perfect score** → +200 XP + achievement!

#### 🃏 **Smart Flashcards**
- Klik **"Cards"** di sidebar
- **Tap card** untuk flip dan lihat jawaban
- Setiap card viewed → **+10 XP**
- Complete semua → **+80 XP** bonus!

#### 🤖 **AI Tutor Chat**
- Klik **floating robot button** di kanan bawah
- Chat dengan **Kela AI Tutor**
- Tanya apa saja tentang materi
- Setiap chat → **+15 XP** (max 10/hari)

**Try asking:**
- "Apa itu variabel?"
- "Jelaskan function dengan mudah"
- "Aku masih bingung tentang parameter"

#### 🏆 **Leaderboard**
- Klik **"Leaderboard"** di sidebar
- Lihat **ranking kamu** vs siswa lain
- Top 3 dapat **medal** 🥇🥈🥉
- Compete untuk #1!

---

### 4️⃣ **Test Gamification**

#### Level Up Test:
```
Start: Level 1, 0 XP
→ Complete 1 block: +30 XP
→ Answer 2 quiz: +100 XP
→ View 3 flashcards: +30 XP
→ Run code 2x: +20 XP
→ Chat AI 2x: +30 XP
Total: 210 XP → Level 2! 🎉
```

#### Achievement Unlock:
- ✅ Complete 1st block → **Langkah Pertama** 🌟
- ✅ Answer 5 quiz correctly → **Quiz Master** 🧠
- ✅ View 5 flashcards → **Flashcard Pro** 🃏
- ✅ Perfect quiz score → **Nilai Sempurna** 💯
- ✅ Chat AI 3x → **AI Explorer** 🤖

---

### 5️⃣ **Test Streak System**

1. **Hari 1**: Login → 1🔥 streak, +20 XP, +10 Coin
2. **Logout** → close browser
3. **Hari 2**: Login lagi (simulasi dengan ubah lastLoginDate di database)
4. **Streak bertambah** → 2🔥, bonus XP lagi!
5. **Skip 1 hari** → streak reset ke 1

---

### 6️⃣ **Test Multiple Students (Leaderboard)**

1. **Logout** dari akun pertama
2. **Register** user baru:
   - `user2@mail.com`
   - `user3@mail.com`
3. **Kumpulkan XP** di setiap akun
4. **Check leaderboard** → lihat ranking berubah!

---

### 7️⃣ **Teacher Analytics** (Bonus)

1. **Login** sebagai **pengajar** (creator course)
2. Buka: `http://localhost:5526/api/course/analytics/{courseId}`
3. Lihat JSON analytics:
   - Total students
   - Average XP, quiz score, streak
   - Most active student
   - Full leaderboard

**Example Response:**
```json
{
  "success": true,
  "analytics": {
    "totalStudents": 3,
    "avgXp": 285,
    "avgQuizScore": 75,
    "totalAiChats": 18,
    "avgStreak": 2,
    "mostActive": {
      "username": "testuser",
      "xp": 450
    },
    "leaderboard": [...]
  }
}
```

---

## 🧪 API Testing (Postman/Thunder Client)

### Student Register
```http
POST http://localhost:5526/api/course/student/register
Content-Type: application/json

{
  "courseId": "YOUR_COURSE_ID",
  "username": "testuser",
  "email": "test@mail.com",
  "password": "test123"
}
```

### Student Login
```http
POST http://localhost:5526/api/course/student/login
Content-Type: application/json

{
  "courseId": "YOUR_COURSE_ID",
  "email": "test@mail.com",
  "password": "test123"
}
```

### Complete Block (Reward)
```http
POST http://localhost:5526/api/course/gamification/reward
Content-Type: application/json
Cookie: connect.sid=YOUR_SESSION

{
  "courseId": "YOUR_COURSE_ID",
  "action": "complete_block",
  "blockId": "block-0"
}
```

### AI Chat
```http
POST http://localhost:5526/api/course/chat
Content-Type: application/json
Cookie: connect.sid=YOUR_SESSION

{
  "courseId": "YOUR_COURSE_ID",
  "message": "Apa itu variabel?"
}
```

### Get Leaderboard
```http
GET http://localhost:5526/api/course/leaderboard/YOUR_COURSE_ID
```

---

## 🎮 Interactive Playground Features

### Supported Languages:

✅ **JavaScript** (Full support)
- console.log() output
- Variables, functions
- Error handling
- Real-time execution

✅ **HTML/CSS** (Preview mode)
- Live iframe preview
- Full HTML rendering
- CSS styling support

🔜 **Python** (Coming soon)
🔜 **SQL** (Coming soon)

### How to Test Playground:

1. **Upload PDF** dengan materi coding (JavaScript, HTML, etc)
2. **AI akan auto-detect** dan generate `code_playground` blocks
3. **Atau manual test**: Edit `EXAMPLE_AI_OUTPUT_WITH_PLAYGROUND.json`
4. Students bisa **edit & run code** langsung!

---

## 🐛 Troubleshooting

### Issue: "Course tidak ditemukan"
**Fix:** Pastikan courseId valid dan file HTML sudah ter-generate di `/generated-course/`

### Issue: "Belum login sebagai siswa"
**Fix:** Register/login dulu di `/course-auth/{courseId}`

### Issue: Code playground tidak muncul
**Fix:** Pastikan AI output punya block dengan `type: "code_playground"`

### Issue: XP tidak bertambah
**Fix:** 
- Check session (harus login sebagai student)
- Check console browser untuk error
- Pastikan backend API jalan

### Issue: Leaderboard kosong
**Fix:** Minimal 1 student harus complete block untuk masuk leaderboard

---

## 📊 Monitor Progress

### Check Student Database:
```bash
# Lihat file
cat course-students/database_siswa_{courseId}.json
```

### Check Progress:
```bash
# Lihat file
cat course-progress/{courseId}-{studentId}.json
```

### Watch Logs:
```bash
# Terminal tempat node index.js jalan
# Lihat request logs
```

---

## 🎯 Success Metrics

**Course dianggap berhasil jika:**
- ✅ Students bisa register & login
- ✅ XP bertambah saat complete block
- ✅ Quiz berfungsi dengan reward
- ✅ Flashcard flip smooth
- ✅ Code playground bisa run
- ✅ AI tutor respond dengan baik
- ✅ Leaderboard update realtime
- ✅ Achievements unlock
- ✅ Mobile responsive

---

## 🚀 Next Steps

1. **Test semua fitur** dengan flow di atas
2. **Upload berbagai jenis PDF** (coding, networking, matematika, dll)
3. **Check AI output quality** - apakah interactive blocks generated?
4. **Test mobile** - buka di phone
5. **Test multi-user** - simulate classroom
6. **Check performance** - loading time
7. **Review UI/UX** - smooth animations?

---

## 📝 Notes

- **Session expires**: 7 hari
- **Credit cost**: 5 credit per course generation
- **Max AI chat**: 10 per hari (untuk prevent spam)
- **Auto-save progress**: Setiap 2 detik saat scroll
- **Password**: Hashed dengan bcrypt (10 rounds)

---

**🎉 Happy Testing!**

Kalau ada bug atau pertanyaan, check console browser (F12) untuk error messages.
