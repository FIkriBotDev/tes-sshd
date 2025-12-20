const { spawn } = require("child_process");
const path = require("path");

function runPythonExtractor(filePath) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, "../../python/extract.py");
    const py = spawn("python", [script, filePath]);

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", d => stdout += d.toString());
    py.stderr.on("data", d => stderr += d.toString());

    py.on("close", code => {
      if (code !== 0) {
        console.error("❌ PYTHON ERROR");
        console.error(stderr || stdout);
        return reject(new Error(stderr || "Python failed"));
      }

      try {
        const parsed = JSON.parse(stdout);
        if (parsed.status !== "success") {
          return reject(new Error(parsed.message));
        }
        resolve(parsed.text);
      } catch (e) {
        console.error("❌ JSON PARSE ERROR FROM PYTHON");
        console.error(stdout);
        reject(e);
      }
    });
  });
}

module.exports = runPythonExtractor;
