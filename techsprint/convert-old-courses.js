// Script untuk convert course lama ke format baru
const fs = require('fs');
const path = require('path');

const COURSE_DATA_DIR = path.join(__dirname, 'course-data');
const GENERATED_DIR = path.join(__dirname, 'generated-course');
const TEMPLATE_PATH = path.join(__dirname, 'course_template', 'index.html');
const STUDENTS_DIR = path.join(__dirname, 'course-students');

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function convertOldToNew(oldData) {
    // Convert old format (chapters) to new format (learningBlocks)
    const learningBlocks = [];
    
    if (oldData.chapters && Array.isArray(oldData.chapters)) {
        oldData.chapters.forEach((chapter, idx) => {
            // Convert chapter HTML content to concept_card
            learningBlocks.push({
                type: 'concept_card',
                title: chapter.title,
                icon: idx === 0 ? '📘' : idx === 1 ? '📗' : '📙',
                explanation: chapter.content.replace(/<[^>]*>/g, '').substring(0, 500),
                keyPoints: extractKeyPoints(chapter.content)
            });
        });
    }
    
    // Add flashcards and quiz with new format
    const flashcards = oldData.flashcards ? oldData.flashcards.map(fc => ({
        ...fc,
        emoji: '💡',
        difficulty: 'medium'
    })) : [];
    
    const quiz = oldData.quiz ? oldData.quiz.map(q => ({
        ...q,
        explanation: 'Jawaban ini benar berdasarkan materi yang telah dipelajari.',
        xpReward: 50
    })) : [];
    
    return {
        title: oldData.title || 'Course',
        summary: oldData.summary || '',
        emoji: '📚',
        color: '#6366f1',
        learningBlocks,
        flashcards,
        quiz,
        achievements: [],
        tutorContext: oldData.tutorContext || oldData.summary || ''
    };
}

function extractKeyPoints(htmlContent) {
    // Extract key points from HTML
    const points = [];
    const matches = htmlContent.match(/<strong>(.*?)<\/strong>/g);
    if (matches) {
        matches.slice(0, 3).forEach(m => {
            const clean = m.replace(/<[^>]*>/g, '');
            if (clean.length > 10 && clean.length < 100) {
                points.push(clean);
            }
        });
    }
    return points.length > 0 ? points : ['Poin penting dari materi'];
}

function regenerateCourse(courseId) {
    console.log(`\n🔄 Processing course: ${courseId}`);
    
    // Read old course data
    const dataPath = path.join(COURSE_DATA_DIR, `${courseId}.json`);
    if (!fs.existsSync(dataPath)) {
        console.log(`❌ Course data not found: ${courseId}`);
        return false;
    }
    
    const oldData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Check if already new format
    if (oldData.learningBlocks) {
        console.log(`✅ Already new format: ${courseId}`);
        return true;
    }
    
    console.log(`🔧 Converting to new format...`);
    
    // Convert to new format
    const newData = convertOldToNew(oldData);
    
    // Save converted data
    fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2));
    console.log(`✅ Data converted and saved`);
    
    // Regenerate HTML
    let templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    
    const courseJson = JSON.stringify(newData);
    templateHtml = templateHtml
        .replace(/\{\{courseTitle\}\}/g, escapeHtml(newData.title))
        .replace(/\{\{courseEmoji\}\}/g, newData.emoji || '📚')
        .replace(/\{\{courseColor\}\}/g, newData.color || '#6366f1')
        .replace('<!-- COURSE_DATA_INJECT -->',
            `<script>const COURSE_ID = "${courseId}"; const COURSE_DATA = ${courseJson};</script>`);
    
    const generatedPath = path.join(GENERATED_DIR, `${courseId}.html`);
    fs.writeFileSync(generatedPath, templateHtml);
    console.log(`✅ HTML regenerated`);
    
    // Init student database if not exists
    const studentsPath = path.join(STUDENTS_DIR, `database_siswa_${courseId}.json`);
    if (!fs.existsSync(studentsPath)) {
        fs.writeFileSync(studentsPath, JSON.stringify([], null, 2));
        console.log(`✅ Student database initialized`);
    }
    
    return true;
}

// Main
console.log('🚀 Converting old courses to new format...\n');

const courseFiles = fs.readdirSync(COURSE_DATA_DIR).filter(f => f.endsWith('.json'));
console.log(`Found ${courseFiles.length} courses\n`);

let converted = 0;
let skipped = 0;

courseFiles.forEach(file => {
    const courseId = file.replace('.json', '');
    const result = regenerateCourse(courseId);
    if (result) converted++;
    else skipped++;
});

console.log(`\n✅ Conversion complete!`);
console.log(`   Converted: ${converted}`);
console.log(`   Skipped: ${skipped}`);
console.log(`\n🎉 All courses are now in new format!`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Restart server: node index.js`);
console.log(`   2. Open course URL in browser`);
console.log(`   3. Register as student and test!`);
