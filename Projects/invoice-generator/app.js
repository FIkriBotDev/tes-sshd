// app.js
const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const path = require('path');
const dayjs = require('dayjs');
const multer = require('multer');

const app = express();
const PORT = 1212;

// Static file serve
app.use(express.static(path.join(__dirname, '/home/runner/work/tes-sshd/tes-sshd/public-invoice-generator')));

// Multer setup (logo upload in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Helpers
function currency(n, symbol = 'Rp') {
  const num = Number(n || 0);
  return `${symbol} ${num.toLocaleString('id-ID')}`;
}

function drawHr(doc, y, from = 50, to = 550) {
  doc.moveTo(from, y).lineTo(to, y).stroke();
}

// POST /api/generate-invoice
// Expects multipart/form-data (FormData)
// fields: from, to, invoiceNumber, issueDate, dueDate, items, notes, logo(file)
app.post('/api/generate-invoice', upload.single('logo'), (req, res) => {
  try {
    // parse fields (stringify JSON di frontend)
    const from = JSON.parse(req.body.from || '{}') || { name: 'Your Company', address: '' };
    const to = JSON.parse(req.body.to || '{}') || { name: 'Client Name', address: '' };
    const invoiceNumber = req.body.invoiceNumber || `INV-${Date.now()}`;
    const issueDate = req.body.issueDate || dayjs().format('YYYY-MM-DD');
    const dueDate = req.body.dueDate || dayjs().add(7, 'day').format('YYYY-MM-DD');
    const items = JSON.parse(req.body.items || '[]');
    const notes = req.body.notes || '';

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoiceNumber}.pdf`);
    doc.pipe(res);

    // Header Title
    doc.fontSize(24).text('INVOICE', 50, 45);

    // Jika ada logo upload → taruh kanan atas
    if (req.file && req.file.buffer) {
      try {
        doc.image(req.file.buffer, 430, 50, { width: 100 }); // logo di kanan atas
      } catch (e) {
        console.error('Logo render error:', e.message);
      }
    }

    // Info invoice
    doc.fontSize(10).fillColor('#666')
      .text(`Invoice No: ${invoiceNumber}`, 50, 80)
      .text(`Issue Date: ${dayjs(issueDate).format('DD MMM YYYY')}`, 50, 95)
      .text(`Due Date: ${dayjs(dueDate).format('DD MMM YYYY')}`, 50, 110)
      .fillColor('black');

    // From / To
    const leftY = 140;
    doc.fontSize(12).text('From:', 50, leftY)
      .fontSize(11).text(from.name || '', 50, leftY + 15)
      .fontSize(10).fillColor('#333')
      .text(from.address || '', 50, leftY + 32, { width: 230 })
      .fillColor('black');

    doc.fontSize(12).text('Bill To:', 320, leftY)
      .fontSize(11).text(to.name || '', 320, leftY + 15)
      .fontSize(10).fillColor('#333')
      .text(to.address || '', 320, leftY + 32, { width: 230 })
      .fillColor('black');

    drawHr(doc, 220);

    // Table Header
    const tableTop = 240;
    doc.fontSize(11).text('Description', 50, tableTop)
      .text('Qty', 320, tableTop, { width: 50, align: 'right' })
      .text('Unit Price', 380, tableTop, { width: 80, align: 'right' })
      .text('Amount', 470, tableTop, { width: 80, align: 'right' });
    drawHr(doc, tableTop + 18);

    // Table Rows
    let y = tableTop + 30;
    let subtotal = 0;

    (items || []).forEach((item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unitPrice || 0);
      const amount = qty * price;
      subtotal += amount;

      doc.fontSize(10)
        .text(item.description || '-', 50, y, { width: 260 })
        .text(qty.toString(), 320, y, { width: 50, align: 'right' })
        .text(currency(price), 380, y, { width: 80, align: 'right' })
        .text(currency(amount), 470, y, { width: 80, align: 'right' });

      y += 20;
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
    });

    drawHr(doc, y + 5);

    // Totals
    const totalsTop = y + 20;
    doc.fontSize(10)
      .text('Subtotal', 400, totalsTop, { width: 70, align: 'right' })
      .text(currency(subtotal), 470, totalsTop, { width: 80, align: 'right' });

    const taxRate = 0; // ganti kalau mau ada PPN
    const tax = Math.round(subtotal * taxRate);
    if (taxRate > 0) {
      doc.text(`Tax (${(taxRate * 100).toFixed(0)}%)`, 400, totalsTop + 16, { width: 70, align: 'right' })
        .text(currency(tax), 470, totalsTop + 16, { width: 80, align: 'right' });
    }

    const total = subtotal + tax;
    doc.fontSize(12).fillColor('#111')
      .text('Total', 400, totalsTop + (taxRate > 0 ? 32 : 16), { width: 70, align: 'right' })
      .text(currency(total), 470, totalsTop + (taxRate > 0 ? 32 : 16), { width: 80, align: 'right' });
    doc.fillColor('black');

    // Notes
    const notesTop = totalsTop + 70;
    //if (notes) {
   //   doc.fontSize(10).fillColor('#333').text('Notes:', 50, notesTop);
    //  doc.fontSize(10).fillColor('#333').text(String(notes), 50, notesTop + 14, { width: 500 });
   //   doc.fillColor('black');
  //  }
    if (notes) {
  doc.fontSize(10).fillColor('#333').text('Notes:', 50, notesTop);

  // Pisahkan berdasarkan newline agar setiap baris ditulis ulang
  const lines = String(notes).split(/\r?\n/);
  let offset = 14;
  lines.forEach(line => {
    doc.text(line, 50, notesTop + offset, { width: 500 });
    offset += 14; // jarak antar baris
  });

  doc.fillColor('black');
}


    // Footer
    doc.fontSize(9).fillColor('#777')
      .text('Thank you for your business!', 50, 780, { align: 'center', width: 500 });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

app.listen(PORT, () => {
  console.log(`Invoice Generator running at http://localhost:${PORT}`);
});
