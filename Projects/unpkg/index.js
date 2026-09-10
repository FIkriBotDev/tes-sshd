require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8027;

// API Keys dengan fallback
const API_KEYS = [
  process.env.POLLINATIONS_APIKEY1,
  process.env.POLLINATIONS_APIKEY2
].filter(Boolean);

let currentKeyIndex = 0;

// Fungsi untuk mendapatkan API key dengan fallback
function getApiKey() {
  if (API_KEYS.length === 0) {
    throw new Error('No API keys configured');
  }
  return API_KEYS[currentKeyIndex];
}

// Fungsi untuk switch ke API key berikutnya
function switchToNextKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`Switched to API key ${currentKeyIndex + 1}`);
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  // Hanya log request ke /api/*
  if (req.path.startsWith('/api/')) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    const clientIp = ip.split(',')[0].trim();
    
    // Format waktu: Mon Sep 7 11:51 WITA
    const now = new Date();
    const options = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Makassar',
      timeZoneName: 'short'
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);
    
    const weekday = parts.find(p => p.type === 'weekday')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    const timeZone = parts.find(p => p.type === 'timeZoneName')?.value;
    
    const timestamp = `${weekday} ${month} ${day} ${hour}:${minute} ${timeZone}`;
    
    const logEntry = `[${timestamp}] ${clientIp} Request to ${req.path} [${req.method}]\n`;
    
    fs.appendFile('request_log.txt', logEntry, (err) => {
      if (err) console.error('Error writing to request_log.txt:', err);
    });
  }
  
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Swagger configuration
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Free AI API - FikriDev',
    version: '1.0.0',
    description: 'REST API untuk mengakses AI models gratis untuk developer',
    contact: {
      name: 'FikriDev',
      url: 'https://fikridev.me'
    }
  },
  servers: [
    {
      url: `https://api.fikridev.me`,
      description: 'Main server'
    }
  ],
  tags: [
    { name: 'Text', description: 'Text generation endpoints' },
    { name: 'Image', description: 'Image generation endpoints' }
  ],
  components: {
    schemas: {
      MessageInput: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: {
                  type: 'string',
                  enum: ['user', 'assistant', 'system'],
                  example: 'user'
                },
                content: {
                  type: 'string',
                  example: 'Hello, how are you?'
                }
              }
            }
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'boolean',
            example: true
          },
          creator: {
            type: 'string',
            example: 'FikriDev'
          },
          result: {
            type: 'string'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string'
          }
        }
      }
    }
  },
  paths: {}
};

// Model list dari file markdown
const textModels = [
  { name: 'GPT-5.4 Nano', id: 'openai' },
  { name: 'GPT-5 Nano', id: 'openai-fast' },
  { name: 'Nova Micro', id: 'nova-fast' },
  { name: 'Qwen3 Coder 30B', id: 'qwen-coder' },
  { name: 'Grok 4.20', id: 'grok' },
  { name: 'Qwen3Guard 8B', id: 'qwen-safety' },
  { name: 'MIDIjourney', id: 'midijourney' },
  { name: 'GPT-5.4 Mini', id: 'gpt-5.4-mini' },
  { name: 'NVIDIA Nemotron 3.5 Lightning', id: 'nemotron-3.5-lightning' },
  { name: 'Meta Llama 3.3 70B', id: 'llama' }
];

const imageModels = [
  { name: 'DreamShaper 8 LCM', id: 'dreamshaper' },
  { name: 'FLUX.1 Schnell', id: 'flux' },
  { name: 'GPT Image', id: 'gptimage' }
];

