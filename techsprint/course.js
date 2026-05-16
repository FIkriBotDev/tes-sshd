// ============================================================
// course.js — Course generation, viewer, chat, progress
// ============================================================

const express = require("express");
const multer  = require("multer");
const axios   = require("axios");
const fs      = require("fs");
const path    = require("path");
const crypto  = require("crypto");

// ── PDF Text Extraction (pdfjs-dist, kompatibel Node.js v22) ─
async function extractPdfText(filePath) {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc  = await pdfjsLib.getDocument({ data }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
        const page    = await doc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + "\n";
    }
    return text;
}

const router = express.Router();

// ── Paths ────────────────────────────────────────────────────
const ROOT            = __dirname;
const UPLOADS_DIR     = path.join(ROOT, "uploads");
const COURSE_DATA_DIR = path.join(ROOT, "course-data");
const GENERATED_DIR   = path.join(ROOT, "generated-course");
const PROGRESS_DIR    = path.join(ROOT, "course-progress");
const PROMPT_DIR      = path.join(ROOT, "course-system-prompt");
const TEMPLATE_PATH   = path.join(ROOT, "course_template", "index.html");
const COURSES_PATH    = path.join(ROOT, "course_list.json");
const DB_PATH         = path.join(ROOT, "database_user.json");

const POLLINATIONS_API_KEY = "sk_RM9sUErPNlaj7kFenSIMljnIVvAyssUk";

// Ensure dirs exist
[UPLOADS_DIR, COURSE_DATA_DIR, GENERATED_DIR, PROGRESS_DIR, PROMPT_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── Helpers ──────────────────────────────────────────────────
function readDB() {
    try { return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")); } catch { return []; }
}
function writeDB(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }

function readCourses() {
    try { return JSON.parse(fs.readFileSync(COURSES_PATH, "utf-8")); } catch { return []; }
}
function writeCourses(data) { fs.writeFileSync(COURSES_PATH, JSON.stringify(data, null, 2)); }

function readProgress(courseId, email) {
    const key = `${courseId}-${email.replace(/[@.]/g, "_")}`;
    const p = path.join(PROGRESS_DIR, `${key}.json`);
    try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return null; }
}
function writeProgress(courseId, email, data) {
    const key = `${courseId}-${email.replace(/[@.]/g, "_")}`;
    const p = path.join(PROGRESS_DIR, `${key}.json`);
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function nowStr() {
    return new Date().toLocaleString("id-ID", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false
    }).replace(/\//g, "-");
}

// ── Multer ───────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename:    (req, file, cb) => {
        const ts   = Date.now();
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${ts}-${safe}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") cb(null, true);
        else cb(new Error("Hanya file PDF yang diizinkan."));
    }
});

// ── AI Course Generation System Prompt ───────────────────────
const AI_SYSTEM_PROMPT = `Kamu adalah AI yang mengubah isi materi PDF menjadi course interaktif.
Tugas kamu: baca isi materi, lalu kembalikan HANYA JSON valid tanpa markdown, tanpa penjelasan, tanpa \`\`\`json.
Format JSON wajib:
{
  "title": "Judul course berdasarkan isi materi",
  "summary": "Ringkasan materi 2-3 paragraf",
  "chapters": [
    {
      "title": "Judul Chapter",
      "content": "Isi chapter dalam format HTML sederhana menggunakan tag p, ul, li, strong saja. Minimal 3 paragraf per chapter."
    }
  ],
  "flashcards": [
    { "question": "Pertanyaan", "answer": "Jawaban lengkap" }
  ],
  "quiz": [
    {
      "question": "Pertanyaan quiz",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "answer": "Opsi yang benar (harus sama persis dengan salah satu opsi)"
    }
  ],
  "tutorContext": "Penjelasan lengkap semua isi materi untuk AI tutor, minimal 500 kata"
}
Rules:
- Buat minimal 3 chapters, 8 flashcards, 8 soal quiz
- Semua dalam bahasa Indonesia
- Return JSON valid saja, tidak ada teks lain sama sekali`;

