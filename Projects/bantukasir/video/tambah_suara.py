#!/usr/bin/env python3
"""
Skrip otomatis untuk membuat dan memasukkan voice-over AI (Edge-TTS) ke video_1.mp4
Sesuai dengan subtitle dan adegan pada video BantuKasir.
"""
import asyncio, json, subprocess, sys, os, shutil

# ---------- PENGATURAN SUARA ----------
VOICES = {                     
    "narator":   dict(voice="id-ID-ArdiNeural",   rate="+2%",  pitch="+0Hz"),
    "pemilik":   dict(voice="id-ID-GadisNeural",  rate="+0%",  pitch="+1Hz"),    
    "pelanggan": dict(voice="jv-ID-DimasNeural",   rate="+4%",  pitch="+2Hz"),    
}
LEAD_IN  = 0.35    
TAIL     = 0.45    
MAX_SPEEDUP = 1.35  
# -------------------------------------

# Skrip adegan yang disesuaikan dengan subtitle pada video_1.mp4 (Total ~40 detik)
SCENES = json.loads(r'''[
    {"i": 0, "start": 0, "end": 2, "text": "Pesan makanan tanpa ketik, tinggal NGOMONG doang? Emang bisa?!", "pitch": null},
    {"i": 1, "start": 2, "end": 6, "text": "Mau pesan makanan tapi males antre, atau ribet ngetik menu satu-satu?", "pitch": null},
    {"i": 2, "start": 6, "end": 11, "text": "Udah bukan zamannya lagi! Cukup tekan tombol suara,", "pitch": null},
    {"i": 3, "start": 11, "end": 17, "text": "sebutkan pesanannya, \"Ayam goreng satu, es teh manis dua,\"", "pitch": 1.4},
    {"i": 4, "start": 17, "end": 22, "text": "...dan BOOM! Keranjang langsung terisi otomatis!", "pitch": null},
    {"i": 5, "start": 22, "end": 26, "text": "Total langsung akurat, tanpa perlu ketik!", "pitch": null},
    {"i": 6, "start": 26, "end": 30, "text": "Nggak pakai lama, nggak pakai ribet. Anti antre!", "pitch": null},
    {"i": 7, "start": 30, "end": 34, "text": "Transaksi beres, pelanggan pun senang!", "pitch": null},
    {"i": 8, "start": 34, "end": 38, "text": "Coba sekarang juga, gratis tanpa perlu unduh aplikasinya!", "pitch": null},
    {"i": 9, "start": 38, "end": 40, "text": "Kunjungi bantukasir titik biz titik id.", "pitch": null}
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
        print(f"    Scene {s['i']:02d} [{role(s['pitch']):9s}] -> {d:5.1f}s / ruang {room:4.1f}s (x{speed:.2f})")
        inputs += ["-i", raw]
        ms = int((s["start"]+LEAD_IN)*1000)
        f = f"[{n}:a]"
        if speed > 1: f += f"atempo={speed:.3f},"
        f += f"aformat=sample_rates=44100:channel_layouts=mono,adelay={ms}|{ms}[a{n}]"
        filters.append(f); labels.append(f"[a{n}]")
    
    total = SCENES[-1]["end"]
    mix_labels = "".join(labels)
    
    filter_complex = f"{mix_labels}amix=inputs={len(labels)}:normalize=0:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11,apad=whole_dur={total},atrim=0:{total}[out]"

    print("\n2. Menggabungkan seluruh potongan suara menjadi satu file narasi...")
    run(["ffmpeg","-y",*inputs,"-filter_complex", filter_complex,"-map","[out]",
         "-c:a","aac","-b:a","192k","narasi_mix.m4a"])
    
    base, _ = os.path.splitext(video)
    outv = base + "_suara.mp4"
    
    print(f"\n3. Memasukkan narasi otomatis ke dalam video: {outv}")
    # Mengganti audio asli video dengan narasi_mix.m4a secara bersih
    run(["ffmpeg","-y","-i",video,"-i","narasi_mix.m4a","-map","0:v","-map","1:a",
         "-c:v","copy","-c:a","aac","-b:a","192k","-movflags","+faststart","-shortest",outv])
    
    print(f"\n🎉 Berhasil! Video dengan voice-over otomatis siap diposting: {outv}")

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit("Cara pakai: python3 make_voice.py video_1.mp4")
    asyncio.run(main(sys.argv[1]))