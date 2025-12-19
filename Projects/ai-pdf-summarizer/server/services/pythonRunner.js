const { spawn } = require("child_process");
const path = require("path");

function runPythonExtractor(filePath) {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(
      __dirname,
      "../../python/extract.py"
    );

    const pythonProcess = spawn("python", [
      pythonScriptPath,
      filePath,
    ]);

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        return reject({
          message: "Python process failed",
          error: stderrData || stdoutData,
        });
      }

      try {
        const parsed = JSON.parse(stdoutData);

        if (parsed.status !== "success") {
          return reject(parsed);
        }

        resolve(parsed.text);
      } catch (err) {
        reject({
          message: "Failed to parse Python output",
          error: stdoutData,
        });
      }
    });
  });
}

module.exports = runPythonExtractor;