// Generate Swagger paths untuk Text models
textModels.forEach(model => {
  const routeName = model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  swaggerDocument.paths[`/api/text/${routeName}`] = {
    post: {
      tags: ['Text'],
      summary: model.name,
      description: `Generate text using ${model.name} model (${model.id})`,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessageInput' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        400: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  };
});

// Generate Swagger paths untuk Image models
imageModels.forEach(model => {
  const routeName = model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  swaggerDocument.paths[`/api/image/${routeName}`] = {
    get: {
      tags: ['Image'],
      summary: model.name,
      description: `Generate image using ${model.name} model (${model.id})`,
      parameters: [
        {
          name: 'prompt',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            example: 'a cat in space'
          },
          description: 'Text prompt for image generation'
        }
      ],
      responses: {
        200: {
          description: 'Generated image',
          content: {
            'image/png': {
              schema: {
                type: 'string',
                format: 'binary'
              }
            },
            'image/jpeg': {
              schema: {
                type: 'string',
                format: 'binary'
              }
            }
          }
        },
        400: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  };
});

// Swagger UI setup
app.get('/swagger.json', (req, res) => {
  res.json(swaggerDocument);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true
}));

// Handler untuk request ke Pollinations dengan fallback
async function requestToPollinations(modelId, messages, retryCount = 0) {
  try {
    const apiKey = getApiKey();
    
    const payload = {
      model: modelId,
      messages
    };

    const response = await axios.post(
      'https://gen.pollinations.ai/v1/chat/completions',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    return response.data?.choices?.[0]?.message?.content || '';

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    
    // Jika error karena API key dan masih ada key lain, coba key berikutnya
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (API_KEYS.length > 1 && retryCount < API_KEYS.length) {
        console.log(`API Key ${currentKeyIndex + 1} failed, trying next key...`);
        switchToNextKey();
        return await requestToPollinations(modelId, messages, retryCount + 1);
      }
    }

    // Log error ke file
    const errorLog = `[${new Date().toISOString()}] Model: ${modelId} - ${error.stack || errorMessage}\n`;
    fs.appendFile('error.txt', errorLog, () => {});

    throw new Error(errorMessage);
  }
}

// Generate routes untuk Text models
textModels.forEach(model => {
  const routeName = model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  app.post(`/api/text/${routeName}`, async (req, res) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          error: 'Invalid request format. "messages" harus berupa array.'
        });
      }

      const result = await requestToPollinations(model.id, messages);

      res.json({
        status: true,
        creator: 'FikriDev',
        result
      });

    } catch (error) {
      console.error(`Error in ${routeName}:`, error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

// Generate routes untuk Image models
imageModels.forEach(model => {
  const routeName = model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  app.get(`/api/image/${routeName}`, async (req, res) => {
    try {
      const { prompt } = req.query;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          error: 'Invalid request format. "prompt" query parameter is required.'
        });
      }

      const encodedPrompt = encodeURIComponent(prompt);

      const response = await fetch(
        `https://gen.pollinations.ai/image/${encodedPrompt}?model=${model.id}`,
        {
          headers: {
            Authorization: "Bearer sk_EWIgGly9vDctwiFStvZkfaaZBTTIjGGf"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          `Pollinations API error: ${response.status} ${response.statusText}`
        );
      }

      const blob = await response.blob();

      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const contentType = response.headers.get('content-type') || 'image/png';

      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Creator', 'FikriDev');

      res.send(buffer);

    } catch (error) {
      console.error(`Error in ${routeName}:`, error.message);

      const errorLog =
        `[${new Date().toISOString()}] Image Model: ${model.id} - ${error.stack || error.message}\n`;

      fs.appendFile('error.txt', errorLog, () => {});

      res.status(500).json({
        error: 'Internal Server Error'
      });
    }
  });
});

// Route untuk serving index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`╔═══════════════════════════════════════════════════╗`);
  console.log(`║   Server berhasil berjalan!                       ║`);
  console.log(`╠═══════════════════════════════════════════════════╣`);
  console.log(`║   URL: https://exodusapi.jadikelas.tech                        ║`);
  console.log(`║   Swagger UI: https://exodusapi.jadikelas.tech/api-docs        ║`);
  console.log(`║   Creator: FikriDev                               ║`);
  console.log(`╠═══════════════════════════════════════════════════╣`);
  console.log(`║   API Keys loaded: ${API_KEYS.length}                            ║`);
  console.log(`║   Text Models: ${textModels.length}                              ║`);
  console.log(`║   Image Models: ${imageModels.length}                             ║`);
  console.log(`╚═══════════════════════════════════════════════════╝`);
});
