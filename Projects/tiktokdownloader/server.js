const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");

const app = express();
const PORT = 5151;

app.get("/api/tiktokdownloader", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ error: "URL TikTok wajib diberikan" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) " +
        "Version/15.0 Mobile/15E148 Safari/604.1"
    );

    await page.goto(videoUrl, { waitUntil: "networkidle2", timeout: 0 });

    // coba ambil dari tag video langsung
    const videoSrc = await page.evaluate(() => {
      const videoTag = document.querySelector("video");
      return videoTag ? videoTag.src : null;
    });

    if (!videoSrc) {
      return res
        .status(500)
        .json({ error: "Gagal menemukan video source (<video> kosong)" });
    }

    console.log("✅ URL Video:", videoSrc);

    const videoRes = await axios.get(videoSrc, {
      responseType: "stream",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) " +
          "AppleWebKit/605.1.15 (KHTML, like Gecko) " +
          "Version/15.0 Mobile/15E148 Safari/604.1",
        Referer: "https://www.tiktok.com/",
      },
    });

    res.setHeader("Content-Disposition", "attachment; filename=tiktok.mp4");
    res.setHeader("Content-Type", "video/mp4");

    videoRes.data.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan: " + err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
