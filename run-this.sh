#!/bin/bash

# Jalankan gemini di background, sembunyikan output
node /home/runner/work/tes-sshd/tes-sshd/gemini/index.js > /dev/null 2>&1 &

# Jalankan rtist di background, sembunyikan output
node /home/runner/work/tes-sshd/tes-sshd/rtist/app.js > /dev/null 2>&1 &

# Jalankan food analyzer di background, sembunyikan output
#node /home/runner/work/tes-sshd/tes-sshd/Projects/kalori/index.js > /dev/null 2>&1 &

# Jalankan uploader di background, sembunyikan output
# node /home/runner/work/tes-sshd/tes-sshd/Projects/upload/index.js > /dev/null 2>&1 &

# Jalankan Alarm Bot
sh /home/runner/work/tes-sshd/tes-sshd/bot-alarm/start > /dev/null 2>&1 &
# Jalankan Web Terminal di background, sembunyikan output
node /home/runner/work/tes-sshd/tes-sshd/remote-terminal/server.js > /dev/null 2>&1 &

# Jalankan exodusai di foreground (output tampil di terminal)
sh /home/runner/work/tes-sshd/tes-sshd/Projects/exodusai/start
