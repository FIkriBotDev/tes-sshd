const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 5151;

app.get("/", (req, res) => {
  res.send(`
    <h2>🚀 TikTok Downloader API</h2>
    <p>Gunakan endpoint:</p>
    <code>http://localhost:${PORT}/api/tiktokdownloader?url=URL_TIKTOK</code>
  `);
});

app.get("/api/tiktokdownloader", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ error: "URL TikTok wajib diberikan" });
  }

  let browser;
  try {
    // ✅ Fix: tambahkan --no-sandbox
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto(videoUrl, {
      waitUntil: "networkidle2",
      timeout: 0,
    });

    // Ambil data dari __NEXT_DATA__
    const json = await page.evaluate(() => {
      const script = document.querySelector("script#__NEXT_DATA__");
      if (!script) return null;
      return JSON.parse(script.textContent);
    });

    if (!json) {
      return res.status(500).json({ error: "Metadata TikTok tidak ditemukan" });
    }

    const videoData = json.props?.pageProps?.itemInfo?.itemStruct?.video;
    if (!videoData) {
      return res.status(500).json({ error: "Gagal menemukan info video" });
    }

    const downloadUrl = videoData.playAddr || videoData.downloadAddr;
    console.log("✅ URL Video:", downloadUrl);

    // Redirect langsung ke file video
    res.redirect(downloadUrl);
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    res.status(500).json({ error: "Terjadi kesalahan: " + err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
