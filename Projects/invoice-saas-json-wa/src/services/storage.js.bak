import fs from 'fs';


const root = path.resolve(__dirname, '../../');
const dataDir = path.join(root, 'data');


if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });


const files = {
invoices: path.join(dataDir, 'invoices.json'),
income: path.join(dataDir, 'income.json'),
};


function ensureFile(file, seed) {
if (!fs.existsSync(file)) {
fs.writeFileSync(file, JSON.stringify(seed, null, 2));
}
}


ensureFile(files.invoices, { invoices: [] });
ensureFile(files.income, { income: [] });


// Simple write queue to avoid concurrent writes
const writeQueues = new Map();


function enqueueWrite(file, data) {
const prev = writeQueues.get(file) || Promise.resolve();
const next = prev.then(() => fs.promises.writeFile(file, JSON.stringify(data, null, 2)));
writeQueues.set(file, next.catch(() => {}));
return next;
}


export const DB = {
async readInvoices() {
const raw = await fs.promises.readFile(files.invoices, 'utf8');
return JSON.parse(raw);
},
async writeInvoices(obj) {
return enqueueWrite(files.invoices, obj);
},
async readIncome() {
const raw = await fs.promises.readFile(files.income, 'utf8');
return JSON.parse(raw);
},
async writeIncome(obj) {
return enqueueWrite(files.income, obj);
},
};


export function addMonthsKeepingTime(dateISO, months = 1) {
const d = new Date(dateISO);
const day = d.getDate();
d.setMonth(d.getMonth() + months);
// Handle month overflow (e.g., Jan 31 -> Mar 3). We'll clamp to last day of new month.
if (d.getDate() < day) {
d.setDate(0); // go to last day of previous month
}
return d.toISOString();
}