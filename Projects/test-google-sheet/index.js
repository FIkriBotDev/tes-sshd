const { google } = require("googleapis");

const SPREADSHEET_ID = "ISI_SPREADSHEET_ID_KAMU";
const RANGE = "Sheet1!A1:C100";

// Setup auth
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

// ======================
// 📖 READ DATA
// ======================
async function readData() {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  console.log("📖 Data:");
  console.log(res.data.values);
}

// ======================
// ➕ ADD DATA
// ======================
async function addData() {
  const sheets = await getSheets();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Fikri", "20", "Indonesia"]],
    },
  });

  console.log("✅ Data berhasil ditambahkan");
}

// ======================
// ✏️ UPDATE DATA
// ======================
async function updateData() {
  const sheets = await getSheets();

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Budi", "21", "Jakarta"]],
    },
  });

  console.log("✏️ Data berhasil diupdate");
}

// ======================
// 🚀 RUN
// ======================
async function main() {
  await readData();   // baca data
  await addData();    // tambah data
  await updateData(); // edit data
}

main();