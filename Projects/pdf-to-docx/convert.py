import sys
from pdf2docx import Converter

if len(sys.argv) != 3:
    print("Usage: python convert.py input.pdf output.docx")
    sys.exit(1)

pdf_path = sys.argv[1]
output_path = sys.argv[2]

try:
    print(f"🚀 Mengonversi {pdf_path} → {output_path} ...")
    cv = Converter(pdf_path)
    cv.convert(output_path, start=0, end=None)  # konversi semua halaman
    cv.close()
    print(f"✅ Konversi selesai: {output_path}")
    sys.exit(0)
except Exception as e:
    print("❌ Error:", e)
    sys.exit(1)
