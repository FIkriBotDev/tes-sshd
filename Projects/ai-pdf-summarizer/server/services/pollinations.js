const axios = require("axios");

async function summarizeWithPollinations(text) {
  try {
    const prompt = encodeURIComponent(`
Ringkas materi berikut menjadi poin-poin penting.
Gunakan bahasa Indonesia sederhana.

Materi:
${text}
    `);

    const url = `https://text.pollinations.ai/${prompt}`;

    console.log("🌐 POLLINATIONS URL:", url.slice(0, 120) + "...");

    const res = await axios.get(url, {
      timeout: 120000,
      headers: {
        accept: "text/plain",
        Authorization: "Bearer XOYha3sjdByNrw_q",
      },
    });

    return res.data;

  } catch (err) {
    console.error("❌ POLLINATIONS ERROR DETAIL");
    if (err.response) {
      console.error("STATUS:", err.response.status);
      console.error("DATA:", err.response.data);
    } else {
      console.error("MESSAGE:", err.message);
    }
    throw err;
  }
}

module.exports = summarizeWithPollinations;
