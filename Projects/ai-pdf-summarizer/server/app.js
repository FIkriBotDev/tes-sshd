require("dotenv").config();
const express = require("express");
const cors = require("cors");

const summarizeRoute = require("./routes/summarize");

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/api", summarizeRoute);

// health check
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "AI Summarizer API running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
