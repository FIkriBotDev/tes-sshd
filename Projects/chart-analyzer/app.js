import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

const app = express();
const port = 1010;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.static('public-chart-analyzer'));

// === Error Logger ===
const logErrorToFile = (error) => {
    const logMessage = `[${new Date().toISOString()}] ${error.stack || error.message || error}\n\n`;
    fs.appendFileSync('error_log_chart_analyzer.txt', logMessage);
    console.error(error);
};

// === Upload file function ===
const uploadFile = async (buffer) => {
    try {
        const { ext } = await fileTypeFromBuffer(buffer);
        if (!ext) throw new Error('Could not determine file type from buffer');

        let form = new FormData();
        form.append('file', buffer, 'tmp.' + ext);

        const response = await axios.post('https://uploader.exoduscloud.my.id/upload', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        const uploadedUrl = response.data.url;
        if (!uploadedUrl) throw new Error('URL not found in upload response');

        return uploadedUrl;
    } catch (error) {
        logErrorToFile(error);
        throw error;
    }
};

// === Prompt Builder ===
const buildPrompt = () => `
You are a professional financial chart analyst AI. Analyze the uploaded chart image carefully and provide your analysis strictly in valid JSON format only.

The JSON must have this structure:
{
  "analysis": {
    "current_trend": "short-term and long-term trend",
    "chart_pattern": "Detected chart pattern",
    "support_levels": [list of numeric support levels],
    "resistance_levels": [list of numeric resistance levels]
  },
  "prediction": "Text describing expected next price movement",
  "trade_suggestions": {
    "entry": {
      "price": numeric entry price,
      "reason": "Reasoning for entry"
    },
    "recommendation": "BUY/SELL/HOLD",
    "take_profit": [
      {
        "price": numeric TP level,
        "reason": "Reasoning for TP"
      }
    ],
    "stop_loss": {
      "price": numeric SL level,
      "reason": "Reasoning for SL"
    }
  },
  "pattern_type": "Specific chart pattern type",
  "risk_reward_ratio": "Estimated risk/reward ratio"
}

Rules:
1. Always output valid JSON only.
2. Fill numeric values where possible; if unavailable, use null.
3. Do not include any explanations or extra text outside JSON.
4. Include all components even if some are null.
5. Provide concise, precise, and professional financial analysis.
`;

// === POST /analyze ===
app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        const fileBuffer = req.file.buffer;
        const uploadedUrl = await uploadFile(fileBuffer);

        const geminiPrompt = buildPrompt();
        const geminiUrl = `https://gemini-api.exoduscloud.my.id/api/gemini-image?text=${encodeURIComponent(geminiPrompt)}&url=${encodeURIComponent(uploadedUrl)}`;

        const response = await axios.get(geminiUrl);

        let aiJson;
        try {
            const responseText = response.data.result;

            let jsonString;
            const jsonBlockMatch = responseText.match(/```json\s*([\s\S]+?)\s*```/);
            if (jsonBlockMatch) {
                jsonString = jsonBlockMatch[1];
            } else {
                const fallbackMatch = responseText.match(/\{[\s\S]*\}/);
                if (fallbackMatch) {
                    jsonString = fallbackMatch[0];
                } else {
                    throw new Error('JSON block not found in AI response');
                }
            }

            aiJson = JSON.parse(jsonString);
        } catch (e) {
            logErrorToFile(e);
            return res.status(500).json({ error: 'Failed to parse AI response as JSON', raw: response.data });
        }

        res.json(aiJson);
    } catch (err) {
        logErrorToFile(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === Serve Frontend ===
app.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}`);
});
