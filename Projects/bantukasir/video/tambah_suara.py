#!/usr/bin/env python3
"""
Tambah narasi suara (bahasa Indonesia) & backsound ke video BantuKasir
"""
import asyncio, json, subprocess, sys, os, shutil

# ---------- PENGATURAN (silakan ubah) ----------
VOICES = {                     
    "narator":   dict(voice="id-ID-ArdiNeural",  rate="+2%",  pitch="+0Hz"),
    "pemilik":   dict(voice="id-ID-GadisNeural", rate="+0%",  pitch="+1Hz"),   
    "pelanggan": dict(voice="jv-ID-DimasNeural",  rate="+4%",  pitch="+2Hz"),   
}
LEAD_IN  = 0.35    
TAIL     = 0.45    
MAX_SPEEDUP = 1.35  

BACKSOUND_FILE = "backsound.mp3"  # Pastikan file ini ada (bisa pakai backsound_fixed.mp3 yang sudah di-rename)
BACKSOUND_VOLUME = 0.12           
# -----------------------------------------------

SCENES = json.loads(r'''[
    {"i": 0, "start": 0, "end": 7, "text": "Jam enam pagi, warung Bu Siti buka. Hari ini untung berapa, ya?", "pitch": null},
    {"i": 1, "start": 7, "end": 14, "text": "Dulu, catat di buku. Lupa satu. Salah hitung.", "pitch": null},
    {"i": 2, "start": 14, "end": 22, "text": "Kenalkan, BantuKasir. Tahu untung hari ini, sebelum warung tutup. Langsung dari browser, tanpa unduh.", "pitch": null},
    {"i": 3, "start": 22, "end": 32, "text": "Buka berandanya. Untung hari ini terlihat, lengkap dengan penyebab dan saran untuk hari ini.", "pitch": null},
    {"i": 4, "start": 32, "end": 44, "text": "Catat jualan di Kasir. Ketuk produk, cek keranjang, pilih tunai atau QRIS, lalu simpan. Penjualan tersimpan, struk jadi.", "pitch": null},
    {"i": 5, "start": 44, "end": 52, "text": "Bagaimana kalau internet tiba-tiba mati? Tenang! Tetap bisa jualan seperti biasa. Transaksi tersimpan aman di HP, dan otomatis sinkron saat internet aktif kembali.", "pitch": null},
    {"i": 6, "start": 52, "end": 60, "text": "Produk dan stok tertata rapi. Mau tambah produk baru? Cukup isi nama dan foto.", "pitch": null},
    {"i": 7, "start": 60, "end": 66, "text": "Selamat siang, Kak! Mau pesan apa? Scan barcode di meja ini ya, tidak perlu antre.", "pitch": 0.95},
    {"i": 8, "start": 66, "end": 70, "text": "Oke, Bu. Saya scan barcode-nya dulu.", "pitch": 1.4},
    {"i": 9, "start": 70, "end": 78, "text": "Menu warung langsung terbuka. Saya pilih ayam goreng dan matcha latte. Totalnya tiga puluh ribu.", "pitch": 1.4},
    {"i": 10, "start": 78, "end": 88, "text": "Atau lebih praktis lagi, tekan Pesan dengan Suara, lalu bilang: ayam goreng satu, kopi hitam satu. Keranjang langsung terisi, totalnya dua puluh ribu.", "pitch": 1.4},
    {"i": 11, "start": 88, "end": 94, "text": "Lalu isi nama saya, Rofi, dan tekan Kirim Pesanan.", "pitch": 1.4},
    {"i": 12, "start": 94, "end": 100, "text": "Pesanan nomor delapan enam tiga sudah masuk di kasir saya. Pembayaran lewat QRIS, ya, Kak.", "pitch": 0.95},
    {"i": 13, "start": 100, "end": 106, "text": "Sudah, Bu! Pembayaran selesai. Terima kasih!", "pitch": 1.4},
    {"i": 14, "start": 106, "end": 110, "text": "Terima kasih, Kak! Pesanannya segera saya antar.", "pitch": 0.95},
    {"i": 15, "start": 110, "end": 122, "text": "Laporan lengkap: pendapatan, laba bersih, grafik tujuh hari, penjualan per kategori, modal dan biaya, sampai produk terlaris.", "pitch": null},
    {"i": 16, "start": 122, "end": 132, "text": "Semua transaksi tercatat di riwayat. Atur nama usaha, QRIS toko, dan pajak sesuai kebutuhan.", "pitch": null},
    {"i": 17, "start": 132, "end": 138, "text": "Ada pelanggan yang utang? Catat di kasbon, semuanya tercatat rapi.", "pitch": null},
    {"i": 18, "start": 138, "end": 141, "text": "Coba gratis di bantukasir titik biz titik id.", "pitch": null}
]''')

