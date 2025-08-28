import { app } from './app.js';
import { initWhatsApp } from './services/whatsapp.js';
import { startScheduler } from './services/scheduler.js';

const PORT = process.env.PORT || 8787;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Initialize WhatsApp bot (scan QR first time in terminal)
// Wrap in try/catch so server stays up if WA lib has issue
try {
  initWhatsApp().catch(err => {
    console.error('[server] initWhatsApp error:', err?.message || err);
  });
} catch (e) {
  console.error('[server] WA init failed:', e?.message || e);
}

// Start recurring invoice scheduler
try {
  startScheduler();
} catch (e) {
  console.error('[server] Scheduler start failed:', e?.message || e);
}
