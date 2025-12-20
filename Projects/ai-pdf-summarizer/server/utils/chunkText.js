/**
 * Memecah text panjang menjadi beberapa chunk
 * @param {string} text - text panjang
 * @param {number} maxLength - max karakter per chunk
 * @returns {string[]} array of chunks
 */
function chunkText(text, maxLength = 3000) {
  if (!text || typeof text !== "string") return [];

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxLength;

    // Usahakan potong di akhir kalimat
    if (endIndex < text.length) {
      const lastDot = text.lastIndexOf(".", endIndex);
      if (lastDot > startIndex) {
        endIndex = lastDot + 1;
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    startIndex = endIndex;
  }

  return chunks;
}

module.exports = chunkText;
