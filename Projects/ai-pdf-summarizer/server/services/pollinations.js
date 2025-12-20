const axios = require("axios");

/**
 * Generate ringkasan menggunakan Pollinations AI
 * @param {string} text - Text panjang hasil ekstraksi
 * @param {string} mode - gaya ringkasan (ringkas | detail)
 */
async function summarizeWithPollinations(text, mode = "ringkas") {
  if (!text || text.trim().length === 0) {
    throw new Error("Empty text provided to Pollinations");
  }

  const prompt = `
Ringkas materi berikut menjadi poin-poin penting yang mudah dipahami oleh mahasiswa.
Gunakan bahasa Indonesia yang jelas dan sederhana.
Pastikan seluruh isi materi tetap tercakup.

Gaya ringkasan: ${mode}

Materi:
${text}
  `;

  try {
    const response = await axios.post(
      "https://text.pollinations.ai/",
      {
        prompt: prompt,
        model: "openai"
      },
      {
        timeout: 120000, // 2 menit
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer XOYha3sjdByNrw_q", // API Token
        },
      }
    );

    // Biasanya Pollinations mengembalikan plain text
    if (typeof response.data === "string") {
      return response.data.trim();
    }

    // Fallback jika response berbentuk JSON
    if (response.data?.text) {
      return response.data.text.trim();
    }

    return JSON.stringify(response.data);
  } catch (error) {
    throw new Error(
      "Pollinations AI error: " +
        (error.response?.data || error.message)
    );
  }
}

module.exports = summarizeWithPollinations;
