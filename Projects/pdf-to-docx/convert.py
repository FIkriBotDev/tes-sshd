import re
from docx import Document
from PyPDF2 import PdfReader

def clean_text(text):
    # Hapus karakter non-printable (kecuali newline dan tab)
    return re.sub(r'[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]', '', text)

pdf_path = "uploads/f71668ccee87104b1ebd7bf54190ffdb"
docx_path = "output/1760585686293.docx"

reader = PdfReader(pdf_path)
doc = Document()

for page in reader.pages:
    text = page.extract_text()
    if text:
        cleaned = clean_text(text)
        doc.add_paragraph(cleaned)

doc.save(docx_path)
print("✅ Konversi selesai:", docx_path)
