const form = document.getElementById("uploadForm");
const loading = document.getElementById("loading");
const result = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  loading.classList.remove("hidden");
  result.classList.add("hidden");

  const formData = new FormData(form);

  const response = await fetch("/convert", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  loading.classList.add("hidden");

  if (data.success) {
    result.innerHTML = `
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
        ✅ Konversi berhasil! <br>
        <a href="${data.downloadUrl}" class="text-blue-600 underline font-semibold" download>
          Klik di sini untuk mendownload DOCX
        </a>
      </div>`;
  } else {
    result.innerHTML = `
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        ❌ Terjadi kesalahan: ${data.message}
      </div>`;
  }

  result.classList.remove("hidden");
});
