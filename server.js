// ==== SERVER SETUP ====
const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// JSON file to store results
const RESULTS_FILE = path.join(__dirname, "results.json");

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve HTML, CSS, JS files

// Ensure results file exists
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, "[]", "utf8");
}

// ==== ROUTES ====

// Get all results
app.get("/results", (req, res) => {
  fs.readFile(RESULTS_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Cannot read results" });
    const results = JSON.parse(data || "[]");
    res.json(results);
  });
});

// Save a new result
app.post("/results", (req, res) => {
  const newResult = req.body;

  // ✅ FIXED validation
  if (!newResult.name || !newResult.class || !newResult.subject) {
    return res.status(500).json({ error: "Incomplete result data" });
  }

  fs.readFile(RESULTS_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Cannot read results" });

    const results = JSON.parse(data || "[]");
    results.push(newResult);

    fs.writeFile(
      RESULTS_FILE,
      JSON.stringify(results, null, 2),
      (err) => {
        if (err) return res.status(500).json({ error: "Cannot save result" });
        res.json({ success: true, message: "Result saved!" });
      }
    );
  });
});

// Serve the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`CBT system running at http://localhost:${PORT}`);
});