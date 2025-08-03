let uploadedImageURL = null;

async function sendMessage() {
  const input = document.getElementById("userInput");
  const messagesDiv = document.getElementById("messages");
  const userMessage = input.value.trim();

  if (!userMessage && !uploadedImageURL) return;

  // Tampilkan pesan user
  const userDiv = document.createElement("div");
  userDiv.className = "message user";
  userDiv.textContent = userMessage || "[Gambar]";
  messagesDiv.appendChild(userDiv);
  input.value = "";

  // Kirim permintaan ke API
  try {
    const payload = {
      apikey: "ExodusAI",
      prompt: userMessage,
      image: uploadedImageURL || "", // kirim URL jika tersedia
    };

    const response = await fetch("https://rtist-api.exoduscloud.my.id/post/rtist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const botDiv = document.createElement("div");
    botDiv.className = "message bot";
    botDiv.textContent = data.result || "Tidak ada respons.";
    messagesDiv.appendChild(botDiv);

    uploadedImageURL = null; // reset gambar setelah dikirim
  } catch (err) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "message bot";
    errorDiv.textContent = "Gagal memproses. Periksa koneksi atau API.";
    messagesDiv.appendChild(errorDiv);
  }
}

// Upload gambar
document.getElementById("fileInput").addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  // Gunakan upload server kamu (contoh pakai temp.exoduscloud.my.id)
  try {
    const uploadResponse = await fetch("https://temp.exoduscloud.my.id/upload", {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadResponse.json();
    if (uploadData.status && uploadData.url) {
      uploadedImageURL = uploadData.url;

      // Preview gambar
      const img = document.createElement("img");
      img.src = uploadedImageURL;
      img.className = "image-preview";
      document.getElementById("messages").appendChild(img);
    } else {
      alert("Gagal mengunggah gambar.");
    }
  } catch (error) {
    alert("Upload error: " + error.message);
  }
});
