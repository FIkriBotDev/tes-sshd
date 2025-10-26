#!/bin/bash
# Install AI Docx
pip install python-docx mammoth openpyxl

# Jalankan gemini di background, sembunyikan output
node /home/runner/work/tes-sshd/tes-sshd/gemini/index.js > /dev/null 2>&1 &

# Jalankan rtist di background, sembunyikan output
node /home/runner/work/tes-sshd/tes-sshd/rtist/app.js > /dev/null 2>&1 &

# Jalankan food analyzer di background, sembunyikan output
node /home/runner/work/tes-sshd/tes-sshd/Projects/kalori/index.js > /dev/null 2>&1 &

# Jalankan AI Docx
sh /home/runner/work/tes-sshd/tes-sshd/Projects/ai-docx/start > /dev/null 2>&1 &

# Jalankan uploader di background, sembunyikan output
node /home/runner/work/tes-sshd/tes-sshd/Projects/upload/index.js > /dev/null 2>&1 &

# Jalankan Alarm Bot
#sh /home/runner/work/tes-sshd/tes-sshd/bot-alarm/start > /dev/null 2>&1 &

# Install express untuk Invoice Bot
cd /home/runner/work/tes-sshd/tes-sshd/Projects/invoice-saas-json-wa
npm install express
cd /home/runner/work/tes-sshd/tes-sshd

# Jalankan Invoice Bot
sh /home/runner/work/tes-sshd/tes-sshd/Projects/invoice-saas-json-wa/start > /dev/null 2>&1 &

# Jalankan Web Terminal di background, sembunyikan output
node /home/runner/work/tes-sshd/tes-sshd/remote-terminal/server.js > /dev/null 2>&1 &

# Jalankan Web Invoice Generator di background, sembunyikan output
sh /home/runner/work/tes-sshd/tes-sshd/Projects/invoice-generator/start > /dev/null 2>&1 &

# Jalankan Web Chart-Analyzer di background, sembunyikan output
sh /home/runner/work/tes-sshd/tes-sshd/Projects/chart-analyzer/start > /dev/null 2>&1 &

# Jalankan Web Reminder-App di background, sembunyikan output
sh /home/runner/work/tes-sshd/tes-sshd/Projects/reminder-wa-app/start > /dev/null 2>&1 &

# Jalankan Web ExodusAI di background, sembunyikan output
sh /home/runner/work/tes-sshd/tes-sshd/Projects/www-exodusai/start > /dev/null 2>&1 &

# Jalankan Web Photo 2 PDF di background, sembunyikan output
sh /home/runner/work/tes-sshd/tes-sshd/Projects/photo-to-pdf/start > /dev/null 2>&1 &

# Jalankan exodusai di foreground (output tampil di terminal)
sh /home/runner/work/tes-sshd/tes-sshd/Projects/exodusai/start > /dev/null 2>&1 &