// ── POST /api/course/upload ───────────────────────────────────
router.post("/course/upload", upload.single("pdf"), async (req, res) => {
    if (!req.session.user)
        return res.status(401).json({ success: false, message: "Belum login." });

    if (!req.file)
        return res.status(400).json({ success: false, message: "File PDF wajib diupload." });

    const email = req.session.user.email;

    // Cek credit
    const users = readDB();
    const userIdx = users.findIndex(u => u.email === email);
    if (userIdx === -1) return res.status(404).json({ success: false, message: "User tidak ditemukan." });

    if ((users[userIdx].creditLeft || 0) < 5) {
        // Hapus file yang sudah terupload
        fs.unlink(req.file.path, () => {});
        return res.status(402).json({ success: false, message: "Credit tidak cukup. Minimal 5 credit untuk generate course.", insufficientCredit: true });
    }

    const courseId   = crypto.randomBytes(16).toString("hex");
    const filePath   = req.file.path;
    const fileName   = req.file.originalname;

    try {
        // 1. Extract PDF text
        let pdfText = "";
        try {
            pdfText = (await extractPdfText(filePath)).slice(0, 15000);
        } catch (pdfErr) {
            console.error("PDF parse error:", pdfErr.message);
            fs.unlink(filePath, () => {});
            return res.status(400).json({ success: false, message: "Gagal membaca PDF. Pastikan file tidak terenkripsi." });
        }

        if (!pdfText || pdfText.trim().length < 50) {
            fs.unlink(filePath, () => {});
            return res.status(400).json({ success: false, message: "PDF tidak dapat dibaca atau kosong." });
        }

        // 2. Call Pollinations AI
        const aiResponse = await axios.post(
            "https://gen.pollinations.ai/v1/chat/completions",
            {
                model: "openai",
                messages: [
                    { role: "system", content: AI_SYSTEM_PROMPT },
                    { role: "user",   content: `Isi materi PDF:\n\n${pdfText}` }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${POLLINATIONS_API_KEY}`
                },
                timeout: 120000
            }
        );

        const rawContent = aiResponse.data.choices?.[0]?.message?.content || "";

        // 3. Parse JSON — strip markdown fences jika ada
        let aiData;
        try {
            const cleaned = rawContent
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/i, "")
                .replace(/```\s*$/i, "")
                .trim();
            aiData = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error("AI JSON parse error:", parseErr.message);
            console.error("Raw AI output:", rawContent.slice(0, 500));
            return res.status(500).json({ success: false, message: "AI gagal menghasilkan format yang valid. Coba lagi." });
        }

        // 4. Simpan course-data JSON
        const courseDataPath = path.join(COURSE_DATA_DIR, `${courseId}.json`);
        fs.writeFileSync(courseDataPath, JSON.stringify(aiData, null, 2));

        // 5. Generate system prompt untuk AI Tutor
        const tutorPrompt = `Kamu adalah AI Tutor untuk course "${aiData.title}".

Tugas kamu:
- Membantu user memahami materi course ini
- Menjelaskan dengan bahasa sederhana dan analogi yang mudah dipahami
- Membantu menjawab pertanyaan seputar quiz dan flashcard
- Fokus HANYA pada isi materi course ini

Materi utama:
${aiData.summary}

${aiData.tutorContext}

Rules:
- Jawab singkat namun jelas
- Gunakan bahasa Indonesia yang ramah dan mudah dipahami
- Jika pertanyaan di luar materi course ini, arahkan kembali ke materi
- Jangan keluar dari konteks pembelajaran course ini
- Berikan analogi atau contoh nyata jika membantu pemahaman`;

        const promptPath = path.join(PROMPT_DIR, `${courseId}.md`);
        fs.writeFileSync(promptPath, tutorPrompt);

        // 6. Generate HTML dari template
        let templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf-8");

        // Build chapters HTML
        const chaptersHtml = (aiData.chapters || []).map((ch, i) => `
<section class="chapter-card">
    <h2>Chapter ${i + 1}: ${escapeHtml(ch.title)}</h2>
    ${ch.content}
</section>`).join("\n");

        // Build flashcards HTML
        const flashcardsHtml = buildFlashcardsHtml(aiData.flashcards || []);

        // Build quiz HTML
        const quizHtml = buildQuizHtml(aiData.quiz || [], courseId);

        // Build chapter nav
        const chapterNavHtml = (aiData.chapters || []).map((ch, i) => `
<button onclick="scrollToChapter(${i})" class="chapter-nav-btn w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-white/60 hover:text-slate-700 transition-colors" data-chapter="${i}">
    <i class="ph ph-circle text-lg chapter-nav-icon"></i>
    <span class="truncate text-sm">Chapter ${i + 1}: ${escapeHtml(ch.title)}</span>
</button>`).join("\n");

        templateHtml = templateHtml
            .replace(/\{\{courseTitle\}\}/g,   escapeHtml(aiData.title))
            .replace(/\{\{courseSummary\}\}/g, escapeHtml(aiData.summary))
            .replace(/\{\{chapters\}\}/g,      chaptersHtml)
            .replace(/\{\{quiz\}\}/g,          quizHtml)
            .replace(/\{\{flashcards\}\}/g,    flashcardsHtml)
            .replace(/\{\{courseId\}\}/g,      courseId)
            .replace(/\{\{chapterNav\}\}/g,    chapterNavHtml);

        // Inject courseId ke script area
        templateHtml = templateHtml.replace(
            "<!-- COURSE_ID_INJECT -->",
            `<script>const COURSE_ID = "${courseId}";</script>`
        );

        const generatedPath = path.join(GENERATED_DIR, `${courseId}.html`);
        fs.writeFileSync(generatedPath, templateHtml);

        // 7. Update course_list.json
        const courses = readCourses();
        const courseEntry = {
            courseId,
            courseName:      aiData.title,
            courseFileName:  fileName,
            courseOwner:     email,
            courseCreated:   nowStr(),
            courseUrl:       `/course/${courseId}`,
            courseThumbnail: "/assets/course-default.png",
            courseStatus:    "completed"
        };
        courses.push(courseEntry);
        writeCourses(courses);

        // 8. Kurangi credit & update courseCreated
        users[userIdx].creditLeft    = Math.max(0, (users[userIdx].creditLeft || 0) - 5);
        users[userIdx].courseCreated = (users[userIdx].courseCreated || 0) + 1;
        writeDB(users);

        // Update session
        req.session.user.creditLeft    = users[userIdx].creditLeft;
        req.session.user.courseCreated = users[userIdx].courseCreated;

        return res.json({
            success: true,
            courseId,
            courseUrl: `/course/${courseId}`,
            courseName: aiData.title,
            creditLeft: users[userIdx].creditLeft
        });

    } catch (err) {
        console.error("Course generation error:", err.message);
        fs.unlink(filePath, () => {});
        return res.status(500).json({ success: false, message: "Gagal generate course. Coba lagi." });
    }
});

// ── POST /api/course/chat ─────────────────────────────────────
router.post("/course/chat", async (req, res) => {
    if (!req.session.user)
        return res.status(401).json({ success: false, message: "Belum login." });

    const { courseId, message } = req.body;
    if (!courseId || !message)
        return res.status(400).json({ success: false, message: "courseId dan message wajib diisi." });

    const promptPath = path.join(PROMPT_DIR, `${courseId}.md`);
    if (!fs.existsSync(promptPath))
        return res.status(404).json({ success: false, message: "Course tidak ditemukan." });

    const systemPrompt = fs.readFileSync(promptPath, "utf-8");

    try {
        const aiResponse = await axios.post(
            "https://gen.pollinations.ai/v1/chat/completions",
            {
                model: "openai",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user",   content: message }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${POLLINATIONS_API_KEY}`
                },
                timeout: 30000
            }
        );

        const reply = aiResponse.data.choices?.[0]?.message?.content || "Maaf, saya tidak bisa menjawab saat ini.";
        return res.json({ success: true, reply });

    } catch (err) {
        console.error("Course chat error:", err.message);
        return res.status(500).json({ success: false, message: "Gagal menghubungi AI Tutor." });
    }
});

