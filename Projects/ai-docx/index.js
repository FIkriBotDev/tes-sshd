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

const downloadFile = async (url, outputPath) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(outputPath, response.data);
};

const extractDocxText = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

const cleanCodeBlock = (code = "") =>
  code.replace(/^```(python)?\n/, "").replace(/```$/, "").trim();

const requestAIWithFallback = async (messages) => {
  try {
    const res = await axios.post("https://rtist-api.exodusai.biz.id/post/rtist", { messages });
    const rawCode = res.data.result || res.data.response;
    if (!rawCode) throw new Error("AI tidak memberikan kode");
    return cleanCodeBlock(rawCode);
  } catch {
    const res = await axios.post("https://rtist-api.exodusai.biz.id/post/rtist", { conversation: messages });
    const rawCode = res.data.result || res.data.response;
    if (!rawCode) throw new Error("Fallback AI tidak memberikan kode");
    return cleanCodeBlock(rawCode);
  }
};

const cleanOldFiles = () => {
  ["/tmp/biodata.docx", "/tmp/biodata.xlsx"].forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
};

const runPython = (scriptPath, outputPaths, res) => {
  console.log(`🚀 Menjalankan Python: ${scriptPath}`);
  const python = spawn("python3", [scriptPath], {
    cwd: "/tmp",
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf-8",
  });

  python.stdout.on("data", (data) => console.log(`🐍 PYTHON STDOUT: ${data.toString()}`));
  python.stderr.on("data", (data) => console.error(`❌ PYTHON STDERR: ${data.toString()}`));

  python.on("error", (err) => {
    console.error("🔥 Gagal memulai Python:", err);
    res.status(500).send("Gagal memulai Python.");
  });

  python.on("close", (code) => {
    console.log(`✅ Python selesai dengan kode ${code}`);
    for (const out of outputPaths) {
      if (fs.existsSync(out)) {
        console.log(`📄 Mengirim file hasil: ${out}`);
        return res.download(out);
      }
    }
    res.status(500).send("Gagal menjalankan script python atau file tidak dibuat.");
  });
};

app.get("/api/edit", async (req, res) => {
  try {
    const { documentUrl, prompt } = req.query;
    if (!documentUrl || !prompt) return res.status(400).send("Missing parameters.");

    cleanOldFiles();

    const localPath = `/tmp/${path.basename(documentUrl)}`;
    await downloadFile(documentUrl, localPath);
    const docxContent = (await extractDocxText(localPath)).slice(0, 2000);

    const messages = [
      { role: "system", content: "Kamu adalah AI khusus untuk mengedit file .docx menggunakan python." },
      { role: "user", content: `Isi dokumen:\n${docxContent}` },
      { role: "user", content: `Permintaan: ${prompt}` },
      { role: "user", content: "Cukup berikan kode python saja tanpa penjelasan." },
    ];

    const code = await requestAIWithFallback(messages);
    const fileId = uuidv4();
    const scriptPath = `/tmp/script-${fileId}.py`;
    const outputDocx = `${TMP_DIR}/hasil-${fileId}.docx`;

    let finalCode = code
      .replace(/dokumen_path\s*=.*\n?/g, "")
      .replace(/Document\(["'](.+?)["']\)/, `Document("${localPath}")`)
      .replace(/doc\.save\((.*?)\)/g, `doc.save("${outputDocx}")`);

    fs.writeFileSync(scriptPath, finalCode);
    runPython(scriptPath, [outputDocx, "/tmp/biodata.docx"], res);
  } catch (e) {
    console.error("❌ Error di /api/edit:", e);
    res.status(500).send("Terjadi kesalahan saat memproses dokumen.");
  }
});

app.get("/api/buat", async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) return res.status(400).send("Prompt kosong.");

    cleanOldFiles();

    const messages = [
      { role: "system", content: "Kamu adalah AI khusus untuk membuat file .docx menggunakan python." },
      { role: "user", content: prompt },
      { role: "user", content: "Cukup kirimkan kode python tanpa penjelasan." },
    ];

    const code = await requestAIWithFallback(messages);
    const fileId = uuidv4();
    const scriptPath = `/tmp/script-${fileId}.py`;
    const outputDocx = `${TMP_DIR}/hasil-${fileId}.docx`;

    let finalCode = code.replace(/doc\.save\((.*?)\)/g, `doc.save("${outputDocx}")`);

    fs.writeFileSync(scriptPath, finalCode);
    runPython(scriptPath, [outputDocx, "/tmp/biodata.docx"], res);
  } catch (e) {
    console.error("❌ Error di /api/buat:", e);
    res.status(500).send("Terjadi kesalahan saat membuat dokumen.");
  }
});

app.get("/api/buat/excel", async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) return res.status(400).send("Prompt kosong.");

    cleanOldFiles();

    const messages = [
      { role: "system", content: "Kamu adalah AI yang membuat file Excel (.xlsx) menggunakan Python dan library openpyxl." },
      { role: "user", content: prompt },
      { role: "user", content: "Cukup berikan kode python saja tanpa penjelasan." },
    ];

    const code = await requestAIWithFallback(messages);
    const fileId = uuidv4();
    const scriptPath = `/tmp/script-${fileId}.py`;
    const outputXlsx = `${TMP_DIR}/hasil-${fileId}.xlsx`;

    let finalCode = code.replace(/\.save\s*\(\s*["'][^)]+["']\s*\)/g, `.save("${outputXlsx}")`);

    fs.writeFileSync(scriptPath, finalCode);
    runPython(scriptPath, [outputXlsx, "/tmp/biodata.xlsx"], res);
  } catch (e) {
    console.error("❌ Error di /api/buat/excel:", e);
    res.status(500).send("Terjadi kesalahan saat membuat file Excel.");
  }
});

app.listen(port, () => {
  console.log(`Docx-AI server listening at http://localhost:${port}`);
});
