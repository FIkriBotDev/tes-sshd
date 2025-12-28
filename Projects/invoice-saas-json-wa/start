#!/bin/bash

# Path lengkap ke file Node.js
SCRIPT="/home/runner/work/tes-sshd/tes-sshd/Projects/invoice-saas-json-wa/src/server.js"

# Jalankan npm install express hanya sekali di awal
echo "Menginstall express..."
npm install express

# Fungsi untuk menjalankan skrip Node.js
run_script() {
    node "$SCRIPT"
}

# Loop untuk memonitor dan menjalankan ulang skrip jika mengalami masalah
while true; do
    run_script

    # Jika skrip berhenti (crash), tunggu 3 detik sebelum menjalankannya lagi
    echo "Skrip crashed atau berhenti, mencoba untuk memulai ulang dalam 3 detik..."
    sleep 3
done
