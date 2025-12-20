const fs = require("fs");
const runPythonExtractor = require("../services/pythonRunner");
const summarizeWithPollinations = require("../services/pollinations");
const chunkText = require("../utils/chunkText");

module.exports = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: "error", message: "No file" });
  }

  const filePath = req.file.path;

  try {
    console.log("📁 FILE:", filePath);

    const text = await runPythonExtractor(filePath);
    console.log("📄 TEXT LENGTH:", text.length);

    const chunks = chunkText(text, 3000);
    console.log("✂️ CHUNKS:", chunks.length);

    const partial = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`🤖 AI chunk ${i + 1}/${chunks.length}`);
      partial.push(await summarizeWithPollinations(chunks[i]));
    }

    const finalSummary = await summarizeWithPollinations(partial.join("\n"));

    fs.unlink(filePath, () => {});
    res.json({ status: "success", summary: finalSummary });

  } catch (err) {
    console.error("❌ CONTROLLER ERROR:", err.message);
    fs.unlink(filePath, () => {});
    res.status(500).json({
      status: "error",
      stage: "summarizeController",
      message: err.message,
    });
  }
};
