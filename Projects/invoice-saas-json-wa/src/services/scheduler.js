import cron from 'node-cron';
import { DB, addMonthsKeepingTime } from './storage.js';
import { nanoid } from '../utils/id.js';
import { sendText } from './whatsapp.js';

export function startScheduler() {
  // Cron job: jalan setiap hari jam 00:00
  cron.schedule('0 0 * * *', async () => {
    try {
      const { invoices } = await DB.readInvoices();
      let changed = false;
      const now = new Date();

      for (const inv of invoices) {
        if (inv.type === 'monthly' && inv.next_schedule) {
          let due = new Date(inv.next_schedule);

          // Kalau sudah lewat, buat invoice baru dan geser next_schedule
          if (due <= now) {
            const newId = 'inv_' + nanoid(8);
            const newInv = {
              ...inv,
              id: newId,
              status: 'unpaid',
              created_at: new Date().toISOString(),
              next_schedule: addMonthsKeepingTime(due.toISOString(), 1), // geser dari due, bukan inv.next_schedule
            };

            invoices.push(newInv);
            changed = true;

            // Kirim notifikasi WA
            await sendText(
              newInv.customer_whatsapp,
              `Halo ${newInv.customer_name}, ini adalah tagihan bulanan Anda. Invoice #${newInv.id} total Rp${newInv.total.toLocaleString(
                'id-ID'
              )}\nTerima kasih.`
            );
          }
        }
      }

      if (changed) await DB.writeInvoices({ invoices });
    } catch (e) {
      console.error('[Scheduler] Error:', e);
    }
  });
}
