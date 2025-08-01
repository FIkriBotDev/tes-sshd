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

// Util: Download file from URL
const downloadFile = async (url, outputPath) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(outputPath, response.data);
};

// Util: Extract plain text from .docx
const extractDocxText = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

// Util: Jalankan Python script
const runPythonScript = (code, inputPath, callback) => {
  const fileId = uuidv4();
  const scriptPath = `/tmp/script-${fileId}.py`;
  const outputDocx = `${TMP_DIR}/hasil-${fileId}.docx`;

  const finalCode = code
    .replace(/Document\(['"](.+?)['"]\)/, `Document("${inputPath}")`)
    .replace(/doc\.save\(['"](.+?)['"]\)/, `doc.save("${outputDocx}")`);

  fs.writeFileSync(scriptPath, finalCode);
  console.log("=== PYTHON SCRIPT ===\n", finalCode);

  const python = spawn("python3", [scriptPath]);

  python.stdout.on("data", (data) => console.log(`PYTHON STDOUT: ${data}`));
  python.stderr.on("data", (data) => console.error(`PYTHON ERROR: ${data}`));

  python.on("close", (code) => {
    console.log(`PYTHON EXIT CODE: ${code}`);
    if (fs.existsSync(outputDocx)) {
      callback(null, outputDocx);
    } else {
      callback(new Error("Python script failed or no output generated."));
    }
  });
};

// Clean blok kode dari AI
const cleanCodeBlock = (code = "") =>
  code.replace(/^```(python)?\n/, "").replace(/```$/, "").trim();

// Request AI (with fallback)
const requestAIWithFallback = async (messages) => {
  try {
    const res = await axios.post("https://rtist-api.exoduscloud.my.id/post/rtist", { messages });
    console.log("=== RESPONSE RTIST (messages) ===\n", res.data);
    const rawCode = res.data.result || res.data.response;
    if (!rawCode) throw new Error("AI tidak memberikan kode");

    const code = cleanCodeBlock(rawCode);
    if (!code.includes("doc.save")) throw new Error("Kode AI tidak valid");
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
    if (!code.includes("doc.save")) throw new Error("Kode AI fallback tidak valid");
    return code;
  }
};

// Endpoint: /api/edit (langsung download file hasil)
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

    runPythonScript(code, localPath, (err, outputPath) => {
      if (err) {
        console.error("GAGAL MENJALANKAN PYTHON:", err);
        return res.status(500).send("Gagal menjalankan script python.");
      }

      console.log("=== FILE SIAP DIUNDUH ===\n", outputPath);
      res.download(outputPath); // langsung kirim file sebagai download
    });
  } catch (e) {
    console.error("ERROR:", e.message || e);
    res.status(500).send("Terjadi kesalahan saat memproses dokumen.");
  }
});

// Endpoint: /api/buat
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

    runPythonScript(code, dummyInput, (err, outputPath) => {
      if (err) {
        console.error("GAGAL MENJALANKAN PYTHON:", err);
        return res.status(500).send("Gagal menjalankan script python.");
      }

      console.log("=== FILE SIAP DIUNDUH ===\n", outputPath);
      res.download(outputPath); // langsung kirim file
    });
  } catch (e) {
    console.error("ERROR:", e.message || e);
    res.status(500).send("Terjadi kesalahan saat membuat dokumen.");
  }
});

app.listen(port, () => {
  console.log(`Docx-AI server listening at http://localhost:${port}`);
});
