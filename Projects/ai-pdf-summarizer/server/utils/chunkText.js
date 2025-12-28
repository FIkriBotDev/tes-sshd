/**
 * Memecah text panjang menjadi chunk kecil
 * AMAN untuk Pollinations + reverse proxy
 *
 * @param {string} text - text panjang
 * @param {number} maxLength - max karakter per chunk (default 700)
 * @returns {string[]} array of chunks
 */
function chunkText(text, maxLength = 700) {
  if (!text || typeof text !== "string") return [];

  // bersihkan text agar tidak boros karakter
  text = text
    .replace(/\s+/g, " ")     // hapus spasi berlebihan
    .replace(/\n+/g, " ")     // hapus newline berlebihan
    .trim();

  const chunks = [];
  let index = 0;

  while (index < text.length) {
    let end = index + maxLength;

    // kalau masih ada sisa, coba potong di titik terakhir
    if (end < text.length) {
      const lastDot = text.lastIndexOf(".", end);
      if (lastDot > index + 100) {
        end = lastDot + 1;
      }
    }

    const chunk = text.slice(index, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    index = end;
  }

  return chunks;
}

module.exports = chunkText;
