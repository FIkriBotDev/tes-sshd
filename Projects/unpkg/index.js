const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS)
app.use(express.static(path.join(__dirname)));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'REST API Documentation',
      version: '1.0.0',
      description: 'Dokumentasi REST API untuk aplikasi unpkg',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ]
  },
  apis: ['./index.js'], // Path ke file yang berisi dokumentasi API
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== EXAMPLE API ROUTES ====================

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Mengecek status kesehatan server
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server berjalan dengan baik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Mendapatkan daftar users
 *     description: Mengambil semua data users yang tersedia
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Daftar users berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: John Doe
 *                   email:
 *                     type: string
 *                     example: john@example.com
 */
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Mendapatkan user berdasarkan ID
 *     description: Mengambil detail user spesifik berdasarkan ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user yang ingin diambil
 *     responses:
 *       200:
 *         description: Data user berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: John Doe
 *                 email:
 *                   type: string
 *                   example: john@example.com
 *       404:
 *         description: User tidak ditemukan
 */
app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  
  const user = users.find(u => u.id === userId);
  
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User tidak ditemukan' });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Membuat user baru
 *     description: Menambahkan user baru ke dalam sistem
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       201:
 *         description: User berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 3
 *                 name:
 *                   type: string
 *                   example: John Doe
 *                 email:
 *                   type: string
 *                   example: john@example.com
 *       400:
 *         description: Data tidak valid
 */
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name dan email wajib diisi' });
  }
  
  const newUser = {
    id: Math.floor(Math.random() * 1000),
    name,
    email
  };
  
  res.status(201).json(newUser);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Memperbarui data user yang sudah ada
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user yang ingin diupdate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe Updated
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.updated@example.com
 *     responses:
 *       200:
 *         description: User berhasil diupdate
 *       404:
 *         description: User tidak ditemukan
 */
app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email } = req.body;
  
  res.json({
    id: userId,
    name: name || 'Updated Name',
    email: email || 'updated@example.com',
    updated: true
  });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Hapus user
 *     description: Menghapus user dari sistem
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user yang ingin dihapus
 *     responses:
 *       200:
 *         description: User berhasil dihapus
 *       404:
 *         description: User tidak ditemukan
 */
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  
  res.json({
    message: `User dengan ID ${userId} berhasil dihapus`,
    deleted: true
  });
});

// Route untuk serving index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`Swagger UI tersedia di http://localhost:${PORT}/api-docs`);
  console.log(`Web aplikasi tersedia di http://localhost:${PORT}`);
});
