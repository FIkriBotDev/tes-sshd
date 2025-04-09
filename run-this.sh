#!/bin/bash

# Jalankan gemini di background, sembunyikan output
node /home/runner/work/tes-sshd/tes-sshd/gemini/index.js > /dev/null 2>&1 &

# Jalankan rtist di background, sembunyikan output
node /home/runner/work/tes-sshd/tes-sshd/rtist/app.js > /dev/null 2>&1 &

# Jalankan food analyzer di background, sembunyikan output
node /home/runner/work/tes-sshd/tes-sshd/Projects/kalori/index.js > /dev/null 2>&1 &

# Jalankan exodusai di foreground (output tampil di terminal)
sh /home/runner/work/tes-sshd/tes-sshd/Projects/exodusai/start
