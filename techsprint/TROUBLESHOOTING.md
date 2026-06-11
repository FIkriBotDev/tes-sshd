# 🔧 JadiKelas 2.0 - Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. Course Generation Issues

#### ❌ "AI gagal menghasilkan format yang valid"
**Penyebab:** AI return bukan JSON valid atau ada markdown wrapper

**Solusi:**
```javascript
// Check console log di terminal server
// Lihat raw AI output

// Manual fix di course.js line ~200:
const cleaned = rawContent
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
```

**Prevention:**
- Pastikan PDF tidak terlalu panjang (max 15000 chars)
- Pastikan PDF tidak terenkripsi
- Coba ulang upload jika gagal

---

#### ❌ "PDF tidak dapat dibaca atau kosong"
**Penyebab:** PDF corrupt atau terenkripsi

**Solusi:**
1. Buka PDF di browser/reader untuk verify
2. Jika PDF punya password, unlock dulu
3. Convert PDF ke format baru (print to PDF)
4. Pastikan PDF ada teksnya (bukan scan image)

**Test:**
```bash
# Install pdftotext (Linux/Mac)
pdftotext your-file.pdf output.txt
cat output.txt
# Jika kosong, PDF adalah image-based
```

---

#### ❌ "Code playground tidak muncul untuk materi coding"
**Penyebab:** AI tidak detect materi sebagai coding

**Solusi Manual:**
1. Edit `course-data/{courseId}.json`
2. Tambahkan block manual:
```json
{
  "type": "code_playground",
  "title": "Coba Praktek!",
  "icon": "💻",
  "language": "javascript",
  "instruction": "Edit dan run code",
  "fileName": "playground.js",
  "defaultCode": "console.log('Hello');",
  "hint": "Coba ubah teksnya!"
}
```
3. Restart server atau refresh course

**Prevention:**
- Pastikan PDF punya keyword coding: `function`, `variable`, `console.log`
- Upload PDF khusus programming/coding
- AI akan auto-detect dan generate playground

---

### 2. Authentication Issues

#### ❌ "Belum login sebagai siswa"
**Penyebab:** Session student tidak ada atau expired

**Solusi:**
1. Clear browser cookies
2. Go to `/course-auth/{courseId}`
3. Login ulang
4. Check session di browser DevTools (Application → Cookies)

**Debug:**
```javascript
// Check session di browser console
fetch('/api/course/student/me/' + COURSE_ID)
  .then(r => r.json())
  .then(console.log);
```

---

#### ❌ "Email sudah terdaftar"
**Penyebab:** Trying register dengan email yang sama

**Solusi:**
- Login dengan email tersebut
- Atau gunakan email berbeda
- Atau delete student dari database:
```bash
# Edit file
code course-students/database_siswa_{courseId}.json
# Remove student dengan email tersebut
```

---

#### ❌ "Password salah"
**Penyebab:** Salah password atau bcrypt issue

**Solusi:**
1. Reset password (currently not supported - need manual fix)
2. Atau create new account
3. Manual reset (untuk testing):
```javascript
// Di Node.js console
const bcrypt = require('bcrypt');
const newHash = await bcrypt.hash('newpassword123', 10);
console.log(newHash);
// Copy hash ke database_siswa JSON
```

---

### 3. Gamification Issues

#### ❌ "XP tidak bertambah saat complete block"
**Penyebab:** Request ke backend gagal atau session issue

**Debug:**
1. Open browser console (F12)
2. Check Network tab saat klik "Tandai Selesai"
3. Look for `/api/course/gamification/reward` request
4. Check response status

**Solusi:**
```javascript
// Manual test di console
fetch('/api/course/gamification/reward', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    courseId: COURSE_ID,
    action: 'complete_block',
    blockId: 'block-0'
  })
}).then(r => r.json()).then(console.log);
```

**Check:**
- Pastikan student sudah login
- Pastikan courseId valid
- Pastikan blockId belum completed sebelumnya

---

#### ❌ "Leaderboard kosong atau tidak update"
**Penyebab:** Belum ada student dengan XP atau API error

