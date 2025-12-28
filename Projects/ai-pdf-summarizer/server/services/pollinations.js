const axios = require("axios");

async function summarizeWithPollinations(text) {
  try {
    const prompt = encodeURIComponent(
      "Ringkas poin penting:\n" + text.slice(0, 800)
    );

    const url = `https://text.pollinations.ai/${prompt}`;

    console.log("🌐 HIT POLLINATIONS");

    const res = await axios.get(url, {
      timeout: 60000,
      headers: {
        accept: "text/plain",
      },
    });

    return res.data;

  } catch (err) {
    console.error("❌ POLLINATIONS FAIL");
    if (err.response) {
      console.error(err.response.status);
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }
    throw err;
  }
}

module.exports = summarizeWithPollinations;
