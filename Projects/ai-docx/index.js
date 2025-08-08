import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import mammoth from "mammoth";
import { spawn } from "child_process";
import multer from "multer";

const app = express();
const port = 1000;

const TMP_DIR = "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-docx/tmp";
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

app.use(express.json());
const upload = multer({ dest: "/tmp" });

// Util: Download file dari URL
const downloadFile = async (url, outputPath) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(outputPath, response.data);
};

// Util: Ekstrak text dari .docx
const extractDocxText = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

// Util: Bersihkan blok kode Python
const cleanCodeBlock = (code = "") =>
  code.replace(/^```(python)?\n/, "").replace(/```$/, "").trim();

// Util: Jalankan AI request dengan fallback
const requestAIWithFallback = async (messages) => {
  try {
    const res = await axios.post("https://rtist-api.exoduscloud.my.id/post/rtist", { messages });
    console.log("=== RESPONSE RTIST (messages) ===\n", res.data);
    const rawCode = res.data.result || res.data.response;
    if (!rawCode) throw new Error("AI tidak memberikan kode");

    const code = cleanCodeBlock(rawCode);
    return code;
  } catch (err) {
    console.warn("Fallback ke conversation mode...");
    const res = await axios.post("https://rtist-api.exoduscloud.my.id/post/rtist", {
      conversation: messages,
    });
    console.log("=== RESPONSE RTIST (conversation) ===\n", res.data);
    const rawCode = res.data.result || res.data.response;
    if (!rawCode) throw new Error("Fallback AI tidak memberikan kode");

    const code = cleanCodeBlock(rawCode);
    return code;
  }
};

// Endpoint: /api/edit (untuk .docx)
app.get("/api/edit", async (req, res) => {
  try {
    const { documentUrl, prompt } = req.query;
    if (!documentUrl || !prompt) return res.status(400).send("Missing parameters.");

    const localPath = `/tmp/${path.basename(documentUrl)}`;
    await downloadFile(documentUrl, localPath);
    const docxContent = (await extractDocxText(localPath)).slice(0, 2000);

    console.log("=== ISI DOKUMEN ===\n", docxContent);

    const messages = [
      { role: "system", content: "Kamu adalah AI khusus untuk mengedit file .docx menggunakan python." },
      { role: "user", content: `Isi dokumen:\n${docxContent}` },
      { role: "user", content: `Permintaan: ${prompt}` },
      { role: "user", content: "Cukup berikan kode python saja tanpa penjelasan." },
    ];

    const code = await requestAIWithFallback(messages);
    console.log("=== FINAL KODE YANG DIEKSEKUSI ===\n", code);

    const fileId = uuidv4();
    const scriptPath = `/tmp/script-${fileId}.py`;
    const outputDocx = `${TMP_DIR}/hasil-${fileId}.docx`;

    let finalCode = code
      .replace(/dokumen_path\s*=.*\n?/g, '')
      .replace(/Document\(['"](.+?)['"]\)/, `Document("${localPath}")`)
      .replace(/doc\.save\((.*?)\)/g, `doc.save("${outputDocx}")`);

    fs.writeFileSync(scriptPath, finalCode);
    const python = spawn("python3", [scriptPath]);

    python.stdout.on("data", (data) => console.log(`PYTHON STDOUT: ${data}`));
    python.stderr.on("data", (data) => console.error(`PYTHON ERROR: ${data}`));

    python.on("close", (code) => {
      console.log(`PYTHON EXIT CODE: ${code}`);
      if (fs.existsSync(outputDocx)) {
        res.download(outputDocx);
      } else {
        res.status(500).send("Gagal menjalankan script python.");
      }
    });
  } catch (e) {
    console.error("ERROR:", e.message || e);
    res.status(500).send("Terjadi kesalahan saat memproses dokumen.");
  }
});

// Endpoint: /api/buat (.docx)
app.get("/api/buat", async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) return res.status(400).send("Prompt kosong.");

    const messages = [
      { role: "system", content: "Kamu adalah AI khusus untuk membuat file .docx menggunakan python." },
      { role: "user", content: prompt },
      { role: "user", content: "Cukup kirimkan kode python tanpa penjelasan." },
    ];

    const code = await requestAIWithFallback(messages);
    console.log("=== FINAL KODE YANG DIEKSEKUSI ===\n", code);

    const dummyInput = "/tmp/template-blank.docx";
    fs.writeFileSync(dummyInput, "");

    const fileId = uuidv4();
    const scriptPath = `/tmp/script-${fileId}.py`;
    const outputDocx = `${TMP_DIR}/hasil-${fileId}.docx`;

    let finalCode = code
      .replace(/doc\.save\((.*?)\)/g, `doc.save("${outputDocx}")`);

    fs.writeFileSync(scriptPath, finalCode);
    const python = spawn("python3", [scriptPath]);

    python.stdout.on("data", (data) => console.log(`PYTHON STDOUT: ${data}`));
    python.stderr.on("data", (data) => console.error(`PYTHON ERROR: ${data}`));

    python.on("close", (code) => {
      console.log(`PYTHON EXIT CODE: ${code}`);
      if (fs.existsSync(outputDocx)) {
        res.download(outputDocx);
      } else {
        res.status(500).send("Gagal menjalankan script python.");
      }
    });
  } catch (e) {
    console.error("ERROR:", e.message || e);
    res.status(500).send("Terjadi kesalahan saat membuat dokumen.");
  }
});

// Endpoint: /api/buat/excel (.xlsx)
app.get("/api/buat/excel", async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) return res.status(400).send("Prompt kosong.");

    const messages = [
      { role: "system", content: "Kamu adalah AI yang membuat file Excel (.xlsx) menggunakan Python dan library openpyxl." },
      { role: "user", content: prompt },
      { role: "user", content: "Cukup berikan kode python saja tanpa penjelasan." },
    ];

    const code = await requestAIWithFallback(messages);
    console.log("=== FINAL KODE YANG DIEKSEKUSI ===\n", code);

    const dummyInput = "/tmp/template-blank.xlsx";
    fs.writeFileSync(dummyInput, "");

    const fileId = uuidv4();
    const scriptPath = `/tmp/script-${fileId}.py`;
    const outputXlsx = `${TMP_DIR}/hasil-${fileId}.xlsx`;

    let finalCode = code
      .replace(/file_path\s*=.*\n?/g, '') // Hapus jika ada deklarasi file_path
      .replace(/workbook\.save\((.*?)\)/g, `workbook.save("${outputXlsx}")`);

    fs.writeFileSync(scriptPath, finalCode);
    const python = spawn("python3", [scriptPath]);

    python.stdout.on("data", (data) => console.log(`PYTHON STDOUT: ${data}`));
    python.stderr.on("data", (data) => console.error(`PYTHON ERROR: ${data}`));

    python.on("close", (code) => {
      console.log(`PYTHON EXIT CODE: ${code}`);
      if (fs.existsSync(outputXlsx)) {
        res.download(outputXlsx);
      } else {
        res.status(500).send("Gagal menjalankan script python atau file tidak dibuat.");
      }
    });
  } catch (e) {
    console.error("ERROR:", e.message || e);
    res.status(500).send("Terjadi kesalahan saat membuat file Excel.");
  }
});

app.listen(port, () => {
  console.log(`Docx-AI server listening at http://localhost:${port}`);
});
