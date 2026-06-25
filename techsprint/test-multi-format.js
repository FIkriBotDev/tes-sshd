// ============================================================
// test-multi-format.js - Test script untuk Multi Format Upload
// ============================================================

const { extractDocument, getFileTypeFromMimetype } = require('./services/documentExtractor');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

async function testExtraction(filePath, expectedType) {
    const fileName = path.basename(filePath);
    
    console.log(`\n${colors.blue}📄 Testing: ${fileName}${colors.reset}`);
    console.log(`   Expected type: ${expectedType}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`   ${colors.red}✗ File not found!${colors.reset}`);
        return false;
    }
    
    try {
        const result = await extractDocument(filePath, expectedType);
        const textLength = result.text.length;
        const preview = result.text.substring(0, 100).replace(/\n/g, ' ');
        
        console.log(`   ${colors.green}✓ Success!${colors.reset}`);
        console.log(`   Text length: ${textLength} characters`);
        console.log(`   Preview: "${preview}..."`);
        return true;
    } catch (error) {
        console.log(`   ${colors.red}✗ Error: ${error.message}${colors.reset}`);
        return false;
    }
}

async function testMimeTypes() {
    console.log(`\n${colors.yellow}Testing MIME type detection...${colors.reset}`);
    
    const tests = [
        { mime: 'application/pdf', expected: 'pdf' },
        { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', expected: 'docx' },
        { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', expected: 'pptx' },
        { mime: 'text/plain', expected: null }
    ];
    
    tests.forEach(test => {
        const result = getFileTypeFromMimetype(test.mime);
        const passed = result === test.expected;
        const status = passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
        console.log(`   ${status} ${test.mime.substring(0, 50)}... => ${result || 'null'}`);
    });
}

async function runTests() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.yellow}JadiKelas v2.1 - Multi Format Upload Test${colors.reset}`);
    console.log(`${'='.repeat(60)}`);
    
    // Test MIME types
    await testMimeTypes();
    
    // Test file extraction
    console.log(`\n${colors.yellow}Testing document extraction...${colors.reset}`);
    
    const uploadsDir = path.join(__dirname, 'uploads');
    
    // Find sample files
    const files = fs.readdirSync(uploadsDir);
    
    // Test PDF
    const pdfFile = files.find(f => f.endsWith('.pdf'));
    if (pdfFile) {
        await testExtraction(path.join(uploadsDir, pdfFile), 'pdf');
    } else {
        console.log(`\n${colors.yellow}⚠ No PDF file found in uploads/${colors.reset}`);
    }
    
    // Test DOCX
    const docxFile = files.find(f => f.endsWith('.docx'));
    if (docxFile) {
        await testExtraction(path.join(uploadsDir, docxFile), 'docx');
    } else {
        console.log(`\n${colors.yellow}⚠ No DOCX file found in uploads/${colors.reset}`);
    }
    
    // Test PPTX
    const pptxFile = files.find(f => f.endsWith('.pptx'));
    if (pptxFile) {
        await testExtraction(path.join(uploadsDir, pptxFile), 'pptx');
    } else {
        console.log(`\n${colors.yellow}⚠ No PPTX file found in uploads/${colors.reset}`);
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.green}Test completed!${colors.reset}`);
    console.log(`${'='.repeat(60)}\n`);
}

// Run tests
runTests().catch(err => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, err);
    process.exit(1);
});