**Solusi:**
1. Minimal 1 student harus complete block
2. Refresh halaman leaderboard
3. Check endpoint manual:
```bash
curl http://localhost:5526/api/course/leaderboard/{courseId}
```

**Verify:**
```bash
# Check student database
cat course-students/database_siswa_{courseId}.json | grep xp
# Harus ada xp > 0
```

---

#### ❌ "Achievement tidak unlock"
**Penyebab:** Condition belum terpenuhi atau logic error

**Debug di `course.js`:**
```javascript
// Line ~770 - Achievement definitions
const achievementDefs = [
    { id: "first_block", ..., check: s => (s.completedBlocks||[]).length >= 1 },
    // ...
];
// Check apakah condition correct
```

**Manual Test:**
```javascript
// Di browser console
fetch('/api/course/student/me/' + COURSE_ID)
  .then(r => r.json())
  .then(data => {
    console.log('Completed blocks:', data.student.completedBlocks);
    console.log('Achievements:', data.student.achievements);
  });
```

---

### 4. Code Playground Issues

#### ❌ "Code playground tidak bisa run"
**Penyebab:** Ace Editor belum load atau JavaScript error

**Solusi:**
1. Check browser console untuk error
2. Verify Ace Editor CDN loaded:
```javascript
// Di console
typeof ace !== 'undefined' // should be true
```
3. Clear cache dan reload

**Common errors:**
```javascript
// Error: editor is null
// Fix: Tunggu editor init selesai (100ms delay di code)

// Error: ace is not defined
// Fix: Check CDN di <head>, reload page
```

---

#### ❌ "Python playground not working"
**Penyebab:** Belum implemented (UI only)

**Status:** Python execution coming soon (need Pyodide)

**Workaround:** Use JavaScript playground untuk logic yang sama

---

#### ❌ "Code output tidak muncul"
**Penyebab:** console.log override issue atau error di code

**Debug:**
```javascript
// Check di playground output area
// Should show error message jika ada

// Manual test:
const editor = codeEditors['block-0'];
const code = editor.getValue();
console.log('Code:', code);
// Run manually
eval(code);
```

---

### 5. UI/UX Issues

#### ❌ "Sidebar tidak collapse di mobile"
**Penyebab:** JavaScript event listener belum attach

**Solusi:**
1. Check console error
2. Verify mobile-menu-btn exists:
```javascript
document.getElementById('mobile-menu-btn') // should not be null
```
3. Re-init event listeners

---

#### ❌ "Animations tidak smooth"
**Penyebab:** Browser compatibility atau performance

**Solusi:**
- Enable GPU acceleration di browser
- Disable animations untuk testing:
```css
/* Add to <style> */
* { animation: none !important; transition: none !important; }
```
- Close other tabs (free memory)

---

#### ❌ "Confetti tidak muncul"
**Penyebab:** Canvas Confetti CDN tidak load

**Verify:**
```javascript
// Di console
typeof confetti !== 'undefined' // should be true
```

**Fix:**
```html
<!-- Check CDN di index.html -->
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
```

---

### 6. AI Tutor Issues

#### ❌ "AI Tutor tidak respond"
**Penyebab:** API key invalid atau network error

**Debug:**
```bash
# Check terminal server logs
# Should see POST /api/course/chat requests

# Check Pollinations API
curl -X POST https://gen.pollinations.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"model":"openai","messages":[{"role":"user","content":"test"}]}'
```

**Solusi:**
- Check API key di `course.js` line ~4
- Verify internet connection
- Check API rate limits

---

#### ❌ "AI jawaban tidak sesuai materi"
**Penyebab:** tutorContext kurang lengkap atau AI hallucination

**Fix:**
1. Edit `course-system-prompt/{courseId}.md`
2. Tambah context lebih detail
3. Test dengan pertanyaan spesifik

---

### 7. Progress & Data Issues

#### ❌ "Progress tidak tersimpan"
**Penyebab:** Auto-save gagal atau session expired

**Debug:**
```javascript
// Check auto-save function
// Di browser console:
saveProgress(); // should work

// Check file
// Should update course-progress/{courseId}-{studentId}.json
```

