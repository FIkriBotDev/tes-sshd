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
        return res.status(401).json({
            error: "Invalid API key"
        });
    }

    try {

        const response = await axios.post(
            "https://gen.pollinations.ai/v1/chat/completions",
            req.body,
            {
                headers: {
                    "Authorization": `Bearer ${POLLINATIONS_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json(response.data);

    } catch (error) {

        res.status(500).json({
            error: "Proxy error",
            detail: error.response?.data || error.message
        });

    }

});

app.listen(PORT, () => {
    console.log(`AI Proxy running on http://localhost:${PORT}`);
});
