#!/usr/bin/env python3
"""
Otomatis menambahkan narasi suara AI (Edge-TTS) & menyelaraskan scene ke video promosi
"""
import asyncio, json, subprocess, sys, os, shutil

# ---------- PENGATURAN SUARA ----------
VOICES = {                     
    "narator":   dict(voice="id-ID-ArdiNeural",  rate="+2%",  pitch="+0Hz"),
    "pemilik":   dict(voice="id-ID-GadisNeural", rate="+0%",  pitch="+1Hz"),   
    "pelanggan": dict(voice="jv-ID-DimasNeural",  rate="+4%",  pitch="+2Hz"),   
}
LEAD_IN  = 0.35    
TAIL     = 0.45    
MAX_SPEEDUP = 1.35  
# -------------------------------------

# Daftar 11 scene (indeks 0 sampai 10, total durasi 40 detik)
SCENES = json.loads(r'''[
    {"i": 0, "start": 0, "end": 3, "text": "Pesan makanan tanpa ketik, tinggal NGOMONG doang? Emang bisa?!", "pitch": 1.4},
    {"i": 1, "start": 3, "end": 6, "text": "Mau pesan makanan tapi males antre...", "pitch": 1.4},
    {"i": 2, "start": 6, "end": 9, "text": "Atau ribet ngetik menu satu-satu?", "pitch": null},
    {"i": 3, "start": 9, "end": 11, "text": "Udah bukan zamannya lagi!", "pitch": null},
    {"i": 4, "start": 11, "end": 15, "text": "Cukup tekan tombol suara, sebutkan pesanannya...", "pitch": 1.4},
    {"i": 5, "start": 15, "end": 18, "text": "Ayam goreng satu, es teh manis dua.", "pitch": 1.4},
    {"i": 6, "start": 18, "end": 23, "text": "...dan BOOM! Keranjang langsung terisi otomatis!", "pitch": 1.4},
    {"i": 7, "start": 23, "end": 27, "text": "Total langsung akurat, tanpa perlu ketik!", "pitch": 0.95},
    {"i": 8, "start": 27, "end": 31, "text": "Nggak pakai lama, nggak pakai ribet, anti antre!", "pitch": null},
    {"i": 9, "start": 31, "end": 35, "text": "Transaksi beres, pelanggan pun senang!", "pitch": null},
    {"i": 10, "start": 35, "end": 40, "text": "Coba sekarang juga, gratis tanpa perlu unduh aplikasinya di bantukasir dot biz dot id!", "pitch": null}
]''')

def role(pitch):
    if pitch is None: return "narator"
    return "pemilik" if pitch < 1 else "pelanggan"

def run(cmd):
    subprocess.run(cmd, check=True)

def dur(path):
    out = subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration",
                                   "-of","default=nw=1:nk=1",path])
    return float(out)

async def make_tts(i, text, cfg, path):
    import edge_tts
    await edge_tts.Communicate(text, cfg["voice"], rate=cfg["rate"], pitch=cfg["pitch"]).save(path)

async def main(video):
    if not shutil.which("ffmpeg"): sys.exit("Error: ffmpeg belum terpasang.")
    os.makedirs("audio_tmp", exist_ok=True)
    inputs, filters, labels = [], [], []
    
    print("1. Membuat file suara AI (Edge-TTS) per scene...")
    for n, s in enumerate(SCENES):
        text = s["text"]; cfg = VOICES[role(s["pitch"])]
        raw = f"audio_tmp/s{s['i']:02d}.mp3"
        await make_tts(s["i"], text, cfg, raw)
        d = dur(raw); room = (s["end"]-s["start"]) - LEAD_IN - TAIL
        speed = 1.0
        if d > room: speed = min(MAX_SPEEDUP, d/room)
        print(f"   Scene {s['i']:02d} [{role(s['pitch']):9s}] -> {d:5.1f}s / ruang {room:4.1f}s (x{speed:.2f})")
        
        inputs += ["-i", raw]
        ms = int((s["start"]+LEAD_IN)*1000)
        
        # Format filter per input audio
        f = f"[{n}:a]"
        if speed > 1: f += f"atempo={speed:.3f},"
        f += f"aformat=sample_rates=44100:channel_layouts=mono,adelay={ms}|{ms}[a{n}]"
        filters.append(f)
        labels.append(f"[a{n}]")
    
    total = SCENES[-1]["end"]
    # Gabungkan semua label audio misal: [a0][a1][a2]...[a10]
    mix_labels = "".join(labels)
    
    # Gabungkan filter lengkap dengan jumlah input yang dinamis sesuai panjang `labels`
    filter_graph = ";".join(filters) + f";{mix_labels}amix=inputs={len(labels)}:normalize=0:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11,apad=whole_dur={total},atrim=0:{total}[out]"

    print("\n2. Menggabungkan seluruh potongan suara menjadi satu file narasi...")
    run(["ffmpeg","-y",*inputs,"-filter_complex", filter_graph,"-map","[out]",
         "-c:a","aac","-b:a","192k","narasi_mix.m4a"])
    
    base, _ = os.path.splitext(video)
    outv = base + "_suara.mp4"
    
    print(f"\n3. Memasukkan narasi otomatis ke dalam video: {outv}")
    run(["ffmpeg","-y","-i",video,"-i","narasi_mix.m4a","-map","0:v","-map","1:a",
         "-c:v","copy","-c:a","aac","-b:a","192k","-movflags","+faststart","-shortest",outv])
    
    print(f"\n🎉 Berhasil! Video dengan voice-over baru siap digunakan: {outv}")

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit("Cara pakai: python3 tambah_suara.py BantuKasir-promo-HQ.mp4")
    asyncio.run(main(sys.argv[1]))