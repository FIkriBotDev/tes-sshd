const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = 2026;

const LOCAL_API_KEY = "EX_IT8Fj1rDIEbvYKzxAlFCbWJ1tMNxjBT0";
const POLLINATIONS_KEY = "sk_IT8Fj1rDIEbvYKzxAlFCbWJ1tMNxjBT0";

app.post("/v1/chat/completions", async (req, res) => {

    const auth = req.headers.authorization;

    if (!auth || auth !== `Bearer ${LOCAL_API_KEY}`) {
        return res.status(401).json({ error: "Invalid API key" });
    }

    try {

        const response = await axios.post(
            "https://gen.pollinations.ai/v1/chat/completions",
            req.body,
            {
                headers: {
                    Authorization: `Bearer ${POLLINATIONS_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = response.data;

        // NORMALIZE RESPONSE
        const normalized = {
            id: data.id || "chatcmpl-local",
            object: "chat.completion",
            created: data.created || Math.floor(Date.now() / 1000),
            model: data.model || req.body.model,
            choices: [
                {
                    index: 0,
                    message: {
                        role: "assistant",
                        content: data.choices?.[0]?.message?.content || ""
                    },
                    finish_reason: "stop"
                }
            ],
            usage: data.usage || {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
            }
        };

        res.json(normalized);

    } catch (error) {

        res.status(500).json({
            error: "Proxy error",
            detail: error.response?.data || error.message
        });

    }

});

app.get("/v1/models", (req, res) => {

    res.json({
        object: "list",
        data: [
            {
                id: "openai",
                object: "model",
                created: 0,
                owned_by: "pollinations"
            }
        ]
    });

});

app.get("/v1/models/:id", (req, res) => {

    res.json({
        id: req.params.id,
        object: "model",
        created: 0,
        owned_by: "pollinations"
    });

});

app.listen(PORT, () => {
    console.log(`AI Proxy running on http://localhost:${PORT}`);
});
