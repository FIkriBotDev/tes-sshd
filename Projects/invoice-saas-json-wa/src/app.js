import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { invoicesRouter } from './routes/invoices.routes.js';
import { incomeRouter } from './routes/income.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), '/home/runner/work/tes-sshd/tes-sshd/Projects/invoice-saas-json-wa/src/public')));

// Views (EJS)
app.set('/home/runner/work/tes-sshd/tes-sshd/views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/', dashboardRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/income', incomeRouter);

// Basic healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok', pid: process.pid }));

