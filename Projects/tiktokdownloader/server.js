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

    // pakai mobile UA supaya TikTok kasih data
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) " +
        "Version/15.0 Mobile/15E148 Safari/604.1"
    );

    await page.goto(videoUrl, { waitUntil: "networkidle2", timeout: 0 });

    // coba ambil __NEXT_DATA__
    let json = await page.evaluate(() => {
      const script = document.querySelector("script#__NEXT_DATA__");
      return script ? JSON.parse(script.textContent) : null;
    });

    // kalau tidak ada __NEXT_DATA__, fallback ke SIGI_STATE
    if (!json) {
      const sigi = await page.evaluate(() => {
        const script = document.querySelector("script#SIGI_STATE");
        return script ? JSON.parse(script.textContent) : null;
      });
      json = sigi;
    }

    if (!json) {
      return res
        .status(500)
        .json({ error: "Metadata TikTok tidak ditemukan (__NEXT_DATA__ / SIGI_STATE kosong)" });
    }

    // cari info video
    let videoData = null;

    if (json.props?.pageProps?.itemInfo?.itemStruct?.video) {
      videoData = json.props.pageProps.itemInfo.itemStruct.video;
    } else if (json.ItemModule) {
      const firstKey = Object.keys(json.ItemModule)[0];
      videoData = json.ItemModule[firstKey]?.video;
    }

    if (!videoData) {
      return res
        .status(500)
        .json({ error: "Gagal menemukan info video dari JSON TikTok" });
    }

    const downloadUrl = videoData.playAddr || videoData.downloadAddr;
    if (!downloadUrl) {
      return res
        .status(500)
        .json({ error: "URL video tidak ditemukan dalam metadata" });
    }

    console.log("✅ URL Video:", downloadUrl);

    // ambil stream video
    const videoRes = await axios.get(downloadUrl, {
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
