const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;

// helper ambil bahasa dominan
function getTopLanguage(repos) {
  const langCount = {};

  repos.forEach(repo => {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1;
    }
  });

  return Object.keys(langCount).sort((a, b) => langCount[b] - langCount[a])[0] || "Unknown";
}

app.post("/roast", async (req, res) => {
  try {
    const { username } = req.body;

    // fetch user
    const userRes = await axios.get(`https://api.github.com/users/${username}`);
    const repoRes = await axios.get(`https://api.github.com/users/${username}/repos`);

    const user = userRes.data;
    const repos = repoRes.data;

    const topLang = getTopLanguage(repos);
    const randomSeed = Math.floor(Math.random() * 100000);
    const prompt = `
Roast profil GitHub ini dengan gaya bahasa santai, tidak formal, sedikit toxic tapi tetap lucu dan kreatif. Gunakan bahasa Indonesia gaul seperti anak tongkrongan. Tambahkan emoji secukupnya (jangan berlebihan).

Buat roast yang terasa personal berdasarkan data, bukan generik. Kalau datanya jelek, roasting lebih pedas. Kalau bagus, tetap roasting tapi dengan cara yang halus dan menyindir.

Random seed: ${randomSeed}

Data:
Username: ${username}
Bio: ${user.bio || "tidak ada bio"}
Public repos: ${user.public_repos}
Followers: ${user.followers}
Following: ${user.following}
Top language: ${topLang}

Langsung kasih hasil roasting dalam 1-3 paragraf pendek. Jangan pakai penjelasan tambahan.
`;

    // call pollinations
    const aiRes = await axios.post(
      "https://gen.pollinations.ai/v1/chat/completions",
      {
        model: "openai",
        messages: [
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Authorization": "Bearer sk_hxf1k3RwEydbK3xY94n6AuH9Dieqtqt8",
          "Content-Type": "application/json"
        }
      }
    );

    const result = aiRes.data.choices[0].message.content;

    res.json({ roast: result });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gagal roast 😢" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});