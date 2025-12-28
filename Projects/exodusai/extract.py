import sys
import json
import os

import pdfplumber
from docx import Document


def extract_pdf(file_path):
    text = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
    return "\n".join(text)


def extract_docx(file_path):
    doc = Document(file_path)
    text = []
    for para in doc.paragraphs:
        if para.text.strip():
            text.append(para.text)
    return "\n".join(text)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "status": "error",
            "message": "No file path provided"
        }))
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        print(json.dumps({
            "status": "error",
            "message": "File not found"
        }))
        sys.exit(1)

    ext = os.path.splitext(file_path)[1].lower()

    try:
        if ext == ".pdf":
            content = extract_pdf(file_path)
        elif ext == ".docx":
            content = extract_docx(file_path)
        else:
            print(json.dumps({
                "status": "error",
                "message": "Unsupported file type"
            }))
            sys.exit(1)

        # Bersihkan text
        content = content.replace("\r", "").strip()

        print(json.dumps({
            "status": "success",
            "text": content
        }))

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
