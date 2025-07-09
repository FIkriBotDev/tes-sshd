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

// Util: Run Python script
const runPythonScript = (code, callback) => {
  const fileId = uuidv4();
  const scriptPath = `/tmp/script-${fileId}.py`;
  const outputDocx = `/tmp/hasil-${fileId}.docx`;

  const finalCode = code.replace(/doc\.save\(['"](.*?)['"]\)/, `doc.save("${outputDocx}")`);
  fs.writeFileSync(scriptPath, finalCode);

  console.log("=== PYTHON SCRIPT ===\n", finalCode);

  const python = spawn("python3", [scriptPath]);

  python.stdout.on("data", (data) => {
    console.log(`PYTHON STDOUT: ${data}`);
  });

  python.stderr.on("data", (data) => {
    console.error(`PYTHON ERROR: ${data}`);
  });

  python.on("close", (code) => {
    console.log(`PYTHON EXIT CODE: ${code}`);
    if (fs.existsSync(outputDocx)) {
      callback(null, outputDocx);
    } else {
      callback(new Error("Python script failed or no output generated."));
    }
  });
};

// Util: Request AI dari RTIST dengan fallback
const requestAIWithFallback = async (messages) => {
  try {
    const res = await axios.post("https://rtist-api.exoduscloud.my.id/post/rtist", {
      messages
    });
    console.log("=== RESPONSE RTIST (messages) ===\n", res.data);
    if (!res.data.response || !res.data.response.includes("doc.save")) throw new Error("Invalid AI code");
    return res.data.response;
  } catch (err) {
    console.warn("Fallback ke conversation mode...");
    const res = await axios.post("https://rtist-api.exoduscloud.my.id/post/rtist", {
      conversation: messages
    });
    console.log("=== RESPONSE RTIST (conversation) ===\n", res.data);
    if (!res.data.response || !res.data.response.includes("doc.save")) throw new Error("Fallback AI juga gagal");
    return res.data.response;
  }
};

// Endpoint: /api/edit
app.get("/api/edit", async (req, res) => {
  try {
    const { documentUrl, prompt } = req.query;
    if (!documentUrl || !prompt) return res.status(400).send("Missing parameters.");

    const localPath = `/tmp/${path.basename(documentUrl)}`;
    await downloadFile(documentUrl, localPath);
    const docxContent = (await extractDocxText(localPath)).slice(0, 2000); // batasi isi

    console.log("=== ISI DOKUMEN ===\n", docxContent);

    const messages = [
      { role: "system", content: "Kamu adalah AI khusus untuk mengedit file .docx menggunakan python." },
      { role: "user", content: `Isi dokumen:\n${docxContent}` },
      { role: "user", content: `Permintaan: ${prompt}` },
      { role: "user", content: "Cukup berikan kode python saja tanpa penjelasan." },
    ];

    const code = await requestAIWithFallback(messages);

    runPythonScript(code, (err, outputPath) => {
      if (err) {
        console.error("GAGAL MENJALANKAN PYTHON:", err);
        return res.status(500).send("Gagal menjalankan script python.");
      }
      const url = `https://docx-ai.exoduscloud.my.id/tmp/${path.basename(outputPath)}`;
      console.log("=== FILE SUKSES ===\n", url);
      res.json({ url });
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

    runPythonScript(code, (err, outputPath) => {
      if (err) {
        console.error("GAGAL MENJALANKAN PYTHON:", err);
        return res.status(500).send("Gagal menjalankan script python.");
      }
      const url = `https://docx-ai.exoduscloud.my.id/tmp/${path.basename(outputPath)}`;
      console.log("=== FILE SUKSES ===\n", url);
      res.json({ url });
    });
  } catch (e) {
    console.error("ERROR:", e.message || e);
    res.status(500).send("Terjadi kesalahan saat membuat dokumen.");
  }
});

app.listen(port, () => {
  console.log(`Docx-AI server listening at http://localhost:${port}`);
});
