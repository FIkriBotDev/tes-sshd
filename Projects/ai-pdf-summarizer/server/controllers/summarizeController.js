const fs = require("fs");
const runPythonExtractor = require("../services/pythonRunner");
const summarizeWithPollinations = require("../services/pollinations");
const chunkText = require("../utils/chunkText");

async function summarizeController(req, res) {
  if (!req.file) {
    return res.status(400).json({
      status: "error",
      message: "No file uploaded",
    });
  }

  const filePath = req.file.path;

  try {
    // 1. Extract text dari PDF / DOCX
    const extractedText = await runPythonExtractor(filePath);

    if (!extractedText || extractedText.length < 50) {
      throw new Error("Extracted text is too short");
    }

    // 2. Chunking text (hindari limit AI)
    const chunks = chunkText(extractedText, 3000);

    // 3. Ringkas tiap chunk
    const partialSummaries = [];
    for (let i = 0; i < chunks.length; i++) {
      const summary = await summarizeWithPollinations(
        chunks[i],
        "ringkas"
      );
      partialSummaries.push(summary);
    }

    // 4. Gabungkan hasil ringkasan
    const combinedSummary = partialSummaries.join("\n\n");

    // 5. Ringkas ulang agar lebih padat & menyatu
    const finalSummary = await summarizeWithPollinations(
      combinedSummary,
      "ringkas"
    );

    // 6. Cleanup file upload
    fs.unlink(filePath, () => {});

    return res.json({
      status: "success",
      chunks: chunks.length,
      summary: finalSummary,
    });
  } catch (error) {
    fs.unlink(filePath, () => {});

    return res.status(500).json({
      status: "error",
      message: "Failed to summarize document",
      detail: error.message || error,
    });
  }
}

module.exports = summarizeController;