// ── POST /api/course/progress ─────────────────────────────────
router.post("/course/progress", (req, res) => {
    if (!req.session.user)
        return res.status(401).json({ success: false, message: "Belum login." });

    const { courseId, scrollProgress, flashcardsCompleted, quizCompleted, quizScore, lastChapter } = req.body;
    if (!courseId) return res.status(400).json({ success: false, message: "courseId wajib." });

    const email    = req.session.user.email;
    const existing = readProgress(courseId, email) || {
        userEmail: email, courseId,
        scrollProgress: 0, flashcardsCompleted: 0,
        quizCompleted: false, quizScore: 0, lastChapter: 0
    };

    const updated = {
        ...existing,
        ...(scrollProgress      !== undefined && { scrollProgress }),
        ...(flashcardsCompleted !== undefined && { flashcardsCompleted }),
        ...(quizCompleted       !== undefined && { quizCompleted }),
        ...(quizScore           !== undefined && { quizScore }),
        ...(lastChapter         !== undefined && { lastChapter }),
        lastAccess: nowStr()
    };

    writeProgress(courseId, email, updated);
    return res.json({ success: true, progress: updated });
});

// ── GET /api/course/progress/:courseId ───────────────────────
router.get("/course/progress/:courseId", (req, res) => {
    if (!req.session.user)
        return res.status(401).json({ success: false, message: "Belum login." });

    const { courseId } = req.params;
    const email = req.session.user.email;
    const progress = readProgress(courseId, email);
    return res.json({ success: true, progress: progress || null });
});

