const express = require("express")
const axios = require("axios")

const app = express()

const PORT = 2026

const LOCAL_API_KEY = "EX_IT8Fj1rDIEbvYKzxAlFCbWJ1tMNxjBT0"
const REMOTE_API_KEY = "sk_IT8Fj1rDIEbvYKzxAlFCbWJ1tMNxjBT0"

const TARGET_URL = "https://gen.pollinations.ai/v1/chat/completions"

app.use(express.json({ limit: "50mb" }))

/* ---------------- LOG ---------------- */

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

/* ---------------- CORS ---------------- */

app.use((req, res, next) => {

  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  res.header("Access-Control-Allow-Methods", "*")

  if (req.method === "OPTIONS") {
    return res.sendStatus(200)
  }

  next()
})

/* ---------------- AUTH ---------------- */

function checkAuth(req) {

  const auth = req.headers.authorization
  if (!auth) return false

  const key = auth.replace("Bearer ", "")
  return key === LOCAL_API_KEY
}

/* ---------------- MODELS ---------------- */

app.get("/v1/models", (req, res) => {

  res.json({
    object: "list",
    data: [
      {
        id: "openai",
        object: "model",
        created: 0,
        owned_by: "exodusai"
      }
    ]
  })

})

/* ---------------- CHAT ---------------- */

app.post("/v1/chat/completions", async (req, res) => {

  try {

    if (!checkAuth(req)) {
      return res.status(401).json({
        error: {
          message: "Invalid API key",
          type: "invalid_request_error"
        }
      })
    }

    const body = req.body || {}

    console.log("Incoming body:", JSON.stringify(body, null, 2))

    const cleanedBody = {
      model: "claude-fast",
      messages: body.messages || [
        { role: "user", content: "Hello" }
      ],
      stream: body.stream || false
    }

    const stream = cleanedBody.stream === true

    if (stream) {

      const response = await axios({
        method: "post",
        url: TARGET_URL,
        data: cleanedBody,
        responseType: "stream",
        headers: {
          Authorization: `Bearer ${REMOTE_API_KEY}`,
          "Content-Type": "application/json"
        }
      })

      res.setHeader("Content-Type", "text/event-stream")
      res.setHeader("Cache-Control", "no-cache")
      res.setHeader("Connection", "keep-alive")

      response.data.pipe(res)

    } else {

      const response = await axios.post(
        TARGET_URL,
        cleanedBody,
        {
          headers: {
            Authorization: `Bearer ${REMOTE_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      )

      res.json(response.data)

    }

  } catch (err) {

    console.error("Proxy error:", err.response?.data || err.message)

    if (err.response) {
      return res
        .status(err.response.status)
        .json(err.response.data)
    }

    res.status(500).json({
      error: {
        message: err.message
      }
    })

  }

})

/* ---------------- ROOT ---------------- */

app.get("/", (req, res) => {
  res.send("ExodusAI OpenAI API running")
})

/* ---------------- START ---------------- */

app.listen(PORT, () => {

  console.log("")
  console.log("🚀 ExodusAI OpenAI API running")
  console.log(`http://localhost:${PORT}`)
  console.log("")

})
