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
    // 1. Buka browser headless
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.goto(videoUrl, {
      waitUntil: "networkidle2",
      timeout: 0,
    });

    // 2. Ambil data video dari window.__NEXT_DATA__
    const json = await page.evaluate(() => {
      const script = document.querySelector("script#__NEXT_DATA__");
      if (!script) return null;
      return JSON.parse(script.textContent);
    });

    if (!json) {
      return res.status(500).json({ error: "Metadata TikTok tidak ditemukan" });
    }

    // 3. Cari URL video
    const videoData = json.props?.pageProps?.itemInfo?.itemStruct?.video;
    if (!videoData) {
      return res.status(500).json({ error: "Gagal menemukan info video" });
    }

    // pakai playAddr untuk tanpa watermark
    const downloadUrl = videoData.playAddr || videoData.downloadAddr;

    console.log("✅ URL Video:", downloadUrl);

    // 4. Redirect user langsung ke video file (browser akan download / play)
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
