const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = 2026;

const LOCAL_API_KEY = "EX_IT8Fj1rDIEbvYKzxAlFCbWJ1tMNxjBT0";
const REMOTE_API_KEY = "sk_IT8Fj1rDIEbvYKzxAlFCbWJ1tMNxjBT0";

const TARGET_URL = "https://gen.pollinations.ai/v1/chat/completions";

function checkAuth(req) {
  const auth = req.headers.authorization;
  if (!auth) return false;

  const key = auth.replace("Bearer ", "");
  return key === LOCAL_API_KEY;
}

app.post("/v1/chat/completions", async (req, res) => {
  try {
    if (!checkAuth(req)) {
      return res.status(401).json({
        error: {
          message: "Invalid API key",
          type: "invalid_request_error",
          code: "invalid_api_key"
        }
      });
    }

    const body = req.body;
    const stream = body.stream === true;

    if (stream) {

      const response = await axios({
        method: "post",
        url: TARGET_URL,
        data: body,
        responseType: "stream",
        headers: {
          Authorization: `Bearer ${REMOTE_API_KEY}`,
          "Content-Type": "application/json"
        }
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      response.data.on("data", chunk => {
        res.write(chunk);
      });

      response.data.on("end", () => {
        res.end();
      });

      response.data.on("error", err => {
        console.error(err);
        res.end();
      });

    } else {

      const response = await axios.post(
        TARGET_URL,
        body,
        {
          headers: {
            Authorization: `Bearer ${REMOTE_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      res.json(response.data);

    }

  } catch (err) {

    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }

    res.status(500).json({
      error: {
        message: err.message,
        type: "server_error"
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`OpenAI Compatible API running on http://localhost:${PORT}`);
});
