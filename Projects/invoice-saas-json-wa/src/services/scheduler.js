import cron from 'node-cron';
import { DB, addMonthsKeepingTime } from './storage.js';
import { nanoid } from '../utils/id.js';
import { sendText } from './whatsapp.js';


export function startScheduler() {
// Run every minute to check due recurring invoices
cron.schedule('* * * * *', async () => {
try {
const { invoices } = await DB.readInvoices();
let changed = false;
const now = new Date();


for (const inv of invoices) {
if (inv.type === 'monthly' && inv.next_schedule) {
const due = new Date(inv.next_schedule);
if (due <= now) {
// Create a new invoice cloned from template
const newId = 'inv_' + nanoid(8);
const newInv = {
...inv,
id: newId,
status: 'unpaid',
created_at: new Date().toISOString(),
next_schedule: addMonthsKeepingTime(inv.next_schedule, 1),
};
invoices.push(newInv);
changed = true;


// Notify customer via WhatsApp
await sendText(newInv.customer_whatsapp, `Halo ${newInv.customer_name}, ini adalah tagihan bulanan Anda. Invoice #${newInv.id} total Rp${newInv.total.toLocaleString('id-ID')}\nTerima kasih.`);
}
}
}


if (changed) await DB.writeInvoices({ invoices });
} catch (e) {
console.error('[Scheduler] Error:', e);
}
});
}