// ── GET /api/course/data/:courseId ───────────────────────────
router.get("/course/data/:courseId", (req, res) => {
    const { courseId } = req.params;
    const dataPath = path.join(COURSE_DATA_DIR, `${courseId}.json`);
    if (!fs.existsSync(dataPath))
        return res.status(404).json({ success: false, message: "Course data tidak ditemukan." });

    try {
        const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        return res.json({ success: true, data });
    } catch {
        return res.status(500).json({ success: false, message: "Gagal membaca course data." });
    }
});

// ── HTML Builders ─────────────────────────────────────────────
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function buildFlashcardsHtml(flashcards) {
    if (!flashcards.length) return "<p class='text-slate-400 text-center py-10'>Tidak ada flashcard.</p>";

    const cards = flashcards.map((fc, i) => `
<div class="flashcard-wrapper" data-index="${i}">
    <div class="flashcard" onclick="flipCard(this)">
        <div class="flashcard-front">
            <div class="fc-badge">Pertanyaan ${i + 1}</div>
            <p class="fc-text">${escapeHtml(fc.question)}</p>
            <div class="fc-hint"><i class="ph ph-hand-tap"></i> Klik untuk lihat jawaban</div>
        </div>
        <div class="flashcard-back">
            <div class="fc-badge fc-badge-answer">Jawaban</div>
            <p class="fc-text">${escapeHtml(fc.answer)}</p>
            <div class="fc-hint"><i class="ph ph-arrow-counter-clockwise"></i> Klik untuk balik</div>
        </div>
    </div>
</div>`).join("\n");

    return `
<div class="fc-progress-bar-wrap mb-6">
    <div class="flex justify-between text-sm font-semibold text-slate-600 mb-2">
        <span>Progress Flashcard</span>
        <span id="fc-progress-text">0 / ${flashcards.length}</span>
    </div>
    <div class="w-full bg-slate-200 rounded-full h-2">
        <div id="fc-progress-bar" class="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500" style="width:0%"></div>
    </div>
</div>
<div class="flashcards-grid">
${cards}
</div>
<div class="mt-6 text-center">
    <button onclick="resetFlashcards()" class="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm">
        <i class="ph ph-arrow-counter-clockwise mr-1"></i> Reset Semua
    </button>
</div>`;
}

function buildQuizHtml(quiz, courseId) {
    if (!quiz.length) return "<p class='text-slate-400 text-center py-10'>Tidak ada soal quiz.</p>";

    const questions = quiz.map((q, i) => `
<div class="quiz-question" id="qq-${i}" ${i > 0 ? 'style="display:none"' : ''}>
    <div class="quiz-q-header">
        <span class="quiz-q-num">Soal ${i + 1} dari ${quiz.length}</span>
        <div class="quiz-q-progress-wrap">
            <div class="quiz-q-progress-bar" style="width:${((i) / quiz.length) * 100}%"></div>
        </div>
    </div>
    <h3 class="quiz-q-text">${escapeHtml(q.question)}</h3>
    <div class="quiz-options">
        ${q.options.map((opt, oi) => `
        <button class="quiz-option" onclick="selectAnswer(${i}, ${oi}, '${escapeHtml(opt).replace(/'/g, "\\'")}', '${escapeHtml(q.answer).replace(/'/g, "\\'")}')">
            <span class="quiz-opt-letter">${String.fromCharCode(65 + oi)}</span>
            <span>${escapeHtml(opt)}</span>
        </button>`).join("")}
    </div>
</div>`).join("\n");

    return `
<div id="quiz-container" data-course-id="${courseId}" data-total="${quiz.length}">
    ${questions}
    <div id="quiz-result" style="display:none" class="quiz-result-card">
        <div class="quiz-result-icon">🎉</div>
        <h3 class="quiz-result-title">Quiz Selesai!</h3>
        <p class="quiz-result-score" id="quiz-score-text">Skor: 0 / ${quiz.length}</p>
        <div class="quiz-result-bar-wrap">
            <div id="quiz-result-bar" class="quiz-result-bar" style="width:0%"></div>
        </div>
        <p id="quiz-result-pct" class="quiz-result-pct">0%</p>
        <button onclick="retryQuiz()" class="quiz-retry-btn">
            <i class="ph ph-arrow-counter-clockwise mr-2"></i> Coba Lagi
        </button>
    </div>
</div>`;
}

module.exports = router;
