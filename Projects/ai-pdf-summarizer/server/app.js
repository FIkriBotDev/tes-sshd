require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const summarizeRoute = require("./routes/summarize");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", summarizeRoute);

// serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("🚀 Server running on http://localhost:" + PORT);
});
