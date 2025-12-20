const axios = require("axios");

async function summarizeWithPollinations(text, mode = "ringkas") {
  const prompt = `
Ringkas materi berikut menjadi poin-poin penting.
Gunakan bahasa Indonesia sederhana.
Gaya: ${mode}

Materi:
${text}
`;

  try {
    const res = await axios.post(
      "https://text.pollinations.ai/",
      { prompt, model: "openai" },
      {
        timeout: 120000,
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer XOYha3sjdByNrw_q",
        },
      }
    );

    return typeof res.data === "string"
      ? res.data.trim()
      : res.data.text || JSON.stringify(res.data);

  } catch (err) {
    console.error("❌ POLLINATIONS ERROR");
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
    throw new Error("Pollinations AI failed");
  }
}

module.exports = summarizeWithPollinations;