**Manual Save:**
```javascript
fetch('/api/course/progress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    courseId: COURSE_ID,
    scrollProgress: 50,
    completedBlocks: ['block-0']
  })
});
```

---

#### ❌ "Database corruption"
**Penyebab:** Manual edit atau server crash saat write

**Backup & Fix:**
```bash
# Backup dulu
cp course-students/database_siswa_xxx.json database_siswa_xxx.json.bak

# Verify JSON valid
cat database_siswa_xxx.json | python -m json.tool

# Jika invalid, restore dari backup
# Atau fix manual di code editor
```

---

### 8. Performance Issues

#### ❌ "Page load lambat"
**Penyebab:** Terlalu banyak learning blocks atau large code

**Solusi:**
- Reduce PDF size sebelum upload
- Split course jadi beberapa part
- Optimize images di PDF
- Clear browser cache

**Monitor:**
```javascript
// Check load time di console
performance.now() // ms since page load
```

---

#### ❌ "Code editor lag"
**Penyebab:** Large code atau slow device

**Solusi:**
- Reduce editor size
- Disable auto-completion:
```javascript
editor.setOptions({
  enableBasicAutocompletion: false,
  enableLiveAutocompletion: false
});
```

---

## 🔍 Debug Checklist

### Before Reporting Bug:

- [ ] Clear browser cache & cookies
- [ ] Try in incognito mode
- [ ] Check browser console for errors
- [ ] Check Network tab for failed requests
- [ ] Test in different browser
- [ ] Restart server
- [ ] Check terminal logs
- [ ] Verify database files exist
- [ ] Check file permissions
- [ ] Test with sample course first

### Info to Include:

1. **Browser:** Chrome/Firefox/Safari + version
2. **OS:** Windows/Mac/Linux
3. **Error message:** Copy dari console
4. **Steps to reproduce:** Detail step-by-step
5. **Expected behavior:** Apa yang diharapkan
6. **Actual behavior:** Apa yang terjadi
7. **Screenshots:** Jika UI issue
8. **Course ID:** Untuk debug spesifik

---

## 🛠️ Developer Tools

### Useful Console Commands:

```javascript
// Check current state
console.log('Course ID:', COURSE_ID);
console.log('Student:', studentData);
console.log('Completed Blocks:', completedBlocks);
console.log('Code Editors:', Object.keys(codeEditors));

// Force save progress
saveProgress();

// Reload student data
loadStudentData();

// Test API endpoint
fetch('/api/course/data/' + COURSE_ID).then(r=>r.json()).then(console.log);

// Clear completed blocks (testing)
completedBlocks.clear();

// Reset quiz
retryQuiz();

// Open AI tutor
toggleAITutor();
```

### Database Quick Check:

```bash
# List all students
ls course-students/

# Count students per course
cat course-students/database_siswa_xxx.json | grep studentId | wc -l

# Find highest XP
cat course-students/database_siswa_xxx.json | grep '"xp"' | sort -rn | head -1

# Check progress files
ls course-progress/ | wc -l
```

---

## 📞 Support

### Self-Help:
1. Read this troubleshooting guide
2. Check QUICK_START.md
3. Read UPGRADE_2.0_README.md
4. Check browser console
5. Test with fresh course

### Still Stuck?
- Check GitHub issues (if public repo)
- Contact developer dengan info lengkap
- Provide error logs & screenshots

---

## 🔄 Reset Everything (Nuclear Option)

**WARNING:** This will delete ALL data!

```bash
# Backup first
mkdir backup_$(date +%Y%m%d)
cp -r course-students backup_$(date +%Y%m%d)/
cp -r course-progress backup_$(date +%Y%m%d)/
cp -r course-data backup_$(date +%Y%m%d)/

# Delete data
rm -rf course-students/*
rm -rf course-progress/*
# Keep course-data and generated-course

# Restart server
# Re-register students
# Start fresh
```

---

**Last Updated:** June 11, 2026
**Version:** 2.0.0

💡 **Tip:** Kebanyakan issues bisa fixed dengan clear cache + restart server!
