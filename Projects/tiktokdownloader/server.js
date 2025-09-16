const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = 5151;

app.get("/", (req, res) => {
  res.send(`
    <h2>🚀 TikTok Downloader API</h2>
    <p>Gunakan endpoint berikut:</p>
    <code>http://localhost:${PORT}/api/tiktokdownloader?url=URL_TIKTOK</code>
    <p>Contoh:</p>
    <code>http://localhost:${PORT}/api/tiktokdownloader?url=https://www.tiktok.com/@scout2015/video/6718335390845095173</code>
  `);
});

app.get("/api/tiktokdownloader", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ error: "URL TikTok wajib diberikan" });
  }

  try {
    // Ambil HTML TikTok
    const response = await axios.get(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Cari metadata di beberapa tempat
    let scriptTag =
      $('script[id="SIGI_STATE"]').html() ||
      $('script[id="__UNIVERSAL_DATA_LOADER_STATE__"]').html() ||
      $('script[id="__NEXT_DATA__"]').html();

    if (!scriptTag) {
      return res.status(500).json({ error: "Gagal menemukan metadata video (SIGI_STATE / NEXT_DATA tidak ada)" });
    }

    const json = JSON.parse(scriptTag);

    let downloadUrl;

    // Jika SIGI_STATE / UNIVERSAL_DATA_LOADER_STATE
    if (json.ItemModule) {
      const firstKey = Object.keys(json.ItemModule)[0];
      downloadUrl = json.ItemModule[firstKey]?.video?.downloadAddr;
    }

    // Jika NEXT_DATA
    if (!downloadUrl && json.props?.pageProps?.itemInfo?.itemStruct) {
      downloadUrl = json.props.pageProps.itemInfo.itemStruct.video?.downloadAddr;
    }

    if (!downloadUrl) {
      return res.status(500).json({ error: "Gagal mengekstrak link video" });
    }

    console.log("✅ URL Video:", downloadUrl);

    // Ambil binary video dan stream ke browser
    const videoRes = await axios.get(downloadUrl, { responseType: "stream" });

    res.setHeader("Content-Disposition", "attachment; filename=tiktok.mp4");
    res.setHeader("Content-Type", "video/mp4");

    videoRes.data.pipe(res);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Terjadi kesalahan: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
