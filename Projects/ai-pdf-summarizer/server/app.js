require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const summarizeRoute = require("./routes/summarize");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API route
app.use("/api", summarizeRoute);

// Serve static frontend (optional)
app.use(express.static(path.join(__dirname, "../frontend")));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "AI PDF Summarizer API running",
  });
});

// Default route
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/index.html")
  );
});

// Server
const PORT = process.env.PORT || 6666;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
