const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const RESULTS_FILE = path.join(__dirname, "results.json");

app.use(express.json());
app.use(express.static(__dirname));

// Ensure file exists
if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, "[]");
}

// ================= GET =================
app.get("/results", (req, res) => {
    const data = JSON.parse(fs.readFileSync(RESULTS_FILE));
    res.json(data);
});

// ================= POST =================
app.post("/results", (req, res) => {
    const { student, class: classLevel, subject } = req.body;

    console.log("Incoming:", req.body); // debug

    if (!student || !classLevel || !subject) {
        return res.status(400).json({
            error: "Incomplete result data",
            received: req.body
        });
    }

    const results = JSON.parse(fs.readFileSync(RESULTS_FILE));
    results.push(req.body);

    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

    res.json({ success: true });
});

// ================= START =================
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});