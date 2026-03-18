const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");

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

    const repoList = repos.slice(0, 10).map(r => {
    return `- ${r.name} (${r.description || "no description"})`;
    }).join("\n");

    const inactiveRepos = repos.filter(r => {
    const last = new Date(r.pushed_at);
    return (Date.now() - last) > 1000 * 60 * 60 * 24 * 60; // 60 hari
    });

    const weirdNames = repos.filter(r => 
    /test|final|fix|new|backup|v[0-9]/i.test(r.name)
    ).map(r => r.name);

    async function getReadme(owner, repo) {
    try {
    const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        Accept: "application/vnd.github.v3+json"
      }
    });

    const content = Buffer.from(res.data.content, "base64").toString("utf-8");

    return content.slice(0, 500); // batasi biar gak kepanjangan
  } catch (err) {
    return null; // kalau gak ada README
  }
}

    const prompt = `
Roast profil GitHub ini dengan gaya bahasa santai, tidak formal, sedikit toxic tapi tetap lucu dan kreatif. Gunakan bahasa Indonesia gaul seperti anak tongkrongan. Tambahkan emoji secukupnya (jangan berlebihan). Gunakan bahasa Lu/Gue jangan pakai Aku/Kamu tapi Lu/Loe/Gue/Gw

Buat roast yang terasa personal berdasarkan data, bukan generik. Kalau datanya jelek, roasting lebih pedas. Kalau bagus, tetap roasting tapi dengan cara yang halus dan menyindir. Roast nama repo secara spesifik (sebutin nama repo di roast), kalau ada repo mencurigakan kayak "backup", "test", "final", sindir keras. kalau ada repo deskripsinya kosong, hina dengan kreatif.
Roast user ini berdasarkan DATA NYATA, terutama:
- Nama repo (kalau aneh, cringe, generik, atau mencurigakan)
- Deskripsi repo (kalau kosong, jelek, atau gak jelas)
- Pola repo (misal banyak repo test, backup, final, dll)
- Konsistensi (banyak repo tapi gak keurus)
- Statistik (followers, repo, dll)

Random seed: ${randomSeed}

Data:
Username: ${username}
Bio: ${user.bio || "tidak ada bio"}
Public repos: ${user.public_repos}
Followers: ${user.followers}
Following: ${user.following}
Top language: ${topLang}

DATA REPO:
${repoList}

Inactive repos: ${inactiveRepos.map(r => r.name).join(", ")}

Weird repo names: ${weirdNames.join(", ")}

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
    // format log
    const log = `
========================================
Username: ${username}
Hasil: ${result}
========================================
`;

    // simpan ke file
    fs.appendFile("roast_log.txt", log, (err) => {
     if (err) console.error("Gagal simpan log:", err);
    });

    res.json({ roast: result });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gagal roast 😢" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});