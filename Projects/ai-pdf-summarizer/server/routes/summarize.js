const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const summarizeController = require("../controllers/summarizeController");

router.post("/summarize", upload.single("file"), summarizeController);

module.exports = router;
