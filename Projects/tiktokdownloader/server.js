const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 5151;

app.get("/api/ssweb", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "Parameter ?url= wajib diisi" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 }); // ukuran screenshot

    console.log(`📸 Membuka halaman: ${targetUrl}`);
    await page.goto(targetUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const screenshotBuffer = await page.screenshot({ fullPage: true });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", "inline; filename=screenshot.png");
    res.send(screenshotBuffer);
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: "Terjadi kesalahan: " + err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
