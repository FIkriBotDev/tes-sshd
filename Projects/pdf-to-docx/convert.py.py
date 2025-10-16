import sys
from pdfminer.high_level import extract_text
from docx import Document

if len(sys.argv) != 3:
    print("Usage: python convert.py input.pdf output.docx")
    sys.exit(1)

pdf_path = sys.argv[1]
output_path = sys.argv[2]

try:
    text = extract_text(pdf_path)
    doc = Document()
    doc.add_paragraph(text)
    doc.save(output_path)
    sys.exit(0)
except Exception as e:
    print("Error:", e)
    sys.exit(1)
