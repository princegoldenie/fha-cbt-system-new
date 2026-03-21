// ================= SERVER SETUP =================
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// File to store results
const RESULTS_FILE = path.join(__dirname, "results.json");

// ================= MIDDLEWARE =================
app.use(express.json()); // Modern JSON parser
app.use(express.static(__dirname)); // Serve frontend files

// Ensure results file exists
if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, "[]", "utf8");
}

// ================= ROUTES =================

// 🔹 Get all results
app.get("/results", (req, res) => {
    fs.readFile(RESULTS_FILE, "utf8", (err, data) => {
        if (err) {
            console.error("READ ERROR:", err);
            return res.status(500).json({ error: "Cannot read results" });
        }

        try {
            const results = JSON.parse(data || "[]");
            res.json(results);
        } catch (parseErr) {
            console.error("JSON PARSE ERROR:", parseErr);
            res.status(500).json({ error: "Corrupted results file" });
        }
    });
});

// 🔹 Save result
app.post("/results", (req, res) => {
    const newResult = req.body;

    console.log("📥 Incoming result:", newResult);

    // ✅ Accept BOTH name & student (this fixes your main issue permanently)
    const studentName = newResult.name || newResult.student;

    // ✅ Strong validation
    if (
        !studentName ||
        !newResult.class ||
        !newResult.subject ||
        typeof newResult.score === "undefined"
    ) {
        console.log("❌ Validation failed");
        return res.status(400).json({
            error: "Incomplete result data",
            received: newResult
        });
    }

    // Normalize data (force consistency)
    const cleanResult = {
        name: studentName,
        class: newResult.class,
        subject: newResult.subject,
        score: newResult.score,
        total: newResult.total || 0,
        date: newResult.date || new Date().toLocaleString(),
        answers: newResult.answers || [],
        questions: newResult.questions || []
    };

    // Read existing results
    fs.readFile(RESULTS_FILE, "utf8", (err, data) => {
        if (err) {
            console.error("READ ERROR:", err);
            return res.status(500).json({ error: "Cannot read results" });
        }

        let results = [];
        try {
            results = JSON.parse(data || "[]");
        } catch (parseErr) {
            console.error("JSON PARSE ERROR:", parseErr);
            results = [];
        }

        // Add new result
        results.push(cleanResult);

        // Save back to file
        fs.writeFile(
            RESULTS_FILE,
            JSON.stringify(results, null, 2),
            (err) => {
                if (err) {
                    console.error("WRITE ERROR:", err);
                    return res.status(500).json({ error: "Cannot save result" });
                }

                console.log("✅ Result saved successfully");
                res.json({
                    success: true,
                    message: "Result saved successfully"
                });
            }
        );
    });
});

// 🔹 Home route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 CBT system running on port ${PORT}`);
});