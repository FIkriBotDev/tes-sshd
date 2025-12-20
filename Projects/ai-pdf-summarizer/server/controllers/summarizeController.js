const fs = require("fs");
const path = require("path");
const runPythonExtractor = require("../services/pythonRunner");

async function summarizeController(req, res) {
  if (!req.file) {
    return res.status(400).json({
      status: "error",
      message: "No file uploaded",
    });
  }

  const filePath = req.file.path;

  try {
    // Panggil Python extractor
    const extractedText = await runPythonExtractor(filePath);

    // Hapus file setelah diproses (cleanup)
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Failed to delete uploaded file:", err);
      }
    });

    return res.json({
      status: "success",
      textLength: extractedText.length,
      text: extractedText,
    });
  } catch (error) {
    // Cleanup jika error
    fs.unlink(filePath, () => {});

    return res.status(500).json({
      status: "error",
      message: "Failed to extract document",
      detail: error,
    });
  }
}

module.exports = summarizeController;
