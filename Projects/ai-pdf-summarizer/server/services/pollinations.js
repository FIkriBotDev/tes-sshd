const axios = require("axios");

/**
 * Kirim text ke RTIST API untuk diringkas
 * Menggunakan POST (AMAN proxy, tidak kena URL limit)
 *
 * @param {string} text
 * @returns {Promise<string>}
 */
async function summarizeWithRTIST(text) {
  try {
    console.log("🌐 POST ke RTIST API");
    console.log("📦 TEXT LENGTH:", text.length);

    const res = await axios.post(
      "https://rtist-api.exodusai.biz.id/post/rtist",
      {
        prompt: `
Ringkas materi berikut menjadi poin-poin penting.
Gunakan bahasa Indonesia sederhana.
Fokus pada inti materi.

Materi:
${text}
        `,
      },
      {
        timeout: 120000,
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
      }
    );

    // Logging response mentah untuk debug
    console.log("✅ RTIST RESPONSE TYPE:", typeof res.data);

    // Normalisasi response
    if (typeof res.data === "string") {
      return res.data.trim();
    }

    if (res.data.result) {
      return res.data.result.trim();
    }

    if (res.data.text) {
      return res.data.text.trim();
    }

    // fallback
    return JSON.stringify(res.data);

  } catch (err) {
    console.error("❌ RTIST API ERROR");

    if (err.response) {
      console.error("STATUS:", err.response.status);
      console.error("DATA:", err.response.data);
    } else {
      console.error("MESSAGE:", err.message);
    }

    throw new Error("RTIST summarization failed");
  }
}

module.exports = summarizeWithRTIST;