def role(pitch):
    if pitch is None: return "narator"
    return "pemilik" if pitch < 1 else "pelanggan"

def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def dur(path):
    out = subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration",
                                   "-of","default=nw=1:nk=1",path])
    return float(out)

async def make_tts(i, text, cfg, path):
    if os.environ.get("FAKE_TTS") == "1":
        run(["ffmpeg","-y","-f","lavfi","-i",f"sine=frequency={300+40*i}:duration={len(text)*0.075:.2f}",path]); return
    import edge_tts
    await edge_tts.Communicate(text, cfg["voice"], rate=cfg["rate"], pitch=cfg["pitch"]).save(path)

async def main(video):
    if not shutil.which("ffmpeg"): sys.exit("ffmpeg belum terpasang.")
    os.makedirs("audio_tmp", exist_ok=True)
    inputs, filters, labels = [], [], []
    
    for n, s in enumerate(SCENES):
        text = s["text"]; cfg = VOICES[role(s["pitch"])]
        raw = f"audio_tmp/s{s['i']:02d}.mp3"
        await make_tts(s["i"], text, cfg, raw)
        d = dur(raw); room = (s["end"]-s["start"]) - LEAD_IN - TAIL
        speed = 1.0
        if d > room: speed = min(MAX_SPEEDUP, d/room)
        print(f"scene {s['i']:02d} [{role(s['pitch']):9s}] {d:5.1f}s / ruang {room:4.1f}s  x{speed:.2f}")
        inputs += ["-i", raw]
        ms = int((s["start"]+LEAD_IN)*1000)
        f = f"[{n}:a]"
        if speed > 1: f += f"atempo={speed:.3f},"
        f += f"aformat=sample_rates=44100:channel_layouts=mono,adelay={ms}|{ms}[a{n}]"
        filters.append(f); labels.append(f"[a{n}]")
    
    total = SCENES[-1]["end"]
    mix_labels = "".join(labels)
    
    has_backsound = os.path.exists(BACKSOUND_FILE)
    
    if has_backsound:
        print(f"Menggunakan backsound: {BACKSOUND_FILE}")
        # Gunakan -stream_loop -1 SEBELUM -i agar backsound otomatis melingkar (looping) tanpa error filter
        inputs += ["-stream_loop", "-1", "-i", BACKSOUND_FILE]
        bs_idx = len(labels)
        filter_complex = (
            f"{mix_labels}amix=inputs={len(labels)}:normalize=0:dropout_transition=0,aformat=sample_rates=44100:channel_layouts=stereo[voice_mix];"
            f"[{bs_idx}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume={BACKSOUND_VOLUME},atrim=0:{total}[bs];"
            f"[voice_mix][bs]amix=inputs=2:weights=1|1,loudnorm=I=-16:TP=-1.5:LRA=11,apad=whole_dur={total},atrim=0:{total}[out]"
        )
    else:
        print(f"Catatan: File '{BACKSOUND_FILE}' tidak ditemukan. Video akan diproses tanpa backsound.")
        filter_complex = (
            f"{mix_labels}amix=inputs={len(labels)}:normalize=0:dropout_transition=0,"
            f"loudnorm=I=-16:TP=-1.5:LRA=11,apad=whole_dur={total},atrim=0:{total}[out]"
        )

    run(["ffmpeg","-y",*inputs,"-filter_complex", filter_complex,"-map","[out]",
         "-c:a","aac","-b:a","192k","narasi_mix.m4a"])
    
    base, _ = os.path.splitext(video)
    outv = base + "_suara.mp4"
    run(["ffmpeg","-y","-i",video,"-i","narasi_mix.m4a","-map","0:v","-map","1:a",
         "-c:v","copy","-c:a","aac","-b:a","192k","-movflags","+faststart","-shortest",outv])
    print("\nSelesai ->", outv)

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(__doc__)
    asyncio.run(main(sys.argv[1]